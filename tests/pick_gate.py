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
that same def in one branch and not the other. The ones left today are in
tests/pick_gate.list, `<file>:<def>`, a ratchet: a def not listed fails,
a listed def that is gone (fixed, renamed, deleted) must leave the list in
the same commit. The list only shrinks.

The second check, with no list (hub-tick): a def that calls itself twice
with the same arguments in one expression. Bend is strict and does not
share the two calls: a filter written `Bool.pick(T, c, h <> f(t), f(t))`
runs f on the tail twice at every element, 2^n calls for n elements
(issue 21 read it as linear on a short list). reach.bend replies_orphan,
run at every tick over the live watches, took 70 s with 14 of them and
38 min with 23 on his hub (2026-10-17), 5 ms once computed once. It holds
for every eager call, Bool.pick, `&&`, `||` or any def taking both as
values; only LZ.pick's `u => ...` branches are lazy. Compute the call
once (`+rest = f(t)`) or match on the condition.

The third check, with no list, on bend/hub only (sb-core; bend-perf,
page bend-perf): a search, a def whose result is a Maybe or a Bool,
that calls itself inside a Bool.pick, a `&&` or a `||`. Each computes
both sides, so the search walks to the end of the list after its hit:
model.bend str_in, `String.eq(h, s) || str_in(t, s)`, compared every
name of the list at every message of a Tick (35 ms on his hub,
2026-10-17). Put the call in a thunk: lazy.bend's LZ.pick, LZ.or, LZ.and
(`LZ.or(String.eq(h, s), u => str_in(t, s))`) apply only the side they
take. Known outside bend/hub, not checked yet (bend-perf follow-up):
bend/core/ev.bend delivered, bend/runtime/gate-pure.bend verdict_lines,
bend/vendor/json.bend get_kv, bend/vendor/http/dns/dns.bend name.skip,
bend/vendor/http/json/json.bend hex4.go, bend/laws/hub.bend any_queued
and all_due.

    python3 tests/pick_gate.py              # check (the quick gate runs it)
    python3 tests/pick_gate.py --list       # print what it finds, one per line
    python3 tests/pick_gate.py --self-test  # the doubled-call and search checks on planted defs
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIST = os.path.join(ROOT, "tests", "pick_gate.list")
DIRS = ["bend"]
SEARCH_DIRS = [os.path.join("bend", "hub")]
# hub/lazy.bend's lazy forms (LZ, or HLZ in the proofs): their thunks run only when taken
LAZY = re.compile(r"(?<![\w.])H?LZ\.(?:pick|or|and)\(")
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


def logical_lines(body):
    """A def body's lines, a statement split over lines (an open paren)
    joined into one."""
    out, cur, depth = [], "", 0
    for line in body:
        cur += " " + line.strip() if cur else line.strip()
        depth += line.count("(") - line.count(")")
        if depth <= 0:
            out.append(cur)
            cur, depth = "", 0
    return out + ([cur] if cur else [])


def self_calls(name, text):
    """The argument text of each call of `name` in `text`."""
    call = re.compile(r"(?<![\w.])" + re.escape(name) + r"\(")
    for m in call.finditer(text):
        j, depth = m.end(), 1
        while j < len(text) and depth:
            depth += {"(": 1, ")": -1}.get(text[j], 0)
            j += 1
        yield text[m.end():j - 1].replace(" ", "")


def both_branches(name, text):
    """A Bool.pick in `text` whose two branches both call `name`, with any
    arguments: both run, so 2^n calls too (land.bend nub.go, issue 37 #3:
    `Bool.pick(T, c, f(t, seen), h <> f(t, h <> seen))`)."""
    call = re.compile(r"(?<![\w.])" + re.escape(name) + r"\s*\(")
    for p in picks(text):
        a = args(p)
        if len(a) == 4 and call.search(a[2]) and call.search(a[3]):
            return True
    return False


def doubled_defs(lines):
    """The defs of a .bend file's lines that call themselves twice with
    the same arguments in one statement (LZ.pick's lazy branches aside)."""
    found, name, body = [], None, []

    def close():
        if name is None:
            return
        for l in logical_lines(body):
            if LAZY.search(l):
                continue
            calls = list(self_calls(name, l))
            if len(calls) != len(set(calls)) or both_branches(name, l):
                found.append(name)
                return

    for line in lines:
        m = DEF.match(line)
        if m:
            close()
            name, body = m.group(1), []
        elif line.strip() and not line[0].isspace():
            # a law, a type, an import: the def's body ended
            close()
            name, body = None, []
        elif name is not None:
            body.append(code_of(line))
    close()
    return found


