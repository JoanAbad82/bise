// thread/answers · bar ⛔4, the window's part (docs/desktop-bar.md): answers you can read. Owner:
// qa-flows. The fn+space part is spotlight/answer.
// The NEW app on the REAL core over the throwaway world (../world.ts). His words carry
// "[[fixture: qa-long-answer]]": the scripted model replays tests/providers/openai-chat/
// qa-long-answer.sse, a 40-line markdown answer with a heading, a numbered list, a bullet list, a
// code block with indented lines, inline code and a link, ending "end of the plan: line 40 of 40.".
// Real keys only. Passes when, in bise's thread:
//   - the whole answer is drawn: its first and last lines are there, and scrolling the thread
//     brings the last line into the viewport;
//   - markdown is drawn as such: list items, a code block that keeps its indentation (the
//     4-space line), inline code, a link (thread.link) to the runbook URL;
//   - every line of its body is at least 13 px, nothing clipped (textProblems, from layout).
// Not yet here: ⌘C copies (needs the fenced clipboard on this target) and a link opens (the
// harness blocks every navigation; the open goes through main's external opener).
import { test, expect, textProblems } from '../../harness';
import { launchReal, realWorld, transcriptHas } from '../world';

const T = {
  field: '[data-testid="composer.field"]',
  setupSkip: '[data-testid="setup.skip"]',
  thread: '[data-testid="thread.list"]',
  link: '[data-testid="thread.link"]',
};
const LAST = 'end of the plan: line 40 of 40.';

test('thread/answers: a 40-line markdown answer is drawn whole and readable', async () => {
  test.setTimeout(180_000);
  const w = realWorld();
  const n = `a${Date.now() % 1_000_000}`;
  const s = await launchReal(w);
  try {
    const { page } = s;
    const field = page.locator(T.field).first();
    await expect(page.locator(`${T.field}, ${T.setupSkip}`).first()).toBeVisible({ timeout: 10_000 }).catch(() => undefined);
    if (await page.locator(T.setupSkip).isVisible()) await page.locator(T.setupSkip).click();
    try {
      await expect(field, "bise's thread opens with its composer on the real core").toBeVisible({ timeout: 10_000 });
    } finally {
      await page.screenshot({ path: test.info().outputPath('opened.png') });
    }
    await field.click();
    await page.keyboard.type(`the release plan please [[fixture: qa-long-answer]] ${n}`);
    await page.keyboard.press('Enter');
    await expect.poll(() => transcriptHas(w, 'bise', 'main', n), { timeout: 10_000, message: "bise's main got his words" }).toBe(true);
    const list = page.locator(T.thread);
    const last = list.getByText(LAST);
    await expect(last, 'the last line of the answer arrives').toHaveCount(1, { timeout: 20_000 });
    await last.scrollIntoViewIfNeeded();
    await page.screenshot({ path: test.info().outputPath('answer-end.png') });
    const inView = await last.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.height > 0 && r.top >= 0 && r.bottom <= window.innerHeight;
    });
    expect.soft(inView, 'scrolling brings the last line into view').toBe(true);
    // the answer's own entry: the one that holds the last line
    const entry = list.locator('[data-testid^="thread.entry."]', { hasText: LAST }).last();
    await expect.soft(entry.getByText('the release plan (line 1)'), 'its first line is in the same entry').toHaveCount(1);
    expect.soft(await entry.locator('li').count(), 'list items are drawn as a list (8 + 4 + 2)').toBeGreaterThanOrEqual(14);
    const pre = entry.locator('pre');
    await expect.soft(pre, 'the code block is a block').toHaveCount(1);
    expect.soft(await pre.innerText().catch(() => ''), 'the code keeps its indentation').toContain('    ./deploy.sh --wave');
    await expect.soft(entry.locator('code', { hasText: './deploy.sh --rollback' }), 'inline code is drawn as code').toHaveCount(1);
    const link = entry.locator(T.link);
    await expect.soft(link, 'the link is a link').toHaveCount(1);
    expect.soft(await link.getAttribute('href').catch(() => null), "the link's target").toBe('https://example.com/runbook/release');
    const id = await entry.getAttribute('data-testid');
    // the answer's body (its markdown), not the author line and time above it; 12.95: a 13 px
    // font measures 12.99 after the box's scale
    const problems = await textProblems(page, `[data-testid="${id ?? ''}"] .th-md`, 12.95);
    // offscreen is scrolling's business (checked above); clipped and tiny are not. A code block's
    // head (its language label, copy) is chrome at desktop-ds' caption size, not body text
    // (ambient-lead m_10059): the 13 px rule is for the prose, lists, code and links
    const chrome = new Set((await entry.locator('.th-code-head').allInnerTexts()).flatMap((t) => t.split('\n').map((x) => x.trim()).filter(Boolean)));
    const bad = problems.filter((p) => p.kind !== 'offscreen' && !(p.kind === 'tiny' && chrome.has(p.text)));
    if (bad.length) test.info().annotations.push({ type: 'problems', description: JSON.stringify(bad.slice(0, 10)) });
    expect.soft(bad, 'the answer: nothing clipped or under 13 px').toEqual([]);
  } finally {
    await s.close();
  }
});
