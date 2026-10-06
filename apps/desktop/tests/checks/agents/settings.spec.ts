// agents/settings · bar A.5 (docs/desktop-bar.md): /rename, /model (and /switch, /isolate,
// /reasoning) of one agent. Owner: qa-flows. The NEW app on the REAL core over the throwaway
// world (../world.ts), the TUI on the same hub as the reference. Passes when an agent's row (or
// its view) offers rename and model, and a rename done there shows in the hub and in the TUI's
// panel under the new name.
// Red while the window has no rename or model for an agent (src/agents/AgentsScreen.tsx: they
// wait on typed commands from amb-core).
import path from 'node:path';
import { test, expect } from '../../harness';
import { hubAgents, hubOf, launchReal, realWorld, tui, tuiAgents, tuiReady, type Tui } from '../world';

const T = {
  screen: '[data-testid="agents.screen"]',
  row: (n: string) => `[data-testid="agents.row.${n}"]`,
};

test("agents/settings: an agent's rename and model from the window, as /rename and /model in the TUI", async () => {
  test.setTimeout(150_000);
  const w = realWorld();
  const project = path.basename(path.dirname(hubOf(w, 'telemetry').sock));
  let t: Tui | undefined;
  const s = await launchReal(w, { route: `agents/${project}` });
  try {
    const { page } = s;
    t = tui(w, 'telemetry');
    await tuiReady(t);
    const row = page.locator(T.row('p99'));
    await expect(row).toBeVisible({ timeout: 15_000 });
    try {
      await expect(row.getByRole('button', { name: /rename/ }), "p99's row offers rename").toBeVisible({ timeout: 3000 });
      await expect(row.getByRole('button', { name: /model/ }), "p99's row offers its model").toBeVisible({ timeout: 1000 });
    } finally {
      await page.screenshot({ path: test.info().outputPath('row.png') });
    }
    await row.getByRole('button', { name: /rename/ }).click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.type('latency');
    await page.keyboard.press('Enter');
    await expect.poll(async () => (await hubAgents(w, 'telemetry')).some((a) => a.name === 'latency'), { timeout: 10_000, message: 'the hub has p99 renamed latency' }).toBe(true);
    await expect.poll(() => tuiAgents(t?.screen() ?? '').some((a) => a.name === 'latency'), { timeout: 5000, message: "the TUI's panel shows the new name" }).toBe(true);
    await expect(page.locator(T.row('latency')), 'the list shows the new name').toBeVisible({ timeout: 5000 });
  } finally {
    t?.close();
    await s.close();
  }
});
