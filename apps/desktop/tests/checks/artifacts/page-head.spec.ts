// artifacts/page-head · his bug (main m_26492): in a narrow side panel, a bise page's frame (the
// pearl, the title, 'by <agent> · 19 h ago · following your taste · 15 rules', 'what changed',
// 'v6 ▾', 'send') ran out of room and cut its buttons ('sen…'). The kit's frame now has two groups:
// the words give way (they end in '…', and kit.js drops the taste rules, then the age, then whose),
// the controls never shrink and go to a second row when the words' least width is reached.
// Passes when, on FakeCore with a fake pages server serving the real kit (and the real server's
// page CSP), a page at v6 with his taste and 3 notes, opened in the artifact view, light and dark:
// at the window's 1400 and 800, then with the page's frame forced to 700, 560, 480, 400, 360 and
// 320 px wide, every control of the frame is whole (its box inside the frame and the panel, its
// text not cut, no two controls overlap), the words never run under the controls, and the frame
// keeps its words whole when there is room (1400: nothing dropped, the taste rules shown).
// Shots: head-<theme>-<width>.png. Owner: page-head.
import { readFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import type { Locator, Page } from '@playwright/test';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..');
const KIT = path.join(ROOT, 'kit');
const PAGE_CSP = (() => {
  const src = readFileSync(path.join(ROOT, 'rust/switchboard/src/pages/server.rs'), 'utf8');
  const m = /pub const CSP: &str = "((?:[^"\\]|\\.)*)";/.exec(src);
  if (m?.[1] === undefined) throw new Error('no CSP in server.rs');
  return m[1];
})();

const HOME = 'bise-home-00000000';
const P = 'shop-1a2b3c4d';
const NOW = Date.now();
const MIN = 60_000;
const H = 60 * MIN;
const TITLE = 'mail pour frédéric drach';
const AGENT = 'epargne offre';

// the real server's shell (rust/switchboard/src/pages/server.rs: shell), the page at v6
const PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="bise-token" content="t">
<title>${TITLE}</title>
<link rel="stylesheet" href="/kit/tokens.css"><link rel="stylesheet" href="/kit/kit.css"><link rel="stylesheet" href="/kit/notes.css">
<script src="/kit/kit.js" defer></script><script src="/kit/pearl.js" defer></script><script src="/kit/notelines.js" defer></script>
<script src="/kit/notes-anchors.js" defer></script><script src="/kit/notes-fold.js" defer></script><script src="/kit/notes.js" defer></script>
</head><body><main id="bise-page" data-page="mail" data-version="6" data-latest="6" data-agent="${AGENT}" data-title="${TITLE}" data-state="ready">
<section data-kit="heading" data-id="h"><h1>${TITLE}</h1></section>
<section data-kit="prose" data-id="p1"><p>bonjour frédéric, voici l'offre d'épargne dont on a parlé jeudi.</p></section>
</main></body></html>`;
const META = {
  id: 'mail', title: TITLE, agent: AGENT, state: 'ready', taste: { rules: 15 },
  versions: [1, 2, 3, 4, 5, 6].map((n) => ({ n, at_ms: NOW - (25 - n) * H, blocks: {} })),
  notes: [
    { id: 'n1', block: 'p1', quote: 'offre', status: 'sent', text: 'plus court' },
    { id: 'n2', block: 'p1', quote: 'bonjour', status: 'sent', text: 'tutoie-le' },
    { id: 'n3', block: 'h', status: 'sent', text: 'un autre titre' },
  ],
};

async function pagesServer(): Promise<{ url: string; server: Server }> {
  const server = createServer((req, res) => {
    const url = (req.url ?? '').split('?')[0] ?? '';
    const kit = /^\/kit\/([a-z-]+\.(css|js))$/.exec(url);
    const head = (type: string) => ({ 'content-type': type, 'content-security-policy': PAGE_CSP });
    if (kit?.[1] !== undefined) {
      res.writeHead(200, head(kit[2] === 'css' ? 'text/css' : 'text/javascript'));
      res.end(readFileSync(path.join(KIT, kit[1])));
    } else if (url === '/p/mail/meta') {
      res.writeHead(200, head('application/json'));
      res.end(JSON.stringify(META));
    } else if (url === '/p/mail') {
      res.writeHead(200, head('text/html; charset=utf-8'));
      res.end(PAGE);
    } else {
      res.writeHead(404, head('application/json'));
      res.end('{"error":"no such page"}');
    }
  });
  await new Promise<void>((ok) => server.listen(0, '127.0.0.1', ok));
  return { url: `http://127.0.0.1:${String((server.address() as AddressInfo).port)}`, server };
}

