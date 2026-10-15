// settings/projects-add · S.4 (docs/desktop-bar.md): he picks where bise works with no terminal.
// The screen is settings › projects (⌘, then projects): 'add a project' opens the add sheet (the ds
// Sheet, a modal over the dimmed window, designer's S11 v2 shot 19; the sidebar's '+ add a project'
// opens the same one, AddSheet.tsx). The sheet asks found_scan at each open; 'choose…' opens the
// system's folder panel (window.bise.pickFolder; test mode answers with
// BISE_DESKTOP_TEST_PICK_FOLDER), 'add shop' asks the core to add it (AppCmd project_add: its hub and
// main start there, bise_home::projects is the registry's writer). Passes when, with the scripted
// core (FakeCore, fake data):
//   - the scan's head counts while it waits, then says 'found in your folders · 2' with both repos;
//   - the pick fills the sheet and 'add shop' sends project_add {path}, says 'adding shop…', and the
//     sheet goes once the core's projects row for it comes; the row shows in the sidebar, and a
//     click opens its bise there; bise's own row (the ~/bise home) takes him back home;
//   - never a wait with no end (ambient-lead m_18490, his real-home try): the core's refusal of the
//     add shows in its words and the button works again; the core's broken state shows as
//     '▲ bise can't start your projects: <reason>.' in the scan's head, with 'look again'.
// Frames: add-sheet-{light,dark}.png at 1100 (the found group ticked, the toggle on).
// That its agents really work in that folder is the core's (S11, ambient_setup_e2e); qa-flows runs
// setup/workspace on the real core. Owner: amb-home.
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import { settings } from '../../../src/proto/words.gen';

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
];
const FOUND = {
  ev: 'found',
  dir: '/nowhere',
  items: [
    { name: 'blog', path: '/nowhere/code/blog', git: true, known: false, last_ms: Date.now() - 3_600_000 },
    { name: 'docs', path: '/nowhere/code/docs', git: true, known: false, last_ms: Date.now() - 2 * 86_400_000 },
  ],
};
const theme = (t: string) => ({ ...prefs, prefs: { ...prefs.prefs, theme: t } });

