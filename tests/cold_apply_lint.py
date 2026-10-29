#!/usr/bin/env python3
"""apply never asks for a record (issue 36 chunk 5, architect m_35902/m_37415): a cold record is
fetched before a step or a replay batch applies, never from inside. A need lives in core's X.R
(bend/hub/cx.bend R.need, core.bend's Turn); M.apply (bend/hub/model.bend) and replay_batch
(bend/hub/cold.bend) return a state, and this check says they can't reach one: no file their
imports reach (relative imports, followed) is cx.bend or core.bend, nor names R.need/with_need.

  python3 tests/cold_apply_lint.py              the tree
  python3 tests/cold_apply_lint.py --self-test  planted cases, each red where it must be
"""
import os
import re
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ROOTS = ["bend/hub/model.bend", "bend/hub/cold.bend", "bend/hub/needs.bend"]
BANNED = {"cx.bend", "core.bend"}
IMPORT = re.compile(r"^import\s+(\./\S+|\.\./\S+)", re.M)
NEED = re.compile(r"\bR\.need\b|\bwith_need\b|\bTurn\.need\b")


def reds(root, roots=ROOTS):
    out, seen, todo = [], set(), [(os.path.join(root, r), r) for r in roots]
    while todo:
        path, via = todo.pop()
        path = os.path.normpath(path)
        if path in seen or not os.path.exists(path):
            continue
        seen.add(path)
        rel = os.path.relpath(path, root)
        if os.path.basename(path) in BANNED:
            out.append("%s reaches %s (a need lives there): apply would see the runtime" % (via, rel))
            continue
        src = open(path, encoding="utf-8").read()
        if NEED.search(src):
            out.append("%s (reached from %s) names a need" % (rel, via))
        for imp in IMPORT.findall(src):
            todo.append((os.path.join(os.path.dirname(path), imp), via))
    return out


def self_test():
    with tempfile.TemporaryDirectory() as d:
        hub = os.path.join(d, "bend/hub")
        os.makedirs(hub)

        def w(name, text):
            open(os.path.join(hub, name), "w").write(text)

        w("model.bend", "import Base\nimport ./names.bend as NM\n")
        w("cold.bend", "import ./model.bend as M\n")
        w("needs.bend", "import ./model.bend as M\n")
        w("names.bend", "import Base\n")
        assert reds(d) == [], reds(d)
        w("names.bend", "import ./cx.bend as X\n")
        w("cx.bend", "def R.need(x) -> Unit:\n")
        r = reds(d)
        assert any("reaches bend/hub/cx.bend" in x for x in r), r
        w("names.bend", "def f() -> Unit:\n  X.R.with_need(r, v)\n")
        r = reds(d)
        assert any("names.bend" in x and "names a need" in x for x in r), r
    print("cold_apply_lint self-test: ok")


def main():
    if "--self-test" in sys.argv:
        return self_test()
    r = reds(ROOT)
    for x in r:
        print("cold_apply_lint: " + x)
    if r:
        sys.exit(1)
    print("cold_apply_lint: ok (apply and replay_batch reach no need)")


if __name__ == "__main__":
    main()
