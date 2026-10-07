// composer/lists-real · bar 2.1 / 2.2 / 2.3 (docs/desktop-bar.md) · his bug 1 ("@files, $skills,
// /commands dead"), last piece: the REAL thread's composer on the real core (amb-win fda8ee68 on
// amb-core's 40f14a12: the lists come from the TUI's own commands.rs, files.rs, skills.rs), next
// to the TUI on the same hub (lead m_10817). The world's telemetry project (a git repo: README.md,
// src/latency.py, src/alerts.py; agents p99, alerts). Real keys in both; the TUI read from its
// screen (tmux capture), its popup's rows between its ┃ rules. Passes when:
//   - '/' lists the TUI's commands in the TUI's order (every one of commands.rs the TUI lists is
//     there; the TUI's dev-build rows and the window's own screens are named, not counted);
//   - '@' gives the same first 5 rows as the TUI for the same query ('', READ, src/, lat, p9);
//   - '$' lists the TUI's skills in its order;
//   - tab inserts as the TUI ('see @READ' -> 'see README.md ', '$<q>' -> '$<name> '), the caret
//     never leaves the end and the text never shows anything but what was typed while he types;
//   - the picker's rows are shown (visible and hit-testable, ../thread/shown.ts);
//   - a /command runs: '/archive ' asks which agent (the TUI's agents), '/inbox' ⏎ opens the inbox;
//   - a send with the @ path and the $ skill reaches main as typed, and the agent reads the file
//     at that path ([[bash: cat <path>]] in his words: the scripted model runs it in main's place).
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';
import { test, expect } from '../../harness';
import { hubOf, launchOn, realWorld, transcriptHas, tui, tuiReady, type Tui, type World } from '../world';
import { expectShown, expectShownSoft } from '../thread/shown';
import { T, caretOf, fieldText, press } from './target';

const REPO = path.resolve(__dirname, '../../../../..');
/** commands.rs COMMANDS' names, in order (the TUI's dev-build rows are not in it) */
const COMMANDS = [...readFileSync(path.join(REPO, 'rust/tui/src/commands.rs'), 'utf8').matchAll(/name: "(\/[a-z-]+)"/g)].map((m) => m[1] ?? '');
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

// ---- the TUI's popup, read from its screen

/** The popup's row labels on one screen: the first word between its ┃ rules, past a mark glyph. */
function tuiRows(screen: string): string[] {
  return screen.split('\n').flatMap((l) => {
    const a = l.indexOf('┃'), b = l.lastIndexOf('┃');
    if (a < 0 || b <= a) return [];
    const toks = l.slice(a + 1, b).trim().split(/\s+/).filter(Boolean);
    let t = toks[0];
    if (t !== undefined && !/^[/$@]/.test(t) && toks.length > 1 && Array.from(t).length <= 2) t = toks[1];
    return t === undefined ? [] : [t];
  });
}

/** The popup once two captures agree and it has rows (its file index walks in the background). */
async function tuiStable(t: Tui, timeoutMs = 8000): Promise<string[]> {
  const t0 = Date.now();
  let last = '';
  for (;;) {
    await sleep(250);
    const rows = tuiRows(t.screen());
    const key = rows.join('|');
    if (rows.length > 0 && key === last) return rows;
    last = key;
    if (Date.now() - t0 > timeoutMs) return rows;
  }
}

/** The whole popup: ↓ through it (8 rows show at a time), each new row appended in its order. */
async function tuiAll(t: Tui, max = 120): Promise<string[]> {
  const all = await tuiStable(t);
  // the selection walks the 8 shown rows before the popup scrolls: stop after more than 8 still
  let still = 0;
  for (let i = 0; i < max && still < 10; i++) {
    t.keys('Down');
    await sleep(90);
    const fresh = tuiRows(t.screen()).filter((r) => !all.includes(r));
    all.push(...fresh);
    still = fresh.length ? 0 : still + 1;
  }
  return all;
}

function tuiType(t: Tui, text: string): void {
  t.keys('-l', text);
}
function tuiErase(t: Tui, n: number): void {
  if (n > 0) t.keys(...Array<string>(n).fill('BSpace'));
}

// ---- the window's picker

