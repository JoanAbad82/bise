"""A plugin installed while bise runs reaches the agents without a TUI
restart (the user: "pour éviter de perdre les states transient comme les
recording audio"): the hub sees the plugins change and relaunches each
REPL at its next idle, same session; the TUI is never touched.
Through the real hub, REPLs and fake provider.

python3 -u tests/plugins_reload_e2e.py
"""
import os
import shutil
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e  # noqa: E402
import wait  # noqa: E402

FAILS = []


def check(cond, what):
    print(("ok   " if cond else "FAIL ") + what, flush=True)
    if not cond:
        FAILS.append(what)


def bridges(E):
    """This hub's plugin bridges (`bise plugins serve --dir <its run dir>`)
    and the servers they started (their children: `bise computer-use
    mcp`, the fixture's): pids."""
    import subprocess
    out = subprocess.run(["ps", "-axww", "-o", "pid=,ppid=,command="], capture_output=True, text=True).stdout
    rows = []
    for l in out.splitlines():
        p = l.split(None, 2)
        if len(p) == 3 and p[0].isdigit() and p[1].isdigit():
            rows.append((int(p[0]), int(p[1]), p[2]))
    run = os.path.join(E.tmp, "run") + "/"
    bs = {pid for pid, _, cmd in rows if " plugins serve " in cmd and ("--dir " + run) in cmd}
    kids = {pid for pid, ppid, _ in rows if ppid in bs}
    return bs, kids


def one_bridge(E, what):
    """One bridge for main's one REPL, whatever relaunched before (the old
    one goes within its parent check, 500 ms), its servers its children."""
    got = {}

    def ok():
        bs, kids = bridges(E)
        got["now"] = (sorted(bs), sorted(kids))
        return len(bs) == 1
    wait.until(ok, 10, "one bridge (%s)" % what)
    check(len(got["now"][0]) == 1, "one plugin bridge %s: %r" % (what, got["now"]))
    return got["now"]


def repl_pid(E):
    try:
        return open(os.path.join(E.state, "agents", "main", "repl.pid")).read().strip()
    except OSError:
        return None


def main():
    E = e2e.Env()
    user = os.path.join(E.tmp, "user-plugins")
    os.makedirs(user)
    E.env["BEND_PLUGINS_HOME"] = user
    E.env["BEND_PLUGINS_DATA"] = os.path.join(E.tmp, "plugin-data")
    E.env["BEND_PLUGINS_STATE"] = os.path.join(E.tmp, "plugins.json")
    try:
        c = E.start_hub()
        c.wait_idle("main")
        c.say("hello before")
        c.wait_line("main", "ack: hello before")
        c.wait_idle("main")
        before = repl_pid(E)
        check(before is not None, "main's REPL runs")
        # install a plugin while the hub runs
        shutil.copytree(os.path.join(e2e.ROOT, "rust/plugins/tests/fixtures/hello-plugin"),
                        os.path.join(user, "hello-plugin"))
        log = os.path.join(E.state, "hub.log")
        c.wait(lambda: "plugins or skills changed: the REPL of main relaunches" in open(log).read(), 30,
               "the hub sees the new plugin")
        c.wait(lambda: repl_pid(E) not in (None, before), 60, "main's REPL relaunched")
        c.wait_idle("main")
        check(True, "relaunched at idle: %s -> %s" % (before, repl_pid(E)))
        # the old REPL's bridge went with it: one, the new REPL's
        one_bridge(E, "after a relaunch")
        # same session: the conversation goes on
        c.say("hello after")
        c.wait_line("main", "ack: hello after")
        reqs = E.fake_requests()
        last = json.dumps(reqs[-1]) if reqs else ""
        check("hello before" in last, "the next request still holds the conversation")
        # the prompt says what each plugin is for (the built-in computer
        # plugin: browser and Mac apps), the new one included
        first = json.dumps(reqs[0]) if reqs else ""
        # computer use is opt-in: nothing of it before /computer-use
        check("## Plugins" not in first and "computer:computer-use" not in first,
              "computer use is off by default: not in the first prompt")
        check("- `hello-plugin`: Test fixture" in last and "- `hello-plugin`" not in first,
              "the relaunched prompt names the new plugin")
        # the new REPL loaded the plugin: its skill is in the run's index
        runs = [os.path.join(dp, f) for dp, _, fs in os.walk(E.tmp) for f in fs if f == "report.txt"]
        loaded = any("hello-plugin" in open(p).read() for p in runs)
        if not loaded:
            # the bridge writes under BEND_RUN_DIR (~/.bise/run/<port>/plugins)
            run = os.path.join(os.path.expanduser("~"), ".bise", "run")
            for dp, _, fs in os.walk(run):
                for f in fs:
                    if f == "report.txt" and os.path.getmtime(os.path.join(dp, f)) > time.time() - 120:
                        loaded = loaded or "hello-plugin" in open(os.path.join(dp, f)).read()
        check(loaded, "the relaunched REPL loaded hello-plugin")
        # nothing changes: no second relaunch
        pid = repl_pid(E)
        wait.holds(lambda: repl_pid(E) == pid, 5, "no relaunch while nothing changes (REPL %s)" % pid)
        # disabling it relaunches again
        # (and /computer-use turning computer use on, in the same write)
        open(E.env["BEND_PLUGINS_STATE"], "w").write('{"disabled": ["hello-plugin"], "enabled": ["computer"]}')
        c.wait(lambda: repl_pid(E) not in (None, pid), 60, "relaunched after a disable")
        check(True, "a disable relaunches too")
        c.wait_idle("main")
        c.say("hello on")
        c.wait_line("main", "ack: hello on")
        on = json.dumps(E.fake_requests()[-1])
        check("- `computer`: computer use" in on and "Mac apps" in on and "computer:computer-use" in on,
              "computer use on: the prompt names it, its Mac apps and its skill")
        check("- `hello-plugin`" not in on, "the disabled plugin left the prompt")
        # ambient-lead m_21727 (2): the servers are one bridge per REPL and
        # its servers, its children; a relaunch leaves no second set, and a
        # hub stop for good takes every one of them with its REPL
        _, kids = one_bridge(E, "after the second relaunch")
        check(len(kids) == 1, "one server (computer-use mcp) under it: %r" % kids)
        E.stop_hub()
        gone = {}

        def none_left():
            gone["now"] = bridges(E)
            return gone["now"] == (set(), set())
        wait.until(none_left, 15, "no bridge or server after the hub stop")
        check(gone["now"] == (set(), set()), "a hub stop leaves no bridge or server: %r" % (gone["now"],))
    finally:
        if FAILS:
            os.environ["SB_KEEP"] = "1"
        E.close()
    print("PASS plugins reload" if not FAILS else "FAIL plugins reload: %s" % FAILS, flush=True)
    sys.exit(1 if FAILS else 0)


if __name__ == "__main__":
    import json  # noqa: E402
    main()
