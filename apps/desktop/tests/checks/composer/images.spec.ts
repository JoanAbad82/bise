// composer/images · bar 2.4 (docs/desktop-bar.md) · his bug 3: "no images ... in the composer".
// A PNG dropped on the composer through Chromium's real drag path (the harness's dropFiles). ⌘V of
// an image comes with amb-mac's private clipboard (2aa0294d) once it carries files; @ of a .png
// with the world's repo. Passes when the drop makes an image chip whose thumbnail is drawn, no
// file path shows as text, and one Backspace removes the chip.
import path from 'node:path';
import { test, expect, dropFiles } from '../../harness';
import { T, fieldText, onTarget } from './target';

const PNG_FILE = path.join(__dirname, '../fixtures/checker.png');

test('composer/images: a dropped PNG becomes a chip with its thumbnail, one key removes it', async () => {
  await onTarget(async ({ page }) => {
    const field = page.locator(T.field);
    await field.click();
    await page.keyboard.type('regarde ');
    await dropFiles(page, T.field, [PNG_FILE]);
    const chip = page.locator(T.chipImage);
    await expect(chip, 'the dropped PNG shows as an image chip').toBeVisible({ timeout: 2000 });
    const drawn = await chip.locator('img').first().evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0);
    expect(drawn, 'its thumbnail is drawn').toBe(true);
    expect(await field.evaluate(fieldText), 'no file path as text').not.toContain('checker.png');
    await page.keyboard.press('Backspace');
    await expect(chip, 'one Backspace removes the chip').toHaveCount(0);
    expect((await field.evaluate(fieldText)).trim()).toBe('regarde');
  });
});
