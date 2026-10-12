// app/artifact-view · designer's artifact-open page (ambient-lead m_20087 commit 3/3, task-panel's
// ArtifactOpen 6fa7cfaf): an artifact opens in the window as three columns. Storefront on FakeCore,
// perf made 'product page, before / after'. Passes when:
//   - at 1400 a click on its ARTIFACTS row in the right bar opens it: the right column widens to 55%
//     of the window (770 px), the centre is perf's thread with its artifact row marked 'open', the
//     one composer is perf's ('to perf · about “…”'), main's inbox block is not on the screen;
//   - the handle drags the column (kept between 50% and 70%, the thread 380 px at least), a
//     double-click resets it to 55%;
//   - ✕ goes back to where he was, the right bar as it was;
//   - at 1100 the left bar folds and the thread keeps 380 px at least;
//   - at 800 the artifact takes the width with perf's composer under it, '◧ perf' slides perf's
//     thread over it from the left, esc closes that.
// Shots: artifact-<theme>-1400/1100/800/800-thread. Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import type { Page } from '@playwright/test';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const NOW = Date.now();
const MIN = 60_000;
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const agent = (name: string, status: string) => ({ name, main: name === 'main', status, archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 14 * MIN, waits: 0, watching: [] });
const world = (theme: string) => [
  prefs(theme),
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'storefront', path: '/nowhere/storefront', git: true, home: false, order: 1, agents: 3, working: 1, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/storefront', name: 'storefront' },
  { ev: 'agents', project: P, agents: [agent('main', 'idle'), agent('perf', 'idle'), agent('search', 'working')] },
  { ev: 'agents', project: HOME, agents: [agent('main', 'idle')] },
  { ev: 'thread', project: P, agent: 'main', entries: [{ pos: 1, at_ms: NOW - 3 * MIN, kind: 'agent', text: 'perf made the product page for you.' }], before: null, more: false },
  {
    ev: 'thread',
    project: P,
    agent: 'perf',
    entries: [
      { pos: 1, at_ms: NOW - 6 * MIN, kind: 'you', text: 'make me a before / after page of the product page' },
      { pos: 2, at_ms: NOW - 5 * MIN, kind: 'agent', text: 'Done: the hero image went from 2.4 MB to 180 KB.' },
      { pos: 3, at_ms: NOW - 5 * MIN, kind: 'artifact', text: 'product page, before / after', made: { id: 'product-page', agent: 'perf', title: 'product page, before / after', kind: 'page', kind_word: 'page', v: 1 } },
    ],
    before: null,
    more: false,
  },
  {
    ev: 'artifacts',
    project: P,
    items: [{ id: 'product-page', kind: 'page', title: 'product page, before / after', agent: 'perf', version: 1, at_ms: NOW - 5 * MIN, url: 'http://127.0.0.1:1/p/x', new: true }],
  },
];

const widthOf = async (page: Page, sel: string) => Math.round((await page.locator(sel).first().boundingBox())?.width ?? 0);
// a finished animation, or one cancelled on the way (its promise rejects with AbortError)
const settle = (page: Page) => page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished.catch(() => undefined))).then(() => undefined));

