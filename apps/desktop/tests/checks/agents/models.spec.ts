// agents/models · bar A.5, an agent's model from the hub's catalog (amb-win 94e63365 on amb-feed's
// models event 7dfd1c74, the TUI's /model list). Owner: qa-flows. The NEW app on the REAL core over
// the throwaway world (../world.ts), the TUI on the same hub as the reference; telemetry's alerts
// (agents/settings renames p99 in the same world). Passes when:
//   - the window's picker has the TUI /model picker's rows: the same ids (the TUI drops the
//     provider, its group head says it), the same short words, the same current one marked;
//   - a pick in the window reaches the hub (sb list's model) and the TUI's footer in alerts' view,
//     and the window marks it;
//   - the TUI's /model pick (the case 5362cd43 left open) is marked in the window;
//   - the reasoning offered is the model's efforts, as the hub has them.
import path from 'node:path';
import { test, expect } from '../../harness';
import { hubAgents, hubOf, launchOn, realWorld, tui, tuiPanel, tuiReady, tuiSay, type Tui } from '../world';

const A = 'alerts';
const T = {
  screen: '[data-testid="agents.screen"]',
  row: (n: string) => `[data-testid="agents.row.${n}"]`,
  more: (n: string) => `[data-testid="agents.more.${n}"]`,
  tune: (n: string) => `[data-testid="agents.tune.${n}"]`,
  picks: (n: string) => `[data-testid^="agents.model.${n}.pick."]`,
  pick: (n: string, id: string) => `[data-testid="agents.model.${n}.pick.${id}"]`,
  efforts: (n: string) => `[data-testid^="agents.effort.${n}."]`,
};

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
const flat = (s: string): string => s.replace(/[│╭╮╰╯─┃├┤┬┴]/g, ' ').replace(/\s+/g, ' ');
const tail = (id: string): string => id.split('/').slice(1).join('/') || id;

type Row = { id: string; short: string; on: boolean };

/** The TUI's /model picker rows: '✓ id   short' or '  id   short' inside its ┃ box (heads have no gap). */
function tuiPicks(screen: string): Row[] {
  const out: Row[] = [];
  for (const l of screen.split('\n')) {
    const a = l.indexOf('┃');
    const b = l.lastIndexOf('┃');
    if (a < 0 || b <= a) continue;
    const cell = l.slice(a + 1, b).replace(/\s+$/, '');
    const m = /^\s*(✓)?\s*([^\s+][^\s]*)\s{2,}(\S.*)$/.exec(cell);
    if (!m || /^model$|applies|every role/.test(m[2] ?? '')) continue;
    out.push({ id: m[2] ?? '', short: (m[3] ?? '').trim(), on: m[1] === '✓' });
  }
  return out;
}