const agent = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 14 * MIN, waits: 0, watching: [] });
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
  { ev: 'agents', project: P, agents: [agent('main'), agent(AGENT)] },
  { ev: 'agents', project: HOME, agents: [agent('main')] },
  {
    ev: 'artifacts',
    project: P,
    items: [{ id: 'mail', kind: 'page', title: TITLE, agent: AGENT, version: 6, at_ms: NOW - 19 * H, url: `${pages}/p/mail`, new: false }],
  },
];

type Head = { fit: string; taste: boolean; problems: string[] };

/** Inside the page: every control of the frame whole, inside the frame and the panel, none on another. */
function measure(bar: Locator): Promise<Head> {
  return bar.evaluate((f): Head => {
    const fr = f.getBoundingClientRect();
    const problems: string[] = [];
    const shown = (e: Element) => e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden';
    const controls = Array.from(f.querySelectorAll<HTMLElement>('.a button, .a a')).filter((e) => shown(e) && !e.closest('.vmenu'));
    if (controls.length < 3) problems.push(`only ${String(controls.length)} controls shown`);
    const boxes = controls.map((e) => ({ name: e.textContent.trim(), r: e.getBoundingClientRect(), e }));
    for (const { name, r, e } of boxes) {
      if (r.left < fr.left - 0.5 || r.right > fr.right + 0.5 || r.top < fr.top - 0.5 || r.bottom > fr.bottom + 0.5) problems.push(`'${name}' leaves the frame`);
      if (r.left < -0.5 || r.right > window.innerWidth + 0.5) problems.push(`'${name}' leaves the panel`);
      if (e.scrollWidth > e.clientWidth + 1) problems.push(`'${name}' is cut (${String(e.scrollWidth)} > ${String(e.clientWidth)})`);
      if (r.width < 24 || r.height < 18) problems.push(`'${name}' too small to click (${String(Math.round(r.width))}×${String(Math.round(r.height))})`);
    }
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i]?.r, b = boxes[j]?.r;
        if (a && b && a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5) problems.push(`'${boxes[i]?.name ?? ''}' meets '${boxes[j]?.name ?? ''}'`);
      }
    }
    // the words stay in their own box, and that box never runs under a control
    const info = f.querySelector('.i')?.getBoundingClientRect();
    if (!info) problems.push('no words box');
    else {
      if (info.right > fr.right + 0.5) problems.push('the words leave the frame');
      for (const { name, r } of boxes) if (info.left < r.right - 0.5 && r.left < info.right - 0.5 && info.top < r.bottom - 0.5 && r.top < info.bottom - 0.5) problems.push(`the words run under '${name}'`);
    }
    if (document.documentElement.scrollWidth > window.innerWidth + 1) problems.push(`the page scrolls sideways (${String(document.documentElement.scrollWidth)})`);
    const taste = f.querySelector('a.taste');
    return { fit: f.getAttribute('data-fit') ?? '', taste: taste !== null && shown(taste), problems };
  });
}

