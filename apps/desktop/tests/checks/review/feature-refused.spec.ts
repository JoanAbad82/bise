// review/feature-refused · a try that does not go through says why on its card (his #566 for bims,
// 2026-10: 'try it' from the window did nothing he could see: the rebase conflicted, the hub told
// only main's feed). On a fresh world of its own (tests/checks/real.sh: it moves shop's main).
// Owner: try-card. The NEW app on the REAL core, the TUI on the same hub. Passes when:
//   - shop's main changes a file gift-cards changes too, then 'sb feature ready gift-cards' opens
//     the try card; his 'try it' click in the feature view answers it;
//   - the hub closes that card and opens a new try card (a new number) whose text says
//     "try didn't go through: … conflicts"; the window's feature view and the TUI's inbox show it;
//   - with main's conflicting commit gone, his '1' on the new card from the TUI starts the try:
//     the TUI says 'gift-cards is built to try' and the merge card opens.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '../../harness';
import { hubOf, hubState, launchReal, menuKey, realWorld, tui, tuiInbox, tuiReady, tuiSay, worldSay, type Tui } from '../world';

const T = {
  thread: '[data-testid="thread.screen"]',
  field: '[data-testid="composer.field"]',
  setupSkip: '[data-testid="setup.skip"]',
  item: (project: string, id: number) => `[data-testid="inbox.block.card.${project}-${String(id)}"]`,
  itemOpt: (project: string, id: number, n: number) => `[data-testid="inbox.block.card.${project}-${String(id)}.opt.${String(n)}"]`,
};

const flat = (s: string): string => s.replace(/[│╭╮╰╯─┃]/g, ' ').replace(/\s+/g, ' ');
const git = (cwd: string, ...args: string[]): string =>
  execFileSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null' } }).trim();

test("review/feature-refused: a try that conflicts says why on a new card, both apps show it, the TUI's 1 then tries it", async () => {
  test.setTimeout(240_000);
  const w = realWorld();
  const shop = hubOf(w, 'shop');
  const project = path.basename(path.dirname(shop.sock));
  const head0 = git(shop.ws, 'rev-parse', 'HEAD');
  type C = { id: number; kind: string; text?: string };
  const cards = async (): Promise<C[]> => ((await hubState(shop.sock))['cards'] as C[] | undefined) ?? [];
  // main changes every line of a file gift-cards changes: its rebase conflicts
  const file = git(shop.ws, 'diff', '--name-only', 'main...gift-cards').split('\n')[0] ?? '';
  expect(file, 'gift-cards changes a file').not.toBe('');
  fs.mkdirSync(path.dirname(path.join(shop.ws, file)), { recursive: true });
  fs.writeFileSync(path.join(shop.ws, file), 'main rewrote this file\n');
  git(shop.ws, 'add', file);
  git(shop.ws, '-c', 'user.name=qa', '-c', 'user.email=qa@example.com', 'commit', '-qm', 'main: a change that conflicts');
  let t: Tui | undefined;
  const s = await launchReal(w);
  try {
    const { page } = s;
    t = tui(w, 'shop');
    await tuiReady(t);
    await expect(page.locator(`${T.field}, ${T.setupSkip}`).first()).toBeVisible({ timeout: 10_000 }).catch(() => undefined);
    if (await page.locator(T.setupSkip).isVisible()) await page.locator(T.setupSkip).click();
    await page.locator(`[data-testid="app.sidebar.project.${project}"]`).click();
    await expect(page.locator(T.thread)).toHaveAttribute('data-project', project, { timeout: 10_000 });
    worldSay('shop', '[[bash: sb feature ready gift-cards]]');
    await expect.poll(async () => (await cards()).find((c) => c.kind === 'feature_try')?.id, { timeout: 60_000, message: 'the hub has the try card' }).toBeDefined();
    const tryId = (await cards()).find((c) => c.kind === 'feature_try')?.id ?? -1;
    // his 'try it' from the window's inbox (⌘I, ↓ to the try card), where he answered #566
    const item = (id: number) => page.locator(T.item(project, id));
    const walkTo = async (id: number): Promise<void> => {
      await menuKey(s, 'CmdOrCtrl+I');
      await expect(page.locator('[data-testid^="inbox.block.open."]')).toBeVisible({ timeout: 10_000 });
      for (let i = 0; i < 8 && !(await item(id).isVisible()); i++) {
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(250);
      }
    };
    await walkTo(tryId);
    await expect(item(tryId), "the window's inbox has the try card").toBeVisible({ timeout: 10_000 });
    await item(tryId).locator(T.itemOpt(project, tryId, 1)).click({ timeout: 10_000 });
    await expect
      .poll(async () => (await cards()).find((c) => c.kind === 'feature_try' && c.id !== tryId)?.id, { timeout: 60_000, message: 'the hub opens the try card again, a new number' })
      .toBeDefined();
    const again = (await cards()).find((c) => c.kind === 'feature_try' && c.id !== tryId);
    expect((await cards()).some((c) => c.id === tryId), 'the old card closed').toBe(false);
    expect(again?.text ?? '', 'the new card says why').toMatch(/try didn't go through: .*conflicts/);
    const id = again?.id ?? -1;
    try {
      await page.keyboard.press('Escape');
      await walkTo(id);
      await expect(item(id), "the window's inbox shows the new card with why").toContainText("didn't go through", { timeout: 10_000 });
    } finally {
      await page.screenshot({ path: test.info().outputPath('refused.png') });
    }
    expect(git(shop.ws, 'rev-parse', 'gift-cards') !== git(shop.ws, 'rev-parse', 'HEAD'), 'nothing merged').toBe(true);
    await expect.poll(() => tuiInbox(t?.screen() ?? '').some((r) => r.agent === 'main' && /gift-cards/.test(r.text)), { timeout: 10_000, message: "the TUI's inbox has the new card" }).toBe(true);
    // main's conflicting commit goes: the TUI's 1 on the new card tries it
    git(shop.ws, 'reset', '-q', '--hard', head0);
    tuiSay(t, `/answer ${String(id)} 1`);
    await expect.poll(() => flat(t?.screen() ?? ''), { timeout: 60_000, message: "the TUI's answer starts the try" }).toMatch(/gift-cards is built to try/);
    await expect.poll(async () => (await cards()).some((c) => c.kind === 'feature_merge'), { timeout: 30_000, message: 'the merge card opens after the try' }).toBe(true);
    await page.screenshot({ path: test.info().outputPath('tried.png') });
  } finally {
    if (t) {
      test.info().attachments.push({ name: 'tui', contentType: 'text/plain', body: Buffer.from(t.screen()) });
      t.close();
    }
    await s.close();
  }
});
