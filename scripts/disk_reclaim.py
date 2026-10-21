#!/usr/bin/env python3
"""Give disk space back: delete the agents' idle cargo targets (mac-budget,
2026-10-21). heavy-run calls it; nobody else needs to.

  python3 scripts/disk_reclaim.py [--want <GB>] [--idle-h <h>] [--min-idle-min <m>] [--dry-run]
  python3 scripts/disk_reclaim.py --self-test

Why: each agent worktree holds a rust/target of 6-12 GB that nothing deletes;
on 2026-10-20 they and a cold rebuild took the data volume to 1.3 GB free,
every heavy job waited 12 h and main cleaned by hand. A target is a cache:
cargo rebuilds it (the seed clone and sccache make that cheaper).

What it deletes: a cargo target dir (a dir named `target` with cargo's
CACHEDIR.TAG) at most 4 levels under a worktree of ~/.bise/worktrees/<hub>/
<agent>/ (HEAVY_RECLAIM_ROOTS: a ':' list of roots instead, tests). Never the
user's own clones, never anything else.
  - every target unused for --idle-h hours (6) goes, whatever the free space;
  - while the data volume has under --want GB free, the least recently used
    targets unused for --min-idle-min minutes (30) go, oldest first, one at a
    time, until it has --want GB again.
Used = the newest mtime of the target and its profile dirs (debug, release,
their deps/.fingerprint/incremental/build): each build writes there.
Never a target in use (the hub's rule: no process uses it): one whose cargo
lock (<profile>/.cargo-lock) another process holds, one a running process
executes a file from (a test binary), or one in a worktree where a heavy-run
job runs (its cwd, ~/.bise/run/reserve). Never the gate seed
(~/.bise/cache/gate-seed) nor the user's clones: only worktree targets. The cargo locks are held while the dir
is renamed away, so a cargo that starts then waits and gets a fresh target.
The owner is told: the new empty target holds RECLAIMED.txt (what, when, why),
and heavy-run prints it at the owner's next job in that worktree (its build
is cold, that's why). Each deletion is a line in ~/.bise/run/reclaim.log:
<epoch> <path> <idle min> <GB freed> <reason>.
One reclaim at a time (~/.bise/run/reclaim.lock): a second one returns at once.
HEAVY_FREE_KB_FILE (tests): the free KB are read from that file, not statvfs.
"""
import argparse
import fcntl
import os
import shutil
import subprocess
import sys
import time

GB = 1 << 30
PROFILE_SUBDIRS = ("deps", ".fingerprint", "incremental", "build")


# ---- pure part ------------------------------------------------------------

def plan(targets, free_gb, want_gb, now, idle_h, min_idle_min):
    """The targets to delete, in order, with why.

    targets: [(path, last_used_epoch, busy)]. Returns [(path, reason)]:
    first every idle one (unused >= idle_h), then, only while free_gb is
    under want_gb, the least recently used of the rest unused >= min_idle_min.
    The caller deletes them in that order and stops the 'low' ones as soon
    as the disk has want_gb free (it re-reads the free space after each)."""
    free = [(p, t) for p, t, busy in targets if not busy]
    idle = sorted([(t, p) for p, t in free if now - t >= idle_h * 3600])
    out = [(p, "idle") for t, p in idle]
    if free_gb < want_gb:
        done = {p for t, p in idle}
        lru = sorted([(t, p) for p, t in free if p not in done and now - t >= min_idle_min * 60])
        out += [(p, "low") for t, p in lru]
    return out


def _self_test():
    now = 1_000_000
    t = [("/a", now - 7 * 3600, False), ("/b", now - 3600, False), ("/c", now - 120, False),
         ("/d", now - 9 * 3600, True), ("/e", now - 2 * 3600, False)]
    assert plan(t, 50, 25, now, 6, 30) == [("/a", "idle")], plan(t, 50, 25, now, 6, 30)
    assert plan(t, 10, 25, now, 6, 30) == [("/a", "idle"), ("/e", "low"), ("/b", "low")]
    assert plan(t, 10, 25, now, 6, 1) == [("/a", "idle"), ("/e", "low"), ("/b", "low"), ("/c", "low")]
    assert plan([], 1, 25, now, 6, 30) == []
    assert all(p != "/d" for p, _ in plan(t, 0, 99, now, 0, 0)), "a busy target is never planned"
    print("disk_reclaim self-test ok")


