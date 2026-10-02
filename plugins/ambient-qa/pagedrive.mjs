// pagedrive.mjs: drive a page in a throwaway headless Chrome over CDP, never the user's
// browser (ambient-pm's ~/.bise/qpm/cdp.mjs, folded into ambient-qa as `qa.py page drive`).
// Its own --user-data-dir (no logins, deleted at the end), local URLs only (the throwaway
// hub's page server), 2x by default, light or dark through prefers-color-scheme.
//
//   node pagedrive.mjs '<json args>'
//   args: {url, out (file prefix), steps: [...], scheme: "light"|"dark", width, height, scale}
//   a step: {eval: "js", label?}, {key, code?, vk?, mod?, text?}, {mouse: [x, y], click?},
//           {type: "text"}, {wait: ms}, {shot: "name"} (any mix in one step, in that order)
// Prints {results, logs} as JSON: each eval's value, each shot's file, the page's console.
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const args = JSON.parse(process.argv[2] || "{}");
const { url, out } = args;
const steps = args.steps && args.steps.length ? args.steps : [{ shot: "page" }];
const W = args.width || 1400, H = args.height || 900, SCALE = args.scale || 2;
const fail = (msg) => { console.log(JSON.stringify({ error: msg })); process.exit(1); };
if (!url || !out) fail("url and out are needed");
const u = new URL(url);
if (!(u.protocol === "file:" || ["127.0.0.1", "localhost", "[::1]"].includes(u.hostname))) {
  fail("local pages only (the throwaway hub's page server or a file): " + url);
}
const CHROME = process.env.QA_CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
if (!existsSync(CHROME)) fail("no Chrome at " + CHROME + " (QA_CHROME to point elsewhere)");

const dir = mkdtempSync(join(process.env.TMPDIR || tmpdir(), "qa-chrome-"));
const port = 9300 + Math.floor(Math.random() * 600);
const chrome = spawn(CHROME, [
  `--user-data-dir=${dir}`, `--remote-debugging-port=${port}`, "--headless=new",
  "--no-first-run", "--no-default-browser-check", "--disable-extensions", "--disable-sync",
  `--window-size=${W},${H}`, "about:blank",
], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [], logs = [];
let ws;
try {
  let targets;
  for (let i = 0; i < 75 && !targets; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch { await sleep(200); }
  }
  if (!targets) throw new Error("headless Chrome didn't answer on its debugging port");
  const page = targets.find((t) => t.type === "page");
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pending = new Map();
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
    if (d.method === "Runtime.consoleAPICalled") logs.push(d.params.type + ": " + d.params.args.map((a) => a.value ?? a.description).join(" "));
    if (d.method === "Runtime.exceptionThrown") logs.push("exception: " + d.params.exceptionDetails.text + " " + (d.params.exceptionDetails.exception?.description || ""));
  };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send("Runtime.enable");
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: SCALE, mobile: false });
  if (args.scheme) await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: args.scheme }] });
  await send("Page.navigate", { url });
  await sleep(args.settle_ms || 2000);
  const shot = async (name) => {
    const r = await send("Page.captureScreenshot", { format: "png" });
    const f = `${out}.${name}.png`;
    writeFileSync(f, Buffer.from(r.result.data, "base64"));
    results.push({ shot: f });
  };
  for (const s of steps) {
    if (s.eval) {
      const r = await send("Runtime.evaluate", { expression: s.eval, awaitPromise: true, returnByValue: true });
      results.push({ eval: s.label || s.eval.slice(0, 60), value: r.result?.result?.value ?? r.result?.exceptionDetails?.text });
    }
    if (s.key) {
      for (const type of ["keyDown", "keyUp"]) {
        await send("Input.dispatchKeyEvent", { type, key: s.key, code: s.code || s.key, modifiers: s.mod || 0, windowsVirtualKeyCode: s.vk || 0, text: type === "keyDown" && s.text ? s.text : undefined });
      }
    }
    if (s.mouse) {
      const [x, y] = s.mouse;
      await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
      if (s.click) for (const type of ["mousePressed", "mouseReleased"]) await send("Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount: 1 });
    }
    if (s.type) await send("Input.insertText", { text: s.type });
    if (s.wait) await sleep(s.wait);
    if (s.shot) await shot(s.shot);
  }
  console.log(JSON.stringify({ results, logs }));
} catch (e) {
  console.log(JSON.stringify({ error: String(e), results, logs }));
  process.exitCode = 1;
} finally {
  try { ws && ws.close(); } catch {}
  chrome.kill();
  await sleep(300);
  rmSync(dir, { recursive: true, force: true });
}
