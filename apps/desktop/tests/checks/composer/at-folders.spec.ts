// composer/at-folders · bar T E21 (docs/desktop-bar.md; the terminal's files.rs): in the @ popup,
// → on a folder goes into it (the field reads '@src/' and the popup lists its files); ← (or ⌫ on
// '@dir/') goes one folder up. Real keys on the composer lab (its fake repo: README.md, src/,
// src/app.ts, src/main.rs, docs/my notes/, shots/screen.png).
import { test, expect } from '../../harness';
import { T, fieldText, onTarget, press } from './target';

const rows = (page: import('@playwright/test').Page): Promise<string[]> => page.locator(T.picker).locator(T.pickerRow).allInnerTexts();

test('composer/at-folders: → goes into src/, ← and ⌫ go back up', async () => {
  await onTarget(async ({ page }) => {
    await page.locator(T.field).click();
    await page.keyboard.type('@src');
    await expect(page.locator(T.picker)).toBeVisible({ timeout: 1500 });
    await expect(page.locator(T.picker).locator(T.pickerRow).first()).toContainText('src');
    await press(page, 'ArrowRight');
    await expect.poll(() => page.locator(T.field).evaluate(fieldText).then((t) => t.trim()), { message: '→ goes into the folder' }).toBe('@src/');
    await expect.poll(() => rows(page), { message: "the popup lists src/'s files" }).toEqual(expect.arrayContaining([expect.stringContaining('app.ts'), expect.stringContaining('main.rs')]));
    expect((await rows(page)).some((r) => r.includes('README.md')), 'and only them').toBe(false);
    await press(page, 'ArrowLeft');
    await expect.poll(() => rows(page), { message: '← goes one folder up' }).toEqual(expect.arrayContaining([expect.stringContaining('README.md')]));
    await press(page, 'ArrowRight');
    await expect.poll(() => page.locator(T.field).evaluate(fieldText).then((t) => t.trim())).toBe('@src/');
    await press(page, 'Backspace');
    await expect.poll(() => rows(page), { message: "⌫ on '@src/' goes one folder up" }).toEqual(expect.arrayContaining([expect.stringContaining('README.md')]));
  });
});
