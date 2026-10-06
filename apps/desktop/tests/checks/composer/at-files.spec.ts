// composer/at-files · bar 2.2 (docs/desktop-bar.md) · his bug 1: "@files ... dead".
// Real keys only. The project is a git repo holding README.md (amb-tools' throwaway world; today's
// window: its fake core). Passes when "@" opens a file picker, "@READ" puts README.md first (a
// file name ranks before a path, as in the terminal), and tab inserts the bare path "README.md ",
// as the terminal does (files.rs completion_inserts_the_reference: 'see @ap' -> 'see src/app.rs ';
// a leading '@name' would route to an agent, docs/at-mentions.md). Bar 2.2's '@path' wording is
// ambient-pm's to align.
import { test, expect } from '../../harness';
import { T, fieldText, onTarget, press } from './target';

test('composer/at-files: @ opens the file picker, ranks by name, tab inserts the path', async () => {
  await onTarget(async ({ page }) => {
    await page.locator(T.field).click();
    await page.keyboard.type('lis @');
    const picker = page.locator(T.picker);
    await expect(picker, '"@" opens the file picker').toBeVisible({ timeout: 1500 });
    await page.keyboard.type('READ');
    await expect(picker.locator(T.pickerRow).first()).toContainText('README.md');
    await page.keyboard.press('Tab');
    await expect.poll(() => page.locator(T.field).evaluate(fieldText)).toBe('lis README.md ');
    await expect(picker).toBeHidden();
  });
});

// bar T B8 (the terminal's files.rs pick memory): a path he picked ranks first among the paths the
// next time (the live agents stay above the paths)
test('composer/at-files: a picked path ranks first next time', async () => {
  await onTarget(async ({ page }) => {
    const field = page.locator(T.field);
    await field.click();
    await page.keyboard.type('@s');
    const picker = page.locator(T.picker);
    await expect(picker).toBeVisible({ timeout: 1500 });
    const before = (await picker.locator(T.pickerRow).allInnerTexts()).map((r) => r.split('\n')[0]?.trim() ?? '');
    // the last FILE row (a folder's tab goes into it, E21): picked, it must rank first next time
    const at = before.reduce((k, r, i) => (/\.[a-z]+$/i.test(r) ? i : k), -1);
    expect(at, `a file row below the first for "@s": ${before.join(' | ')}`).toBeGreaterThan(0);
    const last = before[at] ?? '';
    for (let i = 0; i < at; i++) await press(page, 'ArrowDown');
    await press(page, 'Tab');
    await press(page, 'Meta+a');
    await press(page, 'Backspace');
    await page.keyboard.type('@s');
    await expect(picker).toBeVisible({ timeout: 1500 });
    // the live agents come first in the @ popup (docs/at-mentions.md), then the paths
    const paths = (await picker.locator(T.pickerRow).allInnerTexts()).map((r) => r.split('\n')[0]?.trim() ?? '').filter((r) => r.includes('/') || /\.[a-z]+$/i.test(r));
    expect(paths[0], `the picked path ("${last}") is the first path now: ${paths.join(' | ')}`).toBe(last);
  });
});
