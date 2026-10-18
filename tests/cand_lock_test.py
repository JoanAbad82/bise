#!/usr/bin/env python3
"""dev/plugins/ambient-qa/as-he-does/cand.sh's locks (main m_30102), on fake data only.

A throwaway HOME (its ~/.bise/gate/real-shape world and ~/.bise/gate/locks) and a stand-in app
folder with no executable: past its locks cand.sh stops at once ('no <its main>', exit 2), before
any world, app or gate. A holder is a `lockf <lock> sleep` with its .holder line. Checks: free, it
goes past the locks and writes its own holder lines; the world held, or the candidate's path held
from another world, it says the holder in one line and gives up after CAND_LOCK_WAIT with exit 2,
never past the lock; two runs on one candidate and two candidates on one world (stand-in runs:
CAND_LOCK_HOLD), the second refused naming the first's pid; a dead owner (killed -9) and a breach exit
(3) free the locks; a holder that ends within the wait lets it through. Nothing of his is touched.

  python3 -B tests/cand_lock_test.py
"""
import hashlib
import os
import shutil
import subprocess
import sys
import tempfile
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "tests"))
import wait  # noqa: E402  (every wait here is for a state, never a fixed time: tests/sleep_check.py)

CAND = os.path.join(ROOT, "dev", "plugins", "ambient-qa", "as-he-does", "cand.sh")
FAILS = []


def busy(lock):
    """Whether someone holds `lock` (lockf -t 0 says 75)."""
    return subprocess.run(["/usr/bin/lockf", "-t", "0", lock, "true"], capture_output=True).returncode == 75


def check(ok, what):
    if not ok:
        FAILS.append(what)


