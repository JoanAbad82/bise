#!/usr/bin/env python3
"""scripts/disk_reclaim.py (mac-budget): idle cargo targets go, the least
recently used go first when the disk is low, a target in use (its cargo lock
held) never goes, the owner finds RECLAIMED.txt, each deletion is logged.
Fake worktrees in a temp HOME, faked free space; ~3 s."""
import fcntl
import os
import subprocess
import sys
import tempfile
import time

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPT = os.path.join(HERE, "..", "scripts", "disk_reclaim.py")
fails = []


def check(ok, what):
    print(("ok   " if ok else "FAIL ") + what)
    if not ok:
        fails.append(what)


r = subprocess.run([sys.executable, SCRIPT, "--self-test"], capture_output=True, text=True)
check(r.returncode == 0 and "ok" in r.stdout, "the pure plan's self-test: %r" % (r.stdout + r.stderr))

with tempfile.TemporaryDirectory() as home:
    wts = os.path.join(home, ".bise", "worktrees", "hub")
    now = time.time()

    def target(agent, hours, sub="harness/rust"):
        t = os.path.join(wts, agent, sub, "target")
        for d in ("debug/deps", "debug/.fingerprint", "debug/incremental"):
            os.makedirs(os.path.join(t, d))
        open(os.path.join(t, "CACHEDIR.TAG"), "w").write("Signature: 8a477f597d28d172789f06886806bc55\n")
        open(os.path.join(t, "debug", ".cargo-lock"), "w").close()
        open(os.path.join(t, "debug", "deps", "libx.rlib"), "w").write("x" * 1000)
        ts = now - hours * 3600
        for dirpath, dirs, files in os.walk(t):
            for f in dirs + files:
                os.utime(os.path.join(dirpath, f), (ts, ts))
        os.utime(t, (ts, ts))
        return t

    old = target("old", 8)          # idle: goes whatever the space
    mid = target("mid", 2)          # LRU when low
    young = target("young", 1)      # LRU when low, after mid
    fresh = target("fresh", 0.1)    # used 6 min ago: never
    used = target("used", 9)        # its cargo lock held: never
    gated = target("gated", 9)      # a heavy job runs in its worktree: never
    os.makedirs(os.path.join(home, ".bise", "run", "reserve"))
    open(os.path.join(home, ".bise", "run", "reserve", "heavy2.lock.%d" % os.getpid()), "w").write(
        "3\t%s\n" % os.path.join(wts, "gated", "harness", "rust"))
    notcargo = os.path.join(wts, "plain", "target")  # no CACHEDIR.TAG: not a cargo target
    os.makedirs(notcargo)
    freef = os.path.join(home, "free_kb")
    open(freef, "w").write(str(100 * 1048576))
    env = dict(os.environ, HOME=home, HEAVY_FREE_KB_FILE=freef)
    env.pop("HEAVY_RECLAIM_ROOTS", None)

    held = open(os.path.join(used, "debug", ".cargo-lock"), "r+")
    fcntl.flock(held, fcntl.LOCK_EX)

    r = subprocess.run([sys.executable, SCRIPT, "--want", "25"], env=env, capture_output=True, text=True)
    check(r.returncode == 0, "it runs: %r" % r.stderr[-300:])
    gone = lambda t: not os.path.exists(os.path.join(t, "CACHEDIR.TAG"))
    check(gone(old), "100 GB free: the target unused 8 h goes (idle)")
    check(not gone(mid) and not gone(young) and not gone(fresh), "100 GB free: the ones used in the last 6 h stay")
    check(not gone(used), "a target whose cargo lock is held stays, idle or not")
    check(not gone(gated), "a target in a worktree where a heavy job runs stays")
    check(os.path.isdir(notcargo), "a dir named target without CACHEDIR.TAG is not touched")
    note = os.path.join(old, "RECLAIMED.txt")
    check(os.path.exists(note) and "next build is cold" in open(note).read(),
          "the owner finds RECLAIMED.txt in the empty target")
    log = open(os.path.join(home, ".bise", "run", "reclaim.log")).read().splitlines()
    check(len(log) == 1 and log[0].split("\t")[1] == old and log[0].endswith("idle"), "reclaim.log has the line: %r" % log)

    # low: the least recently used first, never one used in the last 30 min
    open(freef, "w").write(str(10 * 1048576))
    r = subprocess.run([sys.executable, SCRIPT, "--want", "25"], env=env, capture_output=True, text=True)
    log = open(os.path.join(home, ".bise", "run", "reclaim.log")).read().splitlines()
    order = [l.split("\t")[1] for l in log[1:]]
    check(order == [mid, young], "10 GB free, 25 wanted: mid then young (LRU): %r" % order)
    check(not gone(fresh) and not gone(used), "the fresh and the locked ones stay")
    check(not [d for d in os.listdir(os.path.dirname(mid)) if d.startswith("target.reclaiming")], "no leftover dir")

    # a second reclaim while one runs returns at once
    lk = open(os.path.join(home, ".bise", "run", "reclaim.lock"), "w")
    fcntl.flock(lk, fcntl.LOCK_EX)
    r = subprocess.run([sys.executable, SCRIPT, "--want", "99"], env=env, capture_output=True, text=True, timeout=20)
    check("another reclaim runs" in r.stdout, "one reclaim at a time")

sys.exit(1 if fails else 0)
