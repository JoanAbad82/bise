// agents/list · bar A.2 (docs/desktop-bar.md): the agents list and the panel: name, status, what
// it's doing, age. Owner: qa-flows. The NEW app on the REAL core over the throwaway world
// (../world.ts), with the TUI on the same hub as the reference (its side panel's `agents`).
// The world's telemetry project has main, p99 (done) and alerts (at rest after its turn).
// Passes when:
//   - the window opens the agents list by his own input, as the TUI's /agents does (no route);
//   - opened on the list (the start screen), it shows the same agents in the same order as the
//     TUI's panel and the hub, each with a status the panel's glyph stands for;
//   - live: a slow turn started from the TUI on alerts shows working in the list, then at rest,
//     as the panel does, without reopening anything;
//   - a row opens its agent's thread.
import path from 'node:path';
import { test, expect } from '../../harness';
import { hubAgents, hubOf, launchReal, realWorld, tui, tuiAgents, tuiReady, tuiSay, TUI_STATUS, type Tui } from '../world';

const T = {
  screen: '[data-testid="agents.screen"]',
  row: (n: string) => `[data-testid="agents.row.${n}"]`,
  open: (n: string) => `[data-testid="agents.open.${n}"]`,
  thread: '[data-testid="thread.screen"]',
  field: '[data-testid="composer.field"]',
  setupSkip: '[data-testid="setup.skip"]',
};

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** The app's live rows, in order: [{ name, status }]. */
async function appRows(page: import('@playwright/test').Page): Promise<{ name: string; status: string }[]> {
  return page.locator(`${T.screen} .ag-item`).evaluateAll((els) =>
    els
      .filter((e) => e.querySelector('[data-testid^="agents.restore."]') === null)
      .map((e) => ({ name: (e.getAttribute('data-testid') ?? '').replace('agents.row.', ''), status: e.getAttribute('data-status') ?? '' })),
  );
}

test('agents/list: the window opens the agents list by his own input, as /agents does in the TUI', async () => {
  test.setTimeout(120_000);
  const w = realWorld();
  const project = path.basename(path.dirname(hubOf(w, 'telemetry').sock));
  const s = await launchReal(w);
  try {
    const { page } = s;
    await expect(page.locator(`${T.field}, ${T.setupSkip}`).first()).toBeVisible({ timeout: 10_000 }).catch(() => undefined);
    if (await page.locator(T.setupSkip).isVisible()) await page.locator(T.setupSkip).click();
    await page.locator(`[data-testid="app.sidebar.project.${project}"]`).click();
    await expect(page.locator(T.thread)).toHaveAttribute('data-project', project, { timeout: 10_000 });
    // what he would try: the thread's "N agents" line, then /agents in the composer (the TUI's way)
    const counts = page.getByText(/\d+ agents?( ·|$)/).first();
    if (await counts.isVisible().catch(() => false)) await counts.click();
    if (!(await page.locator(T.screen).isVisible())) {
      await page.locator(T.field).first().click();
      await page.keyboard.type('/agents');
      await page.keyboard.press('Enter');
    }
    try {
      await expect(page.locator(T.screen), 'the agents list opens (the thread\'s agents line, or /agents)').toBeVisible({ timeout: 5000 });
    } finally {
      await page.screenshot({ path: test.info().outputPath('open.png') });
    }
  } finally {
    await s.close();
  }
});

test('agents/list: the same agents and statuses as the TUI panel and the hub, live; a row opens its agent', async () => {
  test.setTimeout(180_000);
  const w = realWorld();
  const project = path.basename(path.dirname(hubOf(w, 'telemetry').sock));
  let t: Tui | undefined;
  const s = await launchReal(w, { route: `agents/${project}` });
  try {
    const { page } = s;
    t = tui(w, 'telemetry');
    await tuiReady(t);
    await expect(page.locator(T.screen), 'the agents list is the start screen').toBeVisible({ timeout: 15_000 });
    await expect(page.locator(T.row('alerts'))).toBeVisible({ timeout: 10_000 });
    // at rest: the same agents, order and statuses in the three places
    const compare = async (when: string) => {
      const app = await appRows(page);
      const panel = tuiAgents(t?.screen() ?? '');
      const hub = (await hubAgents(w, 'telemetry')).filter((a) => !a.dropped);
      test.info().annotations.push({ type: when, description: JSON.stringify({ app, panel, hub: hub.map((a) => [a.name, a.status]) }) });
      expect(app.map((a) => a.name), `${when}: the same agents in the same order as the TUI's panel`).toEqual(panel.map((p) => p.name));
      for (const p of panel) {
        const a = app.find((x) => x.name === p.name);
        expect(TUI_STATUS[p.glyph] ?? [], `${when}: ${p.name} is '${a?.status ?? '?'}' in the app, '${p.glyph}' in the TUI`).toContain(a?.status);
        expect(hub.find((h) => h.name === p.name)?.status, `${when}: ${p.name}'s status is the hub's`).toBe(a?.status);
      }
    };
    await compare('at rest');
    await page.screenshot({ path: test.info().outputPath('rest.png') });
    // live: the TUI starts a slow turn on alerts (⌥2 looks inside it, as its tip says)
    const n = tuiAgents(t.screen()).find((a) => a.name === 'alerts')?.n ?? 2;
    t.keys(`M-${String(n)}`);
    await sleep(800);
    tuiSay(t, `[[slow: 8]] list check ${String(Date.now() % 1_000_000)}`);
    await expect.poll(async () => (await hubAgents(w, 'telemetry')).find((a) => a.name === 'alerts')?.status, { timeout: 15_000, message: 'the hub has alerts at work' }).toBe('working');
    await expect(page.locator(T.row('alerts')), 'the list shows alerts at work, live').toHaveAttribute('data-status', 'working', { timeout: 3000 });
    await page.screenshot({ path: test.info().outputPath('working.png') });
    await expect.poll(() => tuiAgents(t?.screen() ?? '').find((a) => a.name === 'alerts')?.glyph, { timeout: 5000, message: "the TUI's panel has alerts at work" }).toBe('∿');
    await expect.poll(async () => (await hubAgents(w, 'telemetry')).find((a) => a.name === 'alerts')?.status, { timeout: 40_000, message: 'alerts ends its turn' }).not.toBe('working');
    await expect(page.locator(T.row('alerts')), 'the list shows it at rest again').not.toHaveAttribute('data-status', 'working', { timeout: 3000 });
    t.keys('Escape');
    await sleep(1500);
    await compare('after the turn');
    // a row opens its agent
    await page.locator(T.open('p99')).click();
    await expect(page.locator(T.thread), "p99's row opens p99's thread").toHaveAttribute('data-agent', 'p99', { timeout: 5000 });
  } finally {
    if (t) {
      test.info().attachments.push({ name: 'tui', contentType: 'text/plain', body: Buffer.from(t.screen()) });
      t.close();
    }
    await s.close();
  }
});
