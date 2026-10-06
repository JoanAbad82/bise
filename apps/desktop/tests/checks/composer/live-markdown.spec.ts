// composer/live-markdown · bar T B9 + W8 (docs/desktop-bar.md; the terminal's mdlive.rs): lists go
// on after a new line (⇧⏎; the terminal's ⏎ sends, ENTER_CONTINUES_LISTS is false), code lines
// keep their indent, a ``` block is colored as he types, and no node is replaced outside the
// line he types (⛔1). Real keys on the composer lab.
import { test, expect, watchMutations, readMutations } from '../../harness';
import { T, fieldText, onTarget, press } from './target';

test('composer/live-markdown: the list goes on, the indent stays, the code is colored, nothing else rebuilt', async () => {
  await onTarget(async ({ page }) => {
    const field = page.locator(T.field);
    await field.click();
    await page.keyboard.type('- a');
    await press(page, 'Shift+Enter');
    expect((await field.evaluate(fieldText)).replace(/\n+$/, '').split('\n'), 'the next bullet comes by itself').toEqual(['- a', '- ']);
    await press(page, 'Shift+Enter'); // an empty item ends the list
    await page.keyboard.type('```rust');
    await press(page, 'Enter');
    await page.keyboard.type('fn main() {');
    await press(page, 'Enter');
    await page.keyboard.type('    let x = 1;');
    // the lines before the one he types: none of their nodes may be replaced while he types it
    await press(page, 'Enter');
    await watchMutations(page, [`${T.field} > :not(:last-child)`, T.strip]);
    await page.keyboard.type('x + 1', { delay: 30 });
    const muts = await readMutations(page);
    const lines = (await field.evaluate(fieldText)).replace(/\n+$/, '').split('\n');
    expect(lines.at(-1), 'the code line kept its indent').toBe('    x + 1');
    // colored: in the block, a keyword and plain text are drawn in different colors
    const colors = await field.evaluate((f) => {
      const color = (word: string): string | null => {
        const w = document.createTreeWalker(f, NodeFilter.SHOW_TEXT);
        for (let n = w.nextNode(); n; n = w.nextNode()) if ((n.textContent ?? '').includes(word) && n.parentElement) return getComputedStyle(n.parentElement).color;
        return null;
      };
      return { kw: color('fn'), plain: color('main'), prose: color('- a') };
    });
    expect.soft(colors.kw, 'the ``` block is colored: "fn" differs from "main"').not.toBe(colors.plain);
    for (const m of muts) expect.soft(m.removed, `nodes replaced under ${m.selector} while typing the last line`).toBe(0);
  });
});
