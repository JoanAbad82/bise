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
// The fix batch (designer m_20435, m_20453): the page drawn from a pages server on 127.0.0.1; the
// open chip a 9% tint on its --c-line line, no ink outline; the composer's label cut before its
// state ('idle' stays); only the maker's own question docked over its one composer; at 1100 the left
// bar is a 56 px rail (bise, ↗, ◷, the projects' initials) and the title bar's sidebar button slides
// the whole bar back; at 800 the slide-over starts under the title bar with 'perf  perf's job' in its
// head; an archived maker: its own thread, dim, '↺ restore' in its head, the composer to main, the
// project's name and never its id in a head.
// Shots: artifact-<theme>-1400/1100/1100-side/800/800-thread, archived-<theme>-1400/800. Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import type { Page } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const NOW = Date.now();
const MIN = 60_000;
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const agent = (name: string, status: string, archived = false) => ({ name, main: name === 'main', status, archived, title: '', purpose: `${name}'s job`, since_ms: NOW - 14 * MIN, waits: 0, watching: [] });
// a page the pages server draws: a paper, a heading, its words
const PAGE = `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;height:100%;background:#f4efe6;color:#1d1b18;font:17px/1.55 -apple-system,sans-serif}
body{padding:40px 48px;box-sizing:border-box}h1{font-size:28px;margin:0 0 12px}
</style></head><body><h1>product page, before / after</h1><p>before: 2.4 MB hero, 3.1 s to paint. after: 180 KB, 0.9 s.</p></body></html>`;
async function pagesServer(): Promise<{ url: string; server: Server }> {
  const server = createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(PAGE);
  });
  await new Promise<void>((ok) => server.listen(0, '127.0.0.1', ok));
  return { url: `http://127.0.0.1:${String((server.address() as AddressInfo).port)}`, server };
}
const card = (id: number, who: string, question: string) => ({ id, project: P, kind: 'question', agent: who, question, options: [{ n: 1, label: 'yes' }, { n: 2, label: 'no' }], urgent: false, since_ms: NOW - 2 * MIN });
const world = (theme: string, pages: string, archived = false) => [
  prefs(theme),
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      // perf's own question docks over its composer; search's never on the artifact's screen
      {
        project: P, name: 'storefront', path: '/nowhere/storefront', git: true, home: false, order: 1, agents: 3, working: 1, waits: archived ? 1 : 2, running: true,
        cards: archived ? [card(2, 'search', 'ship the search index tonight?')] : [card(1, 'perf', 'keep the webp next to the avif?'), card(2, 'search', 'ship the search index tonight?')],
      },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/storefront', name: 'storefront' },
  { ev: 'agents', project: P, agents: [agent('main', 'idle'), agent('perf', 'idle', archived), agent('search', 'working')] },
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
    items: [{ id: 'product-page', kind: 'page', title: 'product page, before / after', agent: 'perf', version: 1, at_ms: NOW - 5 * MIN, url: `${pages}/p/product-page`, new: true }],
  },
];

const widthOf = async (page: Page, sel: string) => Math.round((await page.locator(sel).first().boundingBox())?.width ?? 0);
// a finished animation, or one cancelled on the way (its promise rejects with AbortError)
const settle = (page: Page) => page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished.catch(() => undefined))).then(() => undefined));

const rgbOf = (c: string) => c.replace(/\s/gu, '');

