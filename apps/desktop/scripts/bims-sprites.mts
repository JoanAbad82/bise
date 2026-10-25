// bise.dev's home islands (prototype A of page bims-home v4): renders src/bims/sprites/gags.ts with
// the app's bims (src/bims/sprites/studio.ts) in Playwright's bundled headless chromium, never an
// app in /Applications, and writes site/bims/: per island its base (<id>.webp: the island and its
// props), its frames' strip (<id>-f.webp: the bim, its shadow and the notes, over the base) and
// islands.json, what site/bims-proto.ts reads. Both islands share one quality, stepped down until
// they weigh ALL_MAX at most; the run fails past it.
//   pnpm sprites:home              write site/bims/
//   pnpm sprites:home --look <dir> also write each base and strip as a PNG there, to look at them
// Owner: bims-proto.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const here = resolve(import.meta.dirname, '..');
const out = resolve(here, '../../site/bims');
const KB = 1024;
/** the brief's weight: both islands, bases and frames, 70 KB at most */
const ALL_MAX = 70 * KB;
const QUALITIES = [0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5];

/** what the studio page (src/bims/sprites/studio-page.ts) puts on its window */
interface Studio {
  readonly studio: {
    ids(): string[];
    render(id: string, q: number): { meta: object; base: string; frames: string };
    png(id: string): { base: string; frames: string };
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
  const bytes = (url: string): Buffer => Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
  const renderAll = async (q: number): Promise<{ id: string; meta: object; base: Buffer; frames: Buffer }[]> => {
    const got: { id: string; meta: object; base: Buffer; frames: Buffer }[] = [];
    for (const id of ids) {
      const r = await page.evaluate(([i, x]) => (globalThis as unknown as Studio).studio.render(i, x), [id, q] as const);
      got.push({ id, meta: r.meta, base: bytes(r.base), frames: bytes(r.frames) });
    }
    return got;
  };
  const weight = (g: { base: Buffer; frames: Buffer }[]): number => g.reduce((n, x) => n + x.base.length + x.frames.length, 0);
  let qi = 0;
  let got = await renderAll(QUALITIES[qi] ?? 0.5);
  while (weight(got) > ALL_MAX && qi < QUALITIES.length - 1) got = await renderAll(QUALITIES[++qi] ?? 0.5);
  if (errors.length > 0) throw new Error(`the studio page failed: ${errors.join('; ')}`);
  const total = weight(got);
  for (const g of got) console.log(`${g.id.padEnd(5)} base ${(g.base.length / KB).toFixed(1)} KB + frames ${(g.frames.length / KB).toFixed(1)} KB, ${JSON.stringify(g.meta)}`);
  if (look) {
    mkdirSync(look, { recursive: true });
    for (const g of got) {
      const p = await page.evaluate((i) => (globalThis as unknown as Studio).studio.png(i), g.id);
      writeFileSync(resolve(look, `${g.id}.png`), bytes(p.base));
      writeFileSync(resolve(look, `${g.id}-f.png`), bytes(p.frames));
    }
  }
  if (total > ALL_MAX) throw new Error(`the islands weigh ${(total / KB).toFixed(1)} KB, past ${String(ALL_MAX / KB)} KB`);
  mkdirSync(out, { recursive: true });
  for (const g of got) {
    writeFileSync(resolve(out, `${g.id}.webp`), g.base);
    writeFileSync(resolve(out, `${g.id}-f.webp`), g.frames);
  }
  writeFileSync(resolve(out, 'islands.json'), `${JSON.stringify(got.map((g) => g.meta))}\n`);
  console.log(`all: ${(total / KB).toFixed(1)} KB at quality ${String(QUALITIES[qi])} (budget ${String(ALL_MAX / KB)} KB)`);
} finally {
  await browser.close();
  await server.close();
}
