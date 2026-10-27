"""idle-exit (docs/idle-exit.md): a hub with no UI stops by itself, and
nothing is lost.

A real hub (bise sbd) on the fake provider, with a grace of 4 s
(BISE_IDLE_EXIT) and a REPL hub watch of 3 s (BEND_HUB_GONE_MS):
- a UI back within the grace: the hub stays;
- the last UI leaves while t1 is mid-turn, with a background job
  (BEND_BG_AFTER 2 s) and an `sb every`: the hub stops at the grace all
  the same (quit-stop, #817), names the cut in hub.log, and every REPL
  and the job go with it;
- the next start: main and t1 are back with their feeds, main's thread
  says what stopped, t1's turn resumes, t1 is told its job was stopped,
  the standing order is still there, and t1 answers;
- a hub killed -9 leaves its REPLs: they exit by themselves (no hub for
  the watch's 10 looks), and the next hub brings the agents back.

Run: python3 -u tests/idle_exit_e2e.py
"""
import os
import signal
import socket
import subprocess
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e  # noqa: E402
import wait  # noqa: E402
from e2e import EXE, check  # noqa: E402

# IDLE_E2E_GRACE=120: the same run at the real grace (quit-stop's check)
GRACE = int(os.environ.get("IDLE_E2E_GRACE", "4"))
# the cut turn and job outlive the grace: at the real grace the turn's
# provider wait is raised past its 90 s default (BEND_CONFIG)
LONG_TURN = max(60, GRACE * 2 + 60)
LONG_JOB = max(120, GRACE * 3)


def repls(state):
    """The live processes started for this hub (their SB_SOCKET)."""
    out = subprocess.run(["ps", "-axww", "-E", "-o", "pid=,command="], capture_output=True, text=True).stdout
    needle = "SB_SOCKET=%s/agent.sock" % state
    got = []
    for l in out.splitlines():
        pid, _, rest = l.strip().partition(" ")
        if pid.isdigit() and needle in rest and not rest.startswith("ps "):
            got.append(int(pid))
    return got


def log(E):
    try:
        return open(os.path.join(E.state, "hub.log")).read()
    except FileNotFoundError:
        return ""


def leave(c):
    """The UI goes (the TUI quits, its terminal closes)."""
    # shutdown: close() alone keeps the fd its reader's makefile holds
    try:
        c.s.shutdown(socket.SHUT_RDWR)
        c.s.close()
    except OSError:
        pass


def stopped(E):
    return E.hub is not None and E.hub.poll() is not None


