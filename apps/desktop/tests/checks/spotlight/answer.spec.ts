// spotlight/answer · bar ⛔4 (docs/desktop-bar.md, fn + space part) · his bug 6: "bise's answer to
// fn+space lands in a panel too small to read". First cut by qa-type, handed to qa-flows.
// Real keys: type a question in the spotlight, ⏎; the fake core answers with 20 lines. Passes when
// all 20 lines are drawn: nothing clipped, offscreen or tiny (the harness's textProblems, from
// layout), and the last line is on screen in a frame (or reachable by scrolling the answer).
import { test, expect, textProblems } from '../../harness';
import { S, onScene } from './target';

test('spotlight/answer: a 20-line answer is readable whole', async () => {
  await onScene(S.launchLong, async ({ page }) => {
    const field = page.locator(S.field);
    await expect(field).toBeVisible({ timeout: 5000 });
    await field.click();
    await page.keyboard.type('le plan de release ?', { delay: 30 });
    await page.keyboard.press('Enter');
    await expect(page.locator(S.answer)).toContainText('line 1 of 20', { timeout: 5000 });
    await page.waitForTimeout(800);
    const problems = await textProblems(page, S.answer, 12);
    if (problems.length) test.info().annotations.push({ type: 'problems', description: JSON.stringify(problems.slice(0, 8)) });
    await page.screenshot({ path: test.info().outputPath('answer.png') });
    expect.soft(problems, 'answer text clipped, offscreen or under 12 px').toEqual([]);
    // the last line: drawn inside the viewport once scrolled into view, if the answer scrolls
    const last = page.getByText(S.answerText);
    await last.scrollIntoViewIfNeeded().catch(() => undefined);
    const shown = await last.evaluate((el) => {
      const r = el.getBoundingClientRect();
      let p: HTMLElement | null = el.parentElement;
      while (p) {
        const cs = getComputedStyle(p), pr = p.getBoundingClientRect();
        if ((cs.overflowY === 'hidden' || cs.overflowY === 'clip') && (r.bottom > pr.bottom + 1 || r.top < pr.top - 1)) return false;
        p = p.parentElement;
      }
      return r.bottom <= window.innerHeight && r.top >= 0 && r.height > 0;
    }).catch(() => false);
    expect.soft(shown, 'the answer\'s last line can be seen').toBe(true);
  });
});
