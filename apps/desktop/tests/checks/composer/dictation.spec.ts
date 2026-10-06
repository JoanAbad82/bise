// composer/dictation · bar 2.6 (docs/desktop-bar.md) · his bug 3: "no ... voice in the composer".
// Real keys and a fake mic (fixtures/said.wav through the harness's micWav; never the real mic).
// The fake transcriber of the throwaway world turns any speech into SAID (amb-tools / amb-core:
// the core's voice path on the fake provider). Passes when, with the voice key held, the words
// go in at the caret after what was typed, stay editable, and nothing is sent by itself.
import path from 'node:path';
import { test, expect, launchOld } from '../../harness';
import { TW as T, fieldText, onTarget } from './target';

const WAV = path.join(__dirname, '../fixtures/said.wav');
const SAID = "on garde la file d'attente";

test('composer/dictation: voice key held + fake mic -> words at the caret, editable, not sent', async () => {
  await onTarget(async ({ page }) => {
    const field = page.locator(T.field);
    await field.click();
    await page.keyboard.type('note: ');
    const before = await page.locator(T.thread).locator(T.message).count();
    const [mod, key] = T.dictateKey;
    await page.keyboard.down(mod);
    await page.keyboard.down(key);
    await page.waitForTimeout(1500); // the wav plays through the fake capture device
    await page.keyboard.up(key);
    await page.keyboard.up(mod);
    await expect.poll(() => field.evaluate(fieldText), { timeout: 5000, message: 'the words said are in the field, after what was typed' }).toBe(`note: ${SAID}`);
    await page.keyboard.type(' !');
    expect(await field.evaluate(fieldText), 'still editable at the caret').toBe(`note: ${SAID} !`);
    await page.waitForTimeout(800);
    expect(await page.locator(T.thread).locator(T.message).count(), 'nothing is sent by itself').toBe(before);
  }, () => launchOld('window', { micWav: WAV }));
});
