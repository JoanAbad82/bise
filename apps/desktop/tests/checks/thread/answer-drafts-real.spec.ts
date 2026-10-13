// thread/answer-drafts-real · his lost words on a docked drafts card (ambient-lead m_21516, main
// m_21514: his try on b4a25acb). Owner: amb-core. The NEW app on the REAL core over the throwaway
// world (../world.ts): shop's main publishes a page with two drafted mails, so shop's hub opens ONE
// batch card ('2 drafts wait for you · <title> … 1. review / 2. send both'). He is in bise's own
// thread (another project's card, docked in its inbox block), as he was. Passes when:
//   - his free words on that card ('Ou sont les drafts?'), sent from the composer in 'answering'
//     mode, reach the card's asker (shop's main transcript holds them), the card stays open, and
//     the window still shows his words somewhere (never a field that just empties);
//   - '1. review' does what it says: the page opens (test-mode stdout 'bise-desktop: external
//     <url>' with the page's id, never his browser), nothing is sent (the card stays);
//   - the TUI on the same hub: '/answer <card> <words>' reaches shop's main too (one answer path).
// Before the fix the hub's page_drafts_answer (switchboard daemon/page_cards.rs) took any words
// that were not 'send all' as done: no message, no notice, no error.
import path from 'node:path';
import { test, expect, type Session } from '../../harness';
import { Lines } from '../native/world';
import { hubOf, hubState, launchReal, realWorld, transcriptHas, tui, tuiReady, tuiSay, worldSay, type World } from '../world';

const T = {
  field: '[data-testid="composer.field"]',
  setupSkip: '[data-testid="setup.skip"]',
};
type HubCard = { id: number; text?: string; question?: string; page?: { id?: string; url?: string } | null };

/** Shop's main publishes a page of two drafted mails; the batch card's id once the hub opened it. */
async function draftsCard(w: World, n: string): Promise<{ id: number; project: string; pageId: string; title: string }> {
  const pageId = `rel-${n}`;
  const title = `release replies ${n}`;
  const em = (i: string, to: string) => `<section data-kit="email" data-id="${i}" data-verb="draft"><p data-field="to">${to}</p><p data-field="subject">v5.9.1</p><p>x</p></section>`;
  const html = '<section data-kit="checklist" data-id="plan" data-plan><ol>'
    + '<li data-id="b1" data-who="bise" data-did="drafted" data-draft="mail-lucas">reply to Lucas</li>'
    + '<li data-id="b2" data-who="bise" data-did="drafted" data-draft="mail-marc">reply to Marc</li></ol></section>'
    + em('mail-lucas', 'lucas@acme.test') + em('mail-marc', 'marc@acme.test');
  worldSay('shop', `[[bash: printf '%s\\n' '${html}' > ${pageId}.html && sb page publish ${pageId}.html --id ${pageId} --title '${title}']]`);
  const hub = hubOf(w, 'shop');
  const ours = async () => (((await hubState(hub.sock))['cards'] as HubCard[] | undefined) ?? []).filter((c) => c.page?.id === pageId);
  await expect.poll(async () => (await ours()).length, { timeout: 90_000, message: "shop's hub opens the page's one batch card" }).toBe(1);
  const [card] = await ours();
  if (card === undefined) throw new Error('no batch card');
  return { id: card.id, project: path.basename(path.dirname(hub.sock)), pageId, title };
}

/** The card open in bise's inbox block (it lists every project's cards, one row shown): its row's
 *  click when it shows, else '+ N more', which opens the next card in turn, until it is the open one. */
async function openCard(s: Session, key: string, title: string): Promise<void> {
  const { page } = s;
  const card = page.getByTestId(`inbox.block.card.${key}`);
  const row = page.locator('[data-testid^="inbox.block.row."]', { hasText: title }).first();
  for (let i = 0; i < 40 && !(await card.isVisible()); i++) {
    if (await row.isVisible()) await row.click({ timeout: 2000 }).catch(() => undefined);
    else await page.getByTestId('inbox.block.more').click({ timeout: 2000 }).catch(() => undefined);
    await page.waitForTimeout(500);
  }
  if (!(await card.isVisible())) {
    await page.screenshot({ path: test.info().outputPath('no-card.png') });
    const rows = await page.locator('[data-testid^="inbox.block"]').allInnerTexts();
    test.info().annotations.push({ type: 'block', description: JSON.stringify(rows).slice(0, 2000) });
  }
  await expect(card, `${title}: its card open in the block`).toBeVisible({ timeout: 5000 });
}

