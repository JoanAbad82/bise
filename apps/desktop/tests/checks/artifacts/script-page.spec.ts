// artifacts/script-page · art-viewer (main m_25511, his live f8a0b301a: 'the working sign, 21
// variations' showed its top text in the side panel and an empty grid; Chrome on file:// showed it
// all). Cause: the page server frames an agent's html copy in an opaque origin (ARTIFACT_CSP:
// `sandbox allow-scripts`), where the page's top-level `localStorage.getItem(...)` throws, so its
// script stopped before it built the grid. Fix (architect m_25527): the server puts
// kit/storage.js first in each html copy (site.rs `tagged`), an in-memory Storage where the
// sandbox forbids it. This check serves the copy as the real server does: ARTIFACT_CSP and
// STORAGE_TAG read from the Rust source, the kit's own storage.js. Passes when, on FakeCore, at
// 1400: v1's script builds its 21 cards in the panel; v2 (30 cards) lands live, the panel follows
// it; closed and reopened from the thread's chip it shows v2's 30; '↗ browser' opens the hub's
// page of the shown version (the stubbed openExternal's line), never the copy's path.
// SCRIPT_PAGE_NO_SHIM=1: the server without the tag (the red before the fix: 0 cards).
// Shots: script-v1.png, script-v2.png, script-reopen.png. Owner: art-viewer.
import { readFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import { Lines } from '../native/world';

const ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..');
const KIT = path.join(ROOT, 'kit');
const EXTERNAL = 'bise-desktop: external';

/** A `pub const NAME: &str = "...";` of rust/switchboard/src/pages/site.rs: what the real server sends. */
function rustConst(name: string): string {
  const src = readFileSync(path.join(ROOT, 'rust/switchboard/src/pages/site.rs'), 'utf8');
  const m = new RegExp(`pub const ${name}: &str = "((?:[^"\\\\]|\\\\.)*)";`).exec(src);
  if (m?.[1] === undefined) throw new Error(`no ${name} in site.rs`);
  return m[1].replace(/\\"/g, '"');
}
const ARTIFACT_CSP = rustConst('ARTIFACT_CSP');
const STORAGE_TAG = process.env['SCRIPT_PAGE_NO_SHIM'] === '1' ? '' : rustConst('STORAGE_TAG');

const HOME = 'bise-home-00000000';
const P = 'shop-1a2b3c4d';
const NOW = Date.now();
const MIN = 60_000;

/** An agent's page as motion-marks wrote it: static top text, then a script that reads
 * localStorage at its top level and builds `n` cards. */
const sign = (n: number) => `<!doctype html><html><head><meta charset="utf-8"><title>the working sign</title>
<style>body{margin:0;padding:24px;font:15px -apple-system,sans-serif;background:#fbf8f1}.grid{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.card{height:48px;background:#2a6ec8;border-radius:6px}</style>
</head><body><h1>the working sign, ${String(n)} variations</h1><p>pick the ones you like.</p><div class="grid" id="grid"></div>
<script>
const picks = new Set(JSON.parse(localStorage.getItem("wm-picks") || "[]"));
const grid = document.getElementById("grid");
for (let i = 1; i <= ${String(n)}; i++) { const c = document.createElement("section"); c.className = "card"; c.dataset.card = String(i); grid.append(c); }
localStorage.setItem("wm-picks", JSON.stringify([...picks]));
</script></body></html>`;
const CARDS = { 1: 21, 2: 30 } as const;

async function pagesServer(asked: string[]): Promise<{ url: string; server: Server }> {
  const server = createServer((req, res) => {
    const url = req.url ?? '';
    asked.push(url);
    const copy = /^\/a\/sign\/([12])\/index\.html/.exec(url);
    if (copy?.[1] !== undefined) {
      // the real server's site::tagged on the plain copy: the storage tag just inside <head>
      const html = sign(CARDS[Number(copy[1]) as 1 | 2]).replace('<head>', `<head>${STORAGE_TAG}`);
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'content-security-policy': ARTIFACT_CSP });
      res.end(html);
    } else if (url === '/kit/storage.js') {
      res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8' });
      res.end(readFileSync(path.join(KIT, 'storage.js')));
    } else {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('no such page');
    }
  });
  await new Promise<void>((ok) => server.listen(0, '127.0.0.1', ok));
  return { url: `http://127.0.0.1:${String((server.address() as AddressInfo).port)}`, server };
}

