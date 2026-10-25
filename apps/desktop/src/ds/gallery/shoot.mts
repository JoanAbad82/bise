// src/ds · the gallery's visual check: serve the gallery (Vite, in process, 127.0.0.1), open it in
// headless Chrome (Playwright, no window, nothing on his screens), take one PNG per section and
// theme, and check the pixels: every pane draws something, and each light pane is lighter than its
// dark one (the tokens switch with data-theme). Then stop the browser and the server.
//
//   node src/ds/gallery/shoot.mts <out dir> [section,section…]
//
// Stills: ?motion=0 stops every animation and transition. Exit 1 on a failed pane.
/* global getComputedStyle -- used inside page.$$eval, which runs in the page */
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { PNG } from "pngjs";
import { createServer } from "vite";

const here = import.meta.dirname;
const out = process.argv[2];
if (!out) { console.error("usage: node src/ds/gallery/shoot.mts <out dir> [sections]"); process.exit(2); }
mkdirSync(out, { recursive: true });
const only = process.argv[3] ?? "";

// mean luminance (0..255) and its spread over a PNG
function stats(file: string) {
  const png = PNG.sync.read(readFileSync(file));
  let sum = 0, sq = 0, n = 0;
  const at = (i: number) => png.data[i] ?? 0;
  for (let i = 0; i < png.data.length; i += 4) {
    const y = 0.2126 * at(i) + 0.7152 * at(i + 1) + 0.0722 * at(i + 2);
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
    const shot = async (theme: "dark" | "light") => {
      const file = join(out, `${name}-${theme}.png`);
      await page.locator(`[data-testid='${id}.${theme}']`).screenshot({ path: file });
      return stats(file);
    };
    const s = { dark: await shot("dark"), light: await shot("light") };
    const ok = s.dark.sd > 4 && s.light.sd > 4 && s.light.mean > s.dark.mean + 40;
    if (!ok) failed++;
    console.log(`  ${ok ? "✓" : "✗"} ${name}: dark ${s.dark.mean.toFixed(0)}±${s.dark.sd.toFixed(0)}, light ${s.light.mean.toFixed(0)}±${s.light.sd.toFixed(0)}`);
  }
  await page.screenshot({ path: join(out, "gallery.png"), fullPage: true });

  // never by color alone (bar N2): with increase contrast, the states of each contrast group must
  // differ by something that isn't a color: words, ::before/::after glyphs, a background pattern's
  // geometry, an outline. Colors are stripped from the signature. Without the media, the chip
  // group must NOT pass (the check sees color-only cues), else it proves nothing.
  if (sections.includes("ds.gallery.contrast")) {
    const signatures = () => page.$$eval("[data-testid^='ds.contrast.']", (els) => {
      const strip = (s: string) => s.replace(/(rgba?|hsla?|color|oklch|oklab|lab|lch|color-mix)\([^()]*(\([^()]*\)[^()]*)*\)/g, "C").replace(/#[0-9a-f]{3,8}\b/gi, "C");
      const sig = (el: Element) => {
        const parts = [el.textContent];
        for (const n of [el, ...Array.from(el.querySelectorAll("*"))]) {
          for (const pseudo of ["::before", "::after"]) {
            const c = getComputedStyle(n, pseudo).content;
            if (c && c !== "none" && c !== "normal") parts.push(pseudo + c);
          }
          const cs = getComputedStyle(n);
          if (cs.backgroundImage !== "none") parts.push("bg:" + strip(cs.backgroundImage));
          if (cs.boxShadow !== "none") parts.push("sh:" + strip(cs.boxShadow));
        }
        return parts.join("|");
      };
      return els.filter((e) => (e.getAttribute("data-testid") ?? "").split(".").length === 4 && e.closest("[data-theme='dark']"))
        .map((e) => { const [, , group, state] = (e.getAttribute("data-testid") ?? "").split("."); return { group, state, sig: sig(e) }; });
    });
    const clashes = (items: { group?: string; state?: string; sig: string }[]) => {
      const out: string[] = [];
      for (const a of items) for (const b of items) if (a.group === b.group && (a.state ?? "") < (b.state ?? "") && a.sig === b.sig) out.push(`${a.group}: ${a.state} = ${b.state}`);
      return out;
    };
    const plain = clashes(await signatures());
    if (!plain.some((c) => c.startsWith("chip:"))) { failed++; console.log("  ✗ contrast: without the media the chips already differ: the check can't see color-only cues"); }
    await page.emulateMedia({ contrast: "more" });
    const items = await signatures();
    const bad = clashes(items);
    if (bad.length) failed++;
    console.log(`  ${bad.length ? "✗" : "✓"} never by color alone (increase contrast): ${items.length} states in ${new Set(items.map((i) => i.group)).size} groups${bad.length ? ", same without color: " + bad.join("; ") : ""} (without it: ${plain.length} clashes)`);
    for (const theme of ["dark", "light"]) {
      await page.locator(`[data-testid='ds.gallery.contrast.${theme}']`).screenshot({ path: join(out, `contrast-more-${theme}.png`) });
    }
    await page.emulateMedia({ contrast: null });
  }
  console.log(`${failed ? "✗" : "✓"} gallery: ${sections.length - failed}/${sections.length} sections, shots in ${out}`);
} finally {
  await browser?.close();
  await server.close();
}
process.exit(failed ? 1 : 0);
