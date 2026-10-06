// review/feature · bar A.6 (docs/desktop-bar.md): a branch's agents and changes, its review, and
// a merge only on his click. Owner: qa-flows. The NEW app on the REAL core over the throwaway
// world (../world.ts), the TUI on the same hub as the reference. The world's shop project has
// checkout (done, worktree sb/checkout, one commit: 2 files, +3 -2) and no merge card of its own
// (main's card #1 asks in words). Passes when:
//   - ⌘D from shop opens its changes, which lists checkout's branch, as the TUI's /agents has it
//     ('[worktree sb/checkout]');
//   - the branch opens checkout's review: as many files as the hub counts, and its +/- totals;
//   - nothing merges without his click: shop's main and the hub's checkout are unchanged after
//     the review was open, and the review offers no merge without a merge card.
// Not covered: a feature (`sb feature`) with 2 agents and its try / merge: the world seeds none,
// and the window has no feature view yet (no route, no row).
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { test, expect } from '../../harness';
import { hubAgents, hubOf, hubState, launchReal, realWorld, tui, tuiAgents, tuiInbox, menuKey, tuiReady, tuiSay, worldSay, type Tui } from '../world';

const T = {
  thread: '[data-testid="thread.screen"]',
  changes: '[data-testid="changes.screen"]',
  branch: (a: string) => `[data-testid="changes.branch.${a}"]`,
  review: '[data-testid="review.screen"]',
  files: '[data-testid="review.files"] .rv-file',
  merge: '[data-testid="review.merge"]',
  field: '[data-testid="composer.field"]',
  setupSkip: '[data-testid="setup.skip"]',
};

const flat = (s: string): string => s.replace(/[│╭╮╰╯─┃]/g, ' ').replace(/\s+/g, ' ');
const git = (cwd: string, ...args: string[]): string =>
  execFileSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null' } }).trim();

test("review/feature: ⌘D lists checkout's branch, its review matches the hub, nothing merges without his click", async () => {
  test.setTimeout(150_000);
  const w = realWorld();
  const shop = hubOf(w, 'shop');
  const project = path.basename(path.dirname(shop.sock));
  const head0 = git(shop.ws, 'rev-parse', 'HEAD');
  let t: Tui | undefined;
  const s = await launchReal(w);
  try {
    const { page } = s;
    t = tui(w, 'shop');
    await tuiReady(t);
    tuiSay(t, '/agents');
    await expect.poll(() => flat(t?.screen() ?? ''), { timeout: 5000, message: "the TUI's /agents has checkout's worktree" }).toContain('[worktree sb/checkout]');
    await expect(page.locator(`${T.field}, ${T.setupSkip}`).first()).toBeVisible({ timeout: 10_000 }).catch(() => undefined);
    if (await page.locator(T.setupSkip).isVisible()) await page.locator(T.setupSkip).click();
    await page.locator(`[data-testid="app.sidebar.project.${project}"]`).click();
    await expect(page.locator(T.thread)).toHaveAttribute('data-project', project, { timeout: 10_000 });
    await page.locator('body').click({ position: { x: 5, y: 5 } }).catch(() => undefined);
    await page.keyboard.press('Meta+d');
    try {
      await expect(page.locator(T.changes), "⌘D opens shop's changes").toBeVisible({ timeout: 5000 });
      await expect(page.locator(T.branch('checkout')), "the changes list checkout's branch").toBeVisible({ timeout: 10_000 });
      await expect.soft(page.locator(T.branch('checkout')), "the row names the branch, as the TUI's '[worktree sb/checkout]'").toContainText('sb/checkout');
    } finally {
      await page.screenshot({ path: test.info().outputPath('changes.png') });
    }
    await page.locator(T.branch('checkout')).click();
    await expect(page.locator(T.review), "the branch opens checkout's review").toHaveAttribute('data-agent', 'checkout', { timeout: 5000 });
    const ch = (await hubAgents(w, 'shop')).find((a) => a.name === 'checkout')?.changes;
    expect(ch, "the hub has checkout's changes").toBeTruthy();
    await expect(page.locator(T.files), 'as many files as the hub counts').toHaveCount(ch?.files ?? -1, { timeout: 10_000 });
    const sub = await page.locator(`${T.review} header, ${T.review} .ds-head`).first().innerText().catch(() => '');
    test.info().annotations.push({ type: 'head', description: sub });
    await expect(page.locator(T.review), "the review's totals are the hub's").toContainText(new RegExp(`\\+${String(ch?.add)}\\b[^]*?[-−]${String(ch?.del)}\\b`));
    await page.screenshot({ path: test.info().outputPath('review.png') });
    // nothing merges without his click
    await expect(page.locator(T.merge), 'no merge offered without a merge card').toHaveCount(0);
    await page.waitForTimeout(3000);
    expect(git(shop.ws, 'rev-parse', 'HEAD'), "shop's main didn't move").toBe(head0);
    expect((await hubAgents(w, 'shop')).find((a) => a.name === 'checkout')?.branch, 'checkout keeps its branch').toBe('sb/checkout');
  } finally {
    if (t) {
      test.info().attachments.push({ name: 'tui', contentType: 'text/plain', body: Buffer.from(t.screen()) });
      t.close();
    }
    await s.close();
  }
});

