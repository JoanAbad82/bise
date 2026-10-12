// composer/type-anywhere · the user (main m_16044, ambient-lead m_16046): « quand je tape sur mon
// keyboard ou quand je paste quelque chose, ça sélectionne l'input tout seul » (Slack, Vibe Desktop;
// rules from le-chat-web's use-auto-focus-message-input.ts, see src/composer/grab.ts). Owner: amb-web.
// The real thread screen on the scripted core. Focus on no field (a thread row clicked), then:
// 'a', a French-layout 'é', a dead key (^ then e), a text paste and an image paste each land in the
// composer with the caret at the end. Never taken: ⌘K (its own field gets the keys), arrows, esc,
// enter, and a focused settings field (the agent's rename).
import path from 'node:path';
import type { CDPSession, Page } from '@playwright/test';
import { FakeCore, FakeHelper, launchDesktop, test, expect } from '../../harness';

const PNG_FILE = path.join(__dirname, '../fixtures/checker.png');
const HOME = 'bise-home-00000000';
const P = 'telemetry-cf9cb2fe';
const agent = (name: string, over: Record<string, unknown> = {}) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: 0, ...over });
const thread = (name: string) => ({ ev: 'thread', project: P, agent: name, entries: [{ pos: 1, at_ms: 1791100001000, kind: 'agent', text: `${name} is here` }], before: null, more: false });
const world = () => [
  {
    ev: 'prefs',
    prefs: {
      onboarded: true,
      theme: 'light',
      context: { shot: true, url: true, file: true, window_text: false },
      excluded_apps: [],
      quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true },
      voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' },
      shots_keep_days: 7,
    },
  },
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'telemetry', path: '/nowhere/telemetry', git: true, home: false, order: 1, agents: 2, working: 0, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere', name: 'bise' },
  { ev: 'agents', project: HOME, agents: [agent('main')] },
  { ev: 'agents', project: P, agents: [agent('main'), agent('alpha')] },
  thread('main'),
  thread('alpha'),
];

const must = <T,>(v: T | null | undefined, why: string): T => {
  if (v == null) throw new Error(why);
  return v;
};
const field = (page: Page) => page.getByTestId('composer.field');
const fieldFocused = (page: Page) => field(page).evaluate((el) => el.contains(document.activeElement));
/** The caret is collapsed at the field's very end. */
const caretAtEnd = (page: Page) =>
  field(page).evaluate((el) => {
    const s = document.getSelection();
    if (s === null || !s.isCollapsed || s.focusNode === null || !el.contains(s.focusNode)) return false;
    const r = document.createRange();
    r.selectNodeContents(el);
    r.setStart(s.focusNode, s.focusOffset);
    return r.toString() === '';
  });

/** Focus on no field: a thread row clicked (the thread list takes no text). */
async function away(page: Page, name: string): Promise<void> {
  await page.getByTestId('thread.list').getByText(`${name} is here`).click();
  await page.evaluate(() => document.getSelection()?.removeAllRanges());
  expect(await fieldFocused(page), 'the composer has no focus').toBe(false);
}

/** A key as macOS gives it to Chromium on a French layout: key and text, no modifier. */
async function layoutKey(cdp: CDPSession, key: string, code: string, vk: number): Promise<void> {
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, text: key, unmodifiedText: key, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
}

/** A dead key then its letter, as the French layout's ^ then e: 'Dead' keydown, the accent
 *  composed, then the letter commits 'ê'. */
async function deadKey(cdp: CDPSession): Promise<void> {
  await cdp.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Dead', code: 'BracketLeft', windowsVirtualKeyCode: 221, nativeVirtualKeyCode: 33 });
  await cdp.send('Input.imeSetComposition', { text: '^', selectionStart: 1, selectionEnd: 1 });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Dead', code: 'BracketLeft', windowsVirtualKeyCode: 221, nativeVirtualKeyCode: 33 });
  await cdp.send('Input.insertText', { text: 'ê' });
}

