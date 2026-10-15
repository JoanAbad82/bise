#!/usr/bin/env python3
"""The words ratchet (debt-audit pick 2, docs/issues/29-ui-words-live-once.md; issue 29): a test
reads a UI word by its key (tests/words.py's w(), the desktop's generated words_<area>.gen.ts),
never as a literal, so a word designer changes moves every test with it.

A literal string in tests/*_tmux.py or apps/desktop/tests/** is a word when it is one of the
catalog's (tests/words/*.gen.json, generated from rust/proto/src/words/):
  - it equals a word with no arg (of 4 characters or more: "ok", "✓", "send" are test data too);
  - or it fills a template whole, each {arg} as any text (a template with 6 fixed characters or
    more: "you: {said}" would match any test message).
Python files are read with ast (every str constant but docstrings), the desktop's .ts/.tsx/.js/
.mjs/.mts with a small tokenizer ('…', "…", `…` without ${}, comments skipped).

tests/word_literals.txt ("<count> <path>", sorted by path) holds the words left as literals, a
ratchet like tests/line_limits.txt:
  - a file's count never goes past its line, and a drop lowers its line in the same commit (the
    line goes at 0, or when the file is gone);
  - vs the base (GATE_BASE, default HEAD) a count goes up, or a path comes in, only by literals
    of keys the change adds to the catalog: the chunk that moves a word may leave another
    area's tests to that area's chunk, counted here. A rename keeps its count.

  python3 tests/word_lint.py <changed path>...   the changed test files (gate.sh quick); every
                                                 file when the catalog changed
  python3 tests/word_lint.py --all               every test file (gate.sh full)
  python3 tests/word_lint.py --why <path>        each word literal of a file, and its key
  python3 tests/word_lint.py --self-test         the rules on synthetic data

Exit 1 with one line per problem.
"""
import ast
import glob
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIST = "tests/word_literals.txt"
WORDS_DIR = "tests/words"
CATALOG_PREFIXES = ("tests/words/", "rust/proto/src/words/")
JS_EXTS = (".ts", ".tsx", ".js", ".mjs", ".mts")
MIN_PLAIN = 4
MIN_FIXED = 6
RULE = "read it by its key: tests/words.py's w()/w_re(), or the desktop's words_<area>.gen.ts"


def in_scope(path):
    """A test file the ratchet reads. Pure."""
    if path.startswith("tests/") and path.count("/") == 1 and path.endswith("_tmux.py"):
        return True
    return path.startswith("apps/desktop/tests/") and path.endswith(JS_EXTS)


# ---- the catalog's matchers

def matchers(catalog):
    """[(key, plain words or None, compiled regex or None)] of {key: {text, args, one}}. Pure."""
    out = []
    for key, e in sorted(catalog.items()):
        for form in [e["text"]] + ([e["one"]] if e.get("one") else []):
            pieces = re.split(r"\{[a-z_][a-z0-9_]*\}", form)
            if len(pieces) == 1:
                if len(form) >= MIN_PLAIN:
                    out.append((key, form, None))
            elif len("".join(pieces)) >= MIN_FIXED:
                out.append((key, None, re.compile("(?s)" + ".+?".join(re.escape(p) for p in pieces))))
    return out


def word_of(lit, ms):
    """The key a literal is the words of, or None. Pure."""
    for key, plain, rx in ms:
        if (plain is not None and lit == plain) or (rx is not None and rx.fullmatch(lit)):
            return key
    return None


def read_catalog(text_of):
    """{key: entry} from the area files; text_of(name) -> text of tests/words/<name>."""
    cat = {}
    for name, text in text_of():
        cat.update({k: v for k, v in json.loads(text).items() if k != "_"})
    return cat


def tree_catalog():
    def files():
        for p in sorted(glob.glob(os.path.join(ROOT, WORDS_DIR, "*.gen.json"))):
            with open(p, encoding="utf-8") as f:
                yield os.path.basename(p), f.read()
    return read_catalog(files)


