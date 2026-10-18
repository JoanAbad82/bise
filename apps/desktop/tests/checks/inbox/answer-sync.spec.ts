// inbox/answer-sync · his answer on the inbox screen closes the card in every view and every count
// (inbox-sync, his try: «je répond quelque part (genre dans la page inbox), mais le state ne s'update
// pas partout, et si je vais dans un projet, la notification est toujours là, et dans la sidebar il y a
// toujours le [1] à côté du projet et de l'inbox»). On the real shell with the scripted core (FakeCore,
// fake data): two projects; docs' hub sent its card #7 once (held then), then the core lists docs from
// its files (its connection gone). Passes when:
//   - after his answer on the inbox screen, the sidebar's count on docs is the inbox's (0): both read
//     the rows minus what he just answered (store/machine/cards.ts inboxView);
//   - the rows drop #7 (no new 'cards' event: the core lists docs from view.json), docs' thread
//     draws no #7 (strip, block) and every count says 0: the thread reads the rows, never a copy of
//     the hub's last 'cards' event.
// The real-core side: inbox/answer-everywhere (tests/checks/real.sh). Owner: amb-home.
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import { thread } from '../../../src/proto/words_thread.gen';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const Q = 'docs-5e6f7a8b';
const NOW = Date.now();
const ag = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 3_600_000, waits: 0 });
const X = {
  id: 7,
  project: Q,
  kind: 'question',
  rank: 1,
  agent: 'writer',
  question: 'which tone for the changelog?',
  options: [
    { n: 1, label: 'plain' },
    { n: 2, label: 'playful' },
  ],
  urgent: false,
  since_ms: NOW - 120_000,
};
const projects = (cards: readonly unknown[]) => ({
  ev: 'projects',
  projects: [
    { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true, cards: [] },
    { project: P, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 1, agents: 1, working: 0, waits: 0, running: true, cards: [] },
    { project: Q, name: 'docs', path: '/nowhere/docs', git: true, home: false, order: 2, agents: 2, working: 0, waits: cards.length, running: true, cards },
  ],
});
const world = [
  {
    ev: 'prefs',
    prefs: { onboarded: true, theme: 'light', context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
  },
  projects([X]),
  { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere', name: 'bise' },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/acme', name: 'acme' },
  { ev: 'welcome', project: Q, proto: 1, workspace: '/nowhere/docs', name: 'docs' },
  { ev: 'agents', project: HOME, agents: [ag('main')] },
  { ev: 'agents', project: P, agents: [ag('main')] },
  { ev: 'agents', project: Q, agents: [ag('main'), ag('writer')] },
  // docs' hub, held then: its own cards, as the core forwards them
  { ev: 'cards', project: Q, cards: [X] },
  { ev: 'thread', project: HOME, agent: 'main', entries: [], before: null, more: false },
  { ev: 'thread', project: P, agent: 'main', entries: [], before: null, more: false },
  { ev: 'thread', project: Q, agent: 'main', entries: [{ pos: 1, at_ms: NOW - 300_000, kind: 'agent', text: 'the changelog draft is ready.' }], before: null, more: false },
];
type Cmd = { cmd?: string; card?: number; reply?: string; project?: string };

test('inbox/answer-sync: an answer on the inbox screen closes the card in the project, in its sidebar count and in the inbox count', async () => {
  const core = new FakeCore(world as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: 'inbox/all', size: '1100x760' });
  try {
    const { page: w } = s;
    const qCount = w.getByTestId(`app.sidebar.project.${Q}.count`);
    const inboxCount = w.getByTestId('app.sidebar.inbox.count');
    const row = w.getByTestId(`inbox.row.w:${Q}/7`);
    await expect(row).toBeVisible({ timeout: 10_000 });
    // the notifications' permission row is an item of the inbox too: 'not now' twice, out of the way
    await w.evaluate(() => {
      localStorage.setItem('bise.notify.notnow', '2');
    });
    await w.reload();
    await expect(row).toBeVisible({ timeout: 10_000 });
    await expect(qCount).toHaveText('1');
    await expect(inboxCount).toHaveText('1');

    await test.step('his pick on the inbox screen: the hub takes it, docs and the inbox say 0', async () => {
      // the hub took it; the core lists docs from its files without #7 (its connection gone: no
      // new 'cards' from docs' hub), as the step's rows come before the answer
      await core.result('answer', 7, { answer: { agent: 'writer', question: X.question, said: '1', pick: 'plain', notice: thread.answered_to({ who: 'writer' }) } }, [projects([])]);
      await row.click();
      const open = w.locator('[data-testid^="inbox.block.open."]', { hasText: X.question });
      await expect(open).toBeVisible({ timeout: 5000 });
      await open.locator('[data-testid$=".opt.1"]').first().click();
      const a = (await core.waitCmd((c) => (c as Cmd).cmd === 'answer' && (c as Cmd).card === 7, 5000)) as Cmd;
      expect(a.project).toBe(Q);
      await expect(row, 'gone from the inbox screen').toHaveCount(0, { timeout: 3000 });
      await expect(inboxCount, "the inbox's count").toHaveCount(0, { timeout: 3000 });
      await expect(qCount, "docs' count is the inbox's").toHaveCount(0, { timeout: 3000 });
    });

    await test.step("docs' thread draws no #7: the rows closed it, whatever docs' hub said last", async () => {
      await w.getByTestId(`app.sidebar.project.${Q}`).click();
      await expect(w.getByTestId('thread.list')).toBeVisible({ timeout: 10_000 });
      await expect(w.getByTestId('thread.list')).toContainText('the changelog draft is ready.', { timeout: 10_000 });
      // the window's hold on what he answered went with the rows: only the rows say it now
      await w.waitForTimeout(500);
      await expect(w.getByTestId(`strip.card.${Q}-7`), 'no #7 in its strip').toHaveCount(0);
      await expect(w.getByTestId(`inbox.block.card.${Q}-7`), 'no #7 in the block').toHaveCount(0);
      await expect(w.locator('[data-testid="inbox.block"]'), 'nothing waits over docs').toHaveCount(0);
      await expect(qCount).toHaveCount(0);
      await expect(inboxCount).toHaveCount(0);
      await w.screenshot({ path: test.info().outputPath('docs-after.png') });
    });
  } finally {
    await s.close();
  }
});
