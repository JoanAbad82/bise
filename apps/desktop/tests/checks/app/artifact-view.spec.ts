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
// it wears the theme the window asks for (?theme=, amb-kit's 215cb47e rule): dark paper in a dark window
const PAGE = (dark: boolean) => `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;height:100%;background:${dark ? '#1f1d1a' : '#f4efe6'};color:${dark ? '#ece7de' : '#1d1b18'};font:17px/1.55 -apple-system,sans-serif}
body{padding:40px 48px;box-sizing:border-box}h1{font-size:28px;margin:0 0 12px}
</style></head><body><h1>product page, before / after</h1><p>before: 2.4 MB hero, 3.1 s to paint. after: 180 KB, 0.9 s.</p></body></html>`;
async function pagesServer(): Promise<{ url: string; server: Server }> {
  const server = createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(PAGE(/[?&]theme=dark\b/u.test(req.url ?? '')));
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
      // (its '· about “…”' whole or gone in the thread's column: art-target, designer m_27021)
      await expect(page.getByTestId('composer.tab.to')).toHaveText(/^↳ to perf(?: · about “product page, before \/ after”)?$/u);
      await expect(page.locator('[data-testid="composer.field"]'), 'one composer on the screen').toHaveCount(1);
      // the page itself, drawn by the pages server
      await expect(page.frameLocator('[data-testid="artifact.page"]').locator('h1'), 'the page is drawn').toHaveText('product page, before / after', { timeout: 10_000 });
      await expect(page.getByTestId('artifact.page'), "the page opens in the window's theme").toHaveAttribute('src', new RegExp(`[?&]theme=${theme}\\b`, 'u'));
      // only the maker's own question, docked over its one composer (designer's artifact-open (g))
      const block = page.getByTestId('inbox.block');
      await expect(block, "perf's question over its composer").toContainText('keep the webp next to the avif?');
      await expect(block, "another agent's question is not on this screen").not.toContainText('ship the search index');
      // the open chip: the pink chip at its hover tint (desktop-agents-bar §5), never an outline
      const chip = await page.getByTestId('thread.artifact.3').evaluate((e) => {
        const c = getComputedStyle(e);
        return { bg: c.backgroundColor, border: c.borderTopWidth };
      });
      expect(chip.bg, 'the open chip is tinted').not.toBe('rgba(0, 0, 0, 0)');
      expect(chip.border, 'no outline').toBe('0px');
      // the composer's tab (designer's composer-strip A): never 'idle'; its label cut inside the tab
      const lbl = page.getByTestId('composer.tab');
      await expect(lbl).not.toContainText('idle');
      const [db, eb] = await Promise.all([lbl.boundingBox(), lbl.getByTestId('composer.tab.to').boundingBox()]);
      expect((eb?.x ?? 0) + (eb?.width ?? 0), 'the label inside the tab').toBeLessThanOrEqual((db?.x ?? 0) + (db?.width ?? 0) + 0.5);
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
      // the live head, one line (designer m_20525): 'perf  perf's job', 'archived' where its state sits,
      // '↺ restore' in place of 'changes ⌘D'
      await expect(page.getByTestId('thread.head.name')).toHaveText('perf');
      await expect(page.getByTestId('thread.head.state')).toHaveText('archived');
      await expect(page.getByTestId('thread.head.changes')).toHaveCount(0);
      expect(await widthOf(page, '[data-testid="thread.head"]') > 0 && Math.round((await page.getByTestId('thread.head').boundingBox())?.height ?? 0), 'one line, 44 px').toBe(44);
      await expect(page.getByTestId('thread.archived'), 'no history foot: the one composer is there').toHaveCount(0);
      await expect(page.getByTestId('composer.tab.to'), 'the composer goes to the project\'s main').toContainText('to bise · about');
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

// his feedback (main m_21706, designer m_21714): an archived maker with a long name and purpose; its
// head clips at its column, never under the artifact panel: the purpose cuts with '…' first, then the
// name (to 12 chars), then the 'archived' chip goes, last '↺ restore' is its 28 px '↺' (never cut)
const LONG = 'release-ts-pattern';
const longWorld = (pages: string) => {
  const w = JSON.parse(JSON.stringify(world('light', pages, true)).replaceAll('"perf"', `"${LONG}"`)) as { ev: string; project?: string; agents?: { name: string; purpose: string }[] }[];
  for (const e of w) for (const a of e.ev === 'agents' && e.project === P ? (e.agents ?? []) : []) if (a.name === LONG) a.purpose = 'Release ts-pattern on npm: the changelog, the tag, the GitHub release notes and the docs site';
  return w;
};
test("app/artifact-view: an archived maker's long head fits its column at 1400, 1100 and 800, the panel open: purpose, then name cut, then the chip goes, then restore's icon", async () => {
  const pages = await pagesServer();
  const core = new FakeCore(longWorld(pages.url) as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `artifacts/${P}/product-page`, size: '1400x900' });
  try {
    const { page } = s;
    const head = page.getByTestId('thread.head');
    const restore = page.getByTestId('thread.head.restore');
    const boxOf = async (l: ReturnType<Page['getByTestId']>, what: string) => {
      const b = await l.boundingBox();
      if (b === null) throw new Error(`${what}: not on screen`);
      return b;
    };
    // the columns fold and widen with a transition; the head picks its stage once its width holds
    // (the same box over 4 frames), as he sees it once the window stops moving
    const steady = () =>
      head.evaluate(
        (h) =>
          new Promise<void>((done) => {
            let last = '';
            let same = 0;
            const t0 = performance.now();
            const f = () => {
              const r = h.getBoundingClientRect();
              const k = `${String(Math.round(r.width))}|${h.getAttribute('data-arch') ?? ''}`;
              same = k === last ? same + 1 : 0;
              last = k;
              if (same >= 4 || performance.now() - t0 > 3000) done();
              else requestAnimationFrame(f);
            };
            requestAnimationFrame(f);
          }),
      );
    const fits = async (w: number) => {
      await steady();
      const box = await boxOf(head, `${String(w)}: a head`);
      const col = await head.evaluate((h) => h.parentElement?.getBoundingClientRect().right ?? 0);
      expect(Math.round(box.x + box.width), `${String(w)}: the head ends at its column`).toBeLessThanOrEqual(Math.round(col));
      const art = await page.getByTestId('app.art').first().boundingBox();
      if (art !== null && art.x > box.x) expect(Math.round(box.x + box.width), `${String(w)}: never under the panel`).toBeLessThanOrEqual(Math.round(art.x));
      const r = await boxOf(restore, `${String(w)}: restore`);
      expect(Math.round(r.x + r.width), `${String(w)}: restore whole, inside the head`).toBeLessThanOrEqual(Math.round(box.x + box.width));
      expect(await restore.evaluate((b) => b.scrollWidth <= b.clientWidth), `${String(w)}: '↺' never cut`).toBe(true);
      expect(Math.round(box.height), `${String(w)}: one line`).toBe(44);
    };
    const cut = (id: string) => page.getByTestId(id).evaluate((e) => e.scrollWidth > e.clientWidth + 1);
    await page.setViewportSize({ width: 1400, height: 900 });
    await expect(page.getByTestId('app.art')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('thread.screen')).toHaveAttribute('data-agent', LONG);
    await settle(page);
    await fits(1400);
    await expect(restore, '1400: the whole button').toHaveText('↺ restore');
    await expect(page.getByTestId('thread.head.state'), "1400: 'archived' shows").toBeVisible();
    await page.screenshot({ path: test.info().outputPath('archived-long-light-1400.png') });

    await page.setViewportSize({ width: 1100, height: 900 });
    await settle(page);
    await fits(1100);
    expect(await cut('thread.head.role'), "1100: the purpose cuts with '…'").toBe(true);
    await page.mouse.move(1, 400);
    await page.screenshot({ path: test.info().outputPath('archived-long-light-1100.png') });
    await head.screenshot({ path: test.info().outputPath('archived-long-light-1100-head.png') });

    // narrower than the name, the chip and the whole button: the chip goes, then the icon
    for (const w of [1000, 900, 800]) {
      await page.setViewportSize({ width: w, height: 900 });
      // under 1000 the artifact takes the width: its maker's thread slides over from '◧' (once)
      const over = page.getByTestId('app.over.left').getByTestId('thread.screen');
      if (w < 1000 && !(await over.isVisible())) {
        await page.getByTestId('app.art.maker').click();
        await expect(over).toHaveAttribute('data-agent', LONG);
      }
      await settle(page);
      await fits(w);
    }
    await page.screenshot({ path: test.info().outputPath('archived-long-light-800.png') });
    // the stages in order, from a head squeezed by hand (the 380 px column is already wide enough at 1100)
    const stageAt = async (px: number) => {
      await head.evaluate((h, v) => {
        (h as HTMLElement).style.width = `${String(v)}px`;
        (h as HTMLElement).style.flex = 'none';
      }, px);
      await page.evaluate(() => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok))));
      return head.getAttribute('data-arch');
    };
    const seen: string[] = [];
    for (let px = 420; px >= 150; px -= 10) {
      const st = (await stageAt(px)) ?? '?';
      if (seen.at(-1) !== st) seen.push(st);
      expect(await restore.evaluate((b) => b.scrollWidth <= b.clientWidth), `${String(px)} px: '↺' never cut`).toBe(true);
      const hb = await boxOf(head, `${String(px)} px: the head`);
      const rb = await boxOf(restore, `${String(px)} px: restore`);
      expect(Math.round(rb.x + rb.width), `${String(px)} px: restore inside`).toBeLessThanOrEqual(Math.round(hb.x + hb.width));
      // the purpose goes to nothing before the name cuts; the name keeps its first 12 chars while the chip shows
      if (await cut('thread.head.name')) expect(Math.round((await boxOf(page.getByTestId('thread.head.role'), 'the role')).width), `${String(px)} px: the purpose gone before the name cuts`).toBe(0);
      if (st === '0') expect(await page.getByTestId('thread.head.name').evaluate((e) => e.clientWidth >= parseFloat((e as HTMLElement).style.minWidth) - 1), `${String(px)} px: the name keeps 12 chars while the chip shows`).toBe(true);
    }
    expect(seen, 'the chip goes before the icon').toEqual(['0', '1', '2']);
    await expect(restore, 'the icon').toHaveText('↺');
    await expect(restore, "its tooltip").toHaveAttribute('title', 'restore');
    expect(Math.round((await boxOf(restore, 'the icon')).width), '28 px').toBe(28);
    await restore.click();
    await core.waitCmd((c) => c.cmd === 'unarchive' && 'agent' in c && c.agent === LONG);
  } finally {
    await s.close();
    core.dispose();
    pages.server.close();
  }
});