def base_catalog():
    """The catalog at GATE_BASE (default HEAD); {} when it has none."""
    base = os.environ.get("GATE_BASE", "HEAD")
    r = subprocess.run(["git", "-C", ROOT, "ls-tree", "--name-only", base, WORDS_DIR + "/"], capture_output=True, text=True)
    names = [n for n in r.stdout.split() if n.endswith(".gen.json")] if r.returncode == 0 else []

    def files():
        for n in names:
            s = subprocess.run(["git", "-C", ROOT, "show", "%s:%s" % (base, n)], capture_output=True, text=True)
            if s.returncode == 0:
                yield n, s.stdout
    return read_catalog(files)


# ---- literals

def py_literals(src):
    """Every str constant of a Python source but its docstrings. Pure."""
    tree = ast.parse(src)
    docs = set()
    for node in ast.walk(tree):
        body = getattr(node, "body", None)
        if isinstance(body, list) and body and isinstance(body[0], ast.Expr) and isinstance(body[0].value, ast.Constant):
            docs.add(id(body[0].value))
    return [n.value for n in ast.walk(tree) if isinstance(n, ast.Constant) and isinstance(n.value, str) and id(n) not in docs]


_ESC = {"n": "\n", "t": "\t", "r": "\r", "0": "\0", "\\": "\\", "'": "'", '"': '"', "`": "`"}


def js_literals(src):
    """The plain string literals of a JS/TS source: quoted strings and templates without ${}. Pure."""
    out, i, n = [], 0, len(src)

    def string(i, q):
        """(text, end, plain) of the literal opening at src[i] == q."""
        buf, i, plain = [], i + 1, True
        while i < n and src[i] != q:
            c = src[i]
            if c == "\\" and i + 1 < n:
                nx = src[i + 1]
                if nx == "u" and src[i + 2:i + 3] == "{":
                    j = src.find("}", i)
                    buf.append(chr(int(src[i + 3:j], 16)))
                    i = j + 1
                    continue
                if nx == "u":
                    buf.append(chr(int(src[i + 2:i + 6], 16)))
                    i += 6
                    continue
                buf.append(_ESC.get(nx, nx))
                i += 2
                continue
            if q == "`" and c == "$" and src[i + 1:i + 2] == "{":
                plain = False
                i = skip_code(i + 2, "}")
                continue
            if q != "`" and c == "\n":
                break
            buf.append(c)
            i += 1
        return "".join(buf), i + 1, plain

    def skip_code(i, close):
        """The index after the `close` that ends the code from i (literals inside are kept)."""
        depth = 0
        while i < n:
            c = src[i]
            if c in "'\"`":
                text, i, plain = string(i, c)
                if plain:
                    out.append(text)
                continue
            if src.startswith("//", i):
                i = src.find("\n", i) if "\n" in src[i:] else n
                continue
            if src.startswith("/*", i):
                j = src.find("*/", i + 2)
                i = n if j < 0 else j + 2
                continue
            if c == "{":
                depth += 1
            elif c == "}":
                if depth == 0 and close == "}":
                    return i + 1
                depth -= 1
            i += 1
        return n

    skip_code(0, None)
    return out


def literals(path, src):
    try:
        return py_literals(src) if path.endswith(".py") else js_literals(src)
    except (SyntaxError, ValueError):
        return []


def hits(path, src, ms):
    """[(literal, key)] of a file's word literals. Pure."""
    out = []
    for lit in literals(path, src):
        key = word_of(lit, ms)
        if key:
            out.append((lit, key))
    return out


# ---- the list

def parse(text):
    """({path: count}, [bad rows]). Pure."""
    caps, bad = {}, []
    for n, row in enumerate(text.splitlines(), 1):
        row = row.strip()
        if not row or row.startswith("#"):
            continue
        parts = row.split()
        if len(parts) != 2 or not parts[0].isdigit():
            bad.append("%s:%d: '%s': want '<count> <path>'" % (LIST, n, row))
        elif parts[1] in caps:
            bad.append("%s:%d: %s is listed twice" % (LIST, n, parts[1]))
        else:
            caps[parts[1]] = int(parts[0])
    return caps, bad


