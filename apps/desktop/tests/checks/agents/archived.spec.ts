// agents/archived · bar S32 / C47 (docs/desktop-bar.md): an archived agent's feed is history only,
// a line to it is refused. Owner: qa-flows. The NEW app on the REAL core over the throwaway world
// (../world.ts), the TUI on the same hub as the reference; shop's 'search' (blocked, at rest,
// in the shared folder; restored at the end). Passes when:
//   - archive on 'checkout' (done, its own worktree, 1 unpushed commit, PR #412) asks in place
//     (the hub's confirm, the ConfirmBar) the question the TUI's /archive asks '[y/N]': esc puts it
//     off, n keeps it with the hub's line, y archives it and the TUI agrees (then /restore);
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
  confirm: '[data-testid="confirm.bar"]',
  notice: '[data-testid="confirm.notice"]',
  field: '[data-testid="composer.field"]',
};
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
const flat = (s: string): string => s.replace(/[│╭╮╰╯─┃├┤┬┴]/g, ' ').replace(/\s+/g, ' ');

test('agents/archived: history only in the window, a line refused in the TUI, restore brings it back', async () => {
  test.setTimeout(240_000);
  const w = realWorld();
  const project = path.basename(path.dirname(hubOf(w, 'shop').sock));
  const live = async () => (await hubAgents(w, 'shop')).filter((a) => !a.dropped && a.status !== 'archived' && a.archived !== true);
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
    // a worktree agent with an unpushed commit: the hub asks in place (amb-home I9 bee17626, amb-win's
    // ConfirmBar 516b891a), as the TUI's /archive asks '[y/N]'; esc puts it off, n keeps it, y archives
    await expect(page.locator(T.row(WT))).toBeVisible({ timeout: 15_000 });
    const wtLive = async () => (await live()).some((a) => a.name === WT);
    tuiSay(t, `/archive ${WT}`);
    await sleep(1500);
    const tuiAsk = /archive @?checkout\?[^[]*\[y\/N\]/.exec(flat(t.screen()))?.[0] ?? '';
    tuiSay(t, 'n');
    await sleep(1000);
    test.info().attachments.push({ name: 'tui-archive-wt', contentType: 'text/plain', body: Buffer.from(t.screen()) });
    expect.soft(tuiAsk, "the TUI's /archive asks [y/N]").not.toBe('');
    const bar = page.locator(T.confirm);
    await page.locator(T.archive(WT)).click({ timeout: 10_000 });
    await expect.soft(bar, 'the window asks in place').toBeVisible({ timeout: 10_000 });
    const ask = ((await bar.getAttribute('aria-label').catch(() => '')) ?? '').trim();
    test.info().annotations.push({ type: 'wt-ask', description: JSON.stringify({ window: ask, tui: tuiAsk }) });
    expect.soft(ask, 'the same question as the TUI: the unpushed commit kept').toMatch(/unpushed commit/);
    await page.screenshot({ path: test.info().outputPath('wt-ask.png') });
    // esc: put off, still live
    await page.keyboard.press('Escape');
    await expect.soft(bar, 'esc puts it off').toHaveCount(0, { timeout: 5000 });
    expect.soft(await wtLive(), 'esc: still live').toBe(true);
    // n: keeps it, with the hub's line
    await page.locator(T.archive(WT)).click({ timeout: 10_000 });
    await expect.soft(bar, 'asked again').toBeVisible({ timeout: 10_000 });
    await page.keyboard.press('n');
    await expect.soft(bar, 'n answers').toHaveCount(0, { timeout: 5000 });
    await expect.soft(page.locator(T.notice), "n: the hub's line").toBeVisible({ timeout: 5000 });
    test.info().annotations.push({ type: 'wt-no', description: (await page.locator(T.notice).textContent().catch(() => '')) ?? '' });
    expect.soft(await wtLive(), 'n: still live').toBe(true);
    // y: archives it, the TUI agrees
    await page.locator(T.archive(WT)).click({ timeout: 10_000 });
    await expect.soft(bar, 'asked a third time').toBeVisible({ timeout: 10_000 });
    await page.keyboard.press('y');
    await expect.soft.poll(wtLive, { timeout: 15_000, message: 'y archives it in the hub' }).toBe(false);
    await expect.soft.poll(() => tuiAgents(t?.screen() ?? '').some((a) => a.name === WT), { timeout: 5000, message: "and it leaves the TUI's panel" }).toBe(false);
    await page.screenshot({ path: test.info().outputPath('wt-archived.png') });
    if (!(await wtLive())) {
      tuiSay(t, `/restore ${WT}`);
      await expect.poll(wtLive, { timeout: 15_000, message: `${WT} back (the TUI's /restore)` }).toBe(true);
    }
    await expect(page.locator(T.row(AG))).toBeVisible({ timeout: 15_000 });
    await page.locator(T.archive(AG)).click({ timeout: 10_000 });
    await expect.poll(async () => (await live()).some((a) => a.name === AG), { timeout: 10_000, message: `${AG} archived in the hub` }).toBe(false);
    // the window: its thread from the archived list (/archived, as the TUI; /agents lists only the
    // live ones) is history only
    await expect(page.locator(`${T.screen} ${T.row(AG)}`), 'it leaves the live list').toHaveCount(0, { timeout: 5000 });
    await expect(page.locator(T.archived), 'no archived row on the live list').toHaveCount(0);
    await s.app.evaluate(({ BrowserWindow }, r) => {
      for (const b of BrowserWindow.getAllWindows()) b.webContents.send('bise:route', r);
    }, `agents/${project}/archived`);
    await expect(page.locator(`${T.screen}[data-archived="true"] ${T.row(AG)}`), "on /archived's list").toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: test.info().outputPath('archived-list.png') });
    await page.locator(T.open(AG)).click({ timeout: 10_000 });
    // designer's words (ThreadScreen History, amb-win m_11920): '<name> is archived · ⌘⏎ restore'
    await expect(page.locator(T.history), "its thread says it's archived, with a way back").toContainText(`${AG} is archived`, { timeout: 10_000 });
    await expect(page.locator(T.history)).toContainText('restore');
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
