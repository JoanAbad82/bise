// thread/rows · bar B11 (long messages fold), F1/F2 (fold and unfold), F7/M8/B13 (copy a code
// block), F5/M2/N11/B12 (back to the bottom). Owner: qa-flows. The NEW app on the REAL core over the
// throwaway world (../world.ts), in bise's own thread. Passes when:
//   - B11: an 80-line message of his folds to its first lines with 'show all · 80 lines'; a click
//     opens it whole ('fold it'), another folds it back;
//   - F1/F2: ⌘E opens everything folded (his long message too), ⌘E again closes it; a fold's own
//     click toggles that one only;
//   - F7: on a hovered code block of an answer (the qa-long-answer fixture), its 'copy' button and
//     ctrl+y each put just the code in the clipboard (the test-mode fence's buffer, read back by a
//     ⌘V into the composer): the block's own text, no border, no line numbers, no 'copy' label;
//   - F5: scrolled up while new rows come (a line to main from outside, its ack), the view stays
//     put and the bar says '↓ back to the bottom · N new'; End and a click on the bar each bring
//     the tail back and the bar goes.
// 'space opens the selected one' (F2's TUI half) has no selected row in the window: not checked.
import { test, expect } from '../../harness';
import { launchReal, realWorld, transcriptHas, worldSay } from '../world';

const T = {
  field: '[data-testid="composer.field"]',
  setupSkip: '[data-testid="setup.skip"]',
  thread: '[data-testid="thread.list"]',
  folds: '[data-testid^="thread.fold."]',
  copy: '[data-testid="thread.code.copy"]',
  toEnd: '[data-testid="thread.to-end"]',
};

/** The list's scrolling box: its scrollTop, scrollHeight, clientHeight. */
async function scroller(page: import('@playwright/test').Page, act: 'read' | 'up' = 'read'): Promise<{ top: number; height: number; client: number }> {
  return page.locator(T.thread).evaluate((root, a) => {
    const all = [root, ...Array.from(root.querySelectorAll('*'))] as HTMLElement[];
    const box = all.find((el) => el.scrollHeight > el.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(el).overflowY)) ?? root;
    if (a === 'up') box.scrollTop = Math.max(0, box.scrollTop - box.clientHeight * 1.5);
    return { top: box.scrollTop, height: box.scrollHeight, client: box.clientHeight };
  }, act);
}

