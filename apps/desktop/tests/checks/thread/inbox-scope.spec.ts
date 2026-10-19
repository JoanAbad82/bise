// thread/inbox-scope · his ask (« l'inbox est cross-project si on parle à global bise, ou si on est
// dans /inbox, mais bouger dans un projet filtre l'inbox »): acme and shop each have an item. Passes
// when acme's thread's inbox block lists acme's item only (its row without 'acme', its head '· 1 in
// other projects', a link to the inbox screen), the inbox screen (inbox/all) lists both, and bise's
// view (global bise) lists both. The scripted core (FakeCore); a shot of each for the
// designer. Owner: amb-home (src/inbox/scope.ts).
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const SHOP = 'shop-5e6f7a8b';
const agent = (name: string, waits = 0) => ({ name, main: name === 'main', status: waits > 0 ? 'waiting' : 'idle', archived: false, title: '', purpose: '', since_ms: 1791100000000, waits });
const ACME = { id: 9, project: P, kind: 'question', rank: 1, agent: 'perf', question: 'which bench?', options: [{ n: 1, label: 'cold' }, { n: 2, label: 'warm' }], urgent: false, since_ms: 1791100310000 };
const SHOPS = { id: 50, project: SHOP, kind: 'question', rank: 1, agent: 'pay', question: 'which currency for the EU checkout?', options: [{ n: 1, label: 'eur' }, { n: 2, label: 'usd' }], urgent: false, since_ms: 1791100320000 };
const world = () => [
  {
    ev: 'prefs',
    prefs: {
      onboarded: true,
      theme: 'system',
      context: { shot: true, url: true, file: true, window_text: false },
      excluded_apps: [],
      quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true },
      voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' },
      shots_keep_days: 7,
    },
  },
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 1, agents: 2, working: 0, waits: 1, running: true, cards: [ACME] },
      { project: SHOP, name: 'shop', path: '/nowhere/shop', git: true, home: false, order: 2, agents: 2, working: 0, waits: 1, running: true, cards: [SHOPS] },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/acme', name: 'acme' },
  { ev: 'agents', project: P, agents: [agent('main'), agent('perf', 1)] },
  { ev: 'thread', project: P, agent: 'main', entries: [{ pos: 1, at_ms: 1791100001000, kind: 'agent', text: 'hello' }], before: null, more: false },
  { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere', name: 'bise' },
  { ev: 'agents', project: HOME, agents: [agent('main')] },
  { ev: 'thread', project: HOME, agent: 'main', entries: [{ pos: 1, at_ms: 1791100001000, kind: 'agent', text: 'morning' }], before: null, more: false },
];

test("thread/inbox-scope: a project's view lists its own items; global bise and the inbox screen every project's", async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `project/${P}` });
  try {
    const { page } = s;
    const block = page.getByTestId('inbox.block');
    // acme's thread: acme's item only, its row without the project; the head says what waits elsewhere
    await expect(block, "acme's inbox block").toBeVisible({ timeout: 10_000 });
    await expect(block).toHaveAttribute('data-count', '1');
    await expect(block).toContainText('which bench?');
    await expect(block).not.toContainText('which currency');
    await expect(page.getByTestId('inbox.block.row.1').locator('.end')).not.toContainText('acme');
    const others = page.getByTestId('inbox.block.others');
    await expect(others, "designer m_33443: '1 in other projects' alone is the link to /inbox").toHaveText('1 in other projects');
    await page.screenshot({ path: test.info().outputPath('1-project-acme.png') });
    await others.hover();
    await block.screenshot({ path: test.info().outputPath('1b-project-acme-head.png') });
    // its link: the inbox screen, whose list holds both
    await others.click();
    const list = page.getByTestId('inbox.list');
    await expect(list, 'inbox/all is up').toBeVisible({ timeout: 5000 });
    await expect(list).toContainText('which bench?');
    await expect(list).toContainText('which currency');
    await page.screenshot({ path: test.info().outputPath('3-inbox-screen.png') });
    // global bise (the sidebar's bise row): both projects' items, and bise's own notifications ask
    // (a fresh test home: macOS never asked), listed only where every project's items are
    await page.getByTestId('app.sidebar.bise').click();
    await expect(block).toHaveAttribute('data-count', '3', { timeout: 5000 });
    await expect(block).toContainText('which bench?');
    await expect(block).toContainText('which currency');
    await expect(page.getByTestId('inbox.block.others')).toHaveCount(0);
    await page.screenshot({ path: test.info().outputPath('2-global-bise.png') });
  } finally {
    await s.close();
    core.dispose();
  }
});
