// composer/code-fence-enter · bar T K3 (docs/desktop-bar.md; the terminal's mdlive.rs): inside an
// open ``` block, ⏎ is a new line that keeps the line's indentation; the message sends only with
// the ⏎ after the closing ```. Real keys on the composer lab; what left is its log (lab.sent).
import { test, expect } from '../../harness';
import { T, fieldText, onTarget, sentTexts, press } from './target';

test('composer/code-fence-enter: ⏎ in an open ``` block is a new line with its indent; ⏎ after ``` sends', async () => {
  await onTarget(async ({ page }) => {
    await page.locator(T.field).click();
    await page.keyboard.type('```rust');
    await press(page, 'Enter');
    await page.keyboard.type('fn main() {');
    await press(page, 'Enter');
    await page.keyboard.type('    let x = 1;');
    await press(page, 'Enter');
    await page.keyboard.type('y();'); // the new line keeps the 4 spaces
    await press(page, 'Enter');
    await page.waitForTimeout(200);
    expect(await sentTexts(page), 'nothing sent while the block is open').toEqual([]);
    const open = (await page.locator(T.field).evaluate(fieldText)).replace(/\n+$/, '');
    expect(open.split('\n'), 'each ⏎ in the block made a line; the indent was kept').toEqual(['```rust', 'fn main() {', '    let x = 1;', '    y();', '    ']);
    for (let i = 0; i < 4; i++) await press(page, 'Backspace');
    await page.keyboard.type('}');
    await press(page, 'Enter');
    await page.keyboard.type('```');
    await press(page, 'Enter');
    await expect.poll(() => sentTexts(page), { message: 'the ⏎ after the closing ``` sends the whole block' })
      .toEqual(['```rust\nfn main() {\n    let x = 1;\n    y();\n}\n```']);
  });
});
