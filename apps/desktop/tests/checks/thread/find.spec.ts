// thread/find · bar 3.4 (docs/desktop-bar.md): find text in the history. Owner: qa-flows.
// The NEW app on the REAL core over the throwaway world (../world.ts).
// Real keys only. First two lines with a word of this run are sent to bise's main, and the
// scripted model echoes each ("ack: … <word> …"), so bise's thread holds the word in exactly
// 4 entries. Then, with a draft in the composer, ⌘F (the thread's own key: the menu's Find item
// is qa-native's native/mac-keys), the word, ⏎ twice, esc. Passes when:
//   - ⌘F opens the find field, focused;
//   - the count says 4 matches (thread.find.count "n/4"), and the current match row is marked;
//   - ⏎ goes to an older match: the count's position and the marked row both change;
//   - esc closes find and the composer keeps the draft.
import { test, expect } from '../../harness';
import { launchReal, realWorld, transcriptHas } from '../world';
import { expectShown } from './shown';

const T = {
  field: '[data-testid="composer.field"]',
  setupSkip: '[data-testid="setup.skip"]',
  thread: '[data-testid="thread.list"]',
  find: '[data-testid="thread.find"]',
  findField: '[data-testid="thread.find.field"]',
  count: '[data-testid="thread.find.count"]',
  hit: '[data-testid="thread.list"] [data-hit]',
};

test('thread/find: ⌘F finds every match of a word, ⏎ goes to the next, the draft is kept', async () => {
  test.setTimeout(180_000);
  const w = realWorld();
  const word = `kumquat${Date.now() % 1_000_000}`;
  const s = await launchReal(w);
  try {
    const { page } = s;
    const field = page.locator(T.field).first();
    await expect(page.locator(`${T.field}, ${T.setupSkip}`).first()).toBeVisible({ timeout: 10_000 }).catch(() => undefined);
    if (await page.locator(T.setupSkip).isVisible()) await page.locator(T.setupSkip).click();
    await expect(field, "bise's thread opens with its composer on the real core").toBeVisible({ timeout: 10_000 });
    for (const line of [`first ${word}`, `second ${word}`]) {
      await field.click();
      await page.keyboard.type(line);
      await page.keyboard.press('Enter');
      await expect.poll(() => transcriptHas(w, 'bise', 'main', line), { timeout: 15_000, message: `bise's main got "${line}"` }).toBe(true);
      await expect(page.locator(T.thread), 'its answer is drawn').toContainText(new RegExp(`ack: .*${line}`), { timeout: 20_000 });
      // in the DOM is not on screen (amb-win 35d08ae5)
      await expectShown(page.locator(T.thread).locator('[data-testid^="thread.entry."]').filter({ hasText: new RegExp(`ack: .*${line}`) }).last(), 'its answer');
    }
    await field.click();
    await page.keyboard.type('brouillon');
    await page.keyboard.press('Meta+f');
    const findField = page.locator(T.findField);
    try {
      await expect(findField, '⌘F opens the find field').toBeVisible({ timeout: 1000 });
    } finally {
      await page.screenshot({ path: test.info().outputPath('find.png') });
    }
    await expect(findField, 'the find field has the focus').toBeFocused();
    await page.keyboard.type(word);
    const count = page.locator(T.count);
    await expect(count, 'the count says 4 matches').toHaveText(/^\d+\/4$/, { timeout: 3000 });
    const hit = page.locator(T.hit);
    await expect(hit, 'the current match row is marked').toHaveCount(1);
    await expectShown(hit, 'the marked row, scrolled to');
    const at1 = await count.innerText();
    const row1 = await hit.getAttribute('data-testid');
    await page.keyboard.press('Enter');
    await expect(count, '⏎ moves to another match').not.toHaveText(at1);
    await expect(hit, 'one marked row').toHaveCount(1);
    expect(await hit.getAttribute('data-testid'), 'the marked row moved').not.toBe(row1);
    await expect(hit, 'the marked row holds the word').toContainText(word);
    await expectShown(hit, 'the next marked row, scrolled to');
    await page.screenshot({ path: test.info().outputPath('next.png') });
    await page.keyboard.press('Escape');
    await expect(page.locator(T.find), 'esc closes find').toBeHidden();
    await expect(field, 'the composer keeps its draft').toHaveText('brouillon');
  } finally {
    await s.close();
  }
});
