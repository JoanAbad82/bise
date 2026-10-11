// app/add-sheet · ambient-lead m_18949 (his as-he-does run: the sidebar's '+ add a project' only
// routed to settings, no sheet). The window mounts amb-home's add sheet once (AddSheetHost,
// fee2a555; the ds Sheet, designer's S11 v2 shot 19): the sidebar's '+ add a project' and ⌘N open
// it over the screen he is on (the route doesn't move), esc closes it. Passes when, on FakeCore:
//   - a click on app.sidebar.add opens settings.add (the scrim over the window) and asks found_scan;
//   - esc closes it and he is still on bise's thread;
//   - ⌘N opens the same sheet, esc closes it again.
// Frames: add-sheet-{light,dark}.png at 1100. Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const SHOP = 'shop-5e6f7a8b';
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
const home = { project: HOME, name: 'bise', path: '/nowhere/bise', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true };
const shop = { project: SHOP, name: 'shop', path: '/nowhere/shop', git: true, home: false, order: 1, agents: 1, working: 0, waits: 0, running: true };
const agent = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: Date.now() - 600_000, waits: 0 });
const world = (theme: string) => [
  prefs(theme),
  { ev: 'projects', projects: [home, shop] },
  { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere/bise', name: 'bise' },
  { ev: 'agents', project: HOME, agents: [agent('main')] },
  { ev: 'welcome', project: SHOP, proto: 1, workspace: '/nowhere/shop', name: 'shop' },
  { ev: 'agents', project: SHOP, agents: [agent('main')] },
];

for (const theme of ['light', 'dark']) {
  test(`app/add-sheet: the sidebar's '+ add a project' and ⌘N open the add sheet in place, esc closes it (${theme})`, async () => {
    const core = new FakeCore(world(theme) as unknown as ConstructorParameters<typeof FakeCore>[0]);
    const s = await launchDesktop({ core, route: 'bise', size: '1100x720' });
    try {
      const { page } = s;
      const add = page.getByTestId('app.sidebar.add');
      await expect(add).toBeVisible({ timeout: 10_000 });
      const sheet = page.getByTestId('settings.add');
      await expect(sheet).toBeHidden();

      await add.click();
      await expect(sheet, 'the sidebar button opens the sheet').toBeVisible({ timeout: 2000 });
      await expect(page.getByTestId('settings.add.scrim'), 'a modal over the dimmed window').toBeVisible();
      await core.waitCmd((c) => c.cmd === 'found_scan', 3000);
      expect(await page.evaluate(() => location.hash), 'no route to settings: the sheet opens in place').not.toContain('settings');
      await page.screenshot({ path: test.info().outputPath(`add-sheet-${theme}.png`) });
      await page.keyboard.press('Escape');
      await expect(sheet, 'esc closes it').toBeHidden();
      await expect(page.getByTestId('app.sidebar.add')).toBeVisible();

      await page.keyboard.press('Meta+KeyN');
      await expect(sheet, '⌘N opens the same sheet').toBeVisible({ timeout: 2000 });
      await page.keyboard.press('Escape');
      await expect(sheet, 'esc closes it again').toBeHidden();
      await expect(page.getByTestId('settings.screen'), 'he never left the screen he was on').toBeHidden();
    } finally {
      await s.close();
    }
  });
}
