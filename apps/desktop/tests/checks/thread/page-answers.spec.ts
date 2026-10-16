// thread/page-answers · page-answer-row (architect m_20833, designer m_20985). What he did on a page
// reaches the page's agent as the hub's template, with a typed page part; the window draws the row
// from that part, never the template: his pick on a question that had a card is '✓ you answered
// bise · <question>' (the thread's name for main) with his words; a note is '✓ you sent bise a note on <title>' (the title pink, its view on a click) with his note
// under it; three notes 'you sent bise 3 notes on <title>', one per line (designer m_21035). Never 'answer with:',
// '<page-notes', '[from the page'. A light 1100 shot for designer. Owner: page-answer-row.
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import { thread } from '../../../src/proto/words.gen';

const HOME = 'bise-home-00000000';
const P = 'shop-ab9f3c3b';
const NOW = Date.now();
const MIN = 60_000;
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const ag = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 9 * MIN, waits: 0 });
const HINT = '\n\n[from the page: answer on the page; one short line at most]';
const template = (n: number, lines: string) =>
  `you sent ${String(n)} note${n === 1 ? '' : 's'} on your page "the plan" (plan v1, http://127.0.0.1:47100/p/plan):\n${lines}\nanswer with: sb page publish <file> --id plan --notes-done n1 (or --note-answer n1="…")\n<page-notes page="plan" version="1">[]</page-notes>${HINT}`;
const you = (pos: number, text: string, notes: object[]) => ({
  pos,
  at_ms: NOW - (10 - pos) * MIN,
  kind: 'you',
  text,
  parts: [{ kind: 'page', text, to: 'main', page: 'plan', title: 'the plan', version: 1, notes }],
});
const world = () => [
  prefs('light'),
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'shop', path: '/nowhere/shop', git: true, home: false, order: 1, agents: 1, working: 0, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/shop', name: 'shop' },
  { ev: 'agents', project: P, agents: [ag('main')] },
  {
    ev: 'thread',
    project: P,
    agent: 'main',
    entries: [
      { pos: 1, at_ms: NOW - 9 * MIN, kind: 'agent', text: 'the plan is on its page, two questions wait for you.' },
      you(2, template(1, "1. on q2: pick: the table now, the API's lists right after"), [
        { block: 'q2', kind: 'pick', text: "the table now, the API's lists right after", card: 516, asked: "read the lists from the providers' APIs?" },
      ]),
      { pos: 3, at_ms: NOW - 6 * MIN, kind: 'agent', text: 'ok: the table first.' },
      you(4, template(1, '1. on p1: make it shorter'), [{ block: 'p1', kind: 'note', text: 'make it shorter', quote: 'the plan: ship the table' }]),
      you(5, template(3, '1. on p1: …\n2. …\n3. …'), [
        { block: 'p1', kind: 'note', text: 'say which models first', quote: 'the plan: ship the table' },
        { block: 'r1', kind: 'tick', text: 'done' },
        { block: 'p2', kind: 'edit', text: 'Q3', quote: 'Q2' },
      ]),
    ],
    before: null,
    more: false,
  },
];

test("thread/page-answers: his answers on a page are rows of his words, never the hub's template", async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `project/${P}`, size: '1100x760' });
  try {
    const { page } = s;
    const pick = page.getByTestId('thread.pageanswer.2');
    await expect(pick).toContainText(thread.answered_card({ who: 'bise', question: "read the lists from the providers' APIs?" }), { timeout: 10_000 });
    await expect(page.getByTestId('thread.pageanswer.2.words')).toHaveText("the table now, the API's lists right after");
    await expect(page.getByTestId('thread.pageanswer.4')).toContainText('you sent bise a note on the plan');
    // the page's name is the artifact's pink inline name (desktop-agents-bar §5)
    await expect(page.getByTestId('thread.pageanswer.4.page')).toHaveText('the plan');
    await expect(page.getByTestId('thread.pageanswer.4.page')).toHaveClass(/b-artname/u);
    await expect(page.getByTestId('thread.pageanswer.4.words')).toHaveText('"the plan: ship the table": make it shorter');
    await expect(page.getByTestId('thread.pageanswer.5')).toContainText('you sent bise 3 notes on the plan');
    await expect(page.getByTestId('thread.pageanswer.5.words')).toContainText(thread.mark_done);
    await expect(page.getByTestId('thread.pageanswer.5.words')).toContainText(thread.note_edit({ old: 'Q2', new: 'Q3' }));
    const all = await page.locator('body').innerText();
    for (const bad of ['answer with:', '<page-notes', '[from the page', 'you sent 1 note on your page']) {
      expect(all, `never the hub's template: ${bad}`).not.toContain(bad);
    }
    await page.screenshot({ path: test.info().outputPath('page-answers-light.png') });
  } finally {
    await s.close();
  }
});
