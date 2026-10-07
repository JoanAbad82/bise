// composer/frame-click · his try round 2, point 2 (ambient-lead m_11523): the whole box is the input.
// A click anywhere in the composer's box (its 4 corners, its middle, beside the text) focuses the
// editor with the caret at the end of the draft; the editor itself shows no border or outline of its
// own on hover or focus (the box's ring is the one focus mark). Owner: amb-kit (ComposerFrame).
import { test, expect } from '../../harness';
import { T, caretOf, fieldText, onTarget } from './target';

const BOX = '[data-testid="composer.box"]';

test('composer/frame-click: a click at the box corners or middle focuses the editor, caret at the end; no inner border', async () => {
  await onTarget(async ({ page }) => {
    const field = page.locator(T.field);
    await field.click();
    await page.keyboard.type('draft words');
    const box = await page.locator(BOX).boundingBox();
    expect(box, 'the composer has its box').not.toBeNull();
    if (box === null) return;
    // inside the box's padding: 4 px in from each corner, and the middle of its empty right side
    const spots: [string, number, number][] = [
      ['top left', box.x + 4, box.y + 4],
      ['top right', box.x + box.width - 60, box.y + 4],
      ['bottom left', box.x + 4, box.y + box.height - 4],
      ['bottom right', box.x + box.width - 60, box.y + box.height - 4],
      ['middle', box.x + box.width / 2, box.y + box.height / 2],
    ];
    for (const [where, x, y] of spots) {
      // the focus leaves first (the page body), so each click has to bring it back
      await page.evaluate(() => {
        (document.activeElement as HTMLElement | null)?.blur();
      });
      await page.mouse.click(x, y);
      await page.waitForTimeout(60);
      const got = await field.evaluate((f) => ({ focused: f === document.activeElement || f.contains(document.activeElement) }));
      expect.soft(got.focused, `a click at the box's ${where} focuses the editor`).toBe(true);
      const c = await field.evaluate(caretOf);
      const len = (await field.evaluate(fieldText)).length;
      expect.soft(c.caret, `after the ${where} click the caret is at the draft's end`).toBe(len);
    }
    // the editor's own frame on hover and focus: none (the box has the ring)
    await field.hover();
    const look = await field.evaluate((f) => {
      const s = getComputedStyle(f);
      return { shadow: s.boxShadow, outline: s.outlineStyle === 'none' || s.outlineWidth === '0px' ? 'none' : s.outlineStyle, border: s.borderTopWidth };
    });
    expect.soft(look.shadow, 'no inner border (box-shadow) on the editor on hover/focus').toBe('none');
    expect.soft(look.outline, 'no outline on the editor').toBe('none');
    expect.soft(look.border, 'no border on the editor').toBe('0px');
    expect.soft(await field.evaluate(fieldText), 'the clicks kept the draft').toBe('draft words');
  });
});
