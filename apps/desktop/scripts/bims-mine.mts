// The "your bim" studio (page bim-pick): renders src/bims/sprites/mine-page.ts in Playwright's
// bundled headless chromium, one PNG per look and view, named <look>.<view>.png, from a JSON list
// of looks. Studios only, never the app.
//   node --experimental-strip-types scripts/bims-mine.mts <looks.json> <out dir>
// looks.json: [{ "id": "skin-1", "look": { skin, hair, color, wear } (bims/render/look.ts) }, ...]
// Owner: bim-pick.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';

interface Look { readonly skin: number; readonly hair: string; readonly color: number; readonly wear: string }
interface Page { readonly mine: { near(l: Look, size: number, night: boolean): string; coin(l: Look, px: number, night: boolean): string } }

const here = resolve(import.meta.dirname, '..');
const [list, out] = process.argv.slice(2);
if (!list || !out) throw new Error('usage: bims-mine.mts <looks.json> <out dir>');
const looks = JSON.parse(readFileSync(list, 'utf8')) as { id: string; look: Look; views?: string[] }[];
const server = await createServer({
  configFile: false,
  root: resolve(here, 'src/bims/sprites'),
  resolve: { alias: { '@': resolve(here, 'src') } },
  server: { port: 0, host: '127.0.0.1', hmr: false, watch: null },
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
  await page.goto(`http://127.0.0.1:${String(port)}/mine.html`);
  await page.waitForFunction(() => 'mine' in globalThis, null, { timeout: 60_000 }).catch(() => {
    throw new Error(`the studio did not load: ${errors.join('; ')}`);
  });
  mkdirSync(out, { recursive: true });
  const save = (name: string, url: string): void => {
    writeFileSync(resolve(out, name), Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'));
  };
  for (const { id, look, views } of looks) {
    const want = views ?? ['near', 'coin', 'coin-night'];
    if (want.includes('near')) save(`${id}.near.png`, await page.evaluate(([l]) => (globalThis as unknown as Page).mine.near(l, 192, false), [look] as const));
    if (want.includes('near-night')) save(`${id}.near-night.png`, await page.evaluate(([l]) => (globalThis as unknown as Page).mine.near(l, 192, true), [look] as const));
    if (want.includes('coin')) save(`${id}.coin.png`, await page.evaluate(([l]) => (globalThis as unknown as Page).mine.coin(l, 20, false), [look] as const));
    if (want.includes('coin-night')) save(`${id}.coin-night.png`, await page.evaluate(([l]) => (globalThis as unknown as Page).mine.coin(l, 20, true), [look] as const));
    console.log(id);
  }
  if (errors.length > 0) throw new Error(`the studio failed: ${errors.join('; ')}`);
} finally {
  await browser.close();
  await server.close();
}
