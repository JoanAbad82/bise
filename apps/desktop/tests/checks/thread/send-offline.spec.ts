// thread/send-offline · bar ⛔3, its offline half (docs/desktop-bar.md): "then do it again with
// the core stopped: one line with retry, and the draft is kept; never a send with no trace".
// Owner: qa-flows. The NEW app on the REAL core over the throwaway world (../world.ts).
// "The core stopped": the test kills the app's `bise ambient-core` child (SIGKILL, found by its
// parent pid) and keeps killing each restart for the offline window, from outside the app, as a
// crashing core would look. Real keys and clicks only. Passes when:
//   - while the core is down, his words sent with ⏎ show in the thread at once as one failed line
//     (thread.pending.<cid>) with retry (thread.retry.<cid>): his words are kept there;
//   - once the core is back (the app restarts it), a click on retry sends them: bise's main gets
//     them (its transcript in the world) and the failed line goes.
import { execFileSync } from 'node:child_process';
import { test, expect } from '../../harness';
import { launchReal, realWorld, transcriptHas } from '../world';

const T = {
  field: '[data-testid="composer.field"]',
  setupSkip: '[data-testid="setup.skip"]',
  thread: '[data-testid="thread.list"]',
  pending: '[data-testid^="thread.pending."]',
  retry: '[data-testid^="thread.retry."]',
};

/** The app's core children (pids), by parent pid: `bise ambient-core`. */
const corePids = (appPid: number): number[] => {
  try {
    return execFileSync('pgrep', ['-P', String(appPid), '-f', 'ambient-core'], { encoding: 'utf8' }).split('\n').filter(Boolean).map(Number);
  } catch {
    return []; // pgrep: none
  }
};

test('thread/send-offline: a send with the core down is one failed line with retry; retry sends it once the core is back', async () => {
  test.setTimeout(180_000);
  const w = realWorld();
  const words = `offline words ${Date.now() % 1_000_000}`;
  const s = await launchReal(w);
  let killer: ReturnType<typeof setInterval> | undefined;
  try {
    const { page, app } = s;
    const appPid = app.process().pid ?? -1;
    const field = page.locator(T.field).first();
    await expect(page.locator(`${T.field}, ${T.setupSkip}`).first()).toBeVisible({ timeout: 10_000 }).catch(() => undefined);
    if (await page.locator(T.setupSkip).isVisible()) await page.locator(T.setupSkip).click();
    try {
      await expect(field, "bise's thread opens with its composer on the real core").toBeVisible({ timeout: 10_000 });
    } finally {
      await page.screenshot({ path: test.info().outputPath('opened.png') });
    }
    expect(corePids(appPid).length, 'the app runs its core').toBeGreaterThan(0);
    // the core goes down and stays down: every restart killed within 50 ms
    const kill = (): void => { for (const pid of corePids(appPid)) { try { process.kill(pid, 'SIGKILL'); } catch { /* gone */ } } };
    kill();
    killer = setInterval(kill, 50);
    await page.waitForTimeout(1000);
    await field.click();
    await page.keyboard.type(words);
    await page.keyboard.press('Enter');
    const failed = page.locator(T.pending, { hasText: words });
    try {
      await expect(failed, 'his words show at once as one line').toHaveCount(1, { timeout: 1000 });
      await expect(failed.locator(T.retry), 'the line offers retry').toBeVisible({ timeout: 2000 });
    } finally {
      await page.screenshot({ path: test.info().outputPath('offline.png') });
    }
    expect(transcriptHas(w, 'bise', 'main', words), 'nothing reached main while the core was down').toBe(false);
    // the core comes back: the app restarts it on its own (its backoff)
    clearInterval(killer);
    killer = undefined;
    await expect.poll(() => corePids(appPid).length, { timeout: 40_000, message: 'the app restarts its core' }).toBeGreaterThan(0);
    await page.waitForTimeout(2000);
    await failed.locator(T.retry).click();
    await expect.poll(() => transcriptHas(w, 'bise', 'main', words), { timeout: 15_000, message: 'retry sends his words to main' }).toBe(true);
    await expect(page.locator(T.pending, { hasText: words }), 'the failed line goes once sent').toHaveCount(0, { timeout: 10_000 });
    await page.screenshot({ path: test.info().outputPath('retried.png') });
  } finally {
    if (killer) clearInterval(killer);
    await s.close();
  }
});
