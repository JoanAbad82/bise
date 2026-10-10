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

    // never: arrows, esc, enter
    await away(page, 'main');
    for (const k of ['ArrowDown', 'ArrowUp', 'Escape', 'Enter']) await page.keyboard.press(k);
    expect(await fieldFocused(page), 'arrows, esc and enter leave the focus where it is').toBe(false);
    await expect(field(page)).toHaveText(before);

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
    await page.getByTestId('app.sidebar.agent.alpha').click();
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
