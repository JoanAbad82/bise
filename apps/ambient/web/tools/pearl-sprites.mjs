// bise ambient · renders the menu-bar pearl's sprites and the 1024 px app icon from the capsule's
// own shader (../pearl.js), in headless Chrome, into apps/ambient/mac/Resources/:
//   pearl/<mood>-<NN>.png (18 px), <mood>-<NN>@2x.png (36 px), <mood>-<NN>@3x.png (54 px):
//     still, fail, away: one frame; work, listen, done: 36 frames of a closed 3 s loop
//   icon-1024.png: the pearl at rest on the glass, in Apple's squircle grid
// (names and frame counts agreed with amb-mac, m_5168). Run it after a change to the shader:
//   node apps/ambient/web/tools/pearl-sprites.mjs
// It opens nothing of yours: a headless Chrome with a throwaway profile, on this repo's file.
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync, mkdtempSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));
const res = join(here, "../../mac/Resources");
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const port = 9200 + Math.floor(Math.random() * 400);
const profile = mkdtempSync(join(process.env.TMPDIR || tmpdir(), "pearl-sprites-"));
const ch = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--allow-file-access-from-files", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws, id = 0;
const wait = {};
const send = (method, params = {}) => new Promise((ok) => { const i = ++id; wait[i] = ok; ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
};
const png = (url) => Buffer.from(url.split(",")[1], "base64");

try {
  let list;
  for (let k = 0; k < 80 && !list; k++) { try { list = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch { await sleep(100); } }
  ws = new WebSocket(list.find((t) => t.type === "page").webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && wait[d.id]) { wait[d.id](d.result || d); delete wait[d.id]; } };
  await send("Runtime.enable");
  await send("Page.navigate", { url: pathToFileURL(join(here, "pearl-sprites.html")).href });
  for (let k = 0; k < 100 && (await ev("document.title")) !== "ready"; k++) await sleep(100);

  const dir = join(res, "pearl");
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const sprites = await ev("sprites()");
  for (const [name, url] of sprites) writeFileSync(join(dir, name), png(url));
  writeFileSync(join(res, "icon-1024.png"), png(await ev("icon()")));
  console.log(`pearl: ${sprites.length} sprites in ${dir}, icon-1024.png in ${res}`);
} catch (e) {
  console.error(`pearl: failed: ${e.message}`);
  process.exitCode = 1;
} finally {
  try { ws && ws.close(); } catch {}
  // the throwaway profile goes once Chrome has let go of it
  await new Promise((r) => { ch.once("exit", r); ch.kill(); setTimeout(r, 3000); });
  try { rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch {}
}
