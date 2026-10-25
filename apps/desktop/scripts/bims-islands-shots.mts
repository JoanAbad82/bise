// The live home islands' contact sheet and measures (designer's brief, page bims-home v11), on the
// built site (site/: run `pnpm build:hero` first), served here from a local static server, in
// Playwright's bundled chromium on this Mac's GPU (never an app in /Applications). Writes into <dir>:
//   entry-<id>-<ms>.png   each island's entry, frame by frame, 1440 light
//   move-<id>-<theme>.png each hover move at its peak, light and dark
//   phone.png             the four phone islands at 390
//   reduced-<id>.png      reduced motion: built, its head turned to the pointer
//   fallback.png          no WebGL: the sprites' held pose
//   perf.json             the frames' cost while an entry and hovers play (p50, p95, max ms), the
//                         WebGL contexts on the page, the bundle's weights (gzip)
//   film.webm             one entry and two hovers, light (ffmpeg makes the mp4)
//   index.html            the sheet
// Run it in heavy-run: `heavy-run --low node --experimental-strip-types scripts/bims-islands-shots.mts <dir>`.
// Owner: bims-islands.
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { type Browser, type Page, chromium } from '@playwright/test';

const here = resolve(import.meta.dirname, '..');
const site = resolve(here, '../../site');
const out = resolve(process.argv[2] ?? 'islands-shots');
mkdirSync(out, { recursive: true });

const IDS = ['ways', 'why', 'arts', 'fun', 'hard', 'faq', 'end'] as const;
/** each move's peak, k */
const PEAK: Record<(typeof IDS)[number], number> = { ways: 0.55, why: 0.66, arts: 0.5, fun: 0.45, hard: 0.42, faq: 0.72, end: 0.36 };
const ENTRY_MS = [0, 150, 300, 450, 600, 750, 900, 1100, 1300, 1600];
const ROOM = { l: 40, t: 64, r: 40, b: 24 };
const TYPES: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.webm': 'video/webm' };

const server = createServer((req, res) => {
  const path = decodeURIComponent((req.url ?? '/').split('?')[0] ?? '/');
  let f = join(site, path);
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  else if (!existsSync(f) && existsSync(`${f}.html`)) f = `${f}.html`;
  if (!existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[extname(f)] ?? 'application/octet-stream' });
  createReadStream(f).pipe(res);
});
await new Promise<void>((ok) => server.listen(0, '127.0.0.1', ok));
const addr = server.address();
const base = `http://127.0.0.1:${String(typeof addr === 'object' && addr ? addr.port : 0)}`;

type Still = { entry?: number; gag?: number; move?: number; pointer?: readonly [number, number] };
const errors: string[] = [];

