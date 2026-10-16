// thread/rows-batch2 · amb-win's batch 2 rows (fdf87abe on amb-feed's b8cb4b1e; bar S8 thinking,
// S12 compaction, S14/S25 notices, S15/K22/B20 not delivered, S13/S40 usage) on the REAL core next
// to the TUI on the same hub (amb-win's own batch2-rows runs them on the scripted core). Owner:
// qa-flows. The throwaway world (../world.ts); each part a step, soft, so one red keeps the others:
//   - thinking: his line with '[[think: …]]': a folded 'thought…' line in the window exactly when
//     the TUI shows one (on the world's Mistral fake neither does: the reasoning isn't kept), and
//     then it opens to what it thought;
//   - a failed turn ('[[error: badname]]': the API's final 400) is a notice with its why (✗, err);
//   - usage (designer D12/D7b: the window hides a gauge at 0%): bise's main at 0% (the TUI's footer
//     says '· 0%') has no gauge in the window's head; the echo fake can't raise it above 0%;
//   - /compact (the TUI's, on bise's main): 'compacting…' then a folded 'context compacted' that
//     opens to its summary;
//   - not delivered: in shop's main thread, '@receipts …' after the TUI archived receipts (its
//     worktree goes with it) is '✗ not delivered to receipts' with his words; esc drops it from
//     view; ⏎ send again, after the TUI's /restore, reaches receipts (his words never lost);
//     shop's agents at 0% carry no gauge in the right bar (any shown is the TUI panel's).
import path from 'node:path';
import { test, expect } from '../../harness';
import { thread } from '../../../src/proto/words.gen';
import { hubAgents, hubOf, launchReal, realWorld, transcriptHas, tui, tuiReady, tuiSay, type Tui } from '../world';

