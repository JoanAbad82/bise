#!/usr/bin/env python3
"""desktop-publish: the desktop app's GitHub releases, from a build to its two channels. CI only.

  desktop_publish.py draft <tag> <release dir>          the build's draft release (prerelease, never latest)
  desktop_publish.py publish <tag> beta|stable          the build on a channel (his approval on the run)
  desktop_publish.py pause|resume beta|stable           paused: true / false in that channel's feed

Run by .github/workflows/desktop-release.yml (gh with GH_TOKEN, GH_REPO). The rules (the feed's,
scripts/desktop_feed.py; the shape agreed with dist-updater and dist-site):
  - every gh release create/edit says --latest=false: GitHub's 'latest' is every terminal's
    `bise update` channel, and publishing a draft would otherwise make it the latest;
  - a build's release desktop-vYYYY.M.N: a draft first (its body the annotated tag's message, the
    user-facing notes), published by its first channel; prerelease while only beta has it,
    prerelease=false once stable has it; a published one is never rewritten;
  - the rolling releases desktop-beta and desktop-latest carry the channel's DMG
    (bise-mac-arm64.dmg, the site's static link), then desktop.json last (an app never reads a
    feed whose DMG is not there yet); their name is the version, their body its notes;
  - desktop-feed's may_publish: a channel never goes back, stable is never ahead of beta.
The argv builders and the decisions are pure and tested in tests/desktop_release_test.py.
"""
import datetime
import json
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.realpath(__file__))
sys.path.insert(0, HERE)
import desktop_feed as F  # noqa: E402

ASSETS = (F.DMG, F.DMG + ".sha256", F.ZIP, F.ZIP + ".sha256", F.FEED, "VERSION")


class PublishError(Exception):
    pass


def say(*a):
    print("desktop-publish:", *a, file=sys.stderr, flush=True)


# ---- pure: the gh argv ------------------------------------------------------------------------

def draft_argv(tag, notes_file, files):
    return ["gh", "release", "create", tag, "--draft", "--prerelease", "--latest=false", "--verify-tag",
            "--title", tag, "--notes-file", notes_file, *files]


def upload_argv(tag, files):
    return ["gh", "release", "upload", tag, "--clobber", *files]


def publish_build_argv(tag, channel):
    """The build's own release once on a channel: published, prerelease only while beta alone has it."""
    return ["gh", "release", "edit", tag, "--draft=false", "--latest=false",
            "--prerelease=%s" % ("false" if channel == "stable" else "true")]


def rolling_create_argv(rolling, title, notes_file, target):
    return ["gh", "release", "create", rolling, "--latest=false", "--prerelease", "--title", title,
            "--notes-file", notes_file, "--target", target]


def rolling_edit_argv(rolling, title, notes_file):
    return ["gh", "release", "edit", rolling, "--latest=false", "--prerelease", "--title", title, "--notes-file", notes_file]


def every_gh_write(argvs):
    """Each release create/edit in a list of argv says --latest=false (the test's pin). Pure."""
    return all("--latest=false" in a for a in argvs if a[:3] in (["gh", "release", "create"], ["gh", "release", "edit"]))


# ---- the shell --------------------------------------------------------------------------------

def gh(argv, check=True):
    say("$ " + " ".join(argv))
    r = subprocess.run(argv, capture_output=True, text=True)
    if check and r.returncode != 0:
        raise PublishError("%s: %s" % (" ".join(argv[:4]), r.stderr.strip()))
    return r


def release(tag):
    r = gh(["gh", "release", "view", tag, "--json", "tagName,isDraft,isPrerelease,body,targetCommitish,assets"], check=False)
    return json.loads(r.stdout) if r.returncode == 0 else None


def fetch(tag, name, d):
    gh(["gh", "release", "download", tag, "-p", name, "-D", d, "--clobber"])
    return os.path.join(d, name)


def fetch_feed(tag, d):
    rel = release(tag)
    if rel is None or F.FEED not in [a["name"] for a in rel["assets"]]:
        return None
    sub = os.path.join(d, tag)
    os.makedirs(sub, exist_ok=True)
    return F.parse(open(fetch(tag, F.FEED, sub)).read())


