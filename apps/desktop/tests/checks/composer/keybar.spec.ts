// composer/keybar · bar T W9 (docs/desktop-bar.md; the terminal's keybar.rs): the key bar shows
// the keys of the current mode (at rest, with text selected, in voice mode) and each key it shows
// works. Real input on the composer lab: rest; text selected in the field; its voice switch
// (lab.voice, asked of amb-web). The tip every 5 minutes is not checked here (5 minutes).
import { test, expect } from '../../harness';
import { T, onTarget, press } from './target';

const keysText = (page: import('@playwright/test').Page): Promise<string> => page.locator(T.keys).innerText();

test('composer/keybar: the keys follow the mode, and the rest keys work', async () => {
  await onTarget(async ({ page }) => {
    const field = page.locator(T.field);
    await field.click();
    const rest = await keysText(page);
    for (const [key, shown] of [['@', '@'], ['$', '$'], ['/', '/']] as const) {
      expect(rest, `at rest the bar shows ${shown}`).toContain(shown);
      await page.keyboard.type(key);
      await expect(page.locator(T.picker), `${key} opens its popup, as the bar says`).toBeVisible({ timeout: 1500 });
      await press(page, 'Escape');
      await press(page, 'Meta+a');
      await press(page, 'Backspace');
    }
    await page.keyboard.type('du texte à choisir');
    await press(page, 'Shift+ArrowLeft');
    await press(page, 'Alt+Shift+ArrowLeft');
    await expect.poll(() => keysText(page), { message: 'with text selected, the bar shows other keys' }).not.toBe(rest);
    await press(page, 'ArrowRight');
    await page.locator(T.voiceMode).click();
    await expect.poll(() => keysText(page), { message: 'in voice mode, the bar shows the voice keys' }).not.toBe(rest);
  });
});
