#!/usr/bin/env python3
"""The agents split's two facts that are not laws (bend/laws/agents.bend's
header, architect m_34135): after every event, St.agents' names come in
St.order's order, and every name of both sides is in St.order.

    agents_split_check.py [<journal.jsonl>...]

Compiles bend/tests/agents-split-check.bend once, then replays a generated
journal (archives, restores, renames of live and archived agents, a reused
archived name, a rename to an archived agent's old name) and each journal
given (a COPY of a real one: the file is only read), and fails when an event
leaves a name out of place. Heavy for a big journal (minutes of CPU): run it
through ~/.bise/run/heavy-run.
"""
import json
import os
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def generated():
    """A journal that moves agents across the split every way it can."""
    evs = []

    def task(n):
        evs.append({"type": "task_created", "name": n, "parent": "main", "brief": {"objective": n}, "ws": {"mode": "shared", "path": "/w"}, "at_ms": len(evs)})

    def life(n, l):
        evs.append({"type": "lifecycle", "name": n, "lifecycle": l, "reason": "test"})

    def ren(n, nn):
        evs.append({"name": n, "new_name": nn, "type": "renamed"})

    for n in ["a", "b", "c", "d", "e", "f"]:
        task(n)
    life("b", "archived")
    life("d", "archived")
    life("a", "stopped")
    life("b", "active")          # restored: back between main and c
    life("f", "archived")
    life("c", "archived")
    life("d", "stopped")         # restored after its later peers
    ren("e", "e2")               # a live rename
    ren("f", "f2")               # an archived rename
    life("f2", "active")
    life("a", "archived")
    task("a")                    # an older journal: a reused archived name
    life("e2", "archived")
    task("g")
    ren("g", "e")                # the archived e2's old name
    life("c", "stopped")
    life("missing", "archived")  # no such agent
    for n in ["b", "d", "f2", "a", "e"]:
        life(n, "archived")
    for n in ["e", "a", "b"]:
        life(n, "active")
    return evs


def main():
    with tempfile.TemporaryDirectory() as tmp:
        binary = os.path.join(tmp, "agents-split-check")
        subprocess.run(["bend", os.path.join(ROOT, "bend/tests/agents-split-check.bend"), "-o", binary], check=True)
        gen = os.path.join(tmp, "generated.jsonl")
        with open(gen, "w") as f:
            for e in generated():
                f.write(json.dumps(e) + "\n")
        failed = False
        for path in [gen] + sys.argv[1:]:
            out = subprocess.run([binary], env=dict(os.environ, SPLIT_JOURNAL=path), capture_output=True, text=True).stdout.strip()
            head = out.splitlines()[0] if out else "no output"
            ok = head.startswith("events ") and head.split()[3] == "0" and head.split()[1] != "0"
            print("%s %s: %s" % ("ok  " if ok else "FAIL", os.path.basename(path), out if not ok else head))
            failed |= not ok
        sys.exit(1 if failed else 0)


main()