def main():
    t = os.path.realpath(tempfile.mkdtemp(prefix="cand-lock-test-", dir=os.environ.get("TMPDIR")))
    holders = []
    try:
        home = os.path.join(t, "home")
        app = os.path.join(t, "bise cand.app")
        os.makedirs(os.path.join(app, "Contents"))
        world = os.path.join(home, ".bise", "gate", "real-shape")
        locks = os.path.join(home, ".bise", "gate", "locks")
        cand_lock = os.path.join(locks, "cand-" + hashlib.sha256(app.encode()).hexdigest()[:16])
        os.makedirs(os.path.join(world, "locks"))
        os.makedirs(locks)
        env = dict(os.environ, HOME=home)
        for k in ("CAND_LOCKED", "CAND_LOCK_WAIT"):
            env.pop(k, None)

        def run(wait=None):
            e = dict(env, **({"CAND_LOCK_WAIT": str(wait)} if wait is not None else {}))
            r = subprocess.run(["bash", CAND, os.path.join(t, "out"), app], env=e, capture_output=True, text=True,
                               timeout=60, stdin=subprocess.DEVNULL)
            return r.returncode, r.stdout + r.stderr

        def hold(base, secs, who):
            with open(base + ".holder", "w") as f:
                f.write(who + "\n")
            p = subprocess.Popen(["/usr/bin/lockf", base + ".lock", "sleep", str(secs)])
            holders.append(p)
            wait.until(lambda: busy(base + ".lock"), 10, "the holder takes " + base)
            return p

        past = "no %s/Contents/MacOS/" % app
        app2 = os.path.join(t, "other cand.app")
        os.makedirs(os.path.join(app2, "Contents"))

        def start(a, hold, rc=0):
            """A stand-in run holding the locks `hold` s (CAND_LOCK_HOLD), in its own process group."""
            e = dict(env, CAND_LOCK_HOLD=str(hold), CAND_LOCK_HOLD_RC=str(rc))
            p = subprocess.Popen(["bash", CAND, os.path.join(t, "out-held"), a], env=e, stdout=subprocess.PIPE,
                                 stderr=subprocess.STDOUT, text=True, stdin=subprocess.DEVNULL, start_new_session=True)
            holders.append(p)
            # held AND its holder line written (try-smoke m_30184: under load the line came after
            # the lock, so the test read the last run's pid), up to 30 s
            hf = os.path.join(world, "locks", "world.holder")
            wait.until(lambda: busy(os.path.join(world, "locks", "world.lock")) and "out-held" in open(hf).read(), 30,
                       "the stand-in run holds the world, its holder line written")
            return p

        def inner_pid():
            return open(os.path.join(world, "locks", "world.holder")).read().split()[1]

        # free: past both locks (its own check stops it), its holder lines written
        rc, o = run()
        check(rc == 2 and past in o and "held by" not in o, "free: %s %s" % (rc, o))
        for base in (os.path.join(world, "locks", "world"), cand_lock):
            h = open(base + ".holder").read()
            check(h.startswith("pid ") and app in h, "free: holder %s %r" % (base, h))

        # two runs on one candidate: the 2nd refused, naming the 1st's pid and how to stop it (by pid)
        p = start(app, 30)
        pid = inner_pid()
        rc, o = run(wait=1)
        check(rc == 2 and ("is still held by pid %s" % pid) in o and "kill <pid>" in o and "never by name" in o and past not in o,
              "same candidate: %s %s" % (rc, o))
        check(("/locks/cand-" in o) and ("world is still held" in o), "same candidate: both locks named %s" % o)

        # a run waiting on the lock: the stop sweep of a run in that world (every pid whose command
        # names <world>/w, cand.sh) never matches it (night2, 00:35: the lock was <world>/world.lock,
        # whose path names <world>/w: another run's sweep killed the waiting one, exit 143)
        w = subprocess.Popen(["bash", CAND, os.path.join(t, "out-wait"), app2], env=dict(env, CAND_LOCK_WAIT="20"),
                             stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, stdin=subprocess.DEVNULL, start_new_session=True)
        holders.append(w)
        # polled, never a fixed sleep (review-gates m_30166: at load ~22 the run wasn't there yet):
        # its lockf waiting on the world lock, up to 30 s
        def seen():
            ps = subprocess.run(["ps", "-axo", "pid=,command="], capture_output=True, text=True).stdout.splitlines()
            waiting = [l for l in ps if "out-wait" in l and "lockf" in l and "world.lock" in l]
            return (waiting, [l for l in ps if os.path.join(world, "w") in l]) if waiting else None
        _, swept = wait.until(seen, 30, "sweep case: the waiting run's lockf on the world lock")
        check(not swept, "sweep case: the sweep's pattern matches a waiting run: %s" % swept)
        os.killpg(w.pid, 9)
        w.wait()

        # two candidates on one world: the 2nd refused on the world only
        e2 = dict(env, CAND_LOCK_WAIT="1")
        r = subprocess.run(["bash", CAND, os.path.join(t, "out2"), app2], env=e2, capture_output=True, text=True, timeout=60, stdin=subprocess.DEVNULL)
        o = r.stdout + r.stderr
        check(r.returncode == 2 and ("world is still held by pid %s" % pid) in o and "/locks/cand-" not in o and "no %s/Contents/MacOS/" % app2 not in o,
              "same world: %s %s" % (r.returncode, o))

        # a dead owner (its whole run killed -9): the next run takes the locks at once
        os.killpg(p.pid, 9)
        p.wait()
        t0 = time.time()
        rc, o = run(wait=30)
        check(rc == 2 and past in o and time.time() - t0 < 10, "dead owner taken over: %s %s" % (rc, o))

        # a run that ends on a breach's exit 3 frees both locks
        p = start(app, 1, rc=3)
        check(p.wait(timeout=30) == 3, "the stand-in breach exit")
        rc, o = run(wait=1)
        check(rc == 2 and past in o and "held by" not in o, "freed after exit 3: %s %s" % (rc, o))

        # the candidate's path held from another world (a smoke): refused on that lock
        hp = hold(cand_lock, 30, "pid 2, a smoke on this app")
        rc, o = run(wait=1)
        check(rc == 2 and "is still held by pid 2, a smoke on this app" in o and past not in o, "cand held: %s %s" % (rc, o))
        hp.kill()
        hp.wait()

        # a holder that ends within the wait: it says so, waits, then goes through
        hold(os.path.join(world, "locks", "world"), 2, "pid 3, a short run")
        t0 = time.time()
        rc, o = run(wait=30)
        check(rc == 2 and "held by pid 3, a short run; waiting" in o and past in o and "gave up" not in o and time.time() - t0 >= 1,
              "short holder: %s %s" % (rc, o))
    finally:
        for p in holders:
            try:
                os.killpg(p.pid, 9)
            except (ProcessLookupError, PermissionError):
                p.kill()
        shutil.rmtree(t, ignore_errors=True)
    for f in FAILS:
        print("FAIL", f)
    print("cand_lock_test: %s" % ("ok" if not FAILS else "%d failed" % len(FAILS)))
    return 1 if FAILS else 0


if __name__ == "__main__":
    sys.exit(main())
