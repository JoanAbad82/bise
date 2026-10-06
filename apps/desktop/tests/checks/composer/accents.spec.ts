// composer/accents · bar ⛔1 (docs/desktop-bar.md) · his bug 1 (typing in the composer).
// Accented letters typed directly (é, ç, à, «, »: Chromium's insertText, as a French keyboard
// gives them) and dead keys through Chromium's own composition path (CDP Input.imeSetComposition
// then Input.insertText: what macOS's dead key does to a web page: '^' marked, then 'ê').
// Passes when the field holds exactly what was typed, the caret sits after the last letter,
// focus never leaves, and no node of the composer or the lists is replaced during the compositions.
// Red on today's window: the composer's lines are rebuilt on every input (replaced nodes).
import { test, expect, watchMutations, readMutations } from '../../harness';
import { T, fieldText, onTarget } from './target';

/** a dead key, then the letter: [what the dead key marks, the composed letter] */
const DEAD: [string, string][] = [['^', 'ê'], ['´', 'é'], ['¨', 'ï'], ['`', 'à'], ['^', 'ô']];
const DIRECT = 'déjà ça, «oui» : ';
const EXPECTED = `${DIRECT}${DEAD.map(([, c]) => c).join('')}`;

test('composer/accents: é ç « » and dead keys ´ ^ ¨ ` land exactly, caret after, nothing replaced', async () => {
  await onTarget(async ({ page, cdp }) => {
    const field = page.locator(T.field);
    await field.click();
    await watchMutations(page, [T.composer, ...T.lists]);
    await page.keyboard.type(DIRECT, { delay: 30 });
    for (const [mark, letter] of DEAD) {
      await cdp.send('Input.imeSetComposition', { text: mark, selectionStart: 1, selectionEnd: 1 });
      await page.waitForTimeout(40);
      await cdp.send('Input.insertText', { text: letter });
      await page.waitForTimeout(40);
    }
    await page.waitForTimeout(200);
    const mutations = await readMutations(page);
    const where = await field.evaluate((f) => {
      const focused = f === document.activeElement || f.contains(document.activeElement);
      if (f instanceof HTMLTextAreaElement) return { focused, caret: f.selectionEnd, len: f.value.length };
      const s = window.getSelection();
      if (!s || !s.rangeCount) return { focused, caret: -1, len: (f as HTMLElement).innerText.length };
      const r = s.getRangeAt(0).cloneRange();
      r.selectNodeContents(f);
      r.setEnd(s.getRangeAt(0).endContainer, s.getRangeAt(0).endOffset);
      return { focused, caret: r.toString().length, len: (f as HTMLElement).innerText.replace(/\n$/, '').length };
    });
    expect.soft(await field.evaluate(fieldText), 'the field holds exactly what was typed').toBe(EXPECTED);
    expect.soft(where.focused, 'focus stays in the field').toBe(true);
    expect.soft(where.caret, 'the caret sits after the last letter').toBe(where.len);
    for (const m of mutations) expect.soft(m.removed, `nodes replaced under ${m.selector} while typing accents`).toBe(0);
  });
});
