// pagedrive.ts: drive a page in a throwaway headless Chrome over CDP, never the user's
// browser (ambient-pm's ~/.bise/qpm/cdp.mjs, folded into ambient-qa as `qa.py page drive`).
// Its own --user-data-dir (no logins, deleted at the end), local URLs only (the throwaway
// hub's page server), 2x by default, light or dark through prefers-color-scheme.
//
//   node --experimental-strip-types pagedrive.ts '<json args>'
//   args: {url, out (file prefix), steps: [...], scheme: "light"|"dark", width, height, scale}
//   a step: {eval: "js", label?}, {key, code?, vk?, mod?, text?}, {mouse: [x, y], click?},
//           {type: "text"}, {wait: ms}, {shot: "name"} (any mix in one step, in that order)
// Prints {results, logs} as JSON: each eval's value, each shot's file, the page's console.
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir, tmpdir } from "node:os";

/** One step (any mix, run in this order): eval, key, mouse, type, wait, shot. */
type Step = {
  eval?: string; label?: string;
  key?: string; code?: string; vk?: number; mod?: number; text?: string;
  mouse?: [number, number]; click?: boolean;
  type?: string; wait?: number; shot?: string;
};
type Args = { url?: string; out?: string; steps?: Step[]; scheme?: string; width?: number; height?: number; scale?: number; settle_ms?: number };
const args: Args = JSON.parse(process.argv[2] || "{}");
const { url, out } = args;
const steps: Step[] = args.steps && args.steps.length ? args.steps : [{ shot: "page" }];
const W = args.width || 1400, H = args.height || 900, SCALE = args.scale || 2;
function fail(msg: string): never { console.log(JSON.stringify({ error: msg })); process.exit(1); }
if (!url || !out) fail("url and out are needed");
const u = new URL(url);
if (!(u.protocol === "file:" || ["127.0.0.1", "localhost", "[::1]"].includes(u.hostname))) {
  fail("local pages only (the throwaway hub's page server or a file): " + url);
}
// The browser is Playwright's chrome-headless-shell in our own cache, never one of his apps: his
// /Applications Chrome run headless was charged to bise by macOS, its updater tried to rewrite its
// own bundle, and App Management told him 'bise was prevented from modifying apps on your Mac'
// (ambient-lead m_12343). The shell is a plain binary (no bundle, no updater). Install it once:
//   (cd apps/desktop && npx playwright install chromium-headless-shell)
const PW_CACHE = join(homedir(), "Library", "Caches", "ms-playwright");
const CHROME = process.env.QA_CHROME || headlessShell();
const refused = appBinary(CHROME);
if (refused) fail(refused);
if (!CHROME || !existsSync(CHROME)) {
  fail("no chrome-headless-shell in " + PW_CACHE + ": run (cd apps/desktop && npx playwright install chromium-headless-shell)");
}

/** The newest chrome-headless-shell under Playwright's cache, or "". */
function headlessShell() {
  let best = "";
  try {
    for (const d of readdirSync(PW_CACHE).filter((n) => n.startsWith("chromium_headless_shell-")).sort((a, b) => Number(a.split("-")[1]) - Number(b.split("-")[1]))) {
      for (const sub of readdirSync(join(PW_CACHE, d))) {
        const exe = join(PW_CACHE, d, sub, "chrome-headless-shell");
        if (existsSync(exe)) best = exe;
      }
    }
  } catch { /* no cache */ }
  return best;
}

/** Why an executable is refused (one line), or "": anything in /Applications, ~/Applications or an app bundle. */
export function appBinary(exe: string) {
  if (!exe) return "";
  const p = resolve(exe);
  for (const root of ["/Applications", join(homedir(), "Applications"), "/System/Applications"]) {
    if (p === root || p.startsWith(root + "/")) return "refused: " + p + " is one of his apps (" + root + "); QA runs our own chrome-headless-shell, never his browser";
  }
  if (/\.app(\/|$)/.test(p)) return "refused: " + p + " is inside an app bundle we didn't build; QA runs our own chrome-headless-shell";
  return "";
}

const dir = mkdtempSync(join(process.env.TMPDIR || tmpdir(), "qa-chrome-"));
const port = 9300 + Math.floor(Math.random() * 600);
const chrome = spawn(CHROME, [
  `--user-data-dir=${dir}`, `--remote-debugging-port=${port}`, "--headless",
  "--no-first-run", "--no-default-browser-check", "--disable-extensions", "--disable-sync",
  `--window-size=${W},${H}`, "about:blank",
], { stdio: "ignore" });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const results: ({ shot: string } | { eval: string; value: unknown })[] = [], logs: string[] = [];
let ws: WebSocket | undefined;
/** One CDP message: an answer (id) or an event (method, params). */
type Cdp = {
  id?: number; method?: string;
  result?: { data?: string; result?: { value?: unknown }; exceptionDetails?: { text?: string } };
  params?: { type?: string; args?: { value?: unknown; description?: string }[]; exceptionDetails?: { text?: string; exception?: { description?: string } } };
};
try {
  let targets: { type: string; webSocketDebuggerUrl: string }[] | undefined;
  for (let i = 0; i < 75 && !targets; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch { await sleep(200); }
  }
  if (!targets) throw new Error("headless Chrome didn't answer on its debugging port");
  const page = targets.find((t) => t.type === "page");
  if (!page) throw new Error("headless Chrome has no page");
  const sock = new WebSocket(page.webSocketDebuggerUrl);
  ws = sock;
  await new Promise((r, j) => { sock.onopen = r; sock.onerror = j; });
  let id = 0; const pending = new Map<number, (d: Cdp) => void>();
  sock.onmessage = (m) => {
    const d: Cdp = JSON.parse(m.data);
    const p = d.id ? pending.get(d.id) : undefined;
    if (d.id && p) { p(d); pending.delete(d.id); }
    if (d.method === "Runtime.consoleAPICalled") logs.push(d.params?.type + ": " + (d.params?.args ?? []).map((a) => a.value ?? a.description).join(" "));
    if (d.method === "Runtime.exceptionThrown") logs.push("exception: " + d.params?.exceptionDetails?.text + " " + (d.params?.exceptionDetails?.exception?.description || ""));
  };
  const send = (method: string, params: object = {}) => new Promise<Cdp>((r) => { const i = ++id; pending.set(i, r); sock.send(JSON.stringify({ id: i, method, params })); });
  await send("Runtime.enable");
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: SCALE, mobile: false });
  if (args.scheme) await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: args.scheme }] });
  await send("Page.navigate", { url });
  await sleep(args.settle_ms || 2000);
  const shot = async (name: string) => {
    const r = await send("Page.captureScreenshot", { format: "png" });
    const f = `${out}.${name}.png`;
    writeFileSync(f, Buffer.from(r.result?.data ?? "", "base64"));
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
