// thread/inbox-strip · W7/K24 (amb-home's ThreadInbox f44d082e, m_11091): the project's open items
// show in the thread, under the list and over the composer. Passes when acme's main thread, with
// perf's question card open, shows the strip with its row, the strip sits between the last row and
// the composer (never over either), and a click on the row opens the card in place. The scripted
// core (FakeCore). Owner: amb-win (the mount); the strip is amb-home's.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const agent = (name: string) => ({ name, main: name === 'main', status: name === 'perf' ? 'waiting' : 'idle', archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: name === 'perf' ? 1 : 0 });
// the strip reads the open cards on the projects rows (ProjectRow.cards), as the inbox does
const CARD = { id: 9, project: P, kind: 'question', rank: 1, agent: 'perf', question: 'which bench?', options: [{ n: 1, label: 'cold' }, { n: 2, label: 'warm' }], urgent: false, since_ms: 1791100310000 };
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
      { project: P, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 1, agents: 2, working: 0, waits: 1, running: true, cards: [CARD] },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/acme', name: 'acme' },
  { ev: 'agents', project: P, agents: [agent('main'), agent('perf')] },
  { ev: 'thread', project: P, agent: 'main', entries: [{ pos: 1, at_ms: 1791100001000, kind: 'agent', text: 'hello' }], before: null, more: false },
];

test("thread/inbox-strip: the project's open items show between the thread and the composer; a click opens one", async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `project/${P}` });
  try {
    const { page } = s;
    const strip = page.getByTestId('strip');
    await expect(strip, 'the strip in the thread').toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('strip.row.1')).toContainText('which bench?');
    const box = async (id: string) => (await page.getByTestId(id).boundingBox()) ?? { x: 0, y: 0, width: 0, height: 0 };
    const [list, st, comp] = [await box('thread.list'), await box('strip'), await box('composer')];
    expect(st.y, 'under the list').toBeGreaterThanOrEqual(list.y + list.height - 1);
    expect(st.y + st.height, 'over the composer').toBeLessThanOrEqual(comp.y + 1);
    await page.screenshot({ path: test.info().outputPath('strip.png') });
    await page.getByTestId('strip.row.1').click();
    await expect(page.getByTestId(`strip.card.${P}-9`), 'the card opens in place').toBeVisible({ timeout: 2000 });
  } finally {
    await s.close();
    core.dispose();
  }
});
