#!/usr/bin/env python3
"""The project's pause and its cost on a real hub (cost-pause): sb-core's
hub/pause.bend and the typed `project/pause`, `project/resume`,
`hub/paused`, `usage/read` (docs/client-protocol.md, bise_proto::rpc).

A) /pause while main runs a 30 s bash: its turn stops (the 'stopped'
   line), `hub/paused` says paused, the notice says 1 turn stopped;
B) a message sent while paused is held: no turn starts, `held` counts it;
   a second /pause only says so;
C) a restart keeps the pause (the journal's `paused` line): after it,
   initialize's state still says paused and the message still waits;
D) /resume delivers the held message: main's turn runs and answers;
E) usage/read: main's calls of the fake model, per agent and per model,
   today and this week (first answer may say `counting`, then not).

Run: python3 -u tests/pause_e2e.py (after scripts/bins.sh and cargo build)
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import obs_lines  # noqa: E402
import e2e  # noqa: E402
import wait  # noqa: E402
from e2e import EXE, check  # noqa: E402

FAILS = []


def ok(cond, what):
    print("%s %s" % ("ok  " if cond else "FAIL", what), flush=True)
    if not cond:
        FAILS.append(what)


def paused(c):
    return (c.hub.get("hub/paused") or {}).get("paused") is True


def turns(c, agent):
    a = c.agent(agent) or {}
    return a.get("turns", 0)


def main():
    if not os.path.exists(EXE):
        sys.exit("build first: cd rust && cargo build")
    E = e2e.Env()
    try:
        c = E.start_hub()
        p = c.project()
        c.wait_idle("main")
        # a first call, so usage has something to count
        c.say("hello there")
        c.wait(lambda: any(obs_lines.kind(l) == "usage" for l in c.lines("main")), 90, "main's first usage line")
        c.wait_idle("main")

        # A) a pause stops the running turn
        c.say("[[bash: sleep 30; echo late]]")
        c.wait_status("main", ["working"], 60)
        r = c.rpc("project/pause", {"project": p})
        ok("error" not in r, "project/pause answered: %r" % r)
        c.wait(lambda: paused(c), 30, "hub/paused paused")
        c.wait_line("main", "‖ paused · its turn stopped", 30)
        c.wait_idle("main", timeout=30)
        ok(any("paused: 1 turn stopped. messages, scheduled tasks and waits are held. /resume goes on." in (n.get("text") or "") for n in c.notices()),
           "the notice says the turn stopped: %r" % [n.get("text") for n in c.notices()][-3:])
        ok(not any("late" == l.split("\t")[-1].strip() for l in c.lines("main")), "the sleep never finished")

        # B) held: no turn starts; a second pause only says so
        before = len(c.lines("main"))
        c.say("are you there")
        c.wait(lambda: (c.hub.get("hub/paused") or {}).get("held", 0) >= 1, 30, "held counts the message")
        wait.holds(lambda: (c.agent("main") or {}).get("status") == "idle", 3, "main stays idle while paused")
        ok(not any("are you there" in l for l in c.lines("main")[before:]), "the message is not delivered")
        r = c.rpc("project/pause", {"project": p})
        ok(any("already paused. /resume goes on." in (n.get("text") or "") for n in c.notices()), "a second /pause says it is already paused")

        # C) a restart keeps the pause and the held message
        E.stop_hub(keep_agents=True)
        c = E.start_hub()
        c.wait(lambda: paused(c), 30, "still paused after a restart")
        ok(paused(c), "initialize's state says paused")
        wait.holds(lambda: not any("are you there" in l for l in c.lines("main")), 2, "the held message waits after the restart")

        # D) resume delivers it
        r = c.rpc("project/resume", {"project": p})
        ok("error" not in r, "project/resume answered: %r" % r)
        c.wait(lambda: not paused(c), 30, "hub/paused not paused")
        c.wait_line("main", "are you there", 60)
        c.wait_line("main", "the project was paused. go on where your turn stopped.", 60)
        c.wait_idle("main", timeout=90)
        ok(any("resumed: 1 agent goes on, 1 message delivered." in (n.get("text") or "") for n in c.notices()),
           "the resume notice counts it: %r" % [n.get("text") for n in c.notices()][-3:])

        # E) usage per agent and per model
        def read():
            v = c.rpc("usage/read", {"project": p}).get("result") or {}
            return v if not v.get("counting") else None
        u = wait.until(read, 60, "usage/read done counting")
        names = [a["name"] for a in u.get("agents", [])]
        ok("main" in names, "usage has main: %r" % names)
        main_row = next(a for a in u["agents"] if a["name"] == "main")
        ok(main_row["week"]["calls"] >= 2 and main_row["today"]["calls"] >= 2, "main's calls counted: %r" % main_row["week"])
        ok(main_row["week"]["words"].startswith("<$0.01 · "), "words filled, under a cent: %r" % main_row["week"]["words"])
        ok(len(u.get("models", [])) >= 1 and u["all"]["week"]["calls"] == sum(m["week"]["calls"] for m in u["models"]),
           "the models add up to the project")
    except Exception as e:
        FAILS.append(str(e))
        print("FAIL %s" % e, flush=True)
        os.environ["SB_KEEP"] = "1"
    finally:
        E.close()
    print("PASS pause_e2e" if not FAILS else "FAIL pause_e2e: %d" % len(FAILS), flush=True)
    sys.exit(1 if FAILS else 0)


if __name__ == "__main__":
    check(True, "")
    main()
