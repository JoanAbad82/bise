// composer/question-space (his ask, main m_22096, ambient-lead m_22098): '?' never opens the key list, a
// message may start with it, focused or not; ⌘/ still does. Space with no modifier and nothing focused
// lands in the composer, the caret after it, like any other key; ⌥space and ⌘space don't. A focused
// button keeps its own space. Owner: amb-win.
import type { Page } from '@playwright/test';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

import { settings } from '../../../src/proto/words_settings.gen';
const HOME = 'bise-home-00000000';
const P = 'telemetry-cf9cb2fe';
const agent = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: 0, watching: [] });
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
      { project: P, name: 'telemetry', path: '/nowhere/telemetry', git: true, home: false, order: 1, agents: 1, working: 0, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere', name: 'bise' },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/telemetry', name: 'telemetry' },
  { ev: 'agents', project: HOME, agents: [agent('main')] },
  { ev: 'agents', project: P, agents: [agent('main')] },
  { ev: 'thread', project: P, agent: 'main', entries: [{ pos: 1, at_ms: 1791100001000, kind: 'agent', text: 'main is here' }], before: null, more: false },
];

const field = (page: Page) => page.getByTestId('composer.field');
const text = (page: Page) => field(page).evaluate((el) => el.textContent.replace(/\u00a0/gu, ' '));
const focused = (page: Page) => field(page).evaluate((el) => el.contains(document.activeElement));
/** nothing focused: a thread row clicked (the thread takes no text), no selection */
async function away(page: Page): Promise<void> {
  await page.getByTestId('thread.list').getByText('main is here').click();
  await page.evaluate(() => {
    document.getSelection()?.removeAllRanges();
    (document.activeElement as HTMLElement | null)?.blur();
  });
  expect(await focused(page), 'the composer has no focus').toBe(false);
}
/** empty the composer, focus left in it */
async function clear(page: Page): Promise<void> {
  await field(page).click();
  await page.keyboard.press('Meta+A');
  await page.keyboard.press('Backspace');
  await expect.poll(() => text(page)).toBe('');
}

test("composer/question-space: '?' starts a message, focused or not; ⌘/ opens the keys; space from the thread lands in the composer, ⌥/⌘space don't", async () => {
  const core = new FakeCore(world() as never);
  const s = await launchDesktop({ core, route: `agent/${P}/main`, size: '1100x720' });
  try {
    const { page } = s;
    await expect(page.getByTestId('thread.screen')).toHaveAttribute('data-agent', 'main', { timeout: 10_000 });
    await expect(field(page)).toBeVisible();
    const help = page.getByTestId('help.overlay');

    // '?' in the empty composer: typed, the key list stays shut
    await clear(page);
    await page.keyboard.press('Shift+Slash');
    await expect.poll(() => text(page), "'?' in the empty composer").toBe('?');
    await expect(help).toHaveCount(0);

    // '?' with nothing focused: the composer takes it, the caret after it
    await clear(page);
    await away(page);
    await page.keyboard.press('Shift+Slash');
    await expect.poll(() => text(page), "'?' from the thread lands in the composer").toBe('?');
    expect(await focused(page)).toBe(true);
    await expect(help).toHaveCount(0);
    await page.keyboard.type('x');
    await expect.poll(() => text(page), 'the caret after it').toBe('?x');

    // ⌘/ still opens the key list, esc closes it
    await away(page);
    await page.keyboard.press('Meta+Slash');
    await expect(help, '⌘/ opens the keys').toBeVisible();
    // designer m_22179: the sheet is opaque (the ds sheet's paint), its caps ink like ⌘K's, ⌘K's words
    const look = await page.locator('.help-box').evaluate((b) => {
      const cs = getComputedStyle(b);
      const ret = (k: string) => getComputedStyle(b.querySelector(`[data-keys="${k}"] .b-kbd`) as Element).color;
      return { bg: cs.backgroundImage, ret: ret('⏎'), cmdk: ret('⌘K'), text: getComputedStyle(b.querySelector('[data-keys="⌘K"] .a') as Element).color };
    });
    expect(look.bg, 'opaque: a solid under the raised tint').toContain('gradient');
    expect(look.ret, "⏎'s cap in ink, as ⌘K's").toBe(look.cmdk);
    expect(look.ret, 'ink').toBe(look.text);
    await expect(page.locator('[data-keys="⌘K"] .a')).toHaveText(settings.key_find_agent);
    await page.mouse.move(1, 300);
    await page.screenshot({ path: test.info().outputPath('help-light-1100.png') });
    // one esc closes it (its filter is empty); a second would be the window's 'back'
    await page.keyboard.press('Escape');
    await expect(help).toHaveCount(0);
    // ⌘? too, the macOS habit (designer m_22100)
    await away(page);
    await page.keyboard.press('Meta+Shift+Slash');
    await expect(help, '⌘? opens the keys').toBeVisible();
    // one esc closes it (its filter is empty); a second would be the window's 'back'
    await page.keyboard.press('Escape');
    await expect(help).toHaveCount(0);
    await page.screenshot({ path: test.info().outputPath('keyline-light-1100.png') });

    // space with nothing focused: in the composer, the caret after it
    await clear(page);
    await away(page);
    await page.keyboard.press('Space');
    expect(await focused(page), 'space took the composer').toBe(true);
    await page.keyboard.type('y');
    await expect.poll(() => text(page), "' ' then 'y'").toBe(' y');

    // ⌥space and ⌘space never go there
    await clear(page);
    for (const k of ['Alt+Space', 'Meta+Space']) {
      await away(page);
      await page.keyboard.press(k);
      expect(await focused(page), `${k}: no focus taken`).toBe(false);
      expect(await text(page), `${k}: nothing typed`).toBe('');
    }

    // a focused button keeps its own space (the head's '⋯')
    const more = page.locator('.ah-bise button, .ah button').last();
    await more.focus();
    await page.keyboard.press('Space');
    expect(await text(page), 'a focused button: no space in the composer').toBe('');
    await page.keyboard.press('Escape');
  } finally {
    await s.close();
    core.dispose();
  }
});
