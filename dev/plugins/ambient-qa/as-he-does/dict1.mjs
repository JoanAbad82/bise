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
  // c2331eb3's live chip: the meter's bars (steps 0-7) and phase, the sign's phase
  bars: document.querySelector('[data-testid="composer.dictation.meter"]')?.getAttribute('data-bars') ?? null,
  phase: document.querySelector('[data-testid="composer.dictation.meter"]')?.getAttribute('data-phase') ?? null,
  sign: (() => { const s = document.querySelector('[data-testid="composer.dictation"] .chip .sign'); return s ? getComputedStyle(s, '::before').content : null; })(),
})).catch(() => null);
// every meter sample of the take: {ms, phase, bars, sign}
const meter = [];
const sample = (r, ms) => { if (r?.bars != null && (meter.at(-1)?.bars !== r.bars || meter.at(-1)?.phase !== r.phase)) meter.push({ ms, phase: r.phase, bars: r.bars, sign: r.sign }); };

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
for (let i = 0; i < 24; i++) { const r = await read(); if (r && mic.at(-1)?.s !== r.mic) mic.push({ ms: Date.now() - t0, s: r.mic }); sample(r, Date.now() - t0); await wait(50); }
await shot('recording');
await tap();
let got = null;
for (let i = 0; i < 100; i++) {
  const r = await read();
  if (r && mic.at(-1)?.s !== r.mic) mic.push({ ms: Date.now() - t0, s: r.mic });
  sample(r, Date.now() - t0);
  if (r?.phase === 'transcribing' && !res.shots.some((s) => s.includes('transcribing'))) await shot('transcribing');
  const txt = `${r?.value ?? ''} ${r?.field ?? ''}`;
  if (txt.includes(WORDS)) { got = r; break; }
  got = r;
  await wait(100);
}
await shot('after');
const landed = `${got?.value ?? ''} ${got?.field ?? ''}`.includes(WORDS);
step('one ctrl+r take: the fake voice words reach the field', landed, { words: WORDS, got, mic, ms: Date.now() - t0 });
// the meter (c2331eb3): listening bars from his voice's levels, flat (all 0) in silence; while
// transcribing the rolling wave ▂▃▅▆▅▃ (1,2,4,5,4,2 rolled) and the sign ∿. The fake voice sends
// no levels (the core's fake listener): moving bars can't show here, flat ones must.
const listen = meter.filter((m) => m.phase === 'listening');
const trans = meter.filter((m) => m.phase === 'transcribing');
const WAVE = [1, 2, 4, 5, 4, 2];
const isWave = (b) => { const a = b.split(',').map(Number); return WAVE.some((_, k) => [...WAVE.slice(k), ...WAVE.slice(0, k)].join() === a.join()); };
step('the meter while listening: 6 bars; all flat with the fake voice (no levels: silence)', listen.length > 0 && listen.every((m) => m.bars.split(',').length === 6 && m.bars.split(',').every((v) => v === '0')), { listening: listen.slice(0, 8) });
step('the bars move with his voice (needs levels: the fake voice sends none)', listen.some((m) => m.bars.split(',').some((v) => v !== '0')), { distinct: [...new Set(listen.map((m) => m.bars))], harness_limit: 'the fake voice sends no level events' });
step('while transcribing: the ∿ sign and the rolling wave', trans.length > 0 && trans.every((m) => isWave(m.bars)) && trans.some((m) => /∿/.test(m.sign ?? '')), { transcribing: trans.slice(0, 8), frames: new Set(trans.map((m) => m.bars)).size });
await field.fill('').catch(() => {});
await browser.close().catch(() => {});
process.exit(0);
