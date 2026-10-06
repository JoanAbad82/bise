// composer/typing · bar ⛔1 (docs/desktop-bar.md) · his bug 1: "no caret, everything flickers while
// typing in the composer". Real keys only; the page is read (DOM, frames), never driven.
// Passes when, while a fast French line is typed: no node is replaced in the composer or the lists
// around it, focus never leaves the field and the caret moves one character per key, nothing on
// screen changes outside the field (beyond what moves on its own while idle), the field never
// flashes, the caret is drawn and blinks, and shift+⏎ makes new lines without sending.
// Red on today's window: every key rebuilds the composer's lines ('you → bise', the keys line,
// the send button), 500+ replaced nodes for one line.
import { test, expect, typeAndWatch, caretBlinks, Recorder, flashes } from '../../harness';
import { T, fieldText, onTarget } from './target';
import { movingMask, maskShare, changedOutsideStill } from './still';

const LINE1 = "salut, je regarde ça ce soir : «on garde la file d'attente» ou pas ?";
const LINE2 = 'le reçu est déjà là, à vérifier côté hub.';
const LINE3 = 'merci !';

test('composer/typing: caret, 0 replaced nodes, nothing changes outside the field, shift+⏎', async () => {
  await onTarget(async ({ page, cdp }) => {
    const field = page.locator(T.field);
    await field.click();
    await page.keyboard.type('s'); // the first letter may switch the send button on: allowed
    await page.waitForTimeout(300);
    const box = await field.boundingBox();
    expect(box, 'the field is on the page').not.toBeNull();
    if (!box) return;

    const rec = new Recorder(cdp, page);
    const mask = movingMask(await rec.during(() => page.waitForTimeout(1200), 0));
    test.info().annotations.push({ type: 'idle', description: `${(maskShare(mask) * 100).toFixed(1)}% of the window moves on its own` });

    await rec.start();
    const typed = await typeAndWatch(page, T.field, LINE1.slice(1), [T.composer, ...T.lists], 25);
    await page.waitForTimeout(250);
    const frames = await rec.stop();
    const outside = changedOutsideStill(frames, box, mask).filter((n) => n > 4).length;
    const flashed = flashes(frames, box);
    const caret = await caretBlinks(page, T.field);

    await page.keyboard.press('Shift+Enter');
    await page.keyboard.type(LINE2, { delay: 25 });
    await page.keyboard.press('Shift+Enter');
    await page.keyboard.type(LINE3, { delay: 25 });
    await page.waitForTimeout(200);
    const value = await field.evaluate(fieldText);

    test.info().annotations.push({ type: 'frames', description: `${frames.length} frames while typing` });
    for (const m of typed.mutations) expect.soft(m.removed, `nodes replaced under ${m.selector} while typing`).toBe(0);
    expect.soft(typed.focusLost, 'keys after which focus had left the field').toEqual([]);
    expect.soft(typed.caretJumps, 'keys after which the caret did not move by one character').toEqual([]);
    expect.soft(outside, 'frames that changed outside the field (beyond what moves on its own)').toBe(0);
    expect.soft(flashed, 'frames where the field flashed').toEqual([]);
    expect.soft(caret.blinks, 'the caret is drawn and blinks').toBe(true);
    expect.soft(value.trim(), 'shift+⏎ makes lines, nothing is sent').toBe([LINE1, LINE2, LINE3].join('\n'));
  });
});
