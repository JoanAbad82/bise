#!/usr/bin/env python3
"""scripts/cargo_mtimes.py: a fresh checkout's unchanged files get their last build's mtime back,
a changed one stays fresh, and a failed build forgets everything.

  - the pure parts: git ls-files -s parsing (regular files only), the manifest's round trip,
    the plan (same blob: its recorded mtime; another blob or a new file: nothing);
  - a real git repo checked out twice: the second run gives the unchanged file its first run's
    mtime and leaves the changed one fresh; a failed command deletes the manifest.

No cargo: the command is `true` or `false`.

  python3 -B tests/cargo_mtimes_test.py
"""
import os
import subprocess
import sys
import tempfile
import time

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(REPO, "scripts"))
import cargo_mtimes as C  # noqa: E402

fails = 0


def check(name, ok, detail=""):
    global fails
    print(("ok   " if ok else "FAIL ") + name + ("" if ok else "  " + str(detail)))
    if not ok:
        fails += 1


def test_pure():
    out = "\x00".join(["100644 aaa 0\trust/a.rs", "100755 bbb 0\tscripts/x.sh",
                        "120000 ccc 0\tlink", "160000 ddd 0\tsub", ""])
    files = C.parse_ls_files(out)
    check("ls-files: regular files only", files == {"rust/a.rs": "aaa", "scripts/x.sh": "bbb"}, files)
    text = C.format_manifest(files, {"rust/a.rs": 5, "scripts/x.sh": 7})
    check("manifest round trip", C.parse_manifest(text) == {"rust/a.rs": ("aaa", 5), "scripts/x.sh": ("bbb", 7)}, text)
    check("a bad manifest line is skipped", C.parse_manifest("x\ty\tz\nbroken\n") == {})
    m = {"rust/a.rs": ("aaa", 5), "rust/b.rs": ("old", 6)}
    p = C.plan({"rust/a.rs": "aaa", "rust/b.rs": "new", "rust/c.rs": "ccc"}, m)
    check("plan: the same blob only", p == {"rust/a.rs": 5}, p)


def git(cwd, *a):
    subprocess.run(["git", "-C", cwd, "-c", "commit.gpgsign=false"] + list(a), check=True, capture_output=True)


def test_checkouts():
    with tempfile.TemporaryDirectory() as d:
        repo, target = os.path.join(d, "repo"), os.path.join(d, "target")
        os.makedirs(repo)
        git(repo, "init", "-q")
        git(repo, "config", "user.email", "t@t")
        git(repo, "config", "user.name", "t")
        for f, s in (("same.rs", "1"), ("changed.rs", "1")):
            with open(os.path.join(repo, f), "w") as fh:
                fh.write(s)
        git(repo, "add", ".")
        git(repo, "commit", "-qm", "one")
        wt1 = os.path.join(d, "wt1")
        git(repo, "worktree", "add", "-q", "--detach", wt1, "HEAD")
        # an old checkout, so every later one is newer than it
        old = time.time_ns() - 1000 * 10**9
        for f in ("same.rs", "changed.rs"):
            os.utime(os.path.join(wt1, f), ns=(old, old))
        check("first build ok", C.run(wt1, target, ["true"]) == 0)
        first = os.stat(os.path.join(wt1, "same.rs")).st_mtime_ns
        check("a manifest after a build", os.path.exists(os.path.join(target, C.MANIFEST)))

        with open(os.path.join(repo, "changed.rs"), "w") as fh:
            fh.write("2")
        git(repo, "commit", "-qam", "two")
        wt2 = os.path.join(d, "wt2")
        git(repo, "worktree", "add", "-q", "--detach", wt2, "HEAD")
        fresh = os.stat(os.path.join(wt2, "changed.rs")).st_mtime_ns
        check("second build ok", C.run(wt2, target, ["true"]) == 0)
        got = os.stat(os.path.join(wt2, "same.rs")).st_mtime_ns
        check("the unchanged file has the first build's mtime", got == first, (got, first))
        got = os.stat(os.path.join(wt2, "changed.rs")).st_mtime_ns
        check("the changed file stays fresh", got == fresh and got > first, (got, fresh, first))

        wt3 = os.path.join(d, "wt3")
        git(repo, "worktree", "add", "-q", "--detach", wt3, "HEAD")
        check("a failed build fails", C.run(wt3, target, ["false"]) == 1)
        check("a failed build forgets the manifest", not os.path.exists(os.path.join(target, C.MANIFEST)))

        wt4 = os.path.join(d, "wt4")
        git(repo, "worktree", "add", "-q", "--detach", wt4, "HEAD")
        before = os.stat(os.path.join(wt4, "same.rs")).st_mtime_ns
        C.run(wt4, target, ["true"])
        got = os.stat(os.path.join(wt4, "same.rs")).st_mtime_ns
        check("after a failure every file is fresh", got == before and got > first, (got, before))

        with open(os.path.join(wt4, "same.rs"), "w") as fh:
            fh.write("dirty")
        C.run(wt4, target, ["true"])
        check("uncommitted changes: no manifest written", not os.path.exists(os.path.join(target, C.MANIFEST)))


test_pure()
test_checkouts()
print("%s: %d failed" % (os.path.basename(__file__), fails))
sys.exit(1 if fails else 0)
