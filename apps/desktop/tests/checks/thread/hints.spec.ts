// thread/hints · S36 one-time hints (the TUI's hints.rs). Passes when, for a user who never saw
// them (prefs.hints = {}), the first agent's hint shows under its sidebar row and is marked seen
// in the TUI's pref (prefs_set 'hints.first_agent' true), it goes when he looks into the agent;
// the first card's hint shows over the thread's inbox strip and is marked the same way; and after
// a restart with both marked, neither shows again. The scripted core (FakeCore); the real core's
// write of the pref is amb-core's law. Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const agent = (name: string) => ({ name, main: name === 'main', status: name === 'perf' ? 'waiting' : 'idle', archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: name === 'perf' ? 1 : 0 });
const CARD = { id: 9, project: P, kind: 'question', rank: 1, agent: 'perf', question: 'which bench?', options: [{ n: 1, label: 'cold' }, { n: 2, label: 'warm' }], urgent: false, since_ms: 1791100310000 };
const world = (hints: Record<string, boolean>) => [
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
      hints,
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
type Cmd = { cmd?: string; key?: string; value?: unknown };
const marks = (name: string) => (c: unknown) => (c as Cmd).cmd === 'prefs_set' && (c as Cmd).key === `hints.${name}` && (c as Cmd).value === true;

test('thread/hints: the first agent and first card hints show once, are marked in the TUI pref, never again after a restart', async () => {
  test.setTimeout(90_000);
  const core = new FakeCore(world({}) as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `project/${P}` });
  try {
    const { page } = s;
    const agentHint = page.getByTestId('app.hint.first_agent');
    await expect(agentHint, "the first agent's hint").toBeVisible({ timeout: 10_000 });
    await expect(agentHint).toContainText('new: your agents');
    const row = (await page.getByTestId('app.sidebar.agent.perf').boundingBox()) ?? { y: 0, height: 0 };
    expect(((await agentHint.boundingBox()) ?? { y: -1 }).y, 'under its row').toBeGreaterThanOrEqual(row.y + row.height - 1);
    await core.waitCmd(marks('first_agent'));
    const cardHint = page.getByTestId('app.hint.first_card');
    await expect(cardHint, "the first card's hint").toBeVisible();
    const strip = (await page.getByTestId('inbox.block').boundingBox()) ?? { y: 0 };
    expect(((await cardHint.boundingBox()) ?? { y: 1e9 }).y, 'over the strip').toBeLessThan(strip.y);
    await core.waitCmd(marks('first_card'));
    await page.screenshot({ path: test.info().outputPath('hints.png') });
    // its own mark comes back seen: it stays up until used
    await core.send(world({ first_agent: true, first_card: true })[0] as never);
    await page.waitForTimeout(300);
    await expect(agentHint, 'still up after its mark').toBeVisible();
    await page.getByTestId('app.sidebar.agent.perf').click();
    await expect(agentHint, 'used: looked into the agent').toHaveCount(0);
  } finally {
    await s.close();
    core.dispose();
  }

  // a restart: both marked, neither shows
  const core2 = new FakeCore(world({ first_agent: true, first_card: true }) as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s2 = await launchDesktop({ core: core2, route: `project/${P}` });
  try {
    const { page } = s2;
    await expect(page.getByTestId('inbox.block')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('app.sidebar.agent.perf')).toBeVisible();
    await page.waitForTimeout(300);
    await expect(page.getByTestId('app.hint.first_agent')).toHaveCount(0);
    await expect(page.getByTestId('app.hint.first_card')).toHaveCount(0);
  } finally {
    await s2.close();
    core2.dispose();
  }
});
