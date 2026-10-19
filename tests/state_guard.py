#!/usr/bin/env python3
"""sb-core's records are declared once (state-schema, debt-audit #1): bise_proto::core::state
declares them, core_gen writes their types, getters and setters into bend/hub/gen/state.bend,
and nothing else builds or opens one by position. So a new field is one line and a bless, never
a pass over every pattern.

Red when, outside bend/hub/gen/:
  - a generated record is built or opened by position: `<A>.<Rec>{` where <A> is the file's
    alias of gen/state.bend (a pattern or a construction alike);
  - a hand `type <Rec> is Data:` in bend/hub/ has a generated record's name and is not in
    MIGRATING below (its family moved to the generated one: the hand twin goes, rule 7);
  - a hand record (a type with one constructor of its own name, with fields) is declared in
    bend/hub/ and is in neither HAND nor MIGRATING: a new record needs its declaration in
    bise_proto::core::state.
Both lists only shrink (a family's land takes its names out of MIGRATING).

  python3 tests/state_guard.py              the tree
  python3 tests/state_guard.py --self-test  planted cases, each red where it must be
"""
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
GEN = "bend/hub/gen/state.bend"
DIRS = ["bend/hub", "bend/laws", "bend/proofs"]

# the generated records whose family has not moved yet: their hand type and
# its positional patterns stay until that family's land (state-schema
# chunk 2), which takes its names out of this list
MIGRATING = {
    # Card + Ans
    "Card", "Ans",
    # Msg + MRec
    "Msg", "MRec",
    # Agent
    "Agent",
    # St
    "St",
    # timers and wakes ("Ended": timers.bend's and wakes.bend's, declared
    # as TimerEnd and WatchEnd)
    "Timer", "TimerEnd", "Tms", "Act", "Watch", "WatchEnd", "Wakes", "Ended",
    # xhub and gone
    "Out", "XIn", "Route", "Xs", "Item",
}

# the hand records that are not sb-core's durable state (yet): the proof
# spine (cx.bend's Core, Cx), the runtime records (cx.bend R and its
# rows: their own chunk), the journal's events and ops, the view's and
# the decisions' local records. Only shrinks.
HAND = {
    # cx.bend: the proof spine and the runtime (its own chunk)
    "Core", "Cx", "Both", "R", "Rt", "Waiter", "Steer", "Cnt", "Kv", "Kn",
    # a step's local records: core.bend's Snd, NewTask, Hub, RunR; main.bend's
    # Got; model.bend's Ms; picks.bend's Pick (inside R's answered); view.bend's Mark
    "Snd", "NewTask", "Hub", "RunR", "Got", "Ms", "Pick", "Mark",
}

TYPE = re.compile(r"^type\s+([A-Za-z_][\w.]*)(?:<[^>]*>)?\s+is\s+\w+")
CTOR = re.compile(r"^\s+([A-Z]\w*)\{(.*)\}\s*$")
IMPORT = re.compile(r"^import\s+(\S+)\s+as\s+(\w+)")


def records_of(text):
    """The records of a Bend file: types with one constructor of their own name, with fields."""
    out = []
    lines = text.splitlines()
    for i, line in enumerate(lines):
        m = TYPE.match(line)
        if not m:
            continue
        name = m.group(1)
        ctors = []
        for nxt in lines[i + 1:]:
            if nxt.strip().startswith("#") or not nxt.strip():
                if ctors:
                    break
                continue
            c = CTOR.match(nxt)
            if not c:
                # a constructor wrapped on several lines
                if nxt.startswith("  ") and ctors:
                    continue
                if nxt.startswith("  ") and re.match(r"^\s+[A-Z]\w*\{", nxt):
                    ctors.append((re.match(r"^\s+([A-Z]\w*)\{", nxt).group(1), True))
                    continue
                break
            ctors.append((c.group(1), bool(c.group(2).strip())))
        if len(ctors) == 1 and ctors[0][0] == name and ctors[0][1]:
            out.append((name, i + 1))
    return out


def gen_records(root):
    with open(os.path.join(root, GEN)) as f:
        return {n for n, _ in records_of(f.read())}


