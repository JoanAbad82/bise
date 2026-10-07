// thread/folds · bar F1 / F2 (fold and unfold: ⌘E opens or closes everything folded, as the
// TUI's ctrl+o; space opens the selected one), da90eaec / ambient-lead m_12176. Owner: qa-flows.
// The NEW app on the REAL core over the throwaway world; bise's main thread gets two long
// messages of his (each folds: 'show all · N lines') and a turn with a tool call (a tools row that
// opens its steps). Passes when:
//   - ⌘E opens every fold (aria-expanded true on each), ⌘E again closes every one;
//   - a fold focused (tab to it, as his keyboard does) opens with space and closes with space again,
//     and only that one (the other stays closed).
import { test, expect } from '../../harness';
import { launchReal, realWorld } from '../world';

const T = {
  field: '[data-testid="composer.field"]',
  setupSkip: '[data-testid="setup.skip"]',
  list: '[data-testid="thread.list"]',
  folds: '[data-testid^="thread.fold."]',
};

test('thread/folds: ⌘E opens and closes every fold, space toggles the focused one alone', async () => {
  test.setTimeout(240_000);
  const w = realWorld();
  const n = `f${Date.now() % 1_000_000}`;
  const s = await launchReal(w);
  try {
    const { page } = s;
    await expect(page.locator(`${T.field}, ${T.setupSkip}`).first()).toBeVisible({ timeout: 10_000 }).catch(() => undefined);
    if (await page.locator(T.setupSkip).isVisible()) await page.locator(T.setupSkip).click();
    const field = page.locator(T.field).first();
    await expect(field, "bise's thread").toBeVisible({ timeout: 10_000 });
    const list = page.locator(T.list);
    for (const tag of ['a', 'b']) {
      const text = Array.from({ length: 40 }, (_, i) => `${tag} line ${String(i + 1)} of 40 ${n}`).join('\n');
      await field.click();
      await page.evaluate((t) => navigator.clipboard.writeText(t), text).catch(() => undefined);
      await page.keyboard.press('Meta+v');
      await page.keyboard.press('Enter');
      await expect(list.getByText(`${tag} line 1 of 40 ${n}`).first(), `his ${tag} message is in`).toBeVisible({ timeout: 20_000 });
    }
    const mine = (tag: string) => list.locator('[data-testid^="thread.entry."]', { hasText: `${tag} line 1 of 40 ${n}`, has: page.locator(T.folds) }).first().locator(T.folds);
    const a = mine('a');
    const b = mine('b');
    await expect(a, 'a folds').toHaveAttribute('aria-expanded', 'false', { timeout: 10_000 });
    await expect(b, 'b folds').toHaveAttribute('aria-expanded', 'false', { timeout: 10_000 });
    const all = async () => list.locator(T.folds).evaluateAll((els) => els.map((e) => e.getAttribute('aria-expanded')));
    test.info().annotations.push({ type: 'folds', description: JSON.stringify(await all()) });

    await test.step('⌘E opens everything, again closes everything', async () => {
      await field.click();
      await page.keyboard.press('Meta+e');
      await expect.soft.poll(async () => (await all()).every((x) => x === 'true'), { timeout: 3000, message: '⌘E: every fold open' }).toBe(true);
      await page.screenshot({ path: test.info().outputPath('all-open.png') });
      await page.keyboard.press('Meta+e');
      await expect.soft.poll(async () => (await all()).every((x) => x === 'false'), { timeout: 3000, message: '⌘E again: every fold closed' }).toBe(true);
    });

    await test.step('space toggles the focused fold, only that one', async () => {
      await a.focus();
      await page.keyboard.press('Space');
      await expect.soft(a, 'space: a opens').toHaveAttribute('aria-expanded', 'true', { timeout: 3000 });
      await expect.soft(b, 'b stays closed').toHaveAttribute('aria-expanded', 'false');
      await expect.soft(list.getByText(`a line 40 of 40 ${n}`).first(), 'its last line shows').toBeVisible({ timeout: 3000 });
      await page.keyboard.press('Space');
      await expect.soft(a, 'space again: a closes').toHaveAttribute('aria-expanded', 'false', { timeout: 3000 });
      await page.screenshot({ path: test.info().outputPath('space.png') });
    });
  } finally {
    await s.close();
  }
});
