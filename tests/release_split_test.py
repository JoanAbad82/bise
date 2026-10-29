#!/usr/bin/env python3
"""The terminal and the desktop app release apart (desktop-on-main, architect m_19472).

The terminal ships from main as before (release.yml on v* tags, build-dist.sh -> versions.sh,
latest.json, bise update); the desktop app has its own path (desktop-release.yml on desktop-v*
tags, desktop.json on the rolling desktop-latest tag), OFF until the repository variable
DESKTOP_RELEASE is 'on'. Laws, offline, no build:

  - versions.sh (the terminal's app root, so its tarball) never copies apps/desktop or dev/;
  - release.yml's tag filter is v* alone, and it never matches a desktop-v* tag;
  - desktop-release.yml: tags desktop-v* only, every job gated on vars.DESKTOP_RELEASE == 'on',
    never --latest (but --latest=false), never latest.json, install.sh or a bise-*.tar.gz;
  - check-release.py refuses a terminal tarball holding the desktop app, and a latest.json
    naming it.

Run: python3 tests/release_split_test.py
"""
import fnmatch
import importlib.util
import json
import os
import re
import sys
import tempfile

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def read(*p):
    with open(os.path.join(REPO, *p)) as f:
        return f.read()


def tag_filters(yml):
    """The `tags: [...]` globs of a workflow's push trigger."""
    m = re.search(r"^\s*tags:\s*\[([^\]]*)\]", yml, re.M)
    return [t.strip().strip("'\"") for t in m.group(1).split(",")] if m else []


def code_lines(yml):
    """A workflow's lines that aren't comments."""
    return [l for l in yml.splitlines() if not l.lstrip().startswith("#")]


def jobs(yml):
    """{job name: its text} of a workflow's `jobs:` block (two-space keys)."""
    body = yml.split("\njobs:\n", 1)[1] if "\njobs:\n" in yml else ""
    out, cur = {}, None
    for l in body.splitlines():
        m = re.match(r"^  ([\w-]+):\s*$", l)
        if m:
            cur = m.group(1)
            out[cur] = ""
        elif cur and not l.lstrip().startswith("#"):
            out[cur] += l + "\n"
    return out


def check_release_module():
    spec = importlib.util.spec_from_file_location("check_release", os.path.join(REPO, "packaging", "check-release.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def main():
    fails = []
    versions = read("scripts", "versions.sh")
    for bad in (r"\$src/apps/desktop", r"\$src/dev\b", r"\$src/apps\"? "):
        if re.search(bad, versions):
            fails.append("scripts/versions.sh copies %s: the terminal's app root never holds the desktop app" % bad)

    rel = read(".github", "workflows", "release.yml")
    tags = tag_filters(rel)
    if tags != ["v*"]:
        fails.append("release.yml's tags are %s, not ['v*']" % tags)
    if any(fnmatch.fnmatchcase("desktop-v2026.11.1", t) for t in tags):
        fails.append("release.yml would run on a desktop-v* tag")
    if not any(fnmatch.fnmatchcase("v2026.10.2-32", t) for t in tags):
        fails.append("release.yml no longer runs on a terminal tag v2026.10.2-N")

    d = read(".github", "workflows", "desktop-release.yml")
    if tag_filters(d) != ["desktop-v*"]:
        fails.append("desktop-release.yml's tags are %s, not ['desktop-v*']" % tag_filters(d))
    js = jobs(d)
    if not js:
        fails.append("desktop-release.yml has no jobs block this test can read")
    for name, text in js.items():
        # the gate first: `vars.DESKTOP_RELEASE == 'on'` alone, or `... == 'on' && (<which action>)`
        if not re.search(r"^\s+if:\s*\$\{\{\s*vars\.DESKTOP_RELEASE\s*==\s*'on'\s*(\}\}|&&\s*\()", text, re.M):
            fails.append("desktop-release.yml job %s isn't gated on vars.DESKTOP_RELEASE == 'on' (OFF until he says)" % name)
    code = "\n".join(code_lines(d))
    if re.search(r"--latest(?!=false)", code):
        fails.append("desktop-release.yml makes a release GitHub's latest: that is every terminal's update channel")
    for word in ("latest.json", "install.sh", "bise-*.tar.gz", ".tar.gz"):
        if word in code:
            fails.append("desktop-release.yml names %s: the terminal's release files" % word)

    cr = check_release_module()
    ok = ["bise-abc-darwin-arm64/app/bise", "bise-abc-darwin-arm64/app/kit/kit.js", "bise-abc-darwin-arm64/install.sh"]
    leak = ["bise-abc-darwin-arm64/app/apps/desktop/out/main.js", "x/node_modules/react/index.js",
            "x/app/Electron Framework.framework/x"]
    if cr.desktop_members(ok):
        fails.append("check-release.py flags a terminal file: %s" % cr.desktop_members(ok))
    if cr.desktop_members(leak) != leak:
        fails.append("check-release.py misses the desktop app in a tarball: %s" % cr.desktop_members(leak))
    with tempfile.TemporaryDirectory() as t:
        with open(os.path.join(t, "latest.json"), "w") as f:
            json.dump({"version": "v", "id": "a", "commit": "c", "built": "b", "published": "p", "targets": {},
                       "desktop": {"darwin-arm64": {}}}, f)
        sys.argv = ["check-release.py", t, "--url", "file:///x"]
        import contextlib
        import io
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            cr.main()
        if "names the desktop app" not in out.getvalue():
            fails.append("check-release.py accepts a latest.json with a desktop key")

    for f in fails:
        print("FAIL", f)
    print("%d failed" % len(fails) if fails else "release split: the terminal's path never ships the desktop app")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