// The feature itself (amb-tools 7d361b6e): shop's gift-cards with gift-api and gift-ui, 2 commits on
// its branch. The agents' side asks for a try ('sb feature ready gift-cards' through the fake main),
// which opens his feature_try card; answering it 1 (try) opens feature_merge. Passes when:
//   - the window shows the feature with its 2 agents, as the TUI's panel does ('ψ gift-cards');
//   - the try card shows in the window's inbox (⌘I), and in the TUI's;
//   - nothing merges until his click: shop's main is unchanged before; he tries, then merges, by
//     his own keys in the window, and only then shop's main has both feature commits.
test('review/feature: a feature with 2 agents shows, is tried and merged only on his click, as in the TUI', async () => {
  test.setTimeout(240_000);
  const w = realWorld();
  const shop = hubOf(w, 'shop');
  const project = path.basename(path.dirname(shop.sock));
  const head0 = git(shop.ws, 'rev-parse', 'HEAD');
  const cards = async () => ((await hubState(shop.sock))['cards'] as { id: number; kind: string; place: string | null }[] | undefined) ?? [];
  const mainHas = (subject: string): boolean => git(shop.ws, 'log', '--format=%s', 'HEAD').split('\n').includes(subject);
  let t: Tui | undefined;
  const s = await launchReal(w);
  try {
    const { page } = s;
    t = tui(w, 'shop');
    await tuiReady(t);
    expect(flat(t.screen()), "the TUI's panel has the feature").toContain('ψ gift-cards');
    expect(tuiAgents(t.screen()).map((a) => a.name), "the TUI's panel has its 2 agents").toEqual(expect.arrayContaining(['gift-api', 'gift-ui']));
    await expect(page.locator(`${T.field}, ${T.setupSkip}`).first()).toBeVisible({ timeout: 10_000 }).catch(() => undefined);
    if (await page.locator(T.setupSkip).isVisible()) await page.locator(T.setupSkip).click();
    await page.locator(`[data-testid="app.sidebar.project.${project}"]`).click();
    await expect(page.locator(T.thread)).toHaveAttribute('data-project', project, { timeout: 10_000 });
    try {
      // in the sidebar, where its agents are (the words also come in the thread's reports: not a feature view)
      await expect.soft(page.locator('[data-testid="app.sidebar"]').getByText('gift-cards').first(), "the window's sidebar shows the feature gift-cards with its agents, as the TUI's 'ψ gift-cards'").toBeVisible({ timeout: 5000 });
    } finally {
      await page.screenshot({ path: test.info().outputPath('feature.png') });
    }
    // the agents' side: the feature is ready, his try card opens
    worldSay('shop', '[[bash: sb feature ready gift-cards]]');
    await expect.poll(async () => (await cards()).find((c) => c.kind === 'feature_try')?.id, { timeout: 60_000, message: 'the hub has the try card' }).toBeDefined();
    const tryId = (await cards()).find((c) => c.kind === 'feature_try')?.id ?? -1;
    expect(git(shop.ws, 'rev-parse', 'HEAD'), "shop's main didn't move before his click").toBe(head0);
    await expect.poll(() => tuiInbox(t?.screen() ?? '').length, { timeout: 10_000, message: "the TUI's inbox has the try card" }).toBeGreaterThanOrEqual(3);
    expect(await menuKey(s, 'CmdOrCtrl+I'), 'the app menu has an item on ⌘I').not.toBe('');
    const item = page.locator(`[data-testid="inbox.item.${project}-${String(tryId)}"]`);
    try {
      await expect(item, "the window's inbox has the try card").toBeVisible({ timeout: 10_000 });
    } finally {
      await page.screenshot({ path: test.info().outputPath('try-card.png') });
    }
    await item.click();
    await page.locator(`[data-testid="inbox.card.${project}-${String(tryId)}.opt.1"]`).click();
    await expect.poll(async () => (await cards()).some((c) => c.id === tryId), { timeout: 15_000, message: 'his try answers the card' }).toBe(false);
    await expect.poll(async () => (await cards()).find((c) => c.kind === 'feature_merge')?.id, { timeout: 60_000, message: 'the hub opens the merge card after the try' }).toBeDefined();
    expect(mainHas('gift cards: the balance label'), 'trying is not merging').toBe(false);
    const mergeId = (await cards()).find((c) => c.kind === 'feature_merge')?.id ?? -1;
    const mitem = page.locator(`[data-testid="inbox.item.${project}-${String(mergeId)}"]`);
    await expect(mitem, "the window's inbox has the merge card").toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: test.info().outputPath('merge-card.png') });
    await mitem.click();
    await page.locator(`[data-testid="inbox.card.${project}-${String(mergeId)}.opt.1"]`).click();
    await expect.poll(() => mainHas('gift cards: the balance label') && mainHas('gift cards: balance(code) for the cart and checkout'), { timeout: 60_000, message: "after his merge, shop's main has both feature commits" }).toBe(true);
    await page.screenshot({ path: test.info().outputPath('merged.png') });
  } finally {
    if (t) {
      test.info().attachments.push({ name: 'tui', contentType: 'text/plain', body: Buffer.from(t.screen()) });
      t.close();
    }
    await s.close();
  }
});
