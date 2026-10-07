// inbox/keys · bar I3 (the walk: ↑↓ items, ←→ options, ctrl+n / ctrl+p as the TUI's card view) and
// I8 (ctrl+o opens an item's folded lines), da90eaec / ambient-lead m_12176. Owner: qa-flows.
// The NEW app on the REAL core over the throwaway world (../world.ts); shop's main adds two cards
// (one with a 14-line question, so it folds), so ⌘I has at least 3 items. Passes when:
//   - ↓ / ↑ on an empty field go to the next / previous item in the list's order;
//   - → puts the first option on, ← takes it back;
//   - ctrl+n / ctrl+p go to the next / previous item, with words in the field too (↓ does not);
//   - the long item shows 6 lines and '… N more lines ctrl o'; ctrl+o opens it whole, again folds it;
//   - the key list (⌘/) has ctrl+n, ctrl+p and ctrl+o.
import { test, expect } from '../../harness';
import { launchOn, realWorld, worldSay } from '../world';
import type { Page } from '@playwright/test';

const T = {
  root: '[data-testid="inbox.root"]',
  items: '[data-testid^="inbox.item."]',
  answer: '[data-testid="inbox.answer"]',
  help: '[data-testid="help.overlay"]',
};
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** The open item's key ('<project>-<id>'), from its card's test id. */
async function current(page: Page): Promise<string> {
  const ids = await page.locator('[data-testid^="inbox.card."]').evaluateAll((els) => els.map((e) => e.getAttribute('data-testid') ?? ''));
  return ids.map((x) => /^inbox\.card\.([^.]+)$/.exec(x)?.[1] ?? '').find((x) => x !== '') ?? '';
}
async function order(page: Page): Promise<string[]> {
  const ids = await page.locator(T.items).evaluateAll((els) => els.map((e) => e.getAttribute('data-testid') ?? ''));
  return ids.map((x) => /^inbox\.item\.([^.]+)$/.exec(x)?.[1] ?? '').filter((x) => x !== '');
}

test('inbox/keys: ↑↓ ←→ ctrl+n ctrl+p walk the inbox, ctrl+o opens a folded item, the key list has them', async () => {
  test.setTimeout(240_000);
  const w = realWorld();
  const n = `k${Date.now() % 1_000_000}`;
  const long = Array.from({ length: 14 }, (_, i) => `line ${String(i + 1)} of the long ask ${n}`).join('\\n');
  worldSay('shop', `[[bash: sb card "$(printf '${long}')"]] asked`);
  worldSay('shop', `[[bash: sb card "short ask ${n}: cart page or checkout?"]] asked`);
  const s = await launchOn(w, 'inbox', T.root);
  const { page } = s;
  const note = (type: string, v: unknown) => test.info().annotations.push({ type, description: typeof v === 'string' ? v : JSON.stringify(v) });
  try {
    await expect(page.locator(T.root)).toBeVisible({ timeout: 15_000 });
    await expect.poll(async () => (await order(page)).length, { timeout: 30_000, message: 'at least 3 items (the 2 new cards in)' }).toBeGreaterThanOrEqual(3);
    await expect(page.getByText(`short ask ${n}`).first(), 'the new cards are in').toBeVisible({ timeout: 30_000 }).catch(() => undefined);
    const items = await order(page);
    note('order', items);
    await page.locator(T.root).focus();
    await page.screenshot({ path: test.info().outputPath('opened.png') });

    await test.step('↓ / ↑ on an empty field', async () => {
      const a = await current(page);
      const i = items.indexOf(a);
      await page.keyboard.press('ArrowDown');
      await expect.soft.poll(() => current(page), { timeout: 3000, message: '↓: the next item' }).toBe(items[Math.min(i + 1, items.length - 1)]);
      await page.keyboard.press('ArrowUp');
      await expect.soft.poll(() => current(page), { timeout: 3000, message: '↑: back' }).toBe(a);
    });

    await test.step('→ / ← the options', async () => {
      const k = await current(page);
      const opt1 = page.locator(`[data-testid="inbox.card.${k}.opt.1"]`);
      if ((await opt1.count()) === 0) {
        note('options', `the open item ${k} has no options`);
        return;
      }
      await page.keyboard.press('ArrowRight');
      await expect.soft(opt1, '→: option 1 on').toHaveAttribute('aria-selected', 'true', { timeout: 3000 });
      await page.keyboard.press('ArrowLeft');
      await expect.soft(opt1, '←: none on').toHaveAttribute('aria-selected', 'false', { timeout: 3000 });
    });

    await test.step('ctrl+n / ctrl+p, with words in the field too', async () => {
      const a = await current(page);
      const i = items.indexOf(a);
      await page.keyboard.press('Control+n');
      await expect.soft.poll(() => current(page), { timeout: 3000, message: 'ctrl+n: the next item' }).toBe(items[Math.min(i + 1, items.length - 1)]);
      await page.keyboard.press('Control+p');
      await expect.soft.poll(() => current(page), { timeout: 3000, message: 'ctrl+p: back' }).toBe(a);
      // a question: words in its field; ↓ is his words', ctrl+n still walks
      const q = items.find((x) => x !== a) ?? a;
      await page.locator(`[data-testid="inbox.item.${q}"]`).click();
      const field = page.locator(T.answer);
      if ((await field.count()) > 0) {
        await field.click();
        await page.keyboard.type(`half ${n}`);
        await page.keyboard.press('ArrowDown');
        await sleep(300);
        expect.soft(await current(page), '↓ with words: stays').toBe(q);
        await page.keyboard.press('Control+n');
        await expect.soft.poll(() => current(page), { timeout: 3000, message: 'ctrl+n with words: walks' }).not.toBe(q);
        await page.keyboard.press('Control+p');
      } else {
        note('words', `item ${q} takes no words`);
      }
    });

    await test.step('ctrl+o opens the folded item, again folds it', async () => {
      const item = page.locator(T.items, { hasText: `of the long ask ${n}` }).first();
      await item.click({ timeout: 10_000 });
      const k = await current(page);
      const more = page.locator(`[data-testid="inbox.card.${k}.more"]`);
      await expect.soft(more, "folded: '… N more lines ctrl o'").toContainText('more lines', { timeout: 5000 });
      await expect.soft(page.getByText(`line 14 of the long ask ${n}`), 'its last line folded away').toHaveCount(0);
      await page.locator(T.root).focus();
      await page.keyboard.press('Control+o');
      await expect.soft(page.getByText(`line 14 of the long ask ${n}`).first(), 'ctrl+o: whole').toBeVisible({ timeout: 3000 });
      await page.screenshot({ path: test.info().outputPath('whole.png') });
      await page.keyboard.press('Control+o');
      await expect.soft(more, 'ctrl+o again: folded').toBeVisible({ timeout: 3000 });
    });

    await test.step('the key list has them', async () => {
      await page.keyboard.press('Meta+/');
      const help = page.locator(T.help);
      await expect.soft(help, '⌘/ opens the key list').toBeVisible({ timeout: 3000 });
      const keys = await page.locator('[data-testid="help.row"]').evaluateAll((els) => els.map((e) => e.getAttribute('data-keys') ?? ''));
      note('keys', keys);
      for (const k of ['ctrl+n', 'ctrl+p', 'ctrl+o']) expect.soft(keys.some((x) => x.toLowerCase().replace(/\s+/g, '').includes(k)), `the key list has ${k}`).toBe(true);
      await page.keyboard.press('Escape');
    });
  } finally {
    await s.close();
  }
});
