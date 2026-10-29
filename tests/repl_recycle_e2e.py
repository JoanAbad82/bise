#!/usr/bin/env python3
"""repl-cpu-3: the hub recycles an aged REPL at idle, and nobody sees it.

The Bend runtime's allocator ages a long-lived REPL (each model call costs
more CPU than the last, rust/switchboard/src/recycle.rs): the hub counts
the context each REPL read from its usage lines and, past
BISE_RECYCLE_TOKENS, restarts it at its next idle through the switch path
(reload, same binary, port and session). A real hub, real REPLs, the
scripted provider (e2e.Env, 10 input tokens a call); budget 150 tokens.
On a task (rc), since main's own recycle waits while he talks to it
(hub-tick, step 6):
  1. rc runs one turn of 25 model calls (a background job, then 23
     echoes): the hub recycles its REPL exactly once, at idle; repl.pid
     and repl.json name the new process, same port; RSS is lower;
  2. a message sent right at the turn's end (during the recycle) is
     answered exactly once;
  3. the background job started before the recycle is still readable by
     the new process; its end wakes main once, after the recycle (the job
     ends when the test creates its go file, once the message of 2. is
     answered: a fixed 20 s ended before the 25 calls under load, its
     wake came first and the message of 2. came in as steering);
  4. the transcript has every step once, no reload line, no history
     replayed; the session log has no reload event;
  5. no second recycle while the new process reads less than the budget;
  6. main past the budget is not recycled at its idle: his line to it is
     less than 10 min old (recycle::main_holds).
"""
import json
import re
import os
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import e2e  # noqa: E402
from e2e import Env, check  # noqa: E402
import wait  # noqa: E402


def sb(E, agent, *args):
    env = {**E.env, "SB_SOCKET": os.path.join(E.state, "agent.sock"), "SB_AGENT": agent}
    r = subprocess.run([e2e.EXE, "sb", *args], env=env, cwd=E.ws, capture_output=True, text=True, timeout=60)
    assert r.returncode == 0, "sb %s: %s %s" % (" ".join(args), r.stdout, r.stderr)


def rss_kb(pid):
    out = subprocess.run(["ps", "-o", "rss=", "-p", str(pid)], capture_output=True, text=True).stdout.strip()
    return int(out) if out else 0


