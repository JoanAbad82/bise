// native/chrome · one set of window controls, never a window inside the window (his try round 3,
// main m_11769 point 1, lead m_11770/m_11796). The main window is titleBarStyle hiddenInset: macOS's
// own lights sit at LIGHTS {16,13} over the sidebar's 36 px top room (src/main/windows.ts), the ds
// frame's drawn dots are hidden and the frame is flat in the app (app.css), and the onboarding fills
// the window alone (no sidebar, no .b-win) under a 36 px drag strip. A page capture can't show
// macOS's lights, so they are read natively (the window's button position); the capture of the
// top-left shows that nothing drawn is left there, light and dark. The real lights are checked in
// the packed try build. Owner: amb-mac. The new app on the scripted core.
import { FakeCore, FakeHelper, launchDesktop, test, expect } from '../../harness';
import type { Page } from '@playwright/test';

const HOME = 'bise-home-00000000';

const world = (onboarded: boolean) => [
  { ev: 'prefs', prefs: { onboarded, theme: 'system', excluded_apps: [] } },
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
    expect(await windows(s), 'one native window, its lights over the top strip').toEqual([{ lights: { x: 16, y: 13 } }]);
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
  const core = new FakeCore(world(true) as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ helper, core });
  try {
    await expect(s.page.getByTestId('thread.screen')).toBeVisible({ timeout: 10_000 });
    expect(await windows(s), 'one native window, its lights over the sidebar').toEqual([{ lights: { x: 16, y: 13 } }]);
    expect(await drawn(s.page), 'the frame is the window: no drawn dots, the sidebar top moves it').toEqual({ dots: 0, frames: 1, drag: 0, sideDrag: ['drag'] });
    await shots(s.page, 'thread');
  } finally {
    await s.close();
    helper.dispose();
    core.dispose();
  }
});
