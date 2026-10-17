#!/usr/bin/env python3
"""The desktop pick's shadow never hurts its caller (fast-try p2, review-gates m_29412 #8).

tests/desktop_pick_shadow.sh, on fake data: a test_map.py that crashes, one that hangs past the
bound, one that answers ALL and one that picks: always exit 0, one line, within its bound. And
gate.sh land calls it guarded (`|| true`) only where the land reaches the desktop. The pick's own
rules are tests/test_map.py --self-test's.

  python3 -B tests/desktop_pick_test.py
"""
import os
import shutil
import subprocess
import sys
import tempfile
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHADOW = os.path.join(ROOT, "tests", "desktop_pick_shadow.sh")
FAILS = []


def check(name, ok, detail=""):
    print(("ok   " if ok else "FAIL ") + name + ("" if ok else ": " + detail))
    if not ok:
        FAILS.append(name)


def run(fake_py, timeout="20"):
    """The shadow with a fake python (DESKTOP_PICK_PY): (rc, output, seconds)."""
    d = tempfile.mkdtemp(prefix="pick-")
    try:
        py = os.path.join(d, "py")
        with open(py, "w") as fh:
            fh.write("#!/bin/bash\n" + fake_py + "\n")
        os.chmod(py, 0o755)
        t = time.monotonic()
        r = subprocess.run(["bash", SHADOW, "land", "HEAD~1", "HEAD"], capture_output=True, text=True,
                           env={**os.environ, "DESKTOP_PICK_PY": py, "DESKTOP_PICK_TIMEOUT": timeout})
        return r.returncode, r.stdout.strip(), time.monotonic() - t
    finally:
        shutil.rmtree(d, ignore_errors=True)


def main():
    rc, out, _ = run("echo boom >&2; exit 3")
    check("a crash: exit 0, said", rc == 0 and "failed" in out, "%d %r" % (rc, out))
    rc, out, secs = run("exec sleep 30", timeout="1")
    check("a hang: exit 0 within its bound", rc == 0 and "no answer in 1 s" in out and secs < 10, "%d %r %.1f" % (rc, out, secs))
    rc, out, _ = run("echo 'ALL no coverage map'")
    check("ALL: said, exit 0", rc == 0 and "ALL (no coverage map)" in out, "%d %r" % (rc, out))
    rc, out, _ = run("printf 'PICK 2\\na\\nb\\n'")
    check("a pick: its count, exit 0", rc == 0 and "2 checks would run" in out, "%d %r" % (rc, out))
    rc, out, _ = run("echo garbage")
    check("an odd answer: exit 0", rc == 0 and "no answer" in out, "%d %r" % (rc, out))
    r = subprocess.run(["bash", SHADOW], capture_output=True, text=True)
    check("no argument: exit 0, its usage", r.returncode == 0 and "usage" in r.stdout, r.stdout)
    # gate.sh land: only where the land reaches the desktop, never its rc
    with open(os.path.join(ROOT, "tests", "gate.sh")) as fh:
        gate = fh.read()
    line = '[ -n "$dwhy" ] && { tests/desktop_pick_shadow.sh land "$base" "$head" || true; }'
    check("gate.sh land calls it guarded", line in gate, "missing: " + line)
    if FAILS:
        sys.exit("desktop_pick_test: %d failed: %s" % (len(FAILS), ", ".join(FAILS)))
    print("desktop_pick_test: ok")


if __name__ == "__main__":
    main()
