#!/usr/bin/env python3
"""gate.sh's process sweep never kills the processes around a gate that runs
inside a test (release-52 m_39422: on 01b295218 the tip gate's e2e pool got
a SIGTERM twice while land_every_e2e ran a land check, i.e. gate.sh land in
a test worktree; it passed alone).

The shape: the pool (run_all's xargs, its tests) shares one process group.
A test's land check starts gate.sh in a group of its own (the hub's
process_group(0)). An orphan in the pool's group running one of the
worktree's binaries matched gate_procs, which killed it and its whole
group: the pool. Two guards, both checked here on gate.sh's own functions:
- gate_procs never kills a group that holds one of its callers (an
  ancestor): the match dies alone; an unrelated orphan's group still goes.
- gate_nested: a gate under a live gate (BISE_GATE_RUN + BISE_GATE_START)
  is nested, and gate.sh then skips its sweep of dead runs and orphans.

GATE_SH=<path> runs it against another gate.sh (main's before the fix fails).
"""
import os
import re
import signal
import subprocess
import sys
import tempfile

import wait

HERE = os.path.dirname(os.path.abspath(__file__))
GATE = os.environ.get("GATE_SH") or os.path.join(HERE, "gate.sh")
fails = []


def check(ok, what):
    print(("ok   " if ok else "FAIL ") + what)
    if not ok:
        fails.append(what)


def functions(names):
    """The named shell functions of gate.sh, as text to source."""
    src = open(GATE).read()
    out = []
    for n in names:
        m = re.search(r"^%s\(\) \{.*?^\}$" % re.escape(n), src, re.S | re.M)
        if not m:
            m = re.search(r"^%s\(\) \{[^\n]*\}$" % re.escape(n), src, re.M)  # a one-line function
        if m:
            out.append(m.group(0))
    return "\n".join(out) + "\n"


def wait_file(path, n=1):
    """The words of `path` once it exists with at least n of them (wait.until:
    20 s times the load factor)."""
    def words():
        if os.path.exists(path):
            w = open(path).read().split()
            return (w,) if len(w) >= n else None
        return None
    return wait.until(words, 20, "the file %s" % path, poll=0.05)[0]


def pgid(p):
    try:
        return os.getpgid(int(p))
    except ProcessLookupError:
        return None