test('composer/type-anywhere: a key or a paste with no field focused lands in the composer, caret at the end; ⌘K, arrows, esc, enter and a settings field keep theirs', async () => {
  test.setTimeout(90_000);
  const core = new FakeCore(world() as never);
  const s = await launchDesktop({ helper: new FakeHelper(), core, route: `agent/${P}/main` });
  try {
    const { page, app } = s;
    const cdp = await page.context().newCDPSession(page);
    await expect(page.getByTestId('thread.screen'), "main's thread").toHaveAttribute('data-agent', 'main', { timeout: 10_000 });
    await expect(field(page)).toBeVisible();

    // 'a' with the thread row clicked: the composer, focused
    await away(page, 'main');
    await page.keyboard.press('a');
    await expect(field(page), "'a' typed from the thread lands in the composer").toHaveText('a');
    expect(await fieldFocused(page), 'the composer has the focus').toBe(true);
    await page.screenshot({ path: test.info().outputPath('1-typed-a.png') });

    // the French layout's é key (key 'é', code Digit2): at the end, never before the 'a'
    await away(page, 'main');
    await layoutKey(cdp, 'é', 'Digit2', 50);
    await expect(field(page), "'é' goes after the 'a'").toHaveText('aé');
    expect(await caretAtEnd(page), 'caret at the end').toBe(true);

    // a dead key: ^ then e is 'ê'
    await away(page, 'main');
    await deadKey(cdp);
    await expect(field(page), 'the dead key composes in the composer').toHaveText('aéê');
    expect(await caretAtEnd(page), 'caret at the end').toBe(true);
    await page.screenshot({ path: test.info().outputPath('2-accents.png') });

    // a text paste
    // on the app's private test clipboard (the fence of test mode), never his pasteboard
    const seeded = await app.evaluate(
      (_e, text) => (globalThis as unknown as { __biseTestClip?: (o: unknown) => Promise<boolean> }).__biseTestClip?.({ text }) ?? false,
      ' and pasted words',
    );
    expect(seeded, "main's test hook took the text").toBe(true);
    await away(page, 'main');
    await page.keyboard.press('Meta+V');
    await expect(field(page), '⌘V of a text lands at the end').toHaveText('aéê and pasted words');
    expect(await fieldFocused(page)).toBe(true);
    expect(await caretAtEnd(page), 'caret at the end').toBe(true);

    // an image paste: its chip
    const staged = await app.evaluate(
      (_e, file) => (globalThis as unknown as { __biseTestClip?: (o: unknown) => Promise<boolean> }).__biseTestClip?.({ file }) ?? false,
      PNG_FILE,
    );
    expect(staged, "main's test hook read the PNG").toBe(true);
    await away(page, 'main');
    await page.keyboard.press('Meta+V');
    const chip = page.locator('[data-testid^="composer.chip."][data-kind="image"]');
    await expect(chip, '⌘V of an image is its chip in the composer').toHaveCount(1, { timeout: 5000 });
    expect(await caretAtEnd(page), 'caret after the chip').toBe(true);
    await page.screenshot({ path: test.info().outputPath('3-pasted.png') });
    // textContent, like toHaveText reads it (innerText adds the chip's line breaks)
    const before = (await field(page).textContent()) ?? '';

    // never: arrows, enter
    await away(page, 'main');
    for (const k of ['ArrowDown', 'ArrowUp', 'Enter']) await page.keyboard.press(k);
    expect(await fieldFocused(page), 'arrows and enter leave the focus where it is').toBe(false);
    await expect(field(page)).toHaveText(before);
    // never esc either: with no field focused it goes up the hierarchy (main → bise, the
    // desktop-history page, src/app/esc-up.ts); ⌘[ comes back to main's composer, its words kept
    // what the arrows and enter opened in the thread takes the first escs (its esc ladder); the
    // next goes up. None of them lands in the composer.
    // where the window is: the thread's project (bise is the home project's main, so its
    // thread.screen says data-agent="main" too, and both composers read 'write to bise')
    const screen = page.getByTestId('thread.screen');
    const inP = async () => (await screen.getAttribute('data-project')) === P;
    for (let i = 0; i < 4 && (await inP()); i += 1) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(150);
      expect(await fieldFocused(page), 'an esc gives the composer no focus').toBe(false);
      if (await inP()) await expect(field(page), "an esc puts nothing in main's composer").toHaveText(before);
    }
    await expect(screen, 'esc goes up to bise, not into the composer').toHaveAttribute('data-project', HOME, { timeout: 3000 });
    await page.keyboard.press('Meta+BracketLeft');
    await expect(screen, '⌘[ back to main').toHaveAttribute('data-project', P, { timeout: 3000 });
    await expect(field(page), "main's words stay, the esc took none").toHaveText(before);
    expect(await fieldFocused(page), 'esc and ⌘[ give the composer no focus').toBe(false);

    // never ⌘K: the palette opens and its own field gets the next key
    await page.keyboard.press('Meta+K');
    const pal = page.getByTestId('app.palette.field');
    await expect(pal, '⌘K opens the palette').toBeVisible({ timeout: 3000 });
    await page.keyboard.press('x');
    await expect(pal, "the palette's field has the 'x'").toHaveValue('x');
    await expect(field(page), 'the composer got nothing').toHaveText(before);
    await page.screenshot({ path: test.info().outputPath('4-palette-keeps.png') });
    await page.keyboard.press('Escape');
    await expect(pal).toHaveCount(0);

    // never a focused settings field: alpha's rename keeps its keys
    await page.getByTestId('app.right.agent.alpha').click();
    await expect(page.getByTestId('thread.screen')).toHaveAttribute('data-agent', 'alpha', { timeout: 5000 });
    await page.getByTestId('thread.more').click();
    const rename = page.locator('[data-testid="agents.rename.alpha"]');
    await expect(rename, "alpha's settings").toBeVisible({ timeout: 3000 });
    await rename.fill('');
    await rename.click();
    await page.keyboard.type('beta');
    await expect(rename, 'the rename field has the keys').toHaveValue('beta');
    await expect(field(page), "alpha's composer got nothing").toHaveText('');
    await page.screenshot({ path: test.info().outputPath('5-settings-keeps.png') });
    await cdp.detach();
  } finally {
    await s.close();
  }
});

