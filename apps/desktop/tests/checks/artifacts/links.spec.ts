// artifacts/links · art-links (main m_26350, his words: a link in an artifact in the side panel
// opened a blank page in the panel; he wants his browser). Cause: the window's CSP (frame-src
// http://127.0.0.1:*) failed the frame's navigation to the web before the shell's guard saw it,
// and Chromium left its error page in the panel. Fix: the CSP lets a frame ask, the guard decides
// (framelink.ts), a second wall cancels any subframe request off the pages server.
// This check serves each framed kind as the real server does (its CSP read from the Rust source):
// an html artifact (/a/<id>/<v>/index.html, ARTIFACT_CSP), a bise page (/p/<id>, CSP) and the
// office viewer's route (/a/<id>/view, VIEW_CSP). In each, on FakeCore at 1400 (the side panel):
// a web link, a target=_blank link, a ⌘-click, a middle click, a mailto link, a server redirect
// to the web and a script's location change each print the stubbed openExternal's line with that
// url, and the frame stays on its artifact; an in-page anchor scrolls it; an artifact: link and a
// pages-server link to another artifact open that artifact in the panel.
// The links are clicked by the page's own a.click() / dispatched events (Playwright evaluates with
// a user gesture): a real mouse click doesn't reach a cross-origin frame in an offscreen window. The
// middle click is a click event with button 1 (Blink reads its button for the new-tab policy, the
// same new-window path as a real middle click); an untrusted auxclick follows no link.
// RED before the fix: the web link left chrome-error:// in the frame and no external line.
// Shots: links-<kind>.png. Owner: art-links.
import { readFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import { Lines } from '../native/world';

const ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..');
const EXTERNAL = 'bise-desktop: external';

/** A `pub const NAME: &str = "...";` of rust/switchboard/src/pages/<file>: what the real server sends. */
function rustConst(file: string, name: string): string {
  const src = readFileSync(path.join(ROOT, `rust/switchboard/src/pages/${file}`), 'utf8');
  const m = new RegExp(`pub const ${name}: &str = "((?:[^"\\\\]|\\\\.)*)";`).exec(src);
  if (m?.[1] === undefined) throw new Error(`no ${name} in ${file}`);
  return m[1].replace(/\\"/g, '"');
}
const CSP = {
  html: rustConst('site.rs', 'ARTIFACT_CSP'),
  page: rustConst('server.rs', 'CSP'),
  view: rustConst('artifact/view.rs', 'VIEW_CSP'),
} as const;

const HOME = 'bise-home-00000000';
const P = 'shop-1a2b3c4d';
const NOW = Date.now();
const MIN = 60_000;

/** The same links in every kind's page; no inline script or style (the page CSP refuses them). */
const body = (title: string, k: string, go: string) => `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title></head><body>
<h1 id="top">${title}</h1>
<p><a id="web" href="https://example.com/${k}/web">web</a></p>
<p><a id="blank" target="_blank" href="https://example.com/${k}/blank">blank</a></p>
<p><a id="cmd" href="https://example.com/${k}/cmd">cmd</a> <a id="mid" href="https://example.com/${k}/mid">mid</a></p>
<p><a id="mail" href="mailto:${k}@example.com">mail</a> <a id="redir" href="${go}">redirect</a></p>
<p><a id="art" href="artifact:other">other</a> <a id="pages" href="/a/other/1/index.html">other on the server</a></p>
<p><a id="anchor" href="#far">far</a></p>
${'<p>…</p>'.repeat(200)}<h2 id="far">far</h2></body></html>`;

const GO = [
  { k: 'html', go: '/a/links/1/go' },
  { k: 'page', go: '/p/plan/v/1/go' },
  { k: 'view', go: '/a/deck/go' },
] as const;

async function pagesServer(asked: string[]): Promise<{ url: string; server: Server }> {
  const server = createServer((req, res) => {
    const url = req.url ?? '';
    asked.push(url);
    const send = (csp: string, html: string) => {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'content-security-policy': csp });
      res.end(html);
    };
    // a redirect inside the artifact's own files (a link of its own that the server sends to the web)
    const go = GO.find((g) => url === g.go);
    if (go !== undefined) {
      res.writeHead(302, { location: `https://example.com/${go.k}/redirected` });
      res.end();
    } else if (url.startsWith('/a/links/1/')) send(CSP.html, body('links', 'html', '/a/links/1/go'));
    else if (url.startsWith('/p/plan')) send(CSP.page, body('plan', 'page', '/p/plan/v/1/go'));
    else if (url.startsWith('/a/deck/view')) send(CSP.view, body('deck', 'view', '/a/deck/go'));
    else if (url.startsWith('/a/other/1/')) send(CSP.html, '<!doctype html><title>other</title><h1>other</h1>');
    else {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('no such page');
    }
  });
  await new Promise<void>((ok) => server.listen(0, '127.0.0.1', ok));
  return { url: `http://127.0.0.1:${String((server.address() as AddressInfo).port)}`, server };
}

