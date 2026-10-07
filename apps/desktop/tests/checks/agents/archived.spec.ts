// agents/archived · bar S32 / C47 (docs/desktop-bar.md): an archived agent's feed is history only,
// a line to it is refused. Owner: qa-flows. The NEW app on the REAL core over the throwaway world
// (../world.ts), the TUI on the same hub as the reference; shop's 'search' (blocked, at rest,
// in the shared folder; restored at the end). Passes when:
//   - (soft) archive on 'checkout' (done, its own worktree, PR #412) either archives it or says why
//     in place, as the TUI's /archive answers;
//   - archived from the window, its thread opens from the 'archived' list as history: its old rows,
//     'history only' words, no composer that sends;
//   - the TUI, in focus on it, refuses a plain line with '<agent> is archived. /restore brings it
//     back' and the hub's transcript never gets the line;
//   - 'restore it' in the thread brings it back to the hub, the TUI's panel and the composer.
import path from 'node:path';
import { test, expect } from '../../harness';
import { hubAgents, hubOf, launchOn, realWorld, transcriptHas, tui, tuiAgents, tuiClick, tuiReady, tuiSay, type Tui } from '../world';

const AG = 'search';
const WT = 'checkout';
const T = {
  screen: '[data-testid="agents.screen"]',
  row: (n: string) => `[data-testid="agents.row.${n}"]`,
  archive: (n: string) => `[data-testid="agents.archive.${n}"]`,
  open: (n: string) => `[data-testid="agents.open.${n}"]`,
  archived: '[data-testid="agents.archived"]',
  thread: '[data-testid="thread.screen"]',
  list: '[data-testid="thread.list"]',
  history: '[data-testid="thread.archived"]',
  restore: '[data-testid="thread.restore"]',
  field: '[data-testid="composer.field"]',
};
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
const flat = (s: string): string => s.replace(/[│╭╮╰╯─┃├┤┬┴]/g, ' ').replace(/\s+/g, ' ');

test('agents/archived: history only in the window, a line refused in the TUI, restore brings it back', async () => {
  test.setTimeout(240_000);
  const w = realWorld();
  const project = path.basename(path.dirname(hubOf(w, 'shop').sock));
  const live = async () => (await hubAgents(w, 'shop')).filter((a) => !a.dropped && a.status !== 'archived');
  const n = `h${Date.now() % 1_000_000}`;
  let t: Tui | undefined;
  const s = await launchOn(w, `agents/${project}`, T.screen);
  try {
    const { page } = s;
    t = tui(w, 'shop');
    await tuiReady(t);
    if (!(await live()).some((a) => a.name === AG)) {
      tuiSay(t, `/restore ${AG}`);
      await expect.poll(async () => (await live()).some((a) => a.name === AG), { timeout: 10_000, message: `${AG} back first` }).toBe(true);
    }
    await page.screenshot({ path: test.info().outputPath('opened.png') });
    // (soft) a worktree agent with a PR: archived, or why not, in place; the TUI's /archive beside it
    await expect(page.locator(T.row(WT))).toBeVisible({ timeout: 15_000 });
    const before = (await page.locator(T.row(WT)).innerText()).replace(/\s+/g, ' ');
    await page.locator(T.archive(WT)).click({ timeout: 10_000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: test.info().outputPath('wt-archive-clicked.png') });
    const wtLive = (await live()).some((a) => a.name === WT);
    const after = wtLive ? (await page.locator(T.row(WT)).innerText()).replace(/\s+/g, ' ') : '';
    if (wtLive) {
      tuiSay(t, `/archive ${WT}`);
      await sleep(2000);
      test.info().attachments.push({ name: 'tui-archive-wt', contentType: 'text/plain', body: Buffer.from(t.screen()) });
    }
    test.info().annotations.push({ type: 'wt-archive', description: JSON.stringify({ wtLive, before, after, tuiArchived: !(await live()).some((a) => a.name === WT) }) });
    expect.soft(!wtLive || after !== before, `archive on ${WT} (own worktree, PR): archived, or the row says why`).toBe(true);
    if (!(await live()).some((a) => a.name === WT)) {
      tuiSay(t, `/restore ${WT}`);
      await sleep(1500);
    }
    await expect(page.locator(T.row(AG))).toBeVisible({ timeout: 15_000 });
    await page.locator(T.archive(AG)).click({ timeout: 10_000 });
    await expect.poll(async () => (await live()).some((a) => a.name === AG), { timeout: 10_000, message: `${AG} archived in the hub` }).toBe(false);
    // the window: its thread from the archived list is history only
    await expect(page.locator(T.archived)).toBeVisible({ timeout: 5000 });
    await page.locator(T.archived).click({ timeout: 10_000 });
    await page.screenshot({ path: test.info().outputPath('archived-list.png') });
    await page.locator(T.open(AG)).click({ timeout: 10_000 });
    await expect(page.locator(T.history), "its thread says it's history only").toContainText('history only', { timeout: 10_000 });
    await expect(page.locator(`${T.thread} ${T.field}`), 'no composer that sends').toHaveCount(0);
    await expect(page.locator(`${T.list} [data-testid^="thread.entry."]`).first(), 'its old rows are there').toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: test.info().outputPath('history.png') });
    // the TUI: in focus on it (its /archived list), a plain line is refused
    // (its panel lists archived agents with no number, '▾ 1 archived · – search': a click focuses one)
    if (!flat(t.screen()).includes(`– ${AG}`)) tuiSay(t, '/archived');
    await expect.poll(() => flat(t?.screen() ?? ''), { timeout: 5000, message: "the TUI's panel lists it under archived" }).toContain(`– ${AG}`);
    expect(tuiClick(t, `– ${AG}`), 'its archived row on the TUI screen').toBe(true);
    await sleep(800);
    test.info().attachments.push({ name: 'tui-focused', contentType: 'text/plain', body: Buffer.from(t.screen()) });
    tuiSay(t, `a line to an archived agent ${n}`);
    await expect.poll(() => flat(t?.screen() ?? ''), { timeout: 5000, message: "the TUI refuses: '<agent> is archived. /restore brings it back'" }).toContain(`${AG} is archived. /restore brings it back`);
    await sleep(1500);
    expect(transcriptHas(w, 'shop', AG, n), 'the hub never got the line').toBe(false);
    test.info().attachments.push({ name: 'tui-refused', contentType: 'text/plain', body: Buffer.from(t.screen()) });
    for (let i = 0; i < 60; i++) t.keys('BSpace');
    t.keys('Escape');
    // restore from the thread
    await page.locator(T.restore).click({ timeout: 10_000 });
    await expect.poll(async () => (await live()).some((a) => a.name === AG), { timeout: 10_000, message: "'restore it' brings it back to the hub" }).toBe(true);
    await expect.poll(() => tuiAgents(t?.screen() ?? '').some((a) => a.name === AG), { timeout: 5000, message: "and to the TUI's panel" }).toBe(true);
    await expect(page.locator(`${T.thread} ${T.field}`), 'the composer is back').toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: test.info().outputPath('restored.png') });
  } finally {
    if (t) {
      if (!(await live().catch(() => [])).some((a) => a.name === AG)) tuiSay(t, `/restore ${AG}`);
      test.info().attachments.push({ name: 'tui', contentType: 'text/plain', body: Buffer.from(t.screen()) });
      t.close();
    }
    await s.close();
  }
});