# ---- the shell ------------------------------------------------------------

def free_kb():
    f = os.environ.get("HEAVY_FREE_KB_FILE")
    if f:
        try:
            return int(open(f).read().strip() or 0)
        except (OSError, ValueError):
            return 0
    v = os.environ.get("HEAVY_DISK_VOLUME") or "/System/Volumes/Data"
    if not os.path.isdir(v):
        v = os.path.expanduser("~")
    s = os.statvfs(v)
    return s.f_bavail * s.f_frsize // 1024


def roots():
    r = os.environ.get("HEAVY_RECLAIM_ROOTS")
    if r:
        return [p for p in r.split(":") if p]
    base = os.path.expanduser("~/.bise/worktrees")
    return [os.path.join(base, h, a) for h in _ls(base) for a in _ls(os.path.join(base, h))]


def _ls(d):
    try:
        return sorted(x for x in os.listdir(d) if os.path.isdir(os.path.join(d, x)))
    except OSError:
        return []


def find_targets(root, depth=4):
    """cargo target dirs under root (CACHEDIR.TAG), not descending into one."""
    out = []
    if depth < 0:
        return out
    for name in _ls(root):
        if name in ("node_modules", ".git") or name.startswith("target.reclaiming"):
            continue
        p = os.path.join(root, name)
        if os.path.islink(p):
            continue
        if name == "target" and os.path.exists(os.path.join(p, "CACHEDIR.TAG")):
            out.append(p)
        elif depth > 0:
            out += find_targets(p, depth - 1)
    return out


def profiles(t):
    return [os.path.join(t, d) for d in _ls(t) if os.path.exists(os.path.join(t, d, ".cargo-lock"))]


def last_used(t):
    m = 0.0
    for d in [t] + _ls_paths(t):
        for x in [d] + [os.path.join(d, s) for s in PROFILE_SUBDIRS]:
            try:
                m = max(m, os.stat(x).st_mtime)
            except OSError:
                pass
    return m


def _ls_paths(t):
    return [os.path.join(t, d) for d in _ls(t)]


def running_exes():
    """The executables of the running processes (full paths as exec'd)."""
    try:
        out = subprocess.run(["ps", "-Ao", "comm="], capture_output=True, text=True, timeout=20).stdout
    except (OSError, subprocess.SubprocessError):
        return None
    return [line.strip() for line in out.splitlines() if line.strip()]


def lock_all(t):
    """Take every cargo lock of t without waiting: the open fds, or None
    when a lock is held (cargo runs there)."""
    fds = []
    for p in profiles(t):
        try:
            fd = os.open(os.path.join(p, ".cargo-lock"), os.O_RDWR)
        except OSError:
            continue
        try:
            fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError:
            os.close(fd)
            for f in fds:
                os.close(f)
            return None
        fds.append(fd)
    return fds


def job_cwds():
    """The cwds of the running heavy-run jobs (~/.bise/run/reserve/<slot>.<pid>:
    "<GB>\t<cwd>"), the dead ones' files skipped."""
    d = os.path.expanduser("~/.bise/run/reserve")
    out = []
    for f in _files(d):
        try:
            os.kill(int(f.rsplit(".", 1)[1]), 0)
            out.append(open(os.path.join(d, f)).read().split("\t", 1)[1].strip())
        except (ValueError, IndexError, OSError):
            pass
    return out


def _files(d):
    try:
        return sorted(os.listdir(d))
    except OSError:
        return []


