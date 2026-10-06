// agents/new · bar A.1 (docs/desktop-bar.md): /new starts an agent, from the window (and the
// spotlight). Owner: qa-flows. The NEW app on the REAL core over the throwaway world
// (../world.ts), the TUI on the same hub as the reference. Passes when the agents list's
// '+ new agent' starts an agent named by his keys (a name, then its brief), and that agent
// shows in the window's list, in the hub and in the TUI's panel.
// Red while '+ new agent' is greyed 'not yet' (src/agents/AgentsScreen.tsx: it waits on a typed
// /new from amb-core). The spotlight's /new is not covered here.
import path from 'node:path';
import { test, expect } from '../../harness';
import { hubAgents, hubOf, launchOn, realWorld, tui, tuiAgents, tuiReady, type Tui } from '../world';

const T = {
  screen: '[data-testid="agents.screen"]',
  add: '[data-testid="agents.new"]',
  row: (n: string) => `[data-testid="agents.row.${n}"]`,
};

test('agents/new: + new agent starts an agent that shows in the list, the hub and the TUI', async () => {
  test.setTimeout(150_000);
  const w = realWorld();
  const project = path.basename(path.dirname(hubOf(w, 'telemetry').sock));
  const name = `qa${String(Date.now() % 100_000)}`;
  let t: Tui | undefined;
  const s = await launchOn(w, `agents/${project}`, T.screen);
  try {
    const { page } = s;
    t = tui(w, 'telemetry');
    await tuiReady(t);
    await expect(page.locator(T.screen)).toBeVisible({ timeout: 15_000 });
    try {
      await expect(page.locator(T.add), "'+ new agent' can be used").toBeEnabled({ timeout: 3000 });
    } finally {
      await page.screenshot({ path: test.info().outputPath('list.png') });
    }
    await page.locator(T.add).click();
    // his keys: the new agent's name, then its brief (the TUI's `/new <name> <brief>`)
    await page.keyboard.type(name);
    await page.keyboard.press('Tab');
    await page.keyboard.type('count the slow queries');
    await page.keyboard.press('Enter');
    await expect.poll(async () => (await hubAgents(w, 'telemetry')).some((a) => a.name === name), { timeout: 15_000, message: 'the hub has the new agent' }).toBe(true);
    await expect(page.locator(T.row(name)), 'the list shows it').toBeVisible({ timeout: 5000 });
    await expect.poll(() => tuiAgents(t?.screen() ?? '').some((a) => a.name === name), { timeout: 5000, message: "the TUI's panel shows it" }).toBe(true);
    await page.screenshot({ path: test.info().outputPath('started.png') });
  } finally {
    t?.close();
    await s.close();
  }
});
