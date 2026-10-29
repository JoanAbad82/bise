"""The UI words for the tests, by key (debt-audit pick 2, docs/issues/29-ui-words-live-once.md).

The words live once in bise_proto::words (rust/proto/src/words/<area>.rs); tests/words/<area>.gen.json
is their generated copy. A test waits for and asserts words by key, never by a literal, so a word
designer changes moves every test with it:

    from words import w, w_re
    t.wait_for(w("inbox.where_thread", agent="main"))       # 'in main's thread'
    t.wait_re(w_re("inbox.answered_at", place=w("inbox.where_inbox")))   # 'you: <anything> · in the inbox'

w(key, **args): the words, every arg given (a plural picks its `one` form when n is 1); an unknown
key, a missing or an extra arg raises. w_re(key, **args): a regex (str) for the words, the args not
given as `.+?`. Pure, the JSON read once.
"""
import glob
import json
import os
import re

DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "words")
_CATALOG = None


def catalog():
    """{key: {"text", "args", "one"}} of every area."""
    global _CATALOG
    if _CATALOG is None:
        cat = {}
        for path in sorted(glob.glob(os.path.join(DIR, "*.gen.json"))):
            with open(path, encoding="utf-8") as f:
                cat.update({k: v for k, v in json.load(f).items() if k != "_"})
        _CATALOG = cat
    return _CATALOG


def _entry(key):
    try:
        return catalog()[key]
    except KeyError:
        raise KeyError(f"no word {key!r} in tests/words (rust/proto/src/words/)") from None


def _form(e, args):
    if e["one"] is not None and str(args.get("n")) == "1":
        return e["one"]
    return e["text"]


def _pieces(template):
    """[(literal, hole or None)] of a template."""
    out, pos = [], 0
    for m in re.finditer(r"\{([a-z_][a-z0-9_]*)\}", template):
        out.append((template[pos:m.start()], m.group(1)))
        pos = m.end()
    out.append((template[pos:], None))
    return out


def w(key, **args):
    e = _entry(key)
    want, got = set(e["args"]), set(args)
    if want != got:
        raise TypeError(f"{key}: args {sorted(want)}, given {sorted(got)}")
    return "".join(lit + (str(args[h]) if h else "") for lit, h in _pieces(_form(e, args)))


def w_re(key, **args):
    e = _entry(key)
    extra = set(args) - set(e["args"])
    if extra:
        raise TypeError(f"{key}: no arg {sorted(extra)} (args {e['args']})")
    if e["one"] is not None and "n" not in args:
        forms = [e["one"], e["text"]]
    else:
        forms = [_form(e, args)]

    def one(t):
        return "".join(re.escape(lit) + ((re.escape(str(args[h])) if h in args else ".+?") if h else "") for lit, h in _pieces(t))

    return one(forms[0]) if len(forms) == 1 else "(?:" + "|".join(one(f) for f in forms) + ")"


def self_test():
    cat = {
        "t.plain": {"text": "in the inbox", "args": [], "one": None},
        "t.agent": {"text": "in {agent}'s thread", "args": ["agent"], "one": None},
        "t.left": {"text": "{n} rows left", "args": ["n"], "one": "{n} row left"},
    }
    global _CATALOG
    keep, _CATALOG = _CATALOG, cat
    try:
        assert w("t.plain") == "in the inbox"
        assert w("t.agent", agent="main") == "in main's thread"
        assert w("t.left", n=1) == "1 row left" and w("t.left", n=3) == "3 rows left"
        assert re.fullmatch(w_re("t.agent"), "in perf's thread")
        assert not re.fullmatch(w_re("t.agent", agent="main"), "in perf's thread")
        assert re.fullmatch(w_re("t.left"), "1 row left") and re.fullmatch(w_re("t.left"), "4 rows left")
        for bad in (lambda: w("t.agent"), lambda: w("t.plain", x=1), lambda: w("nope"), lambda: w_re("t.plain", x=1)):
            try:
                bad()
            except (TypeError, KeyError):
                continue
            raise AssertionError("should raise")
    finally:
        _CATALOG = keep
    # the real catalog reads
    assert w("inbox.where_thread", agent="old") == "in old's thread", w("inbox.where_thread", agent="old")
    print("words.py self-test ok")


if __name__ == "__main__":
    self_test()
