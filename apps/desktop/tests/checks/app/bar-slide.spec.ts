// app/bar-slide · try-gate's red on dc4770c1 (main m_26788): the right bar slid over at 800 px
// (⌥⌘0) stayed over the window when it grew to 1400: two right bars, and the scrim took every
// click until esc. Passes when, on FakeCore:
//   - slid over at 800, then 1400: one right bar (the docked one), no slide-over, no scrim, and a
//     click reaches the window (a row of the docked bar opens its agent); back at 800 it stays closed;
//   - the reverse, docked at 1400 then 800: no bar, no scrim, a click reaches the thread, and
//     ⌥⌘0 still slides it over;
//   - the sidebar the same way: slid over at 800 (⌘\), then 1400: one sidebar, no scrim.
// The fix is in src/app/Frame.tsx's useFrame (what slid over is kept for its width class). Owner: amb-win.
import type { Page } from '@playwright/test';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const NOW = Date.now();
const prefs = {
  ev: 'prefs',
  prefs: { onboarded: true, theme: 'light', context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
};
const agent = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 600_000, waits: 0, watching: [] });
const world = [
  prefs,
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'storefront', path: '/nowhere/storefront', git: true, home: false, order: 1, agents: 3, working: 0, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/storefront', name: 'storefront' },
  { ev: 'agents', project: P, agents: [agent('main'), agent('perf'), agent('checkout')] },
  { ev: 'agents', project: HOME, agents: [agent('main')] },
  { ev: 'thread', project: P, agent: 'main', entries: [{ pos: 1, at_ms: NOW - 60_000, kind: 'agent', text: 'perf cut the hero image to 180 KB.' }], before: null, more: false },
];

const T = {
  bar: 'app.panel',
  overRight: 'app.over.right',
  overLeft: 'app.over.left',
  scrim: 'app.scrim',
  thread: 'thread.screen',
};

async function size(page: Page, width: number): Promise<void> {
  await page.setViewportSize({ width, height: 800 });
  await expect.poll(() => page.evaluate(() => window.innerWidth), { timeout: 3000 }).toBe(width);
  await page.evaluate(() => new Promise<void>((done) => { requestAnimationFrame(() => { requestAnimationFrame(() => { done(); }); }); }));
}

/** What a click at the window's centre would hit: never the scrim. */
const hitAtCentre = (page: Page): Promise<string> =>
  page.evaluate(() => {
    const el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
    return el?.closest('[data-testid]')?.getAttribute('data-testid') ?? '';
  });

async function launch(): Promise<{ page: Page; close: () => Promise<void> }> {
  const core = new FakeCore(world as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/main`, size: '1400x800' });
  await expect(s.page.getByTestId(T.thread)).toHaveAttribute('data-agent', 'main', { timeout: 10_000 });
  return {
    page: s.page,
    close: async () => {
      await s.close();
      core.dispose();
    },
  };
}

test('app/bar-slide: the right bar slid over at 800, then the window at 1400: one bar, no scrim, clicks reach the window', async () => {
  const { page, close } = await launch();
  try {
    await size(page, 800);
    await expect(page.getByTestId(T.bar), 'under 1000 px no docked bar').toHaveCount(0);
    await page.keyboard.press('Meta+Alt+Digit0');
    await expect(page.getByTestId(T.overRight).getByTestId(T.bar), '⌥⌘0 slides it over').toBeVisible();
    await expect(page.getByTestId(T.scrim)).toBeVisible();

    await size(page, 1400);
    await expect(page.getByTestId(T.overRight), 'the slide-over went').toHaveCount(0);
    await expect(page.getByTestId(T.scrim), 'the scrim went').toHaveCount(0);
    await expect(page.getByTestId(T.bar), 'one right bar, docked').toHaveCount(1);
    expect(await hitAtCentre(page), 'the centre of the window is not the scrim').not.toBe(T.scrim);
    await page.screenshot({ path: test.info().outputPath('bar-slide-800-then-1400.png') });
    // a click reaches the window: a row of the docked bar opens its agent
    await page.getByTestId('app.right.agent.perf').click();
    await expect(page.getByTestId(T.thread)).toHaveAttribute('data-agent', 'perf');

    // back at 800: it stays closed
    await size(page, 800);
    await expect(page.getByTestId(T.overRight)).toHaveCount(0);
    await expect(page.getByTestId(T.scrim)).toHaveCount(0);
    await expect(page.getByTestId(T.bar)).toHaveCount(0);
  } finally {
    await close();
  }
});

test('app/bar-slide: docked at 1400, then the window at 800: no bar, no scrim, ⌥⌘0 still slides it over', async () => {
  const { page, close } = await launch();
  try {
    await size(page, 1400);
    await expect(page.getByTestId(T.bar), 'docked at 1400').toHaveCount(1);
    await size(page, 800);
    await expect(page.getByTestId(T.bar), 'no bar at 800').toHaveCount(0);
    await expect(page.getByTestId(T.overRight)).toHaveCount(0);
    await expect(page.getByTestId(T.scrim)).toHaveCount(0);
    expect(await hitAtCentre(page), 'the centre of the window is not the scrim').not.toBe(T.scrim);
    // a click reaches the window: the composer takes the focus
    await page.getByTestId('composer.field').click();
    await expect(page.getByTestId('composer.field')).toBeFocused();
    await page.keyboard.press('Meta+Alt+Digit0');
    await expect(page.getByTestId(T.overRight).getByTestId(T.bar), '⌥⌘0 slides it over').toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId(T.overRight)).toHaveCount(0);
    await expect(page.getByTestId(T.scrim)).toHaveCount(0);
  } finally {
    await close();
  }
});

test('app/bar-slide: the sidebar slid over at 800, then the window at 1400: one sidebar, no scrim', async () => {
  const { page, close } = await launch();
  try {
    await size(page, 800);
    await page.getByTestId('app.title.sidebar').click();
    await expect(page.getByTestId(T.overLeft), 'the sidebar slides over').toBeVisible();
    await expect(page.getByTestId(T.scrim)).toBeVisible();
    await size(page, 1400);
    await expect(page.getByTestId(T.overLeft), 'the slide-over went').toHaveCount(0);
    await expect(page.getByTestId(T.scrim)).toHaveCount(0);
    await expect(page.getByTestId('app.sidebar.bise'), 'one sidebar, in its column').toHaveCount(1);
    await page.getByTestId('app.sidebar.bise').click();
    await expect(page.getByTestId(T.thread)).toHaveAttribute('data-project', HOME, { timeout: 10_000 });
  } finally {
    await close();
  }
});