def code_of(line):
    """A line without its comment (a `#` outside a string literal)."""
    quoted = False
    for i, ch in enumerate(line):
        if ch == '"' and (i == 0 or line[i - 1] != "\\"):
            quoted = not quoted
        elif ch == "#" and not quoted:
            return line[:i] + "\n"
    return line


THUNK = re.compile(r"^\s*\w+\s*=>")


def unthunked(text):
    """`text` with the thunk arguments of LZ.pick, LZ.or and LZ.and
    (`u => ...`, run only when taken) blanked out."""
    out, i = "", 0
    for m in LAZY.finditer(text):
        if m.start() < i:
            continue
        j, depth = m.end(), 1
        while j < len(text) and depth:
            depth += {"(": 1, ")": -1}.get(text[j], 0)
            j += 1
        kept = [" _" if THUNK.match(a) else a for a in args(text[m.end():j - 1])]
        out += text[i:m.end()] + unthunked(",".join(kept)) + ")"
        i = j
    return out + text[i:]


def returns_search(sig):
    """A def line's result type is a Maybe or a Bool."""
    ret = sig.rsplit("->", 1)[1].strip().rstrip(":").strip() if "->" in sig else ""
    return ret == "Bool" or ret.startswith("Maybe<")


def eager_searches(lines):
    """The defs of a .bend file's lines with a Maybe or Bool result that call
    themselves inside a Bool.pick, a `&&` or a `||` (not in a thunk)."""
    found, name, sig, body = [], None, "", []

    def close():
        if name is None or not returns_search(sig):
            return
        call = re.compile(r"(?<![\w.])" + re.escape(name) + r"\s*\(")
        for l in logical_lines(body):
            l = unthunked(l)
            if not call.search(l):
                continue
            if any(call.search(a) for a in picks(l)) or "&&" in l or "||" in l:
                found.append(name)
                return

    for line in lines:
        m = DEF.match(line)
        if m:
            close()
            name, sig, body = m.group(1), code_of(line), []
        elif line.strip() and not line[0].isspace():
            close()
            name, body = None, []
        elif name is not None:
            body.append(code_of(line))
    close()
    return found


SEARCH_SELF_TEST = [
    # (lines, the defs the search check must find)
    ("""def find(xs: L, +k: K) -> Maybe<&2, A>:
  match xs:
    case Con{+h, +t}:
      Bool.pick(Maybe<&2, A>, eq(h, k), Some{h}, find(t, k))
""", ["find"]),
    ("""def str_in(xs: L, +s: String) -> Bool:
  match xs:
    case Con{+h, +t}:
      String.eq(h, s) || str_in(t, s)
""", ["str_in"]),
    ("""def all_in(xs: L, +ys: L) -> Bool:
  match xs:
    case Con{+h, +t}:
      nat_in(ys, h) && all_in(t, ys)
""", ["all_in"]),
    ("""def q(xs: L, +id: Nat) -> Maybe<&2, Nat>:
  match xs:
    case Con{+c, +t}:
      Bool.pick(Maybe<&2, Nat>, hit(c, id),
        Some{c}, q(t, id))
""", ["q"]),
    ("""def find(xs: L, +k: K) -> Maybe<&2, A>:
  match xs:
    case Con{+h, +t}:
      LZ.pick(Maybe<&2, A>, eq(h, k), u => Some{h}, u => find(t, k))
""", []),
    ("""def str_in(xs: L, +s: String) -> Bool:
  match xs:
    case Con{+h, +t}:
      LZ.or(String.eq(h, s), u => str_in(t, s))
""", []),
    ("""def any_work(xs: L, +now: Nat) -> Bool:
  match xs:
    case Con{+h, +t}:
      LZ.or(due(h, now) || late(h, now), u => any_work(t, now))
""", []),
    ("""def rt_find(xs: L, +n: String) -> Bool:
  match xs:
    case Con{+h, +t}:
      LZ.pick(Bool, String.eq(h, n), u => True{}, u => rt_find(t, n))
""", []),
    # a list result is the ratchet's (walks); a Bool of other calls is no search
    ("""def put(xs: L, +x: A) -> List<&2, A>:
  match xs:
    case Con{+h, +t}:
      Bool.pick(List<&2, A>, eq(h, x), x <> t, h <> put(t, x))
""", []),
    ("""def ok(+a: A) -> Bool:
  is_x(a) || is_y(a)
""", []),
]


