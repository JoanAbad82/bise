// thread/answer-in-thread · his pick A (designer m_24425 / m_24628, ambient-lead m_24432). In bise's
// view he answers ts-pattern's card from the inbox block ('1 merge it'); the hub takes it: the
// window goes to ts-pattern's main thread (a history step), his answer there in view and flashed
// once, the line under it 'answered from bise · <time>' with its tip; bise's thread shows nothing of
// it; esc on the empty composer brings him back to bise's view. Shots light and dark at 1400, 1100
// and 800 wide: before send, landed (with the flash), back. Scripted core (FakeCore). Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import type { Page } from '@playwright/test';

const HOME = 'bise-home-00000000';
const P = 'ts-pattern-5e1f2a3b';
const NOW = Date.now();
const MIN = 60_000;
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const ag = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 90 * MIN, waits: 0 });
const CARD = { id: 384, project: P, kind: 'question', rank: 1, agent: 'pattern-error-dx', question: '#384 is ready to merge', options: [{ n: 1, label: 'merge it' }, { n: 2, label: 'not yet' }], urgent: false, since_ms: NOW - 9 * MIN };
const projects = (cards: readonly unknown[]) => ({
  ev: 'projects',
  projects: [
    { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true, cards: [] },
    { project: P, name: 'ts-pattern', path: '/nowhere/ts-pattern', git: true, home: false, order: 1, agents: 2, working: 0, waits: cards.length, running: true, cards },
  ],
});
const world = () => [
  prefs('light'),
  projects([CARD]),
  { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere', name: 'bise' },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/ts-pattern', name: 'ts-pattern' },
  { ev: 'agents', project: HOME, agents: [ag('main')] },
  { ev: 'agents', project: P, agents: [ag('main'), ag('pattern-error-dx')] },
  {
    ev: 'thread',
    project: HOME,
    agent: 'main',
    entries: [
      { pos: 1, at_ms: NOW - 30 * MIN, kind: 'you', text: 'what is left for the release?' },
      { pos: 2, at_ms: NOW - 29 * MIN, kind: 'agent', text: "partial-red's heavy-run ended green. one thing waits on you: ts-pattern's #384." },
    ],
    before: null,
    more: false,
  },
];
// ts-pattern's main thread as the hub has it after his answer: the ask, the card, his answer (the
// route line's approval, card 384, to the asker), main's reply; and older rows above
const tsThread = () => [
  ...Array.from({ length: 24 }, (_, i) => ({ pos: 1 + i, at_ms: NOW - (60 - i) * MIN, kind: 'agent', text: `step ${String(i + 1)}: ${'the exhaustive check now names the missing case. '.repeat(3)}` })),
  { pos: 30, at_ms: NOW - 9 * MIN, kind: 'from_agent', from: 'pattern-error-dx', to: 'main', text: 'the PR is green on every target. #384 is ready to merge.' },
  { pos: 31, at_ms: NOW - 9 * MIN, kind: 'card', text: '#384 is ready to merge', card: { id: 384, question: '#384 is ready to merge', options: [], answered: true, kind: 'question', agent: 'pattern-error-dx', closed: 'answered' } },
  { pos: 32, at_ms: NOW, kind: 'approval', text: 'you answered pattern-error-dx: merge it', approval: { ok: true, text: 'you answered pattern-error-dx: merge it', card: 384, to: 'pattern-error-dx' } },
  { pos: 33, at_ms: NOW, kind: 'agent', text: 'merging #384 now. the release notes follow.' },
];
type Cmd = { cmd?: string; card?: number; reply?: string; agent?: string; project?: string };

async function shots(page: Page, core: FakeCore, name: string): Promise<void> {
  await page.mouse.move(1, 1);
  await page.screenshot({ path: test.info().outputPath(`${name}-light.png`) });
  await core.send(prefs('dark') as never);
  await page.waitForTimeout(250);
  await page.screenshot({ path: test.info().outputPath(`${name}-dark.png`) });
  await core.send(prefs('light') as never);
  await page.waitForTimeout(250);
}

for (const size of ['1400x900', '1100x760', '800x700']) {
  test(`thread/answer-in-thread @${size}: his answer to ts-pattern's card from bise's view takes the window to ts-pattern's main at his answer; esc back`, async () => {
    const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
    const s = await launchDesktop({ core, route: 'bise', size });
    const w = size.split('x')[0] ?? '';
    try {
      const { page } = s;
      const block = page.getByTestId('inbox.block');
      await expect(block).toContainText('#384 is ready to merge', { timeout: 10_000 });
      // the item open in place (the one waiting), then '1 merge it'
      const row = page.locator('[data-testid^="inbox.block.row."]', { hasText: '#384 is ready to merge' });
      if ((await row.count()) > 0) await row.first().click();
      await expect(page.locator(`[data-testid="inbox.block.card.${P}-384"]`)).toBeVisible({ timeout: 5000 });
      await shots(page, core, `${w}-1-before-send`);

      // the hub takes it: its rows drop the card, its result says the answer
      await core.result('answer', 384, { answer: { agent: 'pattern-error-dx', question: '#384 is ready to merge', said: '1', pick: 'merge it', notice: 'you answered pattern-error-dx: merge it' } }, [projects([])]);
      await page.keyboard.press('1');
      const a = (await core.waitCmd((c) => (c as Cmd).cmd === 'answer' && (c as Cmd).card === 384, 5000)) as Cmd;
      expect(a.reply).toBe('1');

      // the window goes to ts-pattern's main thread
      await core.waitCmd((c) => (c as Cmd).cmd === 'subscribe' && (c as Cmd).project === P && (c as Cmd).agent === 'main', 10_000);
      await core.send({ ev: 'thread', project: P, agent: 'main', entries: tsThread(), before: null, more: false } as never);
      const answer = page.getByTestId('thread.entry.32');
      await expect(answer, 'his answer in view').toBeInViewport({ timeout: 5000 });
      await expect(answer, 'flashed once').toHaveClass(/th-flash/u);
      // a normal row: the hub's head, the option's words (never the digit), where he made it
      await expect(page.getByTestId('thread.approval.32.head')).toContainText('you answered pattern-error-dx');
      await expect(page.getByTestId('thread.approval.32.words')).toHaveText('merge it');
      const from = page.getByTestId('thread.approval.32.from');
      await expect(from).toHaveText(/^answered from bise · \d\d:\d\d$/u);
      await expect(from).toHaveAttribute('data-tip', /^you answered this from bise's thread at \d\d:\d\d$/u);
      // one fact, one row (designer m_24812): no quiet '✓ answered: #384…' line over his own row
      await expect(page.getByTestId('thread.card.384')).toHaveCount(0);
      await shots(page, core, `${w}-2-landed`);

      // esc on the empty composer: back to bise's view, where nothing says it
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');
      await expect(page.getByTestId('thread.list')).toContainText("partial-red's heavy-run ended green", { timeout: 5000 });
      await expect(page.getByTestId('thread.list')).not.toContainText('you answered');
      // the item left the inbox (nothing waits: no block at all)
      await expect(page.getByTestId('inbox.block').filter({ hasText: '#384 is ready to merge' })).toHaveCount(0);
      await shots(page, core, `${w}-3-back`);
    } finally {
      await s.close();
      core.dispose();
    }
  });
}
