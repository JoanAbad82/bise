// review/feature-drop · bar A.6, a feature's drop from the FEATURE VIEW (amb-win efe231a3), on a
// fresh world of its own (tests/checks/real.sh runs it after the others, on a new world: the merge
// in review/feature.spec.ts uses the same feature). Owner: qa-flows. The NEW app on the REAL core,
// the TUI on the same hub as the reference. shop's gift-cards (amb-tools 7d361b6e): the agents'
// side asks for a try ('sb feature ready gift-cards' through the fake main), he tries it from the
// view, which opens the merge card (1 merge / 2 keep working / 3 drop the branch). Passes when:
//   - 'drop the branch' asks once more, in place, as the TUI's drop_ask: 'drop gift-cards? <N>
//     commits go.' with N = git's main..gift-cards count; nothing is sent to the hub yet;
//   - 'keep it' goes back to the card's answers, and the card is still open in the hub;
//   - 'drop it' answers the card: the gift-cards branch is gone from git, the feature leaves the
//     window's sidebar and the TUI's panel ('ψ gift-cards'), and shop's main didn't move.
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { test, expect } from '../../harness';
import { hubOf, hubState, launchReal, realWorld, tui, tuiReady, worldSay, type Tui } from '../world';

const T = {
  thread: '[data-testid="thread.screen"]',
  field: '[data-testid="composer.field"]',
  setupSkip: '[data-testid="setup.skip"]',
  group: '[data-testid="app.sidebar.feature.gift-cards"]',
  screen: '[data-testid="feature.screen"]',
  card: (id: number) => `[data-testid="feature.card.${String(id)}"]`,
  opt: (n: number) => `[data-testid="feature.opt.${String(n)}"]`,
  drop: '[data-testid="feature.drop"]',
  keep: '[data-testid="feature.keep"]',
  yes: '[data-testid="feature.drop.yes"]',
};

const flat = (s: string): string => s.replace(/[│╭╮╰╯─┃]/g, ' ').replace(/\s+/g, ' ');
const git = (cwd: string, ...args: string[]): string =>
  execFileSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null' } }).trim();

test('review/feature-drop: drop from the feature view asks once more, keep it goes back, drop it removes the feature, as in the TUI', async () => {
  test.setTimeout(240_000);
  const w = realWorld();
  const shop = hubOf(w, 'shop');
  const project = path.basename(path.dirname(shop.sock));
  const head0 = git(shop.ws, 'rev-parse', 'HEAD');
  const ahead = Number(git(shop.ws, 'rev-list', '--count', 'main..gift-cards'));
  expect(ahead, 'a fresh world: gift-cards has its commits, not merged').toBeGreaterThan(0);
  const cards = async () => ((await hubState(shop.sock))['cards'] as { id: number; kind: string }[] | undefined) ?? [];
  let t: Tui | undefined;
  const s = await launchReal(w);
  try {
    const { page } = s;
    t = tui(w, 'shop');
    await tuiReady(t);
    expect(flat(t.screen()), "the TUI's panel has the feature").toContain('ψ gift-cards');
    await expect(page.locator(`${T.field}, ${T.setupSkip}`).first()).toBeVisible({ timeout: 10_000 }).catch(() => undefined);
    if (await page.locator(T.setupSkip).isVisible()) await page.locator(T.setupSkip).click();
    await page.locator(`[data-testid="app.sidebar.project.${project}"]`).click();
    await expect(page.locator(T.thread)).toHaveAttribute('data-project', project, { timeout: 10_000 });
    await page.locator(T.group).click();
    await expect(page.locator(T.screen), "the sidebar's 'ψ gift-cards' opens the feature view").toHaveAttribute('data-feature', 'gift-cards', { timeout: 5000 });
    // the try card, tried from the view: the merge card (with the drop) comes after it
    worldSay('shop', '[[bash: sb feature ready gift-cards]]');
    await expect.poll(async () => (await cards()).find((c) => c.kind === 'feature_try')?.id, { timeout: 60_000, message: 'the hub has the try card' }).toBeDefined();
    const tryId = (await cards()).find((c) => c.kind === 'feature_try')?.id ?? -1;
    await page.locator(T.card(tryId)).locator(T.opt(1)).click({ timeout: 10_000 });
    await expect.poll(async () => (await cards()).find((c) => c.kind === 'feature_merge')?.id, { timeout: 60_000, message: 'the hub opens the merge card after the try' }).toBeDefined();
    const mergeId = (await cards()).find((c) => c.kind === 'feature_merge')?.id ?? -1;
    const card = page.locator(T.card(mergeId));
    await expect(card, 'the view shows the merge card').toHaveAttribute('data-kind', 'feature_merge', { timeout: 10_000 });
    // drop: asks once more, in place
    await card.locator(T.drop).click();
    const ask = `drop gift-cards? ${String(ahead)} commit${ahead === 1 ? '' : 's'} go.`;
    try {
      await expect(page.locator(T.screen), 'the drop asks once more, as the TUI does').toContainText(ask, { timeout: 3000 });
      await expect(page.locator(T.yes)).toBeVisible();
      await expect(page.locator(T.keep)).toBeVisible();
    } finally {
      await page.screenshot({ path: test.info().outputPath('drop-ask.png') });
    }
    await page.waitForTimeout(1000);
    expect((await cards()).some((c) => c.id === mergeId), 'the ask sent nothing: the card is still open').toBe(true);
    // keep it: back to the card's answers
    await page.locator(T.keep).click();
    await expect(card.locator(T.opt(1)), "'keep it' goes back to the card's answers").toBeVisible({ timeout: 3000 });
    await expect(page.locator(T.yes)).toHaveCount(0);
    await page.waitForTimeout(1000);
    expect((await cards()).some((c) => c.id === mergeId), "'keep it' sent nothing: the card is still open").toBe(true);
    expect(git(shop.ws, 'branch', '--list', 'gift-cards'), 'the branch is still there').not.toBe('');
    await page.screenshot({ path: test.info().outputPath('kept.png') });
    // drop it: the card is answered, the branch and the feature go
    await card.locator(T.drop).click();
    await page.locator(T.yes).click();
    await expect.poll(async () => (await cards()).some((c) => c.id === mergeId), { timeout: 15_000, message: "'drop it' answers the card" }).toBe(false);
    await expect.poll(() => git(shop.ws, 'branch', '--list', 'gift-cards'), { timeout: 60_000, message: 'the gift-cards branch is gone from git' }).toBe('');
    await expect(page.locator(T.group), "the feature leaves the window's sidebar").toHaveCount(0, { timeout: 10_000 });
    await expect.poll(() => flat(t?.screen() ?? ''), { timeout: 10_000, message: "the feature leaves the TUI's panel" }).not.toContain('ψ gift-cards');
    expect(git(shop.ws, 'rev-parse', 'HEAD'), "shop's main didn't move").toBe(head0);
    await page.screenshot({ path: test.info().outputPath('dropped.png') });
  } finally {
    if (t) {
      test.info().attachments.push({ name: 'tui', contentType: 'text/plain', body: Buffer.from(t.screen()) });
      t.close();
    }
    await s.close();
  }
});
