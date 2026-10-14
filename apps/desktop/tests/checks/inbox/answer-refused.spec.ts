// inbox/answer-refused · inbox-fix (Gabriel: «the inbox and answer bugs are very unpleasant»; architect
// m_23524: the core answers his card/answer and card/close with the hub's own response, so a refusal is
// that very card's). On the real shell with the scripted core (FakeCore, fake data). Passes when:
//   - an answer the hub refuses: that card is back in the block at once, the hub's words on screen, and
//     no '✓ you answered' anywhere;
//   - an answer the hub takes (its AnswerResult) to a card asked by another agent leaves '✓ you answered
//     search' in perf's thread, where he is, and the card leaves the block;
//   - a close the hub refuses: that card is back too, with the words;
//   - a reload and a project switch and back: the answered card stays out (the hub's rows dropped it
//     before its answer, as the real hub's step does), the refused ones stay in, his row stays.
// Owner: amb-home.
import type { Page } from '@playwright/test';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const NOW = Date.now();
const ag = (name: string) => ({ name, main: name === 'main', status: name === 'main' ? 'idle' : 'waiting', archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 3_600_000, waits: name === 'main' ? 0 : 1 });
const two = (a: string, b: string) => [
  { n: 1, label: a },
  { n: 2, label: b },
];
const CARDS = [
  { id: 9, project: P, kind: 'question', rank: 1, agent: 'perf', question: 'which bench?', options: two('cold', 'warm'), urgent: false, since_ms: NOW - 240_000 },
  { id: 11, project: P, kind: 'question', rank: 2, agent: 'search', question: 'reindex tonight or now?', options: two('tonight', 'now'), urgent: false, since_ms: NOW - 120_000 },
  { id: 13, project: P, kind: 'question', rank: 3, agent: 'search', question: 'drop the old index?', options: two('drop it', 'keep it'), urgent: false, since_ms: NOW - 60_000 },
];
const projects = (cards: readonly unknown[]) => ({
  ev: 'projects',
  projects: [
    { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true, cards: [] },
    { project: P, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 1, agents: 3, working: 0, waits: cards.length, running: true, cards },
  ],
});
const world = [
  {
    ev: 'prefs',
    prefs: { onboarded: true, theme: 'light', context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
  },
  projects(CARDS),
  { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere', name: 'bise' },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/acme', name: 'acme' },
  { ev: 'agents', project: HOME, agents: [ag('main')] },
  { ev: 'agents', project: P, agents: [ag('main'), ag('perf'), ag('search')] },
  { ev: 'thread', project: HOME, agent: 'main', entries: [], before: null, more: false },
  { ev: 'thread', project: P, agent: 'perf', entries: [{ pos: 1, at_ms: NOW - 300_000, kind: 'agent', text: 'p95 is 900 ms on mobile.' }], before: null, more: false },
];
type Cmd = { cmd?: string; card?: number; reply?: string };

const cardIn = (page: Page, id: number) => page.getByTestId(`inbox.block.card.${P}-${String(id)}`);
const rowOf = (page: Page, question: string) => page.locator('[data-testid^="inbox.block.row."]', { hasText: question });
/** Card `id` is in the block: open in place (its element) or a row (folded under '+ N more' counts too). */
async function inBlock(page: Page, id: number, question: string): Promise<boolean> {
  if ((await cardIn(page, id).count()) > 0 || (await rowOf(page, question).count()) > 0) return true;
  // no block at all (nothing waits): not there
  if ((await page.getByTestId('inbox.block').count()) === 0) return false;
  return ((await page.getByTestId('inbox.block').textContent()) ?? '').includes(question);
}
/** The block unfolded ('+ N more' clicked): every item a row. */
async function unfold(page: Page): Promise<void> {
  const more = page.getByTestId('inbox.block.more');
  if ((await more.count()) > 0) await more.click();
}
const present = async (page: Page, id: number, question: string, why: string) => {
  await unfold(page);
  await expect.poll(async () => (await unfold(page), await inBlock(page, id, question)), { message: why, timeout: 5000 }).toBe(true);
};
/** Card `id` says 'not sent' where it is in the block: its row, or the open card's refused line. */
async function notSent(page: Page, id: number, question: string): Promise<boolean> {
  await unfold(page);
  const row = rowOf(page, question);
  if ((await row.count()) > 0) return ((await row.first().textContent()) ?? '').includes('not sent');
  const line = cardIn(page, id).getByTestId(`inbox.block.card.${P}-${String(id)}.refused`);
  return (await line.count()) > 0 && ((await line.textContent()) ?? '').startsWith('not sent: ');
}
/** Card `id` open in place in the block: as it is when the block opened it, else its row clicked. */
async function open(page: Page, id: number, question: string): Promise<void> {
  await present(page, id, question, `the block holds '${question}'`);
  if ((await cardIn(page, id).count()) > 0) return;
  await rowOf(page, question).first().click();
  await expect(cardIn(page, id)).toHaveCount(1, { timeout: 3000 });
}

test('inbox/answer-refused: a refused answer or close shows that card again with the words; a taken one stays out across a reload and a switch, his row where he is', async () => {
  const core = new FakeCore(world as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/perf`, size: '1100x760' });
  try {
    const { page } = s;
    await expect(page.getByTestId('inbox.block')).toBeVisible({ timeout: 10_000 });
    await present(page, 9, 'which bench?', 'the world is in the block');

    await test.step('an answer the hub refuses: card 9 is back at once, the hub\'s words say why, no row says answered', async () => {
      await core.refuse('answer', 9, 'perf asked again: card 9 is not open any more');
      await open(page, 9, 'which bench?');
      await page.keyboard.press('1');
      const a = (await core.waitCmd((c) => (c as Cmd).cmd === 'answer' && (c as Cmd).card === 9, 5000)) as Cmd;
      expect(a.reply).toBe('1');
      await present(page, 9, 'which bench?', 'card 9 is back');
      // try-gate-f2a7: the words on the card that came back, where he answered, never the project's line
      await expect(rowOf(page, 'which bench?').first()).toContainText('not sent', { timeout: 3000 });
      await open(page, 9, 'which bench?');
      await expect(cardIn(page, 9).getByTestId(`inbox.block.card.${P}-9.refused`)).toContainText('not sent: perf asked again: card 9 is not open any more · try again', { timeout: 3000 });
      await expect(page.locator('[data-testid="confirm.notice"][data-level="error"]')).toHaveCount(0);
      await expect(page.locator('[data-testid^="thread.aside."]')).toHaveCount(0);
      await page.keyboard.press('Escape');
    });

    await test.step("an answer the hub takes, to search's card from perf's thread: out of the block, '✓ you answered search' here", async () => {
      // the hub's step drops card 11 from its rows before it answers (the real hub's order)
      await core.result('answer', 11, { answer: { agent: 'search', question: 'reindex tonight or now?', said: '1', pick: 'tonight', notice: 'you answered search: tonight' } }, [projects(CARDS.filter((c) => c.id !== 11))]);
      await open(page, 11, 'reindex tonight or now?');
      await page.keyboard.press('1');
      await core.waitCmd((c) => (c as Cmd).cmd === 'answer' && (c as Cmd).card === 11, 5000);
      await expect.poll(async () => (await unfold(page), await inBlock(page, 11, 'reindex tonight or now?')), { message: 'card 11 leaves the block', timeout: 3000 }).toBe(false);
      await expect(page.getByTestId('thread.aside.11')).toContainText('you answered search', { timeout: 3000 });
    });

    await test.step('a close the hub refuses: card 13 is back with the words', async () => {
      await core.refuse('close', 13, 'search is still on it: card 13 stays');
      await open(page, 13, 'drop the old index?');
      // the open card's close: ⌘⌫, the TUI's
      await page.keyboard.press('Meta+Backspace');
      await core.waitCmd((c) => (c as Cmd).cmd === 'close' && (c as Cmd).card === 13, 5000);
      await present(page, 13, 'drop the old index?', 'card 13 is back');
      await open(page, 13, 'drop the old index?');
      await expect(cardIn(page, 13).getByTestId(`inbox.block.card.${P}-13.refused`)).toContainText('not sent: search is still on it: card 13 stays', { timeout: 3000 });
      await expect(page.locator('[data-testid="confirm.notice"][data-level="error"]')).toHaveCount(0);
      await page.keyboard.press('Escape');
    });

    const settled = async (why: string, refusedToo = true) => {
      await expect(page.getByTestId('inbox.block'), why).toBeVisible({ timeout: 10_000 });
      await present(page, 9, 'which bench?', `${why}: the refused answer's card stays`);
      if (refusedToo) await present(page, 13, 'drop the old index?', `${why}: the refused close's card stays`);
      await unfold(page);
      expect(await inBlock(page, 11, 'reindex tonight or now?'), `${why}: the answered card never comes back`).toBe(false);
      // the words stay on the cards that came back, never on the project's line
      await expect.poll(() => notSent(page, 9, 'which bench?'), { message: `${why}: card 9 says not sent`, timeout: 5000 }).toBe(true);
      if (refusedToo) await expect.poll(() => notSent(page, 13, 'drop the old index?'), { message: `${why}: card 13 says not sent`, timeout: 5000 }).toBe(true);
      await expect(page.locator('[data-testid="confirm.notice"][data-level="error"]'), `${why}: no project error line`).toHaveCount(0);
    };

    await test.step('a reload: the same (the hub dropped card 11), his row stays', async () => {
      await page.reload();
      await settled('after a reload');
      await expect(page.getByTestId('thread.aside.11')).toContainText('you answered search', { timeout: 5000 });
    });

    await test.step("a project switch (bise's main) and back: the same", async () => {
      await page.evaluate((h) => {
        window.location.hash = h;
      }, `#/agent/${HOME}/main`);
      await settled("on bise's main");
      await page.evaluate((h) => {
        window.location.hash = h;
      }, `#/agent/${P}/perf`);
      await settled('back on perf');
    });

    await test.step("the hub's rows drop card 11: gone for good, the others as they were", async () => {
      await core.send(projects(CARDS.filter((c) => c.id !== 11)) as never);
      await settled('the rows caught up');
    });

    await test.step('the hub then takes the late close (its rows drop card 13): the card and its words go at once, card 9 keeps its own', async () => {
      await core.send(projects(CARDS.filter((c) => c.id === 9)) as never);
      await unfold(page);
      await expect.poll(async () => (await unfold(page), await inBlock(page, 13, 'drop the old index?')), { message: 'card 13 leaves', timeout: 3000 }).toBe(false);
      await expect(page.locator('body')).not.toContainText('search is still on it', { timeout: 3000 });
      await settled('after the late take', false);
    });

    await test.step("'try again' on card 9 sends his answer once more: the card and its words go", async () => {
      const nine = () => core.cmds().filter((c) => (c as Cmd).cmd === 'answer' && (c as Cmd).card === 9) as Cmd[];
      const before = nine().length;
      // taken this time: the hub's rows drop card 9 before its answer
      await core.result('answer', 9, {}, [projects([])]);
      await open(page, 9, 'which bench?');
      await cardIn(page, 9).getByTestId(`inbox.block.card.${P}-9.retry`).click();
      await expect.poll(() => nine().length, { message: 'his answer to card 9 goes again', timeout: 5000 }).toBe(before + 1);
      expect(nine().at(-1)?.reply).toBe('1');
      await expect.poll(async () => (await unfold(page), await inBlock(page, 9, 'which bench?')), { message: 'card 9 leaves', timeout: 3000 }).toBe(false);
      await expect(page.locator('body')).not.toContainText('not sent', { timeout: 3000 });
    });
  } finally {
    await s.close();
    core.dispose();
  }
});
