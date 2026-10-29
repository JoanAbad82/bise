"""The candidate lock, the one dev/plugins/ambient-qa/as-he-does/cand.sh takes for its pass on a
candidate app (main m_30102): ~/.bise/gate/locks/cand-<sha16 of the app's resolved path>.lock (a
flock, as /usr/bin/lockf takes it), with its .holder line. desktop_try.py's --promote holds it while
it moves the candidate's root out and deletes the candidate dir (promote-lock: keep-current's
promote of 400fbd1eb deleted the bundle release-45's quick pass ran, 10.9's nightly went red). And
`users(dir)`: the processes running from a dir, so a dir in use is never deleted.

Tested in tests/desktop_try_test.py (candidate_then_promote, cand_users).
"""
import contextlib
import fcntl
import hashlib
import os
import subprocess
import time


class Busy(Exception):
    """The lock stayed held past the wait: the message names its holder."""


def lock_base(home, app):
    """cand.sh's CAND_LOCK for `app`: the sha256 of its resolved path (`cd "$A" && pwd -P`), 16 hex."""
    a = os.path.realpath(app)
    return os.path.join(home, ".bise", "gate", "locks", "cand-" + hashlib.sha256(a.encode()).hexdigest()[:16])


def holder(base):
    try:
        with open(base + ".holder") as f:
            return f.read().strip() or "an unknown run"
    except OSError:
        return "an unknown run"


@contextlib.contextmanager
def held(home, app, who, wait, say):
    """Holds `app`'s candidate lock for the block. Busy: one line naming its holder, then a wait of
    up to `wait` s, then Busy. lockf without -k unlinks the file when it lets go: a lock on an
    unlinked file is no lock, so it is taken again on the file that is there."""
    base = lock_base(home, app)
    path = base + ".lock"
    os.makedirs(os.path.dirname(path), exist_ok=True)
    deadline, told = time.monotonic() + wait, False
    while True:
        fd = os.open(path, os.O_CREAT | os.O_RDWR, 0o644)
        try:
            fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            os.close(fd)
            if time.monotonic() >= deadline:
                raise Busy("%s is held by %s: gave up after %g s; wait for that pass, or stop it by its pid (kill <pid>), never by name"
                           % (path, holder(base), wait))
            if not told:
                say("%s is held by %s; waiting up to %g s" % (path, holder(base), wait))
                told = True
            time.sleep(0.5)
            continue
        try:
            same = os.fstat(fd).st_ino == os.stat(path).st_ino
        except FileNotFoundError:
            same = False
        if same:
            break
        os.close(fd)
    try:
        with open(base + ".holder", "w") as f:
            f.write("pid %d since %s, %s\n" % (os.getpid(), time.strftime("%F %T"), who))
        yield
    finally:
        os.close(fd)


def users(d):
    """(pid, command) of every process whose command runs from under `d` (its resolved path or
    the given one), but this one. Read only."""
    pres = {p.rstrip("/") + "/" for p in (d, os.path.realpath(d))}
    out = subprocess.run(["ps", "-axww", "-o", "pid=,command="], capture_output=True, text=True).stdout
    found = []
    for l in out.splitlines():
        pid, _, cmd = l.strip().partition(" ")
        if pid.isdigit() and int(pid) != os.getpid() and any(cmd.startswith(p) for p in pres):
            found.append((int(pid), cmd))
    return found
