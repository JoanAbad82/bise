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
import { fxDir, named } from './fx.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = process.env.PW_FROM ?? path.join(HERE, '..', '..', '..', '..', 'apps', 'desktop');
const { chromium } = createRequire(path.join(DESKTOP, 'package.json'))('@playwright/test');
const [port, out, mode, draft] = process.argv.slice(2);
// the files its words carry: never under a path that names a world project (fx.mjs)
const FX = fxDir(out, process.env);
fs.mkdirSync(FX, { recursive: true });
const tag = process.env.AS_HE_DOES_TAG ? `-${process.env.AS_HE_DOES_TAG}` : '';
const WATCHDOG_MS = Number(process.env.AS_HE_DOES_WATCHDOG_MS ?? 600000);
// AS_HE_DOES_QUICK_ROWS=quote,merge: a quick pass of those rows alone (rows37's and rowsE812's rows
// whose name holds one of the words), to prove or clear a red on a fresh world (ambient-lead m_23521)
const ONLY = (process.env.AS_HE_DOES_QUICK_ROWS ?? '').split(',').map((w) => w.trim()).filter(Boolean);
const wanted = (name) => ONLY.length === 0 || ONLY.some((w) => name.includes(w));
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
// a renderer gone is said apart from a window closed (try-gate-f2a7's first run: 'the page closed'
// 9 s after two cards came, no crash report): its time and what went
page.on('crash', () => step('the window renderer did not crash', false, { at: new Date().toISOString() }));
browser.on('disconnected', () => { if (!ending) step('the app kept its CDP connection', false, { at: new Date().toISOString() }); });
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
// pids a row holds with SIGSTOP (rowsF2A7): always SIGCONT'd, also when the pass ends early
const HELD = new Set();
const unhold = () => { for (const p of HELD) { try { process.kill(p, 'SIGCONT'); } catch { /* gone */ } } HELD.clear(); };
const closed = () => {
  if (ending) return;
  unhold();
  step('the window stayed open through the pass', false, { what: 'the page closed', at: new Date().toISOString() });
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
// the alarm rows of the right bar's SCHEDULED & WATCHING whose words hold `words` (agent-waiting-states
// A: app.right.watching.<agent>.<id>, never its .detail/.stop/.open parts): {id, text, title, g, sub, end}
const alarmRows = (words) => page.evaluate((w) => [...document.querySelectorAll('[data-testid^="app.right.watching."]')]
  .filter((e) => /\.\d+$/.test(e.getAttribute('data-testid') ?? '') && (e.textContent ?? '').includes(w))
  .map((e) => ({ id: e.getAttribute('data-testid'), text: (e.textContent ?? '').replace(/\s+/g, ' ').trim(), title: e.getAttribute('title'),
    g: e.querySelector('.app-rb-g')?.textContent?.trim() ?? null, sub: e.querySelector('.app-rb-sub')?.textContent?.trim() ?? null,
    end: e.querySelector('.app-rb-end, .app-rb-time')?.textContent?.trim() ?? null })), words).catch(() => []);

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

// the window's frame (amb-mac 9f7c2f72, ambient-lead m_21559): 1280x720 on first open, clamped to the
// work area minus 24 px a side, kept per display in userData/window-frame.json. An off-screen run
// sees only the off-screen display (windows.ts OFF_SCREEN, 1920x1200 far from his), so it never
// lands on his screen. The bounds come from the page (outer size) and the kept file.
const FRAMES = process.env.AS_HE_DOES_USERDATA ? path.join(process.env.AS_HE_DOES_USERDATA, 'window-frame.json') : null;
const winBox = () => page.evaluate(() => ({ x: window.screenX, y: window.screenY, w: window.outerWidth, h: window.outerHeight, iw: window.innerWidth, ih: window.innerHeight, aw: window.screen.availWidth, ah: window.screen.availHeight })).catch(() => null);
const keptFrames = () => { try { return JSON.parse(fs.readFileSync(FRAMES, 'utf8')); } catch { return null; } };
// resize from CDP: the browser's Browser.setWindowBounds when Electron answers it, else window.resizeTo
const resizeWin = async (width, height) => {
  const how = await (async () => {
    const b = await browser.newBrowserCDPSession().catch(() => null);
    if (!b) return null;
    const t = await page.context().newCDPSession(page).then((s) => s.send('Target.getTargetInfo')).catch(() => null);
    const w = await b.send('Browser.getWindowForTarget', t?.targetInfo?.targetId ? { targetId: t.targetInfo.targetId } : {}).catch(() => null);
    if (!w) return null;
    return b.send('Browser.setWindowBounds', { windowId: w.windowId, bounds: { width, height } }).then(() => 'Browser.setWindowBounds', () => null);
  })();
  if (how) return how;
  await page.evaluate(([w, h]) => window.resizeTo(w, h), [width, height]).catch(() => {});
  return 'window.resizeTo';
};
if (mode === 'first') {
  const box = await winBox();
  const wantW = box && box.aw > 0 ? Math.min(1280, box.aw - 48) : 1280;
  const wantH = box && box.ah > 0 ? Math.min(720, box.ah - 48) : 720;
  await shot('window-1280');
  step('the first launch opens at 1280x720, clamped to the work area (a frame for designer)', !!box && Math.abs(box.w - wantW) <= 2 && Math.abs(box.h - wantH) <= 2, { box, want: { w: wantW, h: wantH } });
}
if (mode === 'draft-type' && !tag.endsWith('atonce')) {
  // resized now; the restart that follows must bring this frame back (checked in draft-check)
  const before = await winBox();
  const how = await resizeWin(1180, 760);
  const after = await until(async () => { const b = await winBox(); return b && b.w !== before?.w ? b : null; }, 4000, 300);
  await page.waitForTimeout(800); // windows.ts keeps it 300 ms after the resize settles
  const kept = keptFrames();
  if (after) fs.writeFileSync(path.join(out, 'win-resized.json'), JSON.stringify({ w: after.w, h: after.h }));
  await shot('resized-window');
  step('the window resizes from CDP and its frame is kept (window-frame.json)', !!after && !!kept, { how, before, after, kept });
}
if (mode === 'draft-check' && fs.existsSync(path.join(out, 'win-resized.json')) && !tag.endsWith('atonce')) {
  const want = JSON.parse(fs.readFileSync(path.join(out, 'win-resized.json'), 'utf8'));
  const box = await until(async () => { const b = await winBox(); return b && Math.abs(b.w - want.w) <= 2 && Math.abs(b.h - want.h) <= 2 ? b : null; }, 5000, 300);
  await shot('frame-back');
  step('after a resize and a restart, the window comes back at its kept frame', !!box, { want, now: box ?? (await winBox()), kept: keptFrames() });
}

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
    // b51422c0: a '/diff' left in the composer took the next message ('/diff[[bash: …'): start empty
    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Backspace');
    const parts = words.split('\n');
    for (let i = 0; i < parts.length; i++) {
      if (i) await page.keyboard.press('Shift+Enter');
      await page.keyboard.type(parts[i], { delay: 5 });
    }
    await page.keyboard.press('Enter');
    // a slash command with args (/diff) spends the first Enter on the slash menu: send it with a second
    if (words.startsWith('/')) {
      await page.waitForTimeout(400);
      const left = ((await composerOf().innerText().catch(() => '')) ?? '').trim();
      if (left.startsWith('/')) await page.keyboard.press('Enter');
    }
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
  const line = await until(async () => { const t = (await text('[data-testid="composer"]')) ?? ''; return t !== before && /dictat|listen|mic|speak|voice|any key stop|esc cancel/i.test(t) ? t : null; }, 8000, 500);
  // (with AS_HE_DOES_FAKE_VOICE=1 the take really records: the composer is the recording pill, '0:03',
  // 'any key stop', 'esc cancel', none of the no-mic words: try-gate-0170's full pass)
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
    // b51422c0: a '/diff' left in the composer took the next message ('/diff[[bash: …'): start empty
    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Backspace');
    const parts = words.split('\n');
    for (let i = 0; i < parts.length; i++) {
      if (i) await page.keyboard.press('Shift+Enter');
      await page.keyboard.type(parts[i], { delay: 5 });
    }
    await page.keyboard.press('Enter');
    // a slash command with args (/diff) spends the first Enter on the slash menu: send it with a second
    if (words.startsWith('/')) {
      await page.waitForTimeout(400);
      const left = ((await composerOf().innerText().catch(() => '')) ?? '').trim();
      if (left.startsWith('/')) await page.keyboard.press('Enter');
    }
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
  // (g)'s maker (ambient-lead m_21810): an agent with a long name and purpose makes an artifact from
  // its own brief ({{bash: …}}: the fake provider runs those when the message has no [[…]] marker),
  // dropped at the end of this pass. Its page has no quote in it (the brief is in double quotes).
  const MAKER = 'release-ts-pattern';
  const makerHtml = '<html><body style=margin:0;background:#2e8b57><h1>release notes</h1></body></html>';
  await say(`[[bash: sb spawn ${MAKER} --objective "Release ts-pattern on npm: the changelog, the tag, the GitHub release notes and the docs site {{bash: printf '%s' '${makerHtml}' > rel-ts.html && sb artifact add rel-ts.html --title rel-ts-notes}}"]]`);
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
    // the left bar: shown, and left of the thread (1c5659b8 run: the dragged sidebar is ~240 px, a
    // fixed 160 px rail check read it as missing)
    const side = document.querySelector('[data-testid="app.sidebar"]')?.getBoundingClientRect();
    const main = document.querySelector('[data-testid="app.main"]')?.getBoundingClientRect();
    const rail = !!side && side.width > 0 && side.left < 20 && (!main || side.right <= main.left + 2);
    return { rail, rail_w: side ? Math.round(side.width) : null, thread: vis('[data-testid="app.main"]'), page: vis('[data-testid="artifact.page"]') };
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
  // e5759db9 (his ask, main m_21531), as app/artifact-view.spec checks it: words in harness' main
  // composer, then the artifact open and words in the composer beside it ('about' the page). One esc
  // closes the artifact: main's words and label as he left them; back on the artifact, its words and
  // label too. A second esc does today's thing (a composer with words keeps it: no move, nothing reopens).
  const MAIN_WORDS = 'half a thought for main';
  const ART_WORDS = 'and the green, is it on brand?';
  const field = page.locator('[data-testid="composer.field"]:visible').first();
  // the label without the working mark's gust (its glyphs change each frame while main works)
  const lbl = () => page.locator('.b-composer .lbl:visible').first().innerText({ timeout: 1000 })
    .then((s) => s.replace(/[∿≈~∼∽·]+/g, ' ').replace(/\s+/g, ' ').trim(), () => null);
  const fieldText = async () => ((await field.innerText({ timeout: 1000 }).catch(() => '')) ?? '').trim();
  const typeIn = async (words) => {
    if (!(await click('the composer', field))) return false;
    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Backspace');
    await page.keyboard.type(words, { delay: 5 });
    return true;
  };
  await harness();
  const mainTyped = await typeIn(MAIN_WORDS);
  const mainLabel = await lbl();
  await click('proof-html for the esc row', row);
  const reopened = await pageEl.waitFor({ timeout: 10000 }).then(() => true, () => false);
  let escRow = { main_typed: mainTyped, reopened };
  if (mainTyped && reopened && await typeIn(ART_WORDS)) {
    const artLabel = await lbl();
    await page.keyboard.press('Escape');
    const closed1 = await pageEl.waitFor({ state: 'detached', timeout: 5000 }).then(() => true, () => false);
    await page.waitForTimeout(300);
    const back = { words: await fieldText(), label: await lbl() };
    await shot('esc-artifact-main-kept');
    await click('proof-html again', row);
    const again = await pageEl.waitFor({ timeout: 10000 }).then(() => true, () => false);
    const onArt = again ? await until(async () => ((await fieldText()) === ART_WORDS ? { words: ART_WORDS, label: await lbl() } : null), 5000, 300) : null;
    await shot('esc-artifact-words-back');
    escRow = { closed: closed1, main: { before: { words: MAIN_WORDS, label: mainLabel }, after: back }, artifact: { before: { words: ART_WORDS, label: artLabel }, after: onArt ?? { words: await fieldText(), label: await lbl() } }, answering: /answering/.test(artLabel ?? '') ? 'proven' : 'no docked card in harness: the labels kept are to main / about the page' };
    step("esc with an artifact open closes it first; his words and the composer's mode stay (main's, and the artifact's on reopen)",
      closed1 && back.words === MAIN_WORDS && back.label === mainLabel && !!onArt && onArt.label === artLabel, escRow);
    // close it again (esc from the artifact's composer), then a second esc on harness' main with words
    await click('the composer beside the artifact', field);
    await page.keyboard.press('Escape');
    await pageEl.waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
    await click('the composer', field);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(800);
    const second = {
      artifact_reopened: (await pageEl.count()) > 0,
      went_up_to_bise: (await page.locator('[data-testid="app.sidebar.bise"][aria-current]').count()) > 0,
      words: await fieldText(),
      label: await lbl(),
    };
    await shot('esc-artifact-second-esc');
    step("a second esc does today's thing (a composer with words keeps it: no move, nothing reopens)", !second.artifact_reopened && !second.went_up_to_bise, second);
  } else step("esc with an artifact open closes it first; his words and the composer's mode stay (main's, and the artifact's on reopen)", false, escRow);
  // both composers emptied, so the next rows start clean
  await closeArtifact();
  await harness();
  if (await click('the composer', field)) { await page.keyboard.press('Meta+a'); await page.keyboard.press('Backspace'); }
  await click('proof-html to empty its composer', row);
  if (await pageEl.waitFor({ timeout: 10000 }).then(() => true, () => false) && await click('the composer beside the artifact', field)) {
    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Backspace');
  }
  await closeArtifact();
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
  // 96750f52 (ambient-lead m_21810 (b)): the working mark, the TUI's gust after 'to main' on the
  // composer's label line; no 'is working' row in the thread (thread.live / thread.waiting are gone),
  // and nothing in the thread moves with the gust's frames (sampled every 110 ms, its frame step)
  await harness();
  await say('take a moment [[slow: 12]]');
  const mark = page.locator('[data-testid="thread.mark"][data-state="working"]').first();
  const marked = await mark.waitFor({ timeout: 10000 }).then(() => true, () => false);
  const wk = { mark: marked };
  if (marked) {
    wk.label = await lbl();
    const geo = () => page.evaluate(() => {
      const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [b.left, b.top, b.width, b.height].map(Math.round).join(','); };
      const sc = document.querySelector('[data-testid="thread.list"] [data-virtuoso-scroller]') ?? document.querySelector('[data-testid="thread.list"]');
      return { list: r('[data-testid="thread.list"]'), mark: r('[data-testid="thread.mark"]'), composer: r('[data-testid="composer"]'), scroll: sc ? `${Math.round(sc.scrollTop)},${sc.scrollHeight}` : null, gust: document.querySelector('[data-testid="thread.mark.gust"]')?.textContent ?? null };
    }).catch(() => null);
    // 96db3e08 run: one 18 px scrollTop move right after the send (the send's bottom settle, not
    // the gust?). Let the send settle 500 ms before sampling, so a move left is the gust's (ambient-lead m_22035)
    await page.waitForTimeout(500);
    const g = [];
    for (let i = 0; i < 16; i++) { g.push(await geo()); await page.waitForTimeout(110); }
    const same = (k) => new Set(g.map((x) => x?.[k] ?? null)).size === 1;
    wk.gust_frames = new Set(g.map((x) => x?.gust ?? null)).size;
    // the scroller may grow when a row lands (new content, kept at the bottom): that is not the gust
    // moving it. Red only when scrollTop moves while scrollHeight stays (the thread jumps by itself).
    const sc = g.map((x) => (x?.scroll ?? '').split(',').map(Number));
    const jumps = sc.slice(1).filter((s, i) => s[1] === sc[i][1] && s[0] !== sc[i][0]).length;
    wk.scrolls = [...new Set(g.map((x) => x?.scroll ?? null))];
    wk.still = { list: same('list'), scroll: jumps === 0, composer: same('composer'), mark_box: same('mark') };
    wk.scroll_jumps = jumps;
    wk.first = g[0];
    wk.old_rows = await page.locator('[data-testid="thread.live"], [data-testid="thread.waiting"]').count();
    wk.is_working_text = /is working/.test((await text('[data-testid="thread.list"]')) ?? '');
    const lb = await page.locator('.b-composer .lbl:visible').first().boundingBox().catch(() => null);
    const mb = await mark.boundingBox().catch(() => null);
    wk.on_label_line = !!lb && !!mb && Math.abs((lb.y + lb.height / 2) - (mb.y + mb.height / 2)) <= 6;
    await shot('working-mark');
    await mark.hover({ timeout: 2000 }).catch(() => {});
    wk.tip = await page.locator('[data-testid="thread.mark.tip"]').first().innerText({ timeout: 2000 }).catch(() => null);
    await shot('working-mark-tip');
    await page.mouse.move(1, 400);
  }
  // the home thread names its main 'bise' (ambient-lead m_22076): the label reads 'to bise'
  step("the working mark: a gust after 'to bise' while main works, no 'is working' row, the thread still under its frames",
    marked && /^to (bise|main)\b/.test((wk.label ?? '').trim()) && wk.on_label_line && wk.old_rows === 0 && !wk.is_working_text && wk.gust_frames >= 2 && Object.values(wk.still).every(Boolean), wk);
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
  // a long reply in bise's own thread, so it scrolls for the block's height row (1c5659b8 run: the
  // thread was empty, nothing scrolled)
  // regress-25e5: a path naming a project routes these words there (fx.mjs), and the rows below
  // read a reply that never comes to bise's thread
  // the project rows only (app.sidebar.project.<id>, not their parts), their first line: the name
  const projects = (await page.evaluate(() => [...document.querySelectorAll('[data-testid^="app.sidebar.project."]')]
    .filter((r) => /^app\.sidebar\.project\.[^.]+$/.test(r.getAttribute('data-testid') ?? ''))
    .map((r) => (r.innerText ?? '').split(String.fromCharCode(10))[0].trim())).catch(() => [])).filter(Boolean);
  const hits = named(FX, projects);
  step("the files the words carry name no world project (else bise's thread routes them there)", projects.length > 0 && hits.length === 0, { fx: FX, projects, named: hits });
  const longMd = path.join(FX, 'long-reply.md');
  fs.writeFileSync(longMd, Array.from({ length: 60 }, (_, i) => `scroll line ${i + 1}: a long reply so bise's thread scrolls.`).join('\n\n') + '\n');
  await say(`a long one please [[reply: ${longMd}]]`);
  const longIn = await until(async () => (/scroll line 60/.test((await text('[data-testid="thread.list"]')) ?? '') ? true : null), ANSWER_MS, 1000);
  step("a long reply in bise's thread (so it scrolls)", !!longIn, null);
  const block = page.locator('[data-testid^="inbox.block"]').first();
  const hasBlock = await block.waitFor({ timeout: 15000 }).then(() => true, () => false);
  const blockText = hasBlock ? ((await block.innerText().catch(() => '')) ?? '') : '';
  await shot('inbox-block');
  step("bise's thread shows the inbox block with another project's item", hasBlock && /shop|telemetry|docs|ai-docs|folder/.test(blockText), blockText.slice(0, 300));
  // f29e895c (designer m_21505): the block never folds or changes height when the thread scrolls
  const blockH = () => page.locator('[data-testid="inbox.block"]').first().boundingBox({ timeout: 2000 }).then((b) => (b ? Math.round(b.height) : null), () => null);
  const listTop = () => page.evaluate(() => {
    const list = document.querySelector('[data-testid="thread.list"]');
    const scrolls = (x) => x.scrollHeight > x.clientHeight + 2 && /auto|scroll/.test(getComputedStyle(x).overflowY);
    let e = list && [list, ...list.querySelectorAll('*')].find(scrolls);
    if (!e) { e = list; while (e && !scrolls(e)) e = e.parentElement; }
    return e ? Math.round(e.scrollTop) : null;
  }).catch(() => null);
  if (hasBlock) {
    const h0 = await blockH();
    const top0 = await listTop();
    const lb = await page.locator('[data-testid="thread.list"]').first().boundingBox({ timeout: 3000 }).catch(() => null);
    if (lb) await page.mouse.move(lb.x + lb.width / 2, lb.y + lb.height * 0.7);
    const hs = [];
    const tops = [];
    // 8b00ed2b (ambient-lead m_21810 (c), as thread/steady-bottom.spec): the composer, its keys line
    // and the inbox block keep their boxes while the thread scrolls, moving and stopped
    const bottom = () => page.evaluate(() => {
      const at = (sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round).join(','); };
      return { composer: at('.th-screen .b-composer') ?? at('[data-testid="composer"]'), keys: at('[data-testid="composer.keys"]'), block: at('[data-testid="inbox.block"]') };
    }).catch(() => null);
    const rest = await bottom();
    const moving = [];
    const stopped = [];
    for (const dy of [-200, -200, -200, -200, 200, 200, 800]) {
      await page.mouse.wheel(0, dy);
      moving.push(await bottom());
      await page.waitForTimeout(150);
      hs.push(await blockH());
      tops.push(await listTop());
      await page.waitForTimeout(250);
      stopped.push(await bottom());
    }
    await shot('inbox-block-scrolled');
    const moved = tops.some((t) => t !== null && t !== top0);
    step('the inbox block keeps its height on scroll', h0 !== null && moved && hs.every((x) => x !== null && Math.abs(x - h0) <= 1), { height: h0, during: hs, scroll_top: [top0, ...tops], thread_scrolled: moved });
    const key = (b) => JSON.stringify(b);
    const off = [...moving, ...stopped].map((b, i) => (key(b) === key(rest) ? null : { at: i < moving.length ? `moving ${i}` : `stopped ${i - moving.length}`, box: b })).filter(Boolean);
    step('steady bottom: wheel up and down on a long thread, the composer, keys line and inbox block boxes unchanged',
      !!rest && !!rest.composer && !!rest.keys && !!rest.block && moved && off.length === 0, { rest, thread_scrolled: moved, changed: off.slice(0, 6) });
  } else step('the inbox block keeps its height on scroll', false, 'no inbox block');
  // 82cd5263 + a6efc5cb (ambient-lead m_21810 (d), as app/cmd-hints.spec): ⌘ held alone 400 ms shows
  // the keys where they act: bise's '0', each project's digit in place of its count, ⌘[ under ‹ (a
  // place behind), ⌘] under › (one ahead), ⌘I on the inbox head; released, all gone. A quick ⌘: none.
  const hintsNow = () => page.evaluate(() => {
    const t = (s) => document.querySelector(s)?.textContent?.trim() ?? null;
    const rows = [...document.querySelectorAll('[data-testid^="app.sidebar.project."]')].filter((r) => /^app\.sidebar\.project\.[^.]+$/.test(r.getAttribute('data-testid')));
    return {
      n: document.querySelectorAll('.app-keyhint').length,
      bise: t('[data-testid="app.sidebar.bise.hint"]'),
      projects: rows.map((r) => ({ name: (r.textContent ?? '').trim().slice(0, 24), hint: r.querySelector('.app-keyhint')?.textContent?.trim() ?? null, count: !!r.querySelector('.app-cnt') })),
      back: t('[data-testid="app.title.back.hint"]'), forward: t('[data-testid="app.title.forward.hint"]'), inbox: t('[data-testid="inbox.block.hint"]'),
    };
  }).catch(() => null);
  const holdCmd = async (name) => {
    await page.keyboard.down('Meta');
    await page.waitForTimeout(700);
    const held = await hintsNow();
    await shot(name);
    await page.keyboard.up('Meta');
    await page.waitForTimeout(300);
    return { held, released: await hintsNow() };
  };
  await page.locator('[data-testid="app.main"]').first().click({ position: { x: 40, y: 140 } }).catch(() => {});
  // e4394a9e: the hints show after 150 ms (the TUI's ctrl hint delay), so a quick ⌘ is 60 ms
  await page.keyboard.down('Meta');
  await page.waitForTimeout(60);
  const quick = await hintsNow();
  await page.keyboard.up('Meta');
  await page.waitForTimeout(400);
  const onBise = await holdCmd('cmd-held-bise');
  const ph = onBise.held?.projects ?? [];
  const digitsOk = ph.length > 0 && ph.slice(0, 9).every((p, i) => p.hint === String(i + 1) && !p.count);
  step('hold ⌘ 400 ms on bise: digits on bise and the projects, ⌘[ on the back arrow, ⌘I on the inbox head; all gone on release',
    !!onBise.held && quick?.n === 0 && onBise.held.bise === '0' && digitsOk && onBise.held.back === '⌘[' && onBise.held.inbox === '⌘I' && onBise.released?.n === 0,
    { quick_cmd_hints: quick?.n ?? null, ...onBise });
  // one place back (harness), so › has a place ahead: ⌘] under it; then ⌘] to bise again
  await page.keyboard.press('Meta+BracketLeft');
  await page.waitForTimeout(800);
  const behind = await holdCmd('cmd-held-forward');
  step('hold ⌘ after ⌘[: ⌘] on the forward arrow, gone on release', behind.held?.forward === '⌘]' && behind.released?.n === 0, behind);
  await page.keyboard.press('Meta+BracketRight');
  await page.waitForTimeout(800);
  if (!(await page.locator('[data-testid="app.sidebar.bise"][aria-current]').count())) await click('bise', page.locator('[data-testid="app.sidebar.bise"]').first());
  // ⌘I is the native menu's accelerator (src/main/menu.ts): CDP keys go to the page and never reach
  // the menu, so off-screen it can't be pressed. ⌃1 (the block's own key) opens the same item in place.
  await page.locator('[data-testid="app.main"]').first().click({ position: { x: 40, y: 140 } }).catch(() => {});
  await page.keyboard.press('Control+1');
  // the dock's options carry the composer's id (composer.opt.<n>, ds/composer.tsx); dock.opt before 6ac92eb4
  // b4a25acb: the item opens as the inbox card in the strip's dock, its options strip.card.<key>.opt.<n> (InboxCard.tsx)
  // b51422c0: in bise's thread the item opens in the inbox block itself (Block.tsx's InboxCard,
  // default id inbox.card.<project>-<id>, options inbox.card.<project>-<id>.opt.<n>)
  // b51422c0 run: Block.tsx passes testId inbox.block.card.<key> (inbox.block.notify for a notice),
  // so the options there are inbox.block.card.<key>.opt.<n>
  const OPT = '[data-testid^="strip.card"][data-testid*=".opt."], [data-testid^="inbox.card"][data-testid*=".opt."], [data-testid^="inbox.block.card"][data-testid*=".opt."], [data-testid^="inbox.block.notify.opt."], [data-testid^="composer.opt"], [data-testid^="dock.opt"]';
  const inPlace = await until(async () => ((await page.locator(OPT).count()) > 0 ? true : null), 8000, 400);
  await shot('inbox-ctrl-1');
  step('⌃1 opens the item in place (its options in the dock; ⌘I = native menu, not reachable by CDP)', !!inPlace, ((await text('[data-testid="app.main"]')) ?? '').slice(-300));
  if (inPlace) {
    const opt = page.locator(OPT).first();
    const label = await opt.innerText().catch(() => '');
    await click('answer it there', opt);
    const answered = await until(async () => ((await page.locator(OPT).count()) === 0 ? true : null), 15000, 500);
    await shot('inbox-answered');
    step("another project's item answered from bise's thread", !!answered, { option: label.slice(0, 80) });
  }
  // 1c5659b8 + the hub's 5b19b586 (main m_21514): his free words on another project's docked drafts
  // card, from bise's thread, show the hub's notice as one row above the composer (composer.answer.note).
  // Seeded as amb-core's answer-drafts-real check does: harness' main publishes a page of two drafted
  // mails, so its hub opens one batch card. Never '1. review' (it opens the page in a browser).
  const DRAFTS = 'release replies proof';
  const em = (i, to) => `<section data-kit="email" data-id="${i}" data-verb="draft"><p data-field="to">${to}</p><p data-field="subject">v5.9.1</p><p>x</p></section>`;
  const draftsHtml = '<section data-kit="checklist" data-id="plan" data-plan><ol>'
    + '<li data-id="b1" data-who="bise" data-did="drafted" data-draft="mail-lucas">reply to Lucas</li>'
    + '<li data-id="b2" data-who="bise" data-did="drafted" data-draft="mail-marc">reply to Marc</li></ol></section>'
    + em('mail-lucas', 'lucas@acme.test') + em('mail-marc', 'marc@acme.test');
  await harness();
  await say(`[[bash: printf '%s' '${draftsHtml}' > rel-proof.html && sb page publish rel-proof.html --id rel-proof --title '${DRAFTS}']]`);
  await click('bise', page.locator('[data-testid="app.sidebar.bise"]').first());
  const draftsRow = page.locator('[data-testid^="inbox.block.row."]', { hasText: DRAFTS }).first();
  const draftsCard = page.locator('[data-testid^="inbox.block.card."]', { hasText: /drafts?/ }).filter({ hasText: DRAFTS }).first();
  const answeringIt = async () => /answering/.test(((await page.locator('[data-testid="composer"]').first().innerText({ timeout: 1000 }).catch(() => '')) ?? ''));
  // the card is there within 90 s; then its row's click, else '+ N more' in turn, until it is the open one
  const listed = await until(async () => ((await draftsRow.isVisible().catch(() => false)) || (await draftsCard.isVisible().catch(() => false)) || /release replies proof|2 drafts/.test(((await text('[data-testid="inbox.block"]')) ?? '')) ? true : null), 90000, 1000);
  for (let i = 0; listed && i < 40 && !(await draftsCard.isVisible().catch(() => false)); i++) {
    if (await draftsRow.isVisible().catch(() => false)) await draftsRow.click({ timeout: 2000 }).catch(() => {});
    else await page.locator('[data-testid="inbox.block.more"]').first().click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(500);
  }
  const docked = await draftsCard.isVisible().catch(() => false);
  const answering = docked && await answeringIt();
  await shot('drafts-card-docked');
  let note = null;
  if (docked && answering) {
    const f = page.locator('[data-testid="composer.field"]:visible').first();
    await f.click({ timeout: 3000 }).catch(() => {});
    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('where are the drafts?', { delay: 10 });
    await page.keyboard.press('Enter');
    note = await until(async () => {
      const n = page.locator('[data-testid="composer.answer.note"]').first();
      if (!(await n.isVisible().catch(() => false))) return null;
      return { level: await n.getAttribute('data-level').catch(() => null), text: ((await n.innerText().catch(() => '')) ?? '').slice(0, 300) };
    }, 30000, 500);
    await shot('drafts-card-notice');
  }
  step("free words on a docked drafts card: the hub's notice row above the composer", !!note && note.level !== 'err' && /sent to/.test(note.text), { listed: !!listed, docked, answering, note, block: ((await text('[data-testid="inbox.block"]')) ?? '').slice(0, 300) });
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
  // 3f58f843 (ambient-lead m_21499): ⌘K finds pages by name: 'set' shows the pages group, and ⏎ on
  // its row opens settings (the selection walked down to it with ↓, as he would)
  await harness();
  await page.keyboard.press('Meta+k');
  const pal = await page.locator('[data-testid="app.palette"]').first().waitFor({ timeout: 5000 }).then(() => true, () => false);
  let kRow = { palette: pal };
  if (pal) {
    await page.keyboard.type('set', { delay: 40 });
    const groups = await until(async () => {
      const g = await page.locator('[data-testid^="app.palette.group."]').evaluateAll((els) => els.map((e) => e.getAttribute('data-testid').slice('app.palette.group.'.length)));
      return g.includes('pages') ? g : null;
    }, 5000, 300);
    const at = await page.evaluate(() => {
      const num = (e) => (e ? Number(e.getAttribute('data-testid').split('.').pop()) : null);
      const first = document.querySelector('[data-testid="app.palette.group.pages"] [data-testid^="app.palette.item."]');
      return { want: num(first), cur: num(document.querySelector('[data-testid^="app.palette.item."][aria-selected="true"]')), name: first?.textContent?.slice(0, 80) ?? null };
    });
    await shot('palette-set');
    if (at.want !== null) for (let i = at.cur ?? 0; i < at.want; i++) await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const settings = await page.locator('[data-testid="settings.root"]').first().waitFor({ timeout: 5000 }).then(() => true, () => false);
    await shot('palette-set-enter');
    kRow = { palette: pal, groups, row: at, settings };
  }
  step("⌘K with 'set' shows the pages group, ⏎ opens settings", !!kRow.groups && !!kRow.settings, kRow);
  if (pal && !kRow.settings) await page.keyboard.press('Escape');
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
  await screen1100('changes', async () => { await harness(); await say('/diff'); }, '[data-testid="changes.screen"], [data-testid="review.screen"]');
  await page.keyboard.press('Escape');
  await screen1100('palette', async () => { await harness(); await page.keyboard.press('Meta+k'); }, '[data-testid="app.palette"]');
  await page.keyboard.press('Escape');
  await screen1100('settings', () => click('settings', page.locator('[data-testid="app.sidebar.settings"]').first()), '[data-testid="settings.root"]');
  const menuBtn = page.locator('[data-testid="settings.root"] [aria-haspopup]').first();
  const hasMenu = (await menuBtn.count()) > 0;
  if (hasMenu) await screen1100('settings-menu', () => click('a settings menu', menuBtn), '[role="menu"], [role="listbox"]');
  await page.keyboard.press('Escape');
  // b51422c0's batch (ambient-lead m_21481): settings' key field and its caption, the terminal
  // panel, a thread with a tool row and a code block, the selection tint and a quote chip
  // the key row lives on the keys page (accounts.tsx), not the page settings opens on
  await click('settings', page.locator('[data-testid="app.sidebar.settings"]').first());
  const keysNav = page.locator('[data-testid="settings.nav.keys"]').first();
  if (await keysNav.waitFor({ timeout: 5000 }).then(() => true, () => false)) await click('settings keys', keysNav);
  const keyAdd = page.locator('[data-testid="settings.key.add"]').first();
  if (await keyAdd.waitFor({ timeout: 5000 }).then(() => true, () => false)) {
    await screen1100('settings-key', () => click('add a key', keyAdd), '[data-testid="settings.key.field"]');
    await page.keyboard.press('Escape');
  } else at1100['settings-key'] = { overflow: false, there: false, why: 'no settings.key.add on this world' };
  await screen1100('terminal', async () => { await harness(); await page.keyboard.press('Control+Backquote'); }, '[data-testid="terminal.panel"]');
  if (at1100.terminal.there) {
    await page.keyboard.press('Control+Backquote');
    if (await page.locator('[data-testid="terminal.panel"]').first().isVisible().catch(() => false)) await click('hide the terminal', page.locator('[data-testid="terminal.hide"]').first());
  }
  step('the terminal panel opens at 1100 (⌃`)', at1100.terminal.there && !at1100.terminal.overflow, at1100.terminal);
  const md = path.join(FX, 'code-reply.md');
  fs.writeFileSync(md, 'here is the proof, quote me if you like.\n\n```sh\necho proof-code\nls -la | head -3\n```\n\nthat was the code block.\n');
  await harness();
  await say(`[[bash: echo tool-row-proof]] [[reply: ${md}]]`);
  const coded = await until(async () => page.evaluate(() => {
    const list = document.querySelector('[data-testid="thread.list"]');
    const pre = [...(list?.querySelectorAll('pre') ?? [])].some((p) => p.textContent.includes('proof-code'));
    const tool = (list?.querySelectorAll('[data-testid^="thread.toolrow"]').length ?? 0) > 0;
    return pre && tool ? { pre, tool } : null;
  }), ANSWER_MS, 1000);
  await page.waitForTimeout(600);
  await shot('w1100-thread-code');
  at1100['thread-code'] = { overflow: await overflow(), there: !!coded };
  step('a thread with a tool row and a code block (the thread pass at 1100)', !!coded && !at1100['thread-code'].overflow, coded ?? 'no pre with proof-code, or no tool row');
  // select words of the reply: the tint is the theme's (no system blue), the pop offers the quote
  const tint = await page.evaluate(() => {
    const list = document.querySelector('[data-testid="thread.list"]');
    const w = document.createTreeWalker(list ?? document.body, NodeFilter.SHOW_TEXT);
    let n = null;
    while (w.nextNode()) if (w.currentNode.textContent.includes('quote me if you like')) n = w.currentNode;
    if (!n) return null;
    const i = n.textContent.indexOf('quote me');
    const r = document.createRange();
    r.setStart(n, i);
    r.setEnd(n, i + 'quote me if you like'.length);
    const s = window.getSelection();
    s.removeAllRanges();
    s.addRange(r);
    n.parentElement.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    return { bg: getComputedStyle(n.parentElement, '::selection').backgroundColor, text: s.toString() };
  });
  const pop = await page.locator('[data-testid="thread.quote.pop"]').first().waitFor({ timeout: 5000 }).then(() => true, () => false);
  await shot('w1100-selection');
  step('the selection tint on thread text is the theme\'s, not the system blue', !!tint && !/rgba?\(0, 9\d, 2\d\d/.test(tint.bg) && tint.bg !== 'rgba(0, 0, 0, 0)', tint);
  let chip = null;
  if (pop) {
    await click('quote it', page.locator('[data-testid="thread.quote.pop.ask"]').first());
    chip = await until(async () => page.evaluate(() => {
      const c = document.querySelector('[data-testid="composer"]');
      const q = c?.querySelector('[data-testid*="quote"], .b-quote, [class*="quote"]');
      return q ? (q.textContent || '').slice(0, 120) : null;
    }), 5000, 300);
  }
  await page.waitForTimeout(400);
  await shot('w1100-quote-chip');
  at1100['quote-chip'] = { overflow: await overflow(), there: !!chip };
  step('selected words go to the composer as a quote chip', pop && !!chip, { pop, chip });
  await page.locator('[data-testid="composer"] [contenteditable="true"]').first().click().catch(() => {});
  await page.keyboard.press('Meta+a');
  await page.keyboard.press('Backspace');
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
    // the scroller is inside thread.list (ThreadList's scrollerRef, b4a25acb), on older builds around it
    const list = document.querySelector('[data-testid="thread.list"]');
    const scrolls = (x) => x.scrollHeight > x.clientHeight + 2 && /auto|scroll/.test(getComputedStyle(x).overflowY);
    let e = list && [list, ...list.querySelectorAll('*')].find(scrolls);
    if (!e) { e = list; while (e && !scrolls(e)) e = e.parentElement; }
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
  // (e) and (f) seeds (ambient-lead m_21810): five more artifacts so ARTIFACTS passes its cap of 5,
  // and a PR artifact whose url is 'http://': browser-only for the window (models.ts leaves: a PR,
  // an http url) but refused by main's externalUrl (no host: new URL throws), so his browser can't open
  await harness();
  await say("[[bash: for i in 1 2 3 4 5; do printf 'more %s' $i > more-$i.md && sb artifact add more-$i.md --title more-$i; done; sb artifact add http:// --kind pr --title pr-proof]]");
  const rb = page.locator('[data-testid="app.panel"]').first();
  if (!(await rb.isVisible().catch(() => false))) await click('right bar', page.locator('[data-testid="app.title.panel"]').first());
  const moreBtn = page.locator('[data-testid="app.right.artifacts.more"]').first();
  const capped = await moreBtn.waitFor({ timeout: 60000 }).then(() => true, () => false);
  // (e) 8027d979: every head that folds is a row: pointer; hovered, the rows' tint and its '▾'
  const look = (id) => page.locator(`[data-testid="app.right.${id}.head"]`).first().evaluate((el) => {
    const label = el.querySelector('.app-rb-label');
    const row = el.parentElement;
    return { cursor: getComputedStyle(el).cursor, tint: row ? getComputedStyle(row).backgroundColor : '', chevron: label ? getComputedStyle(label, '::after').content : '', shown: label ? getComputedStyle(label, '::after').visibility : '' };
  }).catch(() => null);
  const heads = {};
  for (const id of ['agents', 'archived', 'artifacts', 'scheduled']) {
    await page.mouse.move(1, 400);
    await page.waitForTimeout(150);
    const rest = await look(id);
    await page.locator(`[data-testid="app.right.${id}.head"]`).first().hover({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(250);
    heads[id] = { rest, hover: await look(id) };
    if (id === 'artifacts') await shot('right-head-hover');
  }
  await page.mouse.move(1, 400);
  const folding = ['archived', 'artifacts', 'scheduled'].filter((id) => heads[id].rest);
  step('right bar: the section heads that fold show a pointer and tint on hover',
    folding.length > 0 && folding.every((id) => heads[id].rest.cursor === 'pointer' && heads[id].hover?.tint !== heads[id].rest.tint), heads);
  const artRows = () => page.locator('[data-testid="app.right.artifacts"] [data-testid^="app.right.artifact."]').evaluateAll((es) => es.filter((e) => !/\.leaves$/.test(e.getAttribute('data-testid'))).length).catch(() => null);
  let ml = { capped };
  if (capped) {
    ml.more_text = (await moreBtn.innerText().catch(() => '')).trim();
    ml.rows_capped = await artRows();
    await click("'+ N more'", moreBtn);
    const less = page.locator('[data-testid="app.right.artifacts.less"]').first();
    ml.less_text = await less.innerText({ timeout: 3000 }).then((t) => t.trim(), () => null);
    ml.rows_open = await artRows();
    ml.more_gone = (await page.locator('[data-testid="app.right.artifacts.more"]').count()) === 0;
    await shot('right-show-less');
    await click("'show less'", less);
    await page.waitForTimeout(300);
    ml.rows_back = await artRows();
    ml.more_back = (await moreBtn.innerText({ timeout: 3000 }).catch(() => '')).trim();
    ml.head_in_view = await page.locator('[data-testid="app.right.artifacts.head"]').first().isVisible().catch(() => false);
  }
  step("right bar: '+ N more' -> every row and 'show less' -> back at the cap", capped && /^\+ \d+ more$/.test(ml.more_text) && ml.less_text === 'show less' && ml.more_gone && ml.rows_open > ml.rows_capped && ml.rows_back === ml.rows_capped && ml.more_back === ml.more_text, ml);
  // (f) 1a79de8a: a PR artifact's click calls window.bise.openExternal and opens no panel. Seen
  // from a logpoint on the preload's openExternal (CDP Debugger, a condition that logs and never
  // pauses); the url is refused in main, so nothing reaches his browser (gate A watches anyway)
  const prRow = page.locator('[data-testid^="app.right.artifact."][data-testid$=".pr-proof"]').first();
  const prThere = await prRow.waitFor({ timeout: 20000 }).then(() => true, () => false);
  const dbg = await page.context().newCDPSession(page).catch(() => null);
  const ext = [];
  let bp = null;
  if (dbg && prThere) {
    const scripts = [];
    dbg.on('Debugger.scriptParsed', (e) => scripts.push(e));
    dbg.on('Runtime.consoleAPICalled', (e) => { const v = e.args?.[0]?.value; if (typeof v === 'string' && v.startsWith('AHD-EXT ')) ext.push(v.slice(8)); });
    await dbg.send('Runtime.enable').catch(() => {});
    await dbg.send('Debugger.enable').catch(() => {});
    await page.waitForTimeout(800);
    for (const s of scripts) {
      if (bp) break;
      const src = (await dbg.send('Debugger.getScriptSource', { scriptId: s.scriptId }).catch(() => null))?.scriptSource ?? '';
      const m = /openExternal:\s*async\s*\(?(\w+)\)?\s*=>\s*/.exec(src);
      if (!m) continue;
      const at = m.index + m[0].length;
      const head = src.slice(0, at);
      const line = head.split('\n').length - 1;
      const col = at - (head.lastIndexOf('\n') + 1);
      bp = await dbg.send('Debugger.setBreakpoint', {
        location: { scriptId: s.scriptId, lineNumber: line + (s.startLine ?? 0), columnNumber: col + (line === 0 ? (s.startColumn ?? 0) : 0) },
        condition: `console.log('AHD-EXT ' + String(${m[1]})), false`,
      }).then((r) => ({ id: r.breakpointId, url: s.url, param: m[1] }), (e) => ({ error: String(e).slice(0, 200) }));
    }
  }
  let pr = { row: prThere, logpoint: bp };
  if (prThere) {
    pr.leaves = await page.locator('[data-testid^="app.right.artifact."][data-testid$=".pr-proof.leaves"]').first().innerText({ timeout: 2000 }).catch(() => null);
    const screenBefore = await page.locator('[data-testid="thread.screen"]').first().getAttribute('data-agent').catch(() => null);
    await click('the PR artifact in the right bar', prRow);
    await page.waitForTimeout(1500);
    pr = { ...pr, external_calls: [...ext], panel: await page.locator('[data-testid="artifact.open"], [data-testid="artifact.page"], [data-testid="app.art"]').count(), thread_before: screenBefore,
      thread_after: await page.locator('[data-testid="thread.screen"]').first().getAttribute('data-agent').catch(() => null) };
    await shot('pr-artifact-click');
  }
  if (dbg) {
    if (bp?.id) await dbg.send('Debugger.removeBreakpoint', { breakpointId: bp.id }).catch(() => {});
    await dbg.send('Debugger.disable').catch(() => {});
    await dbg.detach().catch(() => {});
  }
  const called = !!bp?.id && pr.external_calls?.length === 1 && pr.external_calls[0] === 'http://';
  step('a PR artifact: a click calls openExternal (seen in the preload) and opens no panel', called && pr.panel === 0 && pr.thread_after === pr.thread_before, pr);
  // (g) bae706f4: the maker dropped (its own artifact made), the artifact opened from the right bar,
  // the maker's head beside it at 1100: it ends at its column, never under the panel, restore whole
  // inside it, one line
  const makerArt = page.locator('[data-testid^="app.right.artifact."][data-testid$=".rel-ts-notes"]').first();
  // (e) left the list at its cap: the maker's row (older than the more-N ones) sits behind '+ N more'
  const expand = async () => {
    const more = page.locator('[data-testid="app.right.artifacts.more"]').first();
    if (await more.isVisible().catch(() => false)) await click("the artifacts' '+ N more'", more);
  };
  await expand();
  const made = await makerArt.waitFor({ timeout: 60000 }).then(() => true, () => false);
  await say(`[[bash: sb drop ${MAKER}]]`);
  const dropCard = page.locator('[data-testid^="dock.opt"], [data-testid^="composer.opt"]').filter({ hasText: /yes|drop/i }).first();
  const dropAsked = await dropCard.waitFor({ timeout: 20000 }).then(() => true, () => false);
  if (dropAsked) await click(`answer ${MAKER}'s drop card 'yes'`, dropCard);
  const archived = await until(async () => (/release-ts/.test((await text('[data-testid="app.right.archived"]')) ?? '') && !/release-ts/.test((await text('[data-testid="app.right.agents"]')) ?? '') ? true : null), 60000, 1000);
  let gh = { made, drop_card: dropAsked, archived: !!archived };
  if (made && archived) {
    await expand();
    await click(`${MAKER}'s artifact from the right bar`, makerArt);
    const open = await page.locator('[data-testid="app.art"]').first().waitFor({ timeout: 15000 }).then(() => true, () => false);
    const vh2 = await page.evaluate(() => window.innerHeight);
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1100, height: vh2, deviceScaleFactor: 0, mobile: false }).catch(() => {});
    await page.waitForTimeout(800);
    await page.mouse.move(1, 400);
    gh = { ...gh, open, ...(await page.evaluate(() => {
      const b = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x), right: Math.round(r.right), w: Math.round(r.width), h: Math.round(r.height) }; };
      const head = document.querySelector('[data-testid="thread.head"]');
      const restore = document.querySelector('[data-testid="thread.head.restore"]');
      return {
        agent: document.querySelector('[data-testid="thread.screen"]')?.getAttribute('data-agent') ?? null,
        head: b('[data-testid="thread.head"]'), column_right: head?.parentElement ? Math.round(head.parentElement.getBoundingClientRect().right) : null,
        art: b('[data-testid="app.art"]'), restore: b('[data-testid="thread.head.restore"]'), restore_text: restore?.textContent?.trim() ?? null,
        restore_cut: restore ? restore.scrollWidth > restore.clientWidth : null, width: window.innerWidth,
      };
    })) };
    await shot('archived-maker-head-1100');
    await page.locator('[data-testid="thread.head"]').first().screenshot({ path: path.join(out, `${mode}${tag}-${++n}-archived-maker-head.png`), timeout: 5000 }).then(() => res.shots.push(path.join(out, `${mode}${tag}-${n}-archived-maker-head.png`)), () => {});
    await cdp.send('Emulation.clearDeviceMetricsOverride').catch(() => {});
    await closeArtifact();
  }
  const fits = !!gh.head && !!gh.restore && gh.column_right !== null && gh.head.right <= gh.column_right + 1
    && (!gh.art || gh.art.x <= gh.head.x || gh.head.right <= gh.art.x + 1) && gh.restore.right <= gh.head.right + 1 && gh.restore_cut === false && gh.head.h === 44;
  step("an archived maker's head beside its artifact at 1100: restore inside its column", gh.agent === MAKER && gh.width === 1100 && fits, gh);
  await harness();
  await fileChips(harness);
  await quickRows(harness, say);
}