def busy(t, exes, root="", cwds=()):
    if exes is None:
        return True  # can't tell: hands off
    pre = t.rstrip("/") + "/"
    if any(e.startswith(pre) for e in exes):
        return True
    # a heavy job runs in that worktree (a gate, a build): hands off
    if root and any((c.rstrip("/") + "/").startswith(root.rstrip("/") + "/") for c in cwds):
        return True
    fds = lock_all(t)
    if fds is None:
        return True
    for f in fds:
        os.close(f)
    return False


def gone_dir(t):
    return "%s.reclaiming-%d-%d" % (t, int(time.time()), os.getpid())


def reclaim_one(t, reason, idle_min, log):
    fds = lock_all(t)
    if fds is None:
        return None
    before = free_kb()
    away = gone_dir(t)
    try:
        os.rename(t, away)
    except OSError:
        for f in fds:
            os.close(f)
        return None
    for f in fds:
        os.close(f)
    os.makedirs(t, exist_ok=True)
    shutil.rmtree(away, ignore_errors=True)
    gb = max(0, free_kb() - before) / (GB / 1024)
    stamp = time.strftime("%Y-%m-%d %H:%M")
    why = ("unused %.1f h" % (idle_min / 60.0)) + (", the disk was low" if reason == "low" else "")
    with open(os.path.join(t, "RECLAIMED.txt"), "w") as fh:
        fh.write("heavy-run: this cargo target was deleted at %s by scripts/disk_reclaim.py (%s, %.1f GB freed): "
                 "its next build is cold.\n" % (stamp, why, gb))
    with open(log, "a") as fh:
        fh.write("%d\t%s\t%d\t%.1f\t%s\n" % (time.time(), t, idle_min, gb, reason))
    return gb


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--want", type=float, default=0, help="GB free to reach (0: idle ones only)")
    ap.add_argument("--idle-h", type=float, default=float(os.environ.get("HEAVY_IDLE_TARGET_H", 6)))
    ap.add_argument("--min-idle-min", type=float, default=float(os.environ.get("HEAVY_MIN_IDLE_MIN", 30)))
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()
    if a.self_test:
        _self_test()
        return 0
    run = os.path.expanduser("~/.bise/run")
    os.makedirs(run, exist_ok=True)
    lk = open(os.path.join(run, "reclaim.lock"), "w")
    try:
        fcntl.flock(lk, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except OSError:
        print("disk_reclaim: another reclaim runs")
        return 0
    # leftovers of a reclaim that died mid-rm
    for r in roots():
        for dirpath, dirs, _ in os.walk(r):
            for d in list(dirs):
                if d.startswith("target.reclaiming-"):
                    shutil.rmtree(os.path.join(dirpath, d), ignore_errors=True)
                    dirs.remove(d)
                elif d in ("node_modules", ".git", "target"):
                    dirs.remove(d)
            if dirpath.count(os.sep) - r.count(os.sep) >= 4:
                dirs[:] = []
    exes = running_exes()
    now = time.time()
    cwds = job_cwds()
    ts = [(t, last_used(t), busy(t, exes, r, cwds)) for r in roots() for t in find_targets(r)]
    used = {t: u for t, u, _ in ts}
    todo = plan(ts, free_kb() / (GB / 1024), a.want, now, a.idle_h, a.min_idle_min)
    log = os.path.join(run, "reclaim.log")
    freed, n = 0.0, 0
    for t, reason in todo:
        if reason == "low" and free_kb() / (GB / 1024) >= a.want:
            break
        idle_min = int((now - used[t]) / 60)
        if a.dry_run:
            print("would delete %s (%s, unused %d min)" % (t, reason, idle_min))
            continue
        gb = reclaim_one(t, reason, idle_min, log)
        if gb is not None:
            freed += gb
            n += 1
            print("disk_reclaim: deleted %s (%s, unused %d min, %.1f GB)" % (t, reason, idle_min, gb))
    if n:
        print("disk_reclaim: %d target(s), %.1f GB freed, %.1f GB free now" % (n, freed, free_kb() / (GB / 1024)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