test('artifacts/page-head: the page frame keeps every control whole from 1400 to a 320 px panel, light and dark', async () => {
  test.setTimeout(150_000);
  const pages = await pagesServer();
  const core = new FakeCore(world(pages.url) as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `artifacts/${P}/mail`, size: '1400x900' });
  try {
    const { page } = s;
    await expect(page.getByTestId('artifact.page')).toBeVisible({ timeout: 10_000 });
    const frame = page.frameLocator('[data-testid="artifact.page"]');
    await expect(frame.locator('header.bise-frame .t')).toHaveText(TITLE, { timeout: 10_000 });
    // the meta is in: the age, the taste rules, the versions
    await expect(frame.locator('header.bise-frame .v > button')).toHaveText('v6 ▾', { timeout: 10_000 });
    const theme = async (t: 'light' | 'dark') => {
      await core.send({ ev: 'prefs', prefs: { onboarded: true, theme: t } } as never);
      await expect.poll(() => page.evaluate(() => document.documentElement.dataset['theme']), { timeout: 5000 }).toBe(t);
      // the page follows (it may load again with the new ?theme=): its bar back, with its versions
      await expect(frame.locator('header.bise-frame .v > button')).toHaveText('v6 ▾', { timeout: 10_000 });
    };
    // the real window's size (screens.spec's way)
    const sizeOf = async (id: number, w: number, p: Page) => {
      await s.app.evaluate(({ BrowserWindow }, [i, w2]) => BrowserWindow.fromId(i ?? -1)?.setContentSize(w2 ?? 0, 900), [id, w]);
      await expect.poll(() => p.evaluate(() => window.innerWidth), { timeout: 5000 }).toBe(w);
      await p.waitForTimeout(250);
    };
    const win = await s.app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().sort((a, b) => (b.getSize()[0] ?? 0) - (a.getSize()[0] ?? 0))[0]?.id ?? -1);
    // 1. the side panel, as he has it: the window at 1400 (the page beside the list) and 800 (alone)
    for (const t of ['dark', 'light'] as const) {
      await theme(t);
      for (const w of [1400, 800]) {
        await sizeOf(win, w, page);
        const head = await measure(frame.locator('header.bise-frame'));
        expect.soft(head.problems, `${t} window ${String(w)}: every control whole`).toEqual([]);
        await page.screenshot({ path: test.info().outputPath(`head-${t}-window-${String(w)}.png`) });
      }
    }
    // 2. the page on its own (a browser tab, or a panel that wide), from 1400 down to 320: its own
    // off-screen window, never shown, resized for each width. (Pinning the panel's frame at each
    // width read stale: a cross-origin frame in an off-screen window kept its old size.)
    for (const t of ['dark', 'light'] as const) {
      const url = `${pages.url}/p/mail?theme=${t}`;
      const tabId = await s.app.evaluate(async ({ BrowserWindow }, u) => {
        const w = new BrowserWindow({
          x: -30000, y: -30000, width: 1400, height: 900, show: false, frame: false, focusable: false, skipTaskbar: true, paintWhenInitiallyHidden: true,
          webPreferences: { offscreen: true, backgroundThrottling: false, contextIsolation: true, sandbox: true },
        });
        await w.loadURL(u);
        return w.id;
      }, url);
      const tab = await expect.poll(() => s.app.windows().find((p) => p.url() === url), { timeout: 10_000 }).toBeTruthy().then(() => s.app.windows().find((p) => p.url() === url));
      if (tab === undefined) throw new Error(`no window on ${url}`);
      try {
        const bar = tab.locator('header.bise-frame');
        await expect(bar.locator('.v > button'), `${t}: the page's meta is in`).toHaveText('v6 ▾', { timeout: 10_000 });
        for (const px of [1400, 1100, 800, 700, 560, 480, 400, 360, 320]) {
          await sizeOf(tabId, px, tab);
          const head = await measure(bar);
          expect.soft(head.problems, `${t} page ${String(px)}: every control whole`).toEqual([]);
          if (px >= 1100) expect.soft({ fit: head.fit, taste: head.taste }, `${t} ${String(px)}: room for every word`).toEqual({ fit: '', taste: true });
          if (px <= 480) expect.soft(head.taste, `${t} ${String(px)}: the taste rules go first`).toBe(false);
          await tab.screenshot({ path: test.info().outputPath(`head-${t}-${String(px)}.png`), clip: { x: 0, y: 0, width: px, height: 160 } });
        }
      } finally {
        await s.app.evaluate(({ BrowserWindow }, id) => { BrowserWindow.fromId(id)?.destroy(); }, tabId);
      }
    }
  } finally {
    await s.close();
    pages.server.close();
  }
});