const agent = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 14 * MIN, waits: 0, watching: [] });
const row = (pages: string, v: 1 | 2) => ({
  id: 'sign',
  kind: 'page',
  title: 'the working sign, 21 variations',
  agent: 'motion-marks',
  version: v,
  at_ms: NOW - (3 - v) * MIN,
  // a copied file: the row's url is the copy's bare path (what openExternal refused), the frame the hub's
  url: `/nowhere/.bise/hubs/h/artifacts/sign/v${String(v)}/index.html`,
  frame_url: `${pages}/a/sign/${String(v)}/index.html`,
  versions: [1, 2].filter((x) => x <= v).map((x) => ({ v: x, at_ms: NOW - (3 - x) * MIN, target: '/nowhere/w/index.html', frame_url: `${pages}/a/sign/${String(x)}/index.html` })),
  new: false,
});
const world = (pages: string) => [
  { ev: 'prefs', prefs: { onboarded: true, theme: 'light' } },
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'storefront', path: '/nowhere/shop', git: true, home: false, order: 1, agents: 2, working: 0, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/shop', name: 'storefront' },
  { ev: 'agents', project: P, agents: [agent('main'), agent('motion-marks')] },
  { ev: 'agents', project: HOME, agents: [agent('main')] },
  {
    ev: 'thread',
    project: P,
    agent: 'motion-marks',
    entries: [
      { pos: 1, at_ms: NOW - 6 * MIN, kind: 'you', text: '21 variations of the working sign' },
      { pos: 2, at_ms: NOW - 2 * MIN, kind: 'artifact', text: 'the working sign', made: { id: 'sign', agent: 'motion-marks', title: 'the working sign, 21 variations', kind: 'page', kind_word: 'page', v: 1 } },
    ],
    before: null,
    more: false,
  },
  { ev: 'artifacts', project: P, items: [row(pages, 1)] },
];

test('artifacts/script-page: a page its script builds shows whole in the panel, follows v2 live and on reopen, opens in the browser', async () => {
  test.setTimeout(90_000);
  const asked: string[] = [];
  const pages = await pagesServer(asked);
  const core = new FakeCore(world(pages.url) as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `artifacts/${P}/sign`, size: '1400x900' });
  const out = new Lines();
  s.app.process().stdout?.setEncoding('utf8');
  s.app.process().stdout?.on('data', (d: string) => {
    out.push(d);
  });
  try {
    const { page } = s;
    const frame = page.frameLocator('[data-testid="artifact.page"]');
    const cards = () => frame.locator('[data-card]').count();
    await expect(page.getByTestId('artifact.page')).toBeVisible({ timeout: 10_000 });
    await expect(frame.locator('h1'), 'the static top text').toContainText('21 variations', { timeout: 10_000 });
    await expect.poll(cards, { timeout: 10_000, message: "v1's script built its 21 cards" }).toBe(21);
    await page.screenshot({ path: test.info().outputPath('script-v1.png') });

    // '↗ browser': the hub's page of the shown version, through the shell's openExternal
    await page.getByTestId('artifact.browser').click();
    await expect.poll(() => out.of(EXTERNAL).length, { timeout: 5000, message: 'one external open' }).toBe(1);
    expect(out.of(EXTERNAL)[0] ?? '').toContain(`${pages.url}/a/sign/1/index.html`);

    // v2 lands while it is open: the panel follows it
    await core.send({ ev: 'artifacts', project: P, items: [row(pages.url, 2)] } as never);
    await expect(page.getByTestId('artifact.version')).toHaveText('page · v2', { timeout: 10_000 });
    await expect.poll(cards, { timeout: 10_000, message: "v2's 30 cards, live" }).toBe(30);
    await page.screenshot({ path: test.info().outputPath('script-v2.png') });

    // closed, then reopened from the maker's thread: v2, whole
    await page.getByTestId('artifact.close').click();
    await expect(page.getByTestId('app.art')).toHaveCount(0, { timeout: 5000 });
    await page.getByTestId('thread.artifact.2').click();
    await expect(page.getByTestId('artifact.page')).toBeVisible({ timeout: 10_000 });
    await expect.poll(cards, { timeout: 10_000, message: "reopened: v2's 30 cards" }).toBe(30);
    await page.screenshot({ path: test.info().outputPath('script-reopen.png') });
    await page.getByTestId('artifact.browser').click();
    await expect.poll(() => out.of(EXTERNAL).length, { timeout: 5000, message: 'a second external open' }).toBe(2);
    expect(out.of(EXTERNAL)[1] ?? '').toContain(`${pages.url}/a/sign/2/index.html`);
    expect(out.of(EXTERNAL).every((l) => !l.includes('/nowhere/')), 'never the copy path').toBe(true);
    expect(asked.filter((u) => u === '/kit/storage.js').length, 'each load asked for the storage shim').toBeGreaterThan(STORAGE_TAG === '' ? -1 : 0);
  } finally {
    await s.close();
    pages.server.close();
  }
});