test('settings/projects-add: he picks a folder with no terminal, it becomes a project in the sidebar, and bise takes him home', async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: 'settings/projects', size: '1100x720', env: { BISE_DESKTOP_TEST_PICK_FOLDER: PICKED } });
  try {
    const { page } = s;
    // (the list itself is empty: bise's home is not one of his projects)
    await expect(page.getByTestId('settings.project.add')).toBeVisible({ timeout: 10_000 });
    await page.getByTestId('settings.project.add').click();
    const sheet = page.getByTestId('settings.add');
    await expect(sheet).toBeVisible();
    await expect(page.getByTestId('settings.add.scrim'), 'a modal over the dimmed window').toBeVisible();
    // the scan: asked at open, its head waits, then counts what it found
    await core.waitCmd((c) => c.cmd === 'found_scan', 3000);
    const scan = page.getByTestId('settings.add.scan');
    await expect(scan).toHaveAttribute('data-state', 'looking');
    await expect(scan).toContainText('looking in your folders');
    // designer m_19020: no rows yet, so the head alone, never an empty group's bare line
    await expect(page.getByTestId('settings.add.found').locator('.b-group')).toHaveCount(0);
    await page.screenshot({ path: test.info().outputPath('add-sheet-looking.png') });
    await core.send(FOUND as never);
    await expect(scan).toHaveText(settings.scan_found({ n: 2 }));
    await expect(page.getByTestId('settings.add.found')).toContainText('/nowhere/code/blog · git · today');

    // the frame for designer: blog ticked, the toggle on, light then dark
    await page.getByTestId('settings.add.found.blog').click();
    await page.getByTestId('settings.add.land').click();
    await expect(page.getByTestId('settings.add.go')).toHaveText('add blog');
    await page.waitForTimeout(300);
    await page.screenshot({ path: test.info().outputPath('add-sheet-light.png') });
    await core.send(theme('dark') as never);
    await page.waitForTimeout(500);
    await page.screenshot({ path: test.info().outputPath('add-sheet-dark.png') });
    await core.send(theme('light') as never);
    await page.getByTestId('settings.add.found.blog').click();
    await page.getByTestId('settings.add.land').click();

    await page.getByTestId('settings.add.choose').click();
    const go = page.getByTestId('settings.add.go');
    await expect(go, 'the picked folder is in the sheet').toHaveText('add shop');
    await go.click();
    expect(await core.waitCmd((c) => c.cmd === 'project_add', 3000)).toMatchObject({ cmd: 'project_add', path: PICKED });
    await expect(page.getByTestId('settings.add.say'), 'add says what it does while the core works').toHaveText(settings.adding_one({ name: 'shop' }));

    // the core adds it: its row in the sidebar, its bise there
    await core.send({ ev: 'projects', projects: [home, shop] } as never);
    await core.send({ ev: 'welcome', project: SHOP, proto: 1, workspace: PICKED, name: 'shop' } as never);
    await core.send({ ev: 'agents', project: SHOP, agents: [agent('main')] } as never);
    await core.send({ ev: 'thread', project: SHOP, agent: 'main', entries: [], before: null, more: false } as never);
    await expect(sheet, 'the project is in: the sheet goes').toBeHidden({ timeout: 3000 });
    await expect(page.getByTestId(`settings.projects.${SHOP}`)).toBeVisible();
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

test("settings/projects-add: the core's refusal and its broken state show in plain words, never a wait with no end", async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: 'settings/projects', size: '1100x720' });
  try {
    const { page } = s;
    await expect(page.getByTestId('settings.project.add')).toBeVisible({ timeout: 10_000 });
    await page.getByTestId('settings.project.add').click();
    await core.waitCmd((c) => c.cmd === 'found_scan', 3000);
    await core.send(FOUND as never);
    await page.getByTestId('settings.add.path').fill('/nowhere/not-here');
    const go = page.getByTestId('settings.add.go');
    await expect(go).toHaveText('add not-here');
    await go.click();
    await core.waitCmd((c) => c.cmd === 'project_add', 3000);
    await core.send({ ev: 'error', cmd: 'project_add', text: '/nowhere/not-here is not a folder' } as never);
    const say = page.getByTestId('settings.add.say');
    await expect(say).toHaveText(settings.add_failed({ names: 'not-here', why: '/nowhere/not-here is not a folder' }));
    await expect(go, 'the button works again').toBeEnabled();
    await expect(page.getByTestId('settings.add')).toBeVisible();

    // the core can start no hub: the scan's head says why, with 'look again'
    const reason = "bise's runtime is missing: no repl-live in /Applications/bise.app/Contents/Resources/bin. reinstall bise";
    await core.send({ ev: 'broken', reason } as never);
    const scan = page.getByTestId('settings.add.scan');
    await expect(scan).toHaveAttribute('data-state', 'failed');
    await expect(scan).toContainText(`▲ bise can't start your projects: ${reason}.`);
    await expect(page.getByTestId('settings.add.rescan')).toBeVisible();
    const sheetText = await page.getByTestId('settings.add').innerText();
    expect(sheetText.split("can't start your projects").length - 1, 'the sheet says the broken cause once').toBe(1);
    // designer m_18973: add waits while the core can't start projects; cancel and 'look again' stay live
    await expect(go, 'add is off while the core is broken').toBeDisabled();
    await expect(page.getByTestId('settings.add.cancel')).toBeEnabled();
    await expect(page.getByTestId('settings.add.rescan')).toBeEnabled();
    // one place for the global failure: the window's top line, never the projects page's own copy
    await expect(page.getByTestId('settings.projects')).not.toContainText("can't start your projects");
    await page.screenshot({ path: test.info().outputPath('add-sheet-broken.png') });
    // esc closes it, nothing else sent
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('settings.add')).toBeHidden();
  } finally {
    await s.close();
    core.dispose();
  }
});
