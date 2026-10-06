// thread/interrupt · bar ⛔6 (docs/desktop-bar.md): esc stops the turn. Owner: qa-flows.
// The NEW app on the REAL core over the throwaway world (../world.ts). His words carry
// "[[bash: sleep 12]]": the scripted model makes bise's main run a 12 s tool, a long turn.
// Real keys only: the send, then, while main works, a draft typed in the composer and esc.
// Passes when:
//   - the stop shows in the thread within 1 s of esc;
//   - bise's main really stops (its hub says it is no longer working: read on the hub's socket,
//     outside the app) within 1 s of esc: the bar's rule;
//   - the composer keeps his draft.
// The terminal on the same hub (measured 2026-10-06, esc in the TUI during the same turns): the
// turn ends 7.3 s after esc during a slow model reply ([[slow: 10]]) and 7.9 s after esc during
// a tool ([[bash: sleep 12]]), then says "turn interrupted by the user". The app's esc does the
// same (transcript: tool_result when sleep 12 returns, then candidate_discarded: interrupt,
// turn_done: interrupted): the interrupt is taken, but the agent runtime ends the turn only when
// the running model call or tool returns. So the 1 s rule is red in the terminal too: the wait is
// in the runtime's interrupt, not in the app.
import { test, expect } from '../../harness';
import { hubOf, hubState, launchReal, realWorld, transcriptHas, type World } from '../world';

const T = {
  field: '[data-testid="composer.field"]',
  setupSkip: '[data-testid="setup.skip"]',
  thread: '[data-testid="thread.list"]',
  screen: '[data-testid="thread.screen"]',
};

const mainStatus = async (w: World): Promise<string> => {
  const agents = (await hubState(hubOf(w, 'bise').sock))['agents'] as { name: string; status: string }[] | undefined;
  return agents?.find((a) => a.name === 'main')?.status ?? '';
};

test('thread/interrupt: esc during a long turn stops it in under 1 s, the composer keeps its text', async () => {
  test.setTimeout(180_000);
  const w = realWorld();
  const n = `i${Date.now() % 1_000_000}`;
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
    // an earlier run's turn may still be ending: start from an idle main
    await expect.poll(() => mainStatus(w), { timeout: 30_000, message: 'bise main is idle before the test' }).not.toBe('working');
    await field.click();
    await page.keyboard.type(`a long one [[bash: sleep 12]] ${n}`);
    await page.keyboard.press('Enter');
    await expect.poll(() => transcriptHas(w, 'bise', 'main', n), { timeout: 10_000, message: "bise's main got his words" }).toBe(true);
    await expect.poll(() => mainStatus(w), { timeout: 10_000, message: 'bise main works on it' }).toBe('working');
    await page.waitForTimeout(1500); // inside the tool now
    await page.keyboard.type('garde ça');
    const before = await page.locator(T.thread).innerText();
    const t0 = Date.now();
    await page.keyboard.press('Escape');
    await expect.soft(page.locator(T.screen), 'the stop shows in the thread within 1 s').toContainText(/stopping|stopped|interrupted/i, { timeout: 1000 });
    expect.soft(before, 'the stop line is new').not.toMatch(new RegExp(`${n}[\\s\\S]*(stopping|interrupted)`, 'i'));
    await page.screenshot({ path: test.info().outputPath('stopping.png') });
    let stoppedMs = Infinity;
    while (Date.now() - t0 < 15_000) {
      if ((await mainStatus(w)) !== 'working') { stoppedMs = Date.now() - t0; break; }
      await page.waitForTimeout(100);
    }
    test.info().annotations.push({ type: 'stopped', description: `bise main stopped ${stoppedMs} ms after esc` });
    await page.screenshot({ path: test.info().outputPath('stopped.png') });
    await expect(field, 'the composer keeps his draft').toHaveText('garde ça');
    expect(stoppedMs, "ms from esc to bise main's turn ended (hub)").toBeLessThan(1000);
  } finally {
    await s.close();
  }
});
