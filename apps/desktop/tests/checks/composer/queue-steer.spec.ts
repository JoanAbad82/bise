// composer/queue-steer · bar 3.1 (docs/desktop-bar.md; the terminal's queue.rs): during a turn,
// tab queues the message and ⏎ steers it in; ↑ in an empty composer pops the queued one back to
// edit; the queued one goes out when the turn ends.
// Real keys and clicks on the composer lab: its 'a turn runs' box (lab.busy) is the turn, its
// visible log (lab.sent.<n>) is what left. Passes when: tab during the turn shows the message as
// queued and sends nothing; ⏎ during the turn sends at once; ↑ brings the queued one back into the
// field; and ending the turn sends the queued one, once.
import { test, expect } from '../../harness';
import { T, fieldText, onTarget } from './target';

const sentTexts = async (page: import('@playwright/test').Page): Promise<string[]> =>
  (await page.locator(T.sent).allInnerTexts()).map((t) => (JSON.parse(t) as { text?: string }).text ?? t);

test('composer/queue-steer: tab queues, ⏎ steers, ↑ edits the queued one, the turn end sends it', async () => {
  await onTarget(async ({ page }) => {
    const field = page.locator(T.field);
    await page.locator(T.busy).click(); // a turn runs
    await field.click();
    await page.keyboard.type('un');
    await page.keyboard.press('Tab');
    await expect(page.locator(T.queued).first(), 'tab during a turn queues it').toContainText('un');
    expect((await field.evaluate(fieldText)).trim(), 'the field is empty after tab').toBe('');
    expect(await sentTexts(page), 'nothing left yet').toEqual([]);

    await page.keyboard.type('deux');
    await page.keyboard.press('Enter');
    await expect.poll(() => sentTexts(page), { message: '⏎ during the turn steers it in at once' }).toEqual(['deux']);

    await page.keyboard.press('ArrowUp');
    expect((await field.evaluate(fieldText)).trim(), '↑ in the empty field brings the queued one back').toBe('un');
    await expect(page.locator(T.queued), 'and it leaves the queue').toHaveCount(0);
    await page.keyboard.type(' bis');
    await page.keyboard.press('Tab');
    await expect(page.locator(T.queued).first()).toContainText('un bis');

    await page.locator(T.busy).click(); // the turn ends
    await expect.poll(() => sentTexts(page), { message: 'the turn end sends the queued one, once' }).toEqual(['deux', 'un bis']);
    await expect(page.locator(T.queued)).toHaveCount(0);
    await page.waitForTimeout(500);
    expect(await sentTexts(page), 'sent once').toEqual(['deux', 'un bis']);
  });
});
