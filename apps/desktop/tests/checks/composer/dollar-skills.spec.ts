// composer/dollar-skills · bar 2.3 (docs/desktop-bar.md) · his bug 1: "$skills ... dead".
// Real keys only. bise-pages is a skill every workspace has (prompts/skills-all). Passes when "$"
// opens the skill picker, "$bise-p" lists bise-pages first, and tab inserts "$bise-pages ".
import { test, expect } from '../../harness';
import { T, fieldText, onTarget } from './target';

test('composer/dollar-skills: $ opens the skill picker, tab inserts $name', async () => {
  await onTarget(async ({ page }) => {
    await page.locator(T.field).click();
    await page.keyboard.type('$');
    const picker = page.locator(T.picker);
    await expect(picker, '"$" opens the skill picker').toBeVisible({ timeout: 1500 });
    await page.keyboard.type('bise-p');
    await expect(picker.locator(T.pickerRow).first()).toContainText('bise-pages');
    await page.keyboard.press('Tab');
    await expect.poll(() => page.locator(T.field).evaluate(fieldText)).toBe('$bise-pages ');
  });
});
