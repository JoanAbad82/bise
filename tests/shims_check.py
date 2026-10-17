#!/usr/bin/env python3
"""The compatibility shims have an end date (issue 31): tests/shims.txt is the one list of the
live shims, each with its owner and its removal release. This check reads it against the code
and the release tags.

Red everywhere (land included: the lander caused it):
  - a TODO(<tag>) whose comment says it goes in a later release ("one release", "release
    after", "next release", "removed in v…") with no line for <tag> in shims.txt;
  - a line whose tag is on no TODO(<tag>) site (stale: the shim went, its line stayed);
  - a line that doesn't parse (4 tab-separated fields, a release tag as the release).
Red in quick, full and the nightly, a warning in land (--land: an unrelated lander didn't cause
it, its owner gets the red at their next quick gate):
  - a line whose removal release is out: the highest release tag of its kind merged into HEAD
    (v<YYYY.M.D>[-N] for the terminal, desktop-v<YYYY.M.N> for the app; the tags the release
    scripts make: packaging/publish-release.sh, scripts/desktop_release.py) is at or past it.
    No tag of that kind in this clone (a shallow one): said, not red.

  python3 tests/shims_check.py [--land]   the tree vs tests/shims.txt and the tags
  python3 tests/shims_check.py --self-test  planted cases, each red where it must be
"""
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
FILE = os.path.join(HERE, "shims.txt")
# where a shim lives (the quick gate's map: rust/, apps/desktop/src/, bend/, tests/, scripts/)
DIRS = ["rust", "apps/desktop/src", "bend", "tests", "scripts"]
# this check and its list name tags in their own words
SKIP = {"tests/shims_check.py", "tests/shims.txt"}
TODO = re.compile(r"TODO\(([^),]+)")
# a comment that says the code goes in a later release
LATER = re.compile(r"one release|release after|next release|later release|(?:goes|removed|drop\w*) in (?:desktop-)?v\d", re.I)
RELEASE = re.compile(r"^(desktop-)?v(\d{4})\.(\d+)\.(\d+)(?:-(\d+))?$")
# a TODO's comment: its line and the next ones (a wrapped comment)
CONTEXT = 2
MARK = re.compile(r"^\s*(?://[/!]?|#|\*|--)?\s*")


def release_key(tag):
    """(kind, (Y, M, D, N)) of a release tag, kind 'v' or 'desktop-v'; None when it isn't one.
    A bare tag is its day's first release (N=1). Pure."""
    m = RELEASE.match(tag.strip())
    if not m:
        return None
    return ("desktop-v" if m.group(1) else "v"), (int(m.group(2)), int(m.group(3)), int(m.group(4)), int(m.group(5) or 1))


def parse(text):
    """[(line number, tag, owner, release, what)]; a malformed line raises ValueError with its number."""
    out = []
    for n, line in enumerate(text.splitlines(), 1):
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        parts = line.split("\t")
        if len(parts) != 4 or not all(p.strip() for p in parts):
            raise ValueError(f"shims.txt:{n}: want <tag>\\t<owner>\\t<removal release>\\t<what>, got {line!r}")
        tag, owner, rel, what = (p.strip() for p in parts)
        if release_key(rel) is None:
            raise ValueError(f"shims.txt:{n}: {rel!r} is not a release tag (v<YYYY.M.D>[-N] or desktop-v<YYYY.M.N>)")
        out.append((n, tag, owner, rel, what))
    return out


def todos(files):
    """{tag: [(path, line number, says it goes later)]} from {path: text}. Pure."""
    found = {}
    for path, text in files.items():
        lines = text.splitlines()
        for i, line in enumerate(lines):
            for m in TODO.finditer(line):
                # the comment's words, its markers (// /// //! # * --) out
                ctx = " ".join([line[m.start():]] + [MARK.sub("", l) for l in lines[i + 1:i + 1 + CONTEXT]])
                found.setdefault(m.group(1).strip(), []).append((path, i + 1, bool(LATER.search(ctx))))
    return found


def current(tags):
    """{kind: (key, tag)} the highest release tag of each kind among `tags`. Pure."""
    best = {}
    for t in tags:
        k = release_key(t)
        if k is not None and (k[0] not in best or k[1] > best[k[0]][0]):
            best[k[0]] = (k[1], t)
    return best


def check(registry, files, tags):
    """(reds, overdue, notes): the lines that make it red everywhere, the overdue ones, and what
    it couldn't check. `registry` the text of shims.txt, `files` {path: text}, `tags` the release
    tags merged into HEAD. Pure."""
    reds, overdue, notes = [], [], []
    try:
        lines = parse(registry)
    except ValueError as e:
        return [str(e)], [], []
    found = todos(files)
    listed = {tag for _, tag, _, _, _ in lines}
    for tag, sites in sorted(found.items()):
        later = [s for s in sites if s[2]]
        if later and tag not in listed:
            where = ", ".join(f"{p}:{n}" for p, n, _ in later)
            reds.append(f"TODO({tag}) says it goes in a later release but has no line in tests/shims.txt ({where}): add <tag>\\t<owner>\\t<removal release>\\t<what>")
    now = current(tags)
    for n, tag, owner, rel, what in lines:
        sites = found.get(tag, [])
        if not sites:
            reds.append(f"shims.txt:{n}: {tag} is on no TODO({tag}) site (stale: the shim went, remove its line)")
            continue
        kind, key = release_key(rel)
        if kind not in now:
            notes.append(f"shims.txt:{n}: no {kind}* release tag here: {tag}'s release {rel} not checked")
            continue
        if now[kind][0] >= key:
            where = ", ".join(f"{p}:{ln}" for p, ln, _ in sites)
            overdue.append(f"shim {tag} ({owner}) was due in {rel} and {now[kind][1]} is out: remove it ({what}); sites: {where}")
    return reds, overdue, notes