async function openThread(s: Session): Promise<void> {
  const { page } = s;
  await expect(page.locator(`${T.field}, ${T.setupSkip}`).first()).toBeVisible({ timeout: 15_000 }).catch(() => undefined);
  if (await page.locator(T.setupSkip).isVisible()) await page.locator(T.setupSkip).click();
  await expect(page.locator(T.field).first(), "bise's thread with its composer").toBeVisible({ timeout: 15_000 });
}

/** Docks a fresh drafts card in bise's thread and types his free words on it. */
async function wordsOnCard(s: Session, c: Awaited<ReturnType<typeof draftsCard>>, words: string): Promise<void> {
  const { page } = s;
  await openThread(s);
  await openCard(s, `${c.project}-${String(c.id)}`, c.title);
  await expect.soft(page.getByTestId('composer'), "the composer answers the card: 'answering bise · 2 drafts…'").toContainText('answering bise');
  await page.screenshot({ path: test.info().outputPath('answering.png') });
  await page.locator(T.field).first().click();
  await page.keyboard.type(words);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: test.info().outputPath('sent.png') });
}

test('thread/answer-drafts-real: free words on another project\'s docked drafts card reach its asker on the real core', async () => {
  test.setTimeout(300_000);
  const w = realWorld();
  const n = `q${String(Date.now() % 1_000_000)}`;
  const c = await draftsCard(w, n);
  const s = await launchReal(w);
  try {
    const words = `Ou sont les drafts? ${n}`;
    await wordsOnCard(s, c, words);
    // the effect outside the app: the card's asker (shop's main, who published the page) got them
    // his whole words: `n` alone is in the page's id and title, which shop's main itself wrote
    await expect.poll(() => transcriptHas(w, 'shop', 'main', words), { timeout: 20_000, message: "shop's main (the card's asker) got his words" }).toBe(true);
    const open = ((await hubState(hubOf(w, 'shop').sock))['cards'] as HubCard[] | undefined) ?? [];
    expect.soft(open.some((x) => x.id === c.id), 'words that are no option leave the card open').toBe(true);
  } finally {
    await s.close();
  }
});

// the window half (amb-win): the hub's {ev:'notice', cmd:'answer'} shows where he typed
test('thread/answer-drafts-real: his words on a drafts card stay on screen, said where they went (real core)', async () => {
  test.setTimeout(300_000);
  const w = realWorld();
  const n = `s${String(Date.now() % 1_000_000)}`;
  const c = await draftsCard(w, n);
  const s = await launchReal(w);
  try {
    const words = `Ou sont les drafts? ${n}`;
    await wordsOnCard(s, c, words);
    // never a field that just empties: his words are on screen (given back, or said where they went)
    await expect(s.page.getByText(words).first(), 'his words are still on screen').toBeVisible({ timeout: 5000 });
  } finally {
    await s.close();
  }
});

// the window half (amb-win): '1. review' on a batch card opens card.page.url
test("thread/answer-drafts-real: '1. review' on a drafts card opens its page on the real core", async () => {
  test.setTimeout(300_000);
  const w = realWorld();
  const n = `r${String(Date.now() % 1_000_000)}`;
  const c = await draftsCard(w, n);
  const s = await launchReal(w);
  const out = new Lines();
  s.app.process().stdout?.setEncoding('utf8');
  s.app.process().stdout?.on('data', (d: string) => {
    out.push(d);
  });
  try {
    const { page } = s;
    await openThread(s);
    await openCard(s, `${c.project}-${String(c.id)}`, c.title);
    await page.keyboard.press('1');
    const url = await out.wait('bise-desktop: external', (u) => u.includes(c.pageId), 10_000);
    test.info().annotations.push({ type: 'opened', description: url });
    await page.screenshot({ path: test.info().outputPath('review.png') });
    const open = ((await hubState(hubOf(w, 'shop').sock))['cards'] as HubCard[] | undefined) ?? [];
    expect.soft(open.some((x) => x.id === c.id), 'review sends nothing: the card stays open').toBe(true);
  } finally {
    await s.close();
  }
});

test('thread/answer-drafts-real: the TUI\'s /answer with words on a drafts card reaches its asker too (real core)', async () => {
  test.setTimeout(240_000);
  const w = realWorld();
  const n = `t${String(Date.now() % 1_000_000)}`;
  const c = await draftsCard(w, n);
  const t = tui(w, 'shop');
  try {
    await tuiReady(t);
    tuiSay(t, `/answer ${String(c.id)} where are the drafts ${n}`);
    await expect.poll(() => transcriptHas(w, 'shop', 'main', `where are the drafts ${n}`), { timeout: 20_000, message: "the TUI's words on the card reach shop's main" }).toBe(true);
  } finally {
    t.close();
  }
});
