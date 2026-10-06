// composer/list-indent · bar T K11 + K12 (docs/desktop-bar.md; the terminal's mdlive.rs): ⇧⏎ on a
// list item continues the list; tab on an item indents it one level (the width of the marker
// above) and the caret stays; backspace at the start of an item's text outdents it, and at the
// top level removes the bullet. Real keys on the composer lab.
import { test, expect } from '../../harness';
import { T, fieldText, onTarget, press } from './target';

const lines = async (page: import('@playwright/test').Page): Promise<string[]> =>
  (await page.locator(T.field).evaluate(fieldText)).replace(/\n+$/, '').split('\n');

test('composer/list-indent: ⇧⏎ continues, tab indents, ⌫ at the start outdents then drops the bullet', async () => {
  await onTarget(async ({ page }) => {
    const field = page.locator(T.field);
    await field.click();
    await page.keyboard.type('- a');
    await press(page, 'Shift+Enter');
    expect(await lines(page), '⇧⏎ on an item continues the list').toEqual(['- a', '- ']);
    await page.keyboard.type('b');
    await press(page, 'Tab');
    expect(await lines(page), 'tab indents the item one level').toEqual(['- a', '  - b']);
    await page.keyboard.type('c');
    expect(await lines(page), 'the caret stayed after b').toEqual(['- a', '  - bc']);
    await press(page, 'Backspace');
    await press(page, 'ArrowLeft'); // the start of the item's text
    await press(page, 'Backspace');
    expect(await lines(page), 'backspace at the start of its text outdents it').toEqual(['- a', '- b']);
    await press(page, 'Backspace');
    expect(await lines(page), 'at the top level, backspace removes the bullet').toEqual(['- a', 'b']);
  });
});