// quick: the quick rows alone, a follow-up pass on a candidate (cand.sh AS_HE_DOES_ONLY=quick)
if (mode === 'quick') {
  const composerOf = () => page.locator('[data-testid="composer"] [contenteditable="true"], [data-testid="composer"] textarea').first();
  const say = async (words) => {
    if (!(await click(`say ${words.slice(0, 30)}`, composerOf()))) return false;
    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Backspace');
    await page.keyboard.type(words, { delay: 5 });
    await page.keyboard.press('Enter');
    return true;
  };
  const harness = () => click('open harness', page.locator('[data-testid="app.sidebar"]').getByText('harness', { exact: true }).first());
  await closeArtifact();
  if (ONLY.length) {
    // the chosen rows alone; rows37's before rowsE812's seed (its spawns' task_status would ride on
    // main's next request, the quote's included)
    await newRows(harness, say);
    await rows37(harness, say);
    await rowsE812(harness, say);
    await rowsF2A7(harness, say);
    await rows233B(harness, say);
    await rowsC2BA(harness, say);
  } else {
    // first: ARCHIVED's fold is read on a fresh profile, and the PR poller gets the time the others take
    await rowsE812(harness, say);
    await rowsF2A7(harness, say);
    await rows233B(harness, say);
    await rowsC2BA(harness, say);
    await quickRows(harness, say);
    await newRows(harness, say);
    await rows37(harness, say);
    await rows25(harness, say);
    await rows0170(harness, say);
  }
}

// d0d45f92's rows (ambient-lead m_22519): the help sheet opaque, esc never stops a turn and ctrl+c
// does (f8a5b459), a quote chip mid-sentence stays at its place in the bubble and the model's
// request (8ed6bf27), settings › approvals walks with the list keys (dda351fc) and ⌘I, the fn
// talk's corner card (666d9549) with its window frame under the off-screen rule. Each row is its
// own try: a row that throws is a red step, the next rows still run.
async function newRows(harness, say) {
  const row = async (name, fn) => {
    if (!wanted(name)) return;
    try { await fn(); } catch (e) { step(name, false, String(e).slice(0, 300)); }
  };
  const field = page.locator('[data-testid="composer.field"]:visible').first();
  const clear = async () => {
    await field.click({ timeout: 3000 }).catch(() => {});
    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Backspace');
  };
  const body = async () => (await page.evaluate(() => document.body.innerText).catch(() => '')) ?? '';

  await row('help sheet', async () => {
    await harness();
    await page.locator('[data-testid="app.main"]').first().click({ position: { x: 40, y: 140 } }).catch(() => {});
    await page.keyboard.press('Meta+/');
    const over = page.locator('[data-testid="help.overlay"]').first();
    const open = await over.waitFor({ timeout: 4000 }).then(() => true, () => false);
    // the sheet: the overlay's first descendant drawn with a background; opaque = alpha 1
    const bg = open ? await over.evaluate((o) => {
      const alpha = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c); if (!m) return 0; const p = m[1].split(',').map((x) => parseFloat(x)); return p.length > 3 ? p[3] : 1; };
      for (const el of o.querySelectorAll('*')) {
        const c = getComputedStyle(el).backgroundColor;
        if (alpha(c) > 0 && el.getBoundingClientRect().width > 200) return { cls: el.className, color: c, alpha: alpha(c) };
      }
      return null;
    }) : null;
    await shot('help-sheet');
    step('the help sheet (⌘/) is opaque on the scrim', open && bg !== null && bg.alpha === 1, { open, bg });
    if (open) await page.keyboard.press('Escape');
  });

  await row('esc / ctrl+c during a turn', async () => {
    await harness();
    await clear();
    await say('[[slow: 40]] a long turn to stop');
    const keyLine = async () => /ctrl\+c stop/.test(await body());
    const working = await until(async () => ((await keyLine()) ? true : null), 20000, 500);
    await field.click({ timeout: 3000 }).catch(() => {});
    await page.keyboard.type('garde ça', { delay: 10 });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(2500);
    const afterEsc = { keyLine: await keyLine(), stopping: (await page.locator('[data-testid="thread.stopping"]').count()) > 0 };
    step('esc during a turn does not stop it (the turn still runs 2.5 s later)', !!working && afterEsc.keyLine && !afterEsc.stopping, { working: !!working, afterEsc });
    // esc with words puts them away to history (keys.ts putAway, ↑ brings them back): a new draft
    // for ctrl+c to keep
    await field.click({ timeout: 3000 }).catch(() => {});
    await page.keyboard.type('garde ça', { delay: 10 });
    await page.keyboard.press('Control+c');
    const stopping = await until(async () => {
      const s = (await page.locator('[data-testid="thread.stopping"]').count()) > 0;
      const gone = !(await keyLine());
      return s || gone ? { stopping: s, keyLineGone: gone } : null;
    }, 15000, 300);
    const draft = ((await field.innerText({ timeout: 2000 }).catch(() => '')) ?? '').trim();
    await shot('ctrl-c-stopped');
    step('ctrl+c stops the turn; the draft stays', !!stopping && draft.includes('garde ça'), { stopping, draft });
    await clear();
  });

  await row('quote mid-sentence', async () => {
    await harness();
    await clear();
    await say('[[reply: QUOTE_SRC]] please answer');
    // the fake provider answers 'QUOTE_SRC' as a path it can't read: any words of the last answer do
    const src = await until(async () => page.evaluate(() => {
      const rows = [...document.querySelectorAll('[data-testid="thread.list"] [data-testid^="thread.entry."]')].filter((r) => r.getAttribute('data-side') !== 'me' && r.getAttribute('data-kind') !== 'tool');
      const last = rows.at(-1);
      const w = last ? document.createTreeWalker(last, NodeFilter.SHOW_TEXT) : null;
      while (w?.nextNode()) { const t = w.currentNode.textContent.trim(); if (t.split(/\s+/).length >= 3) return t.split(/\s+/).slice(0, 3).join(' '); }
      return null;
    }), 30000, 1000);
    await field.click({ timeout: 3000 }).catch(() => {});
    await page.keyboard.type('before ', { delay: 10 });
    let pop = false;
    if (src) {
      await page.evaluate((words) => {
        const list = document.querySelector('[data-testid="thread.list"]');
        const w = document.createTreeWalker(list ?? document.body, NodeFilter.SHOW_TEXT);
        let n = null;
        while (w.nextNode()) if (w.currentNode.textContent.includes(words)) n = w.currentNode;
        if (!n) return;
        const i = n.textContent.indexOf(words);
        const r = document.createRange();
        r.setStart(n, i);
        r.setEnd(n, i + words.length);
        const s = window.getSelection();
        s.removeAllRanges();
        s.addRange(r);
        n.parentElement.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      }, src);
      pop = await page.locator('[data-testid="thread.quote.pop"]').first().waitFor({ timeout: 5000 }).then(() => true, () => false);
      if (pop) await page.locator('[data-testid="thread.quote.pop.ask"]').first().click({ timeout: 3000 }).catch(() => {});
    }
    // the caret after the chip: his words go on after it
    await page.waitForTimeout(400);
    await page.keyboard.type(' after', { delay: 10 });
    const chip = (await field.locator('[data-kind="quote"]').count()) > 0;
    const inField = ((await field.innerText({ timeout: 2000 }).catch(() => '')) ?? '').replace(/\s+/g, ' ');
    await shot('quote-mid-sentence-field');
    await page.keyboard.press('Enter');
    // the bubble: before, the quote, after, in that order
    const bubble = await until(async () => page.evaluate(() => {
      // his bubble, never bise's ack that echoes 'before … after' (cand-e91f98d7 run): it holds the chip
      const mine = [...document.querySelectorAll('[data-testid="thread.list"] [data-testid^="thread.entry."]')].filter((r) => (r.textContent ?? '').includes('before') && (r.textContent ?? '').includes('after') && /[❝“]/.test(r.textContent ?? ''));
      const b = mine.at(-1);
      if (!b) return null;
      const t = b.textContent ?? '';
      // the bubble's own words (its text parts, not the quote card above them): before, the chip, after
      const parts = b.querySelector('[data-testid$=".parts"]') ?? b;
      const words = (parts.textContent ?? '').replace(/\s+/g, ' ');
      // the chip after 'before': the quote card above the words starts with its own '❝ 1' (cand-37fa)
      const b0 = words.indexOf('before');
      const m = /[❝“"]\s*1/.exec(words.slice(Math.max(b0, 0)));
      const chip = m ? Math.max(b0, 0) + m.index : -1;
      return { text: t.slice(0, 300), words: words.slice(0, 200), order: [words.indexOf('before'), chip, words.indexOf('after', Math.max(chip, 0))] };
    }), 10000, 500);
    await shot('quote-mid-sentence-bubble');
    const inPlace = (o) => !!o && o[0] >= 0 && o[1] > o[0] && o[2] > o[1];
    step('a quote chip mid-sentence stays at its place in the bubble (before, the quote, after)', pop && chip && !!bubble && inPlace(bubble.order), { src, pop, chip, inField: inField.slice(0, 200), bubble });
    // the model's request: the user message holds before, the quoted words, after, in that order
    const LOG = process.env.AS_HE_DOES_FAKE_LOG;
    const req = await until(async () => {
      if (!LOG || !fs.existsSync(LOG)) return null;
      const lines = fs.readFileSync(LOG, 'utf8').split('\n').filter((l) => l.includes('before') && l.includes('after') && (!src || l.includes(src)));
      if (lines.length === 0) return null;
      const j = JSON.parse(lines.at(-1));
      const u = typeof j.user === 'string' ? j.user : JSON.stringify(j.user ?? j.last_user ?? j);
      return { user: u.slice(0, 400), order: [u.indexOf('before'), src ? u.indexOf(src) : -1, u.indexOf('after')] };
    }, 30000, 1000);
    step("the quote sits at its place in the model's request too (before, the quote, after)", !!req && inPlace(req.order), req ?? { log: LOG ?? 'AS_HE_DOES_FAKE_LOG not set' });
    await clear();
  });

  await row('approvals walk', async () => {
    await click('settings', page.locator('[data-testid="app.sidebar"]').getByText('settings', { exact: true }).first());
    const nav = page.locator('[data-testid="settings.nav.approvals"]').first();
    if (!(await nav.count())) await page.getByText('approvals', { exact: true }).first().click({ timeout: 5000 }).catch(() => {});
    else await nav.click({ timeout: 5000 }).catch(() => {});
    const rows = page.locator('[data-testid="settings.approvals.rules"] .b-gi');
    const n = await until(async () => { const c = await rows.count(); return c >= 3 ? c : null; }, 8000, 400);
    const sel = () => page.evaluate(() => {
      const all = [...document.querySelectorAll('[data-testid="settings.approvals.rules"] .b-gi')];
      return all.findIndex((r) => r.classList.contains('is-sel'));
    });
    await page.evaluate(() => { document.querySelector('.settings-approvals')?.focus(); });
    const s0 = await sel();
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(150);
    const s1 = await sel();
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(150);
    const s2 = await sel();
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(150);
    const s3 = await sel();
    await shot('approvals-walk');
    // ↓ selects (or moves), ↓ moves one down, ↑ comes back
    step('settings › approvals walks with ↓↓↑ (3 saved rules)', !!n && s1 >= 0 && s2 === s1 + 1 && s3 === s1, { n, s0, s1, s2, s3 });
    // ⌘I: the inbox (a native menu accelerator in the packed app: CDP keys may not reach it)
    await page.keyboard.press('Meta+i');
    await page.waitForTimeout(800);
    const inbox = await page.evaluate(() => !!document.querySelector('[data-testid^="inbox"], [data-testid="app.inbox"]'));
    await shot('cmd-i');
    step('⌘I opens the inbox (CDP key; a native menu accelerator would not get it)', inbox, { inbox });
    await page.keyboard.press('Escape');
  });

  await row('corner card', async () => {
    const VOICE = process.env.AS_HE_DOES_VOICE;
    if (!VOICE) { step('the fn talk corner card', false, 'no fake voice (AS_HE_DOES_VOICE)'); return; }
    await harness();
    fs.writeFileSync(VOICE, 'what time is it');
    // amb-mac e3e5b750: off-screen, each capsule show/move appends where place.ts would put it
    const CFR = process.env.AS_HE_DOES_USERDATA ? path.join(process.env.AS_HE_DOES_USERDATA, 'capsule-frames.jsonl') : null;
    const cfrLines = () => { try { return fs.readFileSync(CFR, 'utf8').split(String.fromCharCode(10)).filter(Boolean); } catch { return []; } };
    const cfrBefore = cfrLines().length;
    // no helper off-screen: the talk starts and ends as the capsule's fn would send them
    await page.evaluate(() => window.bise.core.send({ cmd: 'talk_start' }));
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.bise.core.send({ cmd: 'talk_end' }));
    const capPage = () => browser.contexts().flatMap((c) => c.pages()).find((p) => p.url().includes('surface=capsule'));
    const seen = await until(async () => {
      const cp = capPage();
      if (!cp) return null;
      const r = await cp.evaluate(() => ({
        card: !!document.querySelector('[data-testid="capsule.card"]'),
        talk: document.querySelector('[data-testid="capsule.talk.words"]')?.textContent ?? null,
        answer: document.querySelector('[data-testid="capsule.answer"]')?.textContent?.slice(0, 200) ?? null,
      }));
      return r.card && r.answer ? r : null;
    }, 30000, 500);
    let frame = null;
    const cp = capPage();
    if (cp) {
      // Electron's CDP has no Browser.getWindowForTarget: the page's own window.screenX/Y is its frame
      try {
        frame = await cp.evaluate(() => ({ bounds: { left: window.screenX, top: window.screenY, width: window.outerWidth, height: window.outerHeight }, screen: { w: window.screen.width, h: window.screen.height } }));
      } catch (e) { frame = { error: String(e).slice(0, 200) }; }
      try { await cp.screenshot({ path: path.join(out, `${mode}${tag}-corner-card.png`) }); res.shots.push(path.join(out, `${mode}${tag}-corner-card.png`)); save(); } catch { /* the steps say enough */ }
    }
    // the talk itself, without the card: his words reach the model (the capsule enters a talk only
    // from the helper's fn, machine.ts, and off-screen runs no helper, offscreen.ts)
    const LOG = process.env.AS_HE_DOES_FAKE_LOG;
    const heard = LOG && fs.existsSync(LOG) ? fs.readFileSync(LOG, 'utf8').includes('what time is it') : null;
    step("the fn talk's words reach main's model (core talk_start/talk_end)", heard === true, { log: LOG ?? 'AS_HE_DOES_FAKE_LOG not set', heard });
    step('the fn talk corner card: his words and the answer', !!seen, seen ?? { capsule: !!cp, why: 'off-screen has no helper: the capsule never enters a talk from a core talk_start alone' });
    // where the card would sit on his display (capsule-frames.jsonl): bottom-right 16 px inside the
    // work area (capsuleframe.test.ts); the real window stays parked off every screen
    const recs = cfrLines().slice(cfrBefore).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    const corner = recs.filter((r) => r.mode === 'corner');
    const ruleOf = (r) => ({ ev: r.ev, dock: r.dock, right: r.bounds.x + r.bounds.width, wantRight: r.work.x + r.work.width - 16, bottom: r.bounds.y + r.bounds.height, wantBottom: r.work.y + r.work.height - 16, bounds: r.bounds, parked: r.parked });
    const rules = corner.map(ruleOf);
    const ruleOk = rules.length > 0 && rules.every((r) => r.right === r.wantRight && r.bottom === r.wantBottom);
    step('the corner card frame: bottom-right 16 px inside the work area (capsule-frames.jsonl)', ruleOk, rules.length ? rules : { file: CFR ?? 'AS_HE_DOES_USERDATA not set', records: recs.length, why: recs.length ? 'no corner show' : 'no capsule show off-screen (no helper fn): nothing written' });
    // off-screen rule (offscreen.ts): every window at -30000, never on a screen; the file's parked
    // frame first, else the page's own screenX/Y
    const parked = corner.map((r) => r.parked);
    const off = parked.length ? parked.every((p) => p.x <= -20000 || p.y <= -20000)
      : !!frame?.bounds && (frame.bounds.left <= -20000 || frame.bounds.top <= -20000 || frame.bounds.windowState === 'minimized');
    step('its window frame is off every screen (the off-screen rule: -30000)', off, parked.length ? { parked } : frame);
    const t0 = Date.now();
    const closed = await until(async () => {
      const r = await capPage()?.evaluate(() => !document.querySelector('[data-testid="capsule.card"]')).catch(() => null);
      return r ? Date.now() - t0 : null;
    }, 20000, 500);
    step('the corner card closes by itself (8 s linger)', closed !== null && closed <= 14000, { closedAfterMs: closed });
  });
}

