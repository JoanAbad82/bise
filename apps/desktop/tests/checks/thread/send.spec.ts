// thread/send · bar ⛔3 (docs/desktop-bar.md) · his bug 5: "a sent message does nothing" (cause
// not found). First cut by qa-type, handed to qa-flows (which adds offline: one line with retry,
// the draft kept, and the effect outside the app: the world's main got the message).
// Real keys: "hi", ⏎. Passes when his message is drawn in the thread within 100 ms of ⏎, the
// field is empty, main's working state shows within 1 s, and an answer arrives.
// NOT red on today's window on its in-page fake core (measured: the message shows, the fake
// answers): his bug 5 is on the path to the real core (the Swift bridge), so its red needs the
// new app on a throwaway hub (amb-tools' world) or qa-native's macOS VM pass on today's app.
import { test, expect, launchOld, type Session } from '../../harness';

const T = {
  launch: (): Promise<Session> => launchOld('window'),
  field: '[data-qa=composer], [data-testid="composer.field"]',
  thread: '.w-thread, [data-testid="thread"]',
  mine: '.b-msg, [data-testid^="thread.msg"]',
  working: '[data-qa=stop], [data-testid="composer.stop"], [data-testid="thread.working"]',
  answerWithin: 10_000,
};
const WORDS = `hi ${Date.now() % 100000}`;

test('thread/send: a sent message shows at once, then main works and answers', async () => {
  const s = await T.launch();
  try {
    const { page } = s;
    const msgs = page.locator(T.thread).locator(T.mine);
    const before = await msgs.count();
    await page.locator(T.field).first().click();
    await page.keyboard.type(WORDS);
    // ⏎, then the time until his words are drawn in the thread (read in the page, at each frame)
    const shownMs = page.evaluate(({ thread, words }) => new Promise<number>((done) => {
      const t0 = performance.now();
      const tick = (): void => {
        const th = document.querySelector(thread);
        if (th?.textContent.includes(words)) done(performance.now() - t0);
        else if (performance.now() - t0 > 3000) done(Infinity);
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }), { thread: T.thread, words: WORDS });
    await page.keyboard.press('Enter');
    expect.soft(await shownMs, 'ms from ⏎ to his message drawn in the thread').toBeLessThan(100);
    await expect.poll(() => page.locator(T.field).first().evaluate((e) => (e instanceof HTMLTextAreaElement ? e.value : e.textContent)), { message: 'the field is empty after the send' }).toBe('');
    await expect.soft(page.locator(T.working).first(), "main's working state shows within 1 s").toBeVisible({ timeout: 1000 });
    await expect.poll(() => msgs.count(), { timeout: T.answerWithin, message: 'an answer arrives after his message' }).toBeGreaterThan(before + 1);
  } finally {
    await s.close();
  }
});
