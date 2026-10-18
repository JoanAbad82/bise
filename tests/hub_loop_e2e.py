#!/usr/bin/env python3
"""The hub's loop holds no agent's `sb` while it spawns, drops and wakes
(hub-loop, docs/issues/32).

On 2026-10-17 his harness hub dropped 48 agents' `sb` commands ("its sb
gave up before the hub took it: not run"), 25 of them during one Tick of
47 s spent in "wakes look", with 5-15 s spells on `sb drop` and `sb
spawn`: the loop ran slow shell work (git worktree add/remove, ps,
launchctl, file looks) inline.

A real hub, the scripted provider, a workspace of FILES files (a
worktree's checkout costs what his does, a little):
  1. 25 tasks, 30 live `sb wake` watches (20 pids, 10 files);
  2. a sampler: main's `sb list` every 200 ms;
  3. meanwhile a spawn and an /archive (each a worktree of FILES files), and a burst of every watch's event;
  4. every `sb list` answered in under LIMIT s, every watch fired once,
     and hub.log has no "gave up before the hub took it" and no
     "hub loop busy" (its split, crate::spent, is printed when there is).

Run: python3 -u tests/hub_loop_e2e.py   (HUB_LOOP_FILES=20000 for a heavier repo)
"""
import json
import os
import subprocess
import sys
import threading
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import e2e  # noqa: E402
import wait  # noqa: E402
from e2e import Env, check  # noqa: E402

LIMIT = 1.0
TASKS = 25
PIDS = 20
FILES_W = 10
FILES = int(os.environ.get("HUB_LOOP_FILES", "8000"))


def sb(E, agent, *args, ok=True):
    env = {**E.env, "SB_SOCKET": os.path.join(E.state, "agent.sock"), "SB_AGENT": agent}
    r = subprocess.run([e2e.EXE, "sb", *args], env=env, cwd=E.ws, capture_output=True, text=True, timeout=120)
    if ok:
        assert r.returncode == 0, "sb %s: %s %s" % (" ".join(args), r.stdout, r.stderr)
    return r


def hub_log(E):
    try:
        return open(os.path.join(E.state, "hub.log")).read()
    except FileNotFoundError:
        return ""


def journal(E, kind):
    out = []
    for l in open(os.path.join(E.state, "journal.jsonl")):
        if '"%s"' % kind in l:
            out.append(json.loads(l))
    return out


def big_repo(ws, n):
    """`n` small files in 100 folders, one commit."""
    for i in range(n):
        d = os.path.join(ws, "src", "d%02d" % (i % 100))
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, "f%05d.txt" % i), "w") as f:
            f.write("file %d\n" % i * 20)
    e2e.sh(ws, "git add -A && git commit -qm files")


class Sampler(threading.Thread):
    """main's `sb list`, one every 200 ms (from the end of the last)."""

    def __init__(self, E):
        super().__init__(daemon=True)
        self.E, self.took, self.stop = E, [], threading.Event()

    def run(self):
        while not self.stop.is_set():
            t0 = time.time()
            r = sb(self.E, "main", "list", ok=False)
            self.took.append((t0, time.time() - t0, r.returncode))
            self.stop.wait(0.2)


def main():
    E = Env()
    sleeps = []
    sampler = None
    try:
        t0 = time.time()
        big_repo(E.ws, FILES)
        print("repo: %d files in %.1f s" % (FILES, time.time() - t0))
        c = E.start_hub()
        c.wait_status("main", "idle", 60)
        names = ["t%02d" % i for i in range(1, TASKS + 1)]
        # the last one in a worktree: the /archive below removes it
        for n in names:
            sb(E, "main", "spawn", n, "--objective", "stay around for the hub-loop test", *(["--worktree"] if n == names[-1] else []))
        for n in names:
            c.wait_status(n, "idle", 240)
        print("%d tasks idle after %.1f s" % (TASKS, time.time() - t0))

        # 30 live watches: 20 processes, 10 files, on the tasks in turn
        for i in range(PIDS):
            p = subprocess.Popen(["sleep", "600"])
            sleeps.append(p)
            sb(E, names[i % TASKS], "wake", "--on-exit", str(p.pid), "--note", "PID-%d" % i)
        files = [os.path.join(E.tmp, "rc-%d" % i) for i in range(FILES_W)]
        for i, f in enumerate(files):
            sb(E, names[(PIDS + i) % TASKS], "wake", "--on-file", f, "--note", "FILE-%d" % i)
        check(len(journal(E, "wake_set")) == PIDS + FILES_W, "%d watches set" % (PIDS + FILES_W))
        log0 = len(hub_log(E))

        sampler = Sampler(E)
        sampler.start()
        wait.until(lambda: len(sampler.took) >= 10, 30, "10 sb list before the spawn")
        # a spawn, a drop, then every watch's event at once
        ts = time.time()
        sb(E, "main", "spawn", "t26", "--objective", "a late task", "--worktree")
        print("sb spawn answered in %.2f s" % (time.time() - ts))
        # his /archive (main's `sb drop` asks him first)
        dropped = names[-1]
        ts = time.time()
        c.say("/archive %s" % dropped)
        c.wait(lambda: c.agent(dropped)["status"] == "archived" or any(n["kind"] == "confirm" for n in c.notices()), 60,
               "%s archived or a confirmation" % dropped)
        conf = [n for n in c.notices() if n["kind"] == "confirm"]
        if conf:
            c.confirm(conf[-1]["id"], True)
        c.wait_status(dropped, "archived", 60)
        print("/archive done in %.2f s" % (time.time() - ts))
        for p in sleeps:
            p.kill()
            p.wait()  # a zombie is alive to kill(0)
        for f in files:
            open(f, "w").write("0\n")
        want = PIDS + FILES_W - sum(1 for i in range(PIDS + FILES_W) if names[i % TASKS] == dropped)
        wait.until(lambda: len([j for j in journal(E, "wake_end") if j.get("why") != "gone"]) >= want, 60,
                   "%d watches fired" % want)
        c.wait_status("t26", "idle", 120)
        n = len(sampler.took)
        wait.until(lambda: len(sampler.took) >= n + 10, 30, "10 sb list after the burst")
        sampler.stop.set()
        sampler.join(30)

        took = sorted(t for _, t, _ in sampler.took)
        slow = [(round(a - t0, 1), round(t, 2)) for a, t, _ in sampler.took if t >= LIMIT]
        p = lambda q: took[min(len(took) - 1, int(q * len(took)))]  # noqa: E731
        print("sb list: %d samples, median %.3f s, p95 %.3f s, worst %.3f s, %d over %.0f s %s"
              % (len(took), p(0.5), p(0.95), took[-1], len(slow), LIMIT, slow[:10]))
        log = hub_log(E)[log0:]
        busy = [l for l in log.splitlines() if "hub loop busy" in l or "hub loop free" in l]
        for l in log.splitlines():
            if "hub loop " in l:
                print("  " + l)
        fired = [j for j in journal(E, "wake_end") if j.get("why") != "gone"]
        check(len({j["id"] for j in fired}) == len(fired), "each watch fired once")
        check(all(r == 0 for _, _, r in sampler.took), "every sb list answered")
        check(not slow, "every sb list under %.0f s (worst %.2f s)" % (LIMIT, took[-1]))
        check("gave up before the hub took it" not in log, "hub.log: no sb given up")
        check(not busy, "hub.log: the loop never held 5 s")
    finally:
        if sampler:
            sampler.stop.set()
        for p in sleeps:
            p.kill()
        E.close()
    print("OK hub_loop_e2e")


if __name__ == "__main__":
    main()
