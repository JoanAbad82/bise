// agents/write-to-one · bar 3.3 (docs/desktop-bar.md): write to a given agent from its view.
// Owner: qa-flows. The NEW app on the REAL core over the throwaway world (../world.ts), whose
// telemetry project has the agents p99 (done) and alerts (at work).
// Real clicks and keys only: the sidebar's telemetry row, then its agent alerts, then the
// composer. Passes when:
//   - the window shows alerts' own thread (thread.screen for that project and agent);
//   - his line reaches alerts (its transcript in the world's telemetry hub), not telemetry's main;
//   - the line shows in alerts' feed in the window.
import path from 'node:path';
import { test, expect } from '../../harness';
import { hubOf, launchReal, realWorld, transcriptHas } from '../world';

const T = {
  field: '[data-testid="composer.field"]',
  setupSkip: '[data-testid="setup.skip"]',
  screen: '[data-testid="thread.screen"]',
  thread: '[data-testid="thread.list"]',
};

test('agents/write-to-one: a line sent from an agent\'s view reaches that agent, not main', async () => {
  test.setTimeout(180_000);
  const w = realWorld();
  const project = path.basename(path.dirname(hubOf(w, 'telemetry').sock)); // its id: telemetry-<hash>
  const words = `for alerts only ${Date.now() % 1_000_000}`;
  const s = await launchReal(w);
  try {
    const { page } = s;
    await expect(page.locator(`${T.field}, ${T.setupSkip}`).first()).toBeVisible({ timeout: 10_000 }).catch(() => undefined);
    if (await page.locator(T.setupSkip).isVisible()) await page.locator(T.setupSkip).click();
    const row = page.locator(`[data-testid="app.sidebar.project.${project}"]`);
    await expect(row, 'the sidebar lists telemetry').toBeVisible({ timeout: 10_000 });
    await row.click();
    const agent = page.locator('[data-testid="app.right.agent.alerts"]');
    await expect(agent, "telemetry's agents show under it").toBeVisible({ timeout: 5000 });
    await agent.click();
    const screen = page.locator(T.screen);
    try {
      await expect(screen, "the window shows alerts' thread").toHaveAttribute('data-agent', 'alerts', { timeout: 5000 });
    } finally {
      await page.screenshot({ path: test.info().outputPath('alerts.png') });
    }
    await expect(screen).toHaveAttribute('data-project', project);
    const field = page.locator(T.field).first();
    await field.click();
    await page.keyboard.type(words);
    await page.keyboard.press('Enter');
    await expect.poll(() => transcriptHas(w, 'telemetry', 'alerts', words), { timeout: 15_000, message: 'alerts got his line' }).toBe(true);
    expect(transcriptHas(w, 'telemetry', 'main', words), "telemetry's main did not get it").toBe(false);
    await expect(page.locator(T.thread), "the line shows in alerts' feed").toContainText(words, { timeout: 5000 });
    await page.screenshot({ path: test.info().outputPath('sent.png') });
  } finally {
    await s.close();
  }
});
