// inbox/answer-everywhere · his answer from the inbox screen closes the card in every view and every
// count (inbox-sync: the card stayed open in the project's thread, its [1] stayed next to the
// project and next to the inbox). Owner: amb-home.
// The new app on the REAL core over the throwaway world (../world.ts; tests/checks/real.sh runs it):
// two projects. He visits shop's thread, answers its card on the inbox screen, then opens shop again.
// Passes when the hub closed it and no view draws it: not in shop's thread, not on the inbox screen,
// and the sidebar's counts are the hubs' own (shop's pink count = shop's open cards, the inbox's = every
// hub's, bise's notifications ask aside). One case, under 30 s (Gabriel's pick on page e2e-desktop):
// the window's 60 s hold on what he answered (store/acted.ts ACTED_STALE_MS) is acted.test.ts's, the
// hub running or stopped is the same read of its cards (openCards), so neither is waited for here.
import { test, expect, type Session } from '../../harness';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { hubOf, hubState, launchOn, realWorld, type World } from '../world';

type HubCard = { id: number; project?: string; question?: string; text?: string };

/**
 * A hub's open cards, as the window's row lists them: his cards and bise's own (`others`); a hub
 * that doesn't run: its last view.json's (what it wrote when it stopped).
 */
async function openCards(w: World, project: string): Promise<HubCard[]> {
  const h = hubOf(w, project);
  if (!existsSync(h.sock)) {
    const view = path.join(path.dirname(h.sock), 'view.json');
    return existsSync(view) ? ((JSON.parse(readFileSync(view, 'utf8')) as { cards?: HubCard[] }).cards ?? []) : [];
  }
  const st = await hubState(h.sock);
  const cards = (st['cards'] as HubCard[] | undefined) ?? [];
  const others = (st['others'] as HubCard[] | undefined) ?? [];
  return [...cards, ...others];
}

/** Whether a mark is drawn (bise fait mac: the rail's inbox dot, an agent row's accent dot; no counts). */
async function drawn(s: Session, selector: string): Promise<boolean> {
  return (await s.page.locator(selector).count()) > 0;
}

/** What every surface says of the card and the counts, beside the hubs' truth. */
async function surfaces(s: Session, w: World, name: string, shop: string, key: string, ask: number): Promise<Record<string, unknown>> {
  const truth = await Promise.all(w.hubs.map(async (h) => (await openCards(w, h.project)).length));
  const sum = truth.reduce((a, b) => a + b, 0);
  return {
    strip: await s.page.locator(`[data-testid="strip.card.${key}"]`).count(),
    block: await s.page.locator(`[data-testid="inbox.block.card.${key}"]`).count(),
    // the sidebar's dot on one of the project's agents, the rail's inbox dot: drawn when something waits
    shopDot: await drawn(s, `[data-testid^="app.side.agent.${shop}."][data-testid$=".waits"]`),
    shopTruth: (await openCards(w, name)).length > 0,
    // bise's ask is listed only beside a real item (inbox/Block.tsx asksNotify)
    inboxDot: await drawn(s, '[data-testid="app.rail.inbox.dot"]'),
    inboxTruth: sum + (sum > 0 ? ask : 0) > 0,
  };
}

