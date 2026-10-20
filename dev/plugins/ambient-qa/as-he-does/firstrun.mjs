// The first run's model step in the packed app (desk-cut-10, main m_28811; onboard-keys-2
// 6f6130882): the candidate opened on a FRESH stand-in home (cand.sh AS_HE_DOES_FIRSTRUN=1: no key,
// no prefs, the fake provider behind every provider's base_url, the keychain probe off), read over
// CDP on 127.0.0.1. Hello (one 'start': v4 has no permissions step), the model step: an API key ->
// Anthropic -> a bad key fails under its field and is never saved; a good one is checked live,
// "it works" with the model's own answer, the key in auth.json, main's model in config.toml,
// continue enabled. Never the projects step (it scans a home).
//   AS_HE_DOES_FIRST_HOME=<bise home> node firstrun.mjs <cdp port> <out dir>
// Writes <out>/firstrun.json ({steps, shots}) and <out>/firstrun-N-*.png.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = process.env.PW_FROM ?? path.join(HERE, '..', '..', '..', '..', 'apps', 'desktop');
const { chromium } = createRequire(path.join(DESKTOP, 'package.json'))('@playwright/test');
const [port, out] = process.argv.slice(2);
const BH = process.env.AS_HE_DOES_FIRST_HOME;

const res = { mode: 'firstrun', steps: [], shots: [] };
const save = () => fs.writeFileSync(path.join(out, 'firstrun.json'), JSON.stringify(res, null, 1));
const step = (name, ok, info) => { res.steps.push({ name, ok, info: info ?? null }); save(); };
setTimeout(() => { step('driver watchdog', false, '240 s'); process.exit(2); }, 240000).unref();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const read = (f) => { try { return fs.readFileSync(path.join(BH, f), 'utf8'); } catch { return ''; } };

if (!BH) { step('the fresh home (AS_HE_DOES_FIRST_HOME)', false, 'not set'); process.exit(1); }
let browser;
for (const t0 = Date.now(); !browser;) {
  browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`, { timeout: 10000 }).catch((e) => {
    if (Date.now() - t0 > 90000) { step('connect to the app (CDP)', false, String(e).slice(0, 300)); process.exit(1); }
    return null;
  });
  if (!browser) await wait(1000);
}
let page;
for (let i = 0; i < 150 && !page; i++) {
  for (const c of browser.contexts()) for (const p of c.pages()) {
    if (await p.locator('[data-testid="app.root"], [data-testid="setup.root"]').count().catch(() => 0)) page = p;
  }
  if (!page) await wait(200);
}
if (!page) { step('the window page', false, null); process.exit(1); }
let n = 0;
const shot = async (name) => {
  const f = path.join(out, `firstrun-${++n}-${name}.png`);
  try { await page.screenshot({ path: f, timeout: 15000 }); res.shots.push(f); save(); } catch { /* the steps say enough */ }
};
const seen = (id, ms = 20000) => page.getByTestId(id).first().waitFor({ timeout: ms }).then(() => true, () => false);
const txt = (id) => page.getByTestId(id).first().innerText({ timeout: 2000 }).then((t) => t.replace(/\s+/g, ' ').trim(), () => null);

try {
  const hello = await seen('setup.step.hello', 40000);
  await shot('hello');
  step('a fresh home opens on the first run (hello)', hello, { url: page.url() });
  if (!hello) process.exit(1);
  // hello's 'start' leads straight to the model step (v4, 577a153a6: hello, model, projects,
  // first; no permissions step): one click, never a second on the model's still-disabled continue
  await page.getByTestId('setup.next').click({ timeout: 5000 });
  const model = await seen('setup.step.model', 10000) && await seen('setup.pay', 20000);
  const nextOff = await page.getByTestId('setup.next').isDisabled().catch(() => null);
  const rows = await page.evaluate(() => [...document.querySelectorAll('[data-testid^="setup.pay."]')].map((e) => e.getAttribute('data-testid'))).catch(() => []);
  await shot('pay');
  step('the model step lists how to connect (ChatGPT, OpenRouter, an API key, a coding plan); no continue while nothing works', model && nextOff === true
    && ['setup.pay.api', 'setup.pay.chatgpt', 'setup.pay.coding'].every((r) => rows.includes(r)), { nextOff, rows });
  await page.getByTestId('setup.pay.api').click({ timeout: 5000 });
  const which = await seen('setup.pay.which', 8000);
  await shot('which-provider');
  await page.getByTestId('setup.pay.which.anthropic').click({ timeout: 5000 });
  const field = page.getByTestId('setup.pay.key');
  const masked = await field.getAttribute('type', { timeout: 5000 }).catch(() => null);
  step('an API key -> which provider -> Anthropic: a masked field', which && masked === 'password', { which, masked });
  await field.fill('sk-bad-key-123');
  await field.press('Enter');
  const failed = await seen('setup.pay.failed', 30000);
  const failedText = await txt('setup.pay.failed');
  const again = await page.getByTestId('setup.pay.again').count().catch(() => -1);
  await shot('bad-key');
  step("a wrong key is checked live and fails under its field in Anthropic's words, never saved", failed && /Anthropic says this key is wrong/.test(failedText ?? '')
    && again === 0 && !read('auth.json').includes('sk-bad-key'), { failedText, again });
  await field.fill('sk-good-key-123');
  await field.press('Enter');
  const works = await seen('setup.pay.works', 30000);
  const worksText = await txt('setup.pay.works');
  const answer = await txt('setup.pay.answer');
  const stepText = await txt('setup.step.model');
  const body = await page.evaluate(() => document.body.innerText).catch(() => '');
  const nextOn = await page.getByTestId('setup.next').isEnabled().catch(() => null);
  await shot('works');
  const auth = read('auth.json');
  const config = read('config.toml');
  step("a good key: 'it works' with the model's own answer, the key saved in the fresh home's auth.json (never on screen), main's model written, continue enabled",
    works && /it works: .+ answered\./.test(stepText ?? '') && /it said: “/.test(answer ?? '') && auth.includes('sk-good-key-123')
      && /main = "anthropic\//.test(config) && !body.includes('sk-good-key-123') && nextOn === true,
    { worksText, answer, main: /main = "[^"]+"/.exec(config)?.[0] ?? null, keySaved: auth.includes('sk-good-key-123'), nextOn });
} catch (e) { step('first run', false, String(e).slice(0, 300)); }
await browser.close().catch(() => {});
process.exit(0);
