// composer/no-vision · bar T K4 / B6 (docs/desktop-bar.md; the terminal refuses with the
// no-vision line): with a model that reads no images in view, a message with an image is not
// sent; one line says that model can't read images; the draft and its chip stay.
// Real input on the composer lab: its 'the model reads images' box (lab.vision, asked of amb-web)
// unticked, a PNG dropped with the harness's dropFiles, ⏎.
import path from 'node:path';
import { test, expect, dropFiles } from '../../harness';
import { T, fieldText, onTarget, press, sentTexts } from './target';

const PNG_FILE = path.join(__dirname, '../fixtures/checker.png');

test('composer/no-vision: an image to a text-only model is refused, the draft and chip stay', async () => {
  await onTarget(async ({ page }) => {
    const vision = page.locator(T.vision);
    await expect(vision, "the lab's 'the model reads images' box").toBeVisible({ timeout: 1500 });
    if (await vision.isChecked()) await vision.click();
    await page.locator(T.field).click();
    await page.keyboard.type('décris ça ');
    await dropFiles(page, T.field, [PNG_FILE]);
    await expect(page.locator(T.chipImage)).toBeVisible({ timeout: 2000 });
    await press(page, 'Enter');
    await expect(page.locator(T.note), "one line says the model can't read images").toContainText(/image/i, { timeout: 1500 });
    expect(await sentTexts(page), 'nothing is sent').toEqual([]);
    await expect(page.locator(T.chipImage), 'the chip stays').toHaveCount(1);
    expect((await page.locator(T.field).evaluate(fieldText)).trim()).toContain('décris ça');
  });
});