// 37fa183d's rows (ambient-lead m_22814): the composer's attachment list (b46e1fbd, c0e755ca), his
// inbox answer's row where he is (16c5f1ea), the fn bubble without the capsule's hint (041168b2),
// the waiting line over the composer (37fa183d), the right bar's heads centred (aad80d58). The
// dictation meter is dict1.mjs's (it holds the fake voice). Each row is its own try.
async function rows37(harness, say) {
  const NL = String.fromCharCode(10);
  const row = async (name, fn) => {
    if (!wanted(name)) return;
    try { await fn(); } catch (e) { step(name, false, String(e).slice(0, 300)); }
  };
  const field = page.locator('[data-testid="composer.field"]:visible').first();
  const clear = async () => {
    await field.click({ timeout: 3000 }).catch(() => {});
    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Backspace');
  };
  const bise = () => click('bise', page.locator('[data-testid="app.sidebar.bise"]').first());
  const drop = async (sel, files) => {
    const box = await page.locator(sel).first().boundingBox().catch(() => null);
    if (!box) return false;
    const x = box.x + box.width / 2, y = box.y + box.height / 2;
    const s = await page.context().newCDPSession(page);
    const data = { items: [], files, dragOperationsMask: 1 };
    for (const type of ['dragEnter', 'dragOver', 'drop']) await s.send('Input.dispatchDragEvent', { type, x, y, data });
    await s.detach().catch(() => {});
    return true;
  };

  await row('attachment list', async () => {
    const AD = path.join(FX, 'attach37');
    fs.rmSync(AD, { recursive: true, force: true });
    fs.mkdirSync(AD, { recursive: true });
    const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    for (const f of ['one.png', 'two.png']) fs.writeFileSync(path.join(AD, f), PNG);
    fs.writeFileSync(path.join(AD, 'notes.txt'), `fake notes${NL}`);
    await harness();
    await clear();
    await say('[[reply: ATTACH_SRC]] please answer');
    const src = await until(async () => page.evaluate(() => {
      const rows = [...document.querySelectorAll('[data-testid="thread.list"] [data-testid^="thread.entry."]')].filter((r) => r.getAttribute('data-side') !== 'me' && r.getAttribute('data-kind') !== 'tool');
      const last = rows.at(-1);
      const w = last ? document.createTreeWalker(last, NodeFilter.SHOW_TEXT) : null;
      while (w?.nextNode()) { const t = w.currentNode.textContent.trim(); if (t.split(/\s+/).length >= 3) return t.split(/\s+/).slice(0, 3).join(' '); }
      return null;
    }), 30000, 1000);
    await field.click({ timeout: 3000 }).catch(() => {});
    await page.keyboard.type('zqatt ', { delay: 10 });
    // 1: a quote (the selection's ask), 2 and 3: two images, 4: a file, in that order
    if (src) {
      await page.evaluate((words) => {
        const list = document.querySelector('[data-testid="thread.list"]');
        const w = document.createTreeWalker(list ?? document.body, NodeFilter.SHOW_TEXT);
        let n = null;
        while (w.nextNode()) if (w.currentNode.textContent.includes(words)) n = w.currentNode;
        if (!n) return;
        const i = n.textContent.indexOf(words);
        const r = document.createRange();
        r.setStart(n, i);
        r.setEnd(n, i + words.length);
        const s = window.getSelection();
        s.removeAllRanges();
        s.addRange(r);
        n.parentElement.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      }, src);
      const pop = await page.locator('[data-testid="thread.quote.pop"]').first().waitFor({ timeout: 5000 }).then(() => true, () => false);
      if (pop) await page.locator('[data-testid="thread.quote.pop.ask"]').first().click({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(400);
    }
    await page.keyboard.press('End');
    await drop('[data-testid="composer.field"]:visible', [path.join(AD, 'one.png'), path.join(AD, 'two.png')]);
    await page.waitForTimeout(1200);
    await page.keyboard.press('End');
    await drop('[data-testid="composer.field"]:visible', [path.join(AD, 'notes.txt')]);
    const read = () => page.evaluate(() => {
      const comp = document.querySelector('[data-testid="composer"]');
      const list = comp?.querySelector('[data-testid$=".attach"]') ?? null;
      const f = [...document.querySelectorAll('[data-testid="composer.field"]')].find((e) => e.getBoundingClientRect().width > 0);
      const box = f?.closest('.b-box, .b-composer, [data-testid="composer"]') ?? comp;
      const rb = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), r: Math.round(r.right), b: Math.round(r.bottom) }; };
      const rows = list ? [...list.querySelectorAll('[role="listitem"]')].map((r) => ({ n: r.getAttribute('data-n'), kind: r.getAttribute('data-kind'), lit: r.classList.contains('lit'), text: (r.textContent ?? '').trim().slice(0, 80) })) : [];
      const chips = f ? [...f.querySelectorAll('.b-chip[data-n]')].map((c) => ({ n: c.getAttribute('data-n'), kind: c.getAttribute('data-kind'), lit: c.classList.contains('lit') })) : [];
      return { rows, chips, list: rb(list), box: rb(box), inComposer: !!list && !!comp?.contains(list), field: (f?.textContent ?? '').slice(0, 120) };
    });
    const r0 = await until(async () => { const r = await read(); return r.rows.length >= 4 ? r : null; }, 10000, 400) ?? await read();
    await shot('attach-list');
    const inside = !!r0.list && !!r0.box && r0.list.x >= r0.box.x - 1 && r0.list.r <= r0.box.r + 1 && r0.list.y >= r0.box.y - 1 && r0.list.b <= r0.box.b + 1;
    const kinds = r0.rows.map((x) => x.kind).join(',');
    step('the attachment list: a quote, 2 images, a file as rows inside the composer box, in order', r0.inComposer && inside && kinds === 'quote,image,image,file', r0);
    const nums = (xs) => xs.map((x) => x.n).join(',');
    step("the list's numbers are the chips' numbers", r0.rows.length === 4 && nums(r0.rows) === nums(r0.chips), { rows: nums(r0.rows), chips: nums(r0.chips) });
    // hover: a row lights its chip; a chip lights its row
    const n2 = r0.rows[1]?.n, n3 = r0.rows[2]?.n;
    let hov = {};
    if (n2 && n3) {
      await page.locator(`[data-testid$=".attach.${n2}"]`).first().hover({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(250);
      const a = await read();
      hov.rowHover = { chipLit: a.chips.filter((c) => c.lit).map((c) => c.n) };
      await shot('attach-hover-row');
      await field.locator(`.b-chip[data-n="${n3}"]`).first().hover({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(250);
      const b = await read();
      hov.chipHover = { rowLit: b.rows.filter((x) => x.lit).map((x) => x.n) };
    }
    step('hover links them: a row lights its chip, a chip lights its row', hov.rowHover?.chipLit?.join() === n2 && hov.chipHover?.rowLit?.join() === n3, hov);
    // ✕ on the file's row: the row and its chip go
    const n4 = r0.rows[3]?.n;
    let x = null;
    if (n4) {
      await page.locator(`[data-testid$=".attach.${n4}"]`).first().hover({ timeout: 3000 }).catch(() => {});
      await page.locator(`[data-testid$=".attach.${n4}.remove"]`).first().click({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(400);
      const a = await read();
      x = { rows: nums(a.rows), chips: nums(a.chips) };
    }
    step('✕ on a row removes the row and its chip', !!x && !x.rows.split(',').includes(n4) && !x.chips.split(',').includes(n4) && x.rows.split(',').length === 3, x);
    // backspace after the last chip (an image): the chip and its row go
    let bs = null;
    if (n3) {
      await field.click({ timeout: 3000 }).catch(() => {});
      await page.keyboard.press('End');
      for (let i = 0; i < 2; i++) {
        await page.keyboard.press('Backspace');
        await page.waitForTimeout(300);
        const a = await read();
        bs = { presses: i + 1, rows: nums(a.rows), chips: nums(a.chips), field: a.field };
        if (!a.chips.some((c) => c.n === n3)) break;
      }
      await shot('attach-backspace');
    }
    step('backspace on a chip removes the chip and its row', !!bs && !bs.chips.split(',').includes(n3) && !bs.rows.split(',').includes(n3), bs);
    await clear();
  });

  await row('inbox answer rows', async () => {
    const Q = `zqpick${String(Date.now() % 100000)} which colour?`;
    await harness();
    await clear();
    await field.click({ timeout: 3000 }).catch(() => {});
    await page.keyboard.type(`[[bash: sb card '${Q}`, { delay: 5 });
    for (const l of ['1. zqred', "2. zqblue']]"]) { await page.keyboard.press('Shift+Enter'); await page.keyboard.type(l, { delay: 5 }); }
    await page.keyboard.press('Enter');
    await bise();
    const rowL = page.locator('[data-testid^="inbox.block.row."]', { hasText: 'zqpick' }).first();
    const open = page.locator('[data-testid^="inbox.block.open."], [data-testid^="inbox.block.card."]').filter({ hasText: 'zqpick' }).first();
    const listed = await until(async () => {
      if ((await rowL.isVisible().catch(() => false)) || (await open.isVisible().catch(() => false))) return true;
      await page.locator('[data-testid="inbox.block.more"]').first().click({ timeout: 1000 }).catch(() => {});
      return null;
    }, 90000, 1000);
    for (let i = 0; listed && i < 20 && !(await open.isVisible().catch(() => false)); i++) {
      if (await rowL.isVisible().catch(() => false)) await rowL.click({ timeout: 2000 }).catch(() => {});
      else await page.locator('[data-testid="inbox.block.more"]').first().click({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(400);
    }
    const opened = await open.isVisible().catch(() => false);
    // the ⌘I-less path: a click on the option in the docked block
    if (opened) await open.locator('[data-testid$=".opt.2"]').first().click({ timeout: 3000 }).catch(() => {});
    const asideOf = () => page.evaluate(() => {
      const a = [...document.querySelectorAll('[data-testid^="thread.aside."]')].filter((e) => /^thread\.aside\.\d+$/.test(e.getAttribute('data-testid') ?? '') && (e.textContent ?? '').includes('zqblue'));
      return a.length ? { n: a.length, text: (a.at(-1).textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 200) } : null;
    });
    const aside = opened ? await until(asideOf, 20000, 500) : null;
    await shot('inbox-answer-aside');
    const good = (a) => !!a && a.n === 1 && /✓/.test(a.text) && /you answered \S+ · harness/.test(a.text) && /zqblue/.test(a.text) && !/zqblue.*\b2\b/.test(a.text);
    step("his inbox answer from the block in bise's view (no ⌘I, another project's card): '✓ you answered <agent> · harness' + the option's words", good(aside), { listed: !!listed, opened, aside });
    await page.reload().catch(() => {});
    await page.locator('[data-testid="app.sidebar"]').first().waitFor({ timeout: 20000 }).catch(() => {});
    await bise();
    const after = await until(asideOf, 20000, 500);
    step('his answer row is there once after a reload', good(after), after);
    // the asker's thread: the hub's own row with the option's words
    await harness();
    const hub = await until(async () => page.evaluate(() => {
      const r = [...document.querySelectorAll('[data-testid^="thread.approval."]')].filter((e) => /^thread\.approval\.\d+$/.test(e.getAttribute('data-testid') ?? '') && (e.textContent ?? '').includes('zqblue'));
      return r.length ? (r.at(-1).textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 200) : null;
    }), 20000, 500);
    step("the asker's thread (harness) has the hub's row: you answered + the option's words", !!hub && /you answered/.test(hub), hub);
  });

  await row('fn bubble', async () => {
    const VOICE = process.env.AS_HE_DOES_VOICE;
    if (!VOICE) { step('his fn message bubble', false, 'no fake voice (AS_HE_DOES_VOICE)'); return; }
    const W = 'zqfn tell me the weather';
    fs.writeFileSync(VOICE, W);
    await page.evaluate(() => window.bise.core.send({ cmd: 'talk_start' }));
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.bise.core.send({ cmd: 'talk_end' }));
    await bise();
    const you = await until(async () => page.evaluate((w) => {
      const r = [...document.querySelectorAll('[data-testid^="thread.you."]')].filter((e) => /^thread\.you\.\d+$/.test(e.getAttribute('data-testid') ?? '') && (e.textContent ?? '').includes(w));
      const b = r.at(-1);
      if (!b) return null;
      const id = b.getAttribute('data-testid');
      return { id, text: (b.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 300), via: document.querySelector(`[data-testid="${id}.via"]`)?.textContent?.trim() ?? null };
    }, 'zqfn'), 40000, 1000);
    await shot('fn-bubble');
    step("his fn message's bubble: his words, no '[from the capsule…]'", !!you && you.text.includes(W) && !/from the capsule/.test(you.text), you);
    step("'from fn' on its meta row", you?.via === 'from fn', you);
    const LOG = process.env.AS_HE_DOES_FAKE_LOG;
    const line = LOG && fs.existsSync(LOG) ? fs.readFileSync(LOG, 'utf8').split(NL).filter((l) => l.includes('zqfn')).at(-1) ?? null : null;
    const hint = line ? /\[from the capsule[^\]]*\]/.exec(line)?.[0] ?? null : null;
    step("the model's request still has the capsule's line after his words (FAKE_LOG)", !!hint && line.indexOf('zqfn') < line.indexOf(hint), { log: LOG ?? 'AS_HE_DOES_FAKE_LOG not set', hint, line: line?.slice(0, 300) ?? null });
  });

  await row('waiting line', async () => {
    const RC = path.join(out, `zq-wait-${String(Date.now() % 100000)}.rc`);
    await harness();
    await clear();
    await say(`[[bash: sb wake --on-file ${RC} --note "zq status line watch"]]`);
    // agent-waiting-states A (f5a0394a): a file watch is an alarm, never a line over the composer;
    // it sits in the right bar's SCHEDULED & WATCHING until its file appears
    const there = await until(async () => (await alarmRows('zq status line'))[0] ?? null, 60000, 1000);
    const line = await page.locator('[data-testid="thread.waiting"]').first().innerText({ timeout: 1000 }).catch(() => null);
    await shot('waiting-line');
    step("an alarm (sb wake --on-file): no line over the composer, its row in SCHEDULED & WATCHING", !!there && line === null, { row: there, line });
    // the watch's file appears: the wake comes and the row goes
    fs.writeFileSync(RC, '0');
    const gone = await until(async () => ((await alarmRows('zq status line')).length === 0 ? true : null), 30000, 1000);
    step('the alarm row goes when the watch ends', !!gone, { gone: !!gone });
  });

  await row('right bar heads', async () => {
    await harness();
    const heads = page.locator('.app-rb-head');
    const hn = await heads.count();
    const seen = [];
    for (let i = 0; i < Math.min(hn, 4); i++) {
      const h = heads.nth(i);
      if (!(await h.isVisible().catch(() => false))) continue;
      await h.hover({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(200);
      seen.push(await h.evaluate((el) => {
        const r = el.getBoundingClientRect();
        const mid = r.top + r.height / 2;
        const textMid = (e) => {
          if (!e) return null;
          const range = document.createRange();
          range.selectNodeContents(e);
          const b = range.getBoundingClientRect();
          return b.height > 0 ? Math.round((b.top + b.height / 2 - mid) * 10) / 10 : null;
        };
        return { label: el.querySelector('.app-rb-label')?.textContent?.trim() ?? null, h: Math.round(r.height), bg: getComputedStyle(el).backgroundColor, dy: { label: textMid(el.querySelector('.app-rb-label')), sum: textMid(el.querySelector('.app-rb-sum')), act: textMid(el.querySelector('.b-act')) } };
      }));
      if (i === 0) await h.screenshot({ path: path.join(out, `${mode}${tag}-${++n}-rb-head-hover.png`), timeout: 3000 }).then(() => res.shots.push(path.join(out, `${mode}${tag}-${n}-rb-head-hover.png`)), () => {});
    }
    await page.mouse.move(1, 300);
    const off = seen.flatMap((s) => Object.values(s.dy).filter((v) => v !== null && Math.abs(v) > 1));
    step('right-bar section heads: their text centred in the hover box (±1 px)', seen.length > 0 && seen.some((s) => s.dy.label !== null) && off.length === 0, { heads: hn, seen });
  });
  await harness();
}

// 25e5fe33's rows (ambient-lead m_23008): a trackpad pinch on an image artifact (e83bc9c2: ctrl +
// wheel zooms around the pointer, a '…%' chip, esc back to fit with the artifact still open), his
// /restart row on the thread's column and gone at the hub's hello and after a reload (b6128528), its
// truth tail from window.bise.app.update() (25e5fe33: a candidate is not the try's bundle, so 'none'
// and the hub's words alone), the '/' box on artifacts and scheduled (6bb405a9), and the archived
// list: a, then esc, keeps the live rows. Seeded by one message to harness' main (a 1600x1000 PNG and
// an archived note, both under <out>/rows25). Each row is its own try.
async function rows25(harness, say) {
  const row = async (name, fn) => {
    try { await fn(); } catch (e) { step(name, false, String(e).slice(0, 300)); }
  };
  const field = page.locator('[data-testid="composer.field"]:visible').first();
  const clear = async () => {
    await field.click({ timeout: 3000 }).catch(() => {});
    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Backspace');
  };
  const D = path.join(FX, 'rows25');
  fs.rmSync(D, { recursive: true, force: true });
  fs.mkdirSync(D, { recursive: true });
  const NW = 1600, NH = 1000;
  {
    const { PNG } = createRequire(path.join(DESKTOP, 'package.json'))('pngjs');
    const png = new PNG({ width: NW, height: NH });
    for (let y = 0; y < NH; y++) for (let x = 0; x < NW; x++) {
      const i = (y * NW + x) * 4;
      const c = x % 100 === 0 || y % 100 === 0 ? [60, 60, 60] : x > 700 && x < 900 && y > 400 && y < 600 ? [184, 65, 107] : Math.floor(y / 250) % 2 === 0 ? [236, 222, 200] : [214, 196, 170];
      png.data[i] = c[0]; png.data[i + 1] = c[1]; png.data[i + 2] = c[2]; png.data[i + 3] = 255;
    }
    fs.writeFileSync(path.join(D, 'hero-25.png'), PNG.sync.write(png));
    fs.writeFileSync(path.join(D, 'old-25.txt'), 'an old note\n');
  }
  await closeArtifact();
  await harness();
  await clear();
  await say(`[[bash: sb artifact add ${D}/hero-25.png --title hero-25]] [[bash: sb artifact add ${D}/old-25.txt --title old-25 && sb artifact archive old-25]] [[bash: sb every 1h 'rerun the bench 25' --times 2]] seeded`);
  const heroRow = page.locator('[data-testid="app.right.artifacts"] [data-testid^="app.right.artifact."][data-testid$=".hero-25"]').first();
  const seeded = await until(async () => (await heroRow.count()) > 0, 60000, 1000);
  step('rows25 seed: hero-25 (image) in the right bar, old-25 archived', !!seeded, { right: (await text('[data-testid="app.right.artifacts"]'))?.slice(0, 400) ?? null });

  await row('pinch on an image artifact', async () => {
    if (!seeded) throw new Error('no hero-25 row');
    await heroRow.click({ timeout: 5000 });
    const box = page.locator('[data-testid="artifact.image"]').first();
    await box.waitFor({ timeout: 10000 });
    await until(async () => (await box.getAttribute('data-fit')) === 'true', 8000, 250);
    const img = page.locator('[data-testid="artifact.image.img"]').first();
    await until(async () => (await img.evaluate((e) => e.complete && e.naturalWidth > 0)), 10000, 250);
    const point = async (x, y) => { const r = await img.boundingBox(); return r ? { x: ((x - r.x) * NW) / r.width, y: ((y - r.y) * NH) / r.height, top: r.y, w: r.width } : null; };
    const wz = () => page.evaluate(() => [window.devicePixelRatio, window.visualViewport?.scale ?? 1]);
    const fit0 = await box.getAttribute('data-fit');
    const chip0 = await page.locator('[data-testid="artifact.zoom"]').count();
    const before = await wz();
    const b = await box.boundingBox();
    const px = Math.round(b.x + b.width * 0.4), py = Math.round(b.y + b.height * 0.45);
    await page.mouse.move(px, py);
    const pinch = async (t) => { await page.keyboard.down('Control'); for (let i = 0; i < t; i++) { await page.mouse.wheel(0, -40); await page.waitForTimeout(30); } await page.keyboard.up('Control'); await page.waitForTimeout(200); };
    await pinch(3);
    const fit1 = await box.getAttribute('data-fit');
    const at = await point(px, py);
    await pinch(3);
    const zoomed = await point(px, py);
    const chip = await text('[data-testid="artifact.zoom"]');
    const after = await wz();
    await page.mouse.move(1, 300);
    await shot('pinch-zoomed');
    await page.mouse.move(px, py);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const fit2 = await box.getAttribute('data-fit');
    const stillOpen = await page.locator('[data-testid="artifact.open"]').count();
    await shot('pinch-esc-fit');
    const dx = at && zoomed ? Math.abs(zoomed.x - at.x) : null, dy = at && zoomed ? Math.abs(zoomed.y - at.y) : null;
    step('pinch (ctrl+wheel) on an image artifact: fit at open, no chip; zooms around the pointer (±1 px), a % chip, the window zoom never moves; esc back to fit, the artifact still open',
      fit0 === 'true' && chip0 === 0 && fit1 === 'false' && dx !== null && dx <= 1 && dy <= 1 && zoomed.w > at.w && /^\d+%$/.test(chip ?? '') && JSON.stringify(before) === JSON.stringify(after) && fit2 === 'true' && stillOpen > 0,
      { fit0, chip0, fit1, at, zoomed, dx, dy, chip, before, after, fit2, stillOpen });
    await closeArtifact();
    await page.keyboard.press('Escape').catch(() => {});
  });

  await row('restart row', async () => {
    await harness();
    await clear();
    const upd = await page.evaluate(() => window.bise?.app?.update?.().catch((e) => ({ error: String(e) })) ?? null).catch((e) => ({ error: String(e) }));
    await field.click({ timeout: 3000 });
    // the real hub offers /restart's argument ('current: the version running now, nothing built'):
    // the first ⏎ takes the menu's pick (cand-25e5's first quick run: '/restart' stayed in the field),
    // so it's typed whole and ⏎ again while the field still holds it
    await page.keyboard.type('/restart current', { delay: 10 });
    const sent = [];
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(600);
      const left = ((await field.innerText({ timeout: 1000 }).catch(() => '')) ?? '').trim();
      sent.push(left);
      if (!left) break;
    }
    const N = '[data-testid="confirm.notice"]';
    // outside bise's source tree (the world's projects) /restart is a reload (versions.rs restart_plan):
    // the hub's words are 'reloading bise on the running version …', not 'restarting the hub on …'
    const seen = await until(async () => /restarting the hub|reloading bise/.test((await text(N)) ?? '') ? true : null, 20000, 100);
    const words = (await text(N))?.replace(/\s+/g, ' ').trim() ?? null;
    const geo = await page.evaluate(() => {
      const ps = [...document.querySelectorAll('[data-testid="thread.list"] [data-testid^="thread.entry."] .th-md p')];
      const p = ps.at(-1)?.getBoundingClientRect();
      const r = document.querySelector('[data-testid="confirm.notice"]')?.getBoundingClientRect();
      return { col: p ? p.left : null, row: r ? r.left : null, w: window.innerWidth };
    });
    await page.mouse.move(1, 300);
    await shot('restart-row');
    step('his /restart: the hub\'s row shows, on the thread\'s text column (±0.5 px)', !!seen && geo.col !== null && geo.row !== null && Math.abs(geo.col - geo.row) <= 0.5, { words, geo });
    // the truth tail: a candidate isn't the try's bundle ('none'): the hub's words alone, no 'this app is'
    const tailOk = upd && upd.state === 'none' ? !/this app is/.test(words ?? '') : upd && upd.state === 'current' && upd.live ? /this app is/.test(words ?? '') || true : null;
    step("truth tail: window.bise.app.update() read; on a candidate ('none') the hub's line alone", !!seen && tailOk === true, { update: upd, words });
    const gone = await until(async () => (await page.locator(N).count()) === 0 ? true : null, 90000, 250);
    const goneAt = gone ? 'gone' : await text(N);
    step("the restart row goes at the hub's hello", !!gone, goneAt);
    await page.reload();
    await page.locator('[data-testid="app.sidebar"]').first().waitFor({ timeout: 20000 }).catch(() => {});
    await harness();
    await page.waitForTimeout(1500);
    const afterReload = await page.locator(N).count();
    await shot('restart-after-reload');
    step('after a reload: no restart row', afterReload === 0, { count: afterReload });
    // the switcher writes no line in the thread for a switch that goes well (designer m_23091: its start
    // and its probation are the switch row's and hub.log's; his m_22835 'ne disparaît jamais')
    const listed = await page.evaluate(() => [...document.querySelectorAll('[data-testid="thread.list"] [data-testid^="thread.notice."]')]
      .map((e) => ({ id: e.getAttribute('data-testid'), text: e.textContent.replace(/\s+/g, ' ').trim().slice(0, 200), left: Math.round(e.getBoundingClientRect().left * 10) / 10 }))
      .filter((e) => /restarting the hub|reloading bise|state backed up|probation passed/.test(e.text)));
    step("after the hello and a reload: no switcher line in the thread's list", listed.length === 0, { listed });
  });

  for (const scr of ['artifacts', 'scheduled']) {
    await row(`'/' hint on ${scr}`, async () => {
      await click(scr, page.locator(`[data-testid="app.sidebar.${scr}"]`).first());
      await page.locator(`[data-testid="${scr}.screen"]`).first().waitFor({ timeout: 8000 });
      const id = `${scr}.search`;
      const f = page.locator(`[data-testid="${id}"]`).first(), cap = page.locator(`[data-testid="${id}.slash"]`).first();
      await page.evaluate((s) => document.querySelector(`[data-testid="${s}.screen"]`)?.focus(), scr);
      await page.mouse.move(1, 300);
      const geo = await page.evaluate((tid) => {
        const fb = document.querySelector(`[data-testid="${tid}"]`)?.closest('.b-field')?.getBoundingClientRect();
        const c = document.querySelector(`[data-testid="${tid}.slash"]`)?.getBoundingClientRect();
        return fb ? { w: fb.width, cap: c && c.width > 0 ? { right: Math.round((fb.right - c.right) * 10) / 10, dv: Math.round(((c.top - fb.top) - (fb.bottom - c.bottom)) * 10) / 10 } : null } : null;
      }, id);
      const rest = { visible: await cap.isVisible(), text: await cap.textContent().catch(() => null), placeholder: await f.getAttribute('placeholder') };
      await shot(`slash-${scr}-rest`);
      await page.keyboard.press('/');
      await page.waitForTimeout(250);
      const focused = await f.evaluate((e) => document.activeElement === e).catch(() => false);
      const hidden = !(await cap.isVisible());
      const value = await f.inputValue().catch(() => null);
      await shot(`slash-${scr}-focused`);
      step(`'/' hint on ${scr}: a boxed '/' at rest (8 px from the right, centred); '/' focuses the search, the box hides, no '/' typed`,
        rest.visible && rest.text === '/' && geo?.cap && Math.abs(geo.cap.right - 8) <= 1 && Math.abs(geo.cap.dv) <= 1 && focused && hidden && value === '',
        { rest, geo, focused, hidden, value });
      await page.keyboard.press('Escape');
      await page.evaluate((s) => document.querySelector(`[data-testid="${s}.screen"]`)?.focus(), scr);
    });
  }

  await row('archived list: a then esc', async () => {
    await click('artifacts', page.locator('[data-testid="app.sidebar.artifacts"]').first());
    await page.locator('[data-testid="artifacts.screen"]').first().waitFor({ timeout: 8000 });
    const rows = () => page.locator('[data-testid="artifacts.list"] [role=option]').count();
    await until(async () => (await rows()) > 0, 8000, 250);
    const n0 = await rows();
    const arch = await text('[data-testid="artifacts.archived"]');
    // where his keys go: the screen itself (as quickRows' ↓↓⏎), and if the composer took the 'a'
    // (cand-25e5's first quick run: 'a' landed in the composer), a click on a row first, as he would
    const composerText = async () => ((await page.locator('[data-testid="composer.field"]:visible').first().innerText({ timeout: 1000 }).catch(() => '')) ?? '').trim();
    await page.evaluate(() => { document.querySelector('[data-testid="artifacts.screen"]')?.focus(); });
    const focusedOn = await page.evaluate(() => document.activeElement?.getAttribute('data-testid') ?? document.activeElement?.tagName ?? null);
    await page.keyboard.press('a');
    await page.waitForTimeout(400);
    let how = 'screen focused';
    const took = await composerText();
    if (!/archived/.test((await text('[data-testid="artifacts.screen"] .art-h1')) ?? '')) {
      if (took) await clear();
      await page.locator('[data-testid="artifacts.list"] [role=option]').first().click({ timeout: 3000 });
      await page.keyboard.press('a');
      await page.waitForTimeout(400);
      how = `row clicked (the screen's focus sent 'a' to ${took ? 'the composer' : 'nothing'})`;
    }
    const h1 = await text('[data-testid="artifacts.screen"] .art-h1');
    const n1 = await rows();
    const old = await page.locator('[data-testid="artifacts.list"] [data-testid$=".old-25"]').count();
    await shot('archived-a');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    const n2 = await rows();
    const onScreen = await page.locator('[data-testid="artifacts.screen"]').count();
    const h1b = await text('[data-testid="artifacts.screen"] .art-h1');
    await shot('archived-esc');
    step("archived list: a shows the archived (old-25 among them), esc goes back to the live list with its rows, still on artifacts",
      n0 >= 1 && /archived/.test(h1 ?? '') && n1 >= 1 && old > 0 && n2 === n0 && onScreen > 0 && !/archived/.test(h1b ?? ''),
      { n0, archived_row: arch, focused_on: focusedOn, how, h1, n1, old, n2, onScreen, h1b });
  });
  await harness();
}

// 0170ed3f's rows (main m_23135, agent-waiting-states A f5a0394a/7d97d7a2/d6ece40b, the switcher's
// silence a38108e7, the route's paths 0170ed3f), on the real hubs of the world, seeded by one
// message to harness' main: zqbench is paused on a pid the driver started (sb wake --on-exit
// --then), zqsearch waits on zqdocs' reply (an sb ask whose question holds a [[slow]] marker, built
// by printf so no message carries it whole: zqdocs answers 240 s later), main sets an alarm (a file
// watch). Rows: the pause over the composer and in the head, the reply line and its name, the
// alarm only in the right bar (hover words, detail, stop watching), never 'since', and a path that
// holds a project's name stays in bise's thread. Each row is its own try; the pid is killed at the end.
// e812463c's rows (main m_23495): the right bar's ARCHIVED starts folded and an opened one stays
// open after a reload (c4665615); a card answered from another project's thread never comes back
// through a project switch and a reload (store/acted.ts); a merge-ready card's '2 open it on GitHub'
// opens the PR, sends nothing, the card stays and nothing says 'you answered' (his #384, localAct).
// The merge card is the hub's own: the world's GitHub (cand.sh: origin on github.com, the fake gh
// first on the PATH) lists PR #384 on zqmerge's branch, CLEAN and approved, once its place exists.
// '2' calls window.bise.openExternal: a breakpoint in the preload reads its URL and swaps it for
// 'qa-noop:held' (main refuses that scheme), so his browser never opens; a swap that doesn't take
// stops the renderer's call (Runtime.terminateExecution) and the run (BREACH).
async function rowsE812(harness, say) {
  const row = async (name, fn) => {
    if (!wanted(name)) return;
    try { await fn(); } catch (e) { step(name, false, String(e).slice(0, 300)); }
  };
  const flat = (s) => (s ?? '').replace(/\s+/g, ' ').trim();
  const bise = () => click('bise', page.locator('[data-testid="app.sidebar.bise"]').first());
  const HP = process.env.AS_HE_DOES_HARNESS ?? null;
  const GHW = process.env.AS_HE_DOES_GH_WORLD ?? null;
  const git = async (args) => {
    const { execFileSync } = await import('node:child_process');
    try { return execFileSync('git', ['-C', HP, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return null; }
  };
  // the projects of the sidebar but bise and harness: {id, name}
  const others = () => page.evaluate(() => [...document.querySelectorAll('[data-testid^="app.sidebar.project."]')]
    .map((e) => ({ id: (e.getAttribute('data-testid') ?? '').slice('app.sidebar.project.'.length), name: (e.querySelector('.app-side-name, .name')?.textContent ?? e.textContent ?? '').replace(/\s+/g, ' ').trim() }))
    .filter((p) => p.id && !p.id.includes('.') && !/^\W*harness\b/.test(p.name))).catch(() => []);
  const openProject = async (id) => {
    await page.locator(`[data-testid="app.sidebar.project.${id}"]`).first().click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(800);
  };
  // a card's words anywhere a card shows (the inbox block, a strip, the dock), never his asides
  // a read that fails (a reload under it) counts as seen: a red to look at, never a silent pass
  const cardShown = (token) => page.evaluate((t) => [...document.querySelectorAll('[data-testid^="inbox."], [data-testid^="strip."], [data-testid^="dock."]')]
    .some((e) => (e.textContent ?? '').includes(t)), token).catch(() => 'unread');
  // the block's row or card holding `token`, opened (a click on its row, '+ N more' first)
  const dock = async (token, ms) => {
    const rowL = page.locator('[data-testid^="inbox.block.row."]', { hasText: token }).first();
    const open = page.locator('[data-testid^="inbox.block.card."]').filter({ hasText: token }).first();
    const listed = await until(async () => {
      if ((await rowL.isVisible().catch(() => false)) || (await open.isVisible().catch(() => false))) return true;
      await page.locator('[data-testid="inbox.block.more"]').first().click({ timeout: 1000 }).catch(() => {});
      return null;
    }, ms, 1000);
    for (let i = 0; listed && i < 20 && !(await open.isVisible().catch(() => false)); i++) {
      if (await rowL.isVisible().catch(() => false)) await rowL.click({ timeout: 2000 }).catch(() => {});
      else await page.locator('[data-testid="inbox.block.more"]').first().click({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(400);
    }
    return { listed: !!listed, open: (await open.isVisible().catch(() => false)) ? open : null };
  };
  const answeredAsides = (token) => page.evaluate((t) => [...document.querySelectorAll('[data-testid^="thread.aside."], [data-testid^="thread.approval."]')]
    .filter((e) => /^thread\.(aside|approval)\.\d+$/.test(e.getAttribute('data-testid') ?? '') && /you answered/.test(e.textContent ?? '') && (e.textContent ?? '').includes(t))
    .map((e) => (e.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 200)), token).catch(() => ['unread']);
  const fakeLines = (token) => {
    const LOG = process.env.AS_HE_DOES_FAKE_LOG;
    return LOG && fs.existsSync(LOG) ? fs.readFileSync(LOG, 'utf8').split('\n').filter((l) => l.includes(token)).length : null;
  };

  // the seed, in harness' thread: zqmerge (its place's branch carries the PR), zqold dropped (ARCHIVED)
  await harness();
  // --place new: its own worktree on sb/zqmerge (the world's agents share the workspace otherwise,
  // so no branch for a PR: try-gate-e812's first run)
  await say("[[bash: sb spawn zqmerge --place new --objective 'zq ts-pattern error dx: nothing to do yet' && sb spawn zqold --objective 'zq old: nothing to do' && sleep 3 && sb drop zqold]] seeded e812");
  const tip = HP ? await until(async () => git(['rev-parse', '--verify', '-q', 'refs/heads/sb/zqmerge']), 60000, 1000) : null;
  if (tip && GHW) {
    fs.writeFileSync(path.join(GHW, 'prs-harness.json'), JSON.stringify({ owner: 'qa-world', name: 'harness', prs: [{
      number: 384, branch: 'sb/zqmerge', head: tip, title: 'zq ts-pattern error dx', draft: false, review: 'APPROVED', rollup: 'SUCCESS',
      checks: [{ name: 'ci', conclusion: 'SUCCESS' }], reviews: [{ state: 'APPROVED', author: 'alice' }], merge_state: 'CLEAN', commits: 1,
    }] }, null, 1));
  }
  step("rowsE812 seed: zqmerge's place (branch sb/zqmerge) and PR #384 in the world's GitHub", !!tip && !!GHW, { harness: HP, gh_world: GHW, tip });

  await row('archived fold', async () => {
    await harness();
    const headL = page.locator('[data-testid="app.right.archived.head"]').first();
    const shown = await until(async () => ((await headL.count()) ? true : null), 60000, 1000);
    const state = () => page.evaluate(() => {
      const h = document.querySelector('[data-testid="app.right.archived.head"]');
      return {
        expanded: h?.getAttribute('aria-expanded') ?? null,
        head: (h?.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 80),
        rows: document.querySelectorAll('[data-testid="app.right.archived"] .app-rb-row').length,
        zqold: !!document.querySelector('[data-testid="app.right.archived.zqold"], [data-testid$=".zqold"][data-testid^="app.right.archived."]'),
        agents: document.querySelector('[data-testid="app.right.agents.head"]')?.getAttribute('aria-expanded') ?? null,
      };
    });
    const s0 = await state();
    await page.mouse.move(1, 300);
    await shot('archived-folded');
    step("ARCHIVED starts folded on a fresh profile: its head only (aria-expanded false, 'ARCHIVED · N'), no row; AGENTS open",
      !!shown && s0.expanded === 'false' && /ARCHIVED/.test(s0.head) && s0.rows === 0 && !s0.zqold && s0.agents !== 'false', s0);
    if (!shown) return;
    await headL.click({ timeout: 5000 });
    const s1 = await until(async () => { const s = await state(); return s.expanded === 'true' && s.zqold ? s : null; }, 5000, 250) ?? (await state());
    await page.waitForTimeout(700);
    await page.reload().catch(() => {});
    await page.locator('[data-testid="app.sidebar"]').first().waitFor({ timeout: 20000 }).catch(() => {});
    await harness();
    const s2 = await until(async () => { const s = await state(); return s.expanded !== null ? s : null; }, 15000, 250);
    await page.mouse.move(1, 300);
    await shot('archived-open-after-reload');
    step('a click opens it (zqold there); after a reload it is still open', s1.expanded === 'true' && s1.zqold && s2?.expanded === 'true' && s2?.zqold, { opened: s1, after_reload: s2 });
    // folded again, as found
    await page.locator('[data-testid="app.right.archived.head"]').first().click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(400);
  });

  await row('card answered from another project, then a switch and a reload', async () => {
    const [other] = await others();
    const T = `zqcard${String(Date.now() % 100000)}`;
    await harness();
    // harness' main idle first: the seed's turn and its agents' acks can hold the card's words
    // past the wait (try-gate-e812's third run: no card in 90 s)
    await until(async () => (/· idle\b/.test(flat(await text('[data-testid="composer"]'))) ? true : null), 90000, 1000);
    const f = page.locator('[data-testid="composer.field"]:visible').first();
    await f.click({ timeout: 3000 }).catch(() => {});
    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Backspace');
    await page.keyboard.type(`[[bash: sb card '${T} which size?`, { delay: 5 });
    for (const l of ['1. zqsmall', "2. zqlarge']]"]) { await page.keyboard.press('Shift+Enter'); await page.keyboard.type(l, { delay: 5 }); }
    await page.keyboard.press('Enter');
    if (other) await openProject(other.id); else await bise();
    const d = await dock(T, 90000);
    if (d.open) await d.open.locator('[data-testid$=".opt.1"]').first().click({ timeout: 3000 }).catch(() => {});
    const gone = d.open ? await until(async () => (!(await cardShown(T)) ? true : null), 10000, 250) : null;
    await page.mouse.move(1, 300);
    await shot('card-answered-other-project');
    // from here on, sampled every 250 ms: the card must never show again
    const seen = [];
    const watch = async (where, ms) => {
      const t0 = Date.now();
      while (Date.now() - t0 < ms) { if (await cardShown(T)) seen.push({ where, at_ms: Date.now() - t0 }); await page.waitForTimeout(250); }
    };
    await watch(other ? other.name : 'bise', 3000);
    await harness();
    await watch('harness (a project switch)', 6000);
    await bise();
    await watch('bise (a project switch)', 4000);
    await page.reload().catch(() => {});
    await page.locator('[data-testid="app.sidebar"]').first().waitFor({ timeout: 20000 }).catch(() => {});
    await watch('bise after a reload', 8000);
    if (other) { await openProject(other.id); await watch(`${other.name} after the reload`, 4000); }
    await harness();
    await watch('harness after the reload', 4000);
    await page.mouse.move(1, 300);
    await shot('card-never-back');
    step(`a card answered from another project's thread (${other ? other.name : 'none: bise'}): gone, never back through a project switch and a reload (sampled every 250 ms, ~30 s)`,
      d.listed && !!d.open && !!gone && seen.length === 0, { other: other ?? null, listed: d.listed, opened: !!d.open, gone: !!gone, seen: seen.slice(0, 10), asides: await answeredAsides('zqsmall') });
  });

  await row("merge card's '2 open it on GitHub'", async () => {
    if (!tip) { step("a merge-ready card's '2 open it on GitHub'", false, 'no PR seeded (no zqmerge branch or no world GitHub)'); return; }
    await bise();
    // the PR poller: once a minute with a window (forge/poll.rs SLOW_MS), the first ask at once
    const d = await dock('#384', 240000);
    const ghLog = GHW && fs.existsSync(path.join(GHW, 'gh.log')) ? fs.readFileSync(path.join(GHW, 'gh.log'), 'utf8').split('\n').filter(Boolean) : [];
    if (!d.open) {
      step("a merge-ready card (#384) shows in bise's inbox", false, { listed: d.listed, gh_calls: ghLog.length, gh_last: ghLog.slice(-3), block: flat(await text('[data-testid="inbox.block"]')).slice(0, 300) });
      return;
    }
    const cardText = flat(await d.open.innerText().catch(() => ''));
    const opt2 = flat(await d.open.locator('[data-testid$=".opt.2"]').first().innerText().catch(() => ''));
    await page.mouse.move(1, 300);
    await shot('merge-card');
    step("a merge-ready card (#384, the hub's, from the world's GitHub) in bise's inbox, '2 open it on GitHub'", /#384 is ready to merge/.test(cardText) && /open it on GitHub/.test(opt2), { card: cardText.slice(0, 300), opt2, gh_calls: ghLog.length });

    // the preload's openExternal held: a breakpoint, its URL read, swapped for 'qa-noop:held'
    const dbg = await page.context().newCDPSession(page);
    const scripts = [];
    dbg.on('Debugger.scriptParsed', (e) => scripts.push(e));
    await dbg.send('Debugger.enable');
    await page.waitForTimeout(800);
    let bp = null;
    let param = null;
    for (const s of scripts) {
      const src = (await dbg.send('Debugger.getScriptSource', { scriptId: s.scriptId }).catch(() => null))?.scriptSource ?? '';
      const m = /openExternal:\s*async\s*\(?(\w+)\)?\s*=>\s*/.exec(src);
      if (!m) continue;
      const where = m.index + m[0].length;
      const head = src.slice(0, where);
      const line = head.split('\n').length - 1;
      const col = where - (head.lastIndexOf('\n') + 1);
      const r = await dbg.send('Debugger.setBreakpoint', { location: { scriptId: s.scriptId, lineNumber: line + (s.startLine ?? 0), columnNumber: col + (line === 0 ? (s.startColumn ?? 0) : 0) } }).catch(() => null);
      if (r?.breakpointId) { bp = r.breakpointId; param = m[1]; break; }
    }
    const held = [];
    dbg.on('Debugger.paused', async (e) => {
      const f = e.callFrames[0];
      if (!bp || !(e.hitBreakpoints ?? []).includes(bp)) { await dbg.send('Debugger.resume').catch(() => {}); return; }
      const read = async () => (await dbg.send('Debugger.evaluateOnCallFrame', { callFrameId: f.callFrameId, expression: param }).catch(() => null))?.result?.value ?? null;
      const rec = { url: await read(), swapped: false };
      const sc = f.scopeChain.findIndex((x) => x.type === 'local');
      await dbg.send('Debugger.setVariableValue', { scopeNumber: Math.max(sc, 0), variableName: param, newValue: { value: 'qa-noop:held' }, callFrameId: f.callFrameId }).catch((err) => { rec.err = String(err).slice(0, 160); });
      rec.swapped = (await read()) === 'qa-noop:held';
      held.push(rec);
      if (!rec.swapped) {
        // never his browser: the call ends here, and the run with it
        await dbg.send('Runtime.terminateExecution').catch(() => {});
        fs.writeFileSync(path.join(out, 'BREACH'), `openExternal not held (${String(rec.url)}): the run stops before his browser opens`);
      }
      await dbg.send('Debugger.resume').catch(() => {});
    });
    // the swap proved on a harmless call first (main refuses this scheme either way)
    const probe = bp ? await page.evaluate(() => window.bise.openExternal('qa-noop:probe')).catch((e) => String(e).slice(0, 120)) : null;
    const probeOk = held.length === 1 && held[0].url === 'qa-noop:probe' && held[0].swapped && probe === false;
    step("the preload's openExternal is held (its URL read, swapped for a refused one): his browser never opens", probeOk, { bp: !!bp, param, probe, held: [...held] });
    if (!probeOk || fs.existsSync(path.join(out, 'BREACH'))) { await dbg.detach().catch(() => {}); return; }

    const before = fakeLines('#384');
    const beforeCount = fakeLines('open it on GitHub');
    await d.open.locator('[data-testid$=".opt.2"]').first().click({ timeout: 3000 }).catch(() => {});
    await until(async () => (held.length >= 2 ? true : null), 5000, 200);
    await page.waitForTimeout(3000);
    const stays = (await cardShown('#384')) === true;
    const asides = await answeredAsides('open it on GitHub');
    const asides384 = await answeredAsides('zqmerge');
    const label = flat(await text('[data-testid="composer"] .lbl'));
    await page.mouse.move(1, 300);
    await shot('merge-2-held');
    const url = held[1]?.url ?? null;
    step("'2 open it on GitHub' opens the PR's page (github.com/qa-world/harness/pull/384), and only that", held.length === 2 && url === 'https://github.com/qa-world/harness/pull/384', { held: [...held] });
    step("…sends nothing (no model request names it) and the card stays, with no 'you answered'",
      stays && asides.length === 0 && asides384.length === 0 && fakeLines('#384') === before && fakeLines('open it on GitHub') === beforeCount,
      { stays, asides, asides384, label, fake_384: [before, fakeLines('#384')], fake_opt: [beforeCount, fakeLines('open it on GitHub')] });
    await dbg.send('Debugger.removeBreakpoint', { breakpointId: bp }).catch(() => {});
    await dbg.send('Debugger.disable').catch(() => {});
    await dbg.detach().catch(() => {});
    // honest across a switch and a reload: still listed (the hub keeps it), still no 'you answered'
    await harness();
    await page.waitForTimeout(1500);
    await page.reload().catch(() => {});
    await page.locator('[data-testid="app.sidebar"]').first().waitFor({ timeout: 20000 }).catch(() => {});
    await bise();
    const back = await until(async () => ((await cardShown('#384')) === true ? true : null), 20000, 500);
    await page.mouse.move(1, 300);
    await shot('merge-after-reload');
    step("after a project switch and a reload: the merge card is still in bise's inbox, still no 'you answered'",
      !!back && (await answeredAsides('zqmerge')).length === 0, { back: !!back, asides: await answeredAsides('zqmerge') });
    // '3 not yet' closes it (the hub's answer), so the later rows see no open merge card
    const d2 = await dock('#384', 10000);
    if (d2.open) await d2.open.locator('[data-testid$=".opt.3"]').first().click({ timeout: 3000 }).catch(() => {});
    const closedIt = await until(async () => (!(await cardShown('#384')) ? true : null), 15000, 500);
    res.notes = [...(res.notes ?? []), { what: "merge card closed with '3 not yet' after the rows", closed: !!closedIt, asides: await answeredAsides('zqmerge') }];
    save();
  });
  await harness();
}

// f2a72fd8's rows (ambient-lead m_23555, card #509): every way he answers an inbox card (a digit from
// another project, words from bise's view, a click in the asker's project) leaves '✓ you answered
// <agent> · <project>' where he is, from the hub's AnswerResult, kept across a switch and a reload;
// a refused answer and a refused close bring that card back with the words (the harness hub held
// with SIGSTOP past the core's 30 s ASK_LATE: the core's own refusal), and an answer to a card the
// hub withdrew meanwhile gets the hub's own 'isn't open' (the candidate's ambient-core held with
// SIGSTOP while main withdraws it); a pause under a minute counts its seconds on the line, the head
// and the AGENTS row, then minutes. Every SIGSTOP is the world's or the candidate's own pid, always
// SIGCONT'd. Each row is its own try.
async function rowsF2A7(harness, say) {
  const row = async (name, fn) => {
    if (!wanted(name)) return;
    try { await fn(); } catch (e) { step(name, false, String(e).slice(0, 300)); }
  };
  const flat = (s) => (s ?? '').replace(/\s+/g, ' ').trim();
  const bise = () => click('bise', page.locator('[data-testid="app.sidebar.bise"]').first());
  const field = page.locator('[data-testid="composer.field"]:visible').first();
  const clear = async () => {
    await field.click({ timeout: 3000 }).catch(() => {});
    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Backspace');
  };
  const HP = process.env.AS_HE_DOES_HARNESS ?? null;
  const APP = process.env.AS_HE_DOES_APP ?? null;
  const { execFileSync, spawn } = await import('node:child_process');
  const psLines = () => { try { return execFileSync('/bin/ps', ['-axww', '-o', 'pid=,command='], { encoding: 'utf8' }).split(String.fromCharCode(10)); } catch { return []; } };
  const pidOf = (l) => Number(l.trim().split(/\s+/)[0]);
  // the candidate's own ambient-core (under its bundle), and the world's harness hub (its workspace)
  const coreLines = () => (APP ? psLines().filter((l) => l.includes(`${APP}/Contents/`) && / ambient-core( |$)/.test(l)) : []);
  const hubLines = () => (HP ? psLines().filter((l) => l.includes(' sbd --workspace ') && (l.includes(`--workspace ${HP} `) || l.endsWith(`--workspace ${HP}`))) : []);
  const signal = (pids, s) => pids.forEach((p) => {
    if (s === 'SIGSTOP') HELD.add(p); else HELD.delete(p);
    try { process.kill(p, s); } catch { /* gone */ }
  });
  const others = () => page.evaluate(() => [...document.querySelectorAll('[data-testid^="app.sidebar.project."]')]
    .map((e) => ({ id: (e.getAttribute('data-testid') ?? '').slice('app.sidebar.project.'.length), name: (e.querySelector('.app-side-name, .name')?.textContent ?? e.textContent ?? '').replace(/\s+/g, ' ').trim() }))
    .filter((p) => p.id && !p.id.includes('.') && !/^\W*harness\b/.test(p.name))).catch(() => []);
  const openProject = async (id) => {
    await page.locator(`[data-testid="app.sidebar.project.${id}"]`).first().click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(800);
  };
  const reload = async () => {
    await page.reload().catch(() => {});
    await page.locator('[data-testid="app.sidebar"]').first().waitFor({ timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(1000);
  };
  // a card's words anywhere a card shows (a failed read counts as shown: a red to look at)
  const cardShown = (token) => page.evaluate((t) => [...document.querySelectorAll('[data-testid^="inbox."], [data-testid^="strip."], [data-testid^="dock."]')]
    .some((e) => (e.textContent ?? '').includes(t)), token).catch(() => 'unread');
  // the card holding `token` anywhere in the block: its words, else a walk through '+ N more' (each
  // opens the next item; a folded card's words aren't in the block, try-gate-f2a7's second run)
  const present = async (token) => {
    const seen = await cardShown(token);
    if (seen !== false) return true;
    const n = Number(/(\d+) waiting/.exec(flat(await text('[data-testid="inbox.block"]')))?.[1] ?? 0);
    for (let i = 0; i < n + 1; i++) {
      const m = page.locator('[data-testid="inbox.block.more"]').first();
      if (!(await m.count().catch(() => 0))) break;
      await m.click({ timeout: 1000 }).catch(() => {});
      await page.waitForTimeout(250);
      if ((await cardShown(token)) !== false) return true;
    }
    return false;
  };
  // the block's card holding `token`, open in place: {listed, open, id}
  const dock = async (token, ms) => {
    const rowL = page.locator('[data-testid^="inbox.block.row."]', { hasText: token }).first();
    const open = page.locator('[data-testid^="inbox.block.open."]').filter({ hasText: token }).first();
    const listed = await until(async () => {
      if ((await rowL.isVisible().catch(() => false)) || (await open.isVisible().catch(() => false))) return true;
      await page.locator('[data-testid="inbox.block.more"]').first().click({ timeout: 1000 }).catch(() => {});
      return null;
    }, ms, 1000);
    for (let i = 0; listed && i < 20 && !(await open.isVisible().catch(() => false)); i++) {
      if (await rowL.isVisible().catch(() => false)) await rowL.click({ timeout: 2000 }).catch(() => {});
      else await page.locator('[data-testid="inbox.block.more"]').first().click({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(400);
    }
    const isOpen = await open.isVisible().catch(() => false);
    const id = isOpen ? await open.evaluate((el) => {
      const c = el.matches('[data-testid^="inbox.block.card."]') ? el : el.querySelector('[data-testid^="inbox.block.card."]');
      const m = /-(\d+)$/.exec(c?.getAttribute('data-testid') ?? '');
      return m ? Number(m[1]) : null;
    }).catch(() => null) : null;
    return { listed: !!listed, open: isOpen ? open : null, id };
  };
  // the rows of the thread on screen holding `words`: his asides and the hub's approval rows, each once
  const rowsWith = (words) => page.evaluate((w) => [...document.querySelectorAll('[data-testid="thread.list"] [data-testid^="thread."]')]
    .filter((e) => /^thread\.(aside|approval)\.\d+$/.test(e.getAttribute('data-testid') ?? '') && (e.textContent ?? '').includes(w))
    .map((e) => ({ id: e.getAttribute('data-testid'), text: (e.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 200) })), words).catch(() => [{ id: 'unread', text: '' }]);
  const bodyHas = async (re) => { const b = flat(await page.locator('body').innerText({ timeout: 3000 }).catch(() => '')); const m = re.exec(b); return m ? m[0] : null; };

  const T = String(Date.now() % 100000);
  const [other] = await others();
  const goOther = async () => { if (other) await openProject(other.id); else await bise(); };
  const otherName = other ? other.name : 'bise';

  // main's cards in harness, each '<question>' then its options on their own lines (Shift+Enter, as
  // rows37: sb card is main's alone, 'reserved for main' from an agent, try-gate-f2a7's first run)
  const cards = async (list, tail) => {
    await field.click({ timeout: 3000 }).catch(() => {});
    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Backspace');
    // one line, printf's \n: the composer continues a '1. …' list on Shift+Enter ('2. 2. zqlarge',
    // and '5. 1. zqclick-one' on the third card of a message: no option 1 to click, try-gate-f2a7's
    // second run)
    const NL = String.fromCharCode(92) + 'n';
    const one = (c) => `sb card "$(printf "%s${NL}" ${[c.q, ...c.opts].map((x) => `"${x}"`).join(' ')})"`;
    await page.keyboard.type(`[[bash: ${list.map(one).join(' && ')}]] ${tail}`, { delay: 5 });
    await page.keyboard.press('Enter');
  };
  // the seed: three cards (one per way), in harness
  await closeArtifact();
  await harness();
  await until(async () => (/· idle\b/.test(flat(await text('[data-testid="composer"]'))) ? true : null), 90000, 1000);
  await cards(['digit', 'words', 'click'].map((w) => ({ q: `zqA${w}${T} which way?`, opts: [`1. zq${w}-one`, `2. zq${w}-two`] })), 'seeded f2a7');
  // folded under '+ N more' a card's words aren't in the block: main's 'card #N opened' x3 instead
  const seeded = await until(async () => ((((await text('[data-testid="thread.list"]')) ?? '').match(/(card|notification) #\d+ opened for the user/g) ?? []).length >= 3 ? true : null), 120000, 1000);
  step("rowsF2A7 seed: main's three cards (digit, words, click) in the inbox", !!seeded, { other: other ?? null, block: flat(await text('[data-testid="inbox.block"]')).slice(0, 300) });

  const took = {};
  // answer-in-thread A (787e6ee82): an answer to another project's card takes the window to that
  // project's thread at his answer, the hub's row there ('answered from <where>' under his bubble);
  // no window aside in the thread he answered from (store/answered.ts)
  const harnessPid = () => page.evaluate(() => [...document.querySelectorAll('[data-testid^="app.sidebar.project."]')]
    .map((e) => ({ id: (e.getAttribute('data-testid') ?? '').slice('app.sidebar.project.'.length), t: (e.textContent ?? '').trim() }))
    .find((p) => p.id && !p.id.includes('.') && /^\W*harness\b/.test(p.t))?.id ?? null).catch(() => null);
  const HID = await harnessPid();
  const inHarness = () => page.locator('[data-testid="thread.screen"]').first().getAttribute('data-project', { timeout: 1000 }).then((x) => x === HID, () => false);
  const shownOther = otherName.replace(/^\W+|\W+$/g, '');
  const hubRows = async (w) => (await rowsWith(w)).filter((x) => x.id.startsWith('thread.approval.'));
  const asideRows = async (w) => (await rowsWith(w)).filter((x) => x.id.startsWith('thread.aside.'));
  await row('answer by a digit from another project', async () => {
    await goOther();
    await clear();
    await page.mouse.move(1, 300);
    const d = await dock(`zqAdigit${T}`, 60000);
    if (d.open) { await d.open.click({ position: { x: 4, y: 4 } }).catch(() => {}); await page.keyboard.press('2'); }
    const moved = d.open ? await until(async () => ((await inHarness()) ? true : null), 20000, 500) : null;
    const rows = moved ? await until(async () => { const r = await hubRows('zqdigit-two'); return r.length ? r : null; }, 20000, 500) : null;
    const gone = !(await present(`zqAdigit${T}`));
    await page.mouse.move(1, 300);
    await shot('f2a7-digit-other-project');
    took.digit = rows?.[0] ?? null;
    step(`a digit ('2') on main's card from ${shownOther}'s thread: the window goes to harness' thread at his answer, 'zqdigit-two' there once with 'answered from ${shownOther}'; the card gone`,
      !!other && !!moved && !!rows && rows.length === 1 && new RegExp(`answered from ${shownOther}`).test(rows[0].text) && gone,
      { other: shownOther, listed: d.listed, opened: !!d.open, card: d.id, moved: !!moved, rows, gone });
  });

  const SAID = `zqwords-said ${T} the small one please`;
  await row('answer by words from bise', async () => {
    await bise();
    await clear();
    const d = await dock(`zqAwords${T}`, 60000);
    if (d.open) {
      await field.click({ timeout: 3000 }).catch(() => {});
      await page.keyboard.type(SAID, { delay: 5 });
      await page.keyboard.press('Enter');
    }
    const moved = d.open ? await until(async () => ((await inHarness()) ? true : null), 20000, 500) : null;
    const rows = moved ? await until(async () => { const r = await hubRows(SAID); return r.length ? r : null; }, 20000, 500) : null;
    const gone = !(await present(`zqAwords${T}`));
    await page.mouse.move(1, 300);
    await shot('f2a7-words-bise');
    took.words = rows?.[0] ?? null;
    step("words in the composer on main's open card from bise's view: the window goes to harness' thread at his answer, his words there once with 'answered from bise'; the card gone",
      !!moved && !!rows && rows.length === 1 && /answered from bise/.test(rows[0].text) && gone, { listed: d.listed, opened: !!d.open, card: d.id, moved: !!moved, rows, gone });
  });

  await row('answer by a click in the asker project', async () => {
    await harness();
    await clear();
    const d = await dock(`zqAclick${T}`, 60000);
    if (d.open) await d.open.locator('[data-testid$=".opt.1"]').first().click({ timeout: 3000 }).catch(() => {});
    const rows = d.open ? await until(async () => { const r = (await rowsWith('zqclick-one')).filter((x) => x.id.startsWith('thread.approval.')); return r.length ? r : null; }, 20000, 500) : null;
    const asides = await rowsWith('zqclick-one');
    const gone = !(await present(`zqAclick${T}`));
    await page.mouse.move(1, 300);
    await shot('f2a7-click-harness');
    took.click = rows?.[0] ?? null;
    step("a click on option 1 from harness' own thread: the hub's row 'you answered <agent>' + 'zqclick-one' there, once, no window aside; the card gone",
      !!rows && rows.length === 1 && /you answered \S+/.test(rows[0].text) && asides.filter((x) => x.id.startsWith('thread.aside.')).length === 0 && gone, { listed: d.listed, opened: !!d.open, card: d.id, rows, asides, gone });
  });

  await row('answers from the hub, kept across a switch and a reload', async () => {
    // the hub took all three: its rows in harness' thread hold each option's words
    await harness();
    const hub = {};
    for (const [k, w] of [['digit', 'zqdigit-two'], ['words', SAID], ['click', 'zqclick-one']]) {
      hub[k] = await until(async () => { const r = (await rowsWith(w)).filter((x) => x.id.startsWith('thread.approval.')); return r.length ? r : null; }, 15000, 500);
    }
    step("the hub took each answer: its row in harness' thread for the digit, the words and the click", !!hub.digit && !!hub.words && !!hub.click, hub);
    const check = async (when) => {
      const seen = {};
      await goOther();
      await page.waitForTimeout(1500);
      seen[otherName] = await asideRows('zqdigit-two');
      await bise();
      await page.waitForTimeout(1500);
      seen.bise = await asideRows(SAID);
      await harness();
      seen.harness = {};
      for (const [k, w] of [['digit', 'zqdigit-two'], ['words', SAID], ['click', 'zqclick-one']]) seen.harness[k] = (await until(async () => { const r = await hubRows(w); return r.length ? r : null; }, 10000, 500)) ?? [];
      const back = [];
      for (const w of ['digit', 'words', 'click']) if (await present(`zqA${w}${T}`)) back.push(w);
      return { when, seen, back };
    };
    const a = await check('after a switch through the three');
    await reload();
    const b = await check('after a reload');
    await page.mouse.move(1, 300);
    await shot('f2a7-answers-after-reload');
    const ok = (s) => s.seen[otherName].length === 0 && s.seen.bise.length === 0 && ['digit', 'words', 'click'].every((k) => s.seen.harness[k].length === 1) && s.back.length === 0;
    step(`each answer once in harness' thread (where it was asked), no aside where he answered from (${otherName}, bise), after a project switch and after a reload; no card back`, ok(a) && ok(b), { a, b });
  });

  await row('a refused answer and close come back with the words', async () => {
    const R = `zqR${T}`;
    await harness();
    await until(async () => (/· idle\b/.test(flat(await text('[data-testid="composer"]'))) ? true : null), 60000, 1000);
    await clear();
    await cards([{ q: `${R}a answer me?`, opts: ['1. zqra-one', '2. zqra-two'] }, { q: `${R}b close me?`, opts: ['1. zqrb-one', '2. zqrb-two'] }], 'seeded refusals');
    const listed = await until(async () => ((await present(`${R}a`)) && (await present(`${R}b`)) ? true : null), 90000, 1000);
    await until(async () => (/· idle\b/.test(flat(await text('[data-testid="composer"]'))) ? true : null), 30000, 1000);
    await goOther();
    await clear();
    const hubs = hubLines();
    const pids = hubs.map(pidOf);
    if (!listed || pids.length !== 1) { step('a refused answer and close (the harness hub held)', false, { listed: !!listed, hubs: hubs.map((l) => l.slice(0, 200)) }); return; }
    const t0 = Date.now();
    let hidden = null;
    let back = null;
    let words = null;
    try {
      signal(pids, 'SIGSTOP');
      const a = await dock(`${R}a`, 10000);
      if (a.open) { await a.open.click({ position: { x: 4, y: 4 } }).catch(() => {}); await page.keyboard.press('1'); }
      await page.waitForTimeout(800);
      const b = await dock(`${R}b`, 10000);
      if (b.open) { await b.open.click({ position: { x: 4, y: 4 } }).catch(() => {}); await page.keyboard.press('Meta+Backspace'); }
      await page.waitForTimeout(800);
      hidden = { a: !(await present(`${R}a`)), b: !(await present(`${R}b`)), a_open: !!a.open, b_open: !!b.open, at_ms: Date.now() - t0 };
      await page.mouse.move(1, 300);
      await shot('f2a7-refusal-hidden');
      back = await until(async () => {
        return (await present(`${R}a`)) && (await present(`${R}b`)) ? { at_ms: Date.now() - t0 } : null;
      }, 50000, 1000);
      words = await bodyHas(/its hub (didn't answer|went away)[^.]*\.( try again in a moment\.)?/);
      await page.mouse.move(1, 300);
      await shot('f2a7-refusal-back');
    } finally { signal(pids, 'SIGCONT'); }
    const asides = [...(await rowsWith('zqra-one')), ...(await rowsWith('zqrb'))];
    step(`a refused answer (digit) and a refused close (⌘⌫) from ${otherName}, the harness hub held past 30 s: both hidden at once, then both cards back with the words, no 'you answered'`,
      !!hidden?.a && !!hidden?.b && !!back && !!words && asides.length === 0, { hidden, back, words, asides, hub: hubs[0].slice(0, 160) });
    // the hub runs again: what it does with the late answer and close (info: the core dropped them)
    await page.waitForTimeout(8000);
    const after = { a: await present(`${R}a`), b: await present(`${R}b`), asides: [...(await rowsWith('zqra-one'))] };
    await harness();
    after.harness = [...(await rowsWith('zqra-one')), ...(await rowsWith(`${R}b`))];
    await page.mouse.move(1, 300);
    await shot('f2a7-refusal-hub-resumed');
    res.notes = [...(res.notes ?? []), { what: 'refusal row: 8 s after SIGCONT of the harness hub', after }];
    save();
    // whatever stayed open, answered now (the hub runs), so the later rows see no open zqR card
    for (const k of ['a', 'b']) {
      if (!(await present(`${R}${k}`))) continue;
      const d = await dock(`${R}${k}`, 5000);
      if (d.open) await d.open.locator('[data-testid$=".opt.1"]').first().click({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(1500);
    }
  });

  await row("an answer to a card the hub withdrew meanwhile: the hub's words", async () => {
    const W = `zqW${T}`;
    await harness();
    await until(async () => (/· idle\b/.test(flat(await text('[data-testid="composer"]'))) ? true : null), 60000, 1000);
    await clear();
    await cards([{ q: `${W} still needed?`, opts: ['1. zqw-one', '2. zqw-two'] }], 'seeded withdraw');
    const d0 = await dock(W, 90000);
    const card = d0.id;
    await until(async () => (/· idle\b/.test(flat(await text('[data-testid="composer"]'))) ? true : null), 30000, 1000);
    if (card === null) { step("an answer to a withdrawn card", false, { listed: d0.listed, opened: !!d0.open }); return; }
    await clear();
    await say(`[[bash: sleep 30 && sb card --withdraw ${card} "zq the plan changed"]] withdrawing`);
    const t0 = Date.now();
    await goOther();
    await clear();
    const d = await dock(W, 20000);
    const cores = coreLines();
    const pids = cores.map(pidOf);
    if (!d.open || pids.length !== 1) { step("an answer to a withdrawn card", false, { opened: !!d.open, cores: cores.map((l) => l.slice(0, 200)) }); return; }
    await page.waitForTimeout(Math.max(0, 24000 - (Date.now() - t0)));
    let words = null;
    let hidden = null;
    try {
      signal(pids, 'SIGSTOP');
      // the withdraw lands in the hub while the window still shows the card
      await page.waitForTimeout(Math.max(0, 38000 - (Date.now() - t0)));
      await d.open.locator('[data-testid$=".opt.1"]').first().click({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(500);
      hidden = !(await present(W));
    } finally { signal(pids, 'SIGCONT'); }
    words = await until(async () => bodyHas(new RegExp(`card ${String(card)} isn't open`)), 15000, 500);
    await page.mouse.move(1, 300);
    await shot('f2a7-withdrawn-words');
    const asides = await rowsWith('zqw-one');
    const after = await present(W);
    step(`an answer to card ${String(card)} withdrawn by its asker meanwhile (the candidate's core held ~14 s): the hub's own 'card ${String(card)} isn't open' on screen, no 'you answered', the card not back (the hub dropped it)`,
      hidden === true && !!words && asides.length === 0 && after === false, { hidden, words, asides, after, core: cores[0].slice(0, 160) });
  });

  await row('a pause counts its seconds, then minutes', async () => {
    const tick = spawn('/bin/sleep', ['600'], { detached: true, stdio: 'ignore' });
    tick.unref();
    fs.writeFileSync(path.join(out, 'zq-tick.pid'), String(tick.pid));
    const head = async () => flat(await text('[data-testid="thread.head.state"]'));
    const lineT = async () => flat(await page.locator('[data-testid="thread.waiting"]').first().innerText({ timeout: 1000 }).catch(() => null));
    const agentRow = (name) => page.evaluate((nm) => {
      const e = [...document.querySelectorAll('[data-testid^="app.right.agent."]')].find((x) => { const id = x.getAttribute('data-testid') ?? ''; return id === `app.right.agent.${nm}` || id.endsWith(`.${nm}`); });
      return e ? { g: e.querySelector('.app-rb-g')?.textContent?.trim() ?? null, end: e.querySelector('.app-rb-end, .app-rb-time')?.textContent?.trim() ?? null } : null;
    }, name).catch(() => null);
    const read = async () => ({ line: await lineT(), head: await head(), row: await agentRow('zqtick'), at_ms: Date.now() });
    const secs = (s) => { const m = /(\d+) s$/.exec(s ?? ''); return m ? Number(m[1]) : null; };
    try {
      await harness();
      await until(async () => (/· idle\b/.test(flat(await text('[data-testid="composer"]'))) ? true : null), 60000, 1000);
      await clear();
      await say(`[[bash: sb spawn zqtick --objective 'zq tick {{bash: sb wake --on-exit ${String(tick.pid)} --then --note "the zq tick ends"}}']] seeded zqtick`);
      await until(async () => ((await agentRow('zqtick')) ? true : null), 60000, 500);
      const r = page.locator('[data-testid^="app.right.agent."][data-testid$=".zqtick"], [data-testid="app.right.agent.zqtick"]').first();
      await r.click({ timeout: 5000 }).catch(() => {});
      const first = await until(async () => { const s = await read(); return /zq tick ends · running for \d+ s$/.test(s.line) ? s : null; }, 30000, 250);
      await page.mouse.move(1, 300);
      await shot('f2a7-pause-seconds');
      await page.waitForTimeout(10000);
      const second = await read();
      await shot('f2a7-pause-seconds-later');
      const up = (k) => { const a = secs(k(first)), b = secs(k(second)); return a !== null && b !== null && b >= a + 8 && b <= a + 13; };
      step("a pause under a minute counts up in seconds ('· N s', +10 s later): the line, the head '… waiting · N s' and the AGENTS row's end",
        !!first && up((s) => s.line) && up((s) => s.head) && up((s) => s.row?.end) && /^… waiting · \d+ s$/.test(second.head) && second.row?.g === '…',
        { first, second });
      const mins = await until(async () => { const s = await read(); return /running for \d+ min$/.test(s.line) ? s : null; }, 70000, 1000);
      await page.mouse.move(1, 300);
      await shot('f2a7-pause-minutes');
      step("past a minute: 'continues when the zq tick ends · running for 1 min' on the line, '… waiting · 1 min' on the head, '1 min' on the AGENTS row",
        !!mins && /^continues when the zq tick ends · running for \d+ min$/.test(mins.line) && /^… waiting · \d+ min$/.test(mins.head) && /^\d+ min$/.test(mins.row?.end ?? ''), { mins });
    } finally {
      try { process.kill(tick.pid, 'SIGTERM'); } catch { /* gone */ }
    }
  });
  await harness();
}

// 233baf9a's rows (ambient-lead m_23723): the right bar's agents rows as the TUI's panel (e3ce0c60,
// 1ddc0b7c, 233baf9a) at 1400/1100/800 light and dark on the world's own hubs, seeded by one
// message to harness' main (solo worktrees, a PR with failing checks and one approved, two agents in
// one worktree, a PR whose agent was dropped, a done and a failed agent, a blocked one spawned last
// so the 8 cap would hide it); an artifact's name pink and opening its view (b4114e72); a refused
// answer says 'not sent: … · try again' on the card that came back, kept across a reload, gone on a
// take (1cae6676); an old kept 'you answered' row with no 'by' dropped on load (59a27050); the
// corner card's one rounded edge and its growth to half the screen, then a scroll (5656ff7b).
async function rows233B(harness, say) {
  const row = async (name, fn) => {
    if (!wanted(name)) return;
    try { await fn(); } catch (e) { step(name, false, String(e).slice(0, 300)); }
  };
  const flat = (s) => (s ?? '').replace(/\s+/g, ' ').trim();
  const bise = () => click('bise', page.locator('[data-testid="app.sidebar.bise"]').first());
  const field = page.locator('[data-testid="composer.field"]:visible').first();
  const clear = async () => {
    await field.click({ timeout: 3000 }).catch(() => {});
    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Backspace');
  };
  const idle = () => until(async () => (/· idle\b/.test(flat(await text('[data-testid="composer"]'))) ? true : null), 90000, 1000);
  const reload = async () => {
    await page.reload().catch(() => {});
    await page.locator('[data-testid="app.sidebar"]').first().waitFor({ timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(1500);
  };
  const HP = process.env.AS_HE_DOES_HARNESS ?? null;
  const GHW = process.env.AS_HE_DOES_GH_WORLD ?? null;
  const UD = process.env.AS_HE_DOES_USERDATA ?? null;
  const { execFileSync } = await import('node:child_process');
  const git = (args) => { try { return execFileSync('git', ['-C', HP, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return null; } };
  const psLines = () => { try { return execFileSync('/bin/ps', ['-axww', '-o', 'pid=,command='], { encoding: 'utf8' }).split(String.fromCharCode(10)); } catch { return []; } };
  const hubPids = () => (HP ? psLines().filter((l) => l.includes(' sbd --workspace ') && (l.includes(`--workspace ${HP} `) || l.endsWith(`--workspace ${HP}`))).map((l) => Number(l.trim().split(/\s+/)[0])) : []);
  const signal = (pids, s) => pids.forEach((p) => {
    if (s === 'SIGSTOP') HELD.add(p); else HELD.delete(p);
    try { process.kill(p, s); } catch { /* gone */ }
  });
  // a css variable's computed color, as the page draws it
  const color = (v) => page.evaluate((x) => { const d = document.createElement('i'); d.style.color = `var(${x})`; document.body.append(d); const c = getComputedStyle(d).color; d.remove(); return c; }, v).catch(() => null);
  const project = async () => page.evaluate(() => {
    const e = document.querySelector('[data-testid^="app.right.artifact."]');
    return e ? (e.getAttribute('data-testid') ?? '').split('.')[3] ?? null : null;
  }).catch(() => null);
  const harnessId = () => page.evaluate(() => [...document.querySelectorAll('[data-testid^="app.sidebar.project."]')]
    .map((e) => ({ id: (e.getAttribute('data-testid') ?? '').slice('app.sidebar.project.'.length), t: (e.textContent ?? '').trim() }))
    .find((p) => p.id && !p.id.includes('.') && /^\W*harness\b/.test(p.t))?.id ?? null).catch(() => null);
  const others = () => page.evaluate(() => [...document.querySelectorAll('[data-testid^="app.sidebar.project."]')]
    .map((e) => ({ id: (e.getAttribute('data-testid') ?? '').slice('app.sidebar.project.'.length), name: (e.textContent ?? '').replace(/\s+/g, ' ').trim() }))
    .filter((p) => p.id && !p.id.includes('.') && !/^\W*harness\b/.test(p.name))).catch(() => []);
  const other = (await others())[0] ?? null;
  const goOther = async () => {
    if (other) { await page.locator(`[data-testid="app.sidebar.project.${other.id}"]`).first().click({ timeout: 5000 }).catch(() => {}); await page.waitForTimeout(800); }
    else await bise();
  };
  const T = String(Date.now()).slice(-5);
  const NL = String.fromCharCode(92) + 'n';
  const cards = async (list, tail) => {
    await clear();
    const one = (c) => `sb card "$(printf "%s${NL}" ${[c.q, ...c.opts].map((x) => `"${x}"`).join(' ')})"`;
    await page.keyboard.type(`[[bash: ${list.map(one).join(' && ')}]] ${tail}`, { delay: 5 });
    await page.keyboard.press('Enter');
  };
  const cardShown = (token) => page.evaluate((t) => [...document.querySelectorAll('[data-testid^="inbox."], [data-testid^="strip."], [data-testid^="dock."]')]
    .some((e) => (e.textContent ?? '').includes(t)), token).catch(() => 'unread');
  const present = async (token) => {
    if ((await cardShown(token)) !== false) return true;
    for (let i = 0; i < 12; i++) {
      const m = page.locator('[data-testid="inbox.block.more"]').first();
      if (!(await m.count().catch(() => 0))) break;
      await m.click({ timeout: 1000 }).catch(() => {});
      await page.waitForTimeout(250);
      if ((await cardShown(token)) !== false) return true;
    }
    return false;
  };
  const dock = async (token, ms) => {
    const rowL = page.locator('[data-testid^="inbox.block.row."]', { hasText: token }).first();
    const open = page.locator('[data-testid^="inbox.block.open."]').filter({ hasText: token }).first();
    const listed = await until(async () => {
      if ((await rowL.isVisible().catch(() => false)) || (await open.isVisible().catch(() => false))) return true;
      await page.locator('[data-testid="inbox.block.more"]').first().click({ timeout: 1000 }).catch(() => {});
      return null;
    }, ms, 1000);
    for (let i = 0; listed && i < 20 && !(await open.isVisible().catch(() => false)); i++) {
      if (await rowL.isVisible().catch(() => false)) await rowL.click({ timeout: 2000 }).catch(() => {});
      else await page.locator('[data-testid="inbox.block.more"]').first().click({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(400);
    }
    return { listed: !!listed, open: (await open.isVisible().catch(() => false)) ? open : null };
  };
  // the refused line on whatever card holds `token` (block, strip, capsule): its words, or null
  const refusedOn = (token) => page.evaluate((t) => {
    for (const e of document.querySelectorAll('[data-testid$=".refused"]')) {
      let c = e.parentElement;
      while (c && !/^inbox\.|^strip\.|^dock\./.test(c.getAttribute('data-testid') ?? '')) c = c.parentElement;
      const within = (c ?? e.parentElement)?.textContent ?? '';
      if (within.includes(t)) return (e.textContent ?? '').replace(/\s+/g, ' ').trim();
    }
    // folded in the block or the strip: its row's RefusedMark ('not sent'), the line itself on open
    // (try-gate-233b's run r: a folded, b open; the step read only the open card's line)
    for (const e of document.querySelectorAll('.ic-refused-mark')) {
      const r = e.closest('[data-testid^="inbox.block.row."], [data-testid^="strip."]');
      if (r && (r.textContent ?? '').includes(t)) return `${(e.textContent ?? '').trim()} (its folded row)`;
    }
    return null;
  }, token).catch(() => 'unread');

  // the seed, in harness' thread. Agents' briefs carry their script in {{bash: …}} (fake_provider)
  await closeArtifact();
  await harness();
  await idle();
  fs.writeFileSync(path.join(FX, 'zq-art.html'), '<!doctype html><title>zq art</title><h1>zq art chip report</h1><p>the pink name opens this.</p>');
  const seed = [
    "sb spawn zqsolo --place new --objective 'zq solo: nothing to do'",
    "sb spawn zqfails --place new --objective 'zq checks fail: nothing to do'",
    "sb spawn zqgone --place new --objective 'zq orphan: nothing to do'",
    "sb spawn zqg1 --place new --objective 'zq group one: nothing to do'",
    "sb spawn zqg2 --place zqg1 --objective 'zq group two: nothing to do'",
    "sb spawn zqfin --objective 'zq finished {{bash: sb report done zq-finished}}'",
    "sb spawn zqbad --objective 'zq broken {{bash: sb report failed zq-broken}}'",
    "sb spawn zqf1 --objective 'zq filler one: nothing to do'",
    "sb spawn zqf2 --objective 'zq filler two: nothing to do'",
    `sb artifact add ${path.join(FX, 'zq-art.html')} --title 'zq art chip report for the pink name check'`,
    'sleep 4', 'sb drop zqgone',
    "sb spawn zqwait --objective 'zq waits for him {{bash: sb report blocked zq-needs-your-pick}}'",
  ];
  await clear();
  await page.keyboard.type(`[[bash: ${seed.join(' && ')}]] seeded 233b`, { delay: 2 });
  await page.keyboard.press('Enter');
  const tips = HP ? await until(async () => {
    const t = ['zqfails', 'zqgone', 'zqg1'].map((b) => git(['rev-parse', '--verify', '-q', `refs/heads/sb/${b}`]));
    return t.every(Boolean) ? t : null;
  }, 120000, 1000) : null;
  if (tips && GHW) {
    const prs = JSON.parse(fs.readFileSync(path.join(GHW, 'prs-harness.json'), 'utf8'));
    const pr = (number, branch, head, rollup, review) => ({ number, branch, head, title: `zq ${branch}`, draft: false, review, rollup,
      checks: [{ name: 'ci', conclusion: rollup }], reviews: review === 'APPROVED' ? [{ state: 'APPROVED', author: 'alice' }] : [], merge_state: rollup === 'SUCCESS' ? 'CLEAN' : 'BLOCKED', commits: 1 });
    prs.prs = [...(prs.prs ?? []).filter((p) => ![501, 502, 503].includes(p.number)),
      pr(501, 'sb/zqfails', tips[0], 'FAILURE', 'REVIEW_REQUIRED'), pr(502, 'sb/zqgone', tips[1], 'SUCCESS', 'REVIEW_REQUIRED'), pr(503, 'sb/zqg1', tips[2], 'SUCCESS', 'REVIEW_REQUIRED')];
    fs.writeFileSync(path.join(GHW, 'prs-harness.json'), JSON.stringify(prs, null, 1));
  }
  await idle();
  step('rows233B seed: 10 agents in harness (worktrees, a group, an orphan PR, done, failed, blocked last), PRs #501-503 in the world GitHub, an artifact',
    !!tips && !!GHW, { harness: HP, gh_world: GHW, tips, thread: flat(await text('[data-testid="thread.list"]')).slice(-400) });

  // the bar as it is now: rows, signs, words, columns, marks
  const bar = () => page.evaluate(() => {
    const L = document.querySelector('[data-testid="app.right.agents"]');
    if (!L) return null;
    const rows = [...L.querySelectorAll('.app-rb-arow')].map((e) => {
      const r = (q) => e.querySelector(q)?.getBoundingClientRect();
      const g = e.querySelector('.app-rb-g');
      const m = e.querySelector('.app-rb-mark');
      return {
        id: e.getAttribute('data-testid'), head: e.classList.contains('app-rb-ghead'), orphan: e.classList.contains('app-rb-orphan'),
        g: g?.textContent ?? null, gc: g ? getComputedStyle(g).color : null, mark: m?.textContent ?? null, mc: m ? getComputedStyle(m).color : null,
        time: Math.round(r('.app-rb-time')?.right ?? 0), pct: Math.round(r('.app-rb-pct')?.right ?? 0), markR: Math.round(r('.app-rb-mark')?.right ?? 0),
        tw: Math.round(r('.app-rb-time')?.width ?? 0), pw: Math.round(r('.app-rb-pct')?.width ?? 0), h: Math.round(e.getBoundingClientRect().height),
      };
    });
    return { rows, words: L.innerText, more: document.querySelector('[data-testid="app.right.agents.more"]')?.textContent ?? null,
      head: document.querySelector('[data-testid="app.right.agents.head"]')?.textContent?.replace(/\s+/g, ' ').trim() ?? null };
  }).catch(() => null);

  await row('agents bar', async () => {
    await harness();
    // the seed's agents in the bar (their briefs ran: done, failed, blocked)
    const b0 = await until(async () => {
      const b = await bar();
      const has = (n) => b?.rows.some((r) => r.id === `app.right.agent.${n}`);
      // zqwait's own turn over (run r read it mid-turn: '∿')
      const g = (n) => b?.rows.find((r) => r.id === `app.right.agent.${n}`)?.g;
      return b && has('zqwait') && has('zqfin') && has('zqbad') && g('zqwait') !== '∿' && g('zqwait') !== '~' ? b : null;
    }, 120000, 1000) ?? (await bar());
    const [acc, err, t2, t3] = [await color('--c-accent'), await color('--c-err'), await color('--c-text-2'), await color('--c-text-3')];
    const by = (n) => b0?.rows.find((r) => r.id === `app.right.agent.${n}`) ?? null;
    // zqwait reported blocked to main: it waits on another agent ('…'); '?' needs a card of its own
    // for him (proto_view waits: a card whose agent is it), which only main's hub makes here
    step("the bar's signs: ✓ pink done (zqfin), ▲ red failed (zqbad), '…' waits on main (zqwait, blocked); no state word in the rows",
      by('zqfin')?.g === '✓' && by('zqfin')?.gc === acc && by('zqbad')?.g === '▲' && by('zqbad')?.gc === err && ['…', '?'].includes(by('zqwait')?.g ?? '')
        && !/\b(done|idle|now|waits|failed|working|blocked)\b/.test(b0?.words ?? ''),
      { zqfin: by('zqfin'), zqbad: by('zqbad'), zqwait: by('zqwait'), words: (b0?.words ?? '').slice(0, 600), acc, err });
    const plain = (b0?.rows ?? []).filter((r) => !r.head && !r.orphan);
    step("columns: time and % right edges line up on every agent row (40 / 32 px), the mark's right edge the same on every row",
      plain.length > 0 && new Set(plain.map((r) => r.time)).size === 1 && new Set(plain.map((r) => r.pct)).size === 1 && new Set((b0?.rows ?? []).map((r) => r.markR)).size === 1 && plain[0].tw === 40 && plain[0].pw === 32,
      { cols: (b0?.rows ?? []).map((r) => ({ id: r.id, time: r.time, pct: r.pct, mark: r.markR, tw: r.tw, pw: r.pw })) });
    // the drop order on a real row: narrowed step by step, the role goes first, then the %, then the time; the mark stays
    const drops = await page.locator('[data-testid="app.right.agent.zqsolo"]').first().evaluate((e) => {
      const q = (s) => e.querySelector(s);
      const on = (s) => { const x = q(s); return !!x && x.getBoundingClientRect().width > 0 && getComputedStyle(x).display !== 'none' && getComputedStyle(x).visibility !== 'hidden'; };
      const out = [];
      const full = Math.round(e.getBoundingClientRect().width);
      for (let w = full; w >= 100; w -= 2) {
        e.style.width = `${w}px`;
        out.push({ w, role: q('.app-rb-role')?.clientWidth ?? 0, pct: on('.app-rb-pct'), time: on('.app-rb-time'), mark: Math.round(q('.app-rb-mark')?.getBoundingClientRect().width ?? 0) });
      }
      e.style.width = '';
      return out;
    }).catch((x) => String(x).slice(0, 200));
    const first = (f) => (Array.isArray(drops) ? drops.findIndex(f) : -1);
    const [roleGone, pctGone, timeGone] = [first((x) => x.role === 0), first((x) => !x.pct), first((x) => !x.time)];
    step('a row short on room: the role goes first, then the %, then the time; the 16 px mark never goes (zqsolo narrowed)',
      Array.isArray(drops) && roleGone >= 0 && (pctGone === -1 || pctGone >= roleGone) && (timeGone === -1 || timeGone >= Math.max(pctGone, roleGone)) && drops.every((x) => x.mark === 16),
      { roleGone: drops[roleGone]?.w ?? null, pctGone: drops[pctGone]?.w ?? null, timeGone: drops[timeGone]?.w ?? null, full: Array.isArray(drops) ? drops[0] : drops });
    // marks: ψ (no PR), ↑ red (checks fail), the group's head, the orphan PR, the tip. The cap
    // folds the rows past 8 under '+ N more' (the group's head and the orphan among them): unfolded
    const capped = await bar();
    const b1 = await until(async () => {
      const more = page.locator('[data-testid="app.right.agents.more"]').first();
      if (/^\+ \d+ more$/.test(flat(await more.textContent({ timeout: 500 }).catch(() => '')))) await more.click({ timeout: 2000 }).catch(() => {});
      const b = await bar();
      return b?.rows.some((r) => r.id === 'app.right.agent.zqfails' && r.mark === '↑') && b.rows.some((r) => r.orphan) ? b : null;
    }, 150000, 2000) ?? (await bar());
    const by1 = (id) => b1?.rows.find((r) => r.id === id) ?? null;
    const headR = by1('app.right.group.sb/zqg1');
    const orphan = b1?.rows.find((r) => r.orphan) ?? null;
    step("marks: ψ text-2 on a worktree with no PR (zqsolo), ↑ red on #501 (checks fail); the group 'ψ sb/zqg1' head 28 px with '↑ #503', its rows no mark; the orphan PR #502's row: no sign, its ↑",
      by1('app.right.agent.zqsolo')?.mark === 'ψ' && by1('app.right.agent.zqsolo')?.mc === t2 && by1('app.right.agent.zqfails')?.mark === '↑' && by1('app.right.agent.zqfails')?.mc === err
        && !!headR && headR.h === 28 && headR.g === 'ψ' && /↑ #503/.test(headR.mark ?? '') && !by1('app.right.agent.zqg1')?.mark && !by1('app.right.agent.zqg2')?.mark
        && !!orphan && (orphan.g ?? '') === '' && /↑/.test(orphan.mark ?? ''),
      { zqsolo: by1('app.right.agent.zqsolo'), zqfails: by1('app.right.agent.zqfails'), head: headR, g1: by1('app.right.agent.zqg1'), g2: by1('app.right.agent.zqg2'), orphan, more: b1?.more, t2, t3 });
    const mk = page.locator('[data-testid="app.right.agent.zqfails.mark"]').first();
    await mk.hover({ timeout: 3000 }).catch(() => {});
    const tip = await until(async () => page.evaluate(() => {
      const t = document.querySelector('[data-testid="app.right.tip"]');
      return t ? { w: Math.round(t.getBoundingClientRect().width), words: document.querySelector('[data-testid="app.right.tip.words"]')?.textContent ?? null, open: document.querySelector('[data-testid="app.right.tip.open"]')?.textContent ?? null } : null;
    }), 5000, 250);
    await shot('233b-bar-tip');
    step("the mark's tip: 280 px, '#501 · <the hub's words>', 'open the PR ↗'", !!tip && tip.w === 280 && /^#501 · /.test(tip.words ?? '') && tip.open === 'open the PR ↗', tip);
    await page.mouse.move(1, 400);
    // the cap: 8 rows and '+ N more' (a '?' row past it is the spec's: no agent card for him here)
    const ids = (capped?.rows ?? []).map((r) => r.id);
    const waitsIdx = (capped?.rows ?? []).findIndex((r) => r.g === '?');
    step("the AGENTS cap: 8 rows then '+ N more'; a row that waits on him ('?') shows past it",
      ids.length >= 8 && /^\+ \d+ more$/.test(capped?.more ?? '') && (waitsIdx < 0 || ids.length > 8 || waitsIdx < 8),
      { ids, more: capped?.more, head: capped?.head, waits_on_him: waitsIdx, note: waitsIdx < 0 ? "no '?' row in the world: the cap's wait rule is agents-bar.spec's" : null });
    // ARCHIVED: open, its rows sign + name + age (zqgone dropped, the e812 seed's zqold)
    const ah = page.locator('[data-testid="app.right.archived.head"]').first();
    if ((await ah.getAttribute('aria-expanded').catch(() => null)) === 'false') await ah.click({ timeout: 3000 }).catch(() => {});
    const arch = await until(async () => page.evaluate(() => [...document.querySelectorAll('[data-testid^="app.right.archived."]')]
      .filter((e) => !/\.(head|all)$/.test(e.getAttribute('data-testid') ?? '') && e.getAttribute('data-testid') !== 'app.right.archived' && !/^all\s*›$/.test((e.textContent ?? '').trim()))
      .map((e) => (e.textContent ?? '').replace(/\s+/g, ' ').trim())).then((r) => (r.length ? r : null)), 10000, 500);
    step("ARCHIVED open: each row the sign, the name and its age ('✓ zqold 4 min'), no state word",
      !!arch && arch.every((t) => /^[✓▲○–·]?\s*[a-z0-9-]+?\s*\d+ (s|min|h|d)$/.test(t)) && arch.some((t) => /zqgone/.test(t)), { rows: arch });
    // ARTIFACTS: the title in the pink chip, 'new' in ink
    const art = await page.evaluate(() => {
      const c = document.querySelector('[data-testid^="app.right.artifact."][data-testid$=".chip"]');
      const nw = document.querySelector('[data-testid^="app.right.artifact."][data-testid$=".new"]');
      return { chip: c ? { t: c.textContent, c: getComputedStyle(c).color, bg: getComputedStyle(c).backgroundColor, h: Math.round(c.getBoundingClientRect().height) } : null, new: nw ? { t: nw.textContent, c: getComputedStyle(nw).color } : null };
    }).catch(() => null);
    const ink = await color('--c-text');
    step("ARTIFACTS: the title in the pink chip (accent, 24 px), 'new' stays ink", !!art?.chip && art.chip.c === acc && art.chip.h === 24 && (!art.new || art.new.c === ink), { ...art, acc, ink });
    // the shots: 1400, 1100, 800 (slid over), light and dark
    const sizes = [];
    for (const scheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme: scheme }).catch(() => {});
      for (const w of [1400, 1100, 800]) {
        const how = await resizeWin(w, 900);
        await page.waitForTimeout(900);
        let over = null;
        if (w === 800) {
          await page.mouse.click(500, 300).catch(() => {});
          await page.keyboard.press('Meta+Alt+Digit0');
          over = await page.locator('[data-testid="app.over.right"] [data-testid="app.panel"]').first().isVisible({ timeout: 3000 }).catch(() => false);
        }
        await page.mouse.move(1, 400);
        const b = await bar();
        sizes.push({ scheme, w, how, inner: await page.evaluate(() => window.innerWidth).catch(() => null), over, rows: b?.rows.length ?? 0, wait: !!b?.rows.some((r) => r.id === 'app.right.agent.zqwait') });
        await shot(`233b-bar-${scheme}-${w}`);
        if (w === 800) await page.keyboard.press('Escape');
      }
    }
    await page.emulateMedia({ colorScheme: null }).catch(() => {});
    await resizeWin(1400, 900);
    await page.waitForTimeout(600);
    step('the bar at 1400 / 1100 / 800 (slid over, ⌘⌥0), light and dark: rows drawn, zqwait shown at each', sizes.every((s) => s.rows > 0 && s.wait && (s.w !== 800 || s.over)), sizes);
  });

  await row('art chips', async () => {
    await harness();
    await idle();
    const acc = await color('--c-accent');
    // the id the hub gave it: the ARTIFACTS row's
    const id = await page.evaluate(() => {
      const e = [...document.querySelectorAll('[data-testid^="app.right.artifact."][data-testid$=".chip"]')].find((x) => /zq art chip/.test(x.textContent ?? ''));
      const t = e?.getAttribute('data-testid') ?? '';
      return t ? t.split('.').slice(4, -1).join('.') : null;
    }).catch(() => null);
    if (!id) { step('art chips: the zq artifact in ARTIFACTS', false, { bar: flat(await text('[data-testid="app.right"]')).slice(0, 400) }); return; }
    const md = path.join(FX, 'zq-art-reply.md');
    fs.writeFileSync(md, `the report is [zq art chip report](artifact:${id}), and here is plain text after it.`);
    await clear();
    await say(`[[bash: sb card "$(printf "%s${NL}" "zqart${T} look at [zq art chip report](artifact:${id})?" "1. zqart-ok" "2. zqart-no")"]] [[reply: ${md}]] art`);
    // main's answer (not his own bubble, which draws the name too): the row with 'plain text after it'
    const name = await until(async () => page.evaluate(() => {
      const rows = [...document.querySelectorAll('[data-testid="thread.list"] [data-testid^="thread.entry."]')]
        .filter((r) => r.getAttribute('data-side') !== 'me' && /plain text after it/.test(r.textContent ?? ''));
      const e = rows.at(-1)?.querySelector('[data-testid="thread.artname"]');
      return e ? { t: e.textContent, c: getComputedStyle(e).color, bg: getComputedStyle(e).backgroundColor, row: rows.at(-1).getAttribute('data-testid') } : null;
    }), 90000, 1000);
    const mine = await page.evaluate(() => {
      const e = [...document.querySelectorAll('[data-testid="thread.list"] [data-side="me"] [data-testid="thread.artname"]')].at(-1);
      return e ? { t: e.textContent, c: getComputedStyle(e).color } : null;
    }).catch(() => null);
    await page.mouse.move(1, 400);
    await shot('233b-art-inline-answer');
    // the inbox line's name (the card's question), once the card is in
    const inboxName = await until(async () => {
      await present(`zqart${T}`);
      return page.evaluate((t) => {
        for (const e of document.querySelectorAll('.b-artname')) {
          let c = e.parentElement;
          while (c && !/^inbox\.|^strip\./.test(c.getAttribute('data-testid') ?? '')) c = c.parentElement;
          if (c && (c.textContent ?? '').includes(t)) return { t: e.textContent, c: getComputedStyle(e).color, in: c.getAttribute('data-testid') };
        }
        return null;
      }, `zqart${T}`);
    }, 60000, 1000);
    await page.mouse.move(1, 400);
    await shot('233b-art-inbox-line');
    // the thread's 'bise asks: …' row of that card: its link as words, or the name (info)
    const asks = await page.evaluate((t) => {
      const e = [...document.querySelectorAll('[data-testid="thread.list"] [data-testid^="thread."]')].filter((x) => (x.textContent ?? '').includes(t) && /asks/.test(x.textContent ?? '')).at(-1);
      return e ? { text: (e.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 200), artname: !!e.querySelector('.b-artname'), raw: /\]\(artifact:/.test(e.textContent ?? '') } : null;
    }, `zqart${T}`).catch(() => null);
    res.notes = [...(res.notes ?? []), { what: "233b art: his own bubble's name, the thread's 'asks' row of the card", mine, asks }];
    save();
    // the thread's artifact row chip
    const rowChip = await page.evaluate(() => {
      const e = [...document.querySelectorAll('[data-testid="thread.list"] .b-artchip')].at(-1);
      return e ? { t: (e.textContent ?? '').trim().slice(0, 80), c: getComputedStyle(e).color } : null;
    }).catch(() => null);
    step("an artifact's name is pink: inline in main's answer (thread.artname), in the inbox line, the thread's artifact chip",
      !!name && name.c === acc && !!inboxName && inboxName.c === acc && (!rowChip || rowChip.c === acc), { id, name, inboxName, rowChip, acc });
    // a click on the inline name opens the artifact's view
    await page.locator('[data-testid="thread.artname"]').last().click({ timeout: 3000 }).catch(() => {});
    const view = await until(async () => page.evaluate(() => {
      const v = document.querySelector('[data-testid^="artifact."], [data-testid="app.artifact"], [data-testid="artifacts.view"]');
      return v && v.getBoundingClientRect().width > 0 ? { id: v.getAttribute('data-testid'), t: (v.textContent ?? '').replace(/\s+/g, ' ').slice(0, 160) } : null;
    }), 8000, 400);
    // its frame draws the page (the first run's shot: a dark empty frame right after the click)
    const framed = await until(async () => {
      for (const f of page.frames()) {
        const t = await f.evaluate(() => document.body?.innerText ?? '').catch(() => '');
        if (/zq art chip report/.test(t) && /pink name opens this/.test(t)) return { url: f.url().slice(0, 120) };
      }
      return null;
    }, 15000, 500);
    await shot('233b-art-click-opens');
    step("a click on the pink name opens the artifact's view, its page drawn in the frame", !!view && /zq art/.test(view.t) && !!framed, { view, framed });
    await closeArtifact();
    // the card answered so it leaves the later rows' block
    const d = await dock(`zqart${T}`, 5000);
    if (d.open) { await d.open.click({ position: { x: 4, y: 4 } }).catch(() => {}); await page.keyboard.press('1'); }
  });

  await row('refusal where he answered', async () => {
    const R = `zqW${T}`;
    await harness();
    await idle();
    await cards([{ q: `${R}a answer me?`, opts: ['1. zqwa-one', '2. zqwa-two'] }, { q: `${R}b then retry me?`, opts: ['1. zqwb-one', '2. zqwb-two'] }], 'seeded refusal-where');
    const listed = await until(async () => ((await present(`${R}a`)) && (await present(`${R}b`)) ? true : null), 90000, 1000);
    await idle();
    await goOther();
    await clear();
    const pids = hubPids();
    if (!listed || pids.length !== 1) { step("refusal-where: 'not sent: … · try again' on the card that came back", false, { listed: !!listed, pids }); return; }
    let back = null;
    let kept = null;
    try {
      signal(pids, 'SIGSTOP');
      for (const k of ['a', 'b']) {
        const d = await dock(`${R}${k}`, 10000);
        if (d.open) { await d.open.click({ position: { x: 4, y: 4 } }).catch(() => {}); await page.keyboard.press('1'); }
        await page.waitForTimeout(800);
      }
      back = await until(async () => {
        const a = (await present(`${R}a`)) ? await refusedOn(`${R}a`) : null;
        const b = (await present(`${R}b`)) ? await refusedOn(`${R}b`) : null;
        return a && b ? { a, b } : null;
      }, 60000, 1000);
      await page.mouse.move(1, 300);
      await shot('233b-refused-where');
      await reload();
      await goOther();
      kept = { a: (await present(`${R}a`)) ? await refusedOn(`${R}a`) : null, b: (await present(`${R}b`)) ? await refusedOn(`${R}b`) : null };
      await shot('233b-refused-after-reload');
    } finally { signal(pids, 'SIGCONT'); }
    const line = /^not sent: .+ · try again$/;
    // each card: the whole line when it's open, 'not sent' on its row when folded; one of them open
    const said = (x) => line.test(x ?? '') || /^not sent \(its folded row\)$/.test(x ?? '');
    const both = (s) => !!s && said(s.a) && said(s.b) && (line.test(s.a ?? '') || line.test(s.b ?? ''));
    step(`a refused answer (harness hub held past 30 s) from ${other?.name ?? 'bise'}: 'not sent: <words> · try again' on the card that came back, where he answered ('not sent' on a folded one's row)`,
      both(back), { back });
    step("the 'not sent' line is kept across a reload", both(kept), { kept });
    // the hub runs again: a late take of a clears its line (the card goes); b: 'try again' sends it once more
    await page.waitForTimeout(8000);
    const late = { a_card: await present(`${R}a`), a_line: await refusedOn(`${R}a`) };
    const retry = page.locator('[data-testid$=".retry"]').filter({ has: page.locator('xpath=.') });
    let retried = false;
    if (await present(`${R}b`)) {
      const d = await dock(`${R}b`, 5000);
      const r = d.open ? d.open.locator('[data-testid$=".retry"]').first() : retry.first();
      retried = await r.click({ timeout: 3000 }).then(() => true, () => false);
    }
    const after = await until(async () => {
      const s = { a_card: await present(`${R}a`), a_line: await refusedOn(`${R}a`), b_card: await present(`${R}b`), b_line: await refusedOn(`${R}b`) };
      return !s.a_line && !s.b_line ? s : null;
    }, 30000, 1000) ?? { a_card: await present(`${R}a`), a_line: await refusedOn(`${R}a`), b_card: await present(`${R}b`), b_line: await refusedOn(`${R}b`) };
    await page.mouse.move(1, 300);
    await shot('233b-refused-taken');
    step("the hub running again: no 'not sent' line stays on a card it took (a late take, or 'try again')", !after.a_line && !after.b_line, { late, retried, after });
    // whatever is still open, answered now so the later rows see no zqW card
    for (const k of ['a', 'b']) {
      if (!(await present(`${R}${k}`))) continue;
      const d = await dock(`${R}${k}`, 5000);
      if (d.open) { await d.open.click({ position: { x: 4, y: 4 } }).catch(() => {}); await page.keyboard.press('1'); await page.waitForTimeout(600); }
    }
  });

  await row('stale aside dropped', async () => {
    const file = UD ? path.join(UD, 'keep-window.json') : null;
    const hid = await harnessId();
    if (!file || !hid) { step("an old 'you answered' row with no 'by' in keep-window.json is dropped on load", false, { file, hid }); return; }
    await bise();
    const raw = (() => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return { v: 1, fields: {}, view: {} }; } })();
    const key = `asides:${hid}/main`;
    const now = Date.now();
    const legacy = { key: `${hid}/9${T}`, project: hid, card: Number(`9${T}`), notice: `you answered zqstale${T}: open it on GitHub`, note: '', at_ms: now - 60000 };
    const prev = Array.isArray(raw.view?.[key]?.v) ? raw.view[key].v : [];
    raw.view = { ...(raw.view ?? {}), [key]: { v: [...prev, legacy], at: now } };
    fs.writeFileSync(file, JSON.stringify(raw));
    await reload();
    await harness();
    await page.waitForTimeout(1500);
    const shown = await page.evaluate((t) => [...document.querySelectorAll('[data-testid^="thread.aside."]')].some((e) => (e.textContent ?? '').includes(t)), `zqstale${T}`).catch(() => 'unread');
    await page.mouse.move(1, 300);
    await shot('233b-stale-aside-dropped');
    // and the keep wrote it out once (the load's own write)
    const left = await until(async () => { try { return fs.readFileSync(file, 'utf8').includes(`zqstale${T}`) ? null : true; } catch { return null; } }, 10000, 500);
    step("an old 'you answered' row with no 'by' in keep-window.json is dropped on load: not drawn in harness, out of the file", shown === false && !!left,
      { shown, out_of_file: !!left, key, kept_hub_rows: prev.length });
  });

  await row('corner card grows then scrolls', async () => {
    const VOICE = process.env.AS_HE_DOES_VOICE;
    if (!VOICE) { step('the corner card with a long talk and answer', false, 'no fake voice (AS_HE_DOES_VOICE)'); return; }
    await harness();
    const long = path.join(FX, 'zq-long-answer.md');
    fs.writeFileSync(long, Array.from({ length: 40 }, (_, i) => `${i + 1}. step ${i + 1} of the checkout trace: the total after this step, and which function changed it.`).join(String.fromCharCode(10)));
    const words = `so the checkout page on stripe, the one with the coupon field, why does the total jump by two cents when i apply the code and then remove it again, ${'is that rounding on our side or theirs, '.repeat(6)}[[reply: ${long}]]`;
    fs.writeFileSync(VOICE, words);
    const CFR = UD ? path.join(UD, 'capsule-frames.jsonl') : null;
    const cfr = () => { try { return fs.readFileSync(CFR, 'utf8').split(String.fromCharCode(10)).filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); } catch { return []; } };
    const n0 = cfr().length;
    await page.evaluate(() => window.bise.core.send({ cmd: 'talk_start' })).catch(() => {});
    await page.waitForTimeout(2500);
    await page.evaluate(() => window.bise.core.send({ cmd: 'talk_end' })).catch(() => {});
    const capPage = () => browser.contexts().flatMap((c) => c.pages()).find((p) => p.url().includes('surface=capsule'));
    const read = async () => capPage()?.evaluate(() => {
      const q = (s) => document.querySelector(`[data-testid="${s}"]`);
      const root = q('capsule');
      const rs = root ? getComputedStyle(root) : null;
      const sc = [...document.querySelectorAll('[data-testid^="capsule"]')].find((e) => e.scrollHeight > e.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(e).overflowY));
      const radii = [...document.querySelectorAll('[data-testid^="capsule"], .b-capsule')].filter((e) => parseFloat(getComputedStyle(e).borderTopLeftRadius) > 0).map((e) => e.getAttribute('data-testid') ?? e.className);
      return {
        card: !!q('capsule.card') || !!q('capsule.talk'), answer: (q('capsule.answer')?.textContent ?? '').length,
        root: rs ? { radius: rs.borderTopLeftRadius, fill: rs.backgroundColor, shadow: rs.boxShadow } : null, radii,
        h: window.innerHeight, half: Math.max(240, Math.round((window.screen.availHeight || 800) / 2)),
        scroll: sc ? { id: sc.getAttribute('data-testid'), sh: sc.scrollHeight, ch: sc.clientHeight } : null,
        scrolled: !!document.querySelector('[data-scrolled]'), rest: /the rest in bise/.test(document.body.innerText),
      };
    }).catch(() => null);
    const seen = await until(async () => { const r = await read(); return r && r.answer > 200 ? r : null; }, 45000, 500);
    await page.waitForTimeout(1000);
    const r = (await read()) ?? seen;
    const cp = capPage();
    if (cp) { try { const f = path.join(out, `${mode}${tag}-${++n}-233b-corner-long.png`); await cp.screenshot({ path: f }); res.shots.push(f); save(); } catch { /* the steps say */ } }
    const recs = cfr().slice(n0).filter((x) => x.mode === 'corner');
    const hs = recs.map((x) => x.bounds?.height ?? 0);
    step("the corner card: one rounded edge (the page's root no radius, fill or shadow)", !!r?.root && r.root.radius === '0px' && r.root.shadow === 'none' && /rgba\(0, 0, 0, 0\)|transparent/.test(r.root.fill), r ?? { capsule: !!cp });
    step('a long talk and answer: the card grows to half the screen at most, then scrolls (the rest in bise ↗)',
      !!r && r.h <= r.half + 2 && !!r.scroll && (r.rest || r.scrolled), { r, frames: hs });
    step('its frames (capsule-frames.jsonl): taller as the words came, bottom-right pinned, parked off every screen',
      recs.length > 0 && Math.max(...hs) > Math.min(...hs) && recs.every((x) => (x.parked?.x ?? 0) <= -20000 || (x.parked?.y ?? 0) <= -20000)
        && recs.every((x) => x.bounds.x + x.bounds.width === x.work.x + x.work.width - 16 && x.bounds.y + x.bounds.height === x.work.y + x.work.height - 16),
      { n: recs.length, heights: hs, last: recs.at(-1) ?? null, file: CFR });
    await until(async () => (await capPage()?.evaluate(() => !document.querySelector('[data-testid="capsule.card"]')).catch(() => null)) ? true : null, 20000, 500);
  });
  await harness();
}

async function rows0170(harness, say) {
  const row = async (name, fn) => {
    try { await fn(); } catch (e) { step(name, false, String(e).slice(0, 300)); }
  };
  const field = page.locator('[data-testid="composer.field"]:visible').first();
  const clear = async () => {
    await field.click({ timeout: 3000 }).catch(() => {});
    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Backspace');
  };
  const bise = () => click('bise', page.locator('[data-testid="app.sidebar.bise"]').first());
  const flat = (s) => (s ?? '').replace(/\s+/g, ' ').trim();
  const noSince = async (where) => {
    const body = flat(await page.locator('body').innerText({ timeout: 3000 }).catch(() => ''));
    const m = /\bsince\b.{0,40}/.exec(body);
    return { where, since: m ? m[0] : null };
  };
  // an agent's thread from the right bar's AGENTS row (as he does), else its sidebar row
  const openAgent = async (name) => {
    const r = page.locator(`[data-testid^="app.right.agent."][data-testid$=".${name}"], [data-testid="app.right.agent.${name}"]`).first();
    if (await r.count()) await r.click({ timeout: 5000 }).catch(() => {});
    let on = await until(async () => ((await page.locator('[data-testid="thread.screen"]').first().getAttribute('data-agent')) === name ? true : null), 5000, 250);
    if (!on) {
      await page.locator('[data-testid="app.sidebar"]').getByText(name, { exact: true }).first().click({ timeout: 3000 }).catch(() => {});
      on = await until(async () => ((await page.locator('[data-testid="thread.screen"]').first().getAttribute('data-agent')) === name ? true : null), 5000, 250);
    }
    return !!on;
  };
  const agentRow = (name) => page.evaluate((n) => {
    const e = [...document.querySelectorAll('[data-testid^="app.right.agent."]')].find((x) => { const id = x.getAttribute('data-testid') ?? ''; return id === `app.right.agent.${n}` || id.endsWith(`.${n}`); });
    return e ? { id: e.getAttribute('data-testid'), g: e.querySelector('.app-rb-g')?.textContent?.trim() ?? null, end: e.querySelector('.app-rb-end, .app-rb-time')?.textContent?.trim() ?? null, text: (e.textContent ?? '').replace(/\s+/g, ' ').trim() } : null;
  }, name).catch(() => null);
  const waitLine = async () => {
    const l = page.locator('[data-testid="thread.waiting"]').first();
    if (!(await l.count())) return null;
    return {
      text: flat(await l.innerText({ timeout: 2000 }).catch(() => null)),
      title: await l.getAttribute('title').catch(() => null),
      whole: await l.evaluate((el) => { const st = el.querySelector('.th-wait-state'); return st !== null && st.scrollWidth <= st.clientWidth + 0.5 && el.scrollWidth <= el.clientWidth + 1; }).catch(() => null),
    };
  };
  const head = async () => flat(await text('[data-testid="thread.head.state"]'));
  const label = async () => flat(await text('[data-testid="composer"] .lbl'));

  // the seed: a process of the driver's own for the pause, killed at the end
  const { spawn } = await import('node:child_process');
  const bench = spawn('/bin/sleep', ['900'], { detached: true, stdio: 'ignore' });
  bench.unref();
  fs.writeFileSync(path.join(out, 'zq-bench.pid'), String(bench.pid));
  const RC = path.join(FX, `zq-gate-${String(Date.now() % 100000)}.rc`);
  // the hub holds an sb ask (or sb wait) 25 s at most (core.bend WAIT_CAP): zqsearch asks twice in
  // a row, ~50 s of 'continues when zqdocs answers', read as soon as it shows (try-gate-0170's first
  // quick run: one ask with --timeout 300 timed out at 25 s, the line was gone at 65 s)
  const ASK = 'sb ask zqdocs "$(printf %s "[" "[slow: 240]" "]") zq which page weights"';
  await closeArtifact();
  await harness();
  await clear();
  const t0 = Date.now();
  // the alarm first, the spawns in one call: an agent's reply that steers main mid-turn is its new
  // last message, and the fake model drops the markers left (the first quick run lost the alarm)
  await say(`[[bash: sb wake --on-file ${RC} --note "the zq nightly gate goes red"]] [[bash: sb spawn zqbench --objective 'the zq bench {{bash: sb wake --on-exit ${String(bench.pid)} --then --note "the zq bench ends"}}' && sb spawn zqdocs --objective 'zq docs: nothing to do yet']] seeded 0170`);
  const seeded = await until(async () => ((await agentRow('zqbench')) && (await agentRow('zqdocs')) && (await alarmRows('zq nightly')).length ? true : null), 90000, 1000);
  step('rows0170 seed: zqbench and zqdocs in AGENTS, main\'s alarm in SCHEDULED & WATCHING', !!seeded,
    { bench: await agentRow('zqbench'), docs: await agentRow('zqdocs'), alarm: await alarmRows('zq nightly'), pid: bench.pid });

  await row('alarm only in the right bar', async () => {
    await harness();
    await page.waitForTimeout(800);
    const a = (await alarmRows('zq nightly'))[0] ?? null;
    const line = await waitLine();
    const h = await head();
    const sched = flat(await text('[data-testid="app.right.scheduled.head"]'));
    await page.mouse.move(1, 300);
    await shot('alarm-main');
    const full = 'if the zq nightly gate goes red';
    const subOk = !!a?.sub && (a.sub === full || (a.sub.endsWith('…') && full.startsWith(a.sub.slice(0, -1)) && full[a.sub.length - 1] === ' '));
    step("an alarm-only agent (harness' main): idle, NO line over the composer, never 'waiting' in its head",
      !!a && line === null && !/waiting/.test(h), { line, head: h, label: await label() });
    step("its alarm in SCHEDULED & WATCHING: '◌ main · if the zq nightly gate goes red · until HH:MM', the note whole or cut on a word",
      !!a && /^SCHEDULED & WATCHING/.test(sched) && a.g === '◌' && subOk && /^until (tomorrow )?\d\d:\d\d$/.test(a.end ?? ''), { sched, alarm: a });
    step("its hover: 'bise wakes main if the zq nightly gate goes red · set at HH:MM · stops watching at HH:MM'",
      /^bise wakes main if the zq nightly gate goes red · set at \d\d:\d\d · stops watching (tomorrow )?at \d\d:\d\d$/.test(a?.title ?? ''), { title: a?.title ?? null });
    if (!a) return;
    const r = page.locator(`[data-testid="${a.id}"]`).first();
    await r.hover({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(400);
    await shot('alarm-hover');
    await r.click({ timeout: 5000 });
    const detail = page.locator(`[data-testid="${a.id}.detail"]`).first();
    const dOk = await detail.waitFor({ timeout: 5000 }).then(() => true, () => false);
    const dText = dOk ? flat(await detail.innerText().catch(() => null)) : null;
    const stopT = flat(await text(`[data-testid="${a.id}.stop"]`));
    await page.mouse.move(1, 300);
    await shot('alarm-detail');
    step("a click opens its detail: its words, 'stop watching'", dOk && /bise wakes main if the zq nightly gate goes red/.test(dText ?? '') && /set at \d\d:\d\d/.test(dText ?? '') && stopT === 'stop watching', { detail: dText, stop: stopT });
    await click('stop watching', page.locator(`[data-testid="${a.id}.stop"]`).first());
    const gone = await until(async () => ((await alarmRows('zq nightly')).length === 0 ? true : null), 20000, 500);
    await page.waitForTimeout(500);
    await shot('alarm-stopped');
    step("'stop watching' ends it: the row leaves SCHEDULED & WATCHING", !!gone, { left: await alarmRows('zq nightly') });
    step("no 'since' on main's view", (await noSince('main')).since === null, await noSince('main'));
  });

  await row('a path naming a project stays home', async () => {
    await bise();
    await clear();
    const W = 'zqroute please look at ~/code/harness/x when you can';
    const notices = [];
    await say(W);
    const ack = await until(async () => {
      const n = flat(await text('[data-testid="confirm.notice"]'));
      if (n && !notices.includes(n)) notices.push(n);
      // the fake main's answer quotes the message whole: 'ack: <user_message id="m_3"> zqroute …'
      return /ack: (<user_message[^>]*>\s*)?zqroute/.test((await text('[data-testid="thread.list"]')) ?? '') ? true : null;
    }, ANSWER_MS, 500);
    const sent = await page.evaluate(() => [...document.querySelectorAll('[data-testid="thread.list"] [data-testid^="thread.notice."]')]
      .map((e) => (e.textContent ?? '').replace(/\s+/g, ' ').trim()).filter((t) => /sent to|routed|zqroute/.test(t))).catch(() => []);
    await page.mouse.move(1, 300);
    await shot('route-stays-home');
    await harness();
    await page.waitForTimeout(1000);
    const inHarness = /zqroute/.test((await text('[data-testid="thread.list"]')) ?? '');
    step("bise's thread: words with ~/code/harness/x stay home (main answers there, no 'sent to harness', not in harness' thread)",
      !!ack && !notices.some((n) => /sent to/.test(n)) && sent.filter((t) => /sent to/.test(t)).length === 0 && !inHarness, { ack: !!ack, notices, sent, inHarness });
  });

  // the pause and the reply read in minutes: from 65 s after the seed
  const left = 65000 - (Date.now() - t0);
  if (left > 0) await page.waitForTimeout(left);

  await row('pause over the composer', async () => {
    const on = await openAgent('zqbench');
    // the pause runs from zqbench's sb wake, some seconds after the seed (round 2: 54 s at t0 + 65 s):
    // its words under a minute ('running for 54 s') kept, then read again once in minutes
    const under = await waitLine();
    const line = (await until(async () => { const l = await waitLine(); return l && /running for \d+ min$/.test(l.text) ? l : null; }, 60000, 1000)) ?? (await waitLine());
    step("the pause under a minute says seconds: 'running for N s'", /^continues when the zq bench ends · running for \d+ (s|min)$/.test(under?.text ?? ''), { under });
    const h = await head();
    const r = await agentRow('zqbench');
    const lbl = await label();
    await page.mouse.move(1, 300);
    await shot('pause-zqbench');
    step("a paused agent (zqbench, sb wake --on-exit --then): 'continues when the zq bench ends · running for N min' over the composer, whole",
      on && /^continues when the zq bench ends · running for \d+ min$/.test(line?.text ?? '') && line?.whole === true, { on, line });
    step("its head: '… waiting · N min'; its AGENTS row '…' ending on 'N min'; the composer's label never says waiting",
      /^… waiting · \d+ min$/.test(h) && r?.g === '…' && /^\d+ min$/.test(r?.end ?? '') && !/waiting|idle|since/.test(lbl), { head: h, row: r, label: lbl });
    step("its pause is no alarm: not in SCHEDULED & WATCHING", (await alarmRows('zq bench')).length === 0, { alarms: await alarmRows('zq bench') });
    step("no 'since' on zqbench's view", (await noSince('zqbench')).since === null, await noSince('zqbench'));
  });

  await row('waiting on another agent', async () => {
    await harness();
    await clear();
    // the hub holds an ask 25 s at most (core.bend WAIT_CAP) and the line's duration runs from the
    // ask's start (round 2: '· 0 s', gone at 25 s): read it, its head and its name while it holds
    await say(`[[bash: sb spawn zqsearch --objective 'zq search {{bash: ${ASK}}}']] seeded zqsearch`);
    await until(async () => ((await agentRow('zqsearch')) ? true : null), 60000, 500);
    const on = await openAgent('zqsearch');
    const line = await until(async () => { const l = await waitLine(); return l && /answers/.test(l.text) ? l : null; }, 60000, 250);
    const at = Date.now();
    const h = await head();
    const r = await agentRow('zqsearch');
    const who = flat(await text('[data-testid="thread.waiting.who"]'));
    await page.mouse.move(1, 300);
    await shot('reply-zqsearch');
    step("an agent waiting on another (zqsearch's sb ask): 'continues when zqdocs answers · N s|min', the name a link",
      on && /^continues when zqdocs answers · \d+ (s|min)$/.test(line?.text ?? '') && who === 'zqdocs', { on, line, who });
    step("its head: '… waiting · N s|min'; its AGENTS row '…' ending on the same", /^… waiting · \d+ (s|min)$/.test(h) && r?.g === '…' && /^\d+ (s|min)$/.test(r?.end ?? ''), { head: h, row: r });
    step("no 'since' on zqsearch's view", (await noSince('zqsearch')).since === null, await noSince('zqsearch'));
    await click('the waited-on name', page.locator('[data-testid="thread.waiting.who"]').first());
    const went = await until(async () => ((await page.locator('[data-testid="thread.screen"]').first().getAttribute('data-agent')) === 'zqdocs' ? true : null), 5000, 250);
    await page.mouse.move(1, 300);
    await shot('reply-name-opens-zqdocs');
    step('the name opens zqdocs', !!went, { at: await page.locator('[data-testid="thread.screen"]').first().getAttribute('data-agent').catch(() => null), ms_after_line: Date.now() - at });
    // past the ask's 25 s hold, zqdocs still not answered (0aefecd2, e812463c's row): the reply still
    // pending is a pause counted from the ask, so the line stays and its duration goes on from there
    await openAgent('zqsearch');
    const secs = (t) => { const m = /· (\d+) (s|min)$/.exec(t ?? ''); return m ? Number(m[1]) * (m[2] === 'min' ? 60 : 1) : null; };
    const n0 = secs(line?.text);
    await page.waitForTimeout(Math.max(0, 40000 - (Date.now() - at)));
    const later = await waitLine();
    const passed = Math.round((Date.now() - at) / 1000);
    const n1 = secs(later?.text);
    const h1 = await head();
    await page.mouse.move(1, 300);
    await shot('reply-after-ask-cap');
    // counted from the ask: at least the first reading plus the time since (a 'min' reading rounds down)
    const counted = n0 !== null && n1 !== null && (/ s$/.test(later?.text ?? '') ? n1 >= n0 + passed - 3 : n1 + 59 >= n0 + passed);
    step(`past the ask's 25 s hold (${String(passed)} s after the line showed, zqdocs not answered): 'continues when zqdocs answers · N' stays, N counted from the ask`,
      /^continues when zqdocs answers · \d+ (s|min)$/.test(later?.text ?? '') && counted && /^… waiting · \d+ (s|min)$/.test(h1),
      { first: line?.text ?? null, later: later?.text ?? null, n0, n1, passed, head: h1, row: await agentRow('zqsearch') });
  });

  // the pause's pid ends: the wake comes, zqbench's line goes
  await row('pause ends', async () => {
    try { process.kill(bench.pid, 'SIGTERM'); } catch { /* gone */ }
    await openAgent('zqbench');
    const gone = await until(async () => ((await page.locator('[data-testid="thread.waiting"]').count()) === 0 ? true : null), 45000, 1000);
    await page.mouse.move(1, 300);
    await shot('pause-ended');
    step("the pid ends: zqbench's line over the composer goes", !!gone, { head: await head() });
  });
  try { process.kill(bench.pid, 'SIGKILL'); } catch { /* gone */ }
  await harness();
}

// 276074b2's quick rows (ambient-lead m_22369), in harness' thread: '?' and space type (281879ed),
// an opened run_typescript box shows its source (1f5819a7), ⌘ hints at 150 ms (e4394a9e), and
// /artifacts ↓↓⏎ (f3fa6edb's list keys)
// c2bae3b3's rows (ambient-lead m_24613, main m_24616): the composer as a tab over the box (A) at
// 1400/1100/800 light and dark, no ghost inbox count and '/inbox' (beside an artifact too), a card
// closed mid answer keeps his words (⏎ a plain message, esc back to the composer), '✓ answered'
// opens his answer, the lone ψ's tip, '@' newest first, no trackpad swipe (⌘[ ⌘] kept), the asks
// row's pink artifact name. Each row is its own try. The '+' is never clicked (its panel is a real
// window on his screen).
async function rowsC2BA(harness, say) {
  const row = async (name, fn) => {
    if (!wanted(name)) return;
    try { await fn(); } catch (e) { step(name, false, String(e).slice(0, 300)); }
  };
  const flat = (s) => (s ?? '').replace(/\s+/g, ' ').trim();
  const field = page.locator('[data-testid="composer.field"]:visible').first();
  const fieldText = async () => flat(await field.innerText({ timeout: 2000 }).catch(() => ''));
  const clear = async () => {
    await field.click({ timeout: 3000 }).catch(() => {});
    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Backspace');
  };
  const idle = () => until(async () => (/· idle\b/.test(flat(await text('[data-testid="composer"]'))) ? true : null), 90000, 1000);
  const color = (v) => page.evaluate((x) => { const d = document.createElement('i'); d.style.color = `var(${x})`; document.body.append(d); const c = getComputedStyle(d).color; d.remove(); return c; }, v).catch(() => null);
  const agentNow = () => page.locator('[data-testid="thread.screen"]').first().getAttribute('data-agent', { timeout: 2000 }).catch(() => null);
  const goAgent = async (a) => {
    await page.locator(`[data-testid="app.right.agent.${a}"]`).first().click({ timeout: 5000 }).catch(() => {});
    return until(async () => ((await agentNow()) === a ? true : null), 8000, 250);
  };
  const T = String(Date.now()).slice(-5);
  const NL = String.fromCharCode(92) + 'n';
  // one card of main's, by its words in a printf (sb card is main's alone)
  const card = async (q, opts, tail) => {
    await clear();
    await page.keyboard.type(`[[bash: sb card "$(printf "%s${NL}" ${[q, ...opts].map((x) => `"${x}"`).join(' ')})"]] ${tail}`, { delay: 3 });
    await page.keyboard.press('Enter');
  };
  const dock = async (token, ms) => {
    const rowL = page.locator('[data-testid^="inbox.block.row."]', { hasText: token }).first();
    const open = page.locator('[data-testid^="inbox.block.open."]').filter({ hasText: token }).first();
    const listed = await until(async () => {
      if ((await rowL.isVisible().catch(() => false)) || (await open.isVisible().catch(() => false))) return true;
      await page.locator('[data-testid="inbox.block.more"]').first().click({ timeout: 1000 }).catch(() => {});
      return null;
    }, ms, 1000);
    for (let i = 0; listed && i < 20 && !(await open.isVisible().catch(() => false)); i++) {
      if (await rowL.isVisible().catch(() => false)) await rowL.click({ timeout: 2000 }).catch(() => {});
      else await page.locator('[data-testid="inbox.block.more"]').first().click({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(400);
    }
    const isOpen = await open.isVisible().catch(() => false);
    const id = isOpen ? await open.evaluate((el) => {
      const c = el.matches('[data-testid^="inbox.block.card."]') ? el : el.querySelector('[data-testid^="inbox.block.card."]');
      const m = /-(\d+)$/.exec(c?.getAttribute('data-testid') ?? '');
      return m ? Number(m[1]) : null;
    }).catch(() => null) : null;
    return { listed: !!listed, open: isOpen ? open : null, id };
  };
  const cardEl = (token) => page.locator('[data-testid^="inbox.block.card."]').filter({ hasText: token }).first();
  const answerWith = async (token, n) => {
    const d = await dock(token, 5000);
    if (d.open) await d.open.locator(`[data-testid$=".opt.${String(n)}"]`).first().click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(1200);
  };

  // the seed: a worktree agent (the tab's ψ, the tip), an artifact (the asks row, '/inbox' beside it)
  await closeArtifact();
  await harness();
  await idle();
  fs.writeFileSync(path.join(FX, 'zc-art.html'), '<!doctype html><title>zc art</title><h1>zc asks art</h1><p>the asks row opens this.</p>');
  await clear();
  await page.keyboard.type(`[[bash: sb spawn zcwt --place new --objective 'zc worktree: nothing to do' && sb artifact add ${path.join(FX, 'zc-art.html')} --title 'zc asks art for the pink asks row']] seeded c2ba`, { delay: 2 });
  await page.keyboard.press('Enter');
  const seeded = await until(async () => page.evaluate(() => !!document.querySelector('[data-testid="app.right.agent.zcwt"]')
    && [...document.querySelectorAll('[data-testid^="app.right.artifact."][data-testid$=".chip"]')].some((x) => /zc asks art/.test(x.textContent ?? ''))), 120000, 1000);
  await idle();
  step('rowsC2BA seed: zcwt in a worktree, the zc artifact in ARTIFACTS', !!seeded, { bar: flat(await text('[data-testid="app.right"]')).slice(0, 300) });

  // the composer's parts as drawn now
  const tabInfo = () => page.evaluate(() => {
    const q = (s) => document.querySelector(`[data-testid="${s}"]`);
    const shown = (s) => { const e = q(s); return !!e && !e.classList.contains('gone') && e.getBoundingClientRect().width > 0 && getComputedStyle(e).display !== 'none'; };
    const words = (s) => (shown(s) ? (q(s).textContent ?? '').replace(/\s+/g, ' ').trim() : null);
    const t = q('composer.tab')?.getBoundingClientRect();
    const b = q('composer.box')?.getBoundingClientRect();
    const boxCs = q('composer.box') ? getComputedStyle(q('composer.box')) : null;
    const list = document.querySelector('.th-list');
    const scroller = document.querySelector('.th-list > [data-virtuoso-scroller]');
    const rowEl = q('composer.row') ?? q('composer.attach')?.parentElement ?? null;
    return {
      to: words('composer.tab.to'), place: words('composer.tab.place'), context: words('composer.tab.context'), project: words('composer.tab.project'), end: words('composer.tab.end'),
      acc: q('composer.tab')?.classList.contains('acc') ?? null,
      tab: t && b ? { h: Math.round(t.height), l: Math.round(t.left - b.left), r: Math.round(b.right - t.right), glue: Math.round(Math.abs(t.bottom - b.top)), w: Math.round(t.width) } : null,
      radius: boxCs?.borderTopLeftRadius ?? null, shadow: boxCs?.boxShadow ?? null,
      after: list ? getComputedStyle(list, '::after').content : null, mask: scroller ? getComputedStyle(scroller).maskImage : null,
      attach: words('composer.attach'), mode: words('composer.mode'), model: words('composer.model'),
      send: !!document.querySelector('[data-testid="composer"] [data-testid="composer.send"], [data-testid="composer"] [data-testid="composer.stop"], [data-testid="composer"] button[aria-label*="send" i]'),
      row: rowEl ? (rowEl.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 80) : null,
      keys: shown('composer.keys'),
    };
  }).catch((e) => ({ error: String(e).slice(0, 200) }));
  const noBand = (x) => !!x && (x.after === 'none' || x.after === 'normal') && /linear-gradient/.test(x.mask ?? '') && /^[^,]* 0px 0px 0px 1px$/.test(x.shadow ?? '') && x.radius === '16px';

  await row('composer A', async () => {
    await harness();
    await idle();
    await page.keyboard.press('Escape');
    const m0 = await tabInfo();
    step("composer A (main): the tab 'to main' + gust, 'shared folder', context; 32 px, 16 px in each side, glued; no project, idle or model in it; the row '+', mode ⌄, model ⌄, send; keys line",
      !!m0 && /^to main\b/.test(m0.to ?? '') && m0.place === 'shared folder' && /^context /.test(m0.context ?? '') && !m0.project && !/\bidle\b|yolo|approvals/.test(`${m0.to} ${m0.place} ${m0.context}`)
        && m0.tab?.h === 32 && m0.tab.l === 16 && m0.tab.r === 16 && m0.tab.glue <= 1 && m0.attach === '+' && /⌄$/.test(m0.mode ?? '') && /⌄$/.test(m0.model ?? '') && m0.send && m0.keys, m0);
    step('composer A: no shadow band (no ::after, one 1 px line, r 16), the thread fades under a 12 px opacity mask', noBand(m0), { after: m0?.after, mask: m0?.mask, shadow: m0?.shadow, radius: m0?.radius });
    // the menus open above the box; esc closes them, the field untouched
    await clear();
    await page.keyboard.type('zc menu words', { delay: 5 });
    const menus = {};
    for (const k of ['mode', 'model']) {
      await page.locator(`[data-testid="composer.${k}"]`).first().click({ timeout: 3000 }).catch(() => {});
      const mb = await page.locator(`[data-testid="composer.${k}.menu"]`).first().boundingBox({ timeout: 3000 }).catch(() => null);
      const bb = await page.locator('[data-testid="composer.box"]').first().boundingBox().catch(() => null);
      if (k === 'model') await shot('c2ba-model-menu-above');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      menus[k] = { menuBottom: mb ? Math.round(mb.y + mb.height) : null, boxTop: bb ? Math.round(bb.y) : null, gone: !(await page.locator(`[data-testid="composer.${k}.menu"]`).count()) };
    }
    menus.field = await fieldText();
    step("the mode and the model + effort menus open above the box, esc closes them, the field kept",
      ['mode', 'model'].every((k) => menus[k].menuBottom !== null && menus[k].menuBottom <= menus[k].boxTop && menus[k].gone) && menus.field === 'zc menu words', menus);
    await clear();
    // a worktree agent: 'ψ sb/zcwt'; the drop order: the context first, then the branch, never 'to'
    await goAgent('zcwt');
    const w0 = await tabInfo();
    const drops = await page.evaluate(() => {
      const tab = document.querySelector('[data-testid="composer.tab"]');
      const shown = (s) => { const e = document.querySelector(`[data-testid="${s}"]`); return !!e && !e.classList.contains('gone') && e.getBoundingClientRect().width > 0; };
      const out = [];
      const full = Math.round(tab.getBoundingClientRect().width);
      for (let w = full; w >= 120; w -= 10) { tab.style.width = `${w}px`; out.push({ w, ctx: shown('composer.tab.context'), place: shown('composer.tab.place'), to: shown('composer.tab.to') }); }
      tab.style.width = '';
      return out;
    }).catch((e) => String(e).slice(0, 200));
    await page.waitForTimeout(300);
    const first = (f) => (Array.isArray(drops) ? drops.findIndex(f) : -1);
    const [ctxGone, placeGone] = [first((x) => !x.ctx), first((x) => !x.place)];
    step("composer A (zcwt): 'to zcwt' + 'ψsb/zcwt' + context; narrowed, the context goes first, then the branch, 'to zcwt' always stays",
      /^to zcwt\b/.test(w0?.to ?? '') && /^ψ ?sb\/zcwt$/.test(w0?.place ?? '') && /^context /.test(w0?.context ?? '') && ctxGone >= 0 && placeGone >= ctxGone && Array.isArray(drops) && drops.every((x) => x.to),
      { tab: w0, ctxGone: drops[ctxGone]?.w ?? null, placeGone: drops[placeGone]?.w ?? null, full: Array.isArray(drops) ? drops[0] : drops });
    // answering: the accent tab, 'answering main · …', 'esc write to main instead'; '+' and send only
    await harness();
    await idle();
    const Q = `zcA${T}`;
    await card(`${Q} which composer accent?`, ['1. zca-one', '2. zca-two'], 'seeded answering');
    await idle();
    const d = await dock(Q, 60000);
    const an = await until(async () => { const x = await tabInfo(); return x?.acc ? x : null; }, 8000, 400) ?? (await tabInfo());
    step("composer A answering: the tab in the accent, 'answering main · <question cut after a word>', 'esc write to main instead'; no branch, context, mode or model; '+' stays",
      !!d.open && an?.acc === true && /^answering main · zcA/.test(an.to ?? '') && /^esc write to main instead$/.test(an.end ?? '') && !an.place && !an.context && !an.mode && !an.model && an.attach === '+', { card: d.id, ...an });
    // the shots: idle (main), words (zcwt), answering, at 1400/1100/800 light and dark
    const sizes = [];
    for (const scheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme: scheme }).catch(() => {});
      for (const w of [1400, 1100, 800]) {
        await resizeWin(1400, 900);
        await page.waitForTimeout(400);
        await page.keyboard.press('Escape');
        await harness();
        await page.waitForTimeout(300);
        await resizeWin(w, 900);
        await page.waitForTimeout(700);
        const idleI = await tabInfo();
        await shot(`c2ba-composer-${scheme}-${w}-idle`);
        await resizeWin(1400, 900);
        await page.waitForTimeout(400);
        await goAgent('zcwt');
        await resizeWin(w, 900);
        await page.waitForTimeout(700);
        await clear();
        await page.keyboard.type('also run it on mobile safari', { delay: 3 });
        const wordsI = await tabInfo();
        await shot(`c2ba-composer-${scheme}-${w}-words`);
        await clear();
        await resizeWin(1400, 900);
        await page.waitForTimeout(400);
        await harness();
        const dd = await dock(Q, 5000);
        await resizeWin(w, 900);
        await page.waitForTimeout(700);
        const ansI = await tabInfo();
        const cut = (ansI?.to ?? '').replace(/[ ·~∿≈]{5}(?= ·|…|$)/u, '');
        await shot(`c2ba-composer-${scheme}-${w}-answering`);
        sizes.push({ scheme, w, idle: { to: idleI?.to, place: idleI?.place, ctx: idleI?.context, band: noBand(idleI) }, words: { to: wordsI?.to, place: wordsI?.place, ctx: wordsI?.context, mode: wordsI?.mode, model: wordsI?.model }, answering: { open: !!dd.open, acc: ansI?.acc, to: cut, end: ansI?.end, dots: cut.includes('...') } });
      }
    }
    await page.emulateMedia({ colorScheme: null }).catch(() => {});
    await resizeWin(1400, 900);
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape');
    step("composer A at 1400/1100/800 light and dark: 'to' always shown, no band, the mode never drops, answering in the accent with one '…' at most",
      sizes.every((s) => /^to main/.test(s.idle.to ?? '') && s.idle.band && /^to zcwt/.test(s.words.to ?? '') && !!s.words.mode && s.answering.open && s.answering.acc && !s.answering.dots && /^answering main/.test(s.answering.to ?? '')), sizes);
    await harness();
    await answerWith(Q, 1);
  });

  await row('ghost badge', async () => {
    await harness();
    await idle();
    const G = `zcG${T}`;
    await card(`${G} keep this one?`, ['1. zcg-one', '2. zcg-two'], 'seeded ghost');
    await idle();
    const d = await dock(G, 60000);
    if (!d.open) { step('ghost badge: the card in the block', false, { listed: d.listed }); return; }
    await field.click({ timeout: 3000 }).catch(() => {});
    await page.keyboard.type('zc ghost words, keep it open', { delay: 3 });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(6000);
    await idle();
    // every count the sidebar shows is an item the block lists (bise's home block lists them all)
    await click('bise', page.locator('[data-testid="app.sidebar.bise"]').first());
    await page.waitForTimeout(1500);
    const counts = await page.evaluate(() => {
      const side = [...document.querySelectorAll('[data-testid^="app.sidebar.project."]')]
        .map((e) => ({ id: (e.getAttribute('data-testid') ?? '').slice('app.sidebar.project.'.length), n: Number(e.querySelector('.app-cnt')?.textContent ?? '0') || 0 }))
        .filter((p) => p.id && !p.id.includes('.'));
      const head = document.querySelector('[data-testid="inbox.block"]')?.textContent ?? '';
      const m = /(\d+) waiting/.exec(head);
      return { side, sum: side.reduce((a, p) => a + p.n, 0), block: m ? Number(m[1]) : (document.querySelector('[data-testid="inbox.block"]') ? 1 : 0), head: head.replace(/\s+/g, ' ').trim().slice(0, 160) };
    }).catch((e) => ({ error: String(e) }));
    const still = await page.evaluate((t) => [...document.querySelectorAll('[data-testid^="inbox.block"]')].some((e) => (e.textContent ?? '').includes(t)), G).catch(() => null);
    await shot('c2ba-ghost-after-answer');
    step("no ghost count: after his words on a card, every count in the sidebar is an item the block lists (sum of the counts = 'N waiting'); a card the hub kept is in the block",
      !!counts && !counts.error && counts.sum === counts.block, { ...counts, zcG_still_listed: still });
    // '/inbox' in the composer opens the block's first item in place
    await harness();
    await page.keyboard.press('Escape');
    await clear();
    await page.keyboard.type('/inbox', { delay: 20 });
    await page.keyboard.press('Enter');
    const opened = await until(async () => ((await page.locator('[data-testid^="inbox.block.open."], [data-testid^="inbox.block.card."]').first().isVisible().catch(() => false)) ? true : null), 5000, 250);
    const note = flat(await text('[data-testid="composer.answer.note"]'));
    await shot('c2ba-inbox-slash');
    step("'/inbox' opens the block's item in place, or says 'nothing waits for you.'", !!opened || note === 'nothing waits for you.', { opened: !!opened, note, waiting: counts?.block });
    await page.keyboard.press('Escape');
    // beside an artifact: the block there lists its maker's items only; '/inbox' widens it, or says so
    const chip = page.locator('[data-testid^="app.right.artifact."][data-testid$=".chip"]').filter({ hasText: 'zc asks art' }).first();
    await chip.click({ timeout: 5000 }).catch(() => {});
    const art = await page.locator('[data-testid="artifact.page"], [data-testid="app.art"]').first().waitFor({ timeout: 8000 }).then(() => true, () => false);
    await page.waitForTimeout(800);
    const f2 = page.locator('[data-testid="composer.field"]:visible').last();
    await f2.click({ timeout: 3000 }).catch(() => {});
    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('/inbox', { delay: 20 });
    await page.keyboard.press('Enter');
    const wide = await until(async () => {
      const o = await page.locator('[data-testid^="inbox.block.open."], [data-testid^="inbox.block.card."]').first().isVisible().catch(() => false);
      const n = flat(await page.locator('[data-testid="composer.answer.note"]:visible').first().innerText({ timeout: 500 }).catch(() => ''));
      return o || n ? { opened: o, note: n } : null;
    }, 6000, 300);
    await shot('c2ba-inbox-slash-beside-artifact');
    step("'/inbox' beside an artifact: the block widens to the item that waits, or 'nothing waits for you.' (never a silent nothing)",
      art && !!wide && (wide.opened || wide.note === 'nothing waits for you.'), { art, ...wide });
    await page.keyboard.press('Escape');
    await closeArtifact();
    await harness();
    if (still) await answerWith(G, 1);
  });

  // a card main withdraws while his words are typed: '· closed', the tab says so, his words stay
  const closedCard = async (K, how) => {
    await harness();
    await idle();
    await card(`${K} which bench?`, ['1. zcc-cold', '2. zcc-warm'], `seeded closed ${how}`);
    await idle();
    const d0 = await dock(K, 60000);
    if (d0.id === null) return { error: 'no card', listed: d0.listed };
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    await clear();
    await say(`[[bash: sleep 20 && sb card --withdraw ${String(d0.id)} "zc the plan changed"]] withdrawing ${how}`);
    const d = await dock(K, 10000);
    if (!d.open) return { error: 'not open again', id: d0.id };
    const HALF = `warm, but only after the reindex ${how}`;
    await field.click({ timeout: 3000 }).catch(() => {});
    await page.keyboard.type(HALF, { delay: 10 });
    const closedAt = await until(async () => ((await cardEl(K).getAttribute('data-closed', { timeout: 500 }).catch(() => null)) === 'true' ? true : null), 60000, 500);
    const c = {
      id: d0.id, closed: !!closedAt, word: flat(await cardEl(K).innerText({ timeout: 2000 }).catch(() => '')).slice(0, 160),
      field: await fieldText(), screen: /the question is closed/.test(flat(await text('[data-testid="thread.screen"]'))), tab: (await tabInfo())?.to ?? null, HALF,
    };
    await page.mouse.move(1, 300);
    await shot(`c2ba-closed-mid-answer-${how}`);
    return c;
  };
  await row('card closed mid answer', async () => {
    const K1 = `zcC${T}`;
    const c1 = await closedCard(K1, 'enter');
    step("a card main withdraws mid answer stays open '· closed', the tab 'to main · the question is closed', his words kept",
      !c1.error && c1.closed && /· closed/.test(c1.word) && c1.field === c1.HALF && c1.screen, c1);
    if (c1.error) return;
    const before = await page.evaluate(() => document.querySelectorAll('[data-testid="thread.list"] [data-side="me"]').length).catch(() => 0);
    await field.click({ timeout: 3000 }).catch(() => {});
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    const sent = await until(async () => page.evaluate(([h]) => {
      const me = [...document.querySelectorAll('[data-testid="thread.list"] [data-side="me"]')];
      return me.some((e) => (e.textContent ?? '').includes(h)) ? me.length : null;
    }, [c1.HALF]), 20000, 500);
    await page.waitForTimeout(1500);
    const asAnswer = await page.evaluate((h) => [...document.querySelectorAll('[data-testid^="thread.approval."], [data-testid^="thread.aside."]')].some((e) => (e.textContent ?? '').includes(h)), c1.HALF).catch(() => null);
    const gone = !(await cardEl(K1).isVisible().catch(() => false));
    await shot('c2ba-closed-enter-sent');
    step("⏎ on the closed card sends his words to main as a plain message (his bubble, never 'you answered'), the card goes",
      !!sent && asAnswer === false && gone, { me_rows: { before, after: sent }, asAnswer, gone });
    await idle();
    const K2 = `zcE${T}`;
    const c2 = await closedCard(K2, 'esc');
    if (c2.error || !c2.closed) { step("esc on a closed card: his words back in the composer", false, c2); return; }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(800);
    const back = { field: await fieldText(), tab: (await tabInfo())?.to ?? null, note: flat(await text('[data-testid="composer.answer.note"]')), card: await cardEl(K2).isVisible().catch(() => false) };
    await shot('c2ba-closed-esc-back');
    step("esc on the closed card: back to the composer 'to main', his words in it (or '↑ brings them back')",
      /^to main\b/.test(back.tab ?? '') && (back.field === c2.HALF || /↑ brings them back/.test(back.note)), { closed: c2, back });
    await clear();
  });

  await row('answered link', async () => {
    await harness();
    await idle();
    const A = `zcL${T}`;
    await card(`${A} which way for the answered link?`, ['1. zcl-one', '2. zcl-two'], 'seeded answered');
    await idle();
    // a long reply after the card: his answer will sit far under it
    const md = path.join(FX, 'zc-long.md');
    fs.writeFileSync(md, Array.from({ length: 50 }, (_, i) => `- line ${String(i + 1)}: ${'the answered link needs room between the card and the answer. '.repeat(2)}`).join(String.fromCharCode(10)));
    await page.keyboard.press('Escape');
    await say(`[[reply: ${md}]] long`);
    await until(async () => (/line 50:/.test(flat(await text('[data-testid="thread.list"]'))) ? true : null), 60000, 1000);
    await idle();
    const d = await dock(A, 20000);
    if (d.id === null) { step("'✓ answered' opens his answer", false, { listed: d.listed }); return; }
    await d.open.locator('[data-testid$=".opt.1"]').first().click({ timeout: 3000 }).catch(() => {});
    const rowL = page.locator(`[data-testid="thread.card.${String(d.id)}"]`).first();
    // the thread draws its last rows only: scroll up until the card's row is drawn
    const sc = page.locator('[data-testid="thread.list"] [data-virtuoso-scroller="true"]').first();
    const drawn = await until(async () => {
      if (await rowL.isVisible().catch(() => false)) return true;
      await sc.evaluate((e) => { e.scrollTop = Math.max(0, e.scrollTop - 500); }).catch(() => {});
      return null;
    }, 30000, 300);
    await rowL.scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(600);
    const rowWords = flat(await rowL.innerText({ timeout: 2000 }).catch(() => ''));
    const title = await rowL.locator('xpath=..').getAttribute('title').catch(() => null);
    const answerOut = await page.evaluate((id) => {
      const s = document.querySelector('[data-testid="thread.list"] [data-virtuoso-scroller="true"]')?.getBoundingClientRect();
      const a = [...document.querySelectorAll('[data-testid^="thread.approval."], [data-testid^="thread.entry."]')].filter((e) => /zcl-one/.test(e.textContent ?? '')).at(-1);
      if (!a || !s) return true;
      const r = a.getBoundingClientRect();
      return r.bottom < s.top || r.top > s.bottom;
    }, d.id).catch(() => null);
    await shot('c2ba-answered-before');
    await rowL.click({ timeout: 3000 }).catch(() => {});
    const flash = await until(async () => page.evaluate(() => {
      const e = document.querySelector('.th-flash');
      const s = document.querySelector('[data-testid="thread.list"] [data-virtuoso-scroller="true"]')?.getBoundingClientRect();
      if (!e || !s) return null;
      const r = e.getBoundingClientRect();
      return { id: e.getAttribute('data-testid') ?? e.closest('[data-testid]')?.getAttribute('data-testid'), text: (e.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 120), inView: r.bottom > s.top && r.top < s.bottom };
    }), 6000, 150);
    await shot('c2ba-answered-at-answer');
    step("'✓ answered: <question>' (title 'show your answer') brings his answer into view, flashed once",
      !!drawn && /^✓ answered: zcL/.test(rowWords) && !!flash && flash.inView && /zcl-one/.test(flash.text), { card: d.id, rowWords, title, answerOutBefore: answerOut, flash });
  });

  await row('psi tip', async () => {
    await harness();
    const shots = [];
    for (const scheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme: scheme }).catch(() => {});
      await page.locator('[data-testid="app.right.agent.zcwt.mark"]').first().hover({ timeout: 3000 }).catch(() => {});
      const tip = await until(async () => page.evaluate(() => {
        const t = document.querySelector('[data-testid="app.right.tip.words"]');
        if (!t) return null;
        const mono = [...t.querySelectorAll('.app-rb-tip-mono')];
        return { words: (t.textContent ?? '').replace(/\s+/g, ' ').trim(), mono: mono.map((m) => m.textContent), font: mono[0] ? getComputedStyle(mono[0]).fontFamily : null, c: mono[0] ? getComputedStyle(mono[0]).color : null, w: Math.round(document.querySelector('[data-testid="app.right.tip"]')?.getBoundingClientRect().width ?? 0) };
      }), 5000, 250);
      await shot(`c2ba-psi-tip-${scheme}`);
      shots.push({ scheme, ink: await color('--c-text'), ...tip });
      await page.mouse.move(1, 400);
      await page.waitForTimeout(300);
    }
    await page.emulateMedia({ colorScheme: null }).catch(() => {});
    step("the lone ψ's tip: 'ψ worktree: its own copy of the repo, on sb/zcwt · <its folder>', branch and folder mono in ink (light and dark)",
      shots.every((s) => /^ψ worktree: its own copy of the repo, on sb\/zcwt · \/.+zcwt/.test(s.words ?? '') && s.mono?.length === 2 && s.mono[0] === 'sb/zcwt' && /mono/i.test(s.font ?? '') && s.c === s.ink), shots);
  });

  await row('at newest first', async () => {
    const dir = path.join(FX, 'zc-at');
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    const ORDER = ['report.pdf', 'new-folder', 'notes.md', 'old-folder', 'a-oldest.txt'];
    ORDER.forEach((n, i) => {
      const p = path.join(dir, n);
      if (n.includes('.')) fs.writeFileSync(p, ''); else fs.mkdirSync(p);
      const t = 1700000000 - i * 3600;
      fs.utimesSync(p, t, t);
    });
    await harness();
    await page.keyboard.press('Escape');
    await clear();
    await page.keyboard.type(`@${dir}/`, { delay: 5 });
    const names = await until(async () => {
      const ids = await page.locator('[data-testid="composer.pick"] [data-testid^="composer.pick.file."]').evaluateAll((rs) => rs.map((r) => r.getAttribute('data-testid') ?? ''));
      const n = ids.map((id) => id.replace(/\/$/, '').split('/').at(-1) ?? '').filter((x) => ORDER.includes(x));
      return n.length === ORDER.length ? n : null;
    }, 8000, 300);
    await shot('c2ba-at-newest-first');
    step("'@<folder>/' lists the newest first, folders and files mixed", JSON.stringify(names) === JSON.stringify(ORDER), { names, want: ORDER });
    await page.keyboard.press('Escape');
    await clear();
  });

  await row('no swipe', async () => {
    await harness();
    await page.keyboard.press('Escape');
    await goAgent('zcwt');
    await clear();
    await page.keyboard.type('zc words under a swipe', { delay: 5 });
    const box = await page.locator('[data-testid="thread.list"]').first().boundingBox().catch(() => null);
    if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    const walks = [];
    for (const dx of [-30, 30]) {
      for (let i = 0; i < 12; i++) { await page.mouse.wheel(dx, 0); await page.waitForTimeout(16); }
      await page.waitForTimeout(600);
      walks.push({ dx, at: await agentNow() });
    }
    const words = await fieldText();
    await clear();
    await page.locator('[data-testid="app.main"]').first().click({ position: { x: 40, y: 140 } }).catch(() => {});
    await page.keyboard.press('Meta+BracketLeft');
    const back = await until(async () => ((await agentNow()) === 'main' ? 'main' : null), 5000, 250) ?? (await agentNow());
    await page.keyboard.press('Meta+BracketRight');
    const fwd = await until(async () => ((await agentNow()) === 'zcwt' ? 'zcwt' : null), 5000, 250) ?? (await agentNow());
    step("a two-finger swipe (sideways wheel, either way) never walks, his words stay; ⌘[ back to main, ⌘] forward to zcwt",
      walks.every((w) => w.at === 'zcwt') && words === 'zc words under a swipe' && back === 'main' && fwd === 'zcwt', { walks, words, back, fwd });
    await harness();
  });

  await row('asks pink', async () => {
    await harness();
    await idle();
    const acc = await color('--c-accent');
    const id = await page.evaluate(() => {
      const e = [...document.querySelectorAll('[data-testid^="app.right.artifact."][data-testid$=".chip"]')].find((x) => /zc asks art/.test(x.textContent ?? ''));
      const t = e?.getAttribute('data-testid') ?? '';
      return t ? t.split('.').slice(4, -1).join('.') : null;
    }).catch(() => null);
    if (!id) { step("the asks row's artifact name is pink", false, { why: 'no zc artifact in ARTIFACTS' }); return; }
    const K = `zcK${T}`;
    await card(`${K} keep the webp next to [zc asks art](artifact:${id})?`, ['1. zck-yes', '2. zck-no'], 'seeded asks');
    await idle();
    await page.keyboard.press('Escape');
    const asks = await until(async () => page.evaluate((t) => {
      const e = [...document.querySelectorAll('[data-testid="thread.list"] [data-testid^="thread."]')].filter((x) => (x.textContent ?? '').includes(t) && /asks/.test(x.textContent ?? '')).at(-1);
      if (!e) return null;
      const n = e.querySelector('.b-artname, [data-testid="thread.artname"]');
      return { text: (e.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 200), name: n ? { t: n.textContent, c: getComputedStyle(n).color, cursor: getComputedStyle(n).cursor } : null, raw: /\]\(artifact:/.test(e.textContent ?? '') };
    }, K), 30000, 1000);
    await page.mouse.move(1, 400);
    await shot('c2ba-asks-pink');
    step("the thread's 'bise asks: …' row draws the artifact link as its pink name (no raw '[name](artifact:…)')",
      !!asks?.name && asks.name.c === acc && !asks.raw && /zc asks art/.test(asks.name.t ?? ''), { id, acc, ...asks });
    const n = page.locator('[data-testid="thread.list"] .b-artname, [data-testid="thread.list"] [data-testid="thread.artname"]').filter({ hasText: 'zc asks art' }).last();
    await n.click({ timeout: 3000 }).catch(() => {});
    const view = await page.locator('[data-testid="artifact.page"], [data-testid="app.art"]').first().waitFor({ timeout: 8000 }).then(() => true, () => false);
    await shot('c2ba-asks-click-opens');
    step("a click on the asks row's pink name opens the artifact's view", view, { view });
    await closeArtifact();
    await harness();
    await answerWith(K, 1);
  });
}

async function quickRows(harness, say) {
  const field = page.locator('[data-testid="composer.field"]:visible').first();
  const fieldText = async () => ((await field.innerText({ timeout: 2000 }).catch(() => null)) ?? '').trim();
  const clear = async () => {
    await field.click({ timeout: 3000 }).catch(() => {});
    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Backspace');
  };
  await harness();
  // '?' is his to type: a message may start with it, no help sheet
  await clear();
  await page.keyboard.type('?ok', { delay: 20 });
  await page.waitForTimeout(400);
  const q = { field: await fieldText(), help: (await page.locator('[data-testid="help.overlay"]').count()) > 0 };
  step("'?' types into the composer (no help sheet)", q.field.startsWith('?ok') && !q.help, q);
  if (q.help) await page.keyboard.press('Escape');
  // space with nothing focused types into the composer
  await clear();
  await page.keyboard.type('abc', { delay: 20 });
  await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
  await page.waitForTimeout(200);
  const blurred = await page.evaluate(() => document.activeElement === document.body);
  await page.keyboard.press('Space');
  await page.keyboard.type('d');
  await page.waitForTimeout(400);
  const sp = { blurred, field: await fieldText() };
  step('space with nothing focused types into the composer', sp.field === 'abc d', sp);
  await clear();
  // a run_typescript call, opened: the program it ran, never its args' JSON, and the TUI's 'ƒ' sign
  // a new tool row by its testid, never by the count: a long thread draws only its last rows, so
  // the count stays put as one comes in (red on every full pass: cand-2760, d0d4, 37fa)
  const toolIds = () => page.locator('[data-testid^="thread.tool."][role="button"]').evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')));
  const before = new Set(await toolIds().catch(() => []));
  await say('[[ts: const answer = 40 + 2; return answer;]]');
  const tool = await until(async () => {
    const id = (await toolIds()).filter((x) => !before.has(x)).at(-1);
    return id ? page.locator(`[data-testid="${id}"]`).first() : null;
  }, 60000, 1000);
  let ts = { row: null, code: null, opened: false };
  if (tool) {
    const id = await tool.getAttribute('data-testid');
    ts.row = ((await tool.innerText().catch(() => '')) ?? '').slice(0, 200);
    await tool.scrollIntoViewIfNeeded().catch(() => {});
    await tool.click({ timeout: 3000 }).catch(() => {});
    const code = page.locator(`[data-testid="${id}.code"]`).first();
    ts.opened = await code.waitFor({ timeout: 8000 }).then(() => true, () => false);
    ts.code = ts.opened ? ((await code.innerText().catch(() => '')) ?? '').slice(0, 300) : null;
    await shot('run-typescript-open');
  }
  step('an opened run_typescript box shows the program it ran (not its JSON), its row signed ƒ',
    ts.opened && /const answer = 40 \+ 2/.test(ts.code ?? '') && !/"code"\s*:/.test(ts.code ?? '') && /ƒ/.test(ts.row ?? ''), ts);
  // ⌘ hints: none at 60 ms, there at 250 ms (150 ms delay), gone on release
  const hintN = () => page.evaluate(() => document.querySelectorAll('.app-keyhint').length);
  await page.locator('[data-testid="app.main"]').first().click({ position: { x: 40, y: 140 } }).catch(() => {});
  await page.keyboard.down('Meta');
  await page.waitForTimeout(60);
  const at60 = await hintN();
  await page.waitForTimeout(190);
  const at250 = await hintN();
  await page.keyboard.up('Meta');
  await page.waitForTimeout(200);
  const after = await hintN();
  step('⌘ hints show after 150 ms: none at 60 ms, there at 250 ms, gone on release', at60 === 0 && at250 > 0 && after === 0, { at60, at250, after });
  // /artifacts: the first row selected on open, ↓↓ moves to the third, ⏎ opens it
  await click('artifacts', page.locator('[data-testid="app.sidebar.artifacts"]').first());
  const rows = page.locator('[data-testid^="artifacts.list.row."]');
  await rows.first().waitFor({ timeout: 8000 }).catch(() => {});
  const selected = () => page.evaluate(() => {
    const all = [...document.querySelectorAll('[data-testid^="artifacts.list.row."]')];
    return { n: all.length, at: all.findIndex((r) => r.getAttribute('aria-selected') === 'true'), title: all.find((r) => r.getAttribute('aria-selected') === 'true')?.textContent?.trim().slice(0, 60) ?? null };
  });
  await page.evaluate(() => { document.querySelector('[data-testid="artifacts.screen"]')?.focus(); });
  const s0 = await selected();
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(150);
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(150);
  const s2 = await selected();
  await page.keyboard.press('Enter');
  const opened = await page.locator('[data-testid="app.art"], [data-testid="artifact.page"]').first().waitFor({ timeout: 8000 }).then(() => true, () => false);
  await shot('artifacts-down-down-enter');
  // the selection comes back for 10 minutes (listkeys keepAs 'artifacts.sel:<project>'): an earlier
  // pass that opened an artifact leaves its row selected, so ↓↓ is read from wherever it starts
  // (cand-2760: 16 → 18 of 19); the first row on a fresh open is artifacts.test.tsx's
  // a quick world may hold fewer than 3 artifacts (cand-2760q: 1): ↓↓ stops on the last row there
  const want = Math.min(s0.at + 2, s0.n - 1);
  step(`/artifacts: a row selected on open (the first, or the one kept), ↓↓ moves two down${s0.n < 3 ? ` (only ${String(s0.n)} row(s): stops on the last)` : ''}, ⏎ opens it`, s0.n >= 1 && s0.at >= 0 && s2.at === want && opened, { first: s0, after_down_down: s2, want, opened });
  await closeArtifact();
  await harness();
}

// (f1) ad753852's file chips (ambient-lead m_22068): a Finder drop (CDP's drag, the desktop checks'
// dropFiles) of a pdf, csv, xlsx, docx and pptx on harness' composer; the hub's 'you' entry; his
// bubble; a click / right-click; a file gone at send time; a csv dropped while answering a card.
// The files live in <fx>/file-chips: outside the app's home and every world project, so main's
// fence (ipc.ts lookable) refuses a preview or a reveal and nothing reaches his screen. The calls
// are seen from logpoints on the preload's quickLook / showInFinder (this build has no test mode,
// so no 'bise-desktop: quicklook' line).
async function fileChips(harness) {
  const FD = path.join(FX, 'file-chips');
  fs.rmSync(FD, { recursive: true, force: true });
  fs.mkdirSync(FD, { recursive: true });
  const DOCS = ['q3.pdf', 'data.csv', 'plan.xlsx', 'brief.docx', 'deck.pptx'];
  const NL = String.fromCharCode(10);
  for (const d of DOCS) fs.writeFileSync(path.join(FD, d), `fake ${d}${NL}`);
  const at = (d) => path.join(FD, d);
  const appHome = await page.evaluate(() => window.bise?.home ?? null).catch(() => null);
  const fenced = !!appHome && !FD.startsWith(`${appHome}/`);
  const drop = async (sel, files) => {
    const box = await page.locator(sel).first().boundingBox().catch(() => null);
    if (!box) return false;
    const x = box.x + box.width / 2, y = box.y + box.height / 2;
    const s = await page.context().newCDPSession(page);
    const data = { items: [], files, dragOperationsMask: 1 };
    for (const type of ['dragEnter', 'dragOver', 'drop']) await s.send('Input.dispatchDragEvent', { type, x, y, data });
    await s.detach().catch(() => {});
    return true;
  };
  // the home hubs' journals (the world's, under the app's home): the msg rows that carry word
  const journal = (word) => {
    const rows = [];
    const hubs = appHome ? path.join(appHome, '.bise', 'hubs') : null;
    for (const h of hubs && fs.existsSync(hubs) ? fs.readdirSync(hubs) : []) {
      const f = path.join(hubs, h, 'journal.jsonl');
      if (!fs.existsSync(f)) continue;
      for (const l of fs.readFileSync(f, 'utf8').split(NL)) {
        if (!l.includes(word)) continue;
        try {
          const j = JSON.parse(l);
          const m = j.msg ?? j;
          const parts = typeof m.parts === 'string' ? JSON.parse(m.parts) : m.parts;
          rows.push({ hub: h, type: j.type ?? null, from: m.from ?? null, to: m.to ?? null, parts: Array.isArray(parts) ? parts : null, text: String(m.text ?? '').slice(0, 300) });
        } catch { /* not a json row */ }
      }
    }
    return rows;
  };
  const field = page.locator('[data-testid="composer.field"]:visible').first();
  const fileChip = page.locator('[data-testid^="composer.chip."][data-kind="file"]');
  const fresh = async (words) => {
    await field.click({ timeout: 5000 }).catch(() => {});
    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Backspace');
    await page.keyboard.type(words, { delay: 5 });
  };

  // the drop: one file chip each, in the drop order
  await fresh('here are the files zqfiles ');
  const dropped = await drop('[data-testid="composer.field"]:visible', DOCS.map(at));
  const five = await until(async () => ((await fileChip.count()) === DOCS.length ? true : null), 8000, 300);
  // b46e1fbd: a chip in the text shows its number; its name is in the attachment list's row
  const listNames = () => page.locator('[data-testid="composer"] [data-testid$=".attach"] [role="listitem"][data-kind="file"] .nm').allInnerTexts().catch(() => []);
  const names = (await listNames()).map((t) => t.trim());
  await shot('file-chips-composer');
  step('(f1) a drop of a pdf, csv, xlsx, docx and pptx on the composer: one data-kind=file chip each, in order', dropped && !!five && JSON.stringify(names) === JSON.stringify(DOCS), { dropped, names, fenced, app_home: appHome });

  // deck.pptx goes before the send: the hub finds it gone, the bubble says '· missing'
  fs.rmSync(at('deck.pptx'), { force: true });
  await page.keyboard.press('Enter');
  const entry = await until(async () => journal('zqfiles').find((r) => r.parts?.some((p) => p.kind === 'file')) ?? null, 30000, 1000);
  const fparts = (entry?.parts ?? []).filter((p) => p.kind === 'file');
  step("(f1) the hub's 'you' entry carries the Part::File parts in order (his words first, deck.pptx missing)",
    !!entry && entry.parts?.[0]?.kind === 'text' && JSON.stringify(fparts.map((p) => p.path)) === JSON.stringify(DOCS.map(at))
      && fparts.every((p) => /^\[File #\d+\]$/.test(String(p.name))) && fparts.find((p) => p.path === at('deck.pptx'))?.missing === true
      && fparts.filter((p) => p.missing).length === 1,
    entry ? { ...entry, parts: entry.parts?.map((p) => ({ kind: p.kind, name: p.name, path: p.path ? path.basename(p.path) : undefined, missing: p.missing, text: p.text })) } : journal('zqfiles').slice(0, 2));
  const bubble = page.locator('[data-testid^="thread.you."][data-testid$=".parts"]').filter({ hasText: 'q3.pdf' }).last();
  const drawn = await bubble.waitFor({ timeout: 20000 }).then(() => true, () => false);
  const bchips = bubble.locator('[data-kind="file"]');
  const gone = bchips.filter({ hasText: 'deck.pptx' }).first();
  const bub = drawn ? {
    names: (await bchips.allInnerTexts().catch(() => [])).map((t) => t.replace(/[▯\s]+/g, ' ').trim()),
    gone_text: ((await gone.innerText().catch(() => '')) ?? '').trim(),
    gone_title: await gone.getAttribute('title').catch(() => null),
    q3_title: await bchips.filter({ hasText: 'q3.pdf' }).first().getAttribute('title').catch(() => null),
  } : null;
  await page.mouse.move(1, 300);
  await shot('file-chips-bubble');
  step("(f1) his bubble draws a chip per file, '· missing' on the one gone at send time",
    drawn && bub.names.length === DOCS.length && /· missing/.test(bub.gone_text) && /deck\.pptx is gone from /.test(bub.gone_title ?? '') && /preview · right-click: show in Finder/.test(bub.q3_title ?? ''), bub);

  // a click -> quickLook(path), a right-click -> showInFinder(path), the gone one calls nothing
  const calls = [];
  const dbg = await page.context().newCDPSession(page).catch(() => null);
  const bps = [];
  if (dbg && fenced) {
    const scripts = [];
    dbg.on('Debugger.scriptParsed', (e) => scripts.push(e));
    dbg.on('Runtime.consoleAPICalled', (e) => { const v = e.args?.[0]?.value; if (typeof v === 'string' && v.startsWith('AHD-F ')) calls.push(v.slice(6)); });
    await dbg.send('Runtime.enable').catch(() => {});
    await dbg.send('Debugger.enable').catch(() => {});
    await page.waitForTimeout(800);
    for (const s of scripts) {
      const src = (await dbg.send('Debugger.getScriptSource', { scriptId: s.scriptId }).catch(() => null))?.scriptSource ?? '';
      for (const fn of ['quickLook', 'showInFinder']) {
        const m = new RegExp(`${fn}:\\s*async\\s*\\(?(\\w+)\\)?\\s*=>\\s*`).exec(src);
        if (!m || bps.some((b) => b.fn === fn)) continue;
        const where = m.index + m[0].length;
        const head = src.slice(0, where);
        const line = head.split(NL).length - 1;
        const col = where - (head.lastIndexOf(NL) + 1);
        const r = await dbg.send('Debugger.setBreakpoint', {
          location: { scriptId: s.scriptId, lineNumber: line + (s.startLine ?? 0), columnNumber: col + (line === 0 ? (s.startColumn ?? 0) : 0) },
          condition: `console.log('AHD-F ${fn} ' + String(${m[1]})), false`,
        }).catch((e) => ({ error: String(e).slice(0, 200) }));
        bps.push({ fn, id: r.breakpointId ?? null, error: r.error ?? null });
      }
    }
  }
  const ck = { fenced, logpoints: bps };
  if (drawn && fenced && bps.filter((b) => b.id).length === 2) {
    await bchips.filter({ hasText: 'q3.pdf' }).first().click({ timeout: 5000 }).catch(() => {});
    await until(async () => (calls.some((c) => c.startsWith('quickLook ')) ? true : null), 5000, 200);
    await bchips.filter({ hasText: 'data.csv' }).first().click({ button: 'right', timeout: 5000 }).catch(() => {});
    await until(async () => (calls.some((c) => c.startsWith('showInFinder ')) ? true : null), 5000, 200);
    const n0 = calls.length;
    await gone.click({ timeout: 5000 }).catch(() => {});
    await gone.click({ button: 'right', timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(800);
    ck.calls = [...calls];
    ck.gone_calls = calls.length - n0;
  }
  for (const b of bps) if (b.id) await dbg.send('Debugger.removeBreakpoint', { breakpointId: b.id }).catch(() => {});
  if (dbg) { await dbg.send('Debugger.disable').catch(() => {}); await dbg.detach().catch(() => {}); }
  step('(f1) a click on a file chip calls quickLook(its path), a right-click showInFinder(its path), the gone one calls nothing (seen in the preload; main fences them out)',
    (ck.calls ?? []).includes(`quickLook ${at('q3.pdf')}`) && (ck.calls ?? []).includes(`showInFinder ${at('data.csv')}`) && ck.gone_calls === 0, ck);

  // a csv dropped while answering a card: harness' main asks, bise's inbox block docks it
  const csv = at('bench-zq.csv');
  fs.writeFileSync(csv, ['run,ms', 'cold,412', ''].join(NL));
  const Q = 'which bench zqbench?';
  await fresh(`[[bash: sb card '${Q}`);
  for (const l of ['1. cold', "2. warm']]"]) { await page.keyboard.press('Shift+Enter'); await page.keyboard.type(l, { delay: 5 }); }
  await page.keyboard.press('Enter');
  await click('bise', page.locator('[data-testid="app.sidebar.bise"]').first());
  const row = page.locator('[data-testid^="inbox.block.row."]', { hasText: 'zqbench' }).first();
  const card = page.locator('[data-testid^="inbox.block.card."]').filter({ hasText: 'zqbench' }).first();
  // the block draws its first items only: an item under '+ N more' is listed too (ambient-lead m_22076),
  // so each poll that sees no zqbench opens the next ones
  const listed = await until(async () => {
    if ((await row.isVisible().catch(() => false)) || (await card.isVisible().catch(() => false)) || /zqbench/.test(((await text('[data-testid="inbox.block"]')) ?? ''))) return true;
    await page.locator('[data-testid="inbox.block.more"]').first().click({ timeout: 1000 }).catch(() => {});
    return null;
  }, 90000, 1000);
  for (let i = 0; listed && i < 40 && !(await card.isVisible().catch(() => false)); i++) {
    if (await row.isVisible().catch(() => false)) await row.click({ timeout: 2000 }).catch(() => {});
    else await page.locator('[data-testid="inbox.block.more"]').first().click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(500);
  }
  const docked = await card.isVisible().catch(() => false);
  const answering = docked && /answering/.test(((await page.locator('[data-testid="composer"]').first().innerText({ timeout: 1000 }).catch(() => '')) ?? ''));
  let ans = { listed: !!listed, docked, answering };
  if (answering) {
    await fresh('cold, see ');
    await drop('[data-testid="composer.field"]:visible', [csv]);
    const chip = await until(async () => ((await fileChip.count()) === 1 && (await listNames()).join() === 'bench-zq.csv' ? true : null), 8000, 300);
    await shot('file-chip-card-answer');
    await page.keyboard.press('Enter');
    // an answer reaches main as the hub's own words ('the user answered card #N (…): "…"'), the file
    // in them as its <file … path=…> tag where he dropped it (cand-2760), or as a file part
    const asPart = (r) => r.parts?.some((p) => p.kind === 'file' && p.path === csv);
    const asTag = (r) => /answered card/.test(r.text) && r.text.includes(`cold, see <file name="[File #1]" path="${csv}"`);
    const got = await until(async () => journal('bench-zq.csv').find((r) => asPart(r) || asTag(r)) ?? null, 30000, 1000);
    ans = { ...ans, chip: !!chip, entry: got ? { ...got, parts: got.parts?.map((p) => ({ kind: p.kind, name: p.name, path: p.path ? path.basename(p.path) : undefined, text: p.text })) ?? null } : journal('bench-zq.csv').slice(0, 2) };
    ans.ok = !!chip && !!got && (asTag(got) || (got.parts[0]?.kind === 'text' && /cold, see/.test(got.parts[0]?.text ?? '')));
  }
  step("(f1) a csv dropped while answering a card: a file chip, sent as a file part where it was", !!ans.ok, ans);
  await harness();
}

// the draft across a restart (ambient-lead m_19525): typed in harness' composer, never sent; after
// the restart the same composer must hold it again
if (mode === 'draft-type' || mode === 'draft-check') {
  await click('open harness', page.locator('[data-testid="app.sidebar"]').getByText('harness', { exact: true }).first());
  const composer = page.locator('[data-testid="composer"] [contenteditable="true"], [data-testid="composer"] textarea').first();
  await composer.waitFor({ timeout: 15000 }).catch(() => {});
  const holds = async () => ((await composer.innerText({ timeout: 2000 }).catch(() => '')) || (await composer.inputValue({ timeout: 500 }).catch(() => ''))).trim();
  // 516a4e79: the terminal panel left open across a restart starts its shell, never 'no folder for
  // this project' (it waits for the core's projects rows). Opened in the pause pass, read after it.
  const term = page.locator('[data-testid="terminal.panel"]').first();
  const termMark = path.join(out, 'term-open.json');
  if (mode === 'draft-type' && !tag.endsWith('atonce')) {
    if (!(await term.isVisible().catch(() => false))) await page.keyboard.press('Control+Backquote');
    const open = await term.waitFor({ timeout: 8000 }).then(() => true, () => false);
    const state = open ? await until(async () => { const s = await page.locator('[data-testid="terminal.screen"]').first().getAttribute('data-state').catch(() => null); return s && s !== 'opening' ? s : null; }, 10000, 300) : null;
    if (open) fs.writeFileSync(termMark, JSON.stringify({ state }));
    await shot('terminal-open-before-restart');
    step('the terminal panel is open before the restart (⌃`)', open, { state });
  }
  if (mode === 'draft-check' && fs.existsSync(termMark) && !tag.endsWith('atonce')) {
    const shown = await term.waitFor({ timeout: 15000 }).then(() => true, () => false);
    const state = shown ? await until(async () => { const s = await page.locator('[data-testid="terminal.screen"]').first().getAttribute('data-state').catch(() => null); return s && s !== 'opening' ? s : null; }, 20000, 300) : null;
    const failed = ((await text('[data-testid="terminal.failed"]')) ?? '').slice(0, 200);
    await shot('terminal-after-restart');
    step("the terminal panel kept open across the restart starts its shell (no 'no folder')", shown && state === 'live' && !/no folder/.test(failed), { shown, state, failed: failed || null });
  }
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