test('thread/rows: long messages fold, ⌘E folds all, a code block copies alone, back to the bottom', async () => {
  test.setTimeout(240_000);
  const w = realWorld();
  const n = `r${Date.now() % 1_000_000}`;
  const s = await launchReal(w);
  try {
    const { page } = s;
    const field = page.locator(T.field).first();
    await expect(page.locator(`${T.field}, ${T.setupSkip}`).first()).toBeVisible({ timeout: 10_000 }).catch(() => undefined);
    if (await page.locator(T.setupSkip).isVisible()) await page.locator(T.setupSkip).click();
    await expect(field, "bise's thread opens with its composer").toBeVisible({ timeout: 10_000 });
    const list = page.locator(T.thread);

    // ---- B11: an 80-line message folds
    await field.click();
    for (let i = 1; i <= 80; i++) {
      await page.keyboard.type(`line ${String(i)} of 80 ${n}`);
      if (i < 80) await page.keyboard.press('Shift+Enter');
    }
    await page.keyboard.press('Enter');
    await expect.poll(() => transcriptHas(w, 'bise', 'main', `line 80 of 80 ${n}`), { timeout: 15_000, message: 'main got the whole 80 lines' }).toBe(true);
    // his row: the one with a fold (bise's ack repeats his first lines)
    const mine = list.locator('[data-testid^="thread.entry."]', { hasText: `line 1 of 80 ${n}`, has: page.locator(T.folds) }).first();
    await expect(mine, 'his long message is drawn').toBeVisible({ timeout: 10_000 });
    const fold = mine.locator(T.folds);
    await expect(fold, 'it folds: show all · 80 lines').toContainText('show all · 80 lines', { timeout: 5000 });
    await expect(mine.getByText(`line 80 of 80 ${n}`), 'its last line is folded away').toHaveCount(0);
    await page.screenshot({ path: test.info().outputPath('b11-folded.png') });
    await fold.click();
    await expect(mine.getByText(`line 80 of 80 ${n}`), 'a click opens it whole').toHaveCount(1, { timeout: 3000 });
    await expect(fold).toContainText('fold it');
    // his line breaks kept, as he typed them and as the TUI shows them (one line each)
    const shown = await mine.evaluate((el) => (el as HTMLElement).innerText);
    const ownLines = shown.split('\n').filter((l) => new RegExp(`^line \\d+ of 80 ${n}$`).test(l.trim())).length;
    await page.screenshot({ path: test.info().outputPath('b11-open.png') });
    expect.soft(ownLines, 'opened: his 80 lines each on a line of their own (not one run-on paragraph)').toBe(80);
    await fold.click();
    await expect(mine.getByText(`line 80 of 80 ${n}`), 'another click folds it back').toHaveCount(0, { timeout: 3000 });

    // ---- F1/F2: ⌘E opens and closes everything folded
    await list.click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('Meta+E');
    await expect(fold, '⌘E opens everything folded').toHaveAttribute('aria-expanded', 'true', { timeout: 3000 });
    await expect(mine.getByText(`line 80 of 80 ${n}`)).toHaveCount(1);
    await page.screenshot({ path: test.info().outputPath('f1-all-open.png') });
    await page.keyboard.press('Meta+E');
    await expect(fold, '⌘E again closes them').toHaveAttribute('aria-expanded', 'false', { timeout: 3000 });

    // ---- F7: a code block copies alone (button, then ctrl+y)
    await field.click();
    await page.keyboard.type(`the release plan please [[fixture: qa-long-answer]] ${n}`);
    await page.keyboard.press('Enter');
    const LAST = 'end of the plan: line 40 of 40.';
    await expect(list.getByText(LAST).last(), 'the answer with a code block arrives').toBeVisible({ timeout: 20_000 });
    const answer = list.locator('[data-testid^="thread.entry."]', { hasText: LAST }).last();
    const pre = answer.locator('pre').first();
    await pre.scrollIntoViewIfNeeded();
    const code = (await pre.locator('code').first().textContent()) ?? '';
    expect(code, 'the answer has a code block').toContain('deploy');
    const pasted = async (): Promise<string> => {
      await field.click();
      await page.keyboard.press('Meta+A');
      await page.keyboard.press('Backspace');
      await page.keyboard.press('Meta+V');
      await page.waitForTimeout(300);
      const t = await field.evaluate((el) => (el as HTMLElement).innerText);
      await page.keyboard.press('Meta+A');
      await page.keyboard.press('Backspace');
      return t;
    };
    const norm = (t: string): string => t.replace(/\u00a0/g, ' ').replace(/\n+$/, '').trim();
    await pre.hover();
    const btn = pre.locator('xpath=..').locator(T.copy).first();
    await expect(btn, "the block's copy button on hover").toBeVisible({ timeout: 3000 });
    await page.screenshot({ path: test.info().outputPath('f7-hover.png') });
    await btn.click();
    const viaClick = await pasted();
    test.info().annotations.push({ type: 'copied', description: JSON.stringify({ code, viaClick }) });
    expect(norm(viaClick), "the copy button: the clipboard holds just the block's code").toBe(norm(code));
    expect(viaClick, 'no border, no line numbers, no label').not.toMatch(/[│┃]|^\s*\d+\s{2}|\bcopy\b$/m);
    await pre.hover();
    await page.keyboard.press('Control+Y');
    const viaKey = await pasted();
    expect(norm(viaKey), 'ctrl+y on the hovered block: the same code').toBe(norm(code));

    // ---- F5: scrolled up, the view stays; the bar counts; End and a click go back
    await list.click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('End');
    await page.waitForTimeout(500);
    const up = await scroller(page, 'up');
    expect(up.height, 'the thread is taller than its view').toBeGreaterThan(up.client);
    await page.waitForTimeout(400);
    const before = (await scroller(page)).top;
    worldSay('bise', `one more line from outside ${n}`);
    await expect.poll(() => transcriptHas(w, 'bise', 'main', `one more line from outside ${n}`), { timeout: 10_000, message: "main got the outside line" }).toBe(true);
    const bar = page.locator(T.toEnd);
    await expect(bar, "the bar shows '· N new'").toContainText(/back to the bottom · \d+ new/, { timeout: 15_000 });
    const after = (await scroller(page)).top;
    test.info().annotations.push({ type: 'scroll', description: JSON.stringify({ before, after }) });
    expect(Math.abs(after - before), "the view doesn't move while scrolled up").toBeLessThanOrEqual(2);
    await page.screenshot({ path: test.info().outputPath('f5-bar.png') });
    await list.click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('End');
    await expect(bar, 'End goes to the tail: the bar goes').toHaveCount(0, { timeout: 5000 });
    let r = await scroller(page);
    expect(r.top + r.client, 'End: at the bottom').toBeGreaterThanOrEqual(r.height - 4);
    await scroller(page, 'up');
    await expect(bar, 'scrolled up again: the bar').toBeVisible({ timeout: 5000 });
    await bar.click();
    await expect(bar, 'a click goes to the tail: the bar goes').toHaveCount(0, { timeout: 5000 });
    r = await scroller(page);
    expect(r.top + r.client, 'the click: at the bottom').toBeGreaterThanOrEqual(r.height - 4);
  } finally {
    await s.page.screenshot({ path: test.info().outputPath('end.png') }).catch(() => undefined);
    await s.close();
  }
});