def main():
    if not os.path.exists(EXE):
        sys.exit("build first: cd rust && cargo build")
    E = e2e.Env()
    E.env["BISE_IDLE_EXIT"] = str(GRACE)
    E.env["BEND_HUB_GONE_MS"] = "3000"
    E.env["BEND_BG_AFTER"] = "2"
    if LONG_TURN > 80:
        cfg = os.path.join(E.tmp, "config.toml")
        with open(cfg, "w") as f:
            f.write("[providers.mistral]\nidle_timeout_sec = %d\n" % (LONG_TURN * 2))
        E.env["BEND_CONFIG"] = cfg
    ok = True
    try:
        c = E.start_hub()
        c.wait_status("main", "idle", 60)
        c.say("/new t1: {{bash: echo first-turn}}")
        c.wait(lambda: c.agent("t1"), 60, "t1")
        c.wait_idle("t1", "main")
        check("idle exit: after %d s" % GRACE in log(E), "the hub says its grace")

        # a quick relaunch: back within the grace, the hub stays
        n = log(E).count("idle exit: a UI is back")
        leave(c)
        wait.until(lambda: "idle exit: no UI left" in log(E), GRACE, "the hub seeing the UI leave")
        c = e2e.Client(os.path.join(E.state, "hub.sock"))
        wait.until(lambda: log(E).count("idle exit: a UI is back") > n, GRACE, "the hub seeing the UI back")
        # past the grace: still up
        wait.holds(lambda: E.hub.poll() is None, GRACE + 2, "a UI back within the grace: the hub stays")

        # quit-stop (#817): the last UI leaves while t1 is mid-turn, has a
        # background job and a standing order: the hub stops at the grace
        # all the same, and says what it cut
        bg = os.path.join(E.state, "agents", "t1", "tmp", "bg")
        c.say('[[bash: sb every 10m "poll the build"]]', focus="t1")
        c.wait_idle("t1")
        c.say("[[bash: sleep %d; echo bg-done]]" % LONG_JOB, focus="t1")
        c.wait(lambda: os.path.isdir(bg) and any(f.endswith(".slot") for f in os.listdir(bg)), 30, "t1's job in the background")
        c.wait_idle("t1")
        c.say("[[slow: %d]] long turn" % LONG_TURN, focus="t1")
        c.wait_status("t1", "working", 30)
        leave(c)
        t_left = time.time()
        wait.until(lambda: stopped(E), GRACE + 20, "the hub stopped at the grace, mid-turn")
        print("the hub stopped %.0f s after the last UI left (grace %d s)" % (time.time() - t_left, GRACE), flush=True)
        L = log(E)
        check("the hub waits for" not in L.split("idle exit: no UI left")[-1], "nothing of the agents held it")
        check("cut: t1 mid-turn, t1's background job" in L and "a standing order (sb every)" in L, "the stop names the cut: %s" % L[-800:])
        check("REPLs saved and gone" in L, "the REPLs went: %s" % L[-600:])
        check(not any(f.endswith(".rc") for f in os.listdir(bg)), "the job was cut, not run to its end")
        wait.until(lambda: not repls(E.state), 15, "no process of the hub left (the job's included)")
        E.hub = None

        # the next start: everything is back, the turn resumes, the job's
        # agent is told it was stopped, the standing order is still there
        c = E.start_hub()
        c.wait(lambda: c.state is not None, 30, "state")
        check([a["name"] for a in c.state["agents"]] == ["main", "t1"], "main and t1 are back")
        c.wait(lambda: any("first-turn" in l for l in c.lines("t1")), 30, "t1's feed is back")
        c.wait(lambda: any("that stopped t1 mid-turn" in l for l in c.lines("main")), 30, "main's line says what stopped")
        c.wait(lambda: any("its turn was interrupted by a restart" in l for l in c.lines("t1")), 60, "t1's turn resumes")
        c.wait(lambda: any("was stopped · no rc" in l for l in c.lines("t1")), 60, "t1 told its job was stopped")
        c.wait_idle("main", "t1", timeout=90)
        c.say("[[bash: sb every]]", focus="t1")
        c.wait_line("t1", "poll the build", 60)
        c.say("after the stop", focus="t1")
        c.wait_line("t1", "ack: after the stop", 60)

        # a hub killed -9 (the one up since the stop above): its REPLs see
        # no hub and exit by themselves
        c.wait_idle("main", "t1", timeout=60)
        # waited for: main and t1 read idle from the replayed journal at
        # once, before their REPL processes are up (red under load: 'the
        # REPLs run' read once right after the boot)
        wait.until(lambda: len(repls(E.state)) >= 2, 60, lambda: "the REPLs run: %s" % repls(E.state))
        os.kill(E.hub.pid, signal.SIGKILL)
        E.hub.wait()
        E.hub = None
        wait.until(lambda: not repls(E.state), 30, "the orphan REPLs exited")
        # the dead hub's socket file stays (a `bise` finds it refused and
        # starts a hub, which replaces it); start_hub waits for the file
        os.remove(os.path.join(E.state, "hub.sock"))
        E.env["BISE_IDLE_EXIT"] = "off"
        c = E.start_hub()
        c.wait(lambda: c.state is not None, 30, "state")
        c.wait_idle("main", "t1", timeout=60)
        c.say("after the crash", focus="t1")
        c.wait_line("t1", "ack: after the crash", 60)
        print("PASS idle_exit_e2e", flush=True)
    except Exception as e:
        ok = False
        print("FAIL idle_exit_e2e: %s" % e, flush=True)
        print(log(E)[-3000:], flush=True)
        os.environ["SB_KEEP"] = "1"
    finally:
        E.close()
        for p in repls(E.state):
            try:
                os.kill(p, 9)
            except OSError:
                pass
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
