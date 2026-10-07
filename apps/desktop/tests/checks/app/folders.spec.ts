// app/folders · his try round 2 item 3 (ambient-lead m_11456, m_11618): a project's folder in the
// sidebar is open by default and his close is remembered per project. Passes when, on the bise
// view, acme (a project the window has agents of) lists its agents under its row, shop (no agents
// known: its hub isn't held for the sidebar) says '∿ 2' and his pink count 1 on its row, a
// click on acme's ▾ closes it (its agents leave, the row stays, nothing navigates) and is kept in
// the window's storage, and ▸ opens it again. The scripted core (FakeCore). Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const ACME = 'acme-1a2b3c4d';
const SHOP = 'shop-ab9f3c3b';
const agent = (name: string, status = 'idle') => ({ name, main: name === 'main', status, archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: 0 });
const world = () => [
  {
    ev: 'prefs',
    prefs: { onboarded: true, theme: 'system', context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
  },
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: ACME, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 1, agents: 3, working: 1, waits: 0, running: true },
      { project: SHOP, name: 'shop', path: '/nowhere/shop', git: true, home: false, order: 2, agents: 4, working: 2, waits: 1, running: true },
    ],
  },
  { ev: 'welcome', project: ACME, proto: 1, workspace: '/nowhere/acme', name: 'acme' },
  { ev: 'agents', project: ACME, agents: [agent('main'), agent('perf', 'working'), agent('docs')] },
];

test("app/folders: every project's folder opens by default; a close is his, remembered; a project without agents says its counts on its row", async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: 'bise' });
  try {
    const { page } = s;
    await expect(page.getByTestId('app.sidebar.agent.perf'), "acme's agents, open by default").toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('app.sidebar.agent.docs')).toBeVisible();
    // desktop-screens v6: the row says it, '∿ 2' and his pink count (no counts line under it)
    await expect(page.getByTestId(`app.sidebar.project.${SHOP}`), "shop's row").toContainText('∿ 2');
    await expect(page.getByTestId(`app.sidebar.project.${SHOP}`).locator('.app-cnt'), 'his pink count').toHaveText('1');
    await expect(page.getByTestId(`app.sidebar.project.${ACME}.fold`)).toHaveAttribute('aria-expanded', 'true');
    await page.screenshot({ path: test.info().outputPath('open.png') });

    await page.getByTestId(`app.sidebar.project.${ACME}.fold`).click();
    await expect(page.getByTestId('app.sidebar.agent.perf'), 'closed: its agents leave').toHaveCount(0);
    await expect(page.getByTestId(`app.sidebar.project.${ACME}`), 'the row stays').toBeVisible();
    await expect(page.getByTestId('thread.screen'), 'nothing navigated: still bise').toHaveAttribute('data-project', HOME);
    expect(await page.evaluate(() => localStorage.getItem('bise.sidebar.closed')), 'his close is kept').toBe(JSON.stringify([ACME]));
    await page.getByTestId(`app.sidebar.project.${ACME}.fold`).click();
    await expect(page.getByTestId('app.sidebar.agent.perf'), 'open again').toBeVisible();
  } finally {
    await s.close();
    core.dispose();
  }
});
