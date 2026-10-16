// app/bar-more · his ask (main m_26894): « il faudrait que le bouton more affiche les elements 50 par
// 50 ... un bouton qui fait show more et un bouton qui fait show less ». Storefront on FakeCore, 120
// live agents and 370 artifacts (120 of them perf's). Passes when:
//   - ARTIFACTS shows its cap (5) and 'show 50 more · 365 left'; a click adds 50 rows, then the last row holds
//     'show 50 more · 315 left' and 'show less'; again: 105 rows, '· 265 left';
//   - a reload keeps the 105 rows; 'show less' brings back the cap and 'show 50 more · 365 left', a reload keeps that;
//   - the pages are per scope: perf's thread shows its own 120 at the cap ('show 50 more · 115 left'), opened
//     there it never opens storefront's; to its end: only 'show less';
//   - AGENTS (cap 8) pages by 50 the same way; 'all ›' still opens the full list.
// Shots: bar-more-<theme>.png (both rows), -end (only 'show less'). Owner: amb-win.
import { rmSync } from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';
import { FakeCore, launchDesktop, testUserData, test, expect } from '../../harness';
import { panel } from '../../../src/proto/words_panel.gen';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const NOW = Date.now();
const MIN = 60_000;
const AGENTS = Array.from({ length: 120 }, (_, i) => `a${String(i + 1).padStart(3, '0')}`);
const agent = (name: string, status: string, over: Record<string, unknown> = {}) => ({
  name, main: name === 'main', status, archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 14 * MIN, waits: 0, watching: [], ...over,
});
const ARTS = Array.from({ length: 370 }, (_, i) => ({
  id: `art-${String(i + 1)}`,
  kind: 'file',
  title: `artifact ${String(i + 1)}`,
  // perf made one in three, the first 120 of them
  agent: i % 3 === 0 && i < 360 ? 'perf' : AGENTS[i % AGENTS.length],
  version: 1,
  at_ms: NOW - (i + 1) * MIN,
  url: 'http://127.0.0.1:1/p/x',
  new: false,
}));
const world = (theme: string) => [
  {
    ev: 'prefs',
    prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
  },
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'storefront', path: '/nowhere/storefront', git: true, home: false, order: 1, agents: 122, working: 1, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/storefront', name: 'storefront' },
  { ev: 'agents', project: P, agents: [agent('main', 'idle'), agent('perf', 'working'), ...AGENTS.slice(0, 119).map((n) => agent(n, 'idle'))] },
  { ev: 'agents', project: HOME, agents: [agent('main', 'idle')] },
  { ev: 'thread', project: P, agent: 'main', entries: [{ pos: 1, at_ms: NOW - 3 * MIN, kind: 'agent', text: 'storefront works.' }], before: null, more: false },
  { ev: 'thread', project: P, agent: 'perf', entries: [{ pos: 1, at_ms: NOW - 3 * MIN, kind: 'agent', text: 'perf cuts the hero image.' }], before: null, more: false },
  { ev: 'thread', project: HOME, agent: 'main', entries: [{ pos: 1, at_ms: NOW - 3 * MIN, kind: 'agent', text: 'storefront works.' }], before: null, more: false },
  { ev: 'artifacts', project: P, items: ARTS },
];

/** A section's rows (not its last row's 'more' / 'show less'). */
const rowsOf = (page: Page, id: string) => page.locator(`[data-testid="app.right.${id}"] .app-rb-rows > .app-rb-row`);

/** The section shows `n` rows, its 'more' row says `more` ('' none), 'show less' is there or not. */
async function shows(page: Page, id: string, n: number, more: string, less: boolean, what: string): Promise<void> {
  await expect(rowsOf(page, id), `${what}: rows`).toHaveCount(n, { timeout: 10_000 });
  if (more === '') await expect(page.getByTestId(`app.right.${id}.more`), `${what}: no more`).toHaveCount(0);
  else await expect(page.getByTestId(`app.right.${id}.more`), `${what}: more`).toHaveText(more);
  await expect(page.getByTestId(`app.right.${id}.less`), `${what}: show less`).toHaveCount(less ? 1 : 0);
}

