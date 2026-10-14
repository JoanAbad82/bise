#!/usr/bin/env python3
"""docs/issues/17: an agent speaks only as itself on its hub.

A real hub, real REPLs, the scripted provider (e2e.Env), a temp HOME and
BISE_HOME, the checker and the sandbox off (the peer check is what is
tested here).

  1. agent a1's bash runs `SB_AGENT=main sb send a2 …`: refused with words
     that name main and a1, a2 gets nothing, hub.log names both; a1's own
     `sb send main …` works;
  2. a1 starts a throwaway hub (a script it leaves running): this test's
     own `SB_AGENT=main sb list` from a1's script is served there (a1 is
     that hub's owner, so its processes are the user's to it); that hub's
     agent b1 is refused as main and served as itself;
  3. a1's bash runs `SB_AGENT=main sb restart`: refused, the hub stays up.
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from e2e import Env, check  # noqa: E402

# a1 runs this in the background: a throwaway hub of its own, with an agent
THROWAWAY = r'''
import json, os, subprocess, sys, traceback
here, tmp, out = sys.argv[1:4]
sys.path.insert(0, here)
import e2e, wait
res = {}
hub = None
try:
    ws, st = os.path.join(tmp, "ws2"), os.path.join(tmp, "st2")
    os.makedirs(ws)
    e2e.sh(ws, "git init -q && git config user.email t@t && git config user.name t && git config commit.gpgsign false && echo b > R && git add R && git commit -qm i")
    env = dict(os.environ, SB_STATE_DIR=st)
    for k in ("SB_SOCKET", "SB_AGENT", "SB_TASK"):
        env.pop(k, None)
    err = open(os.path.join(tmp, "hub2.stderr"), "a")
    hub = subprocess.Popen([e2e.EXE, "sbd", "--workspace", ws], env=env, stdin=subprocess.DEVNULL, stdout=err, stderr=err)
    sock = os.path.join(st, "hub.sock")
    wait.until(lambda: os.path.exists(sock), 30, "the throwaway hub's socket", poll=0.05)
    c = e2e.Client(sock, name="a1-throwaway")
    asock = os.path.join(st, "agent.sock")
    r = subprocess.run(["sb", "list"], env=dict(env, SB_SOCKET=asock, SB_AGENT="main"), capture_output=True, text=True, timeout=30)
    res["owner_as_main"] = [r.returncode, r.stdout + r.stderr]
    o_main, o_own = os.path.join(tmp, "b1-main.txt"), os.path.join(tmp, "b1-own.txt")
    c.say("/new b1: {{bash: SB_AGENT=main sb list > %s 2>&1; echo rc=$? >> %s; sb list > %s 2>&1; echo rc=$? >> %s}}" % (o_main, o_main, o_own, o_own))
    wait.until(lambda: os.path.exists(o_own) and "rc=" in open(o_own).read(), 120, "b1's own sb answered")
    res["b1_as_main"] = open(o_main).read() if os.path.exists(o_main) else ""
    res["b1_own"] = open(o_own).read() if os.path.exists(o_own) else ""
    res["hub2_log"] = open(os.path.join(st, "hub.log")).read()[-3000:] if os.path.exists(os.path.join(st, "hub.log")) else ""
    e2e.stop_hub(sock)
    hub.wait(timeout=20)
    hub = None
except Exception:
    res["error"] = traceback.format_exc()
finally:
    if hub:
        hub.kill()
open(out + ".tmp", "w").write(json.dumps(res))
os.rename(out + ".tmp", out)
'''


def read(p):
    return open(p).read() if os.path.exists(p) else ""


def main():
    E = Env()
    home = os.path.join(E.tmp, "home")
    bise = os.path.join(E.tmp, "bise")
    os.makedirs(home)
    os.makedirs(bise)
    with open(os.path.join(bise, "config.toml"), "w") as f:
        f.write('[roles]\nclassify = "off"\n')
    E.env.update(HOME=home, BISE_HOME=bise, XDG_STATE_HOME=os.path.join(home, "state"))
    E.env["BISE_SANDBOX"] = "0"
    t = E.tmp
    script = os.path.join(t, "throwaway.py")
    open(script, "w").write(THROWAWAY)
    as_main, own, thr, restart = (os.path.join(t, n) for n in ("as-main.txt", "own.txt", "throwaway.json", "restart.txt"))
    log = os.path.join(E.state, "hub.log")
    ok = False
    try:
        c = E.start_hub()
        c.wait_status("main", "idle", 60)
        c.say("/new a2: {{bash: echo a2 up}}")
        c.wait(lambda: c.agent("a2") is not None, 60, "a2")
        c.wait_idle("a2")

        # 1. a1 as main, then as itself; 2. its throwaway hub
        c.say(
            "/new a1: {{bash: SB_AGENT=main sb send a2 'as main, from a1' > %s 2>&1; echo rc=$? >> %s}} "
            "{{bash: sb send main 'a1 as itself' > %s 2>&1; echo rc=$? >> %s}} "
            "{{bash: nohup python3 %s %s %s %s </dev/null >/dev/null 2>&1 & echo started}}"
            % (as_main, as_main, own, own, script, HERE, t, thr)
        )
        c.wait(lambda: "rc=" in read(own), 120, "a1's own sb send answered: %r" % read(own))
        out = read(as_main)
        check("rc=0" not in out and "main" in out and "a1" in out and "itself" in out,
              "a1's `SB_AGENT=main sb send` is refused, naming main and a1: %r" % out)
        check("rc=0" in read(own), "a1's own sb send works: %r" % read(own))
        check(not any("as main, from a1" in l for l in c.lines("a2")), "a2 got nothing from 'main'")
        check("agent request refused" in read(log) and "a1" in read(log), "hub.log names a1: %r" % read(log)[-2000:])

        c.wait(lambda: os.path.exists(thr), 180, "a1's throwaway hub ran")
        res = json.loads(read(thr))
        check("error" not in res, "the throwaway hub ran: %s" % res.get("error"))
        check(res["owner_as_main"][0] == 0, "a1's script speaks as main on its own throwaway hub: %r" % res["owner_as_main"])
        check("rc=0" not in res["b1_as_main"] and "b1" in res["b1_as_main"],
              "the throwaway hub's b1 is refused as main: %r" % res["b1_as_main"])
        check("rc=0" in res["b1_own"], "b1's own sb works: %r (hub2.log %s)" % (res["b1_own"], res.get("hub2_log")))

        # 3. a1 restarts the hub as main
        c.wait_idle("a1")
        c.say("{{bash: SB_AGENT=main sb restart > %s 2>&1; echo rc=$? >> %s}}" % (restart, restart), focus="a1")
        c.wait(lambda: "rc=" in read(restart), 120, "a1's sb restart answered: %r" % read(restart))
        out = read(restart)
        check("rc=0" not in out and "main" in out and "a1" in out, "a1's `SB_AGENT=main sb restart` is refused: %r" % out)
        check(E.hub.poll() is None, "the hub is still up")
        c.wait_idle("a1")
        ok = True
        print("ok: an agent speaks only as itself (send, restart); its own sb and a throwaway hub it starts work")
    finally:
        if not ok:
            print("hub.log tail:\n" + read(log)[-3000:])
        E.close()


if __name__ == "__main__":
    main()