// his ask (main m_21531, designer m_21535): with an artifact open, esc closes the artifact first,
// after a menu; his words and the answering mode stay as they were; an esc inside the page closes
// it too, unless the page used it (its own field)
test("app/artifact-view: esc closes the open artifact first, after a menu, his words and mode kept; from inside its page too, unless the page used it", async () => {
  const pages = await pagesServer();
  const core = new FakeCore(world('light', pages.url) as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `project/${P}`, size: '1400x900' });
  try {
    const { page } = s;
    await page.setViewportSize({ width: 1400, height: 900 });
    const field = page.getByTestId('composer.field');
    const label = page.getByTestId('composer.tab.to');
    const art = page.getByTestId('app.art');
    const row = page.getByTestId(`app.right.artifact.${P}.product-page`);
    await expect(row).toBeVisible({ timeout: 10_000 });
    // main's composer: his words, its label (answering a docked card, or to main)
    await field.click();
    await page.keyboard.type('half a thought for main');
    const mainLabel = await label.innerText();
    const open = async () => {
      await row.click();
      await expect(art).toBeVisible({ timeout: 5000 });
      await expect(page.getByTestId('thread.screen')).toHaveAttribute('data-agent', 'perf');
    };
    await open();
    // perf's composer focused, with words, its label answering perf's docked question or about the page
    await field.click();
    await page.keyboard.type('and the avif sizes?');
    const perfLabel = await label.innerText();
    // a menu open: esc closes the menu only
    await page.getByTestId('artifact.more').click();
    await expect(page.locator('[role="menu"]')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="menu"]'), 'the menu closes first').toHaveCount(0);
    await expect(art, 'the artifact stays').toBeVisible();
    await expect(field, 'his words stay').toContainText('and the avif sizes?');
    await expect(label, 'its mode stays').toHaveText(perfLabel);
    // then esc, from his composer, closes the artifact, not his words or his mode
    await field.click();
    await page.keyboard.press('Escape');
    await expect(art, 'esc closes the artifact').toHaveCount(0);
    await expect(page.getByTestId('thread.screen')).toHaveAttribute('data-agent', 'main');
    await expect(field, "main's words as he left them").toContainText('half a thought for main');
    await expect(label, "main's mode as he left it").toHaveText(mainLabel);
    // back on it: perf's words and mode kept
    await open();
    await expect(field, "perf's words kept").toContainText('and the avif sizes?');
    await expect(label).toHaveText(perfLabel);

    // inside the page: a field that uses esc keeps it; anywhere else in the page esc closes the artifact
    const frame = page.frameLocator('[data-testid="artifact.page"]');
    await expect(frame.locator('h1')).toHaveText('product page, before / after', { timeout: 10_000 });
    await frame.locator('body').evaluate((b) => {
      const q = document.createElement('input');
      q.id = 'q';
      q.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') e.preventDefault();
      });
      b.append(q);
    });
    // the off-screen window gives the page's field no real focus: its esc is dispatched on the field,
    // through the same listeners (the page's, then the forwarder's check after them)
    await frame.locator('#q').evaluate((q) => q.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })));
    await page.waitForTimeout(300);
    await expect(art, "the page's own field used it: open").toBeVisible();
    // an esc the page doesn't use: dispatched on the page, then a real key after a click in it
    await frame.locator('h1').evaluate((h) => h.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })));
    await expect(art, 'an esc the page left free closes it').toHaveCount(0, { timeout: 3000 });
    await open();
    await expect(frame.locator('h1')).toHaveText('product page, before / after', { timeout: 10_000 });
    await frame.locator('h1').click();
    await page.keyboard.press('Escape');
    await expect(art, 'an esc in the page closes it').toHaveCount(0, { timeout: 3000 });
  } finally {
    await s.close();
    core.dispose();
    pages.server.close();
  }
});
