#!/usr/bin/env python3
"""desktop-tag: the one way to cut a desktop release tag (fast-try p7, architect m_29670).

  scripts/desktop_tag.py <desktop-vYYYY.M.N> [<sha>] [--notes-file <f>]
      from a clean checkout at <sha> (default HEAD): the tag only when the desktop app's full
      end-to-end is green on that exact sha. A green line for it in
      <BISE_HOME>/run/nightly/desktop-green.tsv (a night's, scripts/nightly_desktop.sh) is taken
      as it is; else nightly_desktop.sh runs now, in a heavy slot (hours), and the tag is cut only
      on green. The tag is ANNOTATED: the notes (the release's user-facing body), then the line
      'nightly-desktop: green <sha> <when>'. Never pushed here: it prints the push.
  scripts/desktop_tag.py check <tag>
      desktop-release.yml's first step: the tag is annotated and its message carries
      'nightly-desktop: green <its own commit>'; else 'cut desktop tags with scripts/desktop_tag.py'.
      A hand 'git tag && git push' thus stops in CI, with no write to GitHub from the nightly.

The release body drops that line (desktop_feed.notes_from_tag_message). Pure parts and a
throwaway repo with a fake nightly: tests/desktop_tag_test.py.
"""
import datetime
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.realpath(__file__))
REPO = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from heavy_slot import heavy_argv  # noqa: E402

TAG_RE = re.compile(r"^desktop-v[0-9]{4}\.[0-9]{1,2}\.[0-9]{1,4}$")
MARK = "nightly-desktop: green"
REFUSE = "cut desktop tags with scripts/desktop_tag.py"


class TagError(Exception):
    pass


def say(*a):
    print("desktop-tag:", *a, file=sys.stderr, flush=True)


# ---- pure ------------------------------------------------------------------------------------

def green_line(tsv_text, sha):
    """The green night's time for exactly `sha` in desktop-green.tsv ('<sha>\\t<when>' lines), the
    last one; None when that sha never went green. Pure."""
    when = None
    for line in (tsv_text or "").splitlines():
        parts = line.split("\t")
        if len(parts) >= 2 and parts[0].strip() == sha:
            when = parts[1].strip()
    return when


def message(notes, sha, when):
    """The annotated tag's message: his notes, then the green line. Pure."""
    body = (notes or "").strip()
    return (body + "\n\n" if body else "") + "%s %s %s\n" % (MARK, sha, when)


def marked(text, sha):
    """Whether a tag message carries the green line for exactly `sha`. Pure."""
    return any(re.match(r"^%s %s(\s|$)" % (re.escape(MARK), re.escape(sha)), line.strip()) for line in (text or "").splitlines())


# ---- git -------------------------------------------------------------------------------------

def git(*args, repo=REPO, check=True):
    r = subprocess.run(["git", "-C", repo, *args], capture_output=True, text=True)
    if check and r.returncode != 0:
        raise TagError("git %s: %s" % (" ".join(args), r.stderr.strip()))
    return r.stdout.strip()


def check(tag, repo=REPO):
    """CI's check of a pushed tag (its object fetched as it is: actions/checkout can leave a
    lightweight copy of the pushed tag, so the workflow fetches refs/tags/<tag> with --force)."""
    if git("cat-file", "-t", "refs/tags/%s" % tag, repo=repo, check=False) != "tag":
        raise TagError("%s is a lightweight tag: %s" % (tag, REFUSE))
    sha = git("rev-parse", "%s^{commit}" % tag, repo=repo)
    text = git("tag", "-l", "--format=%(contents)", tag, repo=repo)
    if not marked(text, sha):
        raise TagError("%s carries no '%s %s' line: %s" % (tag, MARK, sha, REFUSE))
    say("%s: annotated, its nightly desktop green on %s" % (tag, sha[:12]))


def cut(tag, sha, notes, repo=REPO, env=None):
    env = dict(os.environ if env is None else env)
    if not TAG_RE.match(tag):
        raise TagError("a desktop tag is desktop-vYYYY.M.N (got %r)" % tag)
    sha = git("rev-parse", "--verify", "%s^{commit}" % (sha or "HEAD"), repo=repo)
    if git("rev-parse", "-q", "--verify", "refs/tags/%s" % tag, repo=repo, check=False):
        raise TagError("%s exists already" % tag)
    # nightly_desktop.sh runs this checkout's as-he-does and test:land: it must be the sha's
    if git("rev-parse", "HEAD", repo=repo) != sha or git("status", "--porcelain", "--untracked-files=no", repo=repo):
        raise TagError("check out %s, clean, first: the end-to-end runs this checkout" % sha[:12])
    bh = env.get("BISE_HOME") or os.path.join(os.path.expanduser("~"), ".bise")
    tsv = os.path.join(bh, "run", "nightly", "desktop-green.tsv")
    read = lambda: open(tsv).read() if os.path.exists(tsv) else ""  # noqa: E731
    when = green_line(read(), sha)
    if when is None:
        out = os.path.join(bh, "run", "nightly", "desktop-tag-%s-%s" % (sha[:8], datetime.datetime.now().strftime("%Y%m%d-%H%M%S")))
        nightly = env.get("DESKTOP_TAG_NIGHTLY") or os.path.join(repo, "scripts", "nightly_desktop.sh")
        say("no green night for %s: running %s now, in a heavy slot (hours); its out: %s" % (sha[:12], nightly, out))
        cmd = ["/usr/bin/caffeinate", "-is", "bash", nightly, out, sha]
        rc = subprocess.run(heavy_argv(cmd, os.path.join(bh, "run", "heavy.lock")), cwd=repo, env=env).returncode
        when = green_line(read(), sha)
        if rc != 0 or when is None:
            raise TagError("the desktop end-to-end on %s is not green (exit %d, %s/summary.txt): no tag" % (sha[:12], rc, out))
    r = subprocess.run(["git", "-C", repo, "tag", "-a", tag, sha, "-F", "-"], input=message(notes, sha, when), capture_output=True, text=True)
    if r.returncode != 0:
        raise TagError("git tag: %s" % r.stderr.strip())
    say("tagged %s on %s (nightly desktop green %s). push it: git push origin %s" % (tag, sha[:12], when, tag))
    return sha


def main(argv):
    args = list(argv)
    try:
        if args[:1] == ["check"] and len(args) == 2:
            check(args[1])
            return 0
        notes = ""
        if "--notes-file" in args:
            i = args.index("--notes-file")
            if i + 1 >= len(args):
                raise TagError("--notes-file <f>")
            notes = open(args[i + 1]).read()
            del args[i:i + 2]
        if not 1 <= len(args) <= 2 or args[0].startswith("-"):
            raise TagError("usage: desktop_tag.py <desktop-vYYYY.M.N> [<sha>] [--notes-file <f>] | check <tag>")
        cut(args[0], args[1] if len(args) == 2 else None, notes)
        return 0
    except TagError as e:
        say(str(e))
        return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
