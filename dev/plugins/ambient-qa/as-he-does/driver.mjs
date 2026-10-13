// The as-he-does run's window reader (ambient-lead m_18718, m_18946): the promoted app on the
// real-shaped world, read over CDP on 127.0.0.1 only, page events only. Never a native panel:
// settings.add.choose (the folder picker) is never touched.
//   node driver.mjs <cdp port> <out dir> <first|second|draft-type|draft-check> [<draft text>]
// first: the open frame, the banner, settings › projects, the add sheet's scan and one add, a
// message to a project's main and its answer. second: the open frame and the banner.
// draft-type: harness' composer gets <draft text>, never sent (ambient-lead m_19525); draft-check,
// after the restart: the same composer holds it again. Each writes <out>/<mode>[-<tag>].json.
// Writes <out>/<mode>.json ({steps: [{name, ok, info}], shots}) and <out>/<mode>-N-*.png.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = process.env.PW_FROM ?? path.join(HERE, '..', '..', '..', '..', 'apps', 'desktop');
const { chromium } = createRequire(path.join(DESKTOP, 'package.json'))('@playwright/test');
const [port, out, mode, draft] = process.argv.slice(2);
const tag = process.env.AS_HE_DOES_TAG ? `-${process.env.AS_HE_DOES_TAG}` : '';
const WATCHDOG_MS = Number(process.env.AS_HE_DOES_WATCHDOG_MS ?? 600000);
const ANSWER_MS = Number(process.env.AS_HE_DOES_ANSWER_MS ?? 240000);
const MESSAGE = 'hello from the as-he-does proof';

const res = { mode, steps: [], shots: [] };
const save = () => fs.writeFileSync(path.join(out, `${mode}${tag}.json`), JSON.stringify(res, null, 1));
const step = (name, ok, info) => { res.steps.push({ name, ok, info: info ?? null }); save(); };
setTimeout(() => { step('driver watchdog', false, `${WATCHDOG_MS / 1000} s`); process.exit(2); }, WATCHDOG_MS).unref();

