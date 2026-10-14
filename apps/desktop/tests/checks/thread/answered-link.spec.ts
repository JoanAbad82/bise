// thread/answered-link · his ask (main m_24201, architect m_24206, designer m_24211): in main's
// thread, a click on '✓ answered: <question>' (docs' card #7, answered) opens docs' thread and
// brings his answer there (the approval with card 7, far up a long thread) into view, flashed once;
// ⌘[ goes back to main. The '✓ you answered docs' head (an approval with `to`) does the same. A
// card whose answer isn't in docs' thread (and no older page): docs' thread at its end and the dim
// line 'your answer is further up'. Real thread screen, scripted core (FakeCore). Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'shop-ab9f3c3b';
const NOW = Date.now();
const MIN = 60_000;
const ag = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 90 * MIN, waits: 0 });
const world = () => [
  {
    ev: 'prefs',
    prefs: { onboarded: true, theme: 'light', context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
  },
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'shop', path: '/nowhere/shop', git: true, home: false, order: 1, agents: 2, working: 0, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/shop', name: 'shop' },
  { ev: 'agents', project: P, agents: [ag('main'), ag('docs')] },
  {
    ev: 'thread',
    project: P,
    agent: 'main',
    entries: [
      { pos: 1, at_ms: NOW - 50 * MIN, kind: 'agent', text: 'docs needs your word on the folder.' },
      { pos: 2, at_ms: NOW - 49 * MIN, kind: 'card', text: 'comment lui donner accès ?', card: { id: 7, question: 'comment lui donner accès ?', options: [], answered: true, kind: 'question', agent: 'docs', closed: 'answered' } },
      // his answer to docs' card #8: its own row here (one fact, one row: no '✓ answered' line for #8)
      { pos: 3, at_ms: NOW - 48 * MIN, kind: 'approval', text: 'you answered docs: the shared drive', approval: { ok: true, text: 'you answered docs: the shared drive', card: 8, to: 'docs' } },
      { pos: 4, at_ms: NOW - 40 * MIN, kind: 'card', text: 'which folder?', card: { id: 9, question: 'which folder?', options: [], answered: true, kind: 'question', agent: 'docs', closed: 'answered' } },
      { pos: 5, at_ms: NOW - 2 * MIN, kind: 'agent', text: 'le dossier est partagé.' },
    ],
    before: null,
    more: false,
  },
];

// docs' thread: his answer at pos 3, then 40 long rows after it (it opens at its end: far out of view)
const docs = () => [
  { pos: 1, at_ms: NOW - 50 * MIN, kind: 'agent', text: 'i need access to the folder.' },
  { pos: 2, at_ms: NOW - 49 * MIN, kind: 'to_agent', to: 'main', asks: true, text: 'comment lui donner accès ?' },
  { pos: 3, at_ms: NOW - 48 * MIN, kind: 'approval', text: 'you answered docs: share it with him', approval: { ok: true, text: 'you answered docs: share it with him', card: 7, to: 'docs' } },
  { pos: 4, at_ms: NOW - 47 * MIN, kind: 'approval', text: 'you answered docs: the shared drive', approval: { ok: true, text: 'you answered docs: the shared drive', card: 8, to: 'docs' } },
  ...Array.from({ length: 40 }, (_, i) => ({ pos: 5 + i, at_ms: NOW - (47 - i) * MIN, kind: 'agent', text: `step ${String(i + 1)}: ${'the folder is being shared, one more check. '.repeat(4)}` })),
];

test("thread/answered-link: '✓ answered' in main's thread opens the asker's thread at his answer; ⌘[ back", async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `project/${P}`, size: '1100x760' });
  try {
    const { page } = s;
    const row = page.getByTestId('thread.card.7');
    await expect(row).toHaveText('✓ answered: comment lui donner accès ?', { timeout: 10_000 });
    // where it goes, in its tooltip; a pointer over it
    const link = row.locator('xpath=..');
    await expect(link).toHaveAttribute('title', "open it in docs's thread");
    expect(await link.evaluate((el) => getComputedStyle(el).cursor)).toBe('pointer');
    await page.screenshot({ path: test.info().outputPath('main-before.png') });

    await row.click();
    await core.waitCmd((c) => c.cmd === 'subscribe' && c.agent === 'docs', 10_000);
    await core.send({ ev: 'thread', project: P, agent: 'docs', entries: docs(), before: null, more: false } as never);
    const answer = page.getByTestId('thread.entry.3');
    await expect(answer, 'his answer in view').toBeInViewport({ timeout: 5000 });
    await expect(answer, 'flashed once').toHaveClass(/th-flash/u);
    await page.screenshot({ path: test.info().outputPath('docs-at-answer.png') });

    // ⌘[ back to main
    await page.keyboard.press('Meta+BracketLeft');
    await expect(page.getByTestId('thread.card.7')).toBeVisible({ timeout: 5000 });

    // the '✓ you answered docs' head (his answer to #8): the same jump, to that answer
    await page.getByTestId('thread.approval.3.link').click();
    await expect(page.getByTestId('thread.entry.4'), 'his answer to #8 in view').toBeInViewport({ timeout: 5000 });
    await page.keyboard.press('Meta+BracketLeft');

    // card #9: no answer for it in docs' thread, no older page: its end, and the miss line
    await page.getByTestId('thread.card.9').click();
    const miss = page.getByTestId('thread.answer-miss');
    await expect(miss).toHaveText('your answer is further up', { timeout: 5000 });
    await expect(page.getByTestId('thread.entry.43'), 'the thread at its end').toBeInViewport();
    await page.screenshot({ path: test.info().outputPath('docs-miss.png') });
    await expect(miss, 'gone after 4 s').toBeHidden({ timeout: 6000 });
  } finally {
    await s.close();
    core.dispose();
  }
});
