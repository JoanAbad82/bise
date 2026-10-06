// composer/emoji · bar T E22 + W13 (docs/desktop-bar.md; the terminal's emoji.rs): ':tada:'
// becomes 🎉 as it is typed; ':cl' opens a popup of matching emoji that filters as he types,
// ↓ moves, ⏎ inserts the emoji in place of ':cl'. Real keys on the composer lab.
import { test, expect } from '../../harness';
import { T, fieldText, onTarget, press, sentTexts } from './target';

const EMOJI = /\p{Extended_Pictographic}/u;

test('composer/emoji: :tada: becomes 🎉', async () => {
  await onTarget(async ({ page }) => {
    await page.locator(T.field).click();
    await page.keyboard.type('bravo :tada:', { delay: 30 });
    expect((await page.locator(T.field).evaluate(fieldText)).trim()).toBe('bravo 🎉');
  });
});

test('composer/emoji: ":cl" lists emoji, filters, ↓ ⏎ inserts one', async () => {
  await onTarget(async ({ page }) => {
    await page.locator(T.field).click();
    await page.keyboard.type('ok :cl', { delay: 30 });
    const picker = page.locator(T.picker);
    await expect(picker, '":cl" opens the emoji popup').toBeVisible({ timeout: 1500 });
    const all = await picker.locator(T.pickerRow).allInnerTexts();
    expect(all.length, 'some emoji match "cl"').toBeGreaterThan(1);
    await page.keyboard.type('ap', { delay: 30 });
    const narrowed = await picker.locator(T.pickerRow).allInnerTexts();
    expect(narrowed.length, 'it filters as he types').toBeLessThan(all.length + 1);
    expect(narrowed[0] ?? '', `the best match for "clap" comes first: ${narrowed.slice(0, 3).join(' | ')}`).toMatch(/clap/i);
    await press(page, 'ArrowDown');
    await press(page, 'ArrowUp');
    await press(page, 'Enter');
    const text = (await page.locator(T.field).evaluate(fieldText)).trim();
    expect(text.startsWith('ok '), 'the words before stay').toBe(true);
    expect(EMOJI.test(text.slice(3)) && !text.includes(':'), `an emoji replaced ":clap" (${text})`).toBe(true);
    expect(await sentTexts(page), '⏎ in the popup inserts, it does not send').toEqual([]);
  });
});