test("agents/models: the window's model picker is the TUI's /model list; picks go both ways; the reasoning follows the model", async () => {
  test.setTimeout(240_000);
  const w = realWorld();
  const project = path.basename(path.dirname(hubOf(w, 'telemetry').sock));
  const agent = async () => (await hubAgents(w, 'telemetry')).find((a) => a.name === A);
  let t: Tui | undefined;
  const s = await launchOn(w, `agents/${project}`, T.screen);
  try {
    const { page } = s;
    t = tui(w, 'telemetry');
    await tuiReady(t);
    await expect(page.locator(T.row(A))).toBeVisible({ timeout: 15_000 });
    const start = (await agent())?.model ?? '';
    // the window's rows
    await page.locator(T.more(A)).click();
    await expect(page.locator(T.tune(A))).toBeVisible({ timeout: 3000 });
    await expect(page.locator(T.picks(A)).first(), 'the picker lists the catalog').toBeVisible({ timeout: 10_000 });
    const win: Row[] = await page.locator(T.picks(A)).evaluateAll((els, who) =>
      els.map((e) => ({
        id: (e.getAttribute('data-testid') ?? '').replace(`agents.model.${who}.pick.`, ''),
        short: (e.querySelector('.ag-model-short')?.textContent ?? '').trim(),
        on: e.getAttribute('aria-selected') === 'true',
      })), A);
    await page.screenshot({ path: test.info().outputPath('picker.png') });
    // the TUI's rows: /model in alerts' view
    const n = (await tuiPanel(t)).find((x) => x.name === A)?.n ?? 2;
    t.keys(`M-${String(n)}`);
    await sleep(800);
    tuiSay(t, '/model');
    await expect.poll(() => tuiPicks(t?.screen() ?? '').length, { timeout: 5000, message: "the TUI's /model picker lists models" }).toBeGreaterThan(0);
    const tuiRows = tuiPicks(t.screen());
    test.info().annotations.push({ type: 'rows', description: JSON.stringify({ window: win, tui: tuiRows }) });
    t.keys('Escape');
    expect(win.map((r) => tail(r.id)).sort(), "the same models as the TUI's /model").toEqual(tuiRows.map((r) => r.id).sort());
    for (const r of win) {
      const tr = tuiRows.find((x) => x.id === tail(r.id));
      expect(r.short, `${r.id}: the TUI's short words`).toBe(tr?.short);
    }
    expect(win.find((r) => r.on)?.id, 'the current one marked in the window is the hub\'s').toBe(start);
    expect(tuiRows.find((r) => r.on)?.id, "and the TUI's").toBe(tail(start));
    // the reasoning offered = the model's efforts, as the hub has them
    const efforts = async () => page.locator(T.efforts(A)).evaluateAll((els, who) =>
      els.map((e) => (e.getAttribute('data-testid') ?? '').replace(`agents.effort.${who}.`, '')).filter((x) => x !== 'none'), A);
    const hubEfforts = ((await agent())?.efforts ?? []).filter((x) => x !== 'none');
    expect((await efforts()).sort(), "the reasoning offered is the model's efforts").toEqual([...hubEfforts].sort());
    // a pick in the window: the hub (sb list) and the TUI's footer
    const other = win.find((r) => !r.on && r.id.includes('/'))?.id ?? '';
    expect(other, 'another model to pick').not.toBe('');
    await page.locator(T.pick(A, other)).click();
    await expect.poll(async () => (await agent())?.model, { timeout: 10_000, message: 'the hub has the window\'s pick' }).toBe(other);
    await expect(page.locator(T.pick(A, other)), 'the window marks it').toHaveAttribute('aria-selected', 'true', { timeout: 5000 });
    await expect.poll(() => / you → alerts · (\S+)/.exec(flat(t?.screen() ?? ''))?.[1] ?? '', { timeout: 5000, message: "the TUI's footer in alerts' view has it" }).toBe(tail(other).replace(/-latest$/, ''));
    const hubEfforts2 = ((await agent())?.efforts ?? []).filter((x) => x !== 'none');
    await expect.poll(async () => (await efforts()).sort(), { timeout: 5000, message: "the reasoning follows the new model's efforts" }).toEqual([...hubEfforts2].sort());
    await page.screenshot({ path: test.info().outputPath('picked.png') });
    // the TUI's /model pick: back to the first model, marked in the window
    // the typed line, as is: its argument list stays open on it (⏎ there takes its first row, the
    // 'model for alerts' note, and the hub answers 'usage: /model [<model>] [default]'), so esc
    // closes the list on this text first, then ⏎ runs the line
    // (the composer still holds '/model ' from the list read above: emptied first)
    t.keys(...Array<string>(12).fill('BSpace'));
    await sleep(300);
    t.keys('-l', `/model ${start}`);
    await sleep(800);
    if (t.screen().includes('┃')) t.keys('Escape');
    await sleep(300);
    test.info().attachments.push({ name: 'tui-typed', contentType: 'text/plain', body: Buffer.from(t.screen()) });
    t.keys('Enter');
    await expect.poll(async () => (await agent())?.model, { timeout: 10_000, message: "the hub has the TUI's pick" }).toBe(start);
    await expect(page.locator(T.pick(A, start)), "the window marks the TUI's pick").toHaveAttribute('aria-selected', 'true', { timeout: 5000 });
    await page.screenshot({ path: test.info().outputPath('tui-picked.png') });
    t.keys('Escape');
  } finally {
    if (t) {
      test.info().attachments.push({ name: 'tui', contentType: 'text/plain', body: Buffer.from(t.screen()) });
      t.close();
    }
    await s.close();
  }
});
