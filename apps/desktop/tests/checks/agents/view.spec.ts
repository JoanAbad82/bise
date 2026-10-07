// agents/view · bar A.3 (docs/desktop-bar.md): an agent's view: its feed, its last report and
// open questions (`sb tasks`, `sb inspect`). Owner: qa-flows. The NEW app on the REAL core over
// the throwaway world (../world.ts), the TUI on the same hub as the reference (⌥N looks inside
// an agent). Passes when:
//   - the list shows p99's last report as the hub has it (its words, not cut to nothing);
//   - alerts' row opens alerts' thread, which has its brief as the TUI's view of alerts does;
//   - a line sent there streams: alerts at work in the window, then its answer in the window
//     and in the TUI's view of alerts (the same words), and alerts' transcript has the line.
// Its second test: an agent's own open question (amb-tools 7d361b6e: shop's gift-ui asks main,
// main escalates it as a card tied to gift-ui's message, gift-ui reports blocked). Passes when
// gift-ui's row says it needs him (blocked, with a waiting count) as the TUI's panel does ('?'),
// and gift-ui's view shows the question, as the TUI's view of gift-ui does.
import path from 'node:path';
import { test, expect } from '../../harness';
import { hubAgents, hubOf, hubState, launchOn, realWorld, transcriptHas, tui, tuiAgents, tuiInbox, tuiReady, type Tui } from '../world';

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
  const s = await launchOn(w, `agents/${project}`, T.screen);
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

test("agents/view: an agent's own question shows on its row and in its view, as in the TUI", async () => {
  test.setTimeout(150_000);
  const w = realWorld();
  const project = path.basename(path.dirname(hubOf(w, 'shop').sock));
  const ask = 'show the balance on the cart page, or only at checkout?';
  let t: Tui | undefined;
  const s = await launchOn(w, `agents/${project}`, T.screen);
  try {
    const { page } = s;
    t = tui(w, 'shop');
    await tuiReady(t);
    const panel = tuiAgents(t.screen()).find((a) => a.name === 'gift-ui');
    expect(panel, "the TUI's panel lists gift-ui (the world seeds it: amb-tools 7d361b6e)").toBeTruthy();
    expect(panel?.glyph, "the TUI's panel has gift-ui needing him").toBe('?');
    const row = page.locator('[data-testid="agents.row.gift-ui"]');
    await expect(row).toBeVisible({ timeout: 15_000 });
    await expect(row, "gift-ui's row says it needs him").toHaveAttribute('data-status', /blocked|waiting/);
    await expect(row.locator('.needs, [data-needs="true"]').or(row.getByText(/^\d+$/)).first(), "gift-ui's row shows what waits on him").toBeVisible({ timeout: 3000 });
    await page.screenshot({ path: test.info().outputPath('row.png') });
    t.keys(`M-${String(panel?.n ?? 4)}`);
    await sleep(1500);
    expect(flat(t.screen()), "the TUI's view of gift-ui has its question").toContain(ask);
    await page.locator(T.open('gift-ui')).click();
    await expect(page.locator(T.thread)).toHaveAttribute('data-agent', 'gift-ui', { timeout: 5000 });
    const view = page.locator(T.thread);
    try {
      await expect(view, "gift-ui's view shows its message to main as a question ('✉ gift-ui → main', amb-win 1b1d0abe)").toContainText('✉ gift-ui → main', { timeout: 10_000 });
      await expect(view, "gift-ui's view shows its question").toContainText(ask);
    } finally {
      await page.screenshot({ path: test.info().outputPath('question.png') });
    }
    // the card main opened for it (card #2 in the world), in gift-ui's thread with its options
    const cards = async () => ((await hubState(hubOf(w, 'shop').sock))['cards'] as { id: number; text?: string; question?: string }[] | undefined) ?? [];
    const id = (await cards()).find((c) => (c.text ?? c.question ?? '').includes(ask))?.id;
    expect(id, 'the hub has the card for gift-ui\'s question').toBeDefined();
    const card = page.locator(`[data-testid="thread.card.${String(id)}"]`);
    await expect(card, "the card shows in gift-ui's thread").toBeVisible({ timeout: 5000 });
    await expect(page.locator(`[data-testid="thread.card.${String(id)}.opt.1"]`), 'with its first option').toContainText('on the cart page');
    await page.screenshot({ path: test.info().outputPath('card.png') });
    // his click answers it: the hub and the TUI see it answered, gift-ui gets the reply
    await page.locator(`[data-testid="thread.card.${String(id)}.opt.1"]`).click();
    await expect.poll(async () => (await cards()).some((c) => c.id === id), { timeout: 15_000, message: 'the hub has the card answered' }).toBe(false);
    await expect.poll(() => tuiInbox(t?.screen() ?? '').some((r) => r.agent === 'gift-ui'), { timeout: 10_000, message: "the TUI's inbox drops gift-ui's card" }).toBe(false);
    await expect.poll(() => transcriptHas(w, 'shop', 'gift-ui', 'on the cart page'), { timeout: 30_000, message: 'gift-ui gets the reply' }).toBe(true);
    await expect(card, "the card in gift-ui's thread says answered").toContainText('answered', { timeout: 5000 });
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
