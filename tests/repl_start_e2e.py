#!/usr/bin/env python3
"""REPL starts after a switch (crate::repl_start): a few at a time, judged on
progress, a slow start is not a death.

A switch to 7fc455f7 reloaded 22 REPLs in one tick at load 16; their starts
took 22-38 s and a flat 20 s limit failed the switch. A real hub, 8 agents
(main + 7 tasks), the scripted provider, `SB_SLOW_SPAWN` (a file: the ms
each start waits before its spawn, with no progress):
  1. a reload (`/restart` outside bise's tree) with 8 s per start: at most 4
     REPLs switch at once (hub.log's switching/switched lines), every one
     switches, the probation passes (no rollback);
  2. a reload whose REPLs never start (a delay far past the 45 s without
     progress): the stalls report to probation and the switch rolls back.
"""
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from e2e import Client, Env, check  # noqa: E402

TASKS = ["t%d" % i for i in range(1, 8)]


def log_lines(E):
    try:
        return open(os.path.join(E.state, "hub.log")).read().splitlines()
    except FileNotFoundError:
        return []


def switch_ev(E, timeout=20):
    """The hub's typed `switch` event (architect m_20576), as a window
    gets it at hello: `{"op":"hello"}`, then `{"cmd":"hello","proto":1}`
    on the same connection, read until the `switch` line."""
    import json
    import socket
    import time
    s = socket.socket(socket.AF_UNIX)
    s.settimeout(timeout)
    s.connect(os.path.join(E.state, "hub.sock"))
    try:
        s.sendall(b'{"op":"hello"}\n{"cmd":"hello","proto":1}\n')
        end = time.time() + timeout
        for line in s.makefile("r"):
            try:
                v = json.loads(line)
            except ValueError:
                continue
            if v.get("ev") == "switch":
                return v
            if time.time() > end:
                break
    finally:
        s.close()
    return None


def most_at_once(lines):
    """The most REPLs between 'switching the REPL of X' and its
    'switched the REPL of X' (or its failed start) at one time, per hub:
    a hub that stops ends its switches in flight (the next one starts
    those REPLs again)."""
    open_, most = set(), 0
    for l in lines:
        if re.search(r" hub start pid=", l):
            open_ = set()
        m = re.search(r"switching the REPL of (\S+) to", l)
        if m:
            open_.add(m.group(1))
            most = max(most, len(open_))
        m = re.search(r"switched the REPL of (\S+)$", l) or re.search(r"repl (\S+) not started", l)
        if m:
            open_.discard(m.group(1))
    return most


def repl_pids(E):
    """Each agent's REPL pid (its repl.pid), alive ones only."""
    got = {}
    for name in ["main"] + TASKS:
        try:
            pid = int(open(os.path.join(E.state, "agents", name, "repl.pid")).read().strip())
            os.kill(pid, 0)
        except (OSError, ValueError):
            continue
        got[name] = pid
    return got


def hub_pid(E):
    try:
        return open(os.path.join(E.state, "hub.pid")).read().strip()
    except FileNotFoundError:
        return ""


def follow(E, c, old_pid):
    """The client of the hub that replaced `old_pid`, at once: a UI stays
    on it, as the TUI does (no UI for 120 s: the hub idle-exits)."""
    sock = os.path.join(E.state, "hub.sock")
    box = []

    def up():
        if hub_pid(E) in ("", old_pid):
            return False
        try:
            box.append(Client(sock))
            return True
        except OSError:
            return False
    c.wait(up, 120, "the new hub's socket")
    return box[-1]