SELF_TEST = [
    # (lines, the defs it must find)
    ("def f(xs: L) -> L:\n  match xs:\n    case Con{+h, +t}:\n      Bool.pick(L, c(h), h <> f(t), f(t))\n", ["f"]),
    ("def g.go(xs: L) -> Nat:\n  match xs:\n    case Con{+h, +t}:\n      Bool.pick(Nat, c(h),\n        (1n + g.go(t) : Nat), g.go(t))\n", ["g.go"]),
    ("def any(xs: L) -> Bool:\n  match xs:\n    case Con{+h, +t}:\n      any(t) || (c(h) && any(t))\n", ["any"]),
    ("def nub.go(xs: L, +seen: L) -> L:\n  match xs:\n    case Con{+h, +t}:\n      Bool.pick(L, in(seen, h), nub.go(t, seen), h <> nub.go(t, h <> seen))\n", ["nub.go"]),
    ("def f(xs: L) -> L:\n  match xs:\n    case Con{+h, +t}:\n      +rest = f(t)\n      Bool.pick(L, c(h), h <> rest, rest)\n", []),
    ("def f(xs: L) -> L:\n  match xs:\n    case Con{+h, +t}:\n      LZ.pick(L, c(h), u => h <> f(t), u => f(t))\n", []),
    ("def f(xs: L, ys: L) -> L:\n  match xs:\n    case Con{+h, +t}:\n      g(f(t, ys), f(ys, t))\n", []),
    ("def f(xs: L) -> L:\n  match xs:\n    case Nil{}:\n      f2(t)\n    case Con{+h, +t}:\n      f(t)\n", []),
    ("def f(xs: L) -> L:\n  match xs:\n    case Con{+h, +t}:\n      g(h, \"#\", f(t))\n    case Nil{}:\n      f(t)\n", []),
    ("def h(x: N) -> N:\n  x\n\nlaw h_twice:\n  {h(1n) == h(1n) : N}\n", []),
]


def self_test():
    bad = 0
    for text, want in SELF_TEST:
        got = doubled_defs(text.splitlines(True))
        if got != want:
            print("FAIL pick_gate self-test: found %s, want %s in:\n%s" % (got, want, text))
            bad += 1
    for text, want in SEARCH_SELF_TEST:
        got = eager_searches(text.splitlines(True))
        if got != want:
            print("FAIL pick_gate self-test (searches): found %s, want %s in:" % (got, want))
            print(text)
            bad += 1
    if not bad:
        print("ok   pick_gate self-test (%d planted defs)" % (len(SELF_TEST) + len(SEARCH_SELF_TEST)))
    return 1 if bad else 0


def bend_files():
    for d in DIRS:
        for dirpath, dirnames, files in os.walk(os.path.join(ROOT, d)):
            dirnames[:] = sorted(x for x in dirnames if not x.startswith("."))
            for f in sorted(files):
                if f.endswith(".bend"):
                    yield os.path.join(dirpath, f)


def doubled():
    out = []
    for p in bend_files():
        with open(p, encoding="utf-8") as f:
            out += ["%s:%s" % (os.path.relpath(p, ROOT), n) for n in doubled_defs(f)]
    return out


def searches():
    out = []
    for p in bend_files():
        rel = os.path.relpath(p, ROOT)
        if any(rel.startswith(d + os.sep) for d in SEARCH_DIRS):
            with open(p, encoding="utf-8") as f:
                out += ["%s:%s" % (rel, n) for n in eager_searches(f)]
    return out


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
    if "--self-test" in sys.argv:
        return self_test()
    found = scan()
    twice = doubled()
    for d in twice:
        print("FAIL pick_gate: %s calls itself twice with the same arguments in one expression: Bend computes both, "
              "2^n calls on a list of n (Bool.pick, && and || take both values). Compute it once (+rest = f(t)) "
              "or match on the condition; tests/pick_gate.py says why." % d)
    eager = searches()
    for d in eager:
        print("FAIL pick_gate: %s is a search (a Maybe or Bool result) that calls itself inside a Bool.pick, && or ||: "
              "both sides run, so it walks to the end of the list after its hit. Put the call in a thunk "
              "(lazy.bend: LZ.pick, LZ.or, LZ.and, `u => %s(t, ..)`); tests/pick_gate.py says why."
              % (d, d.rsplit(":", 1)[1]))
    if "--list" in sys.argv:
        found += ["%s (twice)" % d for d in twice] + ["%s (search)" % d for d in eager]
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
    if new or gone or twice or eager:
        return 1
    print("ok   pick_gate (%d listed walks left)" % len(listed))
    return 0


if __name__ == "__main__":
    sys.exit(main())
