// thread/rows-batch2 · amb-win's batch 2 rows (fdf87abe on amb-feed's b8cb4b1e; bar S8 thinking,
// S12 compaction, S14/S25 notices, S15/K22/B20 not delivered, S13/S40 usage) on the REAL core next
// to the TUI on the same hub (amb-win's own batch2-rows runs them on the scripted core). Owner:
// qa-flows. The throwaway world (../world.ts); each part a step, soft, so one red keeps the others:
//   - thinking: his line with '[[think: …]]': a folded 'thought…' line in the window exactly when
//     the TUI shows one (on the world's Mistral fake neither does: the reasoning isn't kept), and
//     then it opens to what it thought;
//   - a failed turn ('[[error: badname]]': the API's final 400) is a notice with its why (✗, err);
//   - usage: the thread head's gauge words are the TUI's footer gauge words;
//   - /compact (the TUI's, on bise's main): 'compacting…' then a folded 'context compacted' that
//     opens to its summary;
//   - not delivered: in shop's main thread, '@receipts …' after the TUI archived receipts (its
//     worktree goes with it) is '✗ not delivered to receipts' with his words; esc drops it from
//     view; ⏎ send again, after the TUI's /restore, reaches receipts (his words never lost);
//     shop's agents carry their gauge in the sidebar, as the TUI's panel does.
import path from 'node:path';
import { test, expect } from '../../harness';
import { hubAgents, hubOf, launchReal, realWorld, transcriptHas, tui, tuiReady, tuiSay, type Tui } from '../world';

const T = {
  field: '[data-testid="composer.field"]',
  setupSkip: '[data-testid="setup.skip"]',
  list: '[data-testid="thread.list"]',
  thread: '[data-testid="thread.screen"]',
  think: '[data-testid^="thread.think."][data-testid$=".head"]',
  notice: '[data-testid^="thread.notice."]',
  usage: '[data-testid="thread.usage"]',
  compacting: '[data-testid^="thread.compacting."]',
  compacted: '[data-testid^="thread.compacted."][data-testid$=".head"]',
  nd: '[data-testid^="thread.notdelivered."]:not([data-testid$=".again"]):not([data-testid$=".drop"])',
  project: (p: string) => `[data-testid="app.sidebar.project.${p}"]`,
  gauges: '[data-testid^="app.right.agent."][data-testid$=".gauge"]',
};
const AG = 'receipts';
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
const flat = (s: string): string => s.replace(/[│╭╮╰╯─┃├┤┬┴]/g, ' ').replace(/\s+/g, ' ');

