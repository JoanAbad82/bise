// thread/send · bar ⛔3 (docs/desktop-bar.md) · his bug 5: "a sent message does nothing".
// Owner: qa-flows (first cut by qa-type on the old window, where it wasn't red: its in-page fake
// core answers; his bug is on the path to the real core). This check runs the NEW app on the REAL
// core (`bise ambient-core --home`, started by the app's main as for him) over a throwaway world
// (./world.ts: ambient-qa's hubs on the scripted provider, HOME under ~/.bise/gate).
// Real keys only: click the composer, type, ⏎. Passes when:
//   - bise's thread opens with its composer (the window shows bise's main on the real core; the
//     world's home is fresh, so a first launch may open setup: its "skip for now" is clicked);
//   - his words are drawn in the thread within 100 ms of ⏎, and the field is empty;
//   - main's working state shows within 1 s;
//   - the home hub's main really got the words (its transcript.log in the world: outside the app);
//   - the scripted model's answer ("ack: … <his words> …") is drawn in the thread.
// Offline (the core gone): one line with retry, the draft kept: thread/send-offline (next).
import { test, expect } from '../../harness';
import { launchReal, realWorld, transcriptHas } from '../world';

const T = {
  field: '[data-testid="composer.field"]',
  thread: '[data-testid="thread.list"]',
  working: '[data-testid="thread.typing"], [data-testid="composer.stop"]',
  setupSkip: '[data-testid="setup.skip"]',
};

test('thread/send: on the real core, a sent message shows at once, reaches main, and main answers', async () => {
  test.setTimeout(180_000);
  const w = realWorld();
  const words = `hi from qa-flows ${Date.now() % 1_000_000}`;
  const s = await launchReal(w);
  try {
    const { page } = s;
    const field = page.locator(T.field).first();
    // a fresh home opens setup once (amb-home c44c926d): skip it the way he would, by a click
    await expect(page.locator(`${T.field}, ${T.setupSkip}`).first()).toBeVisible({ timeout: 10_000 }).catch(() => undefined);
    if (await page.locator(T.setupSkip).isVisible()) await page.locator(T.setupSkip).click();
    try {
      await expect(field, "bise's thread opens with its composer on the real core").toBeVisible({ timeout: 10_000 });
    } finally {
      await page.screenshot({ path: test.info().outputPath('opened.png') });
    }
    await field.click();
    await page.keyboard.type(words);
    const shownMs = page.evaluate(({ thread, words: w2 }) => new Promise<number>((done) => {
      const t0 = performance.now();
      const tick = (): void => {
        if (document.querySelector(thread)?.textContent.includes(w2)) done(performance.now() - t0);
        else if (performance.now() - t0 > 3000) done(Infinity);
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }), { thread: T.thread, words });
    await page.keyboard.press('Enter');
    expect.soft(await shownMs, 'ms from ⏎ to his words drawn in the thread').toBeLessThan(100);
    await expect.poll(() => field.evaluate((e) => e.textContent), { message: 'the field is empty after the send' }).toBe('');
    await expect.soft(page.locator(T.working).first(), "main's working state shows within 1 s").toBeVisible({ timeout: 1000 });
    await expect.poll(() => transcriptHas(w, 'bise', 'main', words), { timeout: 10_000, message: "the home hub's main got his words" }).toBe(true);
    await expect(page.locator(T.thread), "the model's answer is drawn in the thread").toContainText(new RegExp(`ack: .*${words}`), { timeout: 20_000 });
    await page.screenshot({ path: test.info().outputPath('answered.png') });
  } finally {
    await s.close();
  }
});
