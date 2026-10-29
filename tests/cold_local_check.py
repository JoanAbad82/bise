#!/usr/bin/env python3
"""step_is_local / view_is_local on real data (issue 36 chunk 5a, architect m_37415): stated, not
proven, checked here. Compiles bend/tests/cold-local.bend once, then replays a journal (a COPY of
a real one: the file is only read) and commits every input of rust/proto/fixtures/core_in.jsonl
and an answer to each open card twice: on the state, and with every cold message needs_in does
not name dropped. Red when a step's journal or need differs, or when an event it journals needs a
cold message needs_in did not name (a miss: the step would ask a second time). Effects that
differ (views of a dropped record, until the mirror reads cold ones from the store) are counted,
not red.

    cold_local_check.py <journal.jsonl> [<inputs.jsonl>]

Heavy for a big journal (minutes of CPU): run it through ~/.bise/run/heavy-run.
"""
import os
import re
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    journal = os.path.abspath(sys.argv[1])
    inputs = os.path.abspath(sys.argv[2]) if len(sys.argv) > 2 else os.path.join(ROOT, "rust/proto/fixtures/core_in.jsonl")
    with tempfile.TemporaryDirectory(dir=os.environ.get("TMPDIR")) as d:
        exe = os.path.join(d, "cold-local")
        env = dict(os.environ, BEND_NO_TELEMETRY="1")
        subprocess.run(["bend", os.path.join(ROOT, "bend/tests/cold-local.bend"), "-o", exe], check=True, env=env, cwd=ROOT)
        out = subprocess.run([exe], env=dict(env, COLD_JOURNAL=journal, COLD_INPUTS=inputs), capture_output=True, text=True).stdout
    print(out.strip())
    m = re.search(r"inputs (\d+) journal (\d+) fx (\d+) need (\d+) miss (\d+)", out)
    if not m:
        sys.exit("cold_local_check: no summary line")
    n, jr, fx, nd, ms = map(int, m.groups())
    if n == 0 or jr or nd or ms:
        sys.exit("cold_local_check: RED (%d inputs: journal %d, need %d, miss %d)" % (n, jr, nd, ms))
    print("cold_local_check: ok (%d inputs; %d effects differ: views of dropped records)" % (n, fx))


if __name__ == "__main__":
    main()
