// composer/dollar-skills · bar 2.3 (docs/desktop-bar.md) · his bug 1: "$skills ... dead".
// Real keys only. The skill is one of the world's (T.skill: the lab's fake list; bise-pages in a
// real workspace). Passes when "$" opens the skill picker, part of its name lists it first, and
// tab inserts "$<name> ".
import { test, expect } from '../../harness';
import { T, fieldText, onTarget } from './target';

test('composer/dollar-skills: $ opens the skill picker, tab inserts $name', async () => {
  await onTarget(async ({ page }) => {
    await page.locator(T.field).click();
    await page.keyboard.type('$');
    const picker = page.locator(T.picker);
    await expect(picker, '"$" opens the skill picker').toBeVisible({ timeout: 1500 });
    await page.keyboard.type(T.skill.query);
    await expect(picker.locator(T.pickerRow).first()).toContainText(T.skill.name);
    await page.keyboard.press('Tab');
    await expect.poll(() => page.locator(T.field).evaluate(fieldText)).toBe(`$${T.skill.name} `);
  });
});
