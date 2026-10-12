// The as-he-does run's window reader (ambient-lead m_18718, m_18946): the promoted app on the
// real-shaped world, read over CDP on 127.0.0.1 only, page events only. Never a native panel:
// settings.add.choose (the folder picker) is never touched.
//   node driver.mjs <cdp port> <out dir> <first|second>
// first: the open frame, the banner, settings › projects, the add sheet's scan and one add, a
// message to a project's main and its answer. second: the open frame and the banner.
// Writes <out>/<mode>.json ({steps: [{name, ok, info}], shots}) and <out>/<mode>-N-*.png.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = process.env.PW_FROM ?? path.join(HERE, '..', '..', '..', '..', 'apps', 'desktop');
const { chromium } = createRequire(path.join(DESKTOP, 'package.json'))('@playwright/test');
const [port, out, mode] = process.argv.slice(2);
const WATCHDOG_MS = Number(process.env.AS_HE_DOES_WATCHDOG_MS ?? 600000);
const ANSWER_MS = Number(process.env.AS_HE_DOES_ANSWER_MS ?? 240000);
const MESSAGE = 'hello from the as-he-does proof';

const res = { mode, steps: [], shots: [] };
const save = () => fs.writeFileSync(path.join(out, `${mode}.json`), JSON.stringify(res, null, 1));
const step = (name, ok, info) => { res.steps.push({ name, ok, info: info ?? null }); save(); };
setTimeout(() => { step('driver watchdog', false, `${WATCHDOG_MS / 1000} s`); process.exit(2); }, WATCHDOG_MS).unref();

const browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`, { timeout: 20000 });
let page;
for (let i = 0; i < 100 && !page; i++) {
  for (const c of browser.contexts()) for (const p of c.pages()) {
    if (await p.locator('[data-testid="app.root"]').count().catch(() => 0)) page = p;
  }
  if (!page) await new Promise((r) => setTimeout(r, 200));
}
res.pages = browser.contexts().flatMap((c) => c.pages().map((p) => p.url()));
if (!page) { step('the window page', false, res.pages); process.exit(1); }

let n = 0;
const shot = async (name) => {
  const f = path.join(out, `${mode}-${++n}-${name}.png`);
  try { await page.screenshot({ path: f, timeout: 15000 }); }
  catch {
    try {
      const cdp = await page.context().newCDPSession(page);
      const r = await cdp.send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(f, Buffer.from(r.data, 'base64'));
    } catch (e) { step(`frame ${name}`, false, String(e).slice(0, 200)); return; }
  }
  res.shots.push(f); save();
};
const text = (sel) => page.locator(sel).first().innerText({ timeout: 3000 }).catch(() => null);
const click = async (name, loc) => {
  try { await loc.click({ timeout: 8000 }); return true; }
  catch (e) { step(name, false, String(e).slice(0, 240)); return false; }
};
const until = async (fn, ms, every = 1000) => {
  const t0 = Date.now();
  for (;;) {
    const v = await fn().catch(() => null);
    if (v) return v;
    if (Date.now() - t0 > ms) return null;
    await page.waitForTimeout(every);
  }
};

await page.locator('[data-testid="app.sidebar"]').first().waitFor({ timeout: 20000 }).catch(() => {});
await shot('open');
const upd = await text('[data-testid="app.update.text"]');
step("no 'didn't start right' banner", !(upd ?? '').includes("didn't start right"), upd);
step('core line', true, await text('[data-testid="app.core"]'));
const side = await text('[data-testid="app.sidebar"]');
step('sidebar', !!side, side);

if (mode === 'first') {
  // the sidebar's '+ add a project' opens amb-home's add sheet in place (amb-win a83184e3), as he
  // does; when it doesn't, settings › projects and its own 'add a project'
  const sheet = page.locator('[data-testid="settings.add"]').first();
  let opened = await click('add a project (sidebar)', page.locator('[data-testid="app.sidebar.add"]').first());
  let shown = opened && await sheet.waitFor({ timeout: 10000 }).then(() => true, () => false);
  if (!shown) {
    await click('open settings', page.locator('[data-testid="app.sidebar.settings"]').first());
    const root = page.locator('[data-testid="settings.root"]').first();
    await root.waitFor({ timeout: 8000 }).catch(() => {});
    await click('settings › projects', root.getByText('projects', { exact: true }).first());
    await page.locator('[data-testid="settings.projects"]').first().waitFor({ timeout: 8000 }).catch(() => {});
    await shot('settings-projects');
    opened = await click('add a project (settings)', page.locator('[data-testid="settings.project.add"]').first());
    shown = opened && await sheet.waitFor({ timeout: 10000 }).then(() => true, () => false);
  }
  step('the add sheet opens from the sidebar', shown, null);
  step('the add sheet opens', shown, await text('[data-testid="settings.add"]'));
  // the scan: its found list with a count (never the folder picker)
  const found = page.locator('[data-testid="settings.add.found"]').first();
  const ft = shown ? await until(async () => {
    const t = await found.innerText({ timeout: 1000 });
    return t && /\d/.test(t) && !/scanning|looking/i.test(t) ? t : null;
  }, 120000) : null;
  await shot('scan');
  step('the scan answers with its count', !!ft, (ft ?? (await text('[data-testid="settings.add"]')) ?? '').slice(0, 800));
  // designer's final sign (ambient-lead m_19035): the sheet open after the scan answered, light
  if (ft) {
    // back to the scheme the page had, said explicitly: emulateMedia(null) can leave it on the other one
    const was = await page.evaluate(() => (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')).catch(() => null);
    await page.emulateMedia({ colorScheme: 'light' }).catch(() => {});
    await page.waitForTimeout(400);
    await shot('add-sheet-light');
    if (was !== 'light') await page.emulateMedia({ colorScheme: was ?? null }).catch(() => {});
  }
  // one found repo, then add. a found row is `settings.add.found.<path>` (the Group's row, its text does
  // nothing); its tick box is the role=checkbox `settings.add.found.<name>` inside it (AddSheet.tsx)
  const boxes = page.locator('[role="checkbox"][data-testid^="settings.add.found."]');
  const count = await boxes.count().catch(() => 0);
  let picked = null;
  let ticked = false;
  if (count > 0) {
    const box = boxes.first();
    picked = await box.getAttribute('data-testid').catch(() => null);
    await click('tick a found repo', box);
    ticked = (await until(async () => (await box.getAttribute('aria-checked').catch(() => null)) === 'true' || null, 5000, 250)) === true;
  }
  const go = page.locator('[data-testid="settings.add.go"]').first();
  const goOn = await until(async () => (await go.isEnabled({ timeout: 1000 }).catch(() => false)) || null, 5000, 250) === true;
  const say = async () => await text('[data-testid="settings.add.say"]');
  if (goOn) await click('add', go);
  const grew = goOn ? await until(async () => {
    const s = await text('[data-testid="app.sidebar"]');
    return s && s !== side ? s : null;
  }, 60000) : null;
  const why = grew ? null : await say();
  await shot('added');
  step("'add a project' adds one (the sidebar shows it) or says why", goOn ? !!grew || !!why : false,
    { found_rows: count, picked, ticked, go_enabled: goOn, sidebar_after: grew, said: why, sheet: await text('[data-testid="settings.add"]') });
  // the sheet must not stay over the window: an open sheet takes the clicks the message step needs
  const still = await page.locator('[data-testid="settings.add"]').first().isVisible().catch(() => false);
  if (still) {
    await click('cancel the add sheet', page.locator('[data-testid="settings.add.cancel"]').first());
    await page.locator('[data-testid="settings.add"]').first().waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }
  // a message to a project's main, and its answer
  await click('open harness', page.locator('[data-testid="app.sidebar"]').getByText('harness', { exact: true }).first());
  const composer = page.locator('[data-testid="composer"] [contenteditable="true"], [data-testid="composer"] textarea').first();
  const typed = await click('the composer', composer);
  if (typed) {
    await page.keyboard.type(MESSAGE, { delay: 15 });
    await page.keyboard.press('Enter');
  }
  // the answer: a thread row (thread.entry.<pos>, rows.tsx) after his row with the message, whose
  // kind isn't 'you' and that has words (a tools or thinking row alone isn't an answer). Never the
  // text after the message in the page: his row's own '11:47 ✓✓' read as an answer in run 3
  const answer = typed ? await until(() => page.evaluate((msg) => {
    const rows = [...document.querySelectorAll('[data-testid^="thread.entry."]')];
    const mine = rows.findIndex((r) => r.getAttribute('data-kind') === 'you' && (r.textContent ?? '').includes(msg));
    if (mine < 0) return null;
    for (const r of rows.slice(mine + 1)) {
      const kind = r.getAttribute('data-kind') ?? '';
      const words = (r.textContent ?? '').trim();
      if (kind !== 'you' && kind !== 'tools' && kind !== 'thinking' && words.length > 0) return `${kind}: ${words.slice(0, 400)}`;
    }
    return null;
  }, MESSAGE), ANSWER_MS, 2000) : null;
  await shot('message');
  step("a message to a project's main gets its answer", !!answer, answer ?? (await text('[data-testid="app.main"]'))?.slice(-800));
}
await browser.close().catch(() => {});