/** On a red: the hubs' open cards and the inbox screen's waiting rows, side by side. */
async function why(s: Session, w: World): Promise<string> {
  const hubs = await Promise.all(w.hubs.map(async (h) => `${h.project}: ${(await openCards(w, h.project)).map((c) => `#${String(c.id)} ${(c.question ?? c.text ?? '').slice(0, 40)}`).join(' | ')}`));
  await s.page.locator('[data-testid="app.rail.inbox"]').click();
  await s.page.waitForTimeout(1000);
  const rows = await s.page.locator('[data-testid^="inbox.row.w:"]').evaluateAll((els) => els.filter((e) => /^inbox\.row\.w:[^.]+$/u.test(e.getAttribute('data-testid') ?? '')).map((e) => `${e.getAttribute('data-testid') ?? ''}: ${e.textContent.slice(0, 80)}`));
  return `hubs:\n  ${hubs.join('\n  ')}\ninbox screen:\n  ${rows.join('\n  ')}`;
}

const settled = (r: Record<string, unknown>): boolean =>
  r['strip'] === 0 && r['block'] === 0 && r['shopDot'] === r['shopTruth'] && r['inboxDot'] === r['inboxTruth'];

/** What the case does before he answers. */
type Before = 'none' | 'visit';

/**
 * He answers `name`'s card asking `question` (its option `n`) on the inbox screen, then opens
 * `name`'s thread from the sidebar: every surface reads the hubs.
 * `visit`: he opened that project's thread first.
 */
async function answerThenOpen(name: string, question: string, n: number, before: Before): Promise<void> {
  const w = realWorld();
  const sock = hubOf(w, name).sock;
  const project = path.basename(path.dirname(sock));
  const card = (await openCards(w, name)).find((c) => (c.question ?? c.text ?? '').includes(question));
  expect(card, `${name}'s card '${question}' is open in the world`).toBeDefined();
  const key = `${project}-${String(card?.id ?? 0)}`;
  // the inbox screen's waiting row (inbox/past.ts waitKey)
  const wkey = `w:${project}/${String(card?.id ?? 0)}`;

  const s = await launchOn(w, before === 'visit' ? `project/${project}` : 'inbox/all', before === 'visit' ? '[data-testid="composer.field"]' : '[data-testid="inbox.screen"]');
  try {
    const { page } = s;
    if (before === 'visit') {
      await expect(page.locator('[data-testid="thread.list"]')).toBeVisible({ timeout: 20_000 });
      await expect(page.locator(`[data-testid="strip.card.${key}"], [data-testid="inbox.block"]`).first(), 'the card waits in its thread').toBeVisible({ timeout: 20_000 });
      await page.locator('[data-testid="app.rail.inbox"]').click();
    }
    // 1. the inbox screen: its row, opened above the composer, his pick n
    const row = page.locator(`[data-testid="inbox.row.${wkey}"]`);
    await expect(row, 'the card waits on the inbox screen').toBeVisible({ timeout: 30_000 });
    // bise's own 'let questions reach you as macOS notifications?' ask is one of the inbox's items
    // (inbox/waiting.ts): counted beside the hubs' cards
    const home = (await hubState(hubOf(w, 'bise').sock))['project'] as string;
    const ask = await page.locator(`[data-testid="inbox.row.w:${home}/-1"]`).count();
    await row.click();
    const open = page.locator('[data-testid^="inbox.block.open."]', { hasText: question });
    await expect(open, 'the card opens to answer').toBeVisible({ timeout: 10_000 });
    await open.locator(`[data-testid$=".opt.${String(n)}"]`).first().click();
    await expect.poll(async () => (await openCards(w, name)).some((c) => c.id === card?.id), { message: 'the hub closed it', timeout: 30_000 }).toBe(false);
    await expect(row, 'gone from the inbox screen').toHaveCount(0, { timeout: 10_000 });

    // 2. the project's thread, from the sidebar
    await page.locator(`[data-testid="app.side.agent.${project}.main"]`).click();
    await expect(page.locator('[data-testid="thread.list"]')).toBeVisible({ timeout: 20_000 });
    let last: Record<string, unknown> = {};
    const reads = async (): Promise<boolean> => settled((last = await surfaces(s, w, name, project, key, ask)));
    const ok = await expect.poll(reads, { message: `every surface reads the hubs (in ${name})`, timeout: 20_000 }).toBe(true).then(() => '', (e: unknown) => String(e));
    if (ok !== '') throw new Error(`${ok}\nlast read: ${JSON.stringify(last)}\n${await why(s, w)}`);
    await page.screenshot({ path: test.info().outputPath(`${name}-${before}-after.png`) });

    // 3. back on the inbox screen: not there again
    await page.locator('[data-testid="app.rail.inbox"]').click();
    await expect(page.locator(`[data-testid="inbox.row.${wkey}"]`), 'not back on the inbox screen').toHaveCount(0);
  } finally {
    await s.close();
  }
}

test('inbox/answer-everywhere: from the inbox screen after a visit to its thread', async () => {
  test.setTimeout(60_000);
  await answerThenOpen('shop', 'merge checkout into main', 2, 'visit');
});