def check_files(found, caps):
    """found: {path: [(literal, key)], or None when gone}. Pure."""
    out = []
    for path in sorted(found):
        hs, cap = found[path], caps.get(path)
        if hs is None:
            if cap is not None:
                out.append("%s: gone: remove its line from %s" % (path, LIST))
            continue
        n = len(hs)
        if n > (cap or 0):
            shown = ", ".join("%r (%s)" % h for h in hs[:4]) + (" …" if n > 4 else "")
            out.append("%s: %d word literals, over its %d in %s: %s; %s" % (path, n, cap or 0, LIST, shown, RULE))
        elif cap is not None and n == 0:
            out.append("%s: no word literal left: remove its line from %s" % (path, LIST))
        elif cap is not None and n < cap:
            out.append("%s: %d word literals, under its %d: lower its line in %s to %d" % (path, n, cap, LIST, n))
    return out


def check_list(caps, base, new_keys_hits):
    """The list only shrinks vs base, except by hits on keys new in this change
    (new_keys_hits: {path: count}). Pure."""
    if base is None:
        return []
    out = []
    left = sorted((base[p] for p in base if p not in caps), reverse=True)
    for path in sorted(caps):
        allowed = base.get(path, 0) + new_keys_hits.get(path, 0)
        if path not in base and caps[path] <= new_keys_hits.get(path, 0):
            continue
        if path in base:
            if caps[path] > allowed:
                out.append("%s: %s raised from %d to %d: the list only shrinks (a raise is only for keys this change adds): %s"
                           % (LIST, path, base[path], caps[path], RULE))
        elif left and left[0] >= caps[path] - new_keys_hits.get(path, 0):
            left.pop(0)
        else:
            out.append("%s: %s is new in the list: the list only shrinks (a new line is only for keys this change adds): %s"
                       % (LIST, path, RULE))
    return out


def base_list():
    r = subprocess.run(["git", "-C", ROOT, "show", "%s:%s" % (os.environ.get("GATE_BASE", "HEAD"), LIST)], capture_output=True)
    return parse(r.stdout.decode())[0] if r.returncode == 0 else None


def read(path):
    try:
        with open(os.path.join(ROOT, path), encoding="utf-8") as f:
            return f.read()
    except (FileNotFoundError, IsADirectoryError, NotADirectoryError, UnicodeDecodeError):
        return None


def tracked_tests():
    files = subprocess.run(["git", "-C", ROOT, "ls-files", "tests", "apps/desktop/tests"], capture_output=True, text=True).stdout.split()
    return [p for p in files if in_scope(p)]


def check(paths, audit=False):
    try:
        with open(os.path.join(ROOT, LIST)) as f:
            caps, bad = parse(f.read())
    except FileNotFoundError:
        caps, bad = {}, ["%s: missing" % LIST]
    catalog = tree_catalog()
    base_cat = base_catalog()
    ms = matchers(catalog)
    new_ms = matchers({k: v for k, v in catalog.items() if k not in base_cat})
    catalog_changed = any(p.startswith(CATALOG_PREFIXES) for p in paths)
    todo = set(p for p in paths if in_scope(p))
    if audit or catalog_changed or LIST in paths:
        todo |= set(tracked_tests()) | set(caps)
    found, fresh = {}, {}
    for path in todo:
        src = read(path)
        found[path] = None if src is None else hits(path, src, ms)
        if src is not None and new_ms:
            fresh[path] = len(hits(path, src, new_ms))
    return bad + check_files(found, caps) + check_list(caps, base_list(), fresh)


