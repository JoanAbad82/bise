// inbox/new-card-mid-answer · Benjamin's bug (Gabriel: « il faut fixer ça », terminal and desktop): he
// was half way through an answer to a card when a new card came in, and his words were gone. On the
// real shell with the scripted core (FakeCore, fake data). Passes when, on perf's thread, card 9 open
// and half an answer typed:
//   - a new card that ranks first (an approval) and one more from the same agent arrive: card 9 stays
//     the open one, the composer still says 'answering perf', his words are all there and the caret
//     still types at their end; the new cards wait in the block (its head counts them);
//   - a reload: card 9's half answer is back when it opens again;
//   - the hub then closes card 9 (main withdraws it and asks again, the re-ask that took his words):
//     card 9 stays open, '· closed', the composer 'to perf · the question is closed', his words
//     there (designer m_24087); ⏎ sends them to perf as a plain message (send, never an answer) and
//     the card goes.
// The TUI's twin: rust/tui/src/sb/cards_tests.rs a_new_card_mid_answer_keeps_the_text_and_the_card
// and tests/tmux/card_draft_keep.sh. Owner: amb-home.
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
const NINE = { id: 9, project: P, kind: 'question', rank: 1, agent: 'perf', question: 'which bench?', options: two('cold', 'warm'), urgent: false, since_ms: NOW - 240_000 };
const NEW = [
  { id: 14, project: P, kind: 'confirm', approval: true, rank: 0, agent: 'release', question: 'release wants to run npm publish', options: two('allow', 'no'), urgent: false, since_ms: NOW },
  { id: 15, project: P, kind: 'question', rank: 2, agent: 'perf', question: 'and the p99 too?', options: two('yes', 'no'), urgent: false, since_ms: NOW },
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
  projects([NINE]),
  { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere', name: 'bise' },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/acme', name: 'acme' },
  { ev: 'agents', project: HOME, agents: [ag('main')] },
  { ev: 'agents', project: P, agents: [ag('main'), ag('perf'), ag('release')] },
  { ev: 'thread', project: HOME, agent: 'main', entries: [], before: null, more: false },
  { ev: 'thread', project: P, agent: 'perf', entries: [{ pos: 1, at_ms: NOW - 300_000, kind: 'agent', text: 'p95 is 900 ms on mobile.' }], before: null, more: false },
];
type Cmd = { cmd?: string; card?: number; reply?: string };

const field = (page: Page) => page.locator('[data-testid="composer.field"]').first();
const nine = (page: Page) => page.getByTestId(`inbox.block.card.${P}-9`);
const HALF = 'warm, but only after the reindex';

async function openNine(page: Page): Promise<void> {
  if ((await nine(page).count()) > 0) return;
  await page.locator('[data-testid^="inbox.block.row."]', { hasText: 'which bench?' }).first().click();
  await expect(nine(page), 'card 9 open in the block').toBeVisible({ timeout: 5000 });
}

test('inbox/new-card-mid-answer: a new card never takes the card he answers nor his half answer', async () => {
  const core = new FakeCore(world as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/perf`, size: '1100x760' });
  try {
    const { page } = s;
    await expect(page.getByTestId('inbox.block')).toBeVisible({ timeout: 10_000 });
    await openNine(page);
    await field(page).click();
    await page.keyboard.type(HALF);
    await expect(field(page)).toHaveText(HALF);

    await test.step('two new cards come in, one ranked first: card 9 stays open, his words stay', async () => {
      await core.send(projects([NINE, ...NEW]) as never);
      await expect(page.getByTestId('inbox.block'), 'the block counts the new ones').toContainText('3', { timeout: 5000 });
      await page.waitForTimeout(500);
      await expect(nine(page), 'card 9 is still the open one').toBeVisible();
      await expect(field(page), 'his half answer is all there').toHaveText(HALF);
      await expect(page.getByTestId('thread.screen')).toHaveAttribute('data-answering', 'true');
      await page.screenshot({ path: test.info().outputPath('new-card-mid-answer.png') });
      // the caret still types at the end of his words
      await page.keyboard.type(' tonight');
      await expect(field(page)).toHaveText(`${HALF} tonight`);
    });

    await test.step('a reload: card 9 gives his half answer back', async () => {
      await page.waitForTimeout(800);
      await page.reload();
      await expect(page.getByTestId('inbox.block')).toBeVisible({ timeout: 10_000 });
      await openNine(page);
      await expect(field(page), "card 9's half answer after a reload").toHaveText(`${HALF} tonight`, { timeout: 5000 });
    });

    await test.step("main withdraws card 9 and asks again: card 9 stays open, closed, his words stay", async () => {
      await core.send(projects([...NEW, { ...NINE, id: 16, question: 'which bench, cold or warm?', since_ms: Date.now() }]) as never);
      await expect(nine(page), 'card 9 stays open').toHaveAttribute('data-closed', 'true', { timeout: 5000 });
      await expect(nine(page)).toContainText('· closed');
      await expect(field(page), 'his words stay').toHaveText(`${HALF} tonight`);
      await expect(page.getByTestId('thread.screen')).toContainText('to perf · the question is closed');
      await page.screenshot({ path: test.info().outputPath('closed-mid-answer.png') });
    });

    await test.step('⏎ sends his words to perf as a plain message, never an answer; the card goes', async () => {
      await field(page).click();
      await page.keyboard.press('End');
      await page.keyboard.press('Enter');
      const m = (await core.waitCmd((c) => (c as Cmd & { agent?: string }).cmd === 'send', 5000)) as Cmd & { agent?: string; text?: string };
      expect(m.agent).toBe('perf');
      expect(m.text).toBe(`${HALF} tonight`);
      expect(core.cmds().filter((c) => (c as Cmd).cmd === 'answer')).toEqual([]);
      await expect(nine(page)).toHaveCount(0, { timeout: 3000 });
    });
  } finally {
    await s.close();
    core.dispose();
  }
});
