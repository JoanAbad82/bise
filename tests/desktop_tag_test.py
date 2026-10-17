#!/usr/bin/env python3
"""scripts/desktop_tag.py: the one way to cut a desktop tag, on fake data only.

Its pure parts (the green line of desktop-green.tsv for an exact sha, the tag's message, the
mark's check), the release body without the mark (desktop_feed.notes_from_tag_message), then a
throwaway repo, a throwaway BISE_HOME and a fake nightly (DESKTOP_TAG_NIGHTLY) run under no heavy
slot: a green line is taken as it is; without one the fake runs and the tag comes only on green;
a red or a dirty checkout makes no tag; `check` refuses a lightweight tag, a tag without the mark
and a mark for another sha, and passes the tag cut here. Never his ~/.bise, no push.

  python3 -B tests/desktop_tag_test.py
"""
import os
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "scripts"))
import desktop_feed as F  # noqa: E402
import desktop_tag as T  # noqa: E402

FAILS = []
# a fake nightly: green appends the sha like nightly_desktop.sh, red exits 1
FAKE_NIGHTLY = """#!/usr/bin/env bash
echo "nightly $*" >> "$FAKE_LOG"
[ "${FAKE_RED:-}" = 1 ] && exit 1
mkdir -p "$BISE_HOME/run/nightly"
printf '%s\\t%s\\n' "$2" "2026-10-18T05:00:00" >> "$BISE_HOME/run/nightly/desktop-green.tsv"
"""
# no signing prompt in a throwaway repo (his global config signs)
GIT_ENV = {"GIT_CONFIG_COUNT": "3", "GIT_CONFIG_KEY_0": "commit.gpgsign", "GIT_CONFIG_VALUE_0": "false",
           "GIT_CONFIG_KEY_1": "tag.gpgsign", "GIT_CONFIG_VALUE_1": "false",
           "GIT_CONFIG_KEY_2": "user.email", "GIT_CONFIG_VALUE_2": "t@t", "GIT_AUTHOR_NAME": "t", "GIT_COMMITTER_NAME": "t"}


def check(ok, what):
    if not ok:
        FAILS.append(what)


def pure():
    tsv = "aaa\t2026-10-17T05:00:00\nbbb\t2026-10-17T06:00:00\naaa\t2026-10-18T05:00:00\n"
    check(T.green_line(tsv, "aaa") == "2026-10-18T05:00:00", "green_line: the last line of that sha")
    check(T.green_line(tsv, "aa") is None and T.green_line("", "aaa") is None, "green_line: exact sha only")
    m = T.message("- one\n- two\n", "abc", "2026-10-18T05:00:00")
    check(m == "- one\n- two\n\nnightly-desktop: green abc 2026-10-18T05:00:00\n", "message: %r" % m)
    check(T.message("", "abc", "w") == "nightly-desktop: green abc w\n", "message without notes")
    check(T.marked(m, "abc") and not T.marked(m, "ab") and not T.marked("- one\n", "abc"), "marked: exact sha")
    check(not T.marked("say nightly-desktop: green abc", "abc"), "marked: a line of its own")
    check(F.notes_from_tag_message(m, "t") == "- one\n- two\n", "the release body drops the mark")
    check(F.notes_from_tag_message("nightly-desktop: green abc w\n", "desktop-v2026.10.1") == "bise for Mac, desktop-v2026.10.1.\n",
          "the mark alone: the stand-in body")