def tree_files():
    """{path: text} of the tracked text files under DIRS that name a TODO(."""
    r = subprocess.run(["git", "grep", "-l", "-I", "-F", "TODO(", "--"] + DIRS, cwd=ROOT, capture_output=True, text=True)
    out = {}
    for p in r.stdout.split():
        if p in SKIP:
            continue
        try:
            with open(os.path.join(ROOT, p), encoding="utf-8", errors="replace") as f:
                out[p] = f.read()
        except OSError:
            pass
    return out


def tree_tags():
    r = subprocess.run(["git", "tag", "--list", "v*", "desktop-v*", "--merged", "HEAD"], cwd=ROOT, capture_output=True, text=True)
    return r.stdout.split()


def self_test():
    reg = "# head\n\nold\tamb-mac\tv2026.10.2-38\ta bundle's id=root\nnew\tarchitect\tdesktop-v2026.10.9\tthe parts' text\n"
    files = {
        "rust/a.rs": "// TODO(old): drop it one release after the fix\nfn a() {}\n",
        "apps/desktop/src/b.ts": "// TODO(new): the text beside parts goes\n// the release after the window ships\n",
        "rust/c.rs": "// TODO(lost): goes one release after X\n",
        "rust/d.rs": "// TODO(notif-open, architect m_1): an Anchor once office lands\n",
    }
    tags = ["v2026.10.2-39", "v2026.10.2-40", "desktop-v2026.10.4", "desktop-beta", "v2026.10.2"]
    reds, overdue, notes = check(reg, files, tags)
    # a later-release TODO without a line: red; a TODO that names no release: not one
    assert len(reds) == 1 and "TODO(lost)" in reds[0] and "rust/c.rs:1" in reds[0], reds
    # due at -38, -40 out: overdue, its sites named; the desktop one is not due yet
    assert len(overdue) == 1 and "shim old (amb-mac) was due in v2026.10.2-38 and v2026.10.2-40 is out" in overdue[0] and "rust/a.rs:1" in overdue[0], overdue
    assert notes == [], notes
    # at its release exactly: overdue; one before: not
    assert check(reg, files, ["v2026.10.2-37", "desktop-v2026.10.9"])[1][0].startswith("shim new (architect) was due in desktop-v2026.10.9"), "at its release"
    assert check(reg, files, ["v2026.10.2-37", "desktop-v2026.10.8"])[1] == [], "before its release"
    # a wrapped comment: the words two lines down count
    assert todos({"x.rs": "// TODO(w): this one\n// goes the release\n// after the window\n"})["w"][0][2]
    # stale: a line whose tag is on no site
    reds, _, _ = check(reg, {"rust/a.rs": files["rust/a.rs"]}, tags)
    assert any("shims.txt:4: new is on no TODO(new) site" in r for r in reds), reds
    # malformed lines, a release that isn't a tag
    for bad, want in [("a\tb\tc\n", "shims.txt:1: want"), ("a\tb\t-41\tw\n", "is not a release tag")]:
        reds, _, _ = check(bad, files, tags)
        assert len(reds) == 1 and want in reds[0], (bad, reds)
    # no tag of that kind (a shallow clone): said, not red
    _, overdue, notes = check(reg, files, [])
    assert overdue == [] and len(notes) == 2, (overdue, notes)
    # release order: N counts, a bare tag is N=1, desktop-* apart
    assert release_key("v2026.10.2") < release_key("v2026.10.2-2") < release_key("v2026.10.10")
    assert current(["v2026.10.2-9", "v2026.10.2-10", "desktop-v2026.10.4", "desktop-latest"]) == {"v": ((2026, 10, 2, 10), "v2026.10.2-10"), "desktop-v": ((2026, 10, 4, 1), "desktop-v2026.10.4")}
    # an empty list on a tree without later-release TODOs: green
    assert check("# only a header\n", {"rust/d.rs": files["rust/d.rs"]}, tags) == ([], [], [])
    print("shims_check self-test: ok")


def main(argv):
    if "--self-test" in argv:
        self_test()
        return 0
    land = "--land" in argv
    with open(FILE, encoding="utf-8") as f:
        registry = f.read()
    reds, overdue, notes = check(registry, tree_files(), tree_tags())
    for n in notes:
        print("shims_check: " + n)
    for o in overdue:
        print(("shims_check: warning: " if land else "shims_check: FAIL ") + o)
    for r in reds:
        print("shims_check: FAIL " + r)
    if reds or (overdue and not land):
        return 1
    print("shims_check: ok (%d live shims in tests/shims.txt)" % len(parse(registry)))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
