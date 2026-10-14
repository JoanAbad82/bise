#!/usr/bin/env python3
"""bise.dev/download reads the desktop feed and says what it found.

Two parts:
1. site/download.js, the pure part, under node: a rolling release from the
   GitHub API becomes {version, size, date, notes}; the beta shows only when
   it is newer than stable; a 404 is "soon" (no desktop release yet), a failed
   call is "unknown" (the button stays); the notes are escaped.
2. site/download.html rendered by headless Chrome against the fake feeds in
   tests/fixtures/site-download/ (ready: stable + a newer beta; soon: both
   tags 404), served next to site/ by a local server. Skipped when Chrome is
   not installed. SHOTS=<dir> also saves a screenshot of each.

The fixtures follow the feed dist-ci and dist-updater agreed on (m_25185,
m_25204): the rolling tags desktop-latest and desktop-beta, each release
named after its version, its body the notes, a bise-mac-arm64.dmg asset.

Run: python3 tests/site_download_test.py
"""
import http.server
import os
import shutil
import subprocess
import sys
import tempfile
import threading

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SITE = os.path.join(REPO, "site")
FIXTURES = os.path.join(REPO, "tests", "fixtures", "site-download")
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

UNIT = r"""
import assert from "node:assert/strict";
import fs from "node:fs";
import * as d from "%(site)s/download.js";
const fx = (p) => JSON.parse(fs.readFileSync("%(fx)s/" + p, "utf8"));
const stable = fx("ready/desktop-latest.json"), beta = fx("ready/desktop-beta.json");

const s = d.channelFrom(stable);
assert.equal(s.version, "desktop-v2026.10.1");
assert.equal(s.size, 205312000);
assert.equal(s.notesUrl, "https://github.com/gvergnaud/bise/releases/tag/desktop-v2026.10.1");
// no build on the tag yet: no version name, no DMG, or a draft
assert.equal(d.channelFrom({ ...stable, name: "desktop-latest" }), null);
assert.equal(d.channelFrom({ ...stable, assets: [] }), null);
assert.equal(d.channelFrom({ ...stable, draft: true }), null);

let v = d.view(stable, beta);
assert.equal(v.state, "ready");
assert.equal(v.beta.version, "desktop-v2026.10.3");
// a beta that is stable's build (just promoted) or older: no beta line
assert.equal(d.view(stable, { ...beta, name: "desktop-v2026.10.1" }).beta, null);
assert.equal(d.view(stable, { ...beta, name: "desktop-v2026.9.12" }).beta, null);
assert.equal(d.view(stable, null).beta, null);
// 404 on stable: soon; a failed call: unknown, and no beta guessed
assert.equal(d.view(null, null).state, "soon");
assert.equal(d.view(null, beta).state, "soon");
assert.equal(d.view(undefined, beta).state, "unknown");
assert.equal(d.view(undefined, beta).beta, null);

assert.ok(d.compareVersions("desktop-v2026.10.10", "desktop-v2026.10.9") > 0);
assert.ok(d.compareVersions("desktop-v2026.9.30", "desktop-v2026.10.1") < 0);
assert.equal(d.formatSize(205312000), "205 MB");
assert.equal(d.formatSize(0), "");
assert.equal(d.formatDate("2026-10-12T23:30:00Z"), "Oct 12, 2026");
assert.equal(d.shortVersion("desktop-v2026.10.1"), "2026.10.1");

const n = d.notesItems(stable.body);
assert.equal(n.items.length, 6);
assert.equal(n.more, 2);
assert.equal(n.items[4], "<code>⌘K</code> opens any agent, live or archived");
// escaped: a release body is text, never markup
const bad = d.notesItems('- <img src=x onerror=alert(1)> [x](javascript:alert(1)) **ok** [docs](https://bise.dev/docs)');
assert.equal(bad.items[0], '&lt;img src=x onerror=alert(1)&gt; [x](javascript:alert(1)) <b>ok</b> <a href="https://bise.dev/docs">docs</a>');
// no list: the first paragraph
assert.deepEqual(d.notesItems("## hi\n\nfirst build.\n\nmore").items, ["first build."]);
console.log("unit ok");
"""


class Handler(http.server.SimpleHTTPRequestHandler):
    """site/ at /, the fixtures at /__fixtures/, like vercel's cleanUrls."""

    def translate_path(self, path):
        path = path.split("?", 1)[0]
        if path.startswith("/__fixtures/"):
            return os.path.join(FIXTURES, path[len("/__fixtures/"):])
        if path == "/download":
            path = "/download.html"
        return os.path.join(SITE, path.lstrip("/"))

    def log_message(self, *a):
        pass


def unit():
    script = UNIT % {"site": SITE, "fx": FIXTURES}
    r = subprocess.run(["node", "--input-type=module", "-e", script], capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit("FAIL unit:\n" + r.stderr)
    print("ok   download.js: feed -> view, versions, sizes, notes escaped")


def render(port, scenario, shots, profile):
    url = f"http://127.0.0.1:{port}/download?api=/__fixtures/{scenario}"
    base = [CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", f"--user-data-dir={profile}",
            "--virtual-time-budget=5000", "--window-size=1280,1600"]
    r = subprocess.run(base + ["--dump-dom", url], capture_output=True, text=True, timeout=60)
    dom = r.stdout
    if shots:
        subprocess.run(base + [f"--screenshot={os.path.join(shots, scenario + '.png')}", url],
                       capture_output=True, timeout=60)
    return dom


def check(dom, scenario, want, absent):
    if f'data-state="{"ready" if scenario == "ready" else "soon"}"' not in dom:
        sys.exit(f"FAIL {scenario}: the page did not finish (no data-state)\n{dom[-2000:]}")
    for w in want:
        if w not in dom:
            sys.exit(f"FAIL {scenario}: missing {w!r}")
    for a in absent:
        if a in dom:
            sys.exit(f"FAIL {scenario}: should not show {a!r}")
    print(f"ok   render {scenario}")


def main():
    unit()
    if not os.path.exists(CHROME):
        print("skip render: no Google Chrome")
        return
    shots = os.environ.get("SHOTS")
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    profile = tempfile.mkdtemp(prefix="site-download-")
    try:
        port = srv.server_address[1]
        dom = render(port, "ready", shots, profile)
        check(dom, "ready",
              ['<a href="https://github.com/gvergnaud/bise/releases/tag/desktop-v2026.10.1">2026.10.1</a>',
               "205 MB", "Oct 12, 2026", '<section id="new">', "<code>⌘K</code> opens any agent",
               "and 2 more in the release notes", '<section id="beta">', '<b id="beta-v">2026.10.3</b>',
               ' (206 MB)', 'href="/download/mac"', 'href="/download/mac-beta"'],
              [])
        dom = render(port, "soon", shots, profile)
        check(dom, "soon",
              ['<p class="note" id="soon">', 'id="dl" href="/download/mac" hidden', "curl -fsSL bise.dev/install | sh"],
              ['<section id="new">', '<section id="beta">'])
    finally:
        srv.shutdown()
        shutil.rmtree(profile, ignore_errors=True)


if __name__ == "__main__":
    main()
