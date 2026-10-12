#!/usr/bin/env python3
"""pick_gate: no new Bool.pick that walks a list (issue 21, architect m_19654).

`Bool.pick(T, c, a, b)` computes both `a` and `b` before it picks one.
When one branch calls the def it is in and the other stops (a lookup or
a map: find, map_agent), the walk goes to the end of the list whatever
the hit, and the stopping branch's work runs on each element too: a
lookup that should stop at its hit costs the whole list (model.bend's map_agent made a boot of his hub
replay 529 agents at each agent event: 72.8 s, 11.2 s with a `match`).
Write the walk with a `match` on the condition (model.bend
`map_agent.go`: the hit is a parameter, computed on the tail).

The check: every `def` in bend/ whose body has a Bool.pick with a call to
that same def in one branch and not the other. A filter (both branches
call it on the tail) is not one: the runtime shares the call, measured
linear (a 26-element filter in 0.06 s, issue 21). The ones left today are in
tests/pick_gate.list, `<file>:<def>`, a ratchet: a def not listed fails,
a listed def that is gone (fixed, renamed, deleted) must leave the list in
the same commit. The list only shrinks.

    python3 tests/pick_gate.py          # check (the quick gate runs it)
    python3 tests/pick_gate.py --list   # print what it finds, one per line
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIST = os.path.join(ROOT, "tests", "pick_gate.list")
DIRS = ["bend"]
DEF = re.compile(r"^def\s+([A-Za-z_][\w.]*)\s*\(")


def picks(text):
    """The argument text of each `Bool.pick(...)` in `text`."""
    i = 0
    while True:
        i = text.find("Bool.pick(", i)
        if i < 0:
            return
        j, depth = i + len("Bool.pick("), 1
        while j < len(text) and depth:
            depth += {"(": 1, ")": -1}.get(text[j], 0)
            j += 1
        yield text[i + len("Bool.pick("):j - 1]
        i = j


def args(text):
    """The top-level comma-separated arguments of a call's text."""
    out, depth, cur = [], 0, ""
    for ch in text:
        if ch in "([{<":
            depth += 1
        elif ch in ")]}>" and depth:
            depth -= 1
        if ch == "," and depth == 0:
            out.append(cur)
            cur = ""
        else:
            cur += ch
    return out + [cur]


def stops_early(call, pick):
    """A lookup or a map written with Bool.pick: one branch calls the def
    (the walk goes on), the other does not (the walk would stop there).
    A filter, both branches on the tail, costs no more than its match."""
    a = args(pick)
    if len(a) != 4:
        return False
    return bool(call.search(a[2])) != bool(call.search(a[3]))


def walks(path):
    """The defs of a .bend file with a Bool.pick that would stop at a hit
    but walks on: one branch calls the def itself, the other does not."""
    found, name, body = [], None, []

    def close():
        if name is None:
            return
        call = re.compile(r"(?<![\w.])" + re.escape(name) + r"\s*\(")
        if any(stops_early(call, a) for a in picks("\n".join(body))):
            found.append(name)

    for line in open(path, encoding="utf-8"):
        m = DEF.match(line)
        if m:
            close()
            name, body = m.group(1), []
        elif name is not None:
            body.append(line.split("#", 1)[0])
    close()
    return found


def scan():
    out = []
    for d in DIRS:
        for dirpath, dirnames, files in os.walk(os.path.join(ROOT, d)):
            dirnames[:] = sorted(x for x in dirnames if not x.startswith("."))
            for f in sorted(files):
                if f.endswith(".bend"):
                    p = os.path.join(dirpath, f)
                    rel = os.path.relpath(p, ROOT)
                    out += ["%s:%s" % (rel, n) for n in walks(p)]
    return out


def main():
    found = scan()
    if "--list" in sys.argv:
        print("\n".join(found))
        return 0
    listed = [l.strip() for l in open(LIST, encoding="utf-8") if l.strip() and not l.startswith("#")]
    new = [f for f in found if f not in listed]
    gone = [l for l in listed if l not in found]
    for f in new:
        print("FAIL pick_gate: %s: a Bool.pick stops in one branch and calls its own def in the other: the walk never stops "
              "(Bool.pick computes both branches). Write the walk with a match (model.bend map_agent.go); "
              "tests/pick_gate.py says why." % f)
    for l in gone:
        print("FAIL pick_gate: %s is in tests/pick_gate.list but no longer walks with Bool.pick: "
              "take it out of the list (it only shrinks)." % l)
    if new or gone:
        return 1
    print("ok   pick_gate (%d listed walks left)" % len(listed))
    return 0


if __name__ == "__main__":
    sys.exit(main())
