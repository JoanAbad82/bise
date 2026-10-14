#!/usr/bin/env python3
"""desktop-feed: the desktop app's release feed, desktop.json, and the rules of its two channels. Pure.

The shape (agreed with dist-updater, who owns its reader bise_home::release::parse_desktop, and
dist-site, who shows it on bise.dev/download):

  {"kind": "desktop", "channel": "stable" | "beta", "version": "desktop-v2026.10.1",
   "runtime_id": "<the terminal release's VERSION id it carries>", "paused": false,
   "pub_date": "<UTC Z>", "notes_url": "https://github.com/<repo>/releases/tag/<tag>",
   "targets": {"darwin-arm64": {"id", "version", "built", "url", "sha256", "size", "min_macos",
                                "dmg": {"url", "sha256", "size"}}}}

  - every build is one immutable release desktop-vYYYY.M.N; its zip (the updater's) and DMG keep
    one name, bise-mac-arm64.{zip,dmg}; url: absolute, that release's asset;
  - the app's VERSION (Contents/Resources/VERSION, BISE_PACK_VERSION) says id= and built=, and
    targets.<t>.built is that built= byte for byte (UTC with a Z: the reader refuses any other);
  - two rolling releases carry the feed: desktop-beta (a build goes there first) and
    desktop-latest (promote: a build that is already on beta, never ahead of it); a beta app reads
    desktop-beta only; neither goes back to an older build (the next one is N+1, made from N's
    commit); paused: true and no app offers anything.

tests/desktop_release_test.py pins all of it.
"""
import json
import re

KIND = "desktop"
TARGET = "darwin-arm64"
ZIP = "bise-mac-arm64.zip"
DMG = "bise-mac-arm64.dmg"
FEED = "desktop.json"
CHANNELS = {"beta": "desktop-beta", "stable": "desktop-latest"}
# the native helper's floor (apps/desktop/native/mac/build.sh), desktop_release.MACOS_TARGET
MIN_MACOS = "14.0"
TAG_RE = re.compile(r"^desktop-v(\d{4})\.(\d{1,2})\.(\d{1,4})$")
UTC_Z = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$")


class FeedError(Exception):
    pass


def app_id(tag):
    """The app's VERSION id= for a release tag (desktop-v2026.10.1 -> desktop-2026.10.1); a dry run
    (no tag) is desktop-dry-<sha12>, never offered as an update (no feed carries it)."""
    m = TAG_RE.match(tag or "")
    if not m:
        raise FeedError("not a desktop release tag (desktop-vYYYY.M.N): %r" % tag)
    return "desktop-%s.%s.%s" % m.groups()


def dry_id(sha):
    if not re.match(r"^[0-9a-f]{12,40}$", sha or ""):
        raise FeedError("not a commit sha: %r" % sha)
    return "desktop-dry-%s" % sha[:12]


def utc_z(t):
    if not UTC_Z.match(t or ""):
        raise FeedError("a build time is UTC with a Z, YYYY-MM-DDTHH:MM:SSZ (got %r)" % t)
    return t


def version_text(rid, built, commit, runtime_id):
    """The app's own VERSION (Contents/Resources/VERSION): what the updater says to the core."""
    for k, v in (("commit", commit), ("runtime_id", runtime_id)):
        if not v or "\n" in v:
            raise FeedError("VERSION needs a one-line %s" % k)
    return "id=%s\nbuilt=%s\ncommit=%s\nruntime_id=%s\ntarget=%s\n" % (rid, utc_z(built), commit, runtime_id, TARGET)


def read_version(text):
    kv = {}
    for line in (text or "").splitlines():
        if "=" in line:
            k, v = line.split("=", 1)
            kv[k.strip()] = v.strip()
    return kv


def asset_url(repo, tag, name):
    if not re.match(r"^[\w.-]+/[\w.-]+$", repo or ""):
        raise FeedError("not an owner/name repo: %r" % repo)
    return "https://github.com/%s/releases/download/%s/%s" % (repo, tag, name)


def _sha(s):
    if not re.match(r"^[0-9a-f]{64}$", s or ""):
        raise FeedError("not a sha256: %r" % s)
    return s


def feed(repo, tag, channel, app_version, zip_sha, zip_size, dmg_sha, dmg_size, pub_date, paused=False):
    """desktop.json for one build (`app_version`: its VERSION's text)."""
    if channel not in CHANNELS:
        raise FeedError("no channel %r (beta or stable)" % channel)
    v = read_version(app_version)
    if v.get("id") != app_id(tag):
        raise FeedError("the app's VERSION id is %r, its tag %s wants %s" % (v.get("id"), tag, app_id(tag)))
    return {
        "kind": KIND, "channel": channel, "version": tag, "runtime_id": v.get("runtime_id") or "",
        "paused": bool(paused), "pub_date": utc_z(pub_date),
        "notes_url": "https://github.com/%s/releases/tag/%s" % (repo, tag),
        "targets": {TARGET: {
            "id": v["id"], "version": tag, "built": utc_z(v.get("built")),
            "url": asset_url(repo, tag, ZIP), "sha256": _sha(zip_sha), "size": int(zip_size), "min_macos": MIN_MACOS,
            "dmg": {"url": asset_url(repo, tag, DMG), "sha256": _sha(dmg_sha), "size": int(dmg_size)},
        }},
    }


def dumps(f):
    return json.dumps(f, indent=2, sort_keys=False) + "\n"


def parse(text):
    try:
        f = json.loads(text)
    except ValueError as e:
        raise FeedError("%s is not JSON: %s" % (FEED, e))
    if not isinstance(f, dict) or f.get("kind") != KIND or not isinstance(f.get("targets", {}).get(TARGET), dict):
        raise FeedError("%s is not the desktop app's feed for %s" % (FEED, TARGET))
    return f


def built_of(f):
    return utc_z(f["targets"][TARGET].get("built"))


def on_channel(f, channel, pub_date):
    """The build's feed as one channel says it (the rolling release's copy). Pure."""
    if channel not in CHANNELS:
        raise FeedError("no channel %r (beta or stable)" % channel)
    return dict(f, channel=channel, paused=False, pub_date=utc_z(pub_date))


def with_paused(f, paused):
    return dict(f, paused=bool(paused))


def may_publish(new, current, channel, beta=None):
    """Whether `new` (a build's feed) may go on `channel` whose feed is now `current` (None: none
    yet). Stable also needs `beta`, desktop-beta's feed. None: yes; else the reason, one line. Pure.
      - never back: a channel never moves to a build older than the one it has (same: a re-run);
      - stable is never ahead of beta: promote takes a build beta already has, or an older one
        beta went through (its build time at most beta's)."""
    if channel not in CHANNELS:
        return "no channel %r (beta or stable)" % channel
    nb = built_of(new)
    if current is not None and built_of(current) > nb:
        return "%s has %s (built %s), newer than %s (built %s): a channel never goes back; publish N+1" % (
            CHANNELS[channel], current.get("version"), built_of(current), new.get("version"), nb)
    if channel == "stable":
        if beta is None:
            return "desktop-beta has no build yet: a build goes to beta first"
        if built_of(beta) < nb:
            return "%s (built %s) is newer than desktop-beta's %s: publish it to beta first" % (new.get("version"), nb, beta.get("version"))
    return None


def notes_from_tag_message(text, tag):
    """The release body: the annotated tag's message (the user-facing notes, '- ' lines), else a
    one-line stand-in he edits on the draft before it goes out. Pure."""
    body = (text or "").strip()
    return body + "\n" if body else "bise for Mac, %s.\n" % tag