for (const theme of ['light', 'dark']) {
  test(`app/artifact-view: the maker's thread and the artifact on 55%, one composer, ✕ back; 1100 folds the left bar; 800 the artifact alone with '◧ perf' (${theme})`, async () => {
    const pages = await pagesServer();
    const core = new FakeCore(world(theme, pages.url) as unknown as ConstructorParameters<typeof FakeCore>[0]);
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
      // the page itself, drawn by the pages server
      await expect(page.frameLocator('[data-testid="artifact.page"]').locator('h1'), 'the page is drawn').toHaveText('product page, before / after', { timeout: 10_000 });
      // main's inbox is not on this screen (the maker's own question docks here after amb-home's 2b)
      await expect(page.getByTestId('inbox.block'), "another agent's question is not on this screen").toHaveCount(0);
      // the open chip: a tint on its own line, never an ink outline
      const chip = await page.getByTestId('thread.artifact.3').evaluate((e) => {
        const c = getComputedStyle(e);
        const line = getComputedStyle(document.body).getPropertyValue('--c-line').trim();
        const probe = document.createElement('i');
        probe.style.color = line;
        document.body.append(probe);
        const lineRgb = getComputedStyle(probe).color;
        probe.remove();
        return { bg: c.backgroundColor, border: c.borderTopColor, lineRgb, openColor: getComputedStyle(e.querySelector('.th-art-open') ?? e).color };
      });
      expect(chip.bg, 'the open chip is tinted').not.toBe('rgba(0, 0, 0, 0)');
      expect(rgbOf(chip.border), "its line stays --c-line").toBe(rgbOf(chip.lineRgb));
      // the composer's label gives way: 'idle' stays whole on its right
      const lbl = page.locator('.th-screen .b-composer .div');
      await expect(lbl.locator('.end')).toContainText('idle');
      const [db, eb] = await Promise.all([lbl.boundingBox(), lbl.locator('.end').boundingBox()]);
      expect((eb?.x ?? 0) + (eb?.width ?? 0), "'idle' inside the line").toBeLessThanOrEqual((db?.x ?? 0) + (db?.width ?? 0) + 0.5);
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
      // to its 56 px rail: bise, ↗, ◷, the projects' initials, storefront's pressed
      await expect(page.getByTestId('app.rail')).toBeVisible();
      expect(await widthOf(page, '[data-testid="app.rail"]'), 'a 56 px rail').toBe(56);
      for (const id of ['app.rail.bise', 'app.rail.artifacts', 'app.rail.scheduled']) await expect(page.getByTestId(id)).toBeVisible();
      await expect(page.getByTestId(`app.rail.project.${P}`)).toHaveText('S');
      await expect(page.getByTestId(`app.rail.project.${P}`)).toHaveAttribute('aria-pressed', 'true');
      expect(await widthOf(page, '.th-screen'), 'the thread keeps 380 px').toBeGreaterThanOrEqual(380);
      await page.mouse.move(1, 400);
      await settle(page);
      await page.screenshot({ path: test.info().outputPath(`artifact-${theme}-1100.png`) });
      // the title bar's sidebar button slides the whole bar back over it; esc puts it away
      await page.getByTestId('app.title.sidebar').click();
      await expect(page.getByTestId('app.over.left').getByTestId('app.sidebar'), 'the whole bar comes back').toBeVisible();
      expect(await widthOf(page, '[data-testid="app.over.left"]'), 'at its own width, not the rail\'s').toBe(240);
      await settle(page);
      await page.screenshot({ path: test.info().outputPath(`artifact-${theme}-1100-side.png`) });
      await page.keyboard.press('Escape');
      await expect(page.getByTestId('app.over.left')).toHaveCount(0);
      await expect(art, 'the artifact stays').toBeVisible();

      // 800: the artifact alone, perf's composer under it; '◧ perf' slides the thread over
      await page.setViewportSize({ width: 800, height: 900 });
      await expect(page.getByTestId('app.art.maker')).toContainText('◧ perf');
      await expect(page.locator('[data-testid="composer.field"]'), "perf's composer under the page").toHaveCount(1);
      await page.mouse.move(1, 400);
      await settle(page);
      await page.screenshot({ path: test.info().outputPath(`artifact-${theme}-800.png`) });
      await page.getByTestId('app.art.maker').click();
      const over = page.getByTestId('app.over.left');
      await expect(over.getByTestId('thread.screen'), "perf's thread over the page").toHaveAttribute('data-agent', 'perf');
      await settle(page);
      // under the title bar, its head says who: 'perf  perf's job'
      const [ob, tb] = await Promise.all([over.boundingBox(), page.getByTestId('app.title').boundingBox()]);
      expect(ob?.y ?? 0, 'the slide-over starts under the title bar').toBeGreaterThanOrEqual(Math.floor((tb?.y ?? 0) + (tb?.height ?? 0)));
      await expect(over.getByTestId('thread.head.name')).toBeVisible();
      await expect(over.getByTestId('thread.head.name')).toHaveText('perf');
      await expect(over.getByTestId('thread.head.role')).toContainText("perf's job");
      await page.screenshot({ path: test.info().outputPath(`artifact-${theme}-800-thread.png`) });
      await page.keyboard.press('Escape');
      await expect(page.getByTestId('app.over.left'), 'esc closes it').toHaveCount(0);
      await expect(page.getByTestId('artifact.open'), 'the artifact stays').toBeVisible();
    } finally {
      await s.close();
      core.dispose();
      pages.server.close();
    }
  });

  test(`app/artifact-view: an archived maker: its own thread, dim, '↺ restore' in its head, the composer to main (${theme})`, async () => {
    const pages = await pagesServer();
    const core = new FakeCore(world(theme, pages.url, true) as unknown as ConstructorParameters<typeof FakeCore>[0]);
    const s = await launchDesktop({ core, route: `artifacts/${P}/product-page`, size: '1400x900' });
    try {
      const { page } = s;
      await page.setViewportSize({ width: 1400, height: 900 });
      await expect(page.getByTestId('app.art')).toBeVisible({ timeout: 10_000 });
      const screen = page.getByTestId('thread.screen');
      await expect(screen, "perf's own thread in the centre").toHaveAttribute('data-agent', 'perf');
      await expect(screen, 'dim').toHaveAttribute('data-dim', 'true');
      await expect(page.getByTestId('thread.head.restore')).toHaveText('↺ restore');
      await expect(page.getByTestId('thread.archived'), 'no history foot: the one composer is there').toHaveCount(0);
      await expect(page.locator('.th-screen .b-composer .div .lbl'), 'the composer goes to the project\'s main').toContainText('to main · about');
      await expect(page.locator('.b-head, .ah').first(), 'never a workspace id in a head').not.toContainText(P);
      await expect(page.getByTestId('inbox.block'), "no other agent's question here").toHaveCount(0);
      await page.mouse.move(1, 400);
      await settle(page);
      await page.screenshot({ path: test.info().outputPath(`archived-${theme}-1400.png`) });
      await page.setViewportSize({ width: 800, height: 900 });
      await expect(page.getByTestId('app.art.maker'), "'◧ perf', archived or not").toContainText('◧ perf');
      await page.getByTestId('app.art.maker').click();
      await expect(page.getByTestId('app.over.left').getByTestId('thread.screen')).toHaveAttribute('data-agent', 'perf');
      await settle(page);
      await page.screenshot({ path: test.info().outputPath(`archived-${theme}-800.png`) });
    } finally {
      await s.close();
      core.dispose();
      pages.server.close();
    }
  });
}
