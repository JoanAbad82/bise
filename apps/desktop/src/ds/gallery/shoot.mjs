// src/ds · the gallery's visual check: serve the gallery (Vite, in process, 127.0.0.1), open it in
// headless Chrome (Playwright, no window, nothing on his screens), take one PNG per section and
// theme, and check the pixels: every pane draws something, and each light pane is lighter than its
// dark one (the tokens switch with data-theme). Then stop the browser and the server.
//
//   node src/ds/gallery/shoot.mjs <out dir> [section,section…]
//
// Stills: ?motion=0 stops every animation and transition. Exit 1 on a failed pane.
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { PNG } from "pngjs";
import { createServer } from "vite";

const here = import.meta.dirname;
const out = process.argv[2];
if (!out) { console.error("usage: node src/ds/gallery/shoot.mjs <out dir> [sections]"); process.exit(2); }
mkdirSync(out, { recursive: true });
const only = process.argv[3] ?? "";

// mean luminance (0..255) and its spread over a PNG
function stats(file) {
  const png = PNG.sync.read(readFileSync(file));
  let sum = 0, sq = 0, n = 0;
  for (let i = 0; i < png.data.length; i += 4) {
    const y = 0.2126 * png.data[i] + 0.7152 * png.data[i + 1] + 0.0722 * png.data[i + 2];
    sum += y; sq += y * y; n++;
  }
  const mean = sum / n;
  return { mean, sd: Math.sqrt(Math.max(0, sq / n - mean * mean)) };
}

const server = await createServer({ configFile: join(here, "vite.config.ts"), server: { host: "127.0.0.1", port: 0, strictPort: false }, logLevel: "error" });
let browser;
let failed = 0;
try {
  await server.listen();
  const base = server.resolvedUrls?.local[0];
  if (!base) throw new Error("the gallery's server has no url");
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1180, height: 900 }, deviceScaleFactor: 2 });
  await page.goto(`${base}?motion=0${only ? "&only=" + only : ""}`, { waitUntil: "networkidle" });
  await page.evaluate("document.fonts.ready.then(() => true)");
  const sections = await page.$$eval("[data-testid^='ds.gallery.']", (els) =>
    els.map((e) => e.getAttribute("data-testid") ?? "").filter((id) => id.split(".").length === 3));
  for (const id of sections) {
    const name = id.split(".")[2];
    const s = {};
    for (const theme of ["dark", "light"]) {
      const file = join(out, `${name}-${theme}.png`);
      await page.locator(`[data-testid='${id}.${theme}']`).screenshot({ path: file });
      s[theme] = stats(file);
    }
    const ok = s.dark.sd > 4 && s.light.sd > 4 && s.light.mean > s.dark.mean + 40;
    if (!ok) failed++;
    console.log(`  ${ok ? "✓" : "✗"} ${name}: dark ${s.dark.mean.toFixed(0)}±${s.dark.sd.toFixed(0)}, light ${s.light.mean.toFixed(0)}±${s.light.sd.toFixed(0)}`);
  }
  await page.screenshot({ path: join(out, "gallery.png"), fullPage: true });
  console.log(`${failed ? "✗" : "✓"} gallery: ${sections.length - failed}/${sections.length} sections, shots in ${out}`);
} finally {
  await browser?.close();
  await server.close();
}
process.exit(failed ? 1 : 0);
