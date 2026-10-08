// composer/empty-line · designer's try gate D18 on 723648da (m_12777, ambient-lead m_12780): the empty
// composer read 'write to bise, then ⏎' on the bottom line of a tall box with empty space above.
// Empty, the box is one line high (its 12 px padding around one line of text, the send button's
// 28 px fits in it), and the placeholder sits on the field's first line, centred in the box.
// Owner: amb-web (src/composer).
import { test, expect } from '../../harness';
import { T, onTarget } from './target';

const BOX = '[data-testid="composer.box"]';

test('composer/empty-line: the empty composer is one line high, its placeholder on that line', async () => {
  await onTarget(async ({ page }) => {
    const look = await page.evaluate((sel) => {
      const r = (q: string): { top: number; bottom: number; height: number } | null => {
        const el = document.querySelector(q);
        if (el === null) return null;
        const b = el.getBoundingClientRect();
        return { top: b.top, bottom: b.bottom, height: b.height };
      };
      return { box: r(sel.box), field: r(sel.field), ph: r(`${sel.composer} .b-field-ph`), line: parseFloat(getComputedStyle(document.querySelector(`${sel.composer} .in`) ?? document.body).lineHeight) };
    }, { box: BOX, field: T.field, composer: T.composer });
    expect(look.box, 'the composer has its box').not.toBeNull();
    expect(look.ph, 'the empty composer shows its placeholder').not.toBeNull();
    expect(look.field, 'the composer has its field').not.toBeNull();
    if (look.box === null || look.ph === null || look.field === null) return;
    // one line of text (line-height 1.45 of 15 px ≈ 22 px) plus 12 + 12 px of padding: about 46-48 px
    expect.soft(look.box.height, `the empty box is one line high (got ${look.box.height} px)`).toBeLessThanOrEqual(52);
    expect.soft(look.field.height, `the empty field is one line (got ${look.field.height} px)`).toBeLessThanOrEqual(look.line + 2);
    // the placeholder on the field's first line, and that line in the middle of the box
    expect.soft(Math.abs(look.ph.top - look.field.top), 'the placeholder sits on the field\'s first line').toBeLessThanOrEqual(1);
    const above = look.ph.top - look.box.top;
    const below = look.box.bottom - look.ph.bottom;
    expect.soft(Math.abs(above - below), `the placeholder is centred in the box (${above} px above, ${below} px below)`).toBeLessThanOrEqual(4);
  });
});
