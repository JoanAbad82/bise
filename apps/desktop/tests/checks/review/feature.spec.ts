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
import { hubAgents, hubOf, launchReal, realWorld, tui, tuiReady, tuiSay, type Tui } from '../world';

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
