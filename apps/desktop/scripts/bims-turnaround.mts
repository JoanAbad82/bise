// The women's cuts' turnaround sheets (docs/brand/bims.md "women among the bims"): renders
// src/bims/sprites/turnaround-page.ts in Playwright's bundled headless chromium, one PNG per cut, for
// the reviewer and designer to compare with the intent sheet. Studios only, never the app.
//   node --experimental-strip-types scripts/bims-turnaround.mts <out dir> [cut ...]
// Owner: bims-girls.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';

interface Page {
  readonly turnaround: { cuts(): string[]; sheet(cut: string): string };
}

const here = resolve(import.meta.dirname, '..');
const out = process.argv[2];
if (!out) throw new Error('usage: bims-turnaround.mts <out dir> [cut ...]');
const only = process.argv.slice(3);
const server = await createServer({
  configFile: false,
  root: resolve(here, 'src/bims/sprites'),
  resolve: { alias: { '@': resolve(here, 'src') } },
  // no hot reload: an edit while it renders never reloads the page under it
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
  await page.goto(`http://127.0.0.1:${String(port)}/turnaround.html`);
  await page.waitForFunction(() => 'turnaround' in globalThis, null, { timeout: 60_000 }).catch(() => {
    throw new Error(`the turnaround page did not load: ${errors.join('; ')}`);
  });
  const cuts = await page.evaluate(() => (globalThis as unknown as Page).turnaround.cuts());
  mkdirSync(out, { recursive: true });
  for (const cut of cuts.filter((c) => only.length === 0 || only.includes(c))) {
    const url = await page.evaluate((c) => (globalThis as unknown as Page).turnaround.sheet(c), cut);
    const file = resolve(out, `${cut}.png`);
    writeFileSync(file, Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'));
    console.log(file);
  }
  if (errors.length > 0) throw new Error(`the turnaround page failed: ${errors.join('; ')}`);
} finally {
  await browser.close();
  await server.close();
}
