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

// bar T B8 (the terminal's files.rs pick memory): a path he picked ranks first next time WITHIN
// its tier (files.rs ranks exact name, name prefix, then fuzzy; a recent pick goes first inside
// its tier, not above a better tier: ambient-lead m_10097). In '@src/' both files are in one tier:
// pick the second (src/main.rs) with ⏎, and the next '@src/' lists it first.
test('composer/at-files: a picked path ranks first in its tier next time', async () => {
  await onTarget(async ({ page }) => {
    const field = page.locator(T.field);
    const picker = page.locator(T.picker);
    // a row shows the file's name and its folder apart (ds Picker, designer m_24793): its tip has the whole path
    const paths = async (): Promise<string[]> => (await picker.locator(T.pickerRow).evaluateAll((els) => els.map((e) => e.getAttribute('data-tip') ?? ''))).filter((r) => !r.includes(' · ') && (r.includes('/') || /\.[a-z]+$/i.test(r)));
    await field.click();
    await page.keyboard.type('@src/');
    await expect(picker).toBeVisible({ timeout: 1500 });
    const before = await paths();
    expect(before.length, `two files in src/: ${before.join(' | ')}`).toBeGreaterThan(1);
    const second = before[1] ?? '';
    await press(page, 'ArrowDown');
    await press(page, 'Enter');
    expect((await field.evaluate(fieldText)).trim(), 'the pick went in').toBe(second);
    await press(page, 'Meta+a');
    await press(page, 'Backspace');
    await page.keyboard.type('@src/');
    await expect(picker).toBeVisible({ timeout: 1500 });
    const after = await paths();
    expect(after[0], `the picked path ("${second}") is first now: ${after.join(' | ')}`).toBe(second);
  });
});
