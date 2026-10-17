#!/usr/bin/env python3
"""dev/plugins/ambient-qa/as-he-does/cand.sh's locks (main m_30102), on fake data only.

A throwaway HOME (its ~/.bise/gate/real-shape world and ~/.bise/gate/locks) and a stand-in app
folder with no executable: past its locks cand.sh stops at once ('no <its main>', exit 2), before
any world, app or gate. A holder is a `lockf <lock> sleep` with its .holder line. Checks: free, it
goes past the locks and writes its own holder lines; the world held, or the candidate's path held
from another world, it says the holder in one line and gives up after CAND_LOCK_WAIT with exit 2,
never past the lock; a holder that ends within the wait lets it through. Nothing of his is touched.

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
CAND = os.path.join(ROOT, "dev", "plugins", "ambient-qa", "as-he-does", "cand.sh")
FAILS = []


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
        os.makedirs(world)
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
            for _ in range(50):
                if subprocess.run(["/usr/bin/lockf", "-t", "0", base + ".lock", "true"], capture_output=True).returncode == 75:
                    return p
                time.sleep(0.1)
            raise AssertionError("the holder never took " + base)

        past = "no %s/Contents/MacOS/" % app
        # free: past both locks (its own check stops it), its holder lines written
        rc, o = run()
        check(rc == 2 and past in o and "held by" not in o, "free: %s %s" % (rc, o))
        for base in (os.path.join(world, "world"), cand_lock):
            check(open(base + ".holder").read().startswith("pid ") and app in open(base + ".holder").read(), "free: holder " + base)

        # the world held: one line naming it, gives up, never past the lock
        p = hold(os.path.join(world, "world"), 30, "pid 1 since then, out other-run, app other.app")
        rc, o = run(wait=1)
        check(rc == 2 and "world is held by pid 1 since then, out other-run" in o and "gave up after 1 s" in o and past not in o,
              "world held: %s %s" % (rc, o))
        p.kill()
        p.wait()

        # the candidate's path held (a smoke in another world): the same
        p = hold(cand_lock, 30, "pid 2, a smoke on this app")
        rc, o = run(wait=1)
        check(rc == 2 and "is held by pid 2, a smoke on this app" in o and "gave up" in o and past not in o, "cand held: %s %s" % (rc, o))
        p.kill()
        p.wait()

        # a holder that ends within the wait: it says so, waits, then goes through
        hold(os.path.join(world, "world"), 2, "pid 3, a short run")
        t0 = time.time()
        rc, o = run(wait=30)
        check(rc == 2 and "held by pid 3, a short run; waiting" in o and past in o and "gave up" not in o and time.time() - t0 >= 1,
              "short holder: %s %s" % (rc, o))
    finally:
        for p in holders:
            p.kill()
        shutil.rmtree(t, ignore_errors=True)
    for f in FAILS:
        print("FAIL", f)
    print("cand_lock_test: %s" % ("ok" if not FAILS else "%d failed" % len(FAILS)))
    return 1 if FAILS else 0


if __name__ == "__main__":
    sys.exit(main())
