// agents/view · bar A.3 (docs/desktop-bar.md): an agent's view: its feed, its last report and
// open questions (`sb tasks`, `sb inspect`). Owner: qa-flows. The NEW app on the REAL core over
// the throwaway world (../world.ts), the TUI on the same hub as the reference (⌥N looks inside
// an agent). Passes when:
//   - the list shows p99's last report as the hub has it (its words, not cut to nothing);
//   - alerts' row opens alerts' thread, which has its brief as the TUI's view of alerts does;
//   - a line sent there streams: alerts at work in the window, then its answer in the window
//     and in the TUI's view of alerts (the same words), and alerts' transcript has the line.
// Not covered: an agent's own open question (the world seeds none on an agent; main's card is
// inbox/cmd-i's).
import path from 'node:path';
import { test, expect } from '../../harness';
import { hubAgents, hubOf, launchReal, realWorld, transcriptHas, tui, tuiAgents, tuiReady, type Tui } from '../world';

const T = {
  screen: '[data-testid="agents.screen"]',
  report: (n: string) => `[data-testid="agents.report.${n}"]`,
  open: (n: string) => `[data-testid="agents.open.${n}"]`,
  thread: '[data-testid="thread.screen"]',
  list: '[data-testid="thread.list"]',
  field: '[data-testid="composer.field"]',
};

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
const flat = (s: string): string => s.replace(/[│╭╮╰╯─┃]/g, ' ').replace(/\s+/g, ' ');

test("agents/view: an agent's report shows, its view has its feed, and a turn streams as in the TUI", async () => {
  test.setTimeout(180_000);
  const w = realWorld();
  const project = path.basename(path.dirname(hubOf(w, 'telemetry').sock));
  let t: Tui | undefined;
  const s = await launchReal(w, { route: `agents/${project}` });
  try {
    const { page } = s;
    t = tui(w, 'telemetry');
    await tuiReady(t);
    await expect(page.locator(T.screen)).toBeVisible({ timeout: 15_000 });
    const hub = await hubAgents(w, 'telemetry');
    const rep = hub.find((a) => a.name === 'p99')?.report ?? '';
    expect(rep, 'the world seeds a report for p99').not.toBe('');
    await expect(page.locator(T.report('p99')), "p99's last report shows in the list").toContainText(rep.slice(0, 40), { timeout: 5000 });
    // alerts' view: the window and the TUI
    await page.locator(T.open('alerts')).click();
    await expect(page.locator(T.thread), "alerts' row opens its thread").toHaveAttribute('data-agent', 'alerts', { timeout: 5000 });
    const n = tuiAgents(t.screen()).find((a) => a.name === 'alerts')?.n ?? 2;
    t.keys(`M-${String(n)}`);
    await sleep(1500);
    // the TUI's view of alerts starts with its brief, folded ('◇ brief ▸'), then its feed
    expect(flat(t.screen()), "the TUI's view of alerts has its brief (folded)").toContain('◇ brief');
    try {
      await expect(page.locator(T.list), "the window's view of alerts has its brief, as the TUI's").toContainText(/brief|page on-call when p99 stays above 800 ms/, { timeout: 10_000 });
    } finally {
      await page.screenshot({ path: test.info().outputPath('view.png') });
    }
    // a turn streams: sent from the window, answered in both
    const words = `view check ${String(Date.now() % 1_000_000)}`;
    await page.locator(T.field).first().click();
    await page.keyboard.type(`[[slow: 3]] ${words}`);
    await page.keyboard.press('Enter');
    await expect.poll(() => transcriptHas(w, 'telemetry', 'alerts', words), { timeout: 15_000, message: 'alerts got the line' }).toBe(true);
    await expect.poll(async () => (await hubAgents(w, 'telemetry')).find((a) => a.name === 'alerts')?.status, { timeout: 10_000, message: 'alerts works on it' }).toBe('working');
    await page.screenshot({ path: test.info().outputPath('working.png') });
    await expect(page.locator(T.list), "alerts' answer shows in the window").toContainText(`ack:`, { timeout: 30_000 });
    await expect(page.locator(T.list).getByText(words).last(), 'the answer quotes his line').toBeVisible({ timeout: 30_000 });
    await expect.poll(() => (flat(t?.screen() ?? '').match(new RegExp(`ack:[^]*?${words}`)) ?? []).length, { timeout: 15_000, message: "the TUI's view of alerts has the same answer" }).toBeGreaterThan(0);
    await page.screenshot({ path: test.info().outputPath('answered.png') });
  } finally {
    if (t) {
      test.info().attachments.push({ name: 'tui', contentType: 'text/plain', body: Buffer.from(t.screen()) });
      t.keys('Escape');
      t.close();
    }
    await s.close();
  }
});
