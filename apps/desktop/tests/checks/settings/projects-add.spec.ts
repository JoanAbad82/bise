// settings/projects-add · S.4 (docs/desktop-bar.md): he picks where bise works with no terminal.
// The screen is settings › projects (⌘, then projects; the sidebar's 'add a project ⌘N' opens the
// same sheet): 'choose…' opens the system's folder panel (window.bise.pickFolder; test mode answers
// with BISE_DESKTOP_TEST_PICK_FOLDER), 'add shop' asks the core to add it (AppCmd project_add: its
// hub and main start there, bise_home::projects is the registry's writer). Passes when, with the
// scripted core (FakeCore, fake data):
//   - the pick fills the sheet and 'add shop' sends project_add {path};
//   - the core's projects row for it shows in the sidebar, and a click opens its bise there;
//   - bise's own row (the ~/bise home) takes him back home.
// That its agents really work in that folder is the core's (S11, ambient_setup_e2e); qa-flows runs
// setup/workspace on the real core. Owner: amb-home.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const SHOP = 'shop-5e6f7a8b';
const PICKED = '/nowhere/shop';
const prefs = {
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
};
const home = { project: HOME, name: 'bise', path: '/nowhere/bise', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true };
const shop = { project: SHOP, name: 'shop', path: PICKED, git: true, home: false, order: 1, agents: 1, working: 0, waits: 0, running: true };
const agent = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: 0 });
const world = () => [
  prefs,
  { ev: 'projects', projects: [home] },
  { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere/bise', name: 'bise' },
  { ev: 'agents', project: HOME, agents: [agent('main')] },
  { ev: 'found', dir: '/nowhere', items: [] },
];

test('settings/projects-add: he picks a folder with no terminal, it becomes a project in the sidebar, and bise takes him home', async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: 'settings/projects', env: { BISE_DESKTOP_TEST_PICK_FOLDER: PICKED } });
  try {
    const { page } = s;
    // (the list itself is empty: bise's home is not one of his projects)
    await expect(page.getByTestId('settings.project.add')).toBeVisible({ timeout: 10_000 });
    await page.getByTestId('settings.project.add').click();
    await expect(page.getByTestId('settings.add')).toBeVisible();
    await page.getByTestId('settings.add.choose').click();
    const go = page.getByTestId('settings.add.go');
    await expect(go, 'the picked folder is in the sheet').toHaveText('add shop');
    await page.screenshot({ path: test.info().outputPath('add-sheet.png') });
    await go.click();
    expect(await core.waitCmd((c) => c.cmd === 'project_add', 3000)).toMatchObject({ cmd: 'project_add', path: PICKED });

    // the core adds it: its row in the sidebar, its bise there
    await core.send({ ev: 'projects', projects: [home, shop] } as never);
    await core.send({ ev: 'welcome', project: SHOP, proto: 1, workspace: PICKED, name: 'shop' } as never);
    await core.send({ ev: 'agents', project: SHOP, agents: [agent('main')] } as never);
    await core.send({ ev: 'thread', project: SHOP, agent: 'main', entries: [], before: null, more: false } as never);
    const row = page.getByTestId(`app.sidebar.project.${SHOP}`);
    await expect(row).toBeVisible({ timeout: 3000 });
    await row.click();
    await expect(page.getByTestId('thread.screen')).toHaveAttribute('data-project', SHOP);
    await page.screenshot({ path: test.info().outputPath('shop.png') });

    // bise's own row: back home (~/bise)
    await page.getByTestId('app.sidebar.bise').click();
    await expect(page.getByTestId('thread.screen')).toHaveAttribute('data-project', HOME);
  } finally {
    await s.close();
    core.dispose();
  }
});
