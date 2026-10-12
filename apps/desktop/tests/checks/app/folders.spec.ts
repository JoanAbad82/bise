// app/folders · designer's desktop-right-bar v5 (ambient-lead m_20087 commit 2/3): the sidebar
// keeps places only. A project's row says what works in it and his pink count; its agents are not
// under it any more (no folder, no ▾): they are in the right bar, which on bise's view covers every
// project whose hub runs (acme's perf and docs, named with their project). Before, a project's
// folder opened under its row (his try round 2 item 3, ambient-lead m_11456). The scripted core
// (FakeCore). Owner: amb-win.
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

test("app/folders: places only: a project's row says its counts, its agents are in the right bar, every project's on bise's view", async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: 'bise' });
  try {
    const { page } = s;
    await expect(page.getByTestId(`app.right.agent.${ACME}.perf`), "acme's agents, in the right bar").toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId(`app.right.agent.${ACME}.docs`)).toContainText('acme');
    // desktop-screens v6: the row says it, '∿ 2' and his pink count (no counts line under it)
    await expect(page.getByTestId(`app.sidebar.project.${SHOP}`), "shop's row").toContainText('∿ 2');
    await expect(page.getByTestId(`app.sidebar.project.${SHOP}`).locator('.app-cnt'), 'his pink count').toHaveText('1');
    const side = page.getByTestId('app.sidebar');
    await expect(side.locator('[data-testid^="app.sidebar.agent."]'), 'no agent row in the sidebar').toHaveCount(0);
    await expect(page.getByTestId(`app.sidebar.project.${ACME}.fold`), 'no folder').toHaveCount(0);
    await page.screenshot({ path: test.info().outputPath('places.png') });
    // a project's row opens its main; the right bar shows that project alone
    await page.getByTestId(`app.sidebar.project.${ACME}`).click();
    await expect(page.getByTestId('thread.screen')).toHaveAttribute('data-project', ACME);
    await expect(page.getByTestId('app.right.agent.perf')).toBeVisible();
    await expect(page.getByTestId('app.right.top')).toContainText('acme');
  } finally {
    await s.close();
    core.dispose();
  }
});