const appRows = async (page: Page): Promise<string[]> =>
  (await page.locator(T.picker).locator(T.pickerRow).allInnerTexts()).map((r) => r.split(/\n|\t/)[0]?.trim() ?? '').filter(Boolean);

async function appClear(page: Page): Promise<void> {
  await press(page, 'Meta+a');
  await press(page, 'Backspace');
}

/**
 * Types `text` at a person's pace while every frame records the field's text and caret: the text
 * must only ever be a prefix of what was typed and the caret at its end (no lost caret, no
 * flicker of a replaced line). Returns the frames that broke it.
 */
async function typeWatched(page: Page, text: string): Promise<string[]> {
  const sel = T.field;
  await page.evaluate((s) => {
    const g = window as unknown as { __qaRec?: { text: string; caret: number }[]; __qaStop?: boolean };
    g.__qaRec = [];
    g.__qaStop = false;
    const f = document.querySelector(s);
    const tick = (): void => {
      if (g.__qaStop || !f) return;
      const text = (f as HTMLElement).innerText.replace(/\r/g, '').replace(/\n$/, '');
      const sel = window.getSelection();
      let caret = -1;
      if (sel && sel.rangeCount) {
        const r = sel.getRangeAt(0).cloneRange();
        r.selectNodeContents(f);
        r.setEnd(sel.getRangeAt(0).endContainer, sel.getRangeAt(0).endOffset);
        caret = r.toString().length;
      }
      g.__qaRec?.push({ text, caret });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, sel);
  // an empty editor reads '\n' (its empty paragraph): the frames drop a trailing newline too
  const before = (await page.locator(sel).evaluate(fieldText)).replace(/\n$/, '');
  for (const ch of text) {
    await page.keyboard.type(ch);
    await page.waitForTimeout(45);
  }
  await page.waitForTimeout(150);
  const rec = await page.evaluate(() => {
    const g = window as unknown as { __qaRec?: { text: string; caret: number }[]; __qaStop?: boolean };
    g.__qaStop = true;
    return g.__qaRec ?? [];
  });
  const whole = before + text;
  const bad: string[] = [];
  let longest = before.length;
  for (const [i, f] of rec.entries()) {
    if (!whole.startsWith(f.text)) bad.push(`frame ${String(i)}: the field read ${JSON.stringify(f.text)}`);
    else if (f.text.length < longest) bad.push(`frame ${String(i)}: the text went back to ${JSON.stringify(f.text)}`);
    else if (f.caret !== f.text.length) bad.push(`frame ${String(i)}: the caret at ${String(f.caret)} in ${JSON.stringify(f.text)}`);
    longest = Math.max(longest, f.text.length);
  }
  return bad;
}

/** In the order of `ref`, the names both lists have: equal when the lists agree on their order. */
const orderOf = (list: string[], other: string[]): string[] => list.filter((x) => other.includes(x));

async function both(w: World): Promise<{ page: Page; t: Tui; close: () => Promise<void> }> {
  const project = path.basename(path.dirname(hubOf(w, 'telemetry').sock));
  const s = await launchOn(w, `agent/${project}/main`, T.field);
  let t: Tui | undefined;
  try {
    t = tui(w, 'telemetry');
    await tuiReady(t);
    await expect(s.page.locator(T.field), "telemetry main's thread opens with its composer").toBeVisible({ timeout: 15_000 });
  } catch (e) {
    t?.close();
    await s.close();
    throw e;
  }
  const tt = t;
  return { page: s.page, t: tt, close: async () => { tt.close(); await s.close(); } };
}

test('composer/lists-real: real core: /, @ and $ list what the TUI lists, in its order, and tab inserts as the TUI', async () => {
  test.setTimeout(240_000);
  const w = realWorld();
  const { page, t, close } = await both(w);
  try {
    const field = page.locator(T.field);
    const picker = page.locator(T.picker);
    await field.click();

    // ---- / : the whole list, in the TUI's order
    tuiType(t, '/');
    const tuiSlash = await tuiAll(t);
    t.keys('Escape'); // B21: esc clears the / query
    await sleep(200);
    const bad1 = await typeWatched(page, '/');
    await expect(picker, "'/' opens the command list").toBeVisible({ timeout: 3000 });
    await expectShown(picker.locator(T.pickerRow).first(), "the / list's first row");
    await expect.poll(async () => (await appRows(page)).length, { message: 'the / list has its rows' }).toBeGreaterThan(20);
    const appSlash = await appRows(page);
    const greyed = await picker.locator(T.pickerRow, { hasText: 'not yet' }).count();
    const tuiCore = tuiSlash.filter((n) => COMMANDS.includes(n));
    const missing = tuiCore.filter((n) => !appSlash.includes(n));
    test.info().annotations.push({ type: '/ list', description: `TUI ${String(tuiSlash.length)} rows (${String(tuiCore.length)} of commands.rs; dev-build rows: ${tuiSlash.filter((n) => !COMMANDS.includes(n)).join(' ') || 'none'}) · window ${String(appSlash.length)} rows, ${String(greyed)} 'not yet' · the window's own: ${appSlash.filter((n) => !tuiSlash.includes(n)).join(' ') || 'none'}` });
    expect.soft(tuiCore.length, "the TUI's / popup was read").toBeGreaterThan(20);
    expect.soft(missing, "the TUI's commands missing from the window's / list").toEqual([]);
    expect.soft(orderOf(appSlash, tuiCore), "the window's / list in the TUI's order").toEqual(orderOf(tuiCore, appSlash));
    expect.soft(bad1, "typing '/': no caret loss, no flicker").toEqual([]);
    await appClear(page);

    // ---- @ : the first 5 rows for the same query
    for (const q of ['', 'READ', 'src/', 'lat', 'p9']) {
      tuiType(t, `@${q}`);
      const tuiAt = (await tuiStable(t)).slice(0, 5);
      tuiErase(t, q.length + 1);
      await sleep(150);
      const bad = await typeWatched(page, `@${q}`);
      await expect(picker, `'@${q}' opens the file list`).toBeVisible({ timeout: 3000 });
      await expect
        .configure({ soft: true })
        .poll(async () => (await appRows(page)).slice(0, 5), { message: `'@${q}': the window's first 5 rows are the TUI's`, timeout: 6000 })
        .toEqual(tuiAt);
      await page.screenshot({ path: test.info().outputPath(`at-${q.replace(/\W/g, '_') || 'empty'}.png`) });
      await expectShown(picker.locator(T.pickerRow).first(), `the @${q} list's first row`);
      expect.soft(bad, `typing '@${q}': no caret loss, no flicker`).toEqual([]);
      await appClear(page);
    }

    // ---- tab inserts the bare path, as the TUI (files.rs: 'see @ap' -> 'see src/app.rs ')
    tuiType(t, 'see @READ');
    await tuiStable(t);
    t.keys('Tab');
    await sleep(300);
    const tuiLine = t.screen();
    expect.soft(tuiLine, "the TUI's tab gives 'see README.md '").toContain('see README.md');
    tuiErase(t, 'see README.md '.length);
    await typeWatched(page, 'see @READ');
    await expect(picker.locator(T.pickerRow).first()).toContainText('README.md', { timeout: 6000 });
    await press(page, 'Tab');
    await expect.poll(() => field.evaluate(fieldText), { message: "the window's tab gives 'see README.md '" }).toBe('see README.md ');
    expect((await field.evaluate(caretOf)).caret, 'the caret after the inserted path').toBe('see README.md '.length);
    await expect(picker, 'the list closes').toBeHidden();
    await appClear(page);

    // ---- $ : the whole list, in the TUI's order, and tab inserts '$name '
    tuiType(t, '$');
    const tuiSkills = await tuiAll(t, 80);
    tuiErase(t, 1);
    await sleep(150);
    const bad3 = await typeWatched(page, '$');
    await expect(picker, "'$' opens the skill list").toBeVisible({ timeout: 3000 });
    await expect.poll(async () => (await appRows(page)).length, { message: 'the $ list has its rows', timeout: 6000 }).toBeGreaterThan(0);
    const appSkills = await appRows(page);
    test.info().annotations.push({ type: '$ list', description: `TUI ${String(tuiSkills.length)}: ${tuiSkills.join(' ')} · window ${String(appSkills.length)}: ${appSkills.join(' ')}` });
    expect.soft(tuiSkills.length, "the TUI's $ popup was read").toBeGreaterThan(0);
    expect.soft(appSkills, "the window's $ list is the TUI's, in its order").toEqual(tuiSkills.slice(0, appSkills.length >= tuiSkills.length ? undefined : 50));
    expect.soft(bad3, "typing '$': no caret loss, no flicker").toEqual([]);
    const skill = (tuiSkills[0] ?? appSkills[0] ?? '$').slice(1);
    const sq = skill.slice(0, 4);
    await typeWatched(page, sq);
    await expect(picker.locator(T.pickerRow).first()).toContainText(`$${skill}`, { timeout: 3000 });
    await press(page, 'Tab');
    await expect.poll(() => field.evaluate(fieldText), { message: `tab gives '$${skill} '` }).toBe(`$${skill} `);
    await appClear(page);
    await page.screenshot({ path: test.info().outputPath('lists.png') });
  } finally {
    await close();
  }
});

test('composer/lists-real: real core: a /command runs, and a send with an @ path and a $ skill reaches main, which reads the file', async () => {
  test.setTimeout(180_000);
  const w = realWorld();
  const { page, t, close } = await both(w);
  try {
    const field = page.locator(T.field);
    const picker = page.locator(T.picker);
    await field.click();

    // /archive asks which agent: the TUI's question and its agents
    tuiType(t, '/archive ');
    const tuiArch = await tuiStable(t);
    const asks = t.screen().includes('archive which agent?');
    t.keys('Escape');
    await sleep(200);
    expect.soft(asks, "the TUI asks 'archive which agent?'").toBe(true);
    await page.keyboard.type('/archive ');
    await expect(picker, "'/archive ' asks which agent").toBeVisible({ timeout: 3000 });
    await expect
      .configure({ soft: true })
      .poll(() => appRows(page), { message: "'/archive ' lists the TUI's agents", timeout: 5000 })
      .toEqual(tuiArch.filter((r) => r !== 'archive'));
    await page.screenshot({ path: test.info().outputPath('archive-asks.png') });
    await appClear(page);
    await expect(picker).toBeHidden();

    // a send with the @ path and the $ skill: main gets them as typed and reads the file there
    const n = String(Date.now() % 1_000_000);
    await page.keyboard.type('what does @READ');
    await expect(picker.locator(T.pickerRow).first()).toContainText('README.md', { timeout: 6000 });
    await press(page, 'Tab');
    await page.keyboard.type('say? $');
    await expect(picker, "'$' opens the skill list").toBeVisible({ timeout: 3000 });
    await expect.poll(async () => (await appRows(page)).length, { timeout: 6000 }).toBeGreaterThan(0);
    const skill = ((await appRows(page))[0] ?? '$').slice(1);
    await press(page, 'Tab');
    await page.keyboard.type(`[[bash: cat README.md]] ${n}`);
    const typed = `what does README.md say? $${skill} [[bash: cat README.md]] ${n}`;
    await expect.poll(() => field.evaluate(fieldText), { message: 'the line as he composed it' }).toBe(typed);
    await press(page, 'Enter');
    await expect.poll(() => transcriptHas(w, 'telemetry', 'main', `what does README.md say? $${skill}`), { timeout: 15_000, message: "telemetry main got the path and the skill as typed" }).toBe(true);
    const answer = page.locator('[data-testid="thread.list"]').locator('[data-testid^="thread.entry."]').filter({ hasText: 'latency and error dashboards' }).last();
    await expect(answer, "main read README.md (its words are in the answer)").toHaveCount(1, { timeout: 30_000 });
    await expectShownSoft(answer, "main's answer (the thread follows it)");
    await page.screenshot({ path: test.info().outputPath('sent.png') });

    // /inbox ⏎ opens the inbox (a window command)
    await field.click();
    await page.keyboard.type('/inbox');
    await expect(picker.locator(T.pickerRow).first()).toContainText('/inbox', { timeout: 3000 });
    await press(page, 'Enter');
    await expect(page.getByTestId('inbox.root'), "'/inbox' opens the inbox").toBeVisible({ timeout: 3000 });
  } finally {
    await close();
  }
});
