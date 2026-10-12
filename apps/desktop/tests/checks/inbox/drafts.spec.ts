// inbox/drafts · bar I6 / B3 (a draft per inbox item; da90eaec: two items, one draft each, was not
// checked), ambient-lead m_12176; one inbox commit 2b (the block's composer, amb-web's draftKey).
// Owner: amb-home (qa-flows' first cut on the ⌘I screen). The NEW app on the REAL core over the
// throwaway world; shop's main adds two questions to his inbox. Passes when, in shop's thread with
// words of his own in the composer: half an answer typed on card A, then on card B, then back to A
// shows A's words, B's come back on B; esc folds the block and the thread's own words are back;
// nothing was sent (both cards still open in the hub); and all of it is still there after a reload.
import path from 'node:path';
import { test, expect, type Session } from '../../harness';
import { hubOf, hubState, launchOn, menuKey, realWorld, worldSay } from '../world';
import type { Page } from '@playwright/test';

const FIELD = '[data-testid="composer.field"]';

/** The card in the block, open: its row's click, else ⌘I and '+ N more' until it is the open one. */
async function openCard(s: Session, key: string, words: string): Promise<void> {
  const { page } = s;
  const card = page.getByTestId(`inbox.block.card.${key}`);
  if (await card.isVisible()) return;
  const row = page.locator('[data-testid^="inbox.block.row."]', { hasText: words }).first();
  if (await row.isVisible()) await row.click();
  else {
    if ((await page.locator('[data-testid^="inbox.block.open."]').count()) === 0) await menuKey(s, 'CmdOrCtrl+I');
    for (let i = 0; i < 10 && !(await card.isVisible()); i++) {
      await page.getByTestId('inbox.block.more').click({ timeout: 3000 }).catch(() => undefined);
      await page.waitForTimeout(200);
    }
  }
  await expect(card, `${words}: its card open in the block`).toBeVisible({ timeout: 5000 });
}

async function typeIn(page: Page, words: string): Promise<void> {
  await page.locator(FIELD).first().click();
  await page.keyboard.press('End');
  await page.keyboard.type(words);
}

const field = (page: Page) => page.locator(FIELD).first();

test('inbox/drafts: each card keeps its own half answer in the composer, the thread its own words, across a reload', async () => {
  test.setTimeout(240_000);
  const w = realWorld();
  const n = `d${String(Date.now() % 1_000_000)}`;
  const A = `first ask ${n}: which flag name?`;
  const B = `second ask ${n}: ship today or monday?`;
  worldSay('shop', `[[bash: sb card "${A}"]] asked`);
  worldSay('shop', `[[bash: sb card "${B}"]] asked`);
  const hub = hubOf(w, 'shop');
  type HubCard = { id: number; text?: string; question?: string };
  const ours = async () => (((await hubState(hub.sock))['cards'] as HubCard[] | undefined) ?? []).filter((c) => `${c.text ?? ''}${c.question ?? ''}`.includes(n));
  await expect.poll(async () => (await ours()).length, { timeout: 60_000, message: 'both cards are in the hub' }).toBe(2);
  const cards = await ours();
  const idOf = (words: string) => cards.find((c) => `${c.text ?? ''}${c.question ?? ''}`.includes(words))?.id;
  // the window's project id is the hub's folder (as review/feature), not the world's name
  const project = path.basename(path.dirname(hub.sock));
  const keyA = `${project}-${String(idOf(A))}`;
  const keyB = `${project}-${String(idOf(B))}`;
  const s = await launchOn(w, `agent/${project}/main`, FIELD);
  try {
    const { page } = s;
    await expect(field(page), "shop's thread with its composer").toBeVisible({ timeout: 15_000 });
    await typeIn(page, `thread words ${n}`);
    await openCard(s, keyA, `first ask ${n}`);
    await expect.soft(field(page), "A opens on a blank field: the thread's words stay the thread's").toHaveText('');
    await typeIn(page, `half of A ${n}`);
    await openCard(s, keyB, `second ask ${n}`);
    await expect.soft(field(page), "B opens with its own field, not A's words").toHaveText('');
    await typeIn(page, `half of B ${n}`);
    await openCard(s, keyA, `first ask ${n}`);
    await expect.soft(field(page), "back on A: A's half answer").toHaveText(`half of A ${n}`);
    await openCard(s, keyB, `second ask ${n}`);
    await expect.soft(field(page), "back on B: B's half answer").toHaveText(`half of B ${n}`);
    await page.screenshot({ path: test.info().outputPath('drafts.png') });
    // esc folds the block: the thread's own words come back
    await field(page).click();
    await page.keyboard.press('Escape');
    await expect.soft(page.locator('[data-testid^="inbox.block.open."]'), 'esc folds the block').toHaveCount(0, { timeout: 3000 });
    await expect.soft(field(page), "folded: the thread's words").toHaveText(`thread words ${n}`);
    expect.soft((await ours()).length, 'nothing was sent: both still open in the hub').toBe(2);
    // a reload keeps them (as app/keep-all; a second harness launch has fresh user data, so a
    // close and relaunch can't tell)
    await page.waitForTimeout(800);
    await page.reload();
    await expect(field(page)).toBeVisible({ timeout: 15_000 });
    await expect.soft(field(page), "after a reload: the thread's words").toHaveText(`thread words ${n}`, { timeout: 5000 });
    await openCard(s, keyA, `first ask ${n}`);
    await expect.soft(field(page), "after a reload: A's").toHaveText(`half of A ${n}`, { timeout: 5000 });
    await openCard(s, keyB, `second ask ${n}`);
    await expect.soft(field(page), "after a reload: B's").toHaveText(`half of B ${n}`, { timeout: 5000 });
    await page.screenshot({ path: test.info().outputPath('drafts-reloaded.png') });
    test.info().annotations.push({ type: 'project', description: path.basename(path.dirname(hub.sock)) });
  } finally {
    await s.close();
  }
});
