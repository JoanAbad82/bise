// thread/dock-choice · designer m_14031, ambient-lead m_14037 (ambient m_8773's split): a docked item that only
// its options decide (an approval, a hub merge item: the TUI's choice_kind) is never answered by typed words.
// Passes when, on the scripted core (FakeCore, fake data):
//   - main's merge item docked: the label reads 'to bise · the merge waits for 1 or 2', the card has no
//     'or type your answer below', and his typed line + ⏎ goes as a plain send to main, never an answer;
//   - a question docked with a long question: the label is one line ('answering perf · <cut>…' and
//     'esc write a plain message' whole at its right).
// Shots: light, both docks. Owner: amb-home.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const agent = (name: string) => ({ name, main: name === 'main', status: 'waiting', archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: 1 });
const merge = { id: 21, project: P, kind: 'merge', rank: 1, agent: 'main', question: 'merge checkout into main? (2 files, tests green)', options: [{ n: 1, label: 'merge' }, { n: 2, label: 'not yet' }], urgent: false, since_ms: 1791100310000 };
const long = { id: 22, project: P, kind: 'question', rank: 1, agent: 'perf', question: 'which bench should i run first on the product page, the cold one that reloads the cache or the warm one?', options: [{ n: 1, label: 'cold' }, { n: 2, label: 'warm' }], urgent: false, since_ms: 1791100320000 };
const projects = (cards: unknown[]) => ({
  ev: 'projects',
  projects: [
    { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
    { project: P, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 1, agents: 2, working: 0, waits: cards.length, running: true, cards },
  ],
});
const world = () => [
  { ev: 'prefs', prefs: { onboarded: true, theme: 'light', context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 } },
  projects([merge]),
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/acme', name: 'acme' },
  { ev: 'agents', project: P, agents: [agent('main'), agent('perf')] },
  { ev: 'thread', project: P, agent: 'main', entries: [{ pos: 1, at_ms: 1791100001000, kind: 'agent', text: 'checkout is ready to merge.' }], before: null, more: false },
  { ev: 'thread', project: P, agent: 'perf', entries: [{ pos: 1, at_ms: 1791100001000, kind: 'agent', text: 'two benches are ready.' }], before: null, more: false },
];
type Cmd = { cmd?: string; text?: string; agent?: string };

test('thread/dock-choice: a docked merge is decided only by 1/2; typed words go as a plain message; the label is one line', async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `project/${P}` });
  const { page } = s;
  try {
    const label = page.locator('[data-testid="composer"] .div');

    await test.step("the merge docked: 'to bise · the merge waits for 1 or 2', no type hint, words go as a send", async () => {
      await expect(page.getByTestId('inbox.block.row.1')).toBeVisible({ timeout: 10_000 });
      await page.getByTestId('inbox.block.row.1').click();
      await expect(page.getByTestId('inbox.block.open.1')).toBeVisible({ timeout: 3000 });
      // the label's left (its right is the S40/W3 divider, here 'waiting')
      await expect(label.locator('.lbl')).toHaveText('to bise · the merge waits for 1 or 2');
      await expect(page.getByTestId('inbox.block.open.1'), 'no type hint on a choice item').not.toContainText('type your answer');
      await page.screenshot({ path: test.info().outputPath('dock-merge.png') });
      await page.locator('[data-testid="composer.field"]').first().click();
      await page.keyboard.type('this one, after the tests');
      await page.keyboard.press('Enter');
      await expect.poll(() => (core.cmds() as Cmd[]).filter((c) => c.cmd === 'send').length, { timeout: 3000 }).toBe(1);
      const sent = (core.cmds() as Cmd[]).find((c) => c.cmd === 'send');
      expect(sent).toMatchObject({ agent: 'main', text: 'this one, after the tests' });
      expect((core.cmds() as Cmd[]).filter((c) => c.cmd === 'answer'), 'a typed line never answers the merge').toHaveLength(0);
    });

    await test.step("a long question docked: the label is one line, 'esc write a plain message' whole", async () => {
      await core.send(projects([long]) as never);
      await page.getByTestId('app.sidebar.agent.perf').click();
      await expect(page.getByTestId('thread.screen')).toHaveAttribute('data-agent', 'perf', { timeout: 5000 });
      await page.getByTestId('inbox.block.row.1').click();
      await expect(page.getByTestId('thread.screen')).toHaveAttribute('data-answering', 'true', { timeout: 3000 });
      await expect(label.locator('.lbl')).toContainText('answering perf · which bench');
      // on perf's own thread the block says whom esc writes to instead (amb-home's answeringOf)
      await expect(label.locator('.end')).toHaveText('esc write to perf instead');
      const box = await label.evaluate((el) => {
        const end = el.querySelector('.end');
        return { h: el.getBoundingClientRect().height, lineH: Number.parseFloat(getComputedStyle(el).lineHeight) || 16, endH: end ? end.getBoundingClientRect().height : 0, endW: end ? end.scrollWidth - end.clientWidth : -1 };
      });
      expect(box.endW, "'esc write to perf instead' not cut").toBe(0);
      expect(box.endH, 'its words on one line').toBeLessThan(box.lineH * 1.6);
      expect(box.h, 'the label one line (its padding below)').toBeLessThan(box.lineH * 1.6 + 8);
      await page.screenshot({ path: test.info().outputPath('dock-long-question.png') });
    });
  } finally {
    await s.close().catch(() => undefined);
    core.dispose();
  }
});