for (const theme of ['light', 'dark']) {
  test(`app/artifact-view: the maker's thread and the artifact on 55%, one composer, ✕ back; 1100 folds the left bar; 800 the artifact alone with '◧ perf' (${theme})`, async () => {
    const core = new FakeCore(world(theme) as unknown as ConstructorParameters<typeof FakeCore>[0]);
    const s = await launchDesktop({ core, route: `project/${P}`, size: '1400x900' });
    try {
      const { page } = s;
      // the window's own size is the harness's 1100: pin the page at 1400
      await page.setViewportSize({ width: 1400, height: 900 });
      const row = page.getByTestId(`app.right.artifact.${P}.product-page`);
      await expect(row).toBeVisible({ timeout: 10_000 });
      await row.click();
      // three columns: the artifact widens the right column to 55% (770 px of 1400)
      const art = page.getByTestId('app.art');
      await expect(art).toBeVisible({ timeout: 5000 });
      await expect(page.getByTestId('artifact.title')).toHaveText('product page, before / after');
      expect(await widthOf(page, '[data-testid="app.art"]'), 'the artifact on 55%').toBe(770);
      await expect(page.getByTestId('app.panel'), 'the right bar gives its column to the artifact').toHaveCount(0);
      // the centre: perf's thread, its artifact row marked 'open', the one composer is perf's, about it
      await expect(page.getByTestId('thread.screen')).toHaveAttribute('data-agent', 'perf');
      await expect(page.getByTestId('thread.artifact.3')).toHaveAttribute('data-open', 'true');
      await expect(page.locator('.th-screen .b-composer .div .lbl')).toContainText('about');
      await expect(page.locator('[data-testid="composer.field"]'), 'one composer on the screen').toHaveCount(1);
      await expect(page.getByTestId('inbox.block'), "main's inbox is not on this screen").toHaveCount(0);
      await page.mouse.move(1, 400);
      await settle(page);
      await page.screenshot({ path: test.info().outputPath(`artifact-${theme}-1400.png`) });
      // the handle: drag it wider, never past 70%; a double-click back to 55%
      const handle = page.getByTestId('app.split.art');
      const hb = (await handle.boundingBox()) ?? { x: 0, y: 0, width: 0, height: 0 };
      await page.mouse.move(hb.x + hb.width / 2, hb.y + 300);
      await page.mouse.down();
      await page.mouse.move(hb.x + hb.width / 2 - 400, hb.y + 300, { steps: 8 });
      await page.mouse.up();
      // 70% would be 980: the thread's 380 beside the left bar stops it at 780
      expect(await widthOf(page, '[data-testid="app.art"]'), 'never over the thread').toBe(780);
      await handle.dblclick();
      expect(await widthOf(page, '[data-testid="app.art"]'), 'reset to 55%').toBe(770);
      // ✕: back where he was, the right bar as it was
      await page.getByTestId('artifact.close').click();
      await expect(art).toHaveCount(0);
      await expect(page.getByTestId('app.panel')).toBeVisible();
      await expect(page.getByTestId('thread.screen')).toHaveAttribute('data-agent', 'main');

      // 1100: the left bar folds, the thread keeps 400 px at least
      await page.setViewportSize({ width: 1100, height: 900 });
      await row.click();
      await expect(art).toBeVisible({ timeout: 5000 });
      await expect(page.getByTestId('app.sidebar'), 'the left bar folds under 1200').toHaveCount(0);
      expect(await widthOf(page, '.th-screen'), 'the thread keeps 380 px').toBeGreaterThanOrEqual(380);
      await page.mouse.move(1, 400);
      await settle(page);
      await page.screenshot({ path: test.info().outputPath(`artifact-${theme}-1100.png`) });

      // 800: the artifact alone, perf's composer under it; '◧ perf' slides the thread over
      await page.setViewportSize({ width: 800, height: 900 });
      await expect(page.getByTestId('app.art.maker')).toContainText('◧ perf');
      await expect(page.locator('[data-testid="composer.field"]'), "perf's composer under the page").toHaveCount(1);
      await page.mouse.move(1, 400);
      await settle(page);
      await page.screenshot({ path: test.info().outputPath(`artifact-${theme}-800.png`) });
      await page.getByTestId('app.art.maker').click();
      await expect(page.getByTestId('app.over.left').getByTestId('thread.screen'), "perf's thread over the page").toHaveAttribute('data-agent', 'perf');
      await settle(page);
      await page.screenshot({ path: test.info().outputPath(`artifact-${theme}-800-thread.png`) });
      await page.keyboard.press('Escape');
      await expect(page.getByTestId('app.over.left'), 'esc closes it').toHaveCount(0);
      await expect(page.getByTestId('artifact.open'), 'the artifact stays').toBeVisible();
    } finally {
      await s.close();
      core.dispose();
    }
  });
}
