// bise.dev's home gags (page bims-home): renders src/bims/sprites/gags.ts with the app's bims
// (src/bims/sprites/studio.ts) in Playwright's bundled headless chromium, never an app in
// /Applications, and writes site/bims/: one WebP sheet per gag (<id>.webp, its frames side by
// side), one idle sheet (<id>-idle.webp: its last pose and its blink) and sheets.json, what
// site/bims-gags.ts reads (frame size, anchor, order, hit box). Each sheet's quality steps down
// until it weighs SHEET_MAX at most, then the heaviest ones a step down while all of them pass
// ALL_MAX; the run fails past the budgets.
//   pnpm sprites:home              write site/bims/
//   pnpm sprites:home --look <dir> also write each strip as a PNG there, to look at it
// Owner: bims-home.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const here = resolve(import.meta.dirname, '..');
const out = resolve(here, '../../site/bims');
const KB = 1024;
/** the brief's weight: a gag sheet 35 KB at most, all of them with their idle sheets 300 KB */
const SHEET_MAX = 35 * KB;
const ALL_MAX = 300 * KB;
const QUALITIES = [0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5];
const IDLE_Q = 0.85;

/** what the studio page (src/bims/sprites/studio-page.ts) puts on its window */
interface Studio {
  readonly studio: {
    ids(): string[];
    render(id: string, q: number, qIdle: number): { meta: object; gag: string; idle: string };
    png(id: string): string;
  };
}

const look = process.argv.includes('--look') ? process.argv[process.argv.indexOf('--look') + 1] : undefined;

const server = await createServer({
  configFile: false,
  root: resolve(here, 'src/bims/sprites'),
  resolve: { alias: { '@': resolve(here, 'src') } },
  server: { port: 0, host: '127.0.0.1' },
  logLevel: 'error',
});
await server.listen();
const addr = server.httpServer?.address();
const port = typeof addr === 'object' && addr ? addr.port : 0;
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${String(port)}/index.html`);
  await page.waitForFunction(() => 'studio' in globalThis, null, { timeout: 30_000 });
  const ids = await page.evaluate(() => (globalThis as unknown as Studio).studio.ids());
  mkdirSync(out, { recursive: true });
  if (look) mkdirSync(look, { recursive: true });
  const bytes = (url: string): Buffer => Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
  const render = async (id: string, qi: number): Promise<{ meta: object; gag: Buffer; idle: Buffer; qi: number }> => {
    const q = QUALITIES[qi] ?? 0.5;
    const r = await page.evaluate(([i, a, b]) => (globalThis as unknown as Studio).studio.render(i, a, b), [id, q, IDLE_Q] as const);
    return { meta: r.meta, gag: bytes(r.gag), idle: bytes(r.idle), qi };
  };
  const got = new Map<string, { meta: object; gag: Buffer; idle: Buffer; qi: number }>();
  for (const id of ids) {
    // each sheet's quality steps down until it weighs SHEET_MAX at most
    let g = await render(id, 0);
    while (g.gag.length > SHEET_MAX && g.qi < QUALITIES.length - 1) g = await render(id, g.qi + 1);
    if (g.gag.length > SHEET_MAX) throw new Error(`${id}: ${(g.gag.length / KB).toFixed(1)} KB at quality ${String(QUALITIES[g.qi])}, past ${String(SHEET_MAX / KB)} KB`);
    got.set(id, g);
  }
  const sum = (): number => [...got.values()].reduce((n, g) => n + g.gag.length + g.idle.length, 0);
  // then the heaviest sheet a step down while all of them pass ALL_MAX (the clay bims of page bims-look D weigh more)
  while (sum() > ALL_MAX) {
    const heavy = [...got.entries()].filter(([, g]) => g.qi < QUALITIES.length - 1).sort((a, b) => b[1].gag.length - a[1].gag.length)[0];
    if (!heavy) break;
    got.set(heavy[0], await render(heavy[0], heavy[1].qi + 1));
  }
  const metas: object[] = [];
  const lines: string[] = [];
  for (const id of ids) {
    const g = got.get(id);
    if (!g) throw new Error(`${id}: nothing drawn`);
    writeFileSync(resolve(out, `${id}.webp`), g.gag);
    writeFileSync(resolve(out, `${id}-idle.webp`), g.idle);
    metas.push(g.meta);
    lines.push(`${id.padEnd(11)} ${(g.gag.length / KB).toFixed(1).padStart(5)} KB (q ${(QUALITIES[g.qi] ?? 0).toFixed(2)}) + idle ${(g.idle.length / KB).toFixed(1)} KB`);
    if (look) writeFileSync(resolve(look, `${id}.png`), bytes(await page.evaluate((i) => (globalThis as unknown as Studio).studio.png(i), id)));
  }
  const total = sum();
  if (errors.length > 0) throw new Error(`the studio page failed: ${errors.join('; ')}`);
  writeFileSync(resolve(out, 'sheets.json'), `${JSON.stringify(metas)}\n`);
  console.log(lines.join('\n'));
  console.log(`all: ${(total / KB).toFixed(1)} KB (budget ${String(ALL_MAX / KB)} KB)`);
  if (total > ALL_MAX) throw new Error(`the sheets weigh ${(total / KB).toFixed(1)} KB, past ${String(ALL_MAX / KB)} KB`);
} finally {
  await browser.close();
  await server.close();
}
