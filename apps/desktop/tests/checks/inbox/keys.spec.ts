// inbox/keys · bar I3 (the walk: ↑↓ items, ←→ options, ⌃N an item wherever the focus is) and I8
// (ctrl+o opens an item's folded lines), da90eaec / ambient-lead m_12176; one inbox commit 2b: the
// walk is the block's, in place under the thread (the ⌘I screen and its ctrl+n / ctrl+p are gone,
// designer m_19631). Owner: amb-home (qa-flows' first cut on the screen). The NEW app on the REAL
// core over the throwaway world (../world.ts); shop's main adds two cards (one with a 14-line
// question, so it folds), so ⌘I has at least 3 items. Passes when:
//   - ⌘I opens the block on an item; ↓ / ↑ on an empty field go to the next / previous item;
//   - → puts the open item's first option on, ← is noted;
//   - with words in the field ↓ is his words' (the item stays), ⌃1 still opens item 1;
//   - the long item shows 6 lines and '… N more lines ctrl o'; ctrl+o opens it whole, again folds it.
import path from 'node:path';
import { test, expect } from '../../harness';
import { hubOf, launchOn, menuKey, realWorld, worldSay } from '../world';
import type { Page } from '@playwright/test';

const FIELD = '[data-testid="composer.field"]';
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** The open item: its place in the list (inbox.block.open.<n>) and its key ('<project>-<id>'). */
async function current(page: Page): Promise<{ n: number; key: string }> {
  const open = await page.locator('[data-testid^="inbox.block.open."]').evaluateAll((els) => els.map((e) => e.getAttribute('data-testid') ?? ''));
  const n = Number(/^inbox\.block\.open\.(\d+)$/.exec(open[0] ?? '')?.[1] ?? '0');
  const cards = await page.locator('[data-testid^="inbox.block.card."], [data-testid="inbox.block.notify"]').evaluateAll((els) => els.map((e) => e.getAttribute('data-testid') ?? ''));
  const key = cards.map((x) => (x === 'inbox.block.notify' ? 'notify' : (/^inbox\.block\.card\.([^.]+)$/.exec(x)?.[1] ?? ''))).find((x) => x !== '') ?? '';
  return { n, key };
}

/** The item whose words are `words`, open: its row's click, else '+ N more' until it is. */
async function openOn(page: Page, words: string): Promise<void> {
  const card = page.locator('[data-testid^="inbox.block.open."]', { hasText: words });
  const row = page.locator('[data-testid^="inbox.block.row."]', { hasText: words }).first();
  if (await row.isVisible()) await row.click();
  for (let i = 0; i < 10 && !(await card.isVisible()); i++) {
    await page.getByTestId('inbox.block.more').click({ timeout: 3000 }).catch(() => undefined);
    await sleep(200);
  }
  await expect(card, `${words}: open in the block`).toBeVisible({ timeout: 5000 });
}

