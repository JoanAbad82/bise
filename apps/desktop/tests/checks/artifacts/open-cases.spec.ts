// artifacts/open-cases · designer's artifact-open v2 (ambient-lead m_20431): the two cases of the
// artifact view that amb-win's app/artifact-view doesn't shoot, for designer's sign-off of
// task-panel's ArtifactOpen: (1) the maker archived: the one composer goes to the project's main
// ('to main · about “…”'), the maker's thread stays readable; (2) a question from the maker, docked
// over the composer under the page at 800 ('answering perf · …' once opened). Each
// at 1400 and 800 (the artifact alone, the composer under the page), light and dark. FakeCore, fake
// data. Owner: task-panel.
import { readFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import path from 'node:path';
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import type { Page } from '@playwright/test';

const CARD = { id: 9, project: 'acme-1a2b3c4d', kind: 'question', rank: 1, agent: 'perf', question: 'keep the old hero as a fallback for slow phones?', options: [{ n: 1, label: 'yes, keep it' }, { n: 2, label: 'no, drop it' }], urgent: false, since_ms: Date.now() - 60_000 };
const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const NOW = Date.now();
const MIN = 60_000;
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const agent = (name: string, status: string, archived = false, waits = 0) => ({ name, main: name === 'main', status, archived, title: '', purpose: `${name}'s job`, since_ms: NOW - 14 * MIN, waits, watching: [] });
// a page from the real kit (served from the repo's kit/), so the shots show the page as he'd see it
const KIT = path.resolve(__dirname, '..', '..', '..', '..', '..', 'kit');
const PAGE = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/kit/tokens.css"><script src="/kit/kit.js" defer></script><style>
body{margin:0;padding:40px 48px;font:17px/1.55 -apple-system,sans-serif;color:var(--ink);background:var(--surface-made)}
h1{font:600 34px/1.1 Georgia,serif;margin:0 0 12px} p{margin:0 0 12px}
</style></head><body><h1>product page, before / after</h1>
<p>the p95 of the product page went from 2.1 s to 0.9 s once the images were lazy and the cart call moved after the first paint.</p>
<p>the biggest win: the hero image is now 180 KB instead of 2.4 MB.</p></body></html>`;
async function pagesServer(): Promise<{ url: string; server: Server }> {
  const server = createServer((req, res) => {
    const kit = /^\/kit\/(tokens\.css|kit\.js)/.exec(req.url ?? '');
    if (kit?.[1] !== undefined) {
      res.writeHead(200, { 'content-type': kit[1].endsWith('.css') ? 'text/css' : 'text/javascript' });
      res.end(readFileSync(path.join(KIT, kit[1])));
      return;
    }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(PAGE);
  });
  await new Promise<void>((ok) => server.listen(0, '127.0.0.1', ok));
  return { url: `http://127.0.0.1:${String((server.address() as { port: number }).port)}`, server };
}
const world = (theme: string, c: 'archived' | 'question', pages: string) => [
  prefs(theme),
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'storefront', path: '/nowhere/storefront', git: true, home: false, order: 1, agents: 3, working: 1, waits: c === 'question' ? 1 : 0, running: true, ...(c === 'question' ? { cards: [CARD] } : {}) },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/storefront', name: 'storefront' },
  { ev: 'agents', project: P, agents: [agent('main', 'idle'), c === 'archived' ? agent('perf', 'done', true) : agent('perf', 'working', false, 1), agent('search', 'working')] },
  ...(c === 'question' ? [{ ev: 'cards', project: P, cards: [CARD] }] : []),
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

const settle = (page: Page) => page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished.catch(() => undefined))).then(() => undefined));

for (const c of ['archived', 'question'] as const) {
  for (const theme of ['light', 'dark']) {
    test(`artifacts/open-cases: ${c}, 1400 and 800 (${theme})`, async () => {
      const pages = await pagesServer();
      const core = new FakeCore(world(theme, c, pages.url) as unknown as ConstructorParameters<typeof FakeCore>[0]);
      const s = await launchDesktop({ core, route: `artifacts/${P}/product-page`, size: '1400x900' });
      try {
        const { page } = s;
        await page.setViewportSize({ width: 1400, height: 900 });
        await expect(page.getByTestId('artifact.title')).toHaveText('product page, before / after', { timeout: 10_000 });
        await expect(page.locator('[data-testid="composer.field"]'), 'one composer').toHaveCount(1);
        if (c === 'archived') await expect(page.getByTestId('composer.tab.to').first()).toContainText('to main · about');
        await page.mouse.move(1, 400);
        await expect(page.frameLocator('[data-testid="artifact.page"]').locator('h1')).toHaveText('product page, before / after', { timeout: 10_000 });
        await settle(page);
        await page.screenshot({ path: test.info().outputPath(`${c}-${theme}-1400.png`) });
        await page.setViewportSize({ width: 800, height: 900 });
        await expect(page.getByTestId('artifact.composer')).toBeVisible();
        // the page keeps the room; the composer (and a docked card) sits at the bottom (designer m_20594)
        await expect(page.frameLocator('[data-testid="artifact.page"]').locator('h1')).toHaveText('product page, before / after', { timeout: 10_000 });
        const pageBox = await page.getByTestId('artifact.page').boundingBox();
        expect(pageBox?.height ?? 0, 'the page keeps its height at 800').toBeGreaterThan(300);
        const cBox = await page.getByTestId('artifact.composer').boundingBox();
        expect(Math.round(900 - ((cBox?.y ?? 0) + (cBox?.height ?? 0))), 'the composer at the bottom').toBeLessThanOrEqual(1);
        if (c === 'archived') await expect(page.getByTestId('artifact.composer')).toContainText('to main · about');
        if (c === 'question') {
          // the maker's own question docks over the composer under the page (designer m_20452), only its
          const dock = page.getByTestId('artifact.composer').getByTestId('inbox.block');
          await expect(dock).toContainText('keep the old hero');
          await dock.locator('[data-testid^="inbox.block.row."]').first().click();
          await expect(page.getByTestId('artifact.composer')).toHaveAttribute('data-answering', 'true');
          await expect(page.getByTestId('artifact.composer')).toContainText('answering perf');
        }
        await settle(page);
        await page.screenshot({ path: test.info().outputPath(`${c}-${theme}-800.png`) });
      } finally {
        await s.close();
        core.dispose();
        pages.server.close();
      }
    });
  }
}
