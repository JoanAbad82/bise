// thread/to-agent · bar A.3 and S16 (amb-feed eb752406): in an agent's own thread, what it sent
// main ('gift-ui → bise' and its words: main is shown as bise), its question ('✉ gift-ui → bise', waits for the reply),
// and the card main opened for it, answered from there with a click (store.answer). Owner:
// amb-win (lead m_10311). The new app on the scripted core: a world whose gift-ui thread holds
// those entries; the answer read outside the page, in the core's command log.
import { FakeCore, FakeHelper, launchDesktop, test, expect } from '../../harness';
import { thread as tw } from '../../../src/proto/words.gen';
import { expectShown } from './shown';

const HOME = 'bise-home-00000000';
const ASK = 'gift cards: show the balance on the cart page, or only at checkout?';
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
      {
        project: HOME,
        name: 'bise',
        path: '/nowhere',
        git: false,
        home: true,
        order: 0,
        agents: 2,
        working: 0,
        waits: 1,
        running: true,
        // the same card in the inbox block, the one place to answer (b, designer m_15612)
        cards: [{ id: 2, project: HOME, kind: 'question', rank: 1, agent: 'gift-ui', question: ASK, options: [{ n: 1, label: 'on the cart page' }, { n: 2, label: 'only at checkout' }], urgent: false, since_ms: 1791100005000 }],
      },
    ],
  },
  { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere', name: 'bise' },
  { ev: 'agents', project: HOME, agents: [agent('main'), agent('gift-ui', { status: 'blocked', waits: 1 })] },
  {
    ev: 'thread',
    project: HOME,
    agent: 'gift-ui',
    entries: [
      { pos: 1, at_ms: 1791100001000, kind: 'from_agent', from: 'main', text: 'build the gift card balance label' },
      { pos: 2, at_ms: 1791100002000, kind: 'agent', text: 'on it' },
      { pos: 3, at_ms: 1791100003000, kind: 'to_agent', to: 'main', asks: false, msg: 8, text: 'landed the balance label' },
      { pos: 4, at_ms: 1791100004000, kind: 'to_agent', to: 'main', asks: true, msg: 9, text: ASK },
      {
        pos: 5,
        at_ms: 1791100005000,
        kind: 'card',
        text: ASK,
        card: { id: 2, question: ASK, options: [{ n: 1, label: 'on the cart page' }, { n: 2, label: 'only at checkout' }], answered: false },
      },
    ],
    before: null,
    more: false,
  },
];

test("thread/to-agent: gift-ui's own thread shows its message to main, its question, and main's card for it, answered by a click", async () => {
  const helper = new FakeHelper();
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ helper, core, route: `agent/${HOME}/gift-ui` });
  try {
    const { page } = s;
    const thread = page.getByTestId('thread.screen');
    await expect(thread).toHaveAttribute('data-agent', 'gift-ui', { timeout: 10_000 });
    await expect(page.getByTestId('thread.to.3'), 'its message to main, named bise').toContainText('gift-ui → bise', { timeout: 10_000 });
    await expect(page.getByTestId('thread.to.3')).toContainText('landed the balance label');
    await expect(page.getByTestId('thread.to.4'), 'its question, as the TUI marks it').toContainText('✉ gift-ui → bise');
    await expect(page.getByTestId('thread.to.4')).toContainText(ASK);
    // one copy of the question (ambient m_10689): on the ask; main's card right under it with its options only
    await expect(page.getByTestId('thread.asks.4'), 'with a card for it, the ask itself carries no wait tag').toHaveCount(0);
    // b (designer m_15612): main's card for it is one dim line pointing at the inbox block, no options
    await expect(page.getByTestId('thread.card.2'), "main's card for it: one line, the question stays on the ask").toHaveText(tw.card_waits);
    await expect(page.getByTestId('thread.card.2.opt.2'), 'no options in the thread').toHaveCount(0);
    await expect(page.locator('[data-testid="thread.list"]').getByText(ASK, { exact: false }), 'the question shows once in the thread').toHaveCount(1);
    // in the DOM is not on screen (amb-win 35d08ae5): a short thread's rows are shown
    await expectShown(page.getByTestId('thread.to.3'), 'its message to main');
    await expectShown(page.getByTestId('thread.to.4'), 'its question');
    await expectShown(page.getByTestId('thread.card.2'), "the card's line");
    await page.screenshot({ path: test.info().outputPath('to-agent.png') });
    // a click on the line opens it in the inbox block, where its options answer it
    await page.getByTestId('thread.card.2').click();
    await expect(page.getByTestId(`inbox.block.card.${HOME}-2`), 'the line opens the card in the inbox block').toBeVisible({ timeout: 3000 });
    await page.getByTestId(`inbox.block.card.${HOME}-2.opt.2`).click();
    const cmd = await core.waitCmd((c) => c.cmd === 'answer', 5000);
    expect(cmd, 'its option in the block answers the card').toMatchObject({ cmd: 'answer', project: HOME, card: 2, reply: '2' });
  } finally {
    await s.close();
    helper.dispose();
    core.dispose();
  }
});
