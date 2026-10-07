// composer/dictation · bar 2.6 + I (docs/desktop-bar.md) · his bug 3: "no ... voice in the composer".
// Red first on today's window (set 1, d38f2df9: it had no dictation). Now on the composer lab
// (amb-web 0aa6fc01): its fake mic says LAB_SAID a word every 250 ms, never the real mic. The core's
// own voice path on the real thread is composer/dictation-real.spec.ts.
// Real keys and clicks only. ctrl+r held = push-to-talk (off on release); a tap = the mic on until
// ctrl+r, any key or the mic button; ⏎ stops without sending; esc cancels (the dictated words go,
// what he typed stays); a busy mic says so in the composer's note. In every case: the words land
// at the caret after what he typed, they stay editable, nothing is sent until he sends, and while
// they land the field never flashes and nothing outside the composer moves (bug 1's bar).
import { test, expect, Recorder, flashes, changedOutside, watchMutations, readMutations } from '../../harness';
import { T, fieldText, onTarget, press, sentTexts } from './target';

const text = async (page: import('@playwright/test').Page): Promise<string> => (await page.locator(T.field).evaluate(fieldText)).trim();
const micState = (page: import('@playwright/test').Page): Promise<string | null> => page.locator(T.mic).getAttribute('data-state');

test('composer/dictation: ctrl+r held, French words land at the caret, no flash, nothing sent', async () => {
  await onTarget(async ({ page, cdp }) => {
    const field = page.locator(T.field);
    await field.click();
    await page.keyboard.type('note: ');
    const fieldBox = await field.boundingBox();
    const composerBox = await page.locator(T.composer).boundingBox();
    if (!fieldBox || !composerBox) throw new Error('no composer on screen');
    await watchMutations(page, [...T.lists]);
    const rec = new Recorder(cdp, page);
    await rec.start();
    await page.keyboard.down('Control');
    await page.keyboard.down('r');
    await expect.poll(() => micState(page), { message: 'held: the mic is on' }).toBe('recording');
    // the meter follows the voice (amb-web df7472f6: composer.meter data-level, the core's level)
    const levels = new Set<string>();
    for (let i = 0; i < 19; i++) { // six words, one every 250 ms
      levels.add((await page.locator(T.meter).getAttribute('data-level').catch(() => null)) ?? '');
      await page.waitForTimeout(100);
    }
    levels.delete('');
    expect.soft(levels.size, `the meter's level moves while he speaks (${[...levels].join(', ')})`).toBeGreaterThan(1);
    await page.keyboard.up('r');
    await page.keyboard.up('Control');
    await expect.poll(() => text(page), { message: 'the words said follow what he typed' }).toBe(`note: ${T.labSaid}`);
    await page.waitForTimeout(300);
    const frames = await rec.stop();
    expect.soft(await micState(page), 'released: the mic is off').toBe('off');
    expect.soft(flashes(frames, fieldBox), 'frames where the field flashed while the words landed').toEqual([]);
    expect.soft(changedOutside(frames, composerBox).filter((n) => n > 4).length, 'frames that changed outside the composer while the words landed').toBe(0);
    for (const m of await readMutations(page)) expect.soft(m.removed, `nodes replaced under ${m.selector}`).toBe(0);
    await page.keyboard.type(' !');
    expect.soft(await text(page), 'the caret is after the words: they stay editable').toBe(`note: ${T.labSaid} !`);
    expect.soft(await sentTexts(page), 'nothing is sent until he sends').toEqual([]);
  });
});

test('composer/dictation: a tap keeps the mic on; esc cancels the dictated words, what he typed stays', async () => {
  await onTarget(async ({ page }) => {
    await page.locator(T.field).click();
    await page.keyboard.type('garde ça ');
    await press(page, 'Control+r');
    await expect.poll(() => micState(page), { message: 'a tap: the mic stays on' }).toBe('recording');
    await page.waitForTimeout(800);
    expect(await text(page), 'words land while the mic is on').not.toBe('garde ça');
    await press(page, 'Escape');
    await expect.poll(() => micState(page), { message: 'esc: the mic is off' }).toBe('off');
    expect(await text(page), 'esc takes the dictated words back, his own stay').toBe('garde ça');
    expect(await sentTexts(page)).toEqual([]);
  });
});

test('composer/dictation: ⏎ stops the mic without sending; the next ⏎ sends', async () => {
  await onTarget(async ({ page }) => {
    await page.locator(T.field).click();
    await press(page, 'Control+r');
    await expect.poll(() => micState(page)).toBe('recording');
    await page.waitForTimeout(700);
    await press(page, 'Enter');
    await expect.poll(() => micState(page), { message: '⏎ stops the mic' }).toBe('off');
    await expect.poll(() => text(page), { message: "the core's final text replaces the dictated part" }).toBe(T.labSaid);
    expect(await sentTexts(page), '⏎ while dictating sends nothing').toEqual([]);
    await press(page, 'Enter');
    await expect.poll(() => sentTexts(page), { message: 'the next ⏎ sends' }).toEqual([T.labSaid]);
  });
});

test('composer/dictation: the mic button and any key stop a tapped mic', async () => {
  await onTarget(async ({ page }) => {
    await page.locator(T.field).click();
    await press(page, 'Control+r');
    await expect.poll(() => micState(page)).toBe('recording');
    await page.locator(T.mic).click();
    await expect.poll(() => micState(page), { message: 'the mic button stops it' }).toBe('off');
    await page.locator(T.field).click();
    await press(page, 'Meta+a');
    await press(page, 'Backspace');
    await press(page, 'Control+r');
    await expect.poll(() => micState(page)).toBe('recording');
    await page.waitForTimeout(600);
    await page.keyboard.type('x');
    await expect.poll(() => micState(page), { message: 'any key stops it' }).not.toBe('recording');
    expect(await sentTexts(page)).toEqual([]);
  });
});

test('composer/dictation: a busy mic says so in the note, the field is untouched', async () => {
  await onTarget(async ({ page }) => {
    await page.locator(T.micBusy).click();
    await page.locator(T.field).click();
    await page.keyboard.type('à moitié');
    await press(page, 'Control+r');
    await expect(page.locator(T.note), 'the note says the mic is busy').toContainText('busy', { timeout: 1500 });
    await expect.poll(() => micState(page)).toBe('off');
    expect(await text(page)).toBe('à moitié');
    expect(await sentTexts(page)).toEqual([]);
  });
});
