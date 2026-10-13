// One real ctrl+r take in the packed app's composer (ambient-lead m_22430): the candidate opened
// with BISE_AMBIENT_FAKE_VOICE=<words file> on the real-shaped world, read over CDP on 127.0.0.1.
//   AS_HE_DOES_VOICE=<words file> node dict1.mjs <cdp port> <out dir>
// harness' composer, the words written to the file, ctrl+r tapped, 1.2 s, ctrl+r tapped again:
// the words must reach the field. Writes <out>/dict1.json ({steps, shots}) and <out>/dict1-N-*.png.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = process.env.PW_FROM ?? path.join(HERE, '..', '..', '..', '..', 'apps', 'desktop');
const { chromium } = createRequire(path.join(DESKTOP, 'package.json'))('@playwright/test');
const [port, out] = process.argv.slice(2);
const VOICE = process.env.AS_HE_DOES_VOICE;
const WORDS = 'take one alpha bravo charlie';

const res = { mode: 'dict1', steps: [], shots: [] };
const save = () => fs.writeFileSync(path.join(out, 'dict1.json'), JSON.stringify(res, null, 1));
const step = (name, ok, info) => { res.steps.push({ name, ok, info: info ?? null }); save(); };
setTimeout(() => { step('driver watchdog', false, '120 s'); process.exit(2); }, 120000).unref();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

if (!VOICE) { step('the fake voice words file (AS_HE_DOES_VOICE)', false, 'not set'); process.exit(1); }
let browser;
for (const t0 = Date.now(); !browser;) {
  browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`, { timeout: 10000 }).catch((e) => {
    if (Date.now() - t0 > 90000) { step('connect to the app (CDP)', false, String(e).slice(0, 300)); process.exit(1); }
    return null;
  });
  if (!browser) await wait(1000);
}
let page;
for (let i = 0; i < 100 && !page; i++) {
  for (const c of browser.contexts()) for (const p of c.pages()) {
    if (await p.locator('[data-testid="app.root"]').count().catch(() => 0)) page = p;
  }
  if (!page) await wait(200);
}
if (!page) { step('the window page', false, null); process.exit(1); }
let n = 0;
const shot = async (name) => {
  const f = path.join(out, `dict1-${++n}-${name}.png`);
  try { await page.screenshot({ path: f, timeout: 15000 }); res.shots.push(f); save(); } catch { /* the steps say enough */ }
};
const tap = async () => {
  await page.keyboard.down('Control');
  await page.keyboard.down('r');
  await wait(60);
  await page.keyboard.up('r');
  await page.keyboard.up('Control');
};
const read = () => page.evaluate(() => ({
  field: document.querySelector('[data-testid="composer.field"]')?.textContent ?? null,
  value: document.querySelector('[data-testid="composer.field"]')?.value ?? null,
  mic: document.querySelector('[data-testid="composer.mic"]')?.getAttribute('data-state') ?? null,
  note: document.querySelector('[data-testid="composer.note"]')?.textContent ?? null,
  why: document.querySelector('[data-testid="composer.dictation.why"]')?.textContent ?? null,
})).catch(() => null);

await page.locator('[data-testid="app.sidebar"]').first().waitFor({ timeout: 20000 }).catch(() => {});
await page.locator('[data-testid="app.sidebar"]').getByText('harness', { exact: true }).first().click({ timeout: 8000 }).catch(() => {});
const field = page.locator('[data-testid="composer.field"]:visible').first();
const there = await field.waitFor({ timeout: 15000 }).then(() => true, () => false);
step("harness' composer", there, null);
if (!there) { await shot('no-composer'); process.exit(1); }
await field.click({ timeout: 5000 }).catch(() => {});
await field.fill('').catch(() => {});
fs.writeFileSync(VOICE, WORDS);
const mic = [];
const t0 = Date.now();
await tap();
for (let i = 0; i < 12; i++) { const r = await read(); if (r && mic.at(-1)?.s !== r.mic) mic.push({ ms: Date.now() - t0, s: r.mic }); await wait(100); }
await shot('recording');
await tap();
let got = null;
for (let i = 0; i < 100; i++) {
  const r = await read();
  if (r && mic.at(-1)?.s !== r.mic) mic.push({ ms: Date.now() - t0, s: r.mic });
  const txt = `${r?.value ?? ''} ${r?.field ?? ''}`;
  if (txt.includes(WORDS)) { got = r; break; }
  got = r;
  await wait(100);
}
await shot('after');
const landed = `${got?.value ?? ''} ${got?.field ?? ''}`.includes(WORDS);
step('one ctrl+r take: the fake voice words reach the field', landed, { words: WORDS, got, mic, ms: Date.now() - t0 });
await field.fill('').catch(() => {});
await browser.close().catch(() => {});
process.exit(0);
