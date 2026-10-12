// inbox/drafts · bar I6 / B3 (a draft per inbox item; da90eaec: two items, one draft each, was not
// checked), ambient-lead m_12176. Owner: qa-flows. The NEW app on the REAL core over the throwaway
// world; shop's main adds two questions to his inbox. Passes when: half an answer typed on item A,
// then on item B, then back to A shows A's words, B's words come back on B; nothing was sent (both
// cards still open in the hub); and they are still there after the window closes and opens again.
import path from 'node:path';
import { test, expect } from '../../harness';
import { hubOf, hubState, launchOn, realWorld, worldSay } from '../world';
import type { Page } from '@playwright/test';

const T = {
  root: '[data-testid="inbox.root"]',
  items: '[data-testid^="inbox.item."]',
  answer: '[data-testid="inbox.answer"]',
};

async function openItem(page: Page, words: string): Promise<void> {
  await page.locator(T.items, { hasText: words }).first().click({ timeout: 15_000 });
  await expect(page.locator(T.answer), `${words}: a question takes words`).toBeVisible({ timeout: 5000 });
}

test('inbox/drafts: each item keeps its own half answer, across items and a reopen', async () => {
  test.skip(true, "one inbox commit 2 (designer m_19631): the ⌘I screen and its per-item answer field are gone; per-item drafts in the block's composer come with commit 2b right after (ambient-lead m_20064), which ports this check");
  test.setTimeout(240_000);
  const w = realWorld();
  const n = `d${Date.now() % 1_000_000}`;
  const A = `first ask ${n}: which flag name?`;
  const B = `second ask ${n}: ship today or monday?`;
  worldSay('shop', `[[bash: sb card "${A}"]] asked`);
  worldSay('shop', `[[bash: sb card "${B}"]] asked`);
  const sock = hubOf(w, 'shop').sock;
  const open = async () => (((await hubState(sock))['cards'] as { text?: string; question?: string }[] | undefined) ?? []).filter((c) => `${c.text ?? ''}${c.question ?? ''}`.includes(n)).length;
  await expect.poll(open, { timeout: 60_000, message: 'both cards are in the hub' }).toBe(2);
  const s = await launchOn(w, 'inbox', T.root);
  try {
    const { page } = s;
    await expect(page.locator(T.root)).toBeVisible({ timeout: 15_000 });
    await openItem(page, A);
    await page.locator(T.answer).click();
    await page.keyboard.type(`half of A ${n}`);
    await openItem(page, B);
    await expect.soft(page.locator(T.answer), "B opens with its own field, not A's words").toHaveValue('');
    await page.locator(T.answer).click();
    await page.keyboard.type(`half of B ${n}`);
    await openItem(page, A);
    await expect.soft(page.locator(T.answer), "back on A: A's half answer").toHaveValue(`half of A ${n}`);
    await openItem(page, B);
    await expect.soft(page.locator(T.answer), "back on B: B's half answer").toHaveValue(`half of B ${n}`);
    await page.screenshot({ path: test.info().outputPath('drafts.png') });
    expect.soft(await open(), 'nothing was sent: both still open in the hub').toBe(2);
    // a reload keeps them (as app/keep-all; a second harness launch has fresh user data, so a
    // close and relaunch can't tell)
    await page.reload();
    await expect(page.locator(T.root)).toBeVisible({ timeout: 15_000 });
    await openItem(page, A);
    await expect.soft(page.locator(T.answer), "after a reload: A's").toHaveValue(`half of A ${n}`);
    await openItem(page, B);
    await expect.soft(page.locator(T.answer), "after a reload: B's").toHaveValue(`half of B ${n}`);
    test.info().annotations.push({ type: 'project', description: path.basename(path.dirname(sock)) });
  } finally {
    await s.close();
  }
});
