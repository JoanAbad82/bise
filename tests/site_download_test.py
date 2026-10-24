#!/usr/bin/env python3
"""bise.dev's home, bise desktop (/desktop and /download redirect there), reads the desktop feed and says what it found.

Two parts:
1. site/download.js, the pure part, under node: a rolling release from the
   GitHub API becomes {version, size, date, notes}; the beta shows only when
   it is newer than stable; a 404 is "soon" (no desktop release yet), a failed
   call is "unknown" (the button stays); the notes are escaped.
2. site/index.html (designer's page, bise desktop) rendered by headless Chrome against
   the fake feeds in tests/fixtures/site-download/ (ready: stable + a newer
   beta; soon: both tags 404; down: GitHub answers 503), served next to site/
   by a local server: its data-slot spots filled, the beta column off unless
   newer, and at 390 px wide nothing past the right edge (designer m_25237).
   Skipped when Chrome is not installed. SHOTS=<dir> also saves screenshots.

The fixtures follow the feed dist-ci and dist-updater agreed on (m_25185,
m_25204): the rolling tags desktop-latest and desktop-beta, each release
named after its version, its body the notes, a bise-mac-arm64.dmg asset.

Run: python3 tests/site_download_test.py
"""
import glob
import html
import http.server
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import threading
import urllib.parse

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SITE = os.path.join(REPO, "site")
FIXTURES = os.path.join(REPO, "tests", "fixtures", "site-download")
# never a browser from /Applications (it can show the user a macOS notice): BISE_CHROME, else
# Playwright's own headless shell in its cache; none: the render part is skipped.
CHROME = os.environ.get("BISE_CHROME") or next(iter(sorted(glob.glob(os.path.expanduser(
    "~/Library/Caches/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-*/chrome-headless-shell")), reverse=True)), "")

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


FRAME = """<!doctype html><meta charset="utf-8"><body style="margin:0">
<iframe id="f" src="%(src)s" style="width:%(w)dpx;height:900px;border:0"></iframe>
<pre id="out">pending</pre>
<script>
const f = document.getElementById("f");
const look = () => {
  const d = f.contentDocument;
  if (!d || !d.body || d.body.dataset.fed !== "1") return setTimeout(look, 100);
  const wide = [...d.querySelectorAll("body *")].filter((el) => {
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    return r.width && cs.position !== "fixed" && r.right > d.documentElement.clientWidth + 1 && !el.closest(".install, .stage, .shot, .dmg, .seeds, .tui");
  }).slice(0, 5).map((el) => el.tagName.toLowerCase() + "." + el.className + " right=" + Math.round(el.getBoundingClientRect().right));
  document.getElementById("out").textContent = JSON.stringify({ scroll: d.documentElement.scrollWidth, client: d.documentElement.clientWidth, wide });
};
f.onload = look;
</script>"""


class Handler(http.server.SimpleHTTPRequestHandler):
    """site/ at /, the fixtures at /__fixtures/ (down/: GitHub failing), a
    phone-width frame at /__frame, like vercel's cleanUrls."""

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path.startswith("/__fixtures/down/"):
            self.send_error(503)
            return
        if path == "/__frame":
            q = dict(p.split("=", 1) for p in self.path.split("?", 1)[1].split("&"))
            src = urllib.parse.unquote(q["src"])
            data = (FRAME % {"src": src, "w": int(q["w"])}).encode()
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return
        super().do_GET()

    def translate_path(self, path):
        path = path.split("?", 1)[0]
        if path.startswith("/__fixtures/"):
            return os.path.join(FIXTURES, path[len("/__fixtures/"):])
        if path in ("/", "/desktop"):
            path = "/index.html"
        if path.startswith("/desktop/hero/"):
            # the bims' town is WebGL and never idles: under --virtual-time-budget it hangs the
            # dump; the page keeps its poster without it, and the download parts are what's checked
            return os.path.join(SITE, "__no_town__")
        return os.path.join(SITE, path.lstrip("/"))

    def log_message(self, *a):
        pass


def unit():
    script = UNIT % {"site": SITE, "fx": FIXTURES}
    r = subprocess.run(["node", "--input-type=module", "-e", script], capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit("FAIL unit:\n" + r.stderr)
    print("ok   download.js: feed -> view, versions, sizes, notes escaped")


def chrome(profile, *args, size="1280,1600"):
    base = [CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", f"--user-data-dir={profile}",
            "--virtual-time-budget=8000", f"--window-size={size}"]
    return subprocess.run(base + list(args), capture_output=True, text=True, timeout=90).stdout


def page(port, scenario):
    return f"http://127.0.0.1:{port}/?api=/__fixtures/{scenario}&still"


def check(dom, scenario, want, absent):
    if 'data-fed="1"' not in dom:
        sys.exit(f"FAIL {scenario}: the page did not finish (no data-fed)\n{dom[-2000:]}")
    for w in want:
        if w not in dom:
            sys.exit(f"FAIL {scenario}: missing {w!r}")
    for a in absent:
        if a in dom:
            sys.exit(f"FAIL {scenario}: should not show {a!r}")
    print(f"ok   render {scenario}")


def phone(port, scenario, profile):
    """390 px wide: nothing reaches past the screen's right edge (the
    command's box, the screenshots and the DMG drawing scale or scroll inside)."""
    src = urllib.parse.quote(page(port, scenario), safe="")
    dom = chrome(profile, "--dump-dom", f"http://127.0.0.1:{port}/__frame?w=390&src={src}")
    m = re.search(r'<pre id="out">(.*?)</pre>', dom, re.S)
    if not m or m.group(1) == "pending":
        sys.exit(f"FAIL phone {scenario}: the frame never finished")
    r = json.loads(html.unescape(m.group(1)))
    if r["scroll"] > r["client"] or r["wide"]:
        sys.exit(f"FAIL phone {scenario}: wider than 390 ({r})")
    print(f"ok   phone {scenario}: no x scroll at 390")


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
        beta_on = '<p class="small" data-slot="beta" style="margin:0">'
        beta_off = 'data-slot="beta" data-off=""'
        check(chrome(profile, "--dump-dom", page(port, "ready")), "ready",
              ['data-state="ready"', '<span class="nw" data-slot="version">2026.10.1</span>',
               '<span class="nw" data-slot="size">205 MB</span>', '<span data-slot="date">Oct 12, 2026</span>',
               beta_on, '<span data-slot="beta-version">2026.10.3</span>', '<span data-slot="beta-size">206 MB</span>',
               'href="/download/mac"', 'href="/download/mac-beta"'],
              [beta_off])
        check(chrome(profile, "--dump-dom", page(port, "soon")), "soon", ['data-state="soon"', beta_off], [beta_on])
        check(chrome(profile, "--dump-dom", page(port, "down")), "down", ['data-state="unknown"', beta_off], [beta_on])
        for s in ("ready", "soon"):
            phone(port, s, profile)
        if shots:
            for s in ("ready", "soon"):
                chrome(profile, f"--screenshot={os.path.join(shots, s + '.png')}", page(port, s), size="1280,3000")
    finally:
        srv.shutdown()
        shutil.rmtree(profile, ignore_errors=True)


if __name__ == "__main__":
    main()
