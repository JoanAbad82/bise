// app/archived-fold · his ask (main m_23467): « la section Archived soit complètement collapsed par
// défaut ». Storefront on FakeCore, 7 archived agents (over the cap of 5). Passes when:
//   - on a fresh userData, ARCHIVED is its head only ('ARCHIVED · 7', '▸', the summary): no rows, no
//     '+ N more', in the project and on bise's thread;
//   - a click opens it, a reload keeps it open; a click folds it, a relaunch on the same userData
//     keeps it folded; the other sections stay open.
// Shots: archived-fold-<theme>.png (folded, the designer's sign). Owner: amb-win.
import { rmSync } from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';
import { FakeCore, launchDesktop, testUserData, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const NOW = Date.now();
const MIN = 60_000;
const OLD = ['hero-img', 'old-search', 'cart-fix', 'fonts', 'seo-pass', 'a11y', 'emails'];
const agent = (name: string, status: string, over: Record<string, unknown> = {}) => ({
  name, main: name === 'main', status, archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 14 * MIN, waits: 0, watching: [], ...over,
});
const world = (theme: string) => [
  {
    ev: 'prefs',
    prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
  },
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'storefront', path: '/nowhere/storefront', git: true, home: false, order: 1, agents: 3 + OLD.length, working: 1, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/storefront', name: 'storefront' },
  {
    ev: 'agents',
    project: P,
    agents: [
      agent('main', 'idle'),
      agent('perf', 'working'),
      agent('checkout', 'idle'),
      ...OLD.map((n, i) => agent(n, i % 2 === 0 ? 'done' : 'idle', { archived: true, since_ms: NOW - (i + 2) * 60 * MIN })),
    ],
  },
  { ev: 'agents', project: HOME, agents: [agent('main', 'idle')] },
  { ev: 'thread', project: P, agent: 'main', entries: [{ pos: 1, at_ms: NOW - 3 * MIN, kind: 'agent', text: 'perf cuts the hero image.' }], before: null, more: false },
  { ev: 'thread', project: HOME, agent: 'main', entries: [{ pos: 1, at_ms: NOW - 3 * MIN, kind: 'agent', text: 'storefront works.' }], before: null, more: false },
];

/** ARCHIVED shut: its head and summary, no row and no '+ N more'; AGENTS still open. */
async function folded(page: Page, what: string): Promise<void> {
  await expect(page.getByTestId('app.right.archived.head'), what).toHaveAttribute('aria-expanded', 'false', { timeout: 10_000 });
  await expect(page.getByTestId('app.right.archived.head'), what).toContainText(`ARCHIVED · ${String(OLD.length)}`);
  await expect(page.getByTestId('app.right.archived.summary'), what).toHaveText('✓ hero-img');
  await expect(page.locator('[data-testid="app.right.archived"] .app-rb-row'), `${what}: no row`).toHaveCount(0);
  await expect(page.getByTestId('app.right.archived.more'), `${what}: no '+ N more'`).toHaveCount(0);
  await expect(page.getByTestId('app.right.agents.head'), `${what}: AGENTS open`).toHaveAttribute('aria-expanded', 'true');
}

async function opened(page: Page, what: string): Promise<void> {
  await expect(page.getByTestId('app.right.archived.head'), what).toHaveAttribute('aria-expanded', 'true', { timeout: 10_000 });
  await expect(page.getByTestId('app.right.archived.hero-img'), what).toBeVisible();
  await expect(page.getByTestId('app.right.archived.more'), `${what}: the cap`).toHaveText('+ 2 more');
}

for (const theme of ['light', 'dark']) {
  test(`app/archived-fold: ARCHIVED starts folded, his choice kept across a reload and a relaunch (${theme})`, async () => {
    test.setTimeout(120_000);
    const userData = testUserData();
    const core = new FakeCore(world(theme) as unknown as ConstructorParameters<typeof FakeCore>[0]);
    const s = await launchDesktop({ core, route: `project/${P}`, size: '1400x900', userData });
    try {
      const { page } = s;
      await expect(page.getByTestId('app.right.agent.perf')).toBeVisible({ timeout: 10_000 });
      await folded(page, 'a fresh profile');
      await page.mouse.move(1, 400);
      await page.screenshot({ path: test.info().outputPath(`archived-fold-${theme}.png`) });
      // bise's thread: folded too
      await page.getByTestId('app.sidebar.bise').click();
      await expect(page.getByTestId(`app.right.agent.${P}.perf`)).toBeVisible({ timeout: 10_000 });
      await folded(page, "bise's thread");
      await page.mouse.move(1, 400);
      await page.screenshot({ path: test.info().outputPath(`archived-fold-${theme}-bise.png`) });
      // a click opens it; a reload keeps it open
      await page.getByTestId('app.right.archived.head').click();
      await expect(page.getByTestId(`app.right.archived.${P}.hero-img`)).toBeVisible();
      await page.waitForTimeout(600);
      await page.reload();
      await expect(page.getByTestId('app.right.archived.head')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('app.right.archived.head'), 'open after a reload').toHaveAttribute('aria-expanded', 'true');
      // the keyboard folds it (Space on the head), then a quit
      await page.getByTestId('app.right.archived.head').focus();
      await page.keyboard.press('Space');
      await expect(page.getByTestId('app.right.archived.head')).toHaveAttribute('aria-expanded', 'false');
      await page.waitForTimeout(600);
      const gone = new Promise<void>((r) => s.app.process().once('exit', () => { r(); }));
      await s.app.evaluate(({ app }) => { app.quit(); }).catch(() => undefined);
      await Promise.race([gone, new Promise<void>((r) => setTimeout(r, 10_000))]);
    } finally {
      await s.close();
      core.dispose();
    }

    // a relaunch on the same userData: folded, as he left it; open it, relaunch: open
    const core2 = new FakeCore(world(theme) as unknown as ConstructorParameters<typeof FakeCore>[0]);
    const s2 = await launchDesktop({ core: core2, route: `project/${P}`, size: '1400x900', userData });
    try {
      const { page } = s2;
      await expect(page.getByTestId('app.right.agent.perf')).toBeVisible({ timeout: 10_000 });
      await folded(page, 'after a relaunch');
      await page.getByTestId('app.right.archived.head').click();
      await opened(page, 'opened again');
    } finally {
      await s2.close();
      core2.dispose();
      rmSync(path.dirname(userData), { recursive: true, force: true });
    }
  });
}
