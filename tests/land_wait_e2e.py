"""A slow land check never fails a land (land-wait), end to end.

A real hub (bise sbd, scripted model) on a tiny repo whose bise.toml's land
check sleeps LAND_WAIT_SLEEP s (default 240: past the old 180 s client
wait). Agent wk lands from its worktree:

  A  its sb waits: the land lands, sb prints it (rc 0) after the check,
     and wk gets no bise message on top (its sb heard it);
     meanwhile main's `sb list` answers in seconds (the hub's loop is free).
  B  its sb is killed 10 s in: main still moves, and wk gets bise's
     message with the result (daemon/land.rs UNHEARD); a second `sb land`
     of the place while B checks is refused at once (land_queue::busy).

Run: python3 -u tests/land_wait_e2e.py   (heavy: ~9 min; ~/.bise/run/heavy-run)
"""
import json
import os
import signal
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e  # noqa: E402
import wait  # noqa: E402
from e2e import EXE, check, out, sh  # noqa: E402

SLEEP = int(os.environ.get("LAND_WAIT_SLEEP", "240"))
NL = chr(10)
UNHEARD = "your sb land ended after your sb stopped waiting"
BUSY = "a land of this place is in line or checking"


class Runs:
    """A command run by an agent's bash, its output, rc and wall time in
    files the test reads (no transcript parsing)."""

    def __init__(self, c, tmp):
        self.c, self.dir, self.n = c, os.path.join(tmp, "runs"), 0
        os.makedirs(self.dir)

    def start(self, agent, cmd):
        """Start `cmd` in `agent`'s bash; its file prefix."""
        self.n += 1
        p = os.path.join(self.dir, str(self.n))
        t = "python3 -c 'import time; print(time.time())'"
        script = "s=$(%s); %s > %s.out 2>&1; rc=$?; e=$(%s); echo \"$rc $s $e\" > %s.tmp && mv %s.tmp %s.rc" % (t, cmd, p, t, p, p, p)
        self.c.say("[[bash: %s]]" % script, focus=agent)
        return p

    def end(self, p, timeout):
        """(rc, seconds, output) of the run at `p`."""
        wait.until(lambda: os.path.exists(p + ".rc"), timeout, "run %s" % p)
        rc, s, e = open(p + ".rc").read().split()
        return int(rc), float(e) - float(s), open(p + ".out").read()

    def run(self, agent, cmd, timeout=60):
        r = self.end(self.start(agent, cmd), timeout)
        self.c.wait_idle(agent)
        return r


def commit(wt, name):
    sh(wt, "echo %s > %s.txt && git add -A && git commit -qm %s" % (name, name, name))
    return out(wt, "git rev-parse HEAD")


def main():
    if not os.path.exists(EXE):
        sys.exit("build first: cd rust && cargo build")
    E = e2e.Env()
    ws = E.ws
    sh(ws, "git checkout -q -B main")
    with open(os.path.join(ws, "bise.toml"), "w") as f:
        # the check gets `<base> <head>`: `true` takes them
        f.write("[land]" + NL + "check = \"sleep %d; true\"" % SLEEP + NL)
    sh(ws, "git add bise.toml && git commit -qm 'slow land check'")
    main_sha = lambda: out(ws, "git rev-parse main")  # noqa: E731
    try:
        c = E.start_hub()
        c.wait_status("main", "idle", 60)
        c.say('[[bash: sb spawn wk --place new --objective "{{bash: true}}"]]')
        c.wait(lambda: c.agent("wk") is not None, 60, "wk")
        c.wait_idle("wk", "main")
        wt = out(ws, "git worktree list --porcelain | sed -n 's/^worktree //p' | grep '/wk/'")
        check(os.path.isdir(wt), "wk's worktree: %r" % wt)
        R = Runs(c, E.tmp)

        # A: its sb waits past 180 s and prints the land; the hub answers meanwhile
        tip = commit(wt, "a")
        land = R.start("wk", "sb land 'a'")
        time.sleep(40)
        rc, secs, o = R.run("main", "sb list")
        check(rc == 0 and secs < 5, "sb list during a land check: rc %d in %.1f s: %s" % (rc, secs, o))
        rc, secs, o = R.end(land, SLEEP + 120)
        check(rc == 0, "A: sb land rc %d after %.0f s: %s" % (rc, secs, o))
        check(secs >= SLEEP, "A: the land waited for its check (%.0f s < %d s)" % (secs, SLEEP))
        check(main_sha() == tip, "A: main is wk's tip %s, not %s" % (tip, main_sha()))
        time.sleep(3)
        check(not any(UNHEARD in l for l in c.lines("wk")), "A: its sb heard it: no bise message on top")
        print("A ok: landed after %.0f s, sb list answered meanwhile" % secs)

        # B: its sb killed 10 s in; the land lands and wk hears it from bise
        c.wait_idle("wk", timeout=120)
        tip = commit(wt, "b")
        pidf = os.path.join(E.tmp, "b.pid")
        c.say("[[bash: sb land 'b' > %s.out 2>&1 & echo $! > %s]]" % (pidf, pidf), focus="wk")
        wait.until(lambda: os.path.exists(pidf) and open(pidf).read().strip(), 30, "b's sb pid")
        c.wait_idle("wk")
        time.sleep(10)
        os.kill(int(open(pidf).read()), signal.SIGKILL)
        # a second land of the place while B checks: refused at once
        rc, secs, o = R.run("wk", "sb land 'again'")
        check(rc != 0 and BUSY in o and secs < 5, "B: a second land is refused at once: rc %d in %.1f s: %s" % (rc, secs, o))
        rc, secs, o = R.run("main", "sb list")
        check(rc == 0 and secs < 5, "sb list during land B: rc %d in %.1f s: %s" % (rc, secs, o))
        wait.until(lambda: main_sha() == tip, SLEEP + 120, "B: main moves to %s with its sb gone" % tip)
        c.wait_line("wk", UNHEARD, 60)
        heard = [l for l in c.lines("wk") if UNHEARD in l]
        check(len(heard) == 1, "B: wk hears its land once from bise: %s" % json.dumps(heard))
        print("B ok: main moved with its sb gone, wk told once, the second land refused")
        print("OK land_wait_e2e")
    finally:
        E.close()


if __name__ == "__main__":
    main()