// designer m_16238, ambient-lead m_16248: a key or a paste that lands in the composer never scrolls
// the thread; the caret appears, his reading place stays (±1 px).
test('composer/type-anywhere: with the thread scrolled up, a key and a paste land in the composer and the thread does not move', async () => {
  test.setTimeout(60_000);
  const long = {
    ev: 'thread',
    project: P,
    agent: 'main',
    entries: Array.from({ length: 80 }, (_, i) => ({ pos: i + 1, at_ms: 1791100001000 + i * 1000, kind: 'agent', text: `line ${i + 1} of main's long thread, enough words to fill a row` })),
    before: null,
    more: false,
  };
  const core = new FakeCore([...world().filter((e) => !(e.ev === 'thread' && (e as { agent?: string }).agent === 'main')), long] as never);
  const s = await launchDesktop({ helper: new FakeHelper(), core, route: `agent/${P}/main` });
  try {
    const { page, app } = s;
    await expect(page.getByTestId('thread.screen'), "main's thread").toHaveAttribute('data-agent', 'main', { timeout: 10_000 });
    await expect(page.getByTestId('thread.entry.80'), 'the thread opens at its end').toBeVisible({ timeout: 10_000 });
    const top = () =>
      page.evaluate(() => {
        const el = document.querySelector<HTMLElement>('.th-list [data-virtuoso-scroller="true"]');
        return el === null ? -1 : el.scrollTop;
      });
    // scrolled up, far from the end, the way he does it: a wheel up unsticks the list from its
    // end (ThreadList's stick); a scrollTop set from a script would be pulled back to the end
    const end = await top();
    const box = must(await page.locator('.th-list [data-virtuoso-scroller="true"]').boundingBox(), 'the thread list is on screen');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    // up by small steps, to the middle: neither end, so a move either way shows
    expect(end, 'a thread long enough to scroll').toBeGreaterThan(800);
    for (let i = 0; i < 20 && (await top()) > end - 600; i += 1) {
      await page.mouse.wheel(0, -150);
      await page.waitForTimeout(80);
    }
    await page.waitForTimeout(300);
    const mid = await top();
    expect(mid, 'the thread scrolls up').toBeLessThan(end - 300);
    expect(mid, 'not at the top either').toBeGreaterThan(0);
    await expect(page.getByTestId('thread.entry.80'), 'scrolled up: the last line is out of view').not.toBeInViewport();
    // the row he reads: the one in the middle of the list, and its y on screen
    const reading = () =>
      page.evaluate(() => {
        const el = document.querySelector<HTMLElement>('.th-list [data-virtuoso-scroller="true"]');
        const r = el?.getBoundingClientRect();
        const row = r === undefined ? null : document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest<HTMLElement>('[data-testid^="thread.entry."]');
        return row == null ? null : { id: row.dataset.testid ?? '', y: row.getBoundingClientRect().top };
      });
    const yOf = (id: string) => page.evaluate((t) => document.querySelector(`[data-testid="${t}"]`)?.getBoundingClientRect().top ?? null, id);
    const stays = async (was: { id: string; y: number }, why: string) => {
      await page.waitForTimeout(300); // the frames after: a list that re-measures moves late
      const y = await yOf(was.id);
      expect(y, `${why}: the row he reads (${was.id}) is still drawn`).not.toBeNull();
      expect(Math.abs((y ?? 0) - was.y), `${why}: the row he reads stays (was y ${String(was.y)}, now ${String(y)})`).toBeLessThanOrEqual(1);
    };
    // focus on no field: a click on the row under the pointer, the way he does it. Not a
    // locator click: Playwright scrolls its target into view first, a script scroll that the
    // virtual list then re-measures and corrects ~100 ms later (846 px on this thread), which
    // is not his
    const clickAway = async () => {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.evaluate(() => document.getSelection()?.removeAllRanges());
      expect(await fieldFocused(page), 'the composer has no focus').toBe(false);
      await page.waitForTimeout(300);
    };
    await clickAway();
    const was = must(await reading(), 'a row in the middle of the list');
    expect(await top(), 'scrolled up, not at the end').toBeLessThan(end - 300);

    // a click in the composer
    await field(page).click();
    expect(await fieldFocused(page), 'the click focused the composer').toBe(true);
    await stays(was, 'a click in the composer');

    // a key, focus on no field: it lands in the composer
    await clickAway();
    const was1 = must(await reading(), 'a row in the middle of the list, before the key');
    await page.keyboard.press('a');
    await expect(field(page), "'a' lands in the composer").toHaveText('a');
    expect(await fieldFocused(page), 'the composer has the focus').toBe(true);
    await stays(was1, 'a key');

    // a paste, focus on no field: it lands in the composer
    const seeded = await app.evaluate(
      (_e, text) => (globalThis as unknown as { __biseTestClip?: (o: unknown) => Promise<boolean> }).__biseTestClip?.({ text }) ?? false,
      ' pasted',
    );
    expect(seeded, "main's test hook took the text").toBe(true);
    await clickAway();
    const was2 = must(await reading(), 'a row in the middle of the list, before the paste');
    await page.keyboard.press('Meta+V');
    await expect(field(page), 'the paste lands in the composer').toHaveText('a pasted');
    await stays(was2, 'a paste');
    expect(Math.abs(was2.y - was.y) <= 1 && was2.id === was.id, `three clicks on the list put him nowhere else (${was.id} ${String(was.y)} -> ${was2.id} ${String(was2.y)})`).toBe(true);
    await page.screenshot({ path: test.info().outputPath('6-no-scroll.png') });
  } finally {
    await s.close();
  }
});
