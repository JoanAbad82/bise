// app/theme · his theme pref (ambient-lead m_10785; ambient found only the system appearance
// switched the app): prefs.theme 'dark' | 'light' | 'system' on <html data-theme>, in the window and
// the capsule. One test per value: 'dark' draws dark under a light system, 'light' draws light under
// a dark system, 'system' carries no attribute and follows the appearance both ways; a prefs change
// while the app runs applies at once. Reads the DS's --p-bg (dark #141211, light #fdfbf7) and the
// body's computed background. Owner: amb-web. The new app on the scripted core.
import type { Page } from '@playwright/test';
import { FakeCore, FakeHelper, launchDesktop, test, expect } from '../../harness';
import { capsulePage } from '../native/world';

const HOME = 'bise-home-00000000';
const DARK = '#141211';
const LIGHT = '#fdfbf7';

const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: {
    onboarded: true,
    theme,
    context: { shot: true, url: true, file: true, window_text: false },
    excluded_apps: [],
    quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true },
    voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' },
    shots_keep_days: 7,
  },
});
const world = (theme: string) => [
  prefs(theme),
  { ev: 'projects', projects: [{ project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true }] },
  { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere', name: 'bise' },
  { ev: 'agents', project: HOME, agents: [{ name: 'main', main: true, status: 'idle', archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: 0 }] },
  { ev: 'thread', project: HOME, agent: 'main', entries: [{ pos: 1, at_ms: 1791100001000, kind: 'agent', text: 'hello' }], before: null, more: false },
];

/** What a page's root carries and draws. */
const look = (page: Page) =>
  page.evaluate(() => {
    const root = document.documentElement;
    return {
      attr: root.getAttribute('data-theme'),
      bg: getComputedStyle(root).getPropertyValue('--p-bg').trim().toLowerCase(),
    };
  });

async function themed(theme: string, run: (pages: { win: Page; cap: Page; core: FakeCore }) => Promise<void>): Promise<void> {
  const helper = new FakeHelper();
  const core = new FakeCore(world(theme) as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ helper, core });
  try {
    await expect(s.page.getByTestId('thread.screen')).toBeVisible({ timeout: 10_000 });
    await run({ win: s.page, cap: await capsulePage(s), core });
  } finally {
    await s.close();
    helper.dispose();
    core.dispose();
  }
}

/** Both surfaces show `want` (attribute, palette) within a few seconds. */
async function both(pages: Page[], want: { attr: string | null; bg: string }, why: string): Promise<void> {
  for (const p of pages) await expect.poll(() => look(p), { message: why, timeout: 4000 }).toEqual(want);
}

test("app/theme dark: dark under a light system, in the window and the capsule; light when he picks it", async () => {
  await themed('dark', async ({ win, cap, core }) => {
    for (const p of [win, cap]) await p.emulateMedia({ colorScheme: 'light' });
    await both([win, cap], { attr: 'dark', bg: DARK }, "his 'dark' wins over the light system");
    await win.screenshot({ path: test.info().outputPath('dark.png') });
    await core.send(prefs('light') as never);
    await both([win, cap], { attr: 'light', bg: LIGHT }, "a change to 'light' applies at once");
  });
});

test("app/theme light: light under a dark system, in the window and the capsule", async () => {
  await themed('light', async ({ win, cap }) => {
    for (const p of [win, cap]) await p.emulateMedia({ colorScheme: 'dark' });
    await both([win, cap], { attr: 'light', bg: LIGHT }, "his 'light' wins over the dark system");
    await win.screenshot({ path: test.info().outputPath('light.png') });
  });
});

test("app/theme system: no attribute, follows the appearance both ways; 'auto' is system; from 'light' back to system", async () => {
  await themed('light', async ({ win, cap, core }) => {
    for (const p of [win, cap]) await p.emulateMedia({ colorScheme: 'dark' });
    await both([win, cap], { attr: 'light', bg: LIGHT }, 'light first');
    await core.send(prefs('system') as never);
    await both([win, cap], { attr: null, bg: DARK }, "'system' clears it: dark under a dark system");
    for (const p of [win, cap]) await p.emulateMedia({ colorScheme: 'light' });
    await both([win, cap], { attr: null, bg: LIGHT }, "'system': light under a light system");
    await core.send(prefs('auto') as never);
    await both([win, cap], { attr: null, bg: LIGHT }, "the old 'auto' is system");
  });
});
