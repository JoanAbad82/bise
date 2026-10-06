// composer/edit-keys · bar ⛔2, the field's part (docs/desktop-bar.md); the app keys (⌘Q ⌘W ⌘, ⌘H,
// the menu bar) are qa-native's native/mac-keys.
// Real keys in the field, as TextEdit does them: ⌥← / ⌥→ move by word, ⇧⌥← selects a word,
// ⌘X cuts it, ⌘V pastes it back elsewhere, ⌘Z undoes, ⌘⇧Z redoes, ⌘A selects all, ⌘C copies.
// His clipboard is never touched: the target must carry amb-mac's private clipboard (2aa0294d,
// BISE_DESKTOP_TEST), and the general pasteboard's changeCount must not move during the run.
// Red on today's window: it has no fenced clipboard, so the check refuses to press ⌘X/⌘C/⌘V there.
import { test, expect } from '../../harness';
import { T, fieldText, onTarget } from './target';
import { pasteboardCount } from './pasteboard';

const TEXT = 'garde la file ce soir';

/** the selected text in the field and the caret's offset */
const sel = (f: Element): { text: string; caret: number } => {
  if (f instanceof HTMLTextAreaElement) return { text: f.value.slice(f.selectionStart, f.selectionEnd), caret: f.selectionEnd };
  const s = window.getSelection();
  if (!s || !s.rangeCount) return { text: '', caret: -1 };
  const r = s.getRangeAt(0).cloneRange();
  r.selectNodeContents(f);
  r.setEnd(s.getRangeAt(0).endContainer, s.getRangeAt(0).endOffset);
  return { text: s.toString(), caret: r.toString().length };
};

test('composer/edit-keys: ⌥ arrows, ⌘X ⌘V ⌘Z ⌘⇧Z ⌘A ⌘C in the field, his clipboard untouched', async () => {
  const before = pasteboardCount();
  await onTarget(async ({ page }) => {
    expect(T.clipboardFenced, 'this target has a private clipboard (else ⌘C/⌘X/⌘V would write his)').toBe(true);
    const field = page.locator(T.field);
    await field.click();
    await page.keyboard.type(TEXT, { delay: 20 });
    await page.keyboard.press('Alt+ArrowLeft');
    expect((await field.evaluate(sel)).caret, '⌥← goes to the start of the last word').toBe(TEXT.length - 'soir'.length);
    await page.keyboard.press('Alt+ArrowLeft');
    await page.keyboard.press('Alt+ArrowRight');
    expect((await field.evaluate(sel)).caret, '⌥→ goes to the end of the word').toBe(TEXT.indexOf(' soir'));
    await page.keyboard.press('Alt+Shift+ArrowLeft');
    expect((await field.evaluate(sel)).text, '⇧⌥← selects the word').toBe('ce');
    await page.keyboard.press('Meta+x');
    expect(await field.evaluate(fieldText), '⌘X cuts it').toBe('garde la file  soir');
    await page.keyboard.press('Meta+z');
    expect(await field.evaluate(fieldText), '⌘Z puts it back').toBe(TEXT);
    await page.keyboard.press('Meta+Shift+z');
    expect(await field.evaluate(fieldText), '⌘⇧Z cuts it again').toBe('garde la file  soir');
    await page.keyboard.press('Meta+ArrowRight');
    await page.keyboard.type(' ');
    await page.keyboard.press('Meta+v');
    expect(await field.evaluate(fieldText), '⌘V pastes what ⌘X cut').toBe('garde la file  soir ce');
    await page.keyboard.press('Meta+a');
    expect((await field.evaluate(sel)).text, '⌘A selects all of the field, nothing else').toBe('garde la file  soir ce');
    await page.keyboard.press('Meta+c');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Meta+v');
    expect(await field.evaluate(fieldText), '⌘C copied all of it').toBe('garde la file  soir cegarde la file  soir ce');
  });
  expect(pasteboardCount(), "his clipboard (the general pasteboard) didn't change").toBe(before);
});
