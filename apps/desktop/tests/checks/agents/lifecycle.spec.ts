// agents/lifecycle · bar A.4 (docs/desktop-bar.md): /stop, /archive, /restore, /archived.
// Owner: qa-flows. The NEW app on the REAL core over the throwaway world (../world.ts), the TUI on
// the same hub as the reference. The world's shop project has search (blocked, shared folder):
// the TUI starts a slow turn on it, then the window stops it, archives it and restores it.
// Passes when:
//   - stop: the window's stop on a working agent ends its turn (the hub and the TUI's panel leave
//     working within 3 s, well before the turn's [[slow: 20]] runs out);
//   - archive: the agent leaves the hub's live agents and the TUI's panel, the window lists it
//     under 'archived', and the TUI's /archived lists it too;
//   - restore: it is back in the hub, the TUI's panel and the window's live list.
import path from 'node:path';
import { test, expect } from '../../harness';
import { hubAgents, hubOf, launchOn, realWorld, tui, tuiAgents, tuiReady, tuiSay, type Tui } from '../world';

const T = {
  screen: '[data-testid="agents.screen"]',
  row: (n: string) => `[data-testid="agents.row.${n}"]`,
  stop: (n: string) => `[data-testid="agents.stop.${n}"]`,
  archive: (n: string) => `[data-testid="agents.archive.${n}"]`,
  restore: (n: string) => `[data-testid="agents.restore.${n}"]`,
  archived: '[data-testid="agents.archived"]',
};

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
const flat = (s: string): string => s.replace(/[│╭╮╰╯─┃]/g, ' ').replace(/\s+/g, ' ');
const AG = 'search';

test('agents/lifecycle: stop, archive and restore from the window act as in the TUI', async () => {
  test.setTimeout(240_000);
  const w = realWorld();
  const project = path.basename(path.dirname(hubOf(w, 'shop').sock));
  // the hub keeps an archived agent in its state: its row says archived: true (bise_proto rows/agents.rs),
  // its status stays what it was (older hubs said status 'archived')
  const live = async () => (await hubAgents(w, 'shop')).filter((a) => !a.dropped && a.status !== 'archived' && a.archived !== true);
  const status = async () => (await live()).find((a) => a.name === AG)?.status;
  let t: Tui | undefined;
  const s = await launchOn(w, `agents/${project}`, T.screen);
  // a route main sends the window (a deep link): /archived's list, then the live one back
  const go = (route: string) =>
    s.app.evaluate(({ BrowserWindow }, r) => {
      for (const b of BrowserWindow.getAllWindows()) b.webContents.send('bise:route', r);
    }, route);
  try {
    const { page } = s;
    t = tui(w, 'shop');
    await tuiReady(t);
    // a run that failed between archive and restore left it archived: the TUI restores it first
    if (!(await live()).some((a) => a.name === AG)) {
      tuiSay(t, `/restore ${AG}`);
      await expect.poll(async () => (await live()).some((a) => a.name === AG), { timeout: 10_000, message: `the TUI's /restore brings ${AG} back` }).toBe(true);
    }
    await expect(page.locator(T.row(AG))).toBeVisible({ timeout: 15_000 });
    // stop: a slow turn from the TUI, stopped from the window
    const n = tuiAgents(t.screen()).find((a) => a.name === AG)?.n ?? 2;
    t.keys(`M-${String(n)}`);
    await sleep(800);
    tuiSay(t, `[[slow: 20]] lifecycle check ${String(Date.now() % 1_000_000)}`);
    await expect.poll(status, { timeout: 15_000, message: `the hub has ${AG} at work` }).toBe('working');
    t.keys('Escape');
    await expect(page.locator(T.stop(AG)), 'the window offers stop on a working agent').toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: test.info().outputPath('working.png') });
    await page.locator(T.stop(AG)).click();
    const t0 = Date.now();
    await expect.soft.poll(status, { timeout: 3000, intervals: [100], message: 'the hub ends its turn within 3 s of the stop' }).not.toBe('working');
    // red or not, wait for the end of the turn, so archive and restore are still checked
    // (the TUI's own /stop on this world ends a [[slow]] turn only when the slow runs out: the runtime's
    // issue-13 fix, main c4768dee + 0041ef46, is not in ambient-app yet; the 3 s bar above is red with it)
    await expect.poll(status, { timeout: 30_000, intervals: [200], message: 'the hub ends its turn after the stop' }).not.toBe('working');
    test.info().annotations.push({ type: 'stop', description: `hub left working ${String(Date.now() - t0)} ms after the click` });
    // the stop reached the hub: the turn ended before its [[slow: 20]] ran out (the report keeps the
    // last finished turn's words, so it can't tell)
    expect(Date.now() - t0, 'the turn ended by the stop, well before its 20 s slow ran out').toBeLessThan(15_000);
    await expect.poll(() => tuiAgents(t?.screen() ?? '').find((a) => a.name === AG)?.glyph, { timeout: 3000, message: "the TUI's panel has it at rest" }).not.toBe('∿');
    await expect(page.locator(T.row(AG)), 'the window has it at rest').not.toHaveAttribute('data-status', 'working', { timeout: 3000 });
    await page.screenshot({ path: test.info().outputPath('stopped.png') });
    // archive
    await page.locator(T.archive(AG)).click();
    await expect.poll(async () => (await live()).some((a) => a.name === AG), { timeout: 10_000, message: `${AG} leaves the hub's live agents` }).toBe(false);
    await expect.poll(() => tuiAgents(t?.screen() ?? '').some((a) => a.name === AG), { timeout: 5000, message: "it leaves the TUI's panel" }).toBe(false);
    await expect(page.locator(`${T.screen} ${T.row(AG)}`), 'it leaves the live list').toHaveCount(0, { timeout: 5000 });
    // as the TUI: /agents lists only the live ones, /archived the archived ones (his try on a43609b2)
    await expect(page.locator(T.archived), 'no archived row on the live list').toHaveCount(0);
    await go(`agents/${project}/archived`);
    await expect(page.locator(T.restore(AG)), "the window's /archived lists it").toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: test.info().outputPath('archived.png') });
    tuiSay(t, '/archived');
    await expect.poll(() => flat(t?.screen() ?? ''), { timeout: 5000, message: "the TUI's /archived lists it" }).toMatch(new RegExp(`\\b${AG}\\b`));
    // restore
    await page.locator(T.restore(AG)).click();
    await expect.poll(async () => (await live()).some((a) => a.name === AG), { timeout: 10_000, message: `${AG} is back in the hub` }).toBe(true);
    await expect.poll(() => tuiAgents(t?.screen() ?? '').some((a) => a.name === AG), { timeout: 5000, message: "it is back in the TUI's panel" }).toBe(true);
    await expect(page.locator(T.restore(AG)), 'it leaves the archived list').toHaveCount(0, { timeout: 5000 });
    await go(`agents/${project}`);
    await expect(page.locator(T.row(AG)), 'it is back in the live list').toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: test.info().outputPath('restored.png') });
  } finally {
    if (t) {
      test.info().attachments.push({ name: 'tui', contentType: 'text/plain', body: Buffer.from(t.screen()) });
      t.close();
    }
    await s.close();
  }
});