def main():
    tmp = tempfile.mkdtemp(prefix="gsweep-")
    fn = os.path.join(tmp, "fn.sh")
    with open(fn, "w") as f:
        f.write(functions(["proc_start", "gate_procs", "gate_nested"]))
    bin_ = os.path.join(tmp, "target", "debug", "bise")
    def script(name, text):
        path = os.path.join(tmp, name)
        with open(path, "w") as f:
            f.write(text)
        return path
    # the caller: a group of its own, like the hub's land check (process_group(0)),
    # then gate_procs' orphan sweep as gate.sh runs it at its start
    own = script("own.py", "import os, sys\nos.setpgid(0, 0)\nos.execvp(sys.argv[1], sys.argv[1:])\n")
    caller = script("caller.sh", 'source %s; gate_procs /bise-gate-none/ "" "%s" >"$1.tmp"; mv "$1.tmp" "$1"\n'
                    % (fn, bin_))
    hub2 = script("hub2.sh", 'python3 %s bash %s out2; sleep 300\n' % (own, caller))
    other = script("other.sh", "sleep 300 & echo $! >other_child; wait\n")
    pool = script("pool.sh", '''cd %(tmp)s
( exec -a "pool-sibling" sleep 300 ) & echo $! >sib
# an orphan of the worktree's bise in the pool's group (a neighbour test's hub)
( ( exec -a "%(bin)s sbd --workspace x" sleep 300 ) & echo $! >orphan )
# a caller under the pool (case 1) and one under an orphan hub of the pool (case 2)
python3 %(own)s bash %(caller)s out1
( ( exec -a "%(bin)s sbd --workspace y" bash %(hub2)s ) & echo $! >hub2 )
# an unrelated orphan in a group of its own, with a child: its group still goes
python3 %(own)s bash -c '( ( exec -a "%(bin)s sbd --workspace z" bash %(other)s ) & echo $! >other )'
sleep 300
''' % {"tmp": tmp, "bin": bin_, "own": own, "caller": caller, "hub2": hub2, "other": other})
    p = subprocess.Popen(["bash", pool], preexec_fn=os.setpgrp)
    groups = {p.pid}
    try:
        sib = wait_file(os.path.join(tmp, "sib"))[0]
        orphan = wait_file(os.path.join(tmp, "orphan"))[0]
        out1 = wait_file(os.path.join(tmp, "out1"), 0)
        hub2 = wait_file(os.path.join(tmp, "hub2"))[0]
        wait_file(os.path.join(tmp, "out2"), 0)
        other = wait_file(os.path.join(tmp, "other"))[0]
        child = wait_file(os.path.join(tmp, "other_child"))[0]
        groups.add(pgid(other))
        # out1 was written before 'other' existed: rerun case 1's sweep now
        subprocess.run(["python3", own, "bash", caller, os.path.join(tmp, "out3")], cwd=tmp)
        out1 = open(os.path.join(tmp, "out1")).read().split()
        out2 = open(os.path.join(tmp, "out2")).read().split()
        out3 = open(os.path.join(tmp, "out3")).read().split()
        check(orphan in out1, "a caller inside the pool: the matched orphan goes (%s in %s)" % (orphan, out1))
        check(sib not in out1 and str(p.pid) not in out1,
              "a caller inside the pool: the pool around it stays (sibling %s, pool %s, killed %s)" % (sib, p.pid, out1))
        check(sib not in out2 and str(p.pid) not in out2 and hub2 not in out2,
              "a caller under an orphan hub of the pool: the pool and the hub stay (killed %s)" % out2)
        check(orphan in out2, "a caller under an orphan hub: the other orphan still goes")
        check(other in out3 and child in out3,
              "an orphan in an unrelated group: it goes with its group (%s, %s in %s)" % (other, child, out3))
        # a caller outside the pool (a top-level gate): the pool is no caller of
        # it, so a matched orphan there still takes its group, as before
        check(sib in out3, "a caller outside the pool: a matched orphan's group still goes whole (%s in %s)"
              % (sib, out3))
        # gate_nested
        start = subprocess.run(["bash", "-c", "source %s; proc_start %s" % (fn, sib)], capture_output=True,
                               text=True).stdout.strip()

        def nested(**env):
            e = {k: v for k, v in os.environ.items() if k not in ("BISE_GATE_RUN", "BISE_GATE_START")}
            e.update(env)
            return subprocess.run(["bash", "-c", "source %s; gate_nested" % fn], env=e, capture_output=True,
                                  text=True).stdout.strip()
        check(nested(BISE_GATE_RUN=sib, BISE_GATE_START=start) == sib, "under a live gate: nested (%r)" % start)
        check(nested() == "", "no outer gate: not nested")
        check(nested(BISE_GATE_RUN=sib, BISE_GATE_START="Mon_Jan_1_00:00:00_2001") == "",
              "a reused pid (another start time): not nested")
        check(nested(BISE_GATE_RUN=sib) == "", "no start time: not nested")
        check(nested(BISE_GATE_RUN="999999", BISE_GATE_START=start) == "", "a dead outer gate: not nested")
        # the wiring in gate.sh: a nested gate skips both sweeps and its exit's orphan sweep
        src = open(GATE).read()
        check('nested="$(gate_nested)"' in src and '[ -f "$root/.git" ] && [ -z "$nested" ]' in src
              and '[ -z "$nested" ] && [ -d "$d" ] || continue' in src and "BISE_GATE_START=" in src,
              "gate.sh: a nested gate sweeps no dead run and no orphan binary; every gate exports its start")
    finally:
        for g in groups:
            if g:
                try:
                    os.killpg(g, signal.SIGKILL)
                except (ProcessLookupError, PermissionError):
                    pass
        subprocess.run(["pkill", "-9", "-f", tmp], capture_output=True)
        subprocess.run(["rm", "-rf", tmp])
    if fails:
        print("gate_sweep_test: FAIL (%d)" % len(fails))
        sys.exit(1)
    print("gate_sweep_test: ok (a gate in a test never kills the pool around it)")


if __name__ == "__main__":
    main()
