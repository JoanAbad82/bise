// composer/at-files · bar 2.2 (docs/desktop-bar.md) · his bug 1: "@files ... dead".
// Real keys only. The project is a git repo holding README.md (amb-tools' throwaway world; today's
// window: its fake core). Passes when "@" opens a file picker, "@READ" puts README.md first (a
// file name ranks before a path, as in the terminal), and tab inserts "@README.md".
import { test, expect } from '../../harness';
import { T, fieldText, onTarget } from './target';

test('composer/at-files: @ opens the file picker, ranks by name, tab inserts @path', async () => {
  await onTarget(async ({ page }) => {
    await page.locator(T.field).click();
    await page.keyboard.type('lis @');
    const picker = page.locator(T.picker);
    await expect(picker, '"@" opens the file picker').toBeVisible({ timeout: 1500 });
    await page.keyboard.type('READ');
    await expect(picker.locator(T.pickerRow).first()).toContainText('README.md');
    await page.keyboard.press('Tab');
    await expect.poll(() => page.locator(T.field).evaluate(fieldText)).toMatch(/^lis @README\.md\s?$/);
    await expect(picker).toBeHidden();
  });
});