def now_z():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def draft(tag, rel_dir, notes):
    F.app_id(tag)
    have = release(tag)
    files = [os.path.join(rel_dir, n) for n in ASSETS]
    missing = [f for f in files if not os.path.isfile(f)]
    if missing:
        raise PublishError("the build has no %s" % ", ".join(os.path.basename(m) for m in missing))
    if have is not None and not have["isDraft"]:
        raise PublishError("%s is published: a published build is never rewritten (make N+1)" % tag)
    with tempfile.NamedTemporaryFile("w", suffix=".md", delete=False) as f:
        f.write(F.notes_from_tag_message(notes, tag))
    if have is None:
        gh(draft_argv(tag, f.name, files))
    else:
        gh(upload_argv(tag, files))
    say("draft %s: %s" % (tag, ", ".join(ASSETS)))


def publish(tag, channel):
    F.app_id(tag)
    rolling = F.CHANNELS.get(channel)
    if rolling is None:
        raise PublishError("no channel %r (beta or stable)" % channel)
    rel = release(tag)
    if rel is None:
        raise PublishError("no release %s: push the tag, let the build make its draft" % tag)
    with tempfile.TemporaryDirectory() as d:
        new = fetch_feed(tag, d)
        if new is None:
            raise PublishError("%s has no %s" % (tag, F.FEED))
        current = fetch_feed(rolling, d)
        beta = fetch_feed(F.CHANNELS["beta"], d) if channel == "stable" else None
        why = F.may_publish(new, current, channel, beta)
        if why:
            raise PublishError(why)
        if channel == "stable" and rel["isDraft"]:
            raise PublishError("%s is still a draft: publish it to beta first" % tag)
        dmg = fetch(tag, F.DMG, d)
        sha = fetch(tag, F.DMG + ".sha256", d)
        feed = os.path.join(d, "out", F.FEED)
        os.makedirs(os.path.dirname(feed))
        with open(feed, "w") as f:
            f.write(F.dumps(F.on_channel(new, channel, now_z())))
        notes = os.path.join(d, "notes.md")
        with open(notes, "w") as f:
            f.write(rel.get("body") or F.notes_from_tag_message("", tag))
        gh(publish_build_argv(tag, channel))
        if release(rolling) is None:
            gh(rolling_create_argv(rolling, tag, notes, rel.get("targetCommitish") or "main"))
        else:
            gh(rolling_edit_argv(rolling, tag, notes))
        gh(upload_argv(rolling, [dmg, sha]))
        gh(upload_argv(rolling, [feed]))
    say("%s is on %s (%s)" % (tag, channel, rolling))


def pause(channel, paused):
    rolling = F.CHANNELS.get(channel)
    if rolling is None:
        raise PublishError("no channel %r (beta or stable)" % channel)
    with tempfile.TemporaryDirectory() as d:
        cur = fetch_feed(rolling, d)
        if cur is None:
            raise PublishError("%s has no feed yet" % rolling)
        out = os.path.join(d, "out", F.FEED)
        os.makedirs(os.path.dirname(out))
        with open(out, "w") as f:
            f.write(F.dumps(F.with_paused(cur, paused)))
        gh(upload_argv(rolling, [out]))
    say("%s: paused=%s" % (rolling, "true" if paused else "false"))


def main(argv):
    try:
        if len(argv) == 3 and argv[0] == "draft":
            notes = subprocess.run(["git", "tag", "-l", "--format=%(contents)", argv[1]], capture_output=True, text=True).stdout
            draft(argv[1], argv[2], notes)
        elif len(argv) == 3 and argv[0] == "publish":
            publish(argv[1], argv[2])
        elif len(argv) == 2 and argv[0] in ("pause", "resume"):
            pause(argv[1], argv[0] == "pause")
        else:
            raise PublishError("usage: desktop_publish.py draft <tag> <dir> | publish <tag> beta|stable | pause|resume beta|stable")
        return 0
    except (PublishError, F.FeedError) as e:
        say(str(e))
        return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
