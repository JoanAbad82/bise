#!/usr/bin/env python3
"""heavy_slot: whether this process holds one of the heavy slots (~/.bise/run/heavy.lock,
heavy2-4.lock, or heavy-run's HEAVY_SLOT job among its ancestors), and the argv that runs a command as one heavy job. Split out of
scripts/desktop_try.py (its line cap); desktop_try imports them; tested in
tests/desktop_try_test.py."""
import os
import subprocess


HEAVY_RUN = os.path.expanduser("~/.bise/run/heavy-run")
# heavy-run's slots: heavy.lock, heavy2.lock, and heavy3/heavy4.lock on AC power (since 2026-10-18)
HEAVY_LOCKS = ("heavy.lock", "heavy2.lock", "heavy3.lock", "heavy4.lock")


def slot_pid(env=None):
    """The pid of the heavy job heavy-run says this process inherits (HEAVY_SLOT="<slot> <pid>",
    exported in each job since gate-reds), or None."""
    tail = (env if env is not None else os.environ).get("HEAVY_SLOT", "").rsplit(" ", 1)[-1]
    return int(tail) if tail.isdigit() else None


def under_heavy_slot(pid=None, env=None):
    """True when this process runs under a heavy slot of its own ancestry: a `lockf … heavy*.lock`,
    or the job pid of its HEAVY_SLOT (heavy-run's own rule, which refuses a nested call): taking a
    slot again would hold two, or wait on itself."""
    pid = pid or os.getpid()
    job = slot_pid(env)
    for _ in range(32):
        if job is not None and pid == job:
            return True
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
