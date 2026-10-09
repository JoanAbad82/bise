// composer/option-keys · the user on cb1f2b44 (main m_14129, ambient-lead m_14132): « Il semblerait
// que les shortcuts basés sur option ne marchent pas quand on a l'input en sélection ». The ⌥ keys
// work from the composer, as in the terminal (rust/tui/src/run.rs switching_agents_leaves_zen: ⌥1
// goes to agent 1 and the composer keeps its draft; ⌥↑↓ only on an empty composer). ⌥ + a letter
// is typing: the TUI takes no ⌥ letter from the composer, so ⌥c still types its character.
// Owner: amb-web. The real thread screen on the scripted core, the composer focused with words in
// it, keys sent through CDP as macOS sends them: ⌥1 on a U.S. layout is key '¡', code Digit1,
// with the text '¡' (Chromium types that text unless the keydown is taken).
import type { CDPSession, Page } from '@playwright/test';
import { FakeCore, FakeHelper, launchDesktop, test, expect } from '../../harness';

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
      { project: P, name: 'telemetry', path: '/nowhere/telemetry', git: true, home: false, order: 1, agents: 3, working: 0, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere', name: 'bise' },
  { ev: 'agents', project: HOME, agents: [agent('main')] },
  { ev: 'agents', project: P, agents: [agent('main'), agent('alpha'), agent('beta')] },
  thread('main'),
  thread('alpha'),
  thread('beta'),
];

/** A key as macOS gives it to Chromium: ⌥ held, the layout's character as key and text. */
async function optionKey(cdp: CDPSession, key: string, code: string, vk: number): Promise<void> {
  const base = { modifiers: 1, key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk };
  await cdp.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Alt', code: 'AltLeft', modifiers: 1, windowsVirtualKeyCode: 18 });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', ...base, text: key, unmodifiedText: key });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', ...base });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Alt', code: 'AltLeft', modifiers: 0, windowsVirtualKeyCode: 18 });
}

const screen = (page: Page) => page.getByTestId('thread.screen');
const field = (page: Page) => page.getByTestId('composer.field');

test('composer/option-keys: ⌥1 and ⌥2 open agents from a focused composer with words in it; ⌥c still types ©', async () => {
  test.setTimeout(60_000);
  const core = new FakeCore(world() as never);
  const s = await launchDesktop({ helper: new FakeHelper(), core, route: `agent/${P}/main` });
  try {
    const { page } = s;
    const cdp = await page.context().newCDPSession(page);
    await expect(screen(page), "main's thread").toHaveAttribute('data-agent', 'main', { timeout: 10_000 });
    await field(page).click();
    await page.keyboard.type('a draft for main');
    await expect(field(page)).toHaveText('a draft for main');
    await page.screenshot({ path: test.info().outputPath('1-main-draft.png') });

    // ⌥1 from the composer, words in it: agent 1, no '¡' typed anywhere
    await optionKey(cdp, '¡', 'Digit1', 49);
    await expect(screen(page), '⌥1 from the focused composer opens agent 1').toHaveAttribute('data-agent', 'alpha', { timeout: 5000 });
    await page.screenshot({ path: test.info().outputPath('2-alt-1-alpha.png') });

    await field(page).click();
    await page.keyboard.type('and one for alpha');
    await optionKey(cdp, '™', 'Digit2', 50);
    await expect(screen(page), '⌥2 from the focused composer opens agent 2').toHaveAttribute('data-agent', 'beta', { timeout: 5000 });

    // ⌥ + a letter is the layout's character: the TUI leaves it to typing, so does the window
    await field(page).click();
    await page.keyboard.type('copyright ');
    await optionKey(cdp, '©', 'KeyC', 67);
    await expect(field(page), '⌥c types ©').toHaveText('copyright ©');
    await expect(screen(page), '⌥c moves nothing').toHaveAttribute('data-agent', 'beta');
    await page.screenshot({ path: test.info().outputPath('3-alt-c-types.png') });

    // the drafts stay where they were written, without the ⌥ digits' characters
    await optionKey(cdp, '¡', 'Digit1', 49);
    await expect(screen(page)).toHaveAttribute('data-agent', 'alpha', { timeout: 5000 });
    await expect(field(page), "alpha's draft is kept, no '¡' in it").toHaveText('and one for alpha');
    await page.screenshot({ path: test.info().outputPath('4-back-to-alpha.png') });

    // « l'input en sélection », read both ways. (a) his words selected in the composer (⌘A): ⌥2 still opens agent 2
    await field(page).click();
    await page.keyboard.press('Meta+KeyA');
    await optionKey(cdp, '™', 'Digit2', 50);
    await expect(screen(page), '⌥2 with the composer\'s words selected opens agent 2').toHaveAttribute('data-agent', 'beta', { timeout: 5000 });
    // (b) words selected in the thread (the quote's selection): ⌥1 is the window's key, never a quote of '¡'
    const row = page.getByTestId('thread.list').getByText('beta is here');
    await row.selectText();
    await page.screenshot({ path: test.info().outputPath('5-thread-selection.png') });
    await optionKey(cdp, '¡', 'Digit1', 49);
    await expect(screen(page), '⌥1 with words selected in the thread opens agent 1').toHaveAttribute('data-agent', 'alpha', { timeout: 5000 });
    await expect(field(page), "no quote and no '¡' went into alpha's draft").toHaveText('and one for alpha');
    await page.screenshot({ path: test.info().outputPath('6-alt-1-from-selection.png') });
    await cdp.detach();
  } finally {
    await s.close();
  }
});
