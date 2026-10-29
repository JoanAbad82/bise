#!/usr/bin/env python3
"""The REPL reads a long line in time linear in its length (big-msg-perf).

runtime/repl-core.bend reads its socket 4096 bytes at a time. It appended
each recv to the unfinished line and split the whole line again: a 2 MB
`say` (a long paste, a big tool output) cost ~318e9 instructions, minutes,
before its provider call. runtime/repl-core-pure.bend's feed keeps the
line as its pieces and joins them once.

The probe (tests/repl_read_cost_probe.bend, compiled native) feeds a line
of 64 and of 256 chunks of 4096 chars through feed. It counts retired
instructions (/usr/bin/time -l), never wall time, so the load of the
machine does not move it: 4x the chunks must cost under 6x the
instructions (linear ~4x, the old quadratic path ~16x).

python3 -u tests/repl_read_cost.py
"""
import os, re, shutil, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
SMALL, BIG, LIMIT = 64, 256, 6.0


def cost(exe, chunks):
    """(the probe's output, its retired instructions)"""
    r = subprocess.run(["/usr/bin/time", "-l", exe], env=dict(os.environ, PROBE_CHUNKS=str(chunks)),
                       capture_output=True, text=True, timeout=600)
    m = re.search(r"(\d+)\s+instructions retired", r.stderr)
    return r.stdout.strip(), int(m.group(1)) if m else None


def main():
    if sys.platform != "darwin":
        print("SKIP repl_read_cost: /usr/bin/time -l counts instructions on macOS only")
        return 0
    bend = shutil.which("bend") or os.path.expanduser("~/.bend/bin/bend")
    if not os.path.exists(bend):
        print("SKIP repl_read_cost: no bend compiler")
        return 0
    tmp = tempfile.mkdtemp(prefix="sb-read-cost-")
    exe = os.path.join(tmp, "probe")
    c = subprocess.run([bend, "repl_read_cost_probe.bend", "-o", exe], cwd=HERE, capture_output=True, text=True)
    if not os.path.exists(exe):
        print("FAIL repl_read_cost: the probe did not compile\n" + c.stdout[-2000:] + c.stderr[-2000:])
        return 1
    fails = []
    got = {}
    for n in (SMALL, BIG):
        out, ins = cost(exe, n)
        got[n] = ins
        # one command, "say " and the n chunks of 4096 chars
        if out != "1 %d" % (4 + 4096 * n):
            fails.append("%d chunks: the probe printed %r, want '1 %d'" % (n, out, 4 + 4096 * n))
        if ins is None:
            fails.append("%d chunks: no instruction count from /usr/bin/time -l" % n)
    shutil.rmtree(tmp, ignore_errors=True)
    if not fails:
        ratio = got[BIG] / got[SMALL]
        print("%d chunks: %.3gG instructions, %d chunks: %.3gG (x%.1f for x%d the line)"
              % (SMALL, got[SMALL] / 1e9, BIG, got[BIG] / 1e9, ratio, BIG // SMALL))
        if ratio >= LIMIT:
            fails.append("x%.1f the instructions for x%d the line (limit x%g): the read is not linear"
                         % (ratio, BIG // SMALL, LIMIT))
    for f in fails:
        print("FAIL " + f)
    print("PASS repl_read_cost" if not fails else "FAIL repl_read_cost")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
