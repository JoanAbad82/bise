// thread/batch2-rows · amb-feed's batch 2 (b8cb4b1e; bar S8 thinking, S12 compaction, S14/S25
// notices, S15/K22/B20 not delivered, S13/S40 usage), lead m_10784. Passes when perf's thread draws
// each new entry kind as the TUI does: 'thought for 3.2s' folded and opening to what it thought,
// compaction as a line then its summary folded, notices with their level in a glyph (▲ warn,
// ✗ err), a message not delivered with '⏎ send again' (reaching the core as a send to that agent)
// and 'esc drop', a kind from a newer hub as its plain words; and perf's context gauge, the hub's
// words '42k · 17%', in the thread's head and its sidebar row. The scripted core (FakeCore) with
// the fixtures' entries. Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const agent = (name: string, over: Record<string, unknown> = {}) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: 0, ...over });
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
      { project: P, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 1, agents: 3, working: 0, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/acme', name: 'acme' },
  { ev: 'agents', project: P, agents: [agent('main'), agent('perf', { usage: { model: 'mistral/codestral-latest', context: 42310, window: 256000, words: '42k · 17%' } }), agent('alerts')] },
  {
    ev: 'thread',
    project: P,
    agent: 'perf',
    entries: [
      { pos: 20, at_ms: 1791100020000, kind: 'you', text: 'profile the cold run' },
      { pos: 21, at_ms: 1791100021000, kind: 'thinking', text: 'thought for 3.2s', thinking: { ms: 3200, text: 'the cold run is the slow one' } },
      { pos: 22, at_ms: 1791100022000, kind: 'compacting', text: 'compacting' },
      { pos: 23, at_ms: 1791100023000, kind: 'compacted', text: 'we profiled the hub; the cold run is slow' },
      { pos: 24, at_ms: 1791100024000, kind: 'notice', text: 'turn failed: provider 500', notice: { level: 'err', text: 'turn failed: provider 500' } },
      { pos: 25, at_ms: 1791100025000, kind: 'notice', text: 'retry', notice: { level: 'warn', text: 'model call failed (attempt 2/10): provider 529 (transient) · retry 3/10 in 4s' } },
      { pos: 26, at_ms: 1791100026000, kind: 'not_delivered', text: 'then the warm run', not_delivered: { to: 'alerts', text: 'then the warm run' } },
      { pos: 27, at_ms: 1791100027000, kind: 'unknown', text: 'a row from a newer hub' },
    ],
    before: null,
    more: false,
  },
];

test("thread/batch2-rows: thinking, compaction, notices, not delivered and the context gauge, as the TUI's", async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/perf` });
  try {
    const { page } = s;
    await expect(page.getByTestId('thread.screen')).toBeVisible({ timeout: 10_000 });
    const think = page.getByTestId('thread.think.21');
    await expect(think).toContainText('thought for 3.2s');
    await expect(think, 'folded').not.toContainText('the cold run is the slow one');
    await page.getByTestId('thread.think.21.head').click();
    await expect(think, 'opens to what it thought').toContainText('the cold run is the slow one');

    await expect(page.getByTestId('thread.compacting.22')).toContainText('compacting');
    await page.getByTestId('thread.compacted.23.head').click();
    await expect(page.getByTestId('thread.compacted.23')).toContainText('we profiled the hub');

    await expect(page.getByTestId('thread.notice.24'), 'an error, said with ✗').toHaveText(/^✗\s*turn failed: provider 500$/);
    await expect(page.getByTestId('thread.notice.25'), 'a warning, said with ▲').toContainText('▲');
    await expect(page.getByTestId('thread.unknown.27')).toHaveText('a row from a newer hub');

    await expect(page.getByTestId('thread.usage'), "the head's gauge, the hub's words").toContainText('42k · 17%');
    await expect(page.getByTestId('app.sidebar.agent.perf.gauge'), "perf's row in the sidebar").toHaveText('42k · 17%');
    await page.screenshot({ path: test.info().outputPath('batch2.png') });

    const nd = page.getByTestId('thread.notdelivered.26');
    await expect(nd).toContainText('not delivered to alerts');
    await page.getByTestId('thread.notdelivered.26.again').click();
    const sent = await core.waitCmd((c) => c.cmd === 'send', 3000);
    expect(sent, 'sent again to the agent it missed').toMatchObject({ project: P, agent: 'alerts', text: 'then the warm run' });
    await expect(nd).toContainText('sent again');
  } finally {
    await s.close();
    core.dispose();
  }
});
