// spotlight/answer · bar ⛔4 (docs/desktop-bar.md, fn + space part) · his bug 6: "bise's answer to
// fn+space lands in a panel too small to read". First cut by qa-type, handed to qa-flows.
// The first cut targeted today's capsule (the old app's long-answer scene) and stayed red by
// design; retired (ambient-lead m_11004): the real-core test below is bug 6's verdict.
import { test, expect, textProblems, FakeHelper } from '../../harness';
import { launchReal, realWorld, transcriptHas } from '../world';

// The row on the REAL core (qa-flows): the new app over the throwaway world (../world.ts),
// fn+space from the scripted helper (the helper is the one input we script: its fn key is
// qa-native's), then real keys in the spotlight. The scripted model answers a [[bash:]] with the
// command's output, so "seq" makes a real 20-line answer from bise's main. Passes when:
//   - the spotlight opens and ⏎ sends his question to bise's main (its transcript in the world);
//   - the answer shows where he asked (the spotlight's answer area) within 15 s;
//   - all 20 lines are readable at ≥ 13 px with nothing clipped, in the spotlight, or, when it
//     shows only the start, in the window that ⏎ opens on the rest (bise's thread).

test('spotlight/answer on the real core: fn+space, ask, the whole answer readable', async () => {
  test.setTimeout(180_000);
  const w = realWorld();
  const helper = new FakeHelper();
  const s = await launchReal(w, { helper });
  try {
    const { page, app } = s;
    await page.waitForTimeout(2000);
    await helper.send({ ev: 'fn', act: 'key', key: 'space' });
    await expect.poll(() => app.windows().some((p) => p.url().includes('surface=capsule')), { message: 'the capsule window exists' }).toBe(true);
    const cap = app.windows().find((p) => p.url().includes('surface=capsule'));
    if (!cap) throw new Error('no capsule window');
    const field = cap.locator('[data-testid="spot.input"]');
    await expect(field, 'fn+space opens the spotlight').toBeVisible({ timeout: 5000 });
    const n = `q${Date.now() % 1_000_000}`; // his words this run, never an earlier run's
    // short lines: the scripted model quotes at most 400 characters of a tool's output
    const ask = `[[bash: seq -f 'l%g/20 ${n}' 1 20]]`;
    const lastLine = `l20/20 ${n}`;
    await field.click();
    await cap.keyboard.type(ask);
    await cap.keyboard.press('Enter');
    await expect.poll(() => transcriptHas(w, 'bise', 'main', `/20 ${n}' 1 20`), { timeout: 10_000, message: "bise's main got the question" }).toBe(true);
    const answer = cap.locator('[data-testid="spot.answer"]');
    try {
      await expect(answer, 'the answer shows in the spotlight, where he asked').toBeVisible({ timeout: 15_000 });
    } finally {
      await cap.screenshot({ path: test.info().outputPath('spotlight.png') });
    }
    // the answer done: its text still for 1.5 s (it streams; ⏎ before the end would pick a row)
    let seen = '', still = 0;
    for (const t0 = Date.now(); still < 1500 && Date.now() - t0 < 20_000; ) {
      const now = await answer.innerText();
      still = now === seen ? still + 250 : 0;
      seen = now;
      await cap.waitForTimeout(250);
    }
    await cap.screenshot({ path: test.info().outputPath('spotlight-done.png') });
    // what the spotlight shows is readable, whole or not
    expect.soft(await textProblems(cap, '[data-testid="spot.answer"]', 12.95), 'the answer in the spotlight: nothing clipped, offscreen or under 13 px').toEqual([]);
    if (!seen.includes(lastLine)) {
      await cap.keyboard.press('Enter'); // the rest in bise: ⏎ on an empty field opens it
      const list = page.locator('[data-testid="thread.list"]');
      await expect(list, "the window shows the rest in bise's thread").toContainText(lastLine, { timeout: 5000 });
      await page.getByText(lastLine).last().scrollIntoViewIfNeeded();
      await page.screenshot({ path: test.info().outputPath('window.png') });
      const problems = (await textProblems(page, '[data-testid="thread.list"]', 13)).filter((p) => /l\d+\/20/.test(p.text));
      expect.soft(problems, 'the answer in the window: nothing clipped or under 13 px').toEqual([]);
    }
  } finally {
    await s.close();
  }
});
