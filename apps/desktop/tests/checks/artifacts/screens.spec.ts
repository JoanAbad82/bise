// artifacts/screens · designer's desktop-screens v6 (m_11837): the artifacts screen (every project,
// by day) and one artifact open in the window, light and dark, at 1400 and 800 wide, for designer's
// sign-off. Passes when the rows show (glyph, title, the 'new' chip, kind, when; 'made by' at 1400,
// not at 800), nothing leaves the window, and the open artifact's page is the pages server's (a
// local fake server here) inside the window. The scripted core (FakeCore), fake data. Owner: amb-kit.
import { readFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import path from 'node:path';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const SHOP = 'shop-1a2b3c4d';
const ACME = 'acme-5e6f7a8b';
const H = 3600_000;

// the page wears the real kit's tokens and kit.js (served from the repo's kit/), so the theme check
// proves the kit's own ?theme= hint
const KIT = path.resolve(__dirname, '..', '..', '..', '..', '..', 'kit');
const PAGE = `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="/kit/tokens.css"><script src="/kit/kit.js" defer></script><style>
body{margin:0;padding:40px 48px;font:17px/1.55 -apple-system,sans-serif;color:var(--ink);background:var(--surface-made)}
h1{font:600 34px/1.1 Georgia,serif;margin:0 0 12px} p{margin:0 0 12px}
.k{font:12px -apple-system,sans-serif;color:var(--kick);text-transform:uppercase;letter-spacing:.06em}
</style></head><body><div class="k">storefront · perf</div><h1>product page, before / after</h1>
<p>the p95 of the product page went from 2.1 s to 0.9 s once the images were lazy and the cart call moved after the first paint.</p>
<p>the biggest win: the hero image is now 180 kB instead of 1.4 MB.</p></body></html>`;

function world(now: number, pages: string, theme: 'light' | 'dark') {
  const art = (id: string, kind: string, title: string, agent: string, ago: number, extra: object = {}) =>
    ({ id, kind, title, agent, version: 1, at_ms: now - ago, url: `${pages}/p/${id}`, new: false, ...extra });
  return [
    { ev: 'prefs', prefs: { onboarded: true, theme } },
    {
      ev: 'projects',
      projects: [
        { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
        { project: SHOP, name: 'storefront', path: '/nowhere/shop', git: true, home: false, order: 1, agents: 3, working: 1, waits: 0, running: true },
        { project: ACME, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 2, agents: 2, working: 0, waits: 0, running: true },
      ],
    },
    {
      ev: 'artifacts', project: SHOP, items: [
        art('product-page', 'page', 'product page, before / after', 'perf', 1 * H, { version: 2, new: true }),
        art('bench-csv', 'file', 'bench results.csv', 'perf', 3 * H),
        art('hero-shots', 'shots', 'hero image, 3 sizes', 'design', 26 * H),
        art('launch-recap', 'page', 'launch recap for Slack', 'main', 50 * H, { version: 3 }),
      ],
    },
    {
      ev: 'artifacts', project: ACME, items: [
        art('pr-412', 'pr', 'fix the checkout total rounding', 'api', 2 * H, { new: true }),
        art('migration-plan', 'page', 'accounts migration plan', 'main', 28 * H),
      ],
    },
  ];
}

test('artifacts/screens: the list and one artifact open, light and dark, 1400 and 800', async () => {
  test.setTimeout(180_000);
  const server: Server = createServer((req, res) => {
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
  const port = (server.address() as { port: number }).port;
  const pages = `http://127.0.0.1:${String(port)}`;
  const now = Date.now();
  const core = new FakeCore(world(now, pages, 'light') as never);
  const s = await launchDesktop({ core, route: 'artifacts' });
  try {
    const { page } = s;
    await expect(page.getByTestId('artifacts.screen')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('artifacts.list.row.product-page')).toBeVisible({ timeout: 5000 });
    const win = await s.app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().sort((a, b) => (b.getSize()[0] ?? 0) - (a.getSize()[0] ?? 0))[0]?.id ?? -1);
    const size = async (w: number) => {
      await s.app.evaluate(({ BrowserWindow }, [id, w2]) => BrowserWindow.fromId(id ?? -1)?.setContentSize(w2 ?? 0, 820), [win, w]);
      await expect.poll(() => page.evaluate(() => window.innerWidth), { timeout: 5000 }).toBe(w);
      await page.waitForTimeout(150);
    };
    const theme = async (t: 'light' | 'dark') => {
      await core.send({ ev: 'prefs', prefs: { onboarded: true, theme: t } } as never);
      await expect.poll(() => page.evaluate(() => document.documentElement.dataset['theme']), { timeout: 5000 }).toBe(t);
      await page.waitForTimeout(200);
    };
    const inside = () => page.evaluate(() => {
      const out: string[] = [];
      for (const e of Array.from(document.querySelectorAll<HTMLElement>('[data-testid^="artifacts."], [data-testid^="artifact."]'))) {
        const r = e.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        if (r.right > window.innerWidth + 1 || r.left < -1) out.push(`${e.dataset['testid'] ?? ''} leaves the window`);
      }
      return out;
    });
    for (const t of ['light', 'dark'] as const) {
      await theme(t);
      for (const w of [1400, 800]) {
        await size(w);
        await page.getByTestId('artifacts.list').focus();
        expect.soft(await inside(), `${t} ${String(w)}: nothing leaves the window`).toEqual([]);
        // the search ends inside the list's right edge (designer m_12105: it ran past it at 800)
        const edge = await page.evaluate(() => {
          const r = (id: string) => document.querySelector(`[data-testid="${id}"]`)?.closest('.art-search, .art-list')?.getBoundingClientRect();
          return { search: r('artifacts.search')?.right ?? 0, list: r('artifacts.list')?.right ?? 0, field: document.querySelector('.art-search .b-field')?.getBoundingClientRect().right ?? 0 };
        });
        expect.soft(Math.max(edge.search, edge.field) <= edge.list + 1, `${t} ${String(w)}: the search inside the row ${JSON.stringify(edge)}`).toBe(true);
        const by = await page.getByTestId('artifacts.list.row.product-page').locator('.art-by').isVisible();
        expect.soft(by, `${t} ${String(w)}: 'made by' ${w >= 1000 ? 'shows' : 'drops'}`).toBe(w >= 1000);
        await page.screenshot({ path: test.info().outputPath(`list-${t}-${String(w)}.png`) });
      }
    }
    // one artifact open: the page from the (fake) pages server inside the window
    await page.getByTestId('artifacts.list.row.product-page').click();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('artifact.open')).toBeVisible({ timeout: 5000 });
    const frame = page.frameLocator('[data-testid="artifact.page"]');
    await expect(frame.locator('h1')).toHaveText('product page, before / after', { timeout: 10_000 });
    for (const t of ['light', 'dark'] as const) {
      await theme(t);
      for (const w of [1400, 800]) {
        await size(w);
        expect.soft(await inside(), `open ${t} ${String(w)}: nothing leaves the window`).toEqual([]);
        // the page follows his theme: the kit's paper, dark #171513 / light #f2ede2 (?theme= hint)
        await expect.poll(() => frame.locator('body').evaluate((b) => getComputedStyle(b).backgroundColor), { timeout: 5000, message: `open ${t}: the page's paper` })
          .toBe(t === 'dark' ? 'rgb(23, 21, 19)' : 'rgb(242, 237, 226)');
        await page.screenshot({ path: test.info().outputPath(`open-${t}-${String(w)}.png`) });
      }
    }
    await page.getByTestId('artifact.version').click();
    await page.screenshot({ path: test.info().outputPath('open-versions-dark-800.png') });
  } finally {
    await s.close();
    server.close();
  }
});