for (const theme of ['light', 'dark']) {
  test(`app/bar-more: 'show 50 more' opens 50 at a time, 'show less' back to the cap, kept per scope across a reload (${theme})`, async () => {
    test.setTimeout(120_000);
    const userData = testUserData();
    const core = new FakeCore(world(theme) as unknown as ConstructorParameters<typeof FakeCore>[0]);
    const s = await launchDesktop({ core, route: `project/${P}`, size: '1400x900', userData });
    try {
      const { page } = s;
      await expect(page.getByTestId('app.right.agent.perf')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('app.right.artifacts.head')).toContainText('ARTIFACTS · 370');
      await shows(page, 'artifacts', 5, panel.show_more_left({ n: 50, left: 365 }), false, 'at the cap');
      await page.getByTestId('app.right.artifacts.more').click();
      await shows(page, 'artifacts', 55, panel.show_more_left({ n: 50, left: 315 }), true, 'one page');
      await page.getByTestId('app.right.artifacts.more').click();
      await shows(page, 'artifacts', 105, panel.show_more_left({ n: 50, left: 265 }), true, 'two pages');
      const more = page.getByTestId('app.right.artifacts.more');
      const less = page.getByTestId('app.right.artifacts.less');
      await more.scrollIntoViewIfNeeded();
      const [m, l] = [await more.boundingBox(), await less.boundingBox()];
      expect(Math.round(m?.y ?? 0), "'show less' on the same row").toBe(Math.round(l?.y ?? -1));
      expect((l?.x ?? 0) > (m?.x ?? 0) + (m?.width ?? 0) - 1, "'show less' at its right").toBe(true);
      await less.hover();
      await page.screenshot({ path: test.info().outputPath(`bar-more-${theme}.png`) });

      // a reload keeps the pages
      await page.waitForTimeout(600);
      await page.reload();
      await expect(page.getByTestId('app.right.agent.perf')).toBeVisible({ timeout: 10_000 });
      await shows(page, 'artifacts', 105, panel.show_more_left({ n: 50, left: 265 }), true, 'after a reload');

      // perf's thread: its own 120, at the cap; opened there to its end, only 'show less'
      await page.getByTestId('app.right.agent.perf').click();
      await expect(page.getByTestId('app.right.artifacts.scope')).toBeVisible({ timeout: 10_000 });
      await shows(page, 'artifacts', 5, panel.show_more_left({ n: 50, left: 115 }), false, "perf's, at the cap");
      await page.getByTestId('app.right.artifacts.more').click();
      await shows(page, 'artifacts', 55, panel.show_more_left({ n: 50, left: 65 }), true, "perf's, one page");
      await page.getByTestId('app.right.artifacts.more').click();
      await shows(page, 'artifacts', 105, panel.show_more({ n: 15 }), true, "perf's, two pages");
      await page.getByTestId('app.right.artifacts.more').click();
      await shows(page, 'artifacts', 120, '', true, "perf's, all");
      await page.getByTestId('app.right.artifacts.less').hover();
      await page.screenshot({ path: test.info().outputPath(`bar-more-${theme}-end.png`) });

      // back on storefront's main: its own pages, as he left them; 'show less' to the cap, the head in view
      await page.getByTestId('app.sidebar.project.' + P).click();
      await shows(page, 'artifacts', 105, panel.show_more_left({ n: 50, left: 265 }), true, 'storefront again');
      await page.getByTestId('app.right.artifacts.less').click();
      await shows(page, 'artifacts', 5, panel.show_more_left({ n: 50, left: 365 }), false, 'back to the cap');
      await expect(page.getByTestId('app.right.artifacts.head')).toBeInViewport();

      // AGENTS: the cap 8, then 50 at a time; its numbers read from its own 'show 50 more · N left'
      const first = (await page.getByTestId('app.right.agents.more').textContent()) ?? '';
      const [pre = '', post = ''] = panel.show_more_left({ n: 50, left: '\u0000' }).split('\u0000');
      const left = first.startsWith(pre) && first.endsWith(post) ? Number(first.slice(pre.length, first.length - post.length)) : Number.NaN;
      expect(left, `AGENTS' cap row: ${first}`).toBeGreaterThan(100);
      const capped = await rowsOf(page, 'agents').count();
      await page.getByTestId('app.right.agents.more').click();
      await shows(page, 'agents', capped + 50, panel.show_more_left({ n: 50, left: left - 50 }), true, 'AGENTS, one page');
      await page.getByTestId('app.right.agents.less').click();
      await shows(page, 'agents', capped, first, false, 'AGENTS, show less');

      // a reload after 'show less': at the cap
      await page.waitForTimeout(600);
      await page.reload();
      await expect(page.getByTestId('app.right.agent.perf')).toBeVisible({ timeout: 10_000 });
      await shows(page, 'artifacts', 5, panel.show_more_left({ n: 50, left: 365 }), false, 'after show less and a reload');

      // 'all ›' still opens the full list
      await page.getByTestId('app.right.artifacts.all').click();
      await expect(page.getByTestId(`artifacts.row.${P}.art-370`).or(page.getByText('artifact 370').first())).toBeVisible({ timeout: 10_000 });
    } finally {
      await s.close();
      core.dispose();
      rmSync(path.dirname(userData), { recursive: true, force: true });
    }
  });
}