def self_test():
    wrong = []

    def want(what, got, expected):
        if got != expected:
            wrong.append("%s: got %r, want %r" % (what, got, expected))
    cat = {
        "a.inbox": {"text": "in the inbox", "args": [], "one": None},
        "a.ok": {"text": "ok", "args": [], "one": None},
        "a.thread": {"text": "in {agent}'s thread", "args": ["agent"], "one": None},
        "a.you": {"text": "you: {said}", "args": ["said"], "one": None},
        "a.left": {"text": "{n} rows left", "args": ["n"], "one": "{n} row left"},
    }
    ms = matchers(cat)
    want("plain", word_of("in the inbox", ms), "a.inbox")
    want("plain part", word_of("the inbox", ms), None)
    want("short plain", word_of("ok", ms), None)
    want("template", word_of("in main's thread", ms), "a.thread")
    want("template no arg", word_of("in 's thread", ms), None)
    want("short template", word_of("you: ship it", ms), None)
    want("plural one", word_of("1 row left", ms), "a.left")
    want("plural other", word_of("12 rows left", ms), "a.left")
    want("scope tmux", in_scope("tests/tui_cards_tmux.py"), True)
    want("scope e2e", in_scope("tests/approvals_e2e.py"), False)
    want("scope desktop", in_scope("apps/desktop/tests/checks/inbox/a.spec.ts"), True)
    want("scope desktop src", in_scope("apps/desktop/src/inbox/past.test.ts"), False)
    py = '"""doc: in the inbox"""\ndef f():\n    """in the inbox"""\n    assert "in the inbox" in s\n    x = f"in {a}\'s thread"\n'
    want("py", py_literals(py), ["in the inbox", "in ", "'s thread"])
    js = "// 'in the inbox'\n/* \"in the inbox\" */ const a = 'in the inbox'; const b = `in ${x + 'q'}'s thread`; const c = \"it\\'s\\n\";\nconst d = `plain`;"
    want("js", js_literals(js), ["in the inbox", "q", "it's\n", "plain"])
    want("js unicode", js_literals("'\\u2713 a\\u{1F600}'"), ["✓ a\U0001F600"])
    want("hits", hits("tests/x_tmux.py", 'a = "in the inbox"\nb = "in perf\'s thread"\nc = "hello"\n', ms),
         [("in the inbox", "a.inbox"), ("in perf's thread", "a.thread")])
    want("parse", parse("# c\n3 tests/a_tmux.py\nx\n1 tests/a_tmux.py\n"),
         ({"tests/a_tmux.py": 3}, ["%s:3: 'x': want '<count> <path>'" % LIST, "%s:4: tests/a_tmux.py is listed twice" % LIST]))
    h = [("in the inbox", "a.inbox")]
    caps = {"a": 2}
    want("same", check_files({"a": h * 2}, caps), [])
    want("more", "over its 2" in check_files({"a": h * 3}, caps)[0], True)
    want("unlisted", "over its 0" in check_files({"b": h}, caps)[0], True)
    want("unlisted clean", check_files({"b": []}, caps), [])
    want("fewer", "lower its line" in check_files({"a": h}, caps)[0], True)
    want("none left", "remove its line" in check_files({"a": []}, caps)[0], True)
    want("gone", "gone" in check_files({"a": None}, caps)[0], True)
    base = {"a": 3, "b": 2}
    want("list same", check_list(dict(base), base, {}), [])
    want("list shrank", check_list({"a": 1}, base, {}), [])
    want("list raised", len(check_list({"a": 4, "b": 2}, base, {})), 1)
    want("list raised by new keys", check_list({"a": 4, "b": 2}, base, {"a": 1}), [])
    want("list new", len(check_list({"a": 3, "b": 2, "c": 1}, base, {})), 1)
    want("list new by new keys", check_list({"a": 3, "b": 2, "c": 1}, base, {"c": 1}), [])
    want("list rename", check_list({"a2": 3, "b": 2}, base, {}), [])
    want("list rename bigger", len(check_list({"a2": 4, "b": 2}, base, {})), 1)
    want("list no base", check_list({"x": 9}, None, {}), [])
    if wrong:
        raise SystemExit("word-lint self-test failed:\n  " + "\n  ".join(wrong))


def main():
    self_test()
    args = sys.argv[1:]
    if args == ["--self-test"]:
        print("word-lint: self-test ok")
        return
    if args[:1] == ["--why"]:
        ms = matchers(tree_catalog())
        for path in args[1:]:
            for lit, key in hits(path, read(path) or "", ms):
                print("%s: %r  ->  %s" % (path, lit, key))
        return
    audit = args == ["--all"]
    problems = check(tracked_tests() if audit else args, audit)
    if problems:
        print("\n".join(problems))
        sys.exit(1)


if __name__ == "__main__":
    main()
