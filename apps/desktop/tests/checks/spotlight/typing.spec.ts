// spotlight/typing · bar ⛔1s (docs/desktop-bar.md) · his bug 7: "the spotlight flickers while
// typing". The fake core opens the spotlight (fn + space); then real keys. Passes when, while a
// query is typed: the field is never replaced, no row that stays listed is replaced (the list
// updates row by row), rows never replay their entrance, nothing in the field's line is replaced,
// focus and caret hold, and the caret blinks.
// Target S: the new app's spotlight lab; SO (today's capsule) replays the red.
// Red on today's capsule: each key goes to the core and back and rewrites the head and the list
// (ui.js put('head') / put('body') with innerHTML): the field is pulled out and put back, every
// row replays its entrance.
import { test, expect, typeAndWatch, caretBlinks } from '../../harness';
import { S, onScene } from './target';

const QUERY = 'perf ça';

test('spotlight/typing: field kept, rows kept, no replayed entrance, caret', async () => {
  await onScene(S.launchFind, async ({ page }) => {
    const field = page.locator(S.field);
    await expect(field).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(S.settleMs); // today's scene types its own 'perf' at 0.7 s
    await field.click();
    await page.keyboard.press('Meta+A');
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(400);
    // read-only counters: a field pulled out of the page, a row replaced while it stays listed,
    // a row's entrance animation started again
    await page.evaluate(({ row, field }) => {
      const w = window as unknown as { __qaSpot: { fieldOut: number; rowsKeptReplaced: number; entrances: number } };
      w.__qaSpot = { fieldOut: 0, rowsKeptReplaced: 0, entrances: 0 };
      const f = document.querySelector(field);
      new MutationObserver((records) => {
        const now = new Set(Array.from(document.querySelectorAll(row)).map((r) => r.textContent));
        for (const m of records) {
          for (const n of Array.from(m.removedNodes)) {
            if (!(n instanceof Element)) continue;
            if (f && (n === f || n.contains(f))) w.__qaSpot.fieldOut++;
            for (const r of [n, ...Array.from(n.querySelectorAll(row))]) if (r.matches(row) && now.has(r.textContent)) w.__qaSpot.rowsKeptReplaced++;
          }
        }
      }).observe(document.body, { childList: true, subtree: true });
      document.addEventListener('animationstart', (e) => { if (e.target instanceof Element && e.target.matches(row)) w.__qaSpot.entrances++; }, true);
    }, { row: S.row, field: S.field });

    const typed = await typeAndWatch(page, S.field, QUERY, [S.head], 60);
    await page.waitForTimeout(300);
    const spot = await page.evaluate(() => (window as unknown as { __qaSpot: { fieldOut: number; rowsKeptReplaced: number; entrances: number } }).__qaSpot);
    const caret = await caretBlinks(page, S.field);

    expect.soft(typed.value, 'the field shows what was typed').toBe(QUERY);
    expect.soft(spot.fieldOut, 'times the field was pulled out of the page').toBe(0);
    expect.soft(spot.rowsKeptReplaced, 'rows replaced while they stay listed').toBe(0);
    expect.soft(spot.entrances, 'row entrances replayed while typing').toBe(0);
    for (const m of typed.mutations) expect.soft(m.removed, `nodes replaced under ${m.selector}`).toBe(0);
    expect.soft(typed.focusLost, 'keys after which focus had left the field').toEqual([]);
    expect.soft(typed.caretJumps, 'keys after which the caret did not move by one').toEqual([]);
    expect.soft(caret.blinks, 'the caret is drawn and blinks').toBe(true);
  });
});
