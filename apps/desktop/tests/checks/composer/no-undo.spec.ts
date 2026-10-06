// composer/no-undo · bar T K23 (docs/desktop-bar.md; the terminal's editor_undo_tests.rs
// the_app_keys_undo_redo_then_say_no_undo): ⌘Z with nothing left to undo after a send says
// "no undo…" (what was sent can't come back: an agent may already have acted), once, and nothing
// else changes. Real keys on the composer lab.
import { test, expect } from '../../harness';
import { T, fieldText, onTarget, sentTexts, press } from './target';

test('composer/no-undo: ⌘Z in the empty field after a send says "no undo" once, nothing else moves', async () => {
  await onTarget(async ({ page }) => {
    const field = page.locator(T.field);
    await field.click();
    await page.keyboard.type('parti');
    await press(page, 'Enter');
    await expect.poll(() => sentTexts(page)).toEqual(['parti']);
    await press(page, 'Meta+z');
    const note = page.locator(T.note);
    await expect.soft(note, 'the "no undo" line shows, once').toHaveCount(1, { timeout: 1500 });
    await expect.soft(note).toContainText('no undo');
    expect.soft((await field.evaluate(fieldText)).trim(), 'the field stays empty: the sent message does not come back').toBe('');
    expect.soft(await sentTexts(page), 'nothing else left').toEqual(['parti']);
  });
});