async function open(b: Browser, o: { width: number; dark?: boolean; reduced?: boolean; played?: boolean; video?: string }): Promise<Page> {
  const ctx = await b.newContext({
    viewport: { width: o.width, height: 900 }, deviceScaleFactor: 2, reducedMotion: o.reduced ? 'reduce' : 'no-preference',
    ...(o.video ? { recordVideo: { dir: o.video, size: { width: 1440, height: 900 } } } : {}),
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  if (o.played) await page.addInitScript((ids) => { sessionStorage.setItem('bims-islands', JSON.stringify(ids)); }, [...IDS]);
  await page.goto(`${base}/?herotest${o.dark ? '&dark' : '&light'}`);
  await page.waitForFunction(() => document.querySelectorAll('.bp > div').length > 0, null, { timeout: 30_000 });
  return page;
}

/** an island's box on the page, its canvas's room around it */
async function boxOf(page: Page, id: string, room = ROOM): Promise<{ x: number; y: number; width: number; height: number } | null> {
  await page.evaluate((i) => document.querySelector(`#${i} h2`)?.scrollIntoView({ block: 'center' }), id);
  await page.waitForTimeout(250);
  const i = IDS.indexOf(id as (typeof IDS)[number]);
  const r = await page.evaluate((k) => {
    const el = document.querySelectorAll<HTMLElement>('.bp > div')[k];
    if (!el || el.hidden) return null;
    const b = el.getBoundingClientRect();
    return { x: b.left, y: b.top, w: b.width, h: b.height };
  }, i);
  if (!r) return null;
  return { x: Math.max(0, r.x - room.l), y: Math.max(0, r.y - room.t), width: r.w + room.l + room.r, height: r.h + room.t + room.b };
}

const still = (page: Page, id: string, s: Still): Promise<void> =>
  page.evaluate(([i, x]) => { (window as unknown as { bimsLive: (id: string, s: Still) => void }).bimsLive(i, x); }, [id, s] as const);

const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const shots: { group: string; file: string; label: string }[] = [];
try {
  // 1 · each entry, frame by frame, 1440 light
  {
    const page = await open(browser, { width: 1440, played: true });
    for (const id of IDS) {
      const clip = await boxOf(page, id);
      if (!clip) { errors.push(`${id}: not placed at 1440`); continue; }
      for (const ms of ENTRY_MS) {
        await still(page, id, { entry: ms });
        const file = `entry-${id}-${String(ms)}.png`;
        await page.screenshot({ path: join(out, file), clip });
        shots.push({ group: `entry · ${id}`, file, label: `${String(ms)} ms` });
      }
      // the gag's first frame (the bim landed), then held
      await still(page, id, { gag: 0 });
      await page.screenshot({ path: join(out, `entry-${id}-gag.png`), clip });
      shots.push({ group: `entry · ${id}`, file: `entry-${id}-gag.png`, label: 'gag starts' });
    }
    await page.context().close();
  }
  // 2 · each hover move at its peak, light and dark
  for (const dark of [false, true]) {
    const page = await open(browser, { width: 1440, played: true, dark });
    for (const id of IDS) {
      const clip = await boxOf(page, id);
      if (!clip) continue;
      const m = await page.evaluate((k) => {
        const el = document.querySelectorAll<HTMLElement>('.bp > div')[k];
        return el ? [el.offsetWidth * 0.8, el.offsetHeight * 0.25] as const : [0, 0] as const;
      }, IDS.indexOf(id));
      await still(page, id, { move: PEAK[id], pointer: m });
      const file = `move-${id}-${dark ? 'dark' : 'light'}.png`;
      await page.screenshot({ path: join(out, file), clip });
      shots.push({ group: `hover at its peak · ${dark ? 'dark' : 'light'}`, file, label: id });
    }
    await page.context().close();
  }
  // 3 · 390: the phone's four, built
  {
    const page = await open(browser, { width: 390, played: true });
    for (const id of ['ways', 'why', 'fun', 'end']) {
      const clip = await boxOf(page, id, { l: 8, t: 30, r: 8, b: 12 });
      if (!clip) { errors.push(`${id}: not placed at 390`); continue; }
      await page.waitForTimeout(400);
      const file = `phone-${id}.png`;
      await page.screenshot({ path: join(out, file), clip: { ...clip, x: 0, width: 390 } });
      shots.push({ group: '390', file, label: id });
    }
    await page.context().close();
  }
  // 4 · reduced motion: built at once, only the heads turn
  {
    const page = await open(browser, { width: 1440, reduced: true });
    for (const id of ['ways', 'faq']) {
      const clip = await boxOf(page, id);
      if (!clip) continue;
      await page.waitForTimeout(500);
      await page.screenshot({ path: join(out, `reduced-${id}.png`), clip });
      shots.push({ group: 'reduced motion', file: `reduced-${id}.png`, label: `${id}, as it comes` });
      await page.mouse.move(clip.x + clip.width - 30, clip.y + ROOM.t + 10);
      await page.waitForTimeout(600);
      await page.screenshot({ path: join(out, `reduced-${id}-hover.png`), clip });
      shots.push({ group: 'reduced motion', file: `reduced-${id}-hover.png`, label: `${id}, hovered: the head only` });
    }
    await page.context().close();
  }
  // 5 · no WebGL: the sprites
  {
    const b2 = await chromium.launch({ args: ['--disable-webgl', '--disable-3d-apis'] });
    const ctx = await b2.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(`${base}/?light`);
    await page.waitForFunction(() => document.querySelectorAll('.bp > div').length > 0, null, { timeout: 30_000 });
    for (const id of ['ways', 'arts']) {
      const clip = await boxOf(page, id);
      if (!clip) continue;
      await page.waitForTimeout(800);
      await page.screenshot({ path: join(out, `fallback-${id}.png`), clip });
      shots.push({ group: 'no WebGL: the sprites', file: `fallback-${id}.png`, label: id });
    }
    const canvases = await page.evaluate(() => document.querySelectorAll('.bp canvas').length);
    if (canvases > 0) errors.push(`no WebGL yet ${String(canvases)} canvases`);
    await b2.close();
  }
  // 6 · the measures and the film: a fresh visit, the entries and two hovers for real
  {
    const page = await open(browser, { width: 1440, video: out });
    const frames: number[] = [];
    const take = async (): Promise<void> => {
      frames.push(...await page.evaluate(() => { const w = window as unknown as { __bimsIslands?: { frames: number[] } }; return w.__bimsIslands?.frames.splice(0) ?? []; }));
    };
    await page.waitForTimeout(1500);
    await take();
    const clip = await boxOf(page, 'ways');
    await page.waitForTimeout(5200);
    if (clip) {
      await page.mouse.move(clip.x + clip.width * 0.7, clip.y + clip.height * 0.4, { steps: 8 });
      await page.waitForTimeout(2000);
      await page.mouse.move(10, clip.y + 10, { steps: 6 });
    }
    const c2 = await boxOf(page, 'arts');
    await page.waitForTimeout(5200);
    if (c2) {
      await page.mouse.move(c2.x + c2.width * 0.4, c2.y + c2.height * 0.5, { steps: 8 });
      await page.waitForTimeout(2200);
      await page.mouse.move(10, c2.y + 10, { steps: 6 });
      await page.waitForTimeout(600);
    }
    await take();
    const contexts = await page.evaluate(() => document.querySelectorAll('canvas').length);
    const s = [...frames].sort((a, b) => a - b);
    const pick = (p: number): number => s[Math.min(s.length - 1, Math.floor(p * s.length))] ?? 0;
    const gz = (f: string): number => gzipSync(readFileSync(join(site, f))).length;
    const perf = {
      frames: s.length, p50: pick(0.5), p95: pick(0.95), max: s.at(-1) ?? 0, dpr: 2, viewport: '1440x900',
      canvasesOnPage: contexts,
      gzipKB: Object.fromEntries(['desktop/hero/hero.js', 'desktop/hero/film.js', 'desktop/hero/islands.js', 'desktop/hero/film3.js', 'bims-islands.js', 'bims/islands.json'].filter((f) => existsSync(join(site, f))).map((f) => [f, +(gz(f) / 1024).toFixed(1)])),
    };
    writeFileSync(join(out, 'perf.json'), `${JSON.stringify(perf, null, 2)}\n`);
    const video = page.video();
    await page.context().close();
    if (video) writeFileSync(join(out, 'film.txt'), await video.path());
  }
} finally {
  await browser.close();
  server.close();
}
const groups = [...new Set(shots.map((s) => s.group))];
const html = `<!doctype html><meta charset="utf-8"><title>live islands · contact sheet</title>
<style>body{font:13px system-ui;background:#f7f2e9;color:#2b211b;margin:24px}h2{font-size:14px;margin:22px 0 8px}div.g{display:flex;flex-wrap:wrap;gap:8px}figure{margin:0;background:#fff;border:1px solid #e3d6c6;border-radius:6px;padding:4px}figure.d{background:#24201c}img{display:block;height:180px}figcaption{font-size:11px;color:#7a6a5c;padding-top:2px}</style>
<h1>the live home islands</h1>
${groups.map((g) => `<h2>${g}</h2><div class="g">${shots.filter((s) => s.group === g).map((s) => `<figure${s.file.includes('dark') ? ' class="d"' : ''}><img src="${s.file}"><figcaption>${s.label}</figcaption></figure>`).join('')}</div>`).join('\n')}
<h2>errors</h2><pre>${errors.join('\n') || 'none'}</pre>`;
writeFileSync(join(out, 'index.html'), html);
console.log(JSON.stringify({ shots: shots.length, errors }));
