#!/usr/bin/env python3
"""heavy_slot: whether this process holds one of the heavy slots (~/.bise/run/heavy.lock,
heavy2.lock), and the argv that runs a command as one heavy job. Split out of
scripts/desktop_try.py (its line cap); desktop_try imports them; tested in
tests/desktop_try_test.py."""
import os
import subprocess


HEAVY_RUN = os.path.expanduser("~/.bise/run/heavy-run")
HEAVY_LOCKS = ("heavy.lock", "heavy2.lock")


def under_heavy_slot(pid=None):
    """True when this process runs under a `lockf … heavy.lock|heavy2.lock` of its own ancestry
    (a `heavy-run` around it): taking a slot again would hold both, or wait on itself."""
    pid = pid or os.getpid()
    for _ in range(32):
        r = subprocess.run(["ps", "-o", "ppid=,command=", "-p", str(pid)], capture_output=True, text=True)
        line = r.stdout.strip()
        if not line:
            return False
        ppid, _, cmd = line.partition(" ")
        head = cmd.split(" ", 1)[0]
        if head.endswith("lockf") and any("/.bise/run/" + n in cmd for n in HEAVY_LOCKS):
            return True
        pid = int(ppid.strip() or 0)
        if pid <= 1:
            return False
    return False


def heavy_argv(cmd, lock, under=None, heavy_run=HEAVY_RUN):
    """The argv that runs `cmd` as one heavy job (main m_13151, ambient-lead m_13161): already in a
    heavy slot, at nice 10 alone (never a second slot, never nested); else through heavy-run (the
    first of its two slots that is free); else, on a Mac without heavy-run, the old single lock."""
    if under_heavy_slot() if under is None else under:
        return ["nice", "-n", "10"] + cmd
    if os.access(heavy_run, os.X_OK):
        return [heavy_run] + cmd
    return ["/usr/bin/lockf", "-k", lock, "nice", "-n", "10"] + cmd