def main():
    E = Env()
    # the hub sees load x1: at x2+ a due recycle waits for the machine
    # (recycle::load_holds, 8b2561d1d, its own unit test), and the tip
    # gate's pool runs at x2-2.5, so the recycle never came
    load = os.path.join(E.tmp, "load-factor")
    open(load, "w").write("1")
    E.env.update(BISE_RECYCLE_TOKENS="150", BEND_BG_AFTER="2", SB_LOAD_FACTOR=load)
    ok = False
    try:
        c = E.start_hub()
        c.wait_status("main", "idle", 60)
        sb(E, "main", "spawn", "rc", "--objective", "a task whose REPL is recycled")
        c.wait_idle("rc")
        adir = os.path.join(E.state, "agents", "rc")
        hub_log = os.path.join(E.state, "hub.log")

        def pid():
            try:
                return int(open(os.path.join(adir, "repl.pid")).read().strip())
            except (OSError, ValueError):
                return 0

        def recycles(who="rc"):
            try:
                return [l for l in open(hub_log) if "recycling the REPL of %s" % who in l]
            except FileNotFoundError:
                return []

        pid0 = pid()
        port0 = json.load(open(os.path.join(adir, "repl.json")))["port"]
        # 1. 25 calls: a job past the 2 s window (its slot: tmp/bg/0), 23 echoes
        go = os.path.join(E.tmp, "bg-go")
        steps = ["while [ ! -e %s ]; do sleep 0.2; done; echo bg-job-done" % go] + ["echo step-%02d" % i for i in range(23)]
        c.say(" ".join("[[bash: %s]]" % s for s in steps), focus="rc")
        # the old process's RSS, read while its turn runs (its peak): read
        # after the turn's last line it was 0 under load, the hub already
        # recycling the process at the turn's end (the next idle)
        peak = [0]

        def done_sampling():
            peak[0] = max(peak[0], rss_kb(pid0))
            return any("done: tool bash ok: step-22" in l for l in c.lines("rc"))
        c.wait(done_sampling, 120, "'done: tool bash ok: step-22' in rc")
        rss0 = peak[0]
        # 2. a message at once: it lands while the hub recycles the REPL
        c.say("after the recycle", focus="rc")
        c.wait(lambda: recycles(), 30, "the hub recycles rc's REPL")
        c.wait(lambda: pid() not in (0, pid0), 30, "rc's new REPL process")
        c.wait_line("rc", "ack: after the recycle", 60)
        c.wait_idle("rc")
        pid1 = pid()

        # the new process's repl.json: spawn_fresh removes the old one and
        # the new REPL writes it once it serves, so wait for it (it was read
        # at once and raced the write under load: a known red on main too)
        def repl_info():
            try:
                return json.load(open(os.path.join(adir, "repl.json")))
            except (FileNotFoundError, ValueError):
                return None
        c.wait(lambda: (repl_info() or {}).get("pid") == pid1, 30, "repl.json names rc's new REPL")
        info = repl_info()
        check(info["pid"] == pid1 and info["port"] == port0,
              "repl.json names the new process on the same port: %r (old pid %d port %d)" % (info, pid0, port0))
        check(subprocess.run(["kill", "-0", str(pid0)], capture_output=True).returncode != 0, "the old process is gone")
        check(len(recycles()) == 1, "one recycle: %r" % recycles())
        rss1 = rss_kb(pid1)
        check(0 < rss1 < rss0, "RSS down after the recycle: %d KB -> %d KB" % (rss0, rss1))
        acks = [l for l in c.lines("rc") if "ack: after the recycle" in l]
        check(len(acks) == 1, "the message sent during the recycle is answered once: %r" % acks)
        asked = [r for r in E.fake_requests() if r.get("user") == "after the recycle"]
        check(len(asked) == 1, "one model call for it: %d" % len(asked))
        # 3. the job of the old process, read by the new one: it ends now
        open(go, "w").close()
        slot = os.path.join(adir, "tmp", "bg", "0.out")
        c.wait(lambda: os.path.exists(slot) and "bg-job-done" in open(slot).read(), 30, "the job's output in its slot")
        # its end wakes rc (one turn); wait for that turn's model call before
        # the next message (not an 'ack: <agent_message' line: rc's brief
        # from main was one already). rc's own calls only: the hub's role
        # line call after rc's turn ('(role line)', role.rs) quotes rc's
        # last report, the ack of that wake, and is no wake
        def woke():
            return [r for r in E.fake_requests()
                    if r.get("agent") == "rc" and "background 0 ended" in (r.get("user") or "")]
        c.wait(woke, 60, "the job's end in a model call of rc")
        c.wait_idle("rc")
        woken = woke()
        check(len(woken) == 1, "the job's end woke rc once: %d" % len(woken))
        # the role line call that quotes the wake's ack came (after rc's
        # turn, on a thread): the filter above told the two apart
        c.wait(lambda: [r for r in E.fake_requests() if r.get("agent") == "(role line)"
                        and "background 0 ended" in (r.get("user") or "")], 60,
               "the role line call quoting rc's ack of the wake")
        c.say("[[bash: cat $TMPDIR/bg/0.out]]", focus="rc")
        c.wait_line("rc", "done: tool bash ok: bg-job-done", 60)
        c.wait_idle("rc")
        # 4. the transcript: each step once, no reload, no replayed history
        tr = open(os.path.join(adir, "transcript.log")).read()
        for i in range(23):
            n = len(re.findall(r"tool_result #\d+ ok : step-%02d " % i, tr))
            check(n == 1, "step-%02d's result once in the transcript: %d" % (i, n))
        check("reload" not in tr, "no reload line in the transcript")
        check(tr.count("after the recycle") == 2, "the message and its answer once each: %d" % tr.count("after the recycle"))
        # 5. the new process read 2 calls' worth: no second recycle
        check(len(recycles()) == 1 and pid() == pid1, "no second recycle: %r" % recycles())
        # 6. main past the budget, his line just said: due at its idle, held
        c.say(" ".join("[[bash: echo m-%02d]]" % i for i in range(17)))
        c.wait_line("main", "done: tool bash ok: m-16", 120)
        c.wait_idle("main")
        due = lambda: [l for l in open(hub_log) if "the REPL of main read" in l]  # noqa: E731
        c.wait(due, 30, "main due for its recycle")
        # six ticks: switch_idle_repls would have asked by now
        wait.holds(lambda: recycles("main") == [], 3, "main is not recycled while he talks to it")
        ok = True
        print("repl recycle: ok (rss %d -> %d KB)" % (rss0, rss1))
    finally:
        if not ok:
            os.environ["SB_KEEP"] = "1"
        E.close()
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
