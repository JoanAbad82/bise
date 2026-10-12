// app/sidebar-v6 · designer's desktop-screens v6/v7, signed (m_11834, lead m_11830): the sidebar,
// the titlebar, the right panel A's frame, and under 1000 px the slide-over. Passes when, at 1400
// px on perf's thread: the sidebar is 240 px with 'search or jump ⌘K', bise with his pink count,
// '↗ artifacts 1 new', '◷ scheduled 1', 'projects', storefront's row '∿ 2' + 1, places only: no
// agent row in the sidebar (designer's desktop-right-bar v5: the agents are in the right bar, each
// with its sign ∿ ? ✗ ◷ ✓, never a 'main' row, 8 then '+ 1 more'), the titlebar 'storefront › perf' and '↗ artifacts · 1
// ⌥⌘0' tinted with the panel open (artifacts · storefront, all ›), ⌥⌘0 hides it and is kept, ⌘\
// hides the sidebar; at 800 px the sidebar and panel are away, the titlebar shows the sidebar
// button and '2 waiting', ⌘\ slides the sidebar over a scrim and esc closes it. Shots light and
// dark at 1400 and 800 for designer's sign-off. The scripted core (FakeCore). Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const NOW = Date.now();
const MIN = 60_000;
const agent = (name: string, status: string, over: Record<string, unknown> = {}) => ({
  name, main: name === 'main', status, archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 2 * MIN, waits: 0, ...over,
});
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
// the quiet ones are done 5 h ago
const early = NOW - 5 * 3_600_000;
const world = () => [
  prefs('light'),
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 1, running: true },
      { project: P, name: 'storefront', path: '/nowhere/storefront', git: true, home: false, order: 1, agents: 10, working: 2, waits: 1, running: true },
      { project: 'docs-cff418c0', name: 'docs', path: '/nowhere/docs', git: true, home: false, order: 2, agents: 1, working: 0, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/storefront', name: 'storefront' },
  {
    ev: 'agents',
    project: P,
    agents: [
      agent('main', 'idle'),
      agent('checkout', 'working', { turn_ms: 6 * MIN }),
      agent('perf', 'working', { turn_ms: 14 * MIN }),
      agent('search', 'blocked', { waits: 1 }),
      agent('ci-fix', 'failed'),
      agent('deploy-watch', 'idle', { since_ms: early }),
      agent('size-filter', 'done', { since_ms: NOW - 20 * MIN }),
      agent('lint', 'done', { since_ms: early }),
      agent('typos', 'done', { since_ms: early }),
      agent('old-ui', 'done', { since_ms: early }),
      agent('gift-cards-v1', 'done', { archived: true }),
    ],
  },
  { ev: 'scheduled', project: P, items: [{ id: 4, agent: 'deploy-watch', by: 'main', words: 'check the deploy', every: '10m', times: 24, done: 6, next_ms: NOW + 20 * MIN }] },
  { ev: 'artifacts', project: P, items: [{ id: 'product-page', kind: 'page', title: 'product page, before / after', agent: 'perf', version: 2, at_ms: NOW - 5 * MIN, url: 'http://127.0.0.1:1/p/x', new: true }] },
  { ev: 'thread', project: P, agent: 'perf', entries: [{ pos: 1, at_ms: NOW - 3 * MIN, kind: 'agent', text: 'found it: the hero image ships at 2.4 MB.' }], before: null, more: false },
];

const shot = (name: string) => test.info().outputPath(`${name}.png`);