def repo_flow():
    t = os.path.realpath(tempfile.mkdtemp(prefix="desktop-tag-test-", dir=os.environ.get("TMPDIR")))
    saved = {k: os.environ.get(k) for k in GIT_ENV}
    os.environ.update(GIT_ENV)
    try:
        repo, bh, log = os.path.join(t, "repo"), os.path.join(t, "home", ".bise"), os.path.join(t, "log")
        subprocess.run(["git", "init", "-q", "-b", "main", repo], check=True)
        g = lambda *a: subprocess.run(["git", "-C", repo, *a], check=True, capture_output=True, text=True, stdin=subprocess.DEVNULL).stdout.strip()  # noqa: E731
        with open(os.path.join(repo, "f"), "w") as f:
            f.write("1\n")
        g("add", "f")
        g("commit", "-q", "-m", "one")
        sha = g("rev-parse", "HEAD")
        fake = os.path.join(t, "nightly")
        with open(fake, "w") as f:
            f.write(FAKE_NIGHTLY)
        env = dict(os.environ, BISE_HOME=bh, DESKTOP_TAG_NIGHTLY=fake, FAKE_LOG=log)
        # no heavy slot in the test: the argv as it is
        T.heavy_argv = lambda cmd, lock: [c for c in cmd if c not in ("/usr/bin/caffeinate", "-is")]
        calls = lambda: open(log).read().splitlines() if os.path.exists(log) else []  # noqa: E731

        def cut(tag, **extra):
            try:
                T.cut(tag, None, "- the notes\n", repo=repo, env=dict(env, **extra))
                return None
            except T.TagError as e:
                return str(e)

        # a bad name, no tag
        check("desktop-vYYYY.M.N" in (cut("v2026.10.1") or ""), "a bad tag name")
        # no green line: the nightly runs, red: no tag
        e = cut("desktop-v2026.10.1", FAKE_RED="1")
        check(e and "not green" in e and calls() == ["nightly %s %s" % (calls()[0].split()[1], sha)], "red night: %s %s" % (e, calls()))
        check(not g("tag", "-l"), "red night: no tag")
        # a dirty checkout: refused before anything runs
        with open(os.path.join(repo, "f"), "w") as f:
            f.write("2\n")
        open(log, "w").close()
        e = cut("desktop-v2026.10.1")
        check(e and "clean" in e and calls() == [], "dirty: %s" % e)
        g("checkout", "-q", "f")
        # green: the nightly runs, then the annotated tag with the mark
        e = cut("desktop-v2026.10.1")
        check(e is None and len(calls()) == 1, "green night: %s %s" % (e, calls()))
        check(g("cat-file", "-t", "refs/tags/desktop-v2026.10.1") == "tag", "green night: annotated")
        msg = g("tag", "-l", "--format=%(contents)", "desktop-v2026.10.1")
        check(msg.startswith("- the notes") and "nightly-desktop: green %s 2026-10-18T05:00:00" % sha in msg, "the message: %r" % msg)
        # the green line is there now: a second tag takes it, no run
        open(log, "w").close()
        check(cut("desktop-v2026.10.2") is None and calls() == [], "a green line: no run")
        check(cut("desktop-v2026.10.2") and "exists" in cut("desktop-v2026.10.2"), "an existing tag")
        # check: the tag cut here passes; a lightweight one, one without the mark, one marked for another sha fail
        try:
            T.check("desktop-v2026.10.1", repo=repo)
        except T.TagError as e:
            check(False, "check of a cut tag: %s" % e)
        g("tag", "desktop-v2026.10.3")
        g("tag", "-a", "desktop-v2026.10.4", "-m", "- notes")
        g("tag", "-a", "desktop-v2026.10.5", "-m", "nightly-desktop: green %s w" % ("0" * 40))
        for tag, why in (("desktop-v2026.10.3", "lightweight"), ("desktop-v2026.10.4", "carries no"), ("desktop-v2026.10.5", "carries no")):
            try:
                T.check(tag, repo=repo)
                check(False, "check passed %s" % tag)
            except T.TagError as e:
                check(why in str(e) and T.REFUSE in str(e), "check %s: %s" % (tag, e))
    finally:
        for k, v in saved.items():
            if v is None:
                os.environ.pop(k, None)
            else:
                os.environ[k] = v
        shutil.rmtree(t, ignore_errors=True)


def main():
    pure()
    repo_flow()
    for f in FAILS:
        print("FAIL", f)
    print("desktop_tag_test: %s" % ("ok" if not FAILS else "%d failed" % len(FAILS)))
    return 1 if FAILS else 0


if __name__ == "__main__":
    sys.exit(main())
