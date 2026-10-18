// composer/chip-paste · his words (main m_30833): « si je copy du contenu avec des chips dedans, le
// fait de paste devrait remettre les chips et les attachments. copy et paste au même endroit devrait
// être une no-op sur le state ». The lab's composer, real keys; ⌘C ⌘X ⌘V play on amb-mac's private
// clipboard (2aa0294d), never his. Passes when, with a long paste's chip and an image's chip in his
// words:
//   - ⌘A ⌘X empties the field and its attachment list; ⌘V gives back the same words, the same
//     chips with their numbers and the same rows (the no-op law);
//   - ⌘A ⌘C ⌘V (a paste over the same selection) leaves it as it was too;
//   - ⌘A ⌘C then ⌘V at the end puts the chips in again under their own numbers: still 2 rows, and
//     the send carries each attachment once (the second mentions are their labels in his words);
//   - his pasteboard's changeCount didn't move.
// The chip kinds one by one, another thread's field, the plain text other apps read and every
// selection's no-op: src/composer/pm/chipclip.test.ts.
import path from 'node:path';
import type { Locator, Page } from '@playwright/test';
import { test, expect } from '../../harness';
import { pasteImage } from '../../harness/inputs';
import { T, onTarget } from './target';
import { pasteboardCount } from './pasteboard';

const PNG = path.join(__dirname, '../fixtures/checker.png');

/** The field as he sees it: words, a line break as ⏎, each chip as <kind n> (an empty line's
 *  trailing <br>, ProseMirror's own, is no break of his). */
const fieldShape = (f: Locator): Promise<string> =>
  f.evaluate((el) =>
    Array.from(el.querySelector('p')?.childNodes ?? [], (n) =>
      n instanceof HTMLElement && n.dataset.kind !== undefined
        ? `<${n.dataset.kind} ${n.dataset.n ?? ''}>`
        : n instanceof HTMLBRElement
          ? n.classList.contains('ProseMirror-trailingBreak') ? '' : '⏎'
          : (n.textContent ?? ''),
    ).join(''),
  );
/** The attachment list's rows: their number and their words. */
const rowsOf = (page: Page): Promise<string[]> =>
  page.locator('[data-testid^="composer.attach."][role="listitem"]').evaluateAll((els) => els.map((e) => `${(e as HTMLElement).dataset.n ?? ''} ${(e as HTMLElement).innerText.replace(/\s+/gu, ' ').trim()}`));

test('composer/chip-paste: cut then paste, copy then paste over it, give the same chips and rows; a second paste keeps their numbers', async () => {
  const before = pasteboardCount();
  await onTarget(async ({ page }) => {
    expect(T.clipboardFenced, 'this target has a private clipboard (else ⌘C ⌘V would touch his)').toBe(true);
    const field = page.locator(T.field);
    await field.click();
    // 'voir ▤1 et [image 2] ok': the seeded 200 lines make a paste chip, then an image's paste
    await page.keyboard.type('voir ', { delay: 10 });
    await page.keyboard.press('Meta+v');
    await expect(page.locator(T.chipPaste), 'the long paste is a chip').toHaveCount(1, { timeout: 2000 });
    await page.keyboard.type(' et ', { delay: 10 });
    await pasteImage(page, T.field, PNG);
    await expect(page.locator(T.chipImage), 'the image is a chip').toHaveCount(1, { timeout: 3000 });
    await page.keyboard.type(' ok', { delay: 10 });
    const shape = await fieldShape(field);
    expect(shape).toBe('voir <paste 1> et <image 2> ok');
    const rows = await rowsOf(page);
    expect(rows.map((r) => r.split(' ')[0]), 'two rows, numbered as their chips').toEqual(['1', '2']);

    // ⌘A ⌘X ⌘V: the field and its list as before
    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Meta+x');
    await expect.poll(() => fieldShape(field), '⌘X empties the field').toBe('');
    await expect.poll(() => rowsOf(page), 'and its list').toEqual([]);
    await page.keyboard.press('Meta+v');
    await expect.poll(() => fieldShape(field), '⌘V: the same words and chips').toBe(shape);
    expect(await rowsOf(page), 'the same rows').toEqual(rows);

    // ⌘A ⌘C ⌘V: a paste over the same selection changes nothing
    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Meta+c');
    await page.keyboard.press('Meta+v');
    await expect.poll(() => fieldShape(field), 'copy then paste over it: the same field').toBe(shape);
    expect(await rowsOf(page), 'the same rows').toEqual(rows);

    // the copy pasted again at the end: the same chips under their own numbers, still two rows
    await page.keyboard.press('End');
    await page.keyboard.type(' ', { delay: 10 });
    await page.keyboard.press('Meta+v');
    await expect.poll(() => fieldShape(field), 'pasted again: each chip under its own number').toBe(`${shape} ${shape}`);
    expect(await rowsOf(page), 'one row per attachment').toEqual(rows);

    // the send: each attachment once, its second mention its label in his words
    await page.keyboard.press('Enter');
    const sent = page.locator(T.sent).last();
    await expect(sent).toBeVisible({ timeout: 2000 });
    const out = JSON.parse(await sent.innerText()) as { parts?: { kind: string; text?: string }[] };
    const kinds = (out.parts ?? []).map((p) => p.kind);
    expect(kinds.filter((k) => k === 'paste'), 'one paste part').toHaveLength(1);
    expect(kinds.filter((k) => k === 'image'), 'one image part').toHaveLength(1);
    expect(out.parts?.at(-1)?.text, 'the second mentions as labels').toContain('▤ 1 et [Image #2] ok');
  });
  expect(pasteboardCount(), "his clipboard (the general pasteboard) didn't change").toBe(before);
});