def check(root, files=None, migrating=MIGRATING, hand=HAND):
    """The guard's findings: (path, line, what)."""
    recs = gen_records(root)
    bad = []
    gen_abs = os.path.realpath(os.path.join(root, GEN))
    if files is None:
        files = []
        for d in DIRS:
            for dp, _, fs in os.walk(os.path.join(root, d)):
                for fn in fs:
                    if fn.endswith(".bend"):
                        files.append(os.path.relpath(os.path.join(dp, fn), root))
    for rel in sorted(files):
        if rel.startswith("bend/hub/gen/"):
            continue
        path = os.path.join(root, rel)
        with open(path) as f:
            text = f.read()
        aliases = []
        for line in text.splitlines():
            m = IMPORT.match(line)
            if m and os.path.realpath(os.path.join(os.path.dirname(path), m.group(1))) == gen_abs:
                aliases.append(m.group(2))
        if aliases and recs:
            pat = re.compile(r"(?<![\w.])(?:%s)\.(%s)\{" % ("|".join(map(re.escape, aliases)), "|".join(sorted(recs))))
            for n, line in enumerate(text.splitlines(), 1):
                code = line.split("#", 1)[0]
                for m in pat.finditer(code):
                    bad.append((rel, n, f"{m.group(0)} by position: use its getters, setters and empty() (gen/state.bend)"))
        if rel.startswith("bend/hub/"):
            for name, n in records_of(text):
                if name in recs and name not in migrating:
                    bad.append((rel, n, f"hand type {name}: bise_proto::core::state declares it (gen/state.bend); delete this twin"))
                elif name not in recs and name not in hand and name not in migrating:
                    bad.append((rel, n, f"new hand record {name}: declare it in bise_proto::core::state (rust/proto/src/core/state.rs) and bless"))
    return bad


def self_test():
    import tempfile
    with tempfile.TemporaryDirectory() as root:
        os.makedirs(os.path.join(root, "bend/hub/gen"))
        os.makedirs(os.path.join(root, "bend/proofs"))
        w = lambda rel, t: open(os.path.join(root, rel), "w").write(t)
        w(GEN, "type Life is Data:\n  LA{}\n  LB{}\n\ntype Msg is Data:\n  Msg{id: Nat, text: String}\n")
        w("bend/hub/a.bend", "import ./gen/state.bend as S\ndef f(m: S.Msg) -> Nat:\n  match m:\n    case S.Msg{i, t}:\n      i\n")
        w("bend/proofs/p.bend", "import ../hub/gen/state.bend as HS\ndef g() -> HS.Msg:\n  HS.Msg.empty()\n# HS.Msg{1n} in a comment\n")
        w("bend/hub/b.bend", "type Msg is Data:\n  Msg{id: Nat}\n\ntype New is Data:\n  New{x: Nat}\n\ntype Op is Data:\n  OA{}\n  OB{x: Nat}\n")
        got = check(root, migrating=set(), hand=set())
        want = [("bend/hub/a.bend", 4), ("bend/hub/b.bend", 1), ("bend/hub/b.bend", 4)]
        seen = sorted((p, n) for p, n, _ in got)
        assert seen == want, f"self-test: {seen} != {want}"
        # a family still moving: its hand twin is allowed, the new record is not
        got = check(root, migrating={"Msg"}, hand=set())
        assert sorted((p, n) for p, n, _ in got) == [("bend/hub/a.bend", 4), ("bend/hub/b.bend", 4)], got
        assert check(root, migrating={"Msg"}, hand={"New"}) == [("bend/hub/a.bend", 4, got[0][2])], "self-test: allow-lists"
    print("state_guard self-test: ok")


def main():
    if "--self-test" in sys.argv:
        self_test()
        return 0
    if not os.path.exists(os.path.join(ROOT, GEN)):
        print(f"state_guard: no {GEN} (bless core_gen)")
        return 1
    bad = check(ROOT)
    for p, n, what in bad:
        print(f"{p}:{n}: {what}")
    if bad:
        print(f"state_guard: {len(bad)} red (bise_proto::core::state, docs/issues/35)")
        return 1
    print("state_guard: ok")
    return 0


if __name__ == "__main__":
    sys.exit(main())
