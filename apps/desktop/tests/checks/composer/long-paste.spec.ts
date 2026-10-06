// composer/long-paste · bar 2.7 (docs/desktop-bar.md): a long paste becomes a chip with its line
// count; the first ⌘Z makes it inline text; a send carries all of it.
// Real keys: ⌘V of 200 lines from the private clipboard, preloaded at launch (amb-mac, asked:
// BISE_DESKTOP_TEST_CLIPBOARD), never his. Passes when a paste chip shows "200", the field shows
// no pasted line as text, ⌘Z turns it into the 200 lines inline, and his pasteboard didn't change.
// Red on today's window: no private clipboard (the check refuses ⌘V there) and no paste chip.
import { test, expect } from '../../harness';
import { T, fieldText, onTarget } from './target';
import { pasteboardCount } from './pasteboard';

test('composer/long-paste: 200 lines -> a chip with 200, ⌘Z makes it inline', async () => {
  const before = pasteboardCount();
  await onTarget(async ({ page }) => {
    expect(T.clipboardFenced, 'this target has a private clipboard preloaded with 200 lines').toBe(true);
    const field = page.locator(T.field);
    await field.click();
    await page.keyboard.press('Meta+v');
    const chip = page.locator(T.chipPaste);
    await expect(chip, 'a paste chip').toBeVisible({ timeout: 1500 });
    await expect(chip).toContainText('200');
    expect(await field.evaluate(fieldText), 'no pasted line shows as text').not.toContain('ligne 17 de 200');
    await page.keyboard.press('Meta+z');
    await expect(chip, '⌘Z turns the chip into text').toHaveCount(0);
    const inline = await field.evaluate(fieldText);
    expect(inline.split('\n').filter((l) => /^ligne \d+ de 200/.test(l)).length, 'all 200 lines inline').toBe(200);
  });
  expect(pasteboardCount(), "his clipboard (the general pasteboard) didn't change").toBe(before);
});