test('thread/rows-batch2: thinking, a failed turn, usage, compaction and not delivered on the real core', async () => {
  test.setTimeout(300_000);
  const w = realWorld();
  const shop = path.basename(path.dirname(hubOf(w, 'shop').sock));
  const n = `b${Date.now() % 1_000_000}`;
  const s = await launchReal(w);
  let t: Tui | undefined;
  let ts: Tui | undefined;
  const say = async (text: string) => {
    const field = s.page.locator(T.field).first();
    await field.click();
    await s.page.keyboard.type(text);
    await s.page.keyboard.press('Enter');
  };
  try {
    const { page } = s;
    await expect(page.locator(`${T.field}, ${T.setupSkip}`).first()).toBeVisible({ timeout: 10_000 }).catch(() => undefined);
    if (await page.locator(T.setupSkip).isVisible()) await page.locator(T.setupSkip).click();
    await expect(page.locator(T.field).first(), "bise's thread").toBeVisible({ timeout: 10_000 });
    t = tui(w, 'bise');
    await tuiReady(t);
    const list = page.locator(T.list);

    await test.step('thinking', async () => {
      await say(`weigh it [[think: weighing the p99 window ${n}]] ${n}`);
      // the answer first (the ack carries his words), then: the window shows a thought iff the TUI does
      await expect(list.getByText(`ack:`).last(), 'the answer came').toBeVisible({ timeout: 20_000 });
      await sleep(1500);
      const tuiThought = /thought/.test(flat(t?.screen() ?? ''));
      const head = list.locator(T.think).last();
      const winThought = (await head.count()) > 0;
      test.info().annotations.push({ type: 'thinking', description: JSON.stringify({ tui: tuiThought, window: winThought }) });
      expect.soft(winThought, "a 'thought…' line in the window exactly when the TUI shows one").toBe(tuiThought);
      if (winThought) {
        await expect.soft(head).toContainText('thought');
        await head.click({ timeout: 5000 }).catch(() => undefined);
        await expect.soft(list.getByText(`weighing the p99 window ${n}`).first(), 'it opens to what it thought').toBeVisible({ timeout: 5000 });
      }
      await page.screenshot({ path: test.info().outputPath('thinking.png') });
    });

    await test.step('a failed turn', async () => {
      await say(`[[error: badname]] this turn fails ${n}`);
      const notice = list.locator(T.notice).last();
      await expect.soft(notice, 'a notice for the failed turn').toBeVisible({ timeout: 30_000 });
      await expect.soft(notice, 'its level is an error').toHaveAttribute('data-level', 'err');
      const words = ((await notice.textContent().catch(() => '')) ?? '').trim();
      test.info().annotations.push({ type: 'notice', description: words });
      expect.soft(words.length, 'it says why').toBeGreaterThan(8);
      await page.screenshot({ path: test.info().outputPath('notice.png') });
    });

    await test.step('usage', async () => {
      const usage = page.locator(T.usage);
      await expect.soft(usage, "the head's gauge").toBeVisible({ timeout: 15_000 });
      const words = ((await usage.textContent().catch(() => '')) ?? '').replace(/^[\s·]+/, '').trim();
      test.info().annotations.push({ type: 'usage', description: JSON.stringify({ window: words, tui: flat(t?.screen() ?? '').match(/you → main[^╯]*/)?.[0]?.slice(0, 200) }) });
      expect.soft(words, 'gauge words').not.toBe('');
      expect.soft(flat(t?.screen() ?? ''), "the TUI's gauge has the same words").toContain(words);
    });

    await test.step('compaction', async () => {
      for (let i = 0; i < 40; i++) t?.keys('BSpace');
      // (no esc here: on the TUI's line, esc puts the draft away)
      t?.keys('-l', '/compact');
      await sleep(500);
      t?.keys('Enter');
      await sleep(800);
      // its list took the first ⏎ (it fills the line): ⏎ again runs it
      if (/│\s+\/compact\s/.test(t?.screen() ?? '')) t?.keys('Enter');
      await expect.soft(list.locator(`${T.compacting}, ${T.compacted}`).last(), "'compacting…' then 'context compacted'").toBeVisible({ timeout: 60_000 });
      const head = list.locator(T.compacted).last();
      await expect.soft(head, "a folded 'context compacted'").toContainText('context compacted', { timeout: 60_000 });
      await head.click({ timeout: 5000 }).catch(() => undefined);
      const box = list.locator('[data-testid^="thread.compacted."]:not([data-testid$=".head"])').last();
      const text = (await box.innerText().catch(() => '')).replace('context compacted', '').trim();
      // the TUI's summary, opened (ctrl+o opens everything folded): the reference for its words
      t?.keys('C-o');
      await sleep(800);
      const tuiScreen = t?.screen() ?? '';
      const after = tuiScreen.split('\n').map((l) => l.replace(/[│╭╮╰╯─┃├┤┬┴]/g, ' ').trim());
      const at = after.findIndex((l) => l.startsWith('≡ summary'));
      const tuiSummary = at < 0 ? '' : after.slice(at + 1, at + 6).filter((l) => l !== '' && !l.startsWith('╭') && !/inbox/.test(l)).join(' ');
      t?.keys('C-o');
      test.info().annotations.push({ type: 'summary', description: JSON.stringify({ window: text.slice(0, 300), tui: tuiSummary.slice(0, 300) }) });
      test.info().attachments.push({ name: 'tui-summary-open', contentType: 'text/plain', body: Buffer.from(tuiScreen) });
      // the same words as the TUI's opened summary (the world's fake model writes a short one)
      const words = (x: string) => x.replace(/[▾▸]/g, ' ').replace(/\s+/g, ' ').trim();
      expect.soft(words(tuiSummary), "the TUI's summary opens to words").not.toBe('');
      expect.soft(words(text), "it opens to its summary: the TUI's words").toBe(words(tuiSummary));
      await page.screenshot({ path: test.info().outputPath('compacted.png') });
      test.info().attachments.push({ name: 'tui-compact', contentType: 'text/plain', body: Buffer.from(t?.screen() ?? '') });
    });

    await test.step('not delivered', async () => {
      ts = tui(w, 'shop');
      await tuiReady(ts);
      // receipts: its own worktree goes with the archive, so nothing revives it (a shared-folder
      // agent like search is revived by a message: the hub delivers it, no row)
      const live = async () => (await hubAgents(w, 'shop')).some((a) => a.name === AG && a.status !== 'archived' && !a.dropped);
      tuiSay(ts, `/archive ${AG}`);
      await sleep(1500);
      if (/\[y\/N\]/.test(flat(ts.screen()))) tuiSay(ts, 'y');
      await expect.poll(live, { timeout: 15_000, message: `${AG} archived (the TUI)` }).toBe(false);
      await page.locator(T.project(shop)).click({ timeout: 10_000 });
      await expect(page.locator(T.thread)).toHaveAttribute('data-project', shop, { timeout: 5000 });
      await expect.soft(page.locator(T.gauges).first(), "shop's agents carry their gauge in the sidebar").toBeVisible({ timeout: 10_000 });
      const gauges = await page.locator(T.gauges).evaluateAll((els) =>
        els.map((e) => ({ agent: (e.getAttribute('data-testid') ?? '').replace(/^app\.sidebar\.agent\./, '').replace(/\.gauge$/, ''), words: e.textContent.trim() })));
      const panel = flat(ts.screen()).match(/agents .*? inbox/)?.[0] ?? '';
      test.info().annotations.push({ type: 'sidebar-gauges', description: JSON.stringify({ window: gauges, tuiPanel: panel }) });
      expect.soft(gauges.length, "shop's agents carry their gauge in the sidebar").toBeGreaterThan(0);
      // each one is the TUI panel's: '<n> <glyph> <name> … <pct>%'
      for (const g of gauges) {
        const tuiPct = new RegExp(`\\b${g.agent}\\b[^%]*?(\\d+%)`).exec(panel)?.[1] ?? '';
        expect.soft(g.words, `${g.agent}'s gauge is the TUI panel's ${tuiPct}`).toBe(tuiPct);
      }
      await say(`@${AG} first try ${n}`);
      const first = list.locator(T.nd, { hasText: `first try ${n}` }).last();
      await expect.soft(first, `'✗ not delivered to ${AG}'`).toContainText(`not delivered to ${AG}`, { timeout: 15_000 });
      await page.screenshot({ path: test.info().outputPath('not-delivered.png') });
      await first.focus().catch(() => undefined);
      await page.keyboard.press('Escape');
      await expect.soft(first, 'esc drops it from view').toHaveCount(0, { timeout: 3000 });
      await say(`@${AG} second try ${n}`);
      const second = list.locator(T.nd, { hasText: `second try ${n}` }).last();
      await expect.soft(second, 'the second one too').toContainText(`not delivered to ${AG}`, { timeout: 15_000 });
      tuiSay(ts, `/restore ${AG}`);
      await expect.poll(live, { timeout: 15_000, message: `${AG} restored (the TUI)` }).toBe(true);
      await second.locator('[data-testid$=".again"]').click({ timeout: 5000 }).catch(() => undefined);
      await expect.soft(second, "it says 'sent again'").toContainText('sent again', { timeout: 5000 });
      await expect.soft.poll(() => transcriptHas(w, 'shop', AG, `second try ${n}`), { timeout: 15_000, message: `send again reaches ${AG}: his words never lost` }).toBe(true);
      test.info().attachments.push({ name: 'tui-shop-nd', contentType: 'text/plain', body: Buffer.from(ts.screen()) });
      await page.screenshot({ path: test.info().outputPath('sent-again.png') });
    });
  } finally {
    for (const [name, x] of [['tui-bise', t], ['tui-shop', ts]] as const) {
      if (x) {
        test.info().attachments.push({ name, contentType: 'text/plain', body: Buffer.from(x.screen()) });
        x.close();
      }
    }
    await s.close();
  }
});