const agent = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 14 * MIN, waits: 0, watching: [] });
const item = (id: string, title: string, kind: string, frame: string) => ({
  id, kind, title, agent: 'maker', version: 1, at_ms: NOW - MIN, url: `/nowhere/${id}`, frame_url: frame, versions: [], new: false,
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
  { ev: 'agents', project: P, agents: [agent('main'), agent('maker')] },
  { ev: 'agents', project: HOME, agents: [agent('main')] },
  {
    ev: 'artifacts',
    project: P,
    items: [
      item('links', 'links', 'page', `${pages}/a/links/1/index.html`),
      item('plan', 'plan', 'page', `${pages}/p/plan`),
      item('deck', 'deck', 'docx', `${pages}/a/deck/view`),
      item('other', 'other', 'page', `${pages}/a/other/1/index.html`),
    ],
  },
];

const KINDS = [
  { id: 'links', k: 'html', path: '/a/links/1/index.html' },
  { id: 'plan', k: 'page', path: '/p/plan' },
  { id: 'deck', k: 'view', path: '/a/deck/view' },
] as const;

for (const kind of KINDS) {
  test(`artifacts/links ${kind.k}: a link in the panel opens his browser or another artifact, the panel stays on its page`, async () => {
    test.setTimeout(90_000);
    const pages = await pagesServer([]);
    const core = new FakeCore(world(pages.url) as unknown as ConstructorParameters<typeof FakeCore>[0]);
    const s = await launchDesktop({ core, route: `artifacts/${P}/${kind.id}`, size: '1400x900' });
    const out = new Lines();
    s.app.process().stdout?.setEncoding('utf8');
    s.app.process().stdout?.on('data', (d: string) => {
      out.push(d);
    });
    try {
      const { page } = s;
      const frame = page.frameLocator('[data-testid="artifact.page"]');
      const shows = async (id: string) => {
        await expect(page.getByTestId('artifact.title')).toHaveText(id, { timeout: 10_000 });
        await expect(frame.locator('h1')).toHaveText(id, { timeout: 10_000 });
      };
      await shows(kind.id);
      const at = `${pages.url}${kind.path}`;
      const here = async (what: string) => {
        await page.waitForTimeout(400);
        await expect(frame.locator('h1'), `${what}: the page still shows`).toHaveText(kind.id, { timeout: 5000 });
        expect(await frame.locator('h1').evaluate(() => location.href), `${what}: the frame stays on its artifact`).toContain(at);
        await expect(page.getByTestId('artifact.title')).toHaveText(kind.id);
      };
      const opened = async (url: string, what: string) => {
        await expect.poll(() => out.of(EXTERNAL).filter((l) => l === url).length, { timeout: 5000, message: `${what}: openExternal(${url})` }).toBe(1);
        await here(what);
      };
      const click = (id: string) => frame.locator(`#${id}`).evaluate((a) => { (a as HTMLAnchorElement).click(); });

      await click('web');
      await opened(`https://example.com/${kind.k}/web`, 'a web link');
      await click('blank');
      await opened(`https://example.com/${kind.k}/blank`, 'a target=_blank link');
      await frame.locator('#cmd').evaluate((a) => { a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, metaKey: true })); });
      await opened(`https://example.com/${kind.k}/cmd`, 'a ⌘-click');
      await frame.locator('#mid').evaluate((a) => { a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 1 })); });
      await opened(`https://example.com/${kind.k}/mid`, 'a middle click');
      await click('mail');
      await opened(`mailto:${kind.k}@example.com`, 'a mailto link');
      await click('redir');
      await opened(`https://example.com/${kind.k}/redirected`, 'a server redirect');
      await frame.locator('h1').evaluate((_h, u) => { location.href = u; }, `https://example.com/${kind.k}/js`);
      await opened(`https://example.com/${kind.k}/js`, "a script's location change");

      // an in-page anchor: the frame scrolls, nothing opens
      const before = out.of(EXTERNAL).length;
      await click('anchor');
      await expect.poll(() => frame.locator('h1').evaluate(() => scrollY), { timeout: 5000, message: 'the anchor scrolls' }).toBeGreaterThan(1000);
      expect(out.of(EXTERNAL).length, 'an anchor opens nothing').toBe(before);
      expect(await frame.locator('h1').evaluate(() => location.hash)).toBe('#far');
      await page.screenshot({ path: test.info().outputPath(`links-${kind.k}.png`) });

      // another artifact: the panel opens it in place of this one; ✕ goes back to this one
      for (const id of ['art', 'pages']) {
        await click(id);
        await shows('other');
        await page.getByTestId('artifact.close').click();
        await shows(kind.id);
      }
      expect(out.of(EXTERNAL).length, 'an artifact link opens nothing outside').toBe(before);
      expect(out.of(EXTERNAL).every((l) => !l.includes('127.0.0.1')), 'the pages server never goes to his browser').toBe(true);
    } finally {
      await s.close();
      pages.server.close();
    }
  });
}
