// native/chrome · one set of window controls, never a window inside the window (his try round 3,
// main m_11769 point 1, lead m_11770/m_11796). The main window is titleBarStyle hiddenInset: macOS's
// own lights sit at LIGHTS {20,20} in the 52 px bar (src/main/windows.ts; bise fait mac, b06021770), the ds
// frame's drawn dots are hidden and the frame is flat in the app (app.css), and the onboarding fills
// the window alone (no sidebar, no .b-win) under a 40 px drag strip. A page capture can't show
// macOS's lights, so they are read natively (the window's button position); the capture of the
// top-left shows that nothing drawn is left there, light and dark. The real lights are checked in
// the packed try build. Owner: amb-mac. The new app on the scripted core.
import { FakeCore, FakeHelper, launchDesktop, test, expect } from '../../harness';
import type { Page } from '@playwright/test';

const HOME = 'bise-home-00000000';
/** macOS's lights in the 52 px bar (native-mac §6), written here: windows.ts imports electron. */
const LIGHTS = { x: 20, y: 20 };

const world = (onboarded: boolean) => [
  // whole prefs, as the core sends them (rust/proto/fixtures/core_ev.jsonl): with only these 3 the
  // redesigned window drew nothing at all once onboarded (no data-testid in 6 s on 17ec33f84)
  {
    ev: 'prefs',
    prefs: {
      onboarded, theme: 'system', context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [],
      quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true },
      voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7,
    },
  },
  { ev: 'projects', projects: [{ project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true }] },
  { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere', name: 'bise' },
  { ev: 'agents', project: HOME, agents: [{ name: 'main', main: true, status: 'idle', archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: 0 }] },
  { ev: 'thread', project: HOME, agent: 'main', entries: [{ pos: 1, at_ms: 1791100001000, kind: 'agent', text: 'hello' }], before: null, more: false },
];

/**
 * The app's native windows but the capsule panel (made at start, frameless: its page is
 * index.html?surface=capsule; the page title renames the window, and a test run never shows
 * any window, so neither title nor visibility tells them apart): each with its lights' position.
 */
const windows = (s: { app: { evaluate: <T>(f: (e: typeof import('electron')) => T) => Promise<T> } }) =>
  s.app.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()
      .filter((w) => !w.isDestroyed() && !w.webContents.getURL().includes('surface=capsule'))
      .map((w) => ({ lights: process.platform === 'darwin' ? w.getWindowButtonPosition() : null })),
  );

/** What the page draws at the top-left: drawn dots, the ds frame, the drag strip. */
const drawn = (page: Page) =>
  page.evaluate(() => ({
    dots: Array.from(document.querySelectorAll<HTMLElement>('.b-lights i')).filter((i) => getComputedStyle(i).display !== 'none' && i.offsetWidth > 0).length,
    frames: document.querySelectorAll('.b-win').length,
    drag: document.querySelectorAll('.app-drag').length,
    sideDrag: Array.from(document.querySelectorAll<HTMLElement>('.b-lights')).map((e) => getComputedStyle(e).getPropertyValue('-webkit-app-region')),
  }));

async function shots(page: Page, name: string): Promise<void> {
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await page.screenshot({ path: test.info().outputPath(`${name}-top-left-${scheme}.png`), clip: { x: 0, y: 0, width: 320, height: 96 } });
  }
}

test('native/chrome: setup is one window with macOS lights only, no drawn dots, no frame inside it', async () => {
  const helper = new FakeHelper();
  const core = new FakeCore(world(false) as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ helper, core, route: 'onboarding' });
  try {
    await expect(s.page.getByTestId('setup.root')).toBeVisible({ timeout: 10_000 });
    expect(await windows(s), 'one native window, its lights over the top strip').toEqual([{ lights: LIGHTS }]);
    expect(await drawn(s.page), 'setup alone in the window under a drag strip').toEqual({ dots: 0, frames: 0, drag: 1, sideDrag: [] });
    await shots(s.page, 'setup');
  } finally {
    await s.close();
    helper.dispose();
    core.dispose();
  }
});

test('native/chrome: a thread is one window, macOS lights over the sidebar, its top a drag region, no drawn dots', async () => {
  const helper = new FakeHelper();
  // the fake core's whole world (the fixtures: bise's home and its thread, a project): this check's
  // own 5-event world left the redesigned window empty (no data-testid, no page error in 6 s on
  // d06cea41f, with whole prefs and with route 'bise' alike)
  const core = new FakeCore();
  const s = await launchDesktop({ helper, core, route: 'bise' });
  try {
    await expect(s.page.getByTestId('thread.screen')).toBeVisible({ timeout: 10_000 });
    expect(await windows(s), 'one native window, its lights over the sidebar').toEqual([{ lights: LIGHTS }]);
    // bise fait mac (b06021770): no ds frame at all in the window (.b-win, its .b-lights gone) and
    // the 52 px bar is what moves it: a drag region along the window's top
    expect(await drawn(s.page), 'the frame is the window: no drawn dots, no frame inside it').toMatchObject({ dots: 0, frames: 0 });
    const barDrag = await s.page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>('body *')).filter((e) => {
        const r = e.getBoundingClientRect();
        return getComputedStyle(e).getPropertyValue('-webkit-app-region') === 'drag' && r.top < 1 && r.height >= 40 && r.width > 0;
      }).length,
    );
    expect(barDrag, "the window's top bar moves it (a drag region)").toBeGreaterThan(0);
    await shots(s.page, 'thread');
  } finally {
    await s.close();
    helper.dispose();
    core.dispose();
  }
});