const T = {
  field: '[data-testid="composer.field"]',
  setupSkip: '[data-testid="setup.skip"]',
  list: '[data-testid="thread.list"]',
  thread: '[data-testid="thread.screen"]',
  think: '[data-testid^="thread.think."][data-testid$=".head"]',
  notice: '[data-testid^="thread.notice."]',
  // the gauge is the composer tab's (designer m_24325: never the head's too)
  usage: '[data-testid="composer.tab.context"]',
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
    await expect(page.locator(T.field).first(), thread.from_thread({ name: 'bise' })).toBeVisible({ timeout: 10_000 });
    t = tui(w, 'bise');
    await tuiReady(t);
    const list = page.locator(T.list);

    await test.step('thinking', async () => {
      await say(`weigh it [[think: weighing the p99 window ${n}]] ${n}`);
      // the answer first (the ack carries his words), then: the window shows a thought iff the TUI does
      await expect(list.getByText(`ack:`).last(), 'the answer came').toBeVisible({ timeout: 20_000 });
      await sleep(1500);
      const tuiThought = /thought/.test(flat(t?.screen() ?? ''));
      test.info().attachments.push({ name: 'tui-thinking', contentType: 'text/plain', body: Buffer.from(t?.screen() ?? '') });
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
      // the turn's end is its own row now (thread.failed.<pos>, level err), after the attempt's
      // 'candidate discarded' notice (level warn): the failed turn is the err one
      const notice = list.locator(`${T.notice}[data-level="err"], [data-testid^="thread.failed."][data-level="err"]`).last();
      await expect.soft(notice, 'an error row for the failed turn').toBeVisible({ timeout: 30_000 });
      const words = ((await notice.textContent().catch(() => '')) ?? '').trim();
      test.info().annotations.push({ type: 'notice', description: words });
      expect.soft(words.length, 'it says why').toBeGreaterThan(8);
      await page.screenshot({ path: test.info().outputPath('notice.png') });
    });

    await test.step('usage', async () => {
      // designer's rule (D12/D7b, ambient-lead m_20365): the window hides a gauge that says 0%, the
      // TUI's footer always says it. bise's main is at 0% here: no gauge in the window
      const footer = flat(t?.screen() ?? '').match(/you → main[^╯]*/)?.[0] ?? '';
      const zero = /\b\d+ · 0%/.test(footer);
      test.info().annotations.push({ type: 'usage-main', description: JSON.stringify({ zero, tui: footer.slice(0, 200) }) });
      if (zero) await expect.soft(page.locator(T.usage), "at 0% the window's head has no gauge").toBeHidden({ timeout: 3000 });
      // non-zero: real.sh's world is not rich, so every hub runs the echo fake, whose calls always
      // report 10 input tokens (tests/fake_provider.py USAGE): no turn there can raise a gauge above
      // 0%. A non-zero gauge needs a usage marker in the fake or a rich world (asked via ambient-lead).
      await expect(page.locator(T.field).first(), "bise's thread again").toBeVisible({ timeout: 10_000 });
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
      await expect.soft(head, "a folded 'context compacted'").toContainText(thread.compacted, { timeout: 60_000 });
      await head.click({ timeout: 5000 }).catch(() => undefined);
      const box = list.locator('[data-testid^="thread.compacted."]:not([data-testid$=".head"])').last();
      const text = (await box.innerText().catch(() => '')).replace(thread.compacted, '').trim();
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
      // archived: its status, dropped, an archived flag, or out of the hub's agents (the TUI says
      // '@receipts archived — work saved (/restore)' and moves it under '▸ 1 archived')
      const raw = async () => (await hubAgents(w, 'shop')).find((a) => a.name === AG);
      const live = async () => {
        const a = await raw();
        return a !== undefined && a.status !== 'archived' && !a.dropped && !JSON.stringify(a).includes('"archived":true');
      };
      tuiSay(ts, `/archive ${AG}`);
      await sleep(1500);
      if (/\[y\/N\]/.test(flat(ts.screen()))) tuiSay(ts, 'y');
      try {
        await expect.poll(live, { timeout: 15_000, message: `${AG} archived (the TUI)` }).toBe(false);
      } finally {
        test.info().attachments.push({ name: 'tui-archive', contentType: 'text/plain', body: Buffer.from(ts.screen()) });
        test.info().attachments.push({ name: 'hub-receipts', contentType: 'application/json', body: Buffer.from(JSON.stringify((await raw().catch(() => undefined)) ?? null)) });
      }
      await page.locator(T.project(shop)).click({ timeout: 10_000 });
      await expect(page.locator(T.thread)).toHaveAttribute('data-project', shop, { timeout: 5000 });
      // shop's agents at 0% in the TUI's panel carry no gauge in the right bar (designer D12/D7b);
      // any gauge shown is the TUI panel's percent ('<n> <glyph> <name> … <pct>%'), never 0%
      const gauges = await page.locator(T.gauges).evaluateAll((els) =>
        els.map((e) => ({ agent: (e.getAttribute('data-testid') ?? '').replace(/^app\.right\.agent\./, '').replace(/\.gauge$/, ''), words: e.textContent.trim() })));
      const panel = flat(ts.screen()).match(/agents .*? inbox/)?.[0] ?? '';
      test.info().annotations.push({ type: 'right-bar-gauges', description: JSON.stringify({ window: gauges, tuiPanel: panel }) });
      for (const g of gauges) {
        const tuiPct = new RegExp(`\\b${g.agent}\\b[^%]*?(\\d+%)`).exec(panel)?.[1] ?? '';
        expect.soft(g.words, `${g.agent}'s gauge is the TUI panel's ${tuiPct}`).toBe(tuiPct);
        expect.soft(g.words, `${g.agent}: a gauge at 0% is hidden`).not.toBe('0%');
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
      await expect.soft(second, "it says 'sent again'").toContainText(thread.sent_again, { timeout: 5000 });
      await expect.soft.poll(() => transcriptHas(w, 'shop', AG, `second try ${n}`), { timeout: 15_000, message: `send again reaches ${AG}: his words never lost` }).toBe(true);
      test.info().attachments.push({ name: 'tui-shop-nd', contentType: 'text/plain', body: Buffer.from(ts.screen()) });
      await page.screenshot({ path: test.info().outputPath('sent-again.png') });
    });

    await test.step('a non-zero gauge (shop/search)', async () => {
      // amb-tools 55fd5c44: shop/search's brief ends with [[usage: 43800]], so its calls report
      // 43 800 input tokens: its right-bar row carries the TUI panel's percent (non-zero), and its
      // head says the hub's words
      const sts = ts as Tui;
      const panel = flat(sts.screen()).match(/agents .*? inbox/)?.[0] ?? '';
      const tuiPct = /\bsearch\b[^%]*?(\d+%)/.exec(panel)?.[1] ?? '';
      const agents: (Awaited<ReturnType<typeof hubAgents>>[number] & { usage?: { words?: string } })[] = await hubAgents(w, 'shop');
      const hubWords = agents.find((a) => a.name === 'search')?.usage?.words ?? '';
      const gauge = page.locator('[data-testid="app.right.agent.search.gauge"]');
      await expect.soft(gauge, "search's right-bar row carries its gauge").toBeVisible({ timeout: 10_000 });
      const got = ((await gauge.textContent().catch(() => '')) ?? '').trim();
      test.info().annotations.push({ type: 'usage-search', description: JSON.stringify({ window: got, tuiPanel: tuiPct, hub: hubWords }) });
      expect.soft(tuiPct, "the TUI's panel says search is above 0%").toMatch(/^[1-9]\d*%$/);
      expect.soft(got, "the window's gauge is the TUI panel's").toBe(tuiPct);
      await page.locator('[data-testid="app.right.agent.search"]').click({ timeout: 5000 });
      // the agent head shows each meta item whole or not at all (69192579): search's long purpose
      // line fills it, so its gauge goes; the composer's tab ('context 44k · 17%') keeps it
      const head = page.locator(T.usage);
      const label = page.getByTestId('composer.tab.context');
      await expect.soft(label, "search's tab").toBeVisible({ timeout: 10_000 });
      const inHead = await head.isVisible();
      const where = inHead ? head : label;
      const words = ((await where.textContent().catch(() => '')) ?? '').trim();
      test.info().annotations.push({ type: 'usage-search-head', description: JSON.stringify({ inHead, words }) });
      expect.soft(words, "search's head or label line says the hub's words").toContain(hubWords || tuiPct);
      await page.screenshot({ path: test.info().outputPath('usage-search.png') });
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
