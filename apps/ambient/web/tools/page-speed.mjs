// The page layer's speed budget (roadmap §3.5, speed is the UX; ambient-lead m_5598), checked in a
// throwaway headless Chrome against a fake page server on fixture pages, with kit.js, pearl.js
// and notes.js as shipped. Run by hand or in QA (it needs Chrome, so it is not in check.mjs):
//   node apps/ambient/web/tools/page-speed.mjs [runs]      (LOADED=1: a busy machine, wall times shown only)
// Pages: the weekly-update example (12 blocks) and a 20-item inbox (inbox-review's items repeated).
// Budgets, on the median of the runs: the page parsed and the layer's scripts run (DOMContentLoaded,
// the first paint's bound here: headless Chrome reports no paint entries) < 200 ms; the notes
// toolbar ready < 250 ms; a new version's swap (SSE 'version' -> bise:swapped) < 100 ms; the
// block being read does not move and no layout shift comes with the swap; the pearl's WebGL starts
// after the page is up, never on the first paint's path. Exit 1 when one misses.
// Never the user's browser or accounts: its own Chrome profile in $TMPDIR, its own server.
import http from "node:http";
import { spawn } from "node:child_process";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const KIT = join(dirname(fileURLToPath(import.meta.url)), "../../kit");
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const RUNS = +process.argv[2] || 3;
const BUDGET = { cpu: 150, dcl: 200, toolbar: 250, swap: 100, shift: 0.01 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- the fake page server: the shell as rust/switchboard/src/pages/server.rs writes it
const ex = (n) => readFileSync(join(KIT, "examples", n + ".html"), "utf8");
function inbox20() {
  return ex("inbox-review").replace(/(<(ol|ul)[^>]*>)([\s\S]*?)(<\/\2>)/, (all, open, tag, items, close) => {
    const lis = items.match(/<li[\s\S]*?<\/li>/g) || [];
    const out = [];
    for (let i = 0; out.length < 20; i++) out.push(lis[i % lis.length].replace(/data-id="([^"]+)"/, `data-id="$1-${i}"`));
    return `${open}\n${out.join("\n")}\n${close}`;
  });
}
const BODIES = { "weekly-update": () => ex("weekly-update"), inbox: inbox20 };
const v2 = (s) => s.replace(/(<section data-kit="prose" data-id="[^"]+">\s*<p>)/, "$1(new) ");
const MIME = { ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2" };
const shell = (id, inner) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="bise-token" content="t">
<title>${id}</title>
<link rel="stylesheet" href="/kit/tokens.css">
<link rel="stylesheet" href="/kit/kit.css">
<link rel="stylesheet" href="/kit/notes.css">
<script src="/kit/kit.js" defer></script>
<script src="/kit/pearl.js" defer></script>
<script src="/kit/notes.js" defer></script>
</head>
<body>
<main id="bise-page" data-page="${id}" data-version="1" data-latest="1" data-agent="weekly" data-title="${id}" data-state="ready" data-started="0">
${inner}
</main>
</body>
</html>
`;
const streams = {};
function serve() {
  const srv = http.createServer((req, res) => {
    const u = new URL(req.url, "http://x");
    let m;
    const send = (code, type, body) => { res.writeHead(code, type ? { "content-type": type, "cache-control": "no-store" } : {}); res.end(body); };
    if (u.pathname.startsWith("/kit/")) {
      try { return send(200, MIME[extname(u.pathname)] || "application/octet-stream", readFileSync(join(KIT, u.pathname.slice(5)))); } catch { return send(404); }
    }
    if ((m = u.pathname.match(/^\/p\/([^/]+)$/)) && BODIES[m[1]]) return send(200, "text/html", shell(m[1], BODIES[m[1]]()));
    if ((m = u.pathname.match(/^\/p\/([^/]+)\/meta$/))) return send(200, "application/json", JSON.stringify({ id: m[1], title: m[1], agent: "weekly", created_ms: 0, state: "ready", versions: [{ n: 1, at_ms: 0, hashes: {} }, { n: 2, at_ms: 1, hashes: {} }], url: `/p/${m[1]}`, notes: [] }));
    if ((m = u.pathname.match(/^\/p\/([^/]+)\/v\/(\d+)\/body$/)) && BODIES[m[1]]) { const b = BODIES[m[1]](); return send(200, "text/html", +m[2] > 1 ? v2(b) : b); }
    if ((m = u.pathname.match(/^\/p\/([^/]+)\/events$/))) {
      res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-store" });
      res.write(": hi\n\n");
      (streams[m[1]] ||= []).push(res);
      req.on("close", () => { streams[m[1]] = streams[m[1]].filter((x) => x !== res); });
      return;
    }
    if (u.pathname.startsWith("/api/")) return send(200, "application/json", '{"notes":[]}');
    send(404);
  });
  return new Promise((r) => srv.listen(0, "127.0.0.1", () => r(srv)));
}
const push = (id, n) => { for (const r of streams[id] || []) r.write(`event: version\ndata: {"n":${n}}\n\n`); };

// ---- what the page records about itself (installed before any of its scripts)
const INSTR = `(() => {
  const P = window.__perf = { gl: [], shift: 0, shiftAfterSwap: 0 };
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) { P.shift += e.value; if (P.vAt) P.shiftAfterSwap += e.value; } }).observe({ type: "layout-shift", buffered: true }); } catch (e) {}
  const og = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (t, ...a) { if (/webgl/.test(t)) P.gl.push(performance.now()); return og.call(this, t, ...a); };
  const OES = window.EventSource;
  window.EventSource = function (u) { const es = new OES(u); es.addEventListener("version", () => { P.vAt = performance.now(); }); return es; };
  window.EventSource.prototype = OES.prototype;
  document.addEventListener("DOMContentLoaded", () => { P.dcl = performance.now(); });
  document.addEventListener("bise:swapped", () => { P.swappedAt = performance.now(); });
  new MutationObserver(() => { if (!P.toolbar && document.querySelector(".bn-tools")) P.toolbar = performance.now(); }).observe(document, { subtree: true, childList: true });
})();`;

async function once(base, id) {
  const port = 9400 + Math.floor(Math.random() * 400);
  const profile = mkdtempSync(join(process.env.TMPDIR || tmpdir(), "page-speed-"));
  const ch = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--window-size=1280,800", "--hide-scrollbars", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "about:blank"], { stdio: "ignore" });
  let ws, n = 0;
  const wait = {};
  const cdp = (method, params = {}) => new Promise((res) => { const i = ++n; wait[i] = res; ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = (expression) => cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }).then((r) => r.result && r.result.value);
  try {
    let list;
    for (let k = 0; k < 100 && !list; k++) { try { list = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch { await sleep(100); } }
    ws = new WebSocket(list.find((t) => t.type === "page").webSocketDebuggerUrl);
    await new Promise((r) => (ws.onopen = r));
    let upAt;
    const up = new Promise((r) => (upAt = r));
    ws.onmessage = (m) => {
      const d = JSON.parse(m.data);
      if (d.id && wait[d.id]) { wait[d.id](d.result || d); delete wait[d.id]; }
      if (d.method === "Page.domContentEventFired") upAt();
    };
    await cdp("Page.enable"); await cdp("Runtime.enable");
    // the main thread's own time (thread ticks): what the page costs, whatever the machine's load
    await cdp("Performance.enable", { timeDomain: "threadTicks" });
    await cdp("Page.addScriptToEvaluateOnNewDocument", { source: INSTR });
    await cdp("Page.navigate", { url: `${base}/p/${id}` });
    await up;
    const mt = await cdp("Performance.getMetrics");
    const cpu = Math.round(((mt.metrics || []).find((x) => x.name === "TaskDuration") || { value: -1 }).value * 1000);
    await sleep(2500);
    const load = { ...(await ev(`({ dcl: Math.round(__perf.dcl || -1), toolbar: Math.round(__perf.toolbar || -1), gl: __perf.gl.map(Math.round) })`)), cpu };
    // read a third of the way down, then a new version comes in
    const before = await ev(`new Promise((r) => { scrollTo(0, Math.round(document.body.scrollHeight / 3)); setTimeout(() => { const b = [...document.querySelectorAll("#bise-page > [data-id]")].find((x) => x.getBoundingClientRect().top > 60); r({ id: b && b.dataset.id, top: b && Math.round(b.getBoundingClientRect().top) }); }, 300); })`);
    push(id, 2);
    await sleep(800);
    const after = await ev(`(() => { const b = document.querySelector('#bise-page > [data-id="${before.id}"]'); return { swap: Math.round(__perf.swappedAt - __perf.vAt), top: b && Math.round(b.getBoundingClientRect().top), shift: __perf.shiftAfterSwap, version: document.querySelector("#bise-page").dataset.version }; })()`);
    return { ...load, swap: after.swap, moved: after.top - before.top, shift: +after.shift.toFixed(4), version: after.version };
  } finally {
    try { ws && ws.close(); } catch {}
    ch.kill();
    await sleep(300);
    rmSync(profile, { recursive: true, force: true });
  }
}

const median = (xs) => xs.slice().sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const srv = await serve();
const base = `http://127.0.0.1:${srv.address().port}`;
let ok = true;
for (const id of Object.keys(BODIES)) {
  const runs = [];
  for (let i = 0; i < RUNS; i++) runs.push(await once(base, id));
  const m = { dcl: median(runs.map((r) => r.dcl)), toolbar: median(runs.map((r) => r.toolbar)), swap: median(runs.map((r) => r.swap)), cpu: median(runs.map((r) => r.cpu)) };
  const misses = [];
  // the main thread's own time to the page up is the gate (the machine's load can't fail it);
  // the wall times gate too unless LOADED=1 says the machine is busy (then they are only shown)
  if (!(m.cpu >= 0 && m.cpu < BUDGET.cpu)) misses.push(`main thread ${m.cpu} ms to the page up (budget ${BUDGET.cpu})`);
  if (!process.env.LOADED && !(m.dcl >= 0 && m.dcl < BUDGET.dcl)) misses.push(`page up ${m.dcl} ms (budget ${BUDGET.dcl})`);
  if (!process.env.LOADED && !(m.toolbar >= 0 && m.toolbar < BUDGET.toolbar)) misses.push(`toolbar ${m.toolbar} ms (budget ${BUDGET.toolbar})`);
  if (!(m.swap >= 0 && m.swap < BUDGET.swap)) misses.push(`swap ${m.swap} ms (budget ${BUDGET.swap})`);
  if (runs.some((r) => r.version !== "2")) misses.push("the new version never swapped in");
  if (runs.some((r) => r.moved !== 0)) misses.push(`the block being read moved (${runs.map((r) => r.moved).join(", ")} px)`);
  if (runs.some((r) => r.shift >= BUDGET.shift)) misses.push(`layout shift with the swap (${runs.map((r) => r.shift).join(", ")})`);
  if (runs.some((r) => r.gl.some((t) => t <= r.dcl))) misses.push("the pearl's WebGL started before the page was up");
  console.log(`${misses.length ? "✗" : "✓"} ${id}: main thread ${m.cpu} ms, page up ${m.dcl} ms, toolbar ${m.toolbar} ms, swap ${m.swap} ms, pearl at ${runs.map((r) => r.gl[0] ?? "-").join("/")} ms${misses.length ? "\n  " + misses.join("\n  ") : ""}`);
  if (misses.length) ok = false;
}
srv.close();
process.exit(ok ? 0 : 1);
