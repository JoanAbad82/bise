// The notes on an artifact, off-screen (art-notes; office-artifacts §5, §9b): the viewer of a
// sheet, a deck, a doc and an image served by a fake page server (the routes of
// pages/artifact/{view,notes}.rs, the shell's tags as view.rs writes them, fake notes), drawn by
// a headless Chrome driven over CDP: the marks (sent, draft, ✓ on the answering version), the
// `note` button on a selection, the browser's list, a note typed and sent (the POSTs the server
// gets), and the desktop's door (the frame named bise-app posts the anchor to its parent).
// Screens for designer at 1400 / 1100 / 800, light and dark, in $OUT (default $TMPDIR/notes-shots).
//
//   node office/sdk/test/notes.offscreen.mjs        (under ~/.bise/run/heavy-run --low)
//
// Fakes only: no hub, no account, no window on screen (Chrome --headless=new, its own profile).

import http from "node:http";
import { spawn } from "node:child_process";
import { readFileSync, mkdirSync, writeFileSync, mkdtempSync, existsSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import assert from "node:assert/strict";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..", "..");
const OUT = process.env.OUT || join(process.env.TMPDIR || tmpdir(), "notes-shots");
mkdirSync(OUT, { recursive: true });
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

// a 400 × 240 png: two blocks of color (made here, no file)
function png() {
  const w = 400, h = 240;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const o = y * (w * 3 + 1) + 1 + x * 3;
    const left = x < w / 2;
    raw[o] = left ? 200 : 63; raw[o + 1] = left ? 38 : 107; raw[o + 2] = left ? 74 : 53;
  }
  const zlib = require_("zlib");
  const crc = (b) => { let c, t = []; for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } let r = 0xffffffff; for (const x of b) r = t[(r ^ x) & 0xff] ^ (r >>> 8); return (r ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const l = Buffer.alloc(4); l.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
import { createRequire } from "node:module";
const require_ = createRequire(import.meta.url);

const fixture = (f) => readFileSync(join(root, "office", "fixtures", f));
const ARTS = {
  "q3-xlsx": { kind: "xlsx", name: "q3.xlsx", bytes: fixture("tiny.xlsx") },
  "deck-pptx": { kind: "pptx", name: "deck.pptx", bytes: fixture("tiny.pptx") },
  "memo-docx": { kind: "docx", name: "memo.docx", bytes: fixture("tiny.docx") },
  "shot-png": { kind: "image", name: "shot.png", bytes: png() },
};
// the notes the hub would serve (outcomes decided: done_in), per artifact; filled after we read
// the outlines' ids from the page
const NOTES = {};
const posts = [];

// view.rs's shell, its tags as it writes them (the Rust test pins the real one)
const shell = (id, a, v) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="bise-token" content="t0k"><title>${a.name}</title>
<link rel="stylesheet" href="/kit/tokens.css"><link rel="stylesheet" href="/kit/office/viewer.css"><link rel="stylesheet" href="/kit/office/select.css">
<script src="/kit/notes-anchors.js" defer></script><script src="/kit/notes.js" defer></script>
<script type="module" src="/kit/office/viewer.js"></script><script type="module" src="/kit/office/select.js"></script>
</head><body><main id="bise-office" data-artifact="${id}" data-kind="${a.kind}" data-version="${v}" data-latest="${v}" data-follows data-file="/a/${id}/${v}/${a.name}" data-name="${a.name}" data-agent="office-lead" data-title="${a.name}">
<p class="office-state" data-state="opening">opening ${a.name}…</p></main></body></html>`;
const VERSION = 2;

const types = { ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".html": "text/html" };
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  const segs = u.pathname.split("/").filter(Boolean);
  const send = (status, type, body) => { res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" }); res.end(body); };
  if (req.method === "POST") {
    let b = "";
    req.on("data", (c) => (b += c));
    req.on("end", () => {
      const [, , id, what] = segs;
      posts.push({ id, what, token: req.headers["x-bise-token"], body: b ? JSON.parse(b) : null });
      if (what === "notes") {
        const keep = (NOTES[id] || []).filter((n) => n.status !== "draft");
        NOTES[id] = [...keep, ...JSON.parse(b).notes.map((n) => ({ ...n, status: "draft" }))];
        return send(200, "application/json", JSON.stringify({ notes: NOTES[id] }));
      }
      const sent = (NOTES[id] || []).filter((n) => n.status === "draft");
      for (const n of sent) n.status = "sent";
      return send(200, "application/json", JSON.stringify({ sent: sent.length, agent: "office-lead" }));
    });
    return;
  }
  if (segs[0] === "kit" && segs[1] === "office" && (segs[2] === "office.js" || segs[2] === "office-view.js")) return send(200, "text/javascript", readFileSync(join(root, "office", "dist", segs[2])));
  if (segs[0] === "kit") {
    const p = join(root, ...segs);
    return existsSync(p) ? send(200, types[extname(p)] || "application/octet-stream", readFileSync(p)) : send(404, "text/plain", "no");
  }
  if (segs[0] === "a" && ARTS[segs[1]]) {
    const a = ARTS[segs[1]];
    if (segs[2] === "view") return send(200, "text/html", shell(segs[1], a, VERSION));
    if (segs[2] === "notes") return send(200, "application/json", JSON.stringify({ notes: NOTES[segs[1]] || [] }));
    if (segs[2] === "events") { res.writeHead(200, { "Content-Type": "text/event-stream" }); return; }
    if (segs[3] === a.name) return send(200, "application/octet-stream", a.bytes);
  }
  if (u.pathname === "/app") {
    // the desktop's side panel, as far as the frame sees it: a parent that frames it named bise-app
    return send(200, "text/html", `<!doctype html><body style="margin:0"><iframe name="bise-app" src="/a/${u.searchParams.get("id")}/view" style="border:0;width:100%;height:100vh"></iframe></body>`);
  }
  send(404, "text/plain", "no");
});
await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
const base = `http://127.0.0.1:${server.address().port}`;

// ---- Chrome over CDP
const profile = mkdtempSync(join(process.env.TMPDIR || tmpdir(), "chrome-"));
const chrome = spawn(CHROME, ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "about:blank"], { stdio: ["ignore", "ignore", "pipe"] });
const wsUrl = await new Promise((ok, no) => {
  let err = "";
  chrome.stderr.on("data", (d) => { err += d; const m = /DevTools listening on (ws:\S+)/.exec(err); if (m) ok(m[1]); });
  setTimeout(() => no(new Error(`no devtools: ${err}`)), 15000);
});
const port = new URL(wsUrl).port;
const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((ok) => ws.addEventListener("open", ok));
let seq = 0;
const waiting = new Map();
const events = [];
ws.addEventListener("message", (m) => {
  const d = JSON.parse(m.data);
  if (d.id && waiting.has(d.id)) { waiting.get(d.id)(d); waiting.delete(d.id); } else events.push(d);
});
const cdp = (method, params = {}) => new Promise((ok, no) => { const id = ++seq; waiting.set(id, (d) => (d.error ? no(new Error(`${method}: ${d.error.message}`)) : ok(d.result))); ws.send(JSON.stringify({ id, method, params })); });
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
async function evaluate(expr) {
  const r = await cdp("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(`${expr.slice(0, 80)}: ${r.exceptionDetails.exception?.description || r.exceptionDetails.text}`);
  return r.result.value;
}
async function until(expr, what, ms = 15000) {
  const t = Date.now();
  while (Date.now() - t < ms) { if (await evaluate(expr).catch(() => false)) return; await sleep(100); }
  throw new Error(`timed out: ${what}`);
}
const frameDoc = (inApp) => (inApp ? "document.querySelector('iframe').contentDocument" : "document");
async function open(path, width, dark) {
  await cdp("Emulation.setDeviceMetricsOverride", { width, height: 760, deviceScaleFactor: 1, mobile: false });
  await cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: dark ? "dark" : "light" }] });
  await cdp("Page.navigate", { url: `${base}${path}` });
  await sleep(300);
}
async function shot(name) {
  const r = await cdp("Page.captureScreenshot", { format: "png" });
  writeFileSync(join(OUT, `${name}.png`), Buffer.from(r.data, "base64"));
}
// a click as the user makes it (mousedown, mouseup, click) on an element's middle
async function clickOn(doc, sel, opts = "{}") {
  await evaluate(`(() => { const d = ${doc}; const e = d.querySelector(${JSON.stringify(sel)}); if (!e) throw new Error("no ${sel.replace(/"/g, "'")}"); const r = e.getBoundingClientRect(); const o = Object.assign({ bubbles: true, cancelable: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, button: 0 }, ${opts}); for (const t of ["mousedown", "mouseup", "click"]) e.dispatchEvent(new MouseEvent(t, o)); })()`);
}

