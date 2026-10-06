// composer/quote · bar 2.5 (docs/desktop-bar.md) · his bug 3: "no ... quotes in the composer".
// Real mouse and keys: drag across an answer in the thread, then type a question. Passes when a
// quote chip goes in the field at the caret (before the words typed after it), naming where the
// passage comes from, and the typed words follow it.
import { test, expect } from '../../harness';
import { TW as T, fieldText, onTarget } from './target';

// an answer in the fake world's thread (today's window: telemetry · main's answer on the p99)
const ANSWER = { hasText: 'compaction de 14 h', from: 'telemetry' };

test('composer/quote: select an answer, type: a quote chip at the caret, then the words', async () => {
  // the lab has no thread to quote from: today's window until amb-win's thread mounts the composer
  await onTarget(async ({ page }) => {
    const text = page.locator(T.thread).locator(T.message).filter({ hasText: ANSWER.hasText }).last().locator(T.messageText).first();
    const b = await text.boundingBox();
    expect(b, 'the answer is on screen').not.toBeNull();
    if (!b) return;
    await page.mouse.move(b.x + 2, b.y + 4);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width - 4, b.y + b.height - 4, { steps: 12 });
    await page.mouse.up();
    await page.keyboard.type('pourquoi 03:00 ?');
    const chip = page.locator(T.field).locator(T.chipQuote);
    await expect(chip, 'a quote chip in the field').toBeVisible({ timeout: 1500 });
    await expect(chip).toContainText(ANSWER.from);
    const chipFirst = await page.locator(T.field).evaluate((f, sel) => {
      const c = f.querySelector(sel);
      if (!c) return false;
      const r = document.createRange();
      r.selectNodeContents(f);
      r.setEndBefore(c);
      return r.toString().trim() === '';
    }, T.chipQuote);
    expect(chipFirst, 'the chip sits at the caret, before the words typed after it').toBe(true);
    expect(await page.locator(T.field).evaluate(fieldText)).toContain('pourquoi 03:00 ?');
  }, T.launch);
});
