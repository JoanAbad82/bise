// composer/paste-link · a URL pasted over selected words keeps them as its label (Benjamin's ask,
// Gabriel « Oui ! », page ben-feedback; linkpaste.ts): ⇧⌥← selects 'docs', ⌘V of one URL gives
// '[docs](https://bise.dev/docs)', the caret after the ')'; one ⌘Z gives 'docs' back, selected.
// With nothing selected, the same ⌘V types the URL as before.
// Real keys; ⌘V reads amb-mac's private clipboard seeded with one URL (fixtures/one-url.txt),
// never his: the general pasteboard's changeCount must not move.
import path from 'node:path';
import { test, expect } from '../../harness';
import { T, caretOf, fieldText, onTarget } from './target';
import { pasteboardCount } from './pasteboard';

const URL = 'https://bise.dev/docs';
const launch = () => T.launch({ BISE_DESKTOP_TEST_CLIPBOARD: path.join(__dirname, '../fixtures/one-url.txt') });

test('composer/paste-link: ⌘V of a URL over a selected word makes [word](url); ⌘Z gives the word back', async () => {
  const before = pasteboardCount();
  await onTarget(async ({ page }) => {
    expect(T.clipboardFenced, 'this target has a private clipboard (else ⌘V would read his)').toBe(true);
    const field = page.locator(T.field);
    await field.click();
    await page.keyboard.type('read the docs', { delay: 20 });
    await page.keyboard.press('Alt+Shift+ArrowLeft');
    expect((await field.evaluate(caretOf)).selected, '⇧⌥← selects the word').toBe('docs');
    await page.keyboard.press('Meta+v');
    const linked = `read the [docs](${URL})`;
    await expect.poll(() => field.evaluate(fieldText), 'the word is the link\'s label').toBe(linked);
    expect(await field.evaluate(caretOf), 'the caret after the link').toEqual({ caret: linked.length, selected: '' });
    await page.keyboard.press('Meta+z');
    await expect.poll(() => field.evaluate(fieldText), 'one ⌘Z: the word back').toBe('read the docs');
    expect((await field.evaluate(caretOf)).selected, 'and selected again').toBe('docs');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.type(' ', { delay: 20 });
    await page.keyboard.press('Meta+v');
    // the seed ends with a newline (a copied line): pasted as before, newline and all
    await expect.poll(async () => (await field.evaluate(fieldText)).trimEnd(), 'nothing selected: the URL as before').toBe(`read the docs ${URL}`);
  }, launch);
  expect(pasteboardCount(), "his clipboard (the general pasteboard) didn't change").toBe(before);
});