test('app/sidebar-v6: the sidebar, the titlebar, panel A at 1400 px; the slide-over at 800 px; light and dark', async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/perf`, size: '1400x860' });
  try {
    const { page } = s;
    const side = page.getByTestId('app.sidebar');
    await expect(page.getByTestId('app.right.agent.perf')).toBeVisible({ timeout: 10_000 });
    expect(Math.round((await side.boundingBox())?.width ?? 0), 'the sidebar is 240 px').toBe(240);
    await expect(page.getByTestId('app.sidebar.search')).toContainText('search or jump');
    await expect(page.getByTestId('app.sidebar.bise').locator('.app-cnt'), "bise's pink count").toHaveText('2');
    await expect(page.getByTestId('app.sidebar.bise').getByTestId('bise.pearl.rest'), 'something waits: the live pink pearl').toHaveCount(0);
    // tui-parity R17: who made it, until he opens the artifacts
    await expect(page.getByTestId('app.sidebar.artifacts')).toContainText('1 new · perf');
    await expect(page.getByTestId('app.sidebar.scheduled')).toContainText('1');
    await expect(page.getByTestId(`app.sidebar.project.${P}`)).toContainText('∿ 2');
    // places only: the agents are in the right bar (designer's desktop-right-bar v5)
    await expect(side.locator('[data-testid^="app.sidebar.agent."]'), 'no agent row in the sidebar').toHaveCount(0);
    await expect(page.getByTestId('app.right.agent.main'), "never a 'main' row").toHaveCount(0);
    const sign = (n: string) => page.locator(`[data-testid="app.right.agent.${n}"] .app-rb-g`);
    await expect(sign('search')).toHaveText('?');
    await expect(page.getByTestId('app.right.agent.search')).toContainText('waits');
    await expect(sign('ci-fix')).toHaveText('✗');
    await expect(page.getByTestId('app.right.agent.ci-fix')).toContainText('failed');
    await expect(sign('deploy-watch')).toHaveText('◷');
    await expect(sign('size-filter')).toHaveText('✓');
    await expect(page.getByTestId('app.right.agent.perf')).toContainText('14 min');
    // 9 live agents: 8 then '+ 1 more'
    const more = page.getByTestId('app.right.agents.more');
    await expect(more).toHaveText('+ 1 more');
    await expect(page.getByTestId('app.right.agent.old-ui')).toHaveCount(0);
    // the titlebar and panel A
    await expect(page.getByTestId('app.title.crumb')).toHaveText('storefront›perf');
    const btn = page.getByTestId('app.title.panel');
    // the right bar's toggle (designer m_20275): the panel icon, 'right bar ⌥⌘0' on hover, the accent
    // count of what waits in storefront (1)
    await expect(btn).toHaveAttribute('aria-label', /right bar/u);
    await expect(page.getByTestId('app.title.panel.waits')).toHaveText('1');
    await expect(btn).toHaveAttribute('aria-pressed', 'true');
    const panel = page.getByTestId('app.panel');
    // the right bar took panel A's place (designer's desktop-right-bar v5): its head, its sections
    await expect(page.getByTestId('app.right.top')).toContainText('storefront');
    await expect(page.getByTestId('app.right.top')).toContainText('⌥⌘0');
    expect(Math.round((await panel.boundingBox())?.width ?? 0), 'the panel is 320 px').toBe(320);
    await expect(page.getByTestId('app.right.scheduled'), 'its scheduled tasks').toContainText('check the deploy');
    await page.mouse.move(1, 400);
    await page.screenshot({ path: shot('w1400-light') });
    await core.send(prefs('dark') as never);
    await page.waitForTimeout(300);
    await page.screenshot({ path: shot('w1400-dark') });
    await core.send(prefs('light') as never);

    await more.click();
    await expect(page.getByTestId('app.right.agent.old-ui'), 'a click unfolds them').toBeVisible();
    await page.keyboard.press('Meta+Alt+Digit0');
    await expect(panel, '⌥⌘0 hides the panel').toHaveCount(0);
    await expect(btn).toHaveAttribute('aria-pressed', 'false');
    await page.keyboard.press('Meta+Alt+Digit0');
    await expect(panel).toBeVisible();
    await page.keyboard.press('Meta+Backslash');
    await expect(side, '⌘\\ hides the sidebar').toHaveCount(0);
    await expect(page.getByTestId('app.title.sidebar')).toBeVisible();
    await page.keyboard.press('Meta+Backslash');
    await expect(side).toBeVisible();

    // 800 px: the sidebar and the panel away, what waits in the titlebar
    await page.setViewportSize({ width: 800, height: 760 });
    await expect(side).toHaveCount(0);
    await expect(panel).toHaveCount(0);
    await expect(page.getByTestId('app.title.waiting')).toHaveText(/2 waiting/);
    await page.screenshot({ path: shot('w800-light') });
    await page.keyboard.press('Meta+Backslash');
    await expect(page.getByTestId('app.over.left').getByTestId('app.sidebar'), 'the sidebar slides over').toBeVisible();
    await expect(page.getByTestId('app.scrim')).toBeVisible();
    await page.screenshot({ path: shot('w800-side-light') });
    await core.send(prefs('dark') as never);
    await page.waitForTimeout(300);
    await page.screenshot({ path: shot('w800-side-dark') });
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('app.over.left'), 'esc closes it').toHaveCount(0);
    await page.screenshot({ path: shot('w800-dark') });
    await page.getByTestId('app.title.panel').click();
    await expect(page.getByTestId('app.over.right').getByTestId('app.panel'), 'the panel slides over the thread').toBeVisible();
    await page.screenshot({ path: shot('w800-panel-dark') });
    await page.getByTestId('app.scrim').click({ position: { x: 20, y: 400 } });
    await expect(page.getByTestId('app.over.right'), 'a click outside closes it').toHaveCount(0);
  } finally {
    await s.close();
    core.dispose();
  }
});

test('app/sidebar-v6: no project yet: only bise, the top rows and add a project', async () => {
  const w = world().slice(0, 1).concat([
    { ev: 'projects', projects: [{ project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true }] },
    { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere', name: 'bise' },
    { ev: 'agents', project: HOME, agents: [agent('main', 'idle')] },
    { ev: 'thread', project: HOME, agent: 'main', entries: [], before: null, more: false },
  ] as never[]);
  const core = new FakeCore(w as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: 'bise', size: '1400x860' });
  try {
    const { page } = s;
    await expect(page.getByTestId('app.sidebar.empty-add')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-testid^="app.sidebar.project."]')).toHaveCount(0);
    // designer m_12093: the centre, the composer stays, no panel and no panel button without a project
    await expect(page.getByTestId('thread.noproject')).toContainText('bise is here.');
    // nothing waits on him: bise's pearl is the ink one at rest everywhere (designer m_12127)
    await expect(page.getByTestId('app.sidebar.bise').getByTestId('bise.pearl.rest')).toBeVisible();
    await expect(page.getByTestId('thread.noproject').getByTestId('bise.pearl.rest')).toBeVisible();
    await expect(page.getByTestId('thread.noproject.add')).toContainText('add a project');
    await expect(page.getByTestId('composer')).toBeVisible();
    await expect(page.getByTestId('app.panel')).toHaveCount(0);
    await expect(page.getByTestId('app.title.panel')).toHaveCount(0);
    // the foot: two plain 28 px rows with their words
    for (const id of ['app.sidebar.add', 'app.sidebar.settings']) {
      const box = await page.getByTestId(id).boundingBox();
      expect(Math.round(box?.height ?? 0), `${id} is a 28 px row`).toBe(28);
    }
    await expect(page.getByTestId('app.sidebar.add')).toContainText('add a project');
    await expect(page.getByTestId('app.sidebar.settings')).toContainText('settings');
    await page.screenshot({ path: shot('empty-light') });
    await core.send(prefs('dark') as never);
    await page.waitForTimeout(300);
    await page.screenshot({ path: shot('empty-dark') });
    await page.getByTestId('thread.noproject.demo').click();
    await expect(page.getByTestId('composer.field'), 'the demo fills the composer').toContainText('show me what you can do');
    await page.getByTestId('app.sidebar.empty-add').click();
    await expect(page.locator('[data-testid^="settings"]').first(), 'it opens settings').toBeVisible({ timeout: 3000 });
  } finally {
    await s.close();
    core.dispose();
  }
});
