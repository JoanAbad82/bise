// composer/subword · bar T E3 + E9 (docs/desktop-bar.md; the terminal's editor.rs subword_left /
// subword_right): ctrl+⌥→/← move by subword (camelCase, snake_case, kebab-case, digits) and
// ctrl+⌥⌫ deletes one. Real keys on the composer lab.
import { test, expect } from '../../harness';
import { T, fieldText, onTarget, caretOf, press } from './target';

const WORD = 'fooBar_baz-qux2';

test('composer/subword: ctrl+⌥→ stops at Bar, _baz, -qux, 2; ctrl+⌥← back; ctrl+⌥⌫ deletes one', async () => {
  await onTarget(async ({ page }) => {
    const field = page.locator(T.field);
    await field.click();
    await page.keyboard.type(WORD);
    await press(page, 'Meta+ArrowLeft');
    const right: number[] = [];
    for (let i = 0; i < 4; i++) { await press(page, 'Control+Alt+ArrowRight'); right.push((await field.evaluate(caretOf)).caret); }
    expect(right, 'ctrl+⌥→ stops before Bar, _baz, -qux and 2 (editor.rs right_pieces)').toEqual([3, 6, 10, 14]);
    await press(page, 'Control+Alt+ArrowLeft');
    expect((await field.evaluate(caretOf)).caret, 'ctrl+⌥← goes back one subword').toBe(11);
    await press(page, 'Meta+a');
    await page.keyboard.type('fooBar');
    await press(page, 'Control+Alt+Backspace');
    expect((await field.evaluate(fieldText)).trim(), 'ctrl+⌥⌫ at the end of fooBar leaves foo').toBe('foo');
  });
});