test('inbox/keys: ↑↓ ←→ ⌃N walk the inbox block, ctrl+o opens a folded item', async () => {
  test.setTimeout(240_000);
  const w = realWorld();
  const n = `k${String(Date.now() % 1_000_000)}`;
  const long = Array.from({ length: 14 }, (_, i) => `line ${String(i + 1)} of the long ask ${n}`).join('\\n');
  worldSay('shop', `[[bash: sb notify "$(printf '${long}')"]] asked`);
  worldSay('shop', `[[bash: sb notify "short ask ${n}: cart page or checkout?"]] asked`);
  // the window's project id is the hub's folder (as review/feature), not the world's name
  const project = path.basename(path.dirname(hubOf(w, 'shop').sock));
  const s = await launchOn(w, `agent/${project}/main`, FIELD);
  const { page } = s;
  const note = (type: string, v: unknown) => test.info().annotations.push({ type, description: typeof v === 'string' ? v : JSON.stringify(v) });
  try {
    await expect(page.locator(FIELD).first(), "shop's thread with its composer").toBeVisible({ timeout: 15_000 });
    await expect.poll(async () => (await page.getByTestId('inbox.block').textContent()) ?? '', { timeout: 30_000, message: 'the 2 new cards are in the block' }).toMatch(/[3-9]\d* waiting|\d{2,} waiting/);
    expect(await menuKey(s, 'CmdOrCtrl+I'), 'the app menu has an item on ⌘I').not.toBe('');
    await expect(page.locator('[data-testid^="inbox.block.open."]'), '⌘I opens an item in place').toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: test.info().outputPath('opened.png') });

    await test.step('↓ / ↑ on an empty field', async () => {
      await page.locator(FIELD).first().click();
      const a = await current(page);
      note('first', a);
      await page.keyboard.press('ArrowDown');
      await expect.soft.poll(async () => (await current(page)).n, { timeout: 3000, message: '↓: the next item' }).toBe(a.n + 1);
      await page.keyboard.press('ArrowUp');
      await expect.soft.poll(async () => (await current(page)).key, { timeout: 3000, message: '↑: back' }).toBe(a.key);
    });

    await test.step('→ / ← the options', async () => {
      const { key } = await current(page);
      const opt1 = page.locator(`[data-testid="inbox.block.card.${key}.opt.1"]`);
      if ((await opt1.count()) === 0) {
        note('options', `the open item ${key} has no options`);
        return;
      }
      await page.keyboard.press('ArrowRight');
      await expect.soft(opt1, '→: option 1 on').toHaveAttribute('aria-selected', 'true', { timeout: 3000 });
      await page.keyboard.press('ArrowLeft');
      // the bar doesn't say whether ← from option 1 clears the pick or stays on it: note it, no red
      note('← after →: option 1 aria-selected', await opt1.getAttribute('aria-selected'));
    });

    await test.step('words in the field: ↓ is his, ⌃1 still opens item 1', async () => {
      await openOn(page, `short ask ${n}`);
      const q = await current(page);
      await page.locator(FIELD).first().click();
      await page.keyboard.type(`half ${n}`);
      await page.keyboard.press('ArrowDown');
      await sleep(300);
      expect.soft((await current(page)).key, '↓ with words: stays').toBe(q.key);
      await page.keyboard.press('Control+Digit1');
      await expect.soft.poll(async () => (await current(page)).n, { timeout: 3000, message: '⌃1 with words: item 1' }).toBe(1);
      // back on the short ask, his half answer is its own (2b): clear it so the next step starts clean
      await openOn(page, `short ask ${n}`);
      await expect.soft(page.locator(FIELD).first(), 'back: its half answer').toHaveText(`half ${n}`, { timeout: 3000 });
      await page.locator(FIELD).first().click();
      await page.keyboard.press('Meta+a');
      await page.keyboard.press('Backspace');
    });

    await test.step('ctrl+o opens the folded item, again folds it', async () => {
      await openOn(page, `of the long ask ${n}`);
      const { key } = await current(page);
      const more = page.locator(`[data-testid="inbox.block.card.${key}.more"]`);
      await expect.soft(more, "folded: '… N more lines ctrl o'").toContainText('more lines', { timeout: 5000 });
      // in the card: the thread's own `sb notify "$(printf …)"` line has all 14 lines too
      const last = page.getByTestId(`inbox.block.card.${key}`).getByText(`line 14 of the long ask ${n}`);
      await expect.soft(last, 'its last line folded away').toHaveCount(0);
      await page.keyboard.press('Control+o');
      await expect.soft(last.first(), 'ctrl+o: whole').toBeVisible({ timeout: 3000 });
      await page.screenshot({ path: test.info().outputPath('whole.png') });
      await page.keyboard.press('Control+o');
      await expect.soft(more, 'ctrl+o again: folded').toBeVisible({ timeout: 3000 });
    });
  } finally {
    await s.close();
  }
});
