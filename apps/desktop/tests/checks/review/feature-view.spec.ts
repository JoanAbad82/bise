// review/feature-view · bar A.6, the feature view (amb-win, lead m_10271; amb-feed 5f436473's typed
// features). The NEW app on the REAL core over the throwaway world (../world.ts): shop has the
// feature gift-cards (amb-tools 7d361b6e) with gift-api and gift-ui, 2 commits on its branch.
// Passes when:
//   - shop's sidebar has the feature's group as the TUI's panel: 'ψ gift-cards', its agents under it;
//   - the group opens the feature: its branch, its base, as many commits ahead as git counts, its
//     agents (each opens its thread);
//   - the changes screen lists it too, and opens the same view.
// Not covered here: try / merge / drop through its card (the seed opens no try card; the screen's
// answers and the drop's second ask are unit-tested in src/review/feature.test.tsx).
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { test, expect } from '../../harness';
import { hubOf, launchReal, realWorld } from '../world';

const T = {
  thread: '[data-testid="thread.screen"]',
  field: '[data-testid="composer.field"]',
  setupSkip: '[data-testid="setup.skip"]',
  group: '[data-testid="app.sidebar.feature.gift-cards"]',
  agent: (a: string) => `[data-testid="app.sidebar.agent.${a}"]`,
  screen: '[data-testid="feature.screen"]',
  changes: '[data-testid="changes.screen"]',
};

const git = (cwd: string, ...args: string[]): string =>
  execFileSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null' } }).trim();

test("review/feature-view: shop's gift-cards in the sidebar as the TUI groups it, its view matches git", async () => {
  test.setTimeout(120_000);
  const w = realWorld();
  const shop = hubOf(w, 'shop');
  const project = path.basename(path.dirname(shop.sock));
  const ahead = Number(git(shop.ws, 'rev-list', '--count', 'main..gift-cards'));
  expect(ahead, 'the world seeds commits on gift-cards').toBeGreaterThan(0);
  const s = await launchReal(w);
  try {
    const { page } = s;
    await expect(page.locator(`${T.field}, ${T.setupSkip}`).first()).toBeVisible({ timeout: 15_000 });
    if (await page.locator(T.setupSkip).isVisible()) await page.locator(T.setupSkip).click();
    await page.locator(`[data-testid="app.sidebar.project.${project}"]`).click();
    await expect(page.locator(T.thread)).toHaveAttribute('data-project', project, { timeout: 10_000 });

    // the group, then its agents right under it, as the TUI's 'ψ gift-cards'
    await expect(page.locator(T.group), "shop's sidebar has the feature's group").toBeVisible({ timeout: 15_000 });
    await expect(page.locator(T.group)).toContainText('ψ gift-cards');
    const order = await page.locator('[data-testid^="app.sidebar.agent."], [data-testid^="app.sidebar.feature."]').evaluateAll((els) =>
      els.map((e) => (e.getAttribute('data-testid') ?? '').replace(/^app\.sidebar\.(agent|feature)\./, '')),
    );
    const at = order.indexOf('gift-cards');
    expect(order.slice(at + 1, at + 3).sort(), `its agents come under it (${order.join(', ')})`).toEqual(['gift-api', 'gift-ui']);
    await page.screenshot({ path: test.info().outputPath('sidebar.png') });

    await page.locator(T.group).click();
    const view = page.locator(T.screen);
    await expect(view, 'the group opens the feature').toHaveAttribute('data-feature', 'gift-cards', { timeout: 5000 });
    await expect(view, 'its branch and base, and how far as git counts').toContainText(`gift-cards → main · ${String(ahead)} ahead`, { timeout: 10_000 });
    await expect(page.locator('[data-testid="feature.agent.gift-api"]')).toBeVisible();
    await expect(page.locator('[data-testid="feature.agent.gift-ui"]')).toBeVisible();
    await page.screenshot({ path: test.info().outputPath('feature.png') });
    await page.locator('[data-testid="feature.agent.gift-ui"]').click();
    await expect(page.locator(T.thread), 'an agent opens its thread').toHaveAttribute('data-agent', 'gift-ui', { timeout: 5000 });

    await page.locator('body').click({ position: { x: 5, y: 5 } }).catch(() => undefined);
    await page.keyboard.press('Meta+d');
    // ⌘D from an agent opens its review; the project's changes come from its main
    await page.locator(`[data-testid="app.sidebar.project.${project}"]`).click();
    await page.locator('body').click({ position: { x: 5, y: 5 } }).catch(() => undefined);
    await page.keyboard.press('Meta+d');
    await expect(page.locator(T.changes), "⌘D opens shop's changes").toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="changes.feature.gift-cards"]'), 'the changes list the feature').toBeVisible({ timeout: 10_000 });
    await page.locator('[data-testid="changes.feature.gift-cards"]').click();
    await expect(page.locator(T.screen), 'and open the same view').toHaveAttribute('data-feature', 'gift-cards', { timeout: 5000 });
  } finally {
    await s.close();
  }
});