await cdp("Page.enable");
await cdp("Runtime.enable");
const results = [];
const ok = (what) => { results.push(what); console.log(`ok · ${what}`); };
try {
  // ---- read the drawn ids, then seed the notes the hub would serve
  await open("/a/q3-xlsx/view", 1100, false);
  await until("document.querySelector('td[data-ref]')", "the grid");
  const sheet = await evaluate("biseOffice.view.place().sheet");
  await open("/a/deck-pptx/view", 1100, false);
  await until("document.querySelector('.office-slide .shape')", "the slide");
  const shape = await evaluate("(() => { const s = document.querySelector('.office-slide .shape'); return { slide: +s.dataset.slide, shape: s.dataset.shape }; })()");
  await open("/a/memo-docx/view", 1100, false);
  await until("document.querySelector('[data-para]')", "the doc's paragraphs");
  const para = await evaluate("document.querySelectorAll('[data-para]')[0].dataset.para");
  const n = (id, status, at, text, extra = {}) => ({ id, status, at, text, version: 1, kind: "note", at_ms: 1, ...extra });
  NOTES["q3-xlsx"] = [n("n1", "sent", { kind: "cell", sheet, range: "B2:C3" }, "these look low"), n("n2", "done", { kind: "cell", sheet, range: "A1" }, "say Q3", { done_in: VERSION })];
  NOTES["deck-pptx"] = [n("n1", "sent", { kind: "shape", ...shape }, "shorter title"), n("n2", "done", { kind: "slide", slide: 1 }, "old", { done_in: 1 })];
  NOTES["memo-docx"] = [n("n1", "sent", { kind: "para", para, quote: "" }, "too formal"), n("n2", "sent", { kind: "para", para: "GONE0000" }, "lost one")];
  NOTES["shot-png"] = [n("n1", "sent", { kind: "region", rect: { x: 10, y: 15, w: 30, h: 40 } }, "this red is off")];

  // ---- the marks, each kind, in the browser (the list beside the drawing)
  await open("/a/q3-xlsx/view", 1100, false);
  await until("document.querySelector('td[data-mark]')", "a cell's mark");
  assert.equal(await evaluate("document.querySelectorAll('td[data-mark=\"sent\"]').length"), 4, "B2:C3 marked sent");
  assert.equal(await evaluate("document.querySelector('td[data-ref=\"A1\"]').dataset.mark"), "done", "✓ on the answering version");
  assert.equal(await evaluate("document.querySelector('.office-notes .head').textContent"), "notes for q3.xlsx · 2");
  ok("sheet: a range sent, a cell ✓ in the version that answered it, the list");
  await open("/a/deck-pptx/view", 1100, false);
  await until("document.querySelector('.office-slide .shape[data-mark]')", "a shape's mark");
  assert.equal(await evaluate("document.querySelector('.office-rail .thumb').dataset.mark"), "sent", "its slide in the rail too");
  assert.equal(await evaluate("[...document.querySelectorAll('.office-notes .tag')].map(t => t.textContent).join('|')"), "sent|✓ done in v1", "an older answer: no mark, its line says when");
  ok("deck: a shape and its slide's thumb marked, an answer of v1 gone from v2");
  await open("/a/memo-docx/view", 1100, false);
  await until("document.querySelector('[data-para][data-mark]')", "a paragraph's mark");
  await until("[...document.querySelectorAll('.office-notes .tag')].some(t => t.textContent === 'moved')", "a lost one says moved");
  ok("doc: a paragraph marked, a lost anchor moved");
  await open("/a/shot-png/view", 1100, false);
  await until("document.querySelector('.office-mark-box')", "a box on the image");
  ok("image: a note's box drawn on it");

  // ---- the browser's door: draw a box, note, type, send
  await evaluate(`(() => { const f = document.querySelector('.office-image .frame'); const r = f.getBoundingClientRect(); const at = (x, y, t) => f.dispatchEvent(new PointerEvent(t, { bubbles: true, clientX: r.left + x, clientY: r.top + y, button: 0, pointerId: 1 })); at(220, 40, 'pointerdown'); at(330, 150, 'pointermove'); at(330, 150, 'pointerup'); document.querySelector('#bise-office').dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: r.left + 330, clientY: r.top + 150 })); })()`);
  await until("document.querySelector('.office-note-btn')", "the note button");
  assert.equal(await evaluate("document.querySelector('.office-note-btn').textContent"), "note");
  await shot("image-note-button-1100-light");
  await evaluate("document.querySelector('.office-note-btn').click()");
  await until("!document.querySelector('.office-notes .composer').hidden", "the composer");
  await evaluate("(() => { const t = document.querySelector('.office-notes textarea'); t.value = 'crop this out'; t.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); })()");
  await until("document.querySelector('.office-notes .send') && !document.querySelector('.office-notes .send').hidden", "the send bar");
  await shot("image-draft-1100-light");
  await evaluate("document.querySelector('.office-notes .send').click()");
  await until("document.querySelector('.office-notes .bar .text').textContent.startsWith('sent.')", "sent");
  const sentPost = posts.find((p) => p.id === "shot-png" && p.what === "send");
  const draftPost = posts.filter((p) => p.id === "shot-png" && p.what === "notes").pop();
  assert.ok(sentPost && sentPost.token === "t0k", "send posted with the token");
  assert.equal(draftPost.body.notes[0].at.kind, "region");
  assert.equal(draftPost.body.notes[0].text, "crop this out");
  ok("browser door: a box drawn, noted, sent: the drafts and send POSTs carry the region and the token");

  // ---- the desktop's door: the frame named bise-app posts the anchor to its parent
  await open("/app?id=q3-xlsx", 1100, false);
  await until("document.querySelector('iframe').contentDocument?.querySelector('td[data-ref=\"B2\"]')", "the framed grid");
  await evaluate("window.got = []; window.addEventListener('message', (e) => window.got.push(e.data))");
  const fd = frameDoc(true);
  await clickOn(fd, 'td[data-ref="B2"]');
  await clickOn(fd, 'td[data-ref="C4"]', "{ shiftKey: true }");
  await until(`${fd}.querySelector('.office-note-btn')`, "the button in the frame");
  assert.equal(await evaluate(`${fd}.querySelector('.office-note-btn').textContent`), "add to message");
  assert.equal(await evaluate(`!!${fd}.querySelector('.office-notes')`), false, "no list in the app: the composer is the maker's");
  await shot("sheet-app-button-1100-light");
  await evaluate(`${fd}.querySelector('.office-note-btn').click()`);
  await until("window.got.length > 0", "the parent got it");
  const got = await evaluate("window.got[0]");
  assert.deepEqual({ ...got, quote: undefined }, { bise: "anchor", artifact: "q3-xlsx", version: VERSION, anchor: { kind: "cell", sheet, range: "B2:C4" }, quote: undefined, label: `${sheet}!B2:C4` });
  ok(`desktop door: the frame posted ${JSON.stringify(got.anchor)} with "${got.quote}"`);

  // ---- designer's screens: each kind, 1400 / 1100 / 800, light and dark
  for (const dark of [false, true]) for (const w of [1400, 1100, 800]) for (const id of Object.keys(ARTS)) {
    await open(`/a/${id}/view`, w, dark);
    await until("document.querySelector('[data-mark], .office-mark-box')", `${id}'s marks`);
    await sleep(150);
    await shot(`${id}-${w}-${dark ? "dark" : "light"}`);
  }
  ok(`screens in ${OUT}`);
} finally {
  ws.close();
  chrome.kill();
  server.close();
}
console.log(`${results.length} checks passed`);