// the app's CDP port answers some seconds after the open (c28260a9's first run: 3 drives refused at
// once, ECONNREFUSED): retried for up to 90 s, then a failed step, never an uncaught error
let browser;
for (const t0 = Date.now(); !browser;) {
  browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`, { timeout: 10000 }).catch((e) => {
    if (Date.now() - t0 > 90000) { step('connect to the app (CDP)', false, String(e).slice(0, 300)); process.exit(1); }
    return null;
  });
  if (!browser) await new Promise((r) => setTimeout(r, 1000));
}
let page;
for (let i = 0; i < 100 && !page; i++) {
  for (const c of browser.contexts()) for (const p of c.pages()) {
    if (await p.locator('[data-testid="app.root"]').count().catch(() => 0)) page = p;
  }
  if (!page) await new Promise((r) => setTimeout(r, 200));
}
res.pages = browser.contexts().flatMap((c) => c.pages().map((p) => p.url()));
if (!page) { step('the window page', false, res.pages); process.exit(1); }

page.on('close', () => closed());
let n = 0;
const shot = async (name) => {
  const f = path.join(out, `${mode}${tag}-${++n}-${name}.png`);
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
// the window can go away under a pass (7e691aef's rerun: the candidate quit at 07:48:09, rows2 then
// crashed in page.waitForTimeout): say it as a red step and end the pass, never an uncaught error
let ending = false;
const closed = () => {
  if (ending) return;
  step('the window stayed open through the pass', false, 'the page closed');
  process.exit(3);
};
const until = async (fn, ms, every = 1000) => {
  const t0 = Date.now();
  for (;;) {
    if (page.isClosed()) closed();
    const v = await fn().catch(() => null);
    if (v) return v;
    if (Date.now() - t0 > ms) return null;
    await new Promise((r) => setTimeout(r, every));
  }
};

await page.locator('[data-testid="app.sidebar"]').first().waitFor({ timeout: 20000 }).catch(() => {});
// the status pill (e41cd3c2): 'starting bise…' and the core's words sit IN the title bar, no row
// under it, nothing below moves when it shows or goes. 5 s of samples from the window's first draw.
{
  const seen = { samples: 0, pill: 0, outside: 0, words: [], mainTops: [] };
  for (let i = 0; i < 20; i++) {
    const s = await page.evaluate(() => {
      const r = (sel) => document.querySelector(sel)?.getBoundingClientRect() ?? null;
      const p = r('[data-testid="app.core"]');
      const bar = r('[data-testid="app.title.panel"]') ?? r('[data-testid="app.title.sidebar"]');
      const m = r('[data-testid="app.main"]');
      return { p: p && p.width > 0 ? { top: p.top, bottom: p.bottom } : null, barBottom: bar ? bar.bottom : null, mainTop: m ? Math.round(m.top) : null,
        words: document.querySelector('[data-testid="app.core"]')?.textContent?.trim().slice(0, 80) ?? null };
    }).catch(() => null);
    if (s) {
      seen.samples++;
      if (s.mainTop !== null && !seen.mainTops.includes(s.mainTop)) seen.mainTops.push(s.mainTop);
      if (s.p) {
        seen.pill++;
        if (s.words && !seen.words.includes(s.words)) seen.words.push(s.words);
        if (s.barBottom !== null && s.p.top > s.barBottom + 4) seen.outside++;
      }
    }
    if (i === 1) await shot('launch-pill');
    await new Promise((r) => setTimeout(r, 250));
  }
  step('the status pill sits in the title bar; nothing moves under it (5 s from first draw)', seen.outside === 0 && seen.mainTops.length <= 1, seen);
}
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
// this cut's rows (ambient-lead m_20075), seeded by one message to harness' main (the fake provider
// runs its [[bash: …]] calls): a turn of several runs, an agent kept and one dropped, a local .html
// artifact. Then: the runs fold, /agents lists the kept one and not the dropped, /archived lists the
// dropped, the artifact's frame has its pixels, the sidebar resizes by drag (its width kept for the
// restart's check), ctrl+r from the thread starts dictation's line (no mic under the knob), esc ends it.
// an open artifact's 3-column view folds the left bar under 1200 px: close it before the next pass
const closeArtifact = async () => {
  const pg = page.locator('[data-testid="artifact.page"]').first();
  if (!(await pg.count().catch(() => 0))) return;
  await page.locator('[data-testid="artifact.close"]').first().click({ timeout: 3000 }).catch(() => page.keyboard.press('Escape'));
  await pg.waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
};

if (mode === 'cut') {
  const composerOf = () => page.locator('[data-testid="composer"] [contenteditable="true"], [data-testid="composer"] textarea').first();
  const say = async (words) => {
    if (!(await click(`say ${words.slice(0, 30)}`, composerOf()))) return false;
    const parts = words.split('\n');
    for (let i = 0; i < parts.length; i++) {
      if (i) await page.keyboard.press('Shift+Enter');
      await page.keyboard.type(parts[i], { delay: 5 });
    }
    await page.keyboard.press('Enter');
    return true;
  };
  await click('open harness', page.locator('[data-testid="app.sidebar"]').getByText('harness', { exact: true }).first());
  const html = "<html><body style='margin:0;background:#2e8b57'><h1 style='color:#fff;font:40px sans-serif'>proof html</h1></body></html>";
  const seed = [
    'set up the proof rows',
    '[[bash: echo one]]', '[[bash: echo two]]', '[[bash: echo three]]',
    "[[bash: sb spawn keeper --objective 'hold the proof']]",
    "[[bash: sb spawn gone --objective 'an old one']]",
    `[[bash: printf "%s" "${html.replaceAll('"', "'")}" > proof.html && sb artifact add proof.html --title proof-html]]`,
  ].join(' ');
  const seeded = await say(seed);
  const done = seeded ? await until(() => page.evaluate(() =>
    [...document.querySelectorAll('[data-testid^="thread.entry."]')].some((r) => r.getAttribute('data-kind') === 'artifact') || null), ANSWER_MS, 2000) : null;
  await shot('seeded');
  const kinds = await page.evaluate(() => [...document.querySelectorAll('[data-testid^="thread.entry."]')].map((r) => r.getAttribute('data-kind')));
  // 'gone' is dropped in a LATER turn, once it is idle (amb-home m_20141: a drop in the turn that
  // spawned it makes the hub ask a 'drop' card instead of archiving); a drop card that still comes
  // is answered yes, which also proves the card path (ambient-lead m_20143)
  const goneIdle = await until(async () => {
    const s = (await text('[data-testid="app.sidebar"]')) ?? '';
    const i = s.indexOf('gone');
    return i >= 0 && /idle|done/.test(s.slice(i, i + 40)) ? true : null;
  }, ANSWER_MS, 2000);
  // its idle state is only noted: a drop that archives anyway (or asks its card) is the proof
  await say('[[bash: sb drop gone]]');
  const card = page.locator('[data-testid^="dock.opt"]').filter({ hasText: /yes|drop/i }).first();
  const asked = await card.waitFor({ timeout: 20000 }).then(() => true, () => false);
  let answered = null;
  if (asked) {
    await shot('drop-card');
    answered = await click("answer the drop card 'yes'", card);
    await page.locator('[data-testid^="dock.opt"]').first().waitFor({ state: 'detached', timeout: 20000 }).catch(() => {});
  }
  const dropped = await until(async () => {
    const s = (await text('[data-testid="app.sidebar"]')) ?? '';
    return /\bgone\b/.test(s) ? null : true;
  }, 60000, 1000);
  step("'gone' dropped (a drop card answered yes when asked)", !!dropped, { idle_first: !!goneIdle, card: asked, answered });
  // a thought of its own message (the fake provider's [[think: …]]): opened, it must never draw its
  // signature (BENDSIG::…, c28260a9's window guard)
  await say('think it over [[think: weighing the proof rows]]');
  const thoughts = page.locator('[data-testid^="thread.entry."]').filter({ has: page.locator('[data-testid^="thread.think."]') });
  const nThoughts = (await until(async () => ((await thoughts.count()) > 0 ? await thoughts.count() : null), ANSWER_MS, 1000)) ?? 0;
  for (let i = 0; i < nThoughts; i++) {
    const t = thoughts.nth(i);
    await t.getByText(/thought for/).first().click({ timeout: 3000 }).catch(() => t.click({ timeout: 3000 }).catch(() => {}));
  }
  if (nThoughts) await page.waitForTimeout(800);
  const thoughtText = nThoughts ? await thoughts.evaluateAll((rs) => rs.map((r) => r.textContent ?? '').join(' --- ')) : '';
  const mainText = (await text('[data-testid="app.main"]')) ?? '';
  await shot('thought-open');
  // the TUI folds a thought too ('∴ thought for 0.0s ▸', words on open): the row is there and opens to its words
  step('a short thought: its row is there and opens to its words', nThoughts > 0 && /weighing the proof rows/.test(thoughtText), { thoughts: nThoughts, text: thoughtText.slice(0, 200) });
  step('no BENDSIG text in an opened thought', nThoughts > 0 && !/BENDSIG/.test(thoughtText) && !/BENDSIG/.test(mainText), { thoughts: nThoughts, text: thoughtText.slice(0, 300) });
  step('the seed ran (runs, agents, artifact)', !!done, { kinds });
  step('the runs fold (tools rows, not one row per call)', kinds.filter((k) => k === 'tools').length >= 1 && kinds.filter((k) => k === 'tools').length < 6, kinds);
  // /agents and /archived
  for (const [cmd, want, not] of [['/agents', 'keeper', 'gone'], ['/archived', 'gone', null]]) {
    await click('back to harness', page.locator('[data-testid="app.sidebar"]').getByText('harness', { exact: true }).first());
    await say(cmd);
    const t = await until(async () => { const s = await text('[data-testid="app.main"]'); return s && s.includes(want) ? s : null; }, 20000, 1000);
    await shot(cmd.slice(1));
    const body = t ?? (await text('[data-testid="app.main"]')) ?? '';
    step(`${cmd} lists ${want}${not ? ` and not ${not}` : ''}`, !!t && (!not || !new RegExp(`\\b${not}\\b`).test(body)), body.slice(0, 500));
    await page.keyboard.press('Escape').catch(() => {});
  }
  // the local .html artifact's pixels, and what its frame loads (ambient-lead m_20609: for amb-web +
  // task-panel when it is blank): every request, response, failure and console line from here
  const net = [];
  const onReq = (r) => net.push({ ev: 'request', url: r.url().slice(0, 300), type: r.resourceType(), frame: r.frame()?.url().slice(0, 200) });
  const onRes = (r) => net.push({ ev: 'response', url: r.url().slice(0, 300), status: r.status(), type: r.headers()['content-type'] ?? '' });
  const onFail = (r) => net.push({ ev: 'failed', url: r.url().slice(0, 300), error: r.failure()?.errorText ?? '' });
  const onCon = (m) => net.push({ ev: 'console', type: m.type(), text: m.text().slice(0, 300), url: m.location()?.url?.slice(0, 200) });
  const onPerr = (e) => net.push({ ev: 'pageerror', text: String(e).slice(0, 300) });
  page.on('request', onReq); page.on('response', onRes); page.on('requestfailed', onFail); page.on('console', onCon); page.on('pageerror', onPerr);
  await click('artifacts', page.locator('[data-testid="app.sidebar.artifacts"]').first());
  const item = page.locator('[data-testid="artifacts.list"]').getByText('proof-html').first();
  const opened = await click('select proof-html', item);
  if (opened) await page.keyboard.press('Enter');
  const frame = page.locator('iframe').first();
  const fr = opened ? await frame.waitFor({ timeout: 15000 }).then(() => true, () => false) : false;
  let green = 0;
  if (fr) {
    await page.waitForTimeout(1500);
    const png = (await frame.screenshot({ timeout: 15000 }).catch(() => null))?.toString('base64');
    green = png ? await page.evaluate(async (b64) => {
      const img = new Image(); img.src = `data:image/png;base64,${b64}`; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data; let n = 0;
      for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - 46) < 12 && Math.abs(d[i + 1] - 139) < 12 && Math.abs(d[i + 2] - 87) < 12) n++;
      return n / (d.length / 4);
    }, png) : 0;
  }
  const frames = await page.evaluate(() => [...document.querySelectorAll('iframe, webview, object, embed')].map((f) => ({
    tag: f.tagName.toLowerCase(), src: f.getAttribute('src'), srcdoc: (f.getAttribute('srcdoc') ?? '').slice(0, 200), sandbox: f.getAttribute('sandbox'),
    w: f.clientWidth, h: f.clientHeight })));
  const docs = [];
  for (const f of page.frames()) {
    if (f === page.mainFrame()) continue;
    docs.push({ url: f.url().slice(0, 300), body: (await f.evaluate(() => document.documentElement?.outerHTML?.slice(0, 300) ?? '').catch((e) => `unreadable: ${String(e).slice(0, 120)}`)) });
  }
  page.off('request', onReq); page.off('response', onRes); page.off('requestfailed', onFail); page.off('console', onCon); page.off('pageerror', onPerr);
  fs.writeFileSync(path.join(out, `${mode}-artifact-frame.json`), JSON.stringify({ frames, docs, net }, null, 1));
  await shot('artifact-html');
  step('a local .html artifact renders (its green pixels)', green > 0.3, { opened, frame: fr, green_share: Math.round(green * 100) / 100, frames, docs: docs.slice(0, 3), net_lines: net.length });
  // the sidebar resizes by drag; its width is kept for the restart's check. The open artifact folds
  // the left bar to a rail (no split, no 'harness' label): close it first (run 40fc444d's 2 reds)
  await closeArtifact();
  const split = page.locator('[data-testid="app.split.side"]').first();
  const w0 = Number(await split.getAttribute('aria-valuenow').catch(() => null));
  const box = await split.boundingBox().catch(() => null);
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2, { steps: 8 });
    await page.mouse.up();
  }
  const w1 = Number(await split.getAttribute('aria-valuenow').catch(() => null));
  fs.writeFileSync(path.join(out, 'side-width.txt'), String(w1));
  await shot('resized');
  step('the sidebar resizes by drag', !!box && w1 > w0, { before: w0, after: w1 });
  // ctrl+r from the thread (not the field): dictation's line shows, esc ends it
  await click('back to harness', page.locator('[data-testid="app.sidebar"]').getByText('harness', { exact: true }).first());
  await page.locator('[data-testid="app.main"]').first().click({ position: { x: 40, y: 140 } }).catch(() => {});
  const before = (await text('[data-testid="composer"]')) ?? '';
  await page.keyboard.press('Control+r');
  const line = await until(async () => { const t = (await text('[data-testid="composer"]')) ?? ''; return t !== before && /dictat|listen|mic|speak|voice/i.test(t) ? t : null; }, 8000, 500);
  await shot('ctrl-r');
  await page.keyboard.press('Escape');
  const after = (await text('[data-testid="composer"]')) ?? '';
  step('ctrl+r from the thread starts dictation; esc ends it', !!line && !/listening/i.test(after), { line: line?.slice(0, 300), after_esc: after.slice(0, 200) });
  // every message of this mode was sent (seed, drop, /agents, /archived): none stays 'sending…'
  // (c28260a9's sending-after-page-echo fix)
  const stuck = await until(async () => { const t = (await text('[data-testid="app.main"]')) ?? ''; return /sending…|sending\.\.\./.test(t) ? null : true; }, 20000, 1000);
  await shot('no-sending');
  step("no message stays 'sending…'", !!stuck, stuck ? null : ((await text('[data-testid="app.main"]')) ?? '').match(/.{0,120}sending.{0,40}/s)?.[0]);
  await closeArtifact();
}

// the first cut from main (ambient-lead m_20586): the right bar, an artifact opened from it, back /
// forward, the working row, the inbox block with another project's item, a short thought's words
if (mode === 'rows2') {
  const composerOf = () => page.locator('[data-testid="composer"] [contenteditable="true"], [data-testid="composer"] textarea').first();
  const say = async (words) => {
    if (!(await click(`say ${words.slice(0, 30)}`, composerOf()))) return false;
    const parts = words.split('\n');
    for (let i = 0; i < parts.length; i++) {
      if (i) await page.keyboard.press('Shift+Enter');
      await page.keyboard.type(parts[i], { delay: 5 });
    }
    await page.keyboard.press('Enter');
    return true;
  };
  const harness = () => click('open harness', page.locator('[data-testid="app.sidebar"]').getByText('harness', { exact: true }).first());
  await closeArtifact();
  // one waiting item in another project: ai-docs' main opens a card for him (for bise's inbox block)
  await click('open ai-docs', page.locator('[data-testid="app.sidebar"]').getByText('ai-docs', { exact: true }).first());
  await say("[[bash: sb card 'publish the ai-docs guide now?\n1. publish\n2. later']]");
  const carded = await until(async () => (/done: tool bash ok/.test((await text('[data-testid="app.main"]')) ?? '') ? true : null), ANSWER_MS, 1000);
  step("ai-docs' main opened a card for him (the inbox item)", !!carded, ((await text('[data-testid="app.main"]')) ?? '').slice(-300));
  await harness();
  // the right bar: its four sections in order; the left bar holds places only
  const panel = page.locator('[data-testid="app.panel"]').first();
  const shown = await panel.waitFor({ timeout: 10000 }).then(() => true, () => false);
  const order = await page.evaluate(() => [...document.querySelectorAll('[data-testid^="app.right."]')]
    .map((e) => e.getAttribute('data-testid')).filter((t) => /^app\.right\.(agents|archived|artifacts|scheduled)$/.test(t)));
  await shot('right-bar');
  step('the right bar: agents, archived, artifacts, scheduled', shown && order.join(',') === 'app.right.agents,app.right.archived,app.right.artifacts,app.right.scheduled', order);
  const agentsText = (await text('[data-testid="app.right.agents"]')) ?? '';
  step('the right bar lists the agents (keeper; main is the thread itself)', /\bkeeper\b/.test(agentsText) && !/\bgone\b/.test(agentsText), agentsText.slice(0, 300));
  const leftAgents = await page.locator('[data-testid="app.sidebar"] [data-testid*=".agent."]').count().catch(() => 0);
  step('the left bar holds places only (no agent rows)', leftAgents === 0 && !/\bkeeper\b/.test((await text('[data-testid="app.sidebar"]')) ?? ''), { agent_rows: leftAgents });
  // ⌥⌘0 and the title bar's toggle hide and bring back the right bar
  await page.keyboard.press('Alt+Meta+0');
  const hid = await until(async () => ((await panel.count()) === 0 || !(await panel.isVisible().catch(() => false)) ? true : null), 5000, 300);
  await shot('right-bar-hidden');
  await page.keyboard.press('Alt+Meta+0');
  const back = await panel.waitFor({ timeout: 5000 }).then(() => true, () => false);
  step('⌥⌘0 hides and brings back the right bar', !!hid && back, { hid: !!hid, back });
  const tog = page.locator('[data-testid="app.title.panel"]').first();
  let togOk = false;
  if (await click('the title bar toggle', tog)) {
    const h2 = await until(async () => ((await panel.count()) === 0 || !(await panel.isVisible().catch(() => false)) ? true : null), 5000, 300);
    await click('the title bar toggle again', tog);
    togOk = !!h2 && await panel.waitFor({ timeout: 5000 }).then(() => true, () => false);
  }
  step("the title bar's toggle hides and brings back the right bar", togOk, null);
  // an artifact from the right bar: the 3-column view, its page drawn in the frame; ✕ and esc back
  const row = page.locator('[data-testid="app.right.artifacts"] [data-testid*="proof-html"], [data-testid="app.right.artifacts"] button, [data-testid="app.right.artifacts"] [role="button"]').filter({ hasText: 'proof-html' }).first();
  const opened = await click('proof-html from the right bar', row);
  const pageEl = page.locator('[data-testid="artifact.page"]').first();
  const drawn = opened && await pageEl.waitFor({ timeout: 15000 }).then(() => true, () => false);
  let green = 0;
  if (drawn) {
    await page.waitForTimeout(1500);
    const png = (await pageEl.screenshot({ timeout: 15000 }).catch(() => null))?.toString('base64');
    green = png ? await page.evaluate(async (b64) => {
      const img = new Image(); img.src = `data:image/png;base64,${b64}`; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data; let n = 0;
      for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - 46) < 12 && Math.abs(d[i + 1] - 139) < 12 && Math.abs(d[i + 2] - 87) < 12) n++;
      return n / (d.length / 4);
    }, png) : 0;
  }
  const cols = await page.evaluate(() => {
    const vis = (sel) => { const e = document.querySelector(sel); if (!e) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const rail = document.elementFromPoint(50, 110);
    return { rail: !!rail && rail.getBoundingClientRect().right < 160, thread: vis('[data-testid="app.main"]'), page: vis('[data-testid="artifact.page"]') };
  });
  await shot('artifact-from-right-bar');
  step('an artifact from the right bar: 3 columns, its page drawn (green pixels)', drawn && green > 0.3 && cols.rail && cols.thread && cols.page, { opened, drawn, green: Math.round(green * 100) / 100, cols });
  const closed = await click('✕', page.locator('[data-testid="artifact.close"]').first());
  const gone1 = closed && await pageEl.waitFor({ state: 'detached', timeout: 5000 }).then(() => true, () => false);
  await click('proof-html again', row);
  await pageEl.waitFor({ timeout: 10000 }).catch(() => {});
  await page.keyboard.press('Escape');
  const gone2 = await pageEl.waitFor({ state: 'detached', timeout: 5000 }).then(() => true, () => false);
  step('✕ and esc close the artifact', gone1 && gone2, { x: gone1, esc: gone2 });
  // back / forward: harness -> artifacts -> ⌘[ harness -> ⌘] artifacts; esc from harness' main goes up to bise
  await harness();
  await click('artifacts', page.locator('[data-testid="app.sidebar.artifacts"]').first());
  await page.locator('[data-testid="artifacts.list"]').first().waitFor({ timeout: 8000 }).catch(() => {});
  await page.keyboard.press('Meta+BracketLeft');
  const wentBack = await until(async () => ((await page.locator('[data-testid="artifacts.list"]').count()) === 0 && /harness/.test((await text('[data-testid="app.main"]')) ?? '') ? true : null), 5000, 300);
  await page.keyboard.press('Meta+BracketRight');
  const wentFwd = await page.locator('[data-testid="artifacts.list"]').first().waitFor({ timeout: 5000 }).then(() => true, () => false);
  step('⌘[ goes back, ⌘] forward', !!wentBack && wentFwd, { back: !!wentBack, forward: wentFwd });
  await harness();
  await page.locator('[data-testid="app.main"]').first().click({ position: { x: 40, y: 140 } }).catch(() => {});
  await page.keyboard.press('Escape');
  const upToBise = await until(async () => (/every project|to bise\s*$/m.test((await text('[data-testid="app.main"]')) ?? '') || (await page.locator('[data-testid="app.sidebar.bise"][aria-current]').count()) > 0 ? true : null), 5000, 300);
  await shot('esc-up');
  step("esc from a project's main goes up to bise", !!upToBise, ((await text('[data-testid="app.main"]')) ?? '').slice(0, 200));
  // the working row while an agent works (a slow turn), then a short thought with its words
  await harness();
  await say('take a moment [[slow: 8]]');
  const working = await until(async () => (/working/.test((await text('[data-testid="app.main"]')) ?? '') ? true : null), 8000, 400);
  await shot('working-row');
  step('the working row shows while main works', !!working, null);
  await until(async () => (/ack: take a moment/.test((await text('[data-testid="app.main"]')) ?? '') ? true : null), ANSWER_MS, 1000);
  await say('one quick thought [[think: weighing the proof rows]]');
  // the TUI folds a thought too (ambient-lead m_20609): the row is there, then opens to its words
  const rows = page.locator('[data-testid^="thread.entry."]').filter({ has: page.locator('[data-testid^="thread.think."]') });
  const nRows = (await until(async () => ((await rows.count()) > 0 ? await rows.count() : null), ANSWER_MS, 1000)) ?? 0;
  const last = rows.nth(Math.max(0, nRows - 1));
  if (nRows) await last.getByText(/thought for/).first().click({ timeout: 3000 }).catch(() => last.click({ timeout: 3000 }).catch(() => {}));
  const words = nRows ? await until(async () => (/weighing the proof rows/.test((await last.textContent().catch(() => '')) ?? '') ? true : null), 5000, 300) : null;
  await shot('short-thought');
  step('a short thought: its row is there and opens to its words', !!words, { rows: nRows, text: nRows ? ((await last.textContent().catch(() => '')) ?? '').slice(0, 200) : '' });
  // the inbox block in bise's thread: another project's item answered there; ⌘I opens it in place
  await click('bise', page.locator('[data-testid="app.sidebar.bise"]').first());
  const block = page.locator('[data-testid^="inbox.block"]').first();
  const hasBlock = await block.waitFor({ timeout: 15000 }).then(() => true, () => false);
  const blockText = hasBlock ? ((await block.innerText().catch(() => '')) ?? '') : '';
  await shot('inbox-block');
  step("bise's thread shows the inbox block with another project's item", hasBlock && /shop|telemetry|docs|ai-docs|folder/.test(blockText), blockText.slice(0, 300));
  // ⌘I is the native menu's accelerator (src/main/menu.ts): CDP keys go to the page and never reach
  // the menu, so off-screen it can't be pressed. ⌃1 (the block's own key) opens the same item in place.
  await page.locator('[data-testid="app.main"]').first().click({ position: { x: 40, y: 140 } }).catch(() => {});
  await page.keyboard.press('Control+1');
  // the dock's options carry the composer's id (composer.opt.<n>, ds/composer.tsx); dock.opt before 6ac92eb4
  const OPT = '[data-testid^="composer.opt"], [data-testid^="dock.opt"]';
  const inPlace = await until(async () => ((await page.locator(OPT).count()) > 0 ? true : null), 8000, 400);
  await shot('inbox-ctrl-1');
  step('⌃1 opens the item in place (its options in the dock; ⌘I = native menu, not reachable by CDP)', !!inPlace, ((await text('[data-testid="app.main"]')) ?? '').slice(-300));
  if (inPlace) {
    const opt = page.locator('[data-testid^="dock.opt"]').first();
    const label = await opt.innerText().catch(() => '');
    await click('answer it there', opt);
    const answered = await until(async () => ((await page.locator('[data-testid^="dock.opt"]').count()) === 0 ? true : null), 15000, 500);
    await shot('inbox-answered');
    step("another project's item answered from bise's thread", !!answered, { option: label.slice(0, 80) });
  }
  // the two-finger swipe (swipe.ts reads the renderer's wheel events): a horizontal wheel stream
  // through CDP, fingers right (deltaX < 0) walks back, fingers left forward. Events 20 ms apart
  // stay one gesture (GAP_MS 220); 8 x 30 px passes THRESHOLD_PX 140.
  const swipe = async (dx) => {
    const m = await page.locator('[data-testid="app.main"]').first().boundingBox().catch(() => null);
    if (m) await page.mouse.move(m.x + m.width / 2, m.y + m.height / 3);
    for (let i = 0; i < 8; i++) { await page.mouse.wheel(dx, 0); await new Promise((r) => setTimeout(r, 20)); }
    await new Promise((r) => setTimeout(r, 400));
  };
  await harness();
  await click('artifacts', page.locator('[data-testid="app.sidebar.artifacts"]').first());
  const onList = await page.locator('[data-testid="artifacts.list"]').first().waitFor({ timeout: 8000 }).then(() => true, () => false);
  await swipe(-30);
  const swBack = await until(async () => ((await page.locator('[data-testid="artifacts.list"]').count()) === 0 && /harness/.test((await text('[data-testid="app.main"]')) ?? '') ? true : null), 5000, 300);
  await shot('swipe-back');
  await swipe(30);
  const swFwd = await page.locator('[data-testid="artifacts.list"]').first().waitFor({ timeout: 5000 }).then(() => true, () => false);
  await shot('swipe-forward');
  step('two-finger swipe (CDP wheel deltaX): back, then forward', onList && !!swBack && swFwd, { on_list: onList, back: !!swBack, forward: swFwd });
  // spacing (designer's desktop-spacing, steps 1-4): a frame per screen at 1100 wide. The viewport
  // is narrowed by CDP emulation, the native window doesn't move or resize.
  const cdp = await page.context().newCDPSession(page);
  const vh = await page.evaluate(() => window.innerHeight);
  const narrowed = await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1100, height: vh, deviceScaleFactor: 0, mobile: false }).then(() => true, () => false);
  await new Promise((r) => setTimeout(r, 600));
  const vw = await page.evaluate(() => window.innerWidth);
  const overflow = async () => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  const at1100 = {};
  await harness();
  await page.waitForTimeout(800);
  await shot('w1100-thread');
  at1100.thread = { overflow: await overflow() };
  // the frame: the title bar, both bars and the status line, with the right bar open
  if (!(await page.locator('[data-testid="app.panel"]').count())) await click('right bar', page.locator('[data-testid="app.title.panel"]').first());
  await page.waitForTimeout(600);
  await shot('w1100-frame');
  at1100.frame = { overflow: await overflow(), panel: (await page.locator('[data-testid="app.panel"]').count()) > 0 };
  await click('bise', page.locator('[data-testid="app.sidebar.bise"]').first());
  await page.locator('[data-testid^="inbox.block"]').first().waitFor({ timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(600);
  await shot('w1100-inbox');
  at1100.inbox = { overflow: await overflow(), block: (await page.locator('[data-testid^="inbox.block"]').count()) > 0 };
  await harness();
  await say('/agents');
  const agents = await page.locator('[data-testid="agents.screen"]').first().waitFor({ timeout: 10000 }).then(() => true, () => false);
  await page.waitForTimeout(600);
  await shot('w1100-agents');
  at1100.agents = { overflow: await overflow(), screen: agents };
  // b4a25acb's spacing batch: artifacts, scheduled, /log, /diff (changes), ⌘K, settings and a menu
  const screen1100 = async (name, open, sel) => {
    await open();
    const there = sel ? await page.locator(sel).first().waitFor({ timeout: 10000 }).then(() => true, () => false) : true;
    await page.waitForTimeout(600);
    await shot(`w1100-${name}`);
    at1100[name] = { overflow: await overflow(), there };
  };
  await screen1100('artifacts', () => click('artifacts', page.locator('[data-testid="app.sidebar.artifacts"]').first()), '[data-testid="artifacts.screen"]');
  await screen1100('scheduled', () => click('scheduled', page.locator('[data-testid="app.sidebar.scheduled"]').first()), null);
  await screen1100('log', async () => { await harness(); await say('/log'); }, '[data-testid="log.list"]');
  await screen1100('changes', async () => { await harness(); await say('/diff'); }, null);
  await screen1100('palette', async () => { await harness(); await page.keyboard.press('Meta+k'); }, '[data-testid="app.palette"]');
  await page.keyboard.press('Escape');
  await screen1100('settings', () => click('settings', page.locator('[data-testid="app.sidebar.settings"]').first()), '[data-testid="settings.root"]');
  const menuBtn = page.locator('[data-testid="settings.root"] [aria-haspopup]').first();
  const hasMenu = (await menuBtn.count()) > 0;
  if (hasMenu) await screen1100('settings-menu', () => click('a settings menu', menuBtn), '[role="menu"], [role="listbox"]');
  await page.keyboard.press('Escape');
  await cdp.send('Emulation.clearDeviceMetricsOverride').catch(() => {});
  // scroll up right after a thread opens stays up (dae80774: the list goes to its end once, then
  // leaves him where he scrolled)
  await click('artifacts', page.locator('[data-testid="app.sidebar.artifacts"]').first());
  await page.waitForTimeout(500);
  await harness();
  const listBox = await page.locator('[data-testid="thread.list"]').first().boundingBox({ timeout: 5000 }).catch(() => null);
  if (listBox) await page.mouse.move(listBox.x + listBox.width / 2, listBox.y + listBox.height / 2);
  await page.waitForTimeout(150);
  for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, -150); await new Promise((r) => setTimeout(r, 30)); }
  const fromEnd = () => page.evaluate(() => {
    let e = document.querySelector('[data-testid="thread.list"]');
    while (e && !(e.scrollHeight > e.clientHeight + 2 && /auto|scroll/.test(getComputedStyle(e).overflowY))) e = e.parentElement;
    return e ? { fromEnd: Math.round(e.scrollHeight - e.scrollTop - e.clientHeight), height: e.scrollHeight } : null;
  });
  const up0 = await fromEnd();
  await page.waitForTimeout(3000);
  const up1 = await fromEnd();
  await shot('scrolled-up-stays');
  step('scroll up right after a thread opens stays up (3 s later)', !!up0 && !!up1 && up0.fromEnd > 100 && up1.fromEnd > 100, { right_after: up0, three_s_later: up1 });
  step('the spotlight at 1100: not run (it opens a floating window over his screen)', true, 'not proven here');
  step('a frame per screen at 1100 wide (thread, frame, inbox, agents), nothing wider than the window',
    narrowed && vw === 1100 && agents && Object.values(at1100).every((s) => !s.overflow), { width: vw, ...at1100 });
  // the tray menu is native (Electron Tray in the main process): CDP reaches the renderer only
  step('the tray menu\'s inbox rows: not reachable off-screen (native menu, no CDP)', true, 'not proven here');
  await harness();
}

// the draft across a restart (ambient-lead m_19525): typed in harness' composer, never sent; after
// the restart the same composer must hold it again
if (mode === 'draft-type' || mode === 'draft-check') {
  await click('open harness', page.locator('[data-testid="app.sidebar"]').getByText('harness', { exact: true }).first());
  const composer = page.locator('[data-testid="composer"] [contenteditable="true"], [data-testid="composer"] textarea').first();
  await composer.waitFor({ timeout: 15000 }).catch(() => {});
  const holds = async () => ((await composer.innerText({ timeout: 2000 }).catch(() => '')) || (await composer.inputValue({ timeout: 500 }).catch(() => ''))).trim();
  if (mode === 'draft-type') {
    const typed = await click('the composer', composer);
    // the last pass's draft is still there (kept across its restart) and a click lands mid-text:
    // empty it first, so each pass holds exactly its own words (run 40fc444d merged two drafts)
    if (typed) {
      await page.keyboard.press('Meta+a');
      await page.keyboard.press('Backspace');
      await page.keyboard.type(draft, { delay: 15 });
    }
    await shot('draft');
    const now = await holds();
    step('the draft is in the composer, not sent', now === draft, now.slice(0, 300));
  } else {
    const back = await until(async () => ((await holds()) === draft ? draft : null), 20000, 500);
    await shot('draft-back');
    step('the draft is back in the composer after the restart', !!back, back ?? (await holds()).slice(0, 300));
    const kept = fs.existsSync(path.join(out, 'side-width.txt')) ? Number(fs.readFileSync(path.join(out, 'side-width.txt'), 'utf8')) : null;
    if (kept) {
      const w = Number(await page.locator('[data-testid="app.split.side"]').first().getAttribute('aria-valuenow').catch(() => null));
      step('the sidebar width is kept across the restart', w === kept, { kept, now: w });
    }
  }
}
ending = true;
await browser.close().catch(() => {});