def main():
    E = Env()
    slow = os.path.join(E.tmp, "slow-spawn-ms")
    open(slow, "w").write("0")
    E.env["SB_SLOW_SPAWN"] = slow
    try:
        c = E.start_hub()
        c.wait_status("main", "idle", 60)
        # one spawn per message: a task's reply cuts main's turn, and the
        # scripted provider drops the rest of a cut turn's calls
        # (a reply landing at the same moment still cuts it: asked again)
        for t in TASKS:
            for _ in range(4):
                c.wait_idle("main", timeout=120)
                c.say('[[bash: sb spawn %s --objective "{{bash: echo %s-ok}}"]]' % (t, t))
                try:
                    c.wait(lambda t=t: c.agent(t) is not None, 30, "%s exists" % t)
                    break
                except AssertionError:
                    continue
            check(c.agent(t) is not None, "%s spawned" % t)
        c.wait_idle("main", *TASKS, timeout=180)
        n0 = len(log_lines(E))
        before = repl_pids(E)
        check(set(before) == set(TASKS) | {"main"}, "every REPL runs before the reload: %s" % before)

        # 1. a slow but healthy reload
        open(slow, "w").write("8000")
        pid0 = hub_pid(E)
        c.restart()
        c = follow(E, c, pid0)
        c.wait(lambda: any(re.search(r"switch: \S+ (good|failed)", l) for l in log_lines(E)[n0:]), 300,
               "the reload's probation ends")

        def switched():
            """The agents whose REPL is a new process, alive: switched by
            the new hub ('switched the REPL of X'), or, when the old hub
            had begun to switch it right before it stopped (a key change
            in the reload's last 0.3 s, kept hub of a red run), started
            again by the new one (no switch line for a REPL it found
            gone)."""
            now = repl_pids(E)
            return {n for n, p in now.items() if before.get(n) != p}
        # every REPL switches, waited for: the probation is a fixed 120 s,
        # and 4 at a time at 8 s a start the last batch can end after it
        # under load (switched only main + 4 at its end, loop-speed-4)
        c.wait(lambda: switched() >= set(TASKS) | {"main"}, 300, lambda: "every REPL switched: %s" % sorted(switched()))
        after = log_lines(E)[n0:]
        check(not any(" failed" in l and "switch:" in l for l in after), "no rollback: %s" % [l for l in after if "switch:" in l])
        most = most_at_once(after)
        check(0 < most <= 4, "at most 4 starts at once: %d" % most)
        # the reload's row (architect m_20576): the new hub says it passed
        sw = (switch_ev(E) or {}).get("switch") or {}
        check(sw.get("phase") == "passed" and sw.get("to") and sw.get("at_ms"), "the switch row says passed: %r" % sw)
        # a switch that went well leaves no line in main's thread (designer
        # m_23091): its start and its probation are the row's and hub.log's
        said = [r.get("text", "") for k in ("info", "warn") for r in c.feed("main", k)]
        switcher = [t for t in said if re.search(r"reloading bise|restarting the hub|switching to version|state backed up|probation passed", t)]
        check(not switcher, "no switcher line in main's thread after a good reload: %r" % switcher)
        check(any("state backed up" in l for l in log_lines(E)[n0:]), "the backup dir in hub.log")

        # 2. a version whose REPLs never start rolls back
        c.wait_idle("main", *TASKS, timeout=120)
        n1 = len(log_lines(E))
        open(slow, "w").write("100000000")
        pid1 = hub_pid(E)
        c.restart()
        c = follow(E, c, pid1)
        c.wait(lambda: any(re.search(r"switch: \S+ failed: .*no progress", l) for l in log_lines(E)[n1:]), 240,
               "the stalled reload rolls back")
        # the rollback hub's REPLs start again
        open(slow, "w").write("0")
        after = log_lines(E)[n1:]
        check(any("rollback to" in l for l in after), "a rollback: %s" % [l for l in after if "switch:" in l])
        # the rolled-back hub says why, at hello (a window reconnecting)
        seen = []

        def rolled_back():
            sw = (switch_ev(E) or {}).get("switch") or {}
            seen.append(sw)
            return sw.get("phase") == "rolled_back"
        c.wait(rolled_back, 120, lambda: "the switch row says rolled_back: %r" % seen[-1:])
        check("no progress" in (seen[-1].get("reason") or ""), "the rollback's reason on the row: %r" % seen[-1])
        # a rollback still writes its ▲ line in main's thread
        c.wait(lambda: any("rollback to version" in r.get("text", "") for r in c.feed("main", "warn")), 60,
               "the rollback's warn line in main's thread")
        print("repl starts: ok (%d at once at most; a never-starting version rolled back)" % most)
    except BaseException:
        # a red run keeps its hub (hub.log says which REPL never switched)
        os.environ["SB_KEEP"] = "1"
        raise
    finally:
        E.close()


if __name__ == "__main__":
    main()
