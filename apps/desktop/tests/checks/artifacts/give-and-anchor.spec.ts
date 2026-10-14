// artifacts/give-and-anchor · office-artifacts chunk 9 (art-desktop; designer's picks 2 and 4,
// m_23868; the seam with art-notes m_23894). On FakeCore with a fake pages server on 127.0.0.1:
// (1) '+ add' in the artifacts screen's head picks files through window.bise.pickFiles (its test
// answer, BISE_DESKTOP_TEST_PICK_FILES) and asks the hub's artifacts_add for each, to the picked
// project's main; (2) an xlsx open beside its maker's thread, framed at /a/<id>/view with the name
// 'bise-app': the selection the viewer posts on his first typed key becomes the attachment
// '❝ Summary!C4:E4  q3-forecast.xlsx · v4' in the maker's composer, that key after it and his next
// keys there ('why so flat?'), and ⏎ sends Part::Anchor with its number; a message from another
// origin is dropped. Shots: give-add-1400, anchor-row-1400. Owner: art-desktop.
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Frame, Page } from '@playwright/test';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'shop-1a2b3c4d';
const NOW = Date.now();
const MIN = 60_000;

// the viewer as the frame sees it: a plain page; the test plays its selection (select.js posts it)
const VIEW = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;height:100%;background:#fff;font:15px -apple-system,sans-serif}</style></head>
<body><table><tr><td>Summary</td><td>1200</td><td>1350</td><td>1410</td></tr></table></body></html>`;

async function pagesServer(): Promise<{ url: string; server: Server }> {
  const server = createServer((req, res) => {
    if ((req.url ?? '').startsWith('/a/q3/view')) {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(VIEW);
    } else {
      res.writeHead(404);
      res.end();
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
  { ev: 'agents', project: P, agents: [agent('main'), agent('analyst')] },
  { ev: 'agents', project: HOME, agents: [agent('main')] },
  { ev: 'thread', project: P, agent: 'analyst', entries: [{ pos: 1, at_ms: NOW - 6 * MIN, kind: 'you', text: 'the q3 forecast, please' }], before: null, more: false },
  {
    ev: 'artifacts',
    project: P,
    items: [{ id: 'q3', kind: 'sheet', title: 'q3-forecast.xlsx', agent: 'analyst', version: 4, at_ms: NOW - 5 * MIN, url: '/nowhere/shop/q3-forecast.xlsx', frame_url: `${pages}/a/q3/view`, new: false }],
  },
];

const SELECTION = { bise: 'anchor', artifact: 'q3', version: 4, anchor: { kind: 'cell', sheet: 'Summary', range: 'C4:E4' }, quote: '1200 1350 1410' };

async function viewer(page: Page, pages: string): Promise<Frame> {
  await expect(page.getByTestId('artifact.page')).toBeVisible({ timeout: 10_000 });
  await expect.poll(() => page.frames().some((f) => f.url().startsWith(`${pages}/a/q3/view`)), { timeout: 10_000 }).toBe(true);
  const f = page.frames().find((x) => x.url().startsWith(`${pages}/a/q3/view`));
  if (f === undefined) throw new Error('no viewer frame');
  return f;
}

test("artifacts/give: '+ add' picks files and asks the hub to add each to the project's main", async () => {
  test.setTimeout(60_000);
  const pages = await pagesServer();
  const core = new FakeCore(world(pages.url) as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const picked = ['/nowhere/Desktop/q3-forecast.xlsx', '/nowhere/Desktop/deck.pptx'];
  const s = await launchDesktop({ core, route: `artifacts/${P}`, size: '1400x900', env: { BISE_DESKTOP_TEST_PICK_FILES: picked.join('\n') } });
  try {
    const { page } = s;
    const add = page.getByTestId('artifacts.add');
    await expect(add).toBeVisible({ timeout: 10_000 });
    await expect(add).toHaveAttribute('title', 'add a file to storefront');
    await page.screenshot({ path: test.info().outputPath('give-add-1400.png') });
    await add.click();
    for (const target of picked) await core.waitCmd((c) => c.cmd === 'artifacts_add' && c.project === P && c.agent === 'main' && c.target === target);
  } finally {
    await s.close();
    pages.server.close();
  }
});

test("artifacts/anchor: a selection in the frame becomes '❝ Summary!C4:E4  q3-forecast.xlsx · v4' in the maker's composer, sent as Part::Anchor", async () => {
  test.setTimeout(90_000);
  const pages = await pagesServer();
  const core = new FakeCore(world(pages.url) as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `artifacts/${P}/q3`, size: '1400x900' });
  try {
    const { page } = s;
    const frame = await viewer(page, pages.url);
    // the frame is named for the viewer: it knows it sits in the app
    expect(await frame.evaluate(() => window.name)).toBe('bise-app');
    const row = page.locator('[data-testid^="composer.attach."][data-kind="anchor"]');
    // a message from another origin (a page that frames nothing of ours) is dropped
    await page.evaluate((m) => {
      window.postMessage(m, '*');
    }, SELECTION);
    await page.waitForTimeout(300);
    await expect(row).toHaveCount(0);
    // his selection, as the viewer posts it on his first typed key ('w', architect m_24155); the
    // rest of his words then go to the maker's composer, which has the focus
    await frame.evaluate((m) => {
      window.parent.postMessage(m, '*');
    }, { ...SELECTION, key: 'w' });
    await expect(row).toHaveCount(1, { timeout: 5000 });
    await expect(row.locator('.nm')).toHaveText('Summary!C4:E4');
    await expect(row.locator('.in3')).toHaveText('q3-forecast.xlsx · v4');
    await page.keyboard.type('hy so flat?');
    await expect(page.getByTestId('composer.field')).toContainText('why so flat?');
    await page.screenshot({ path: test.info().outputPath('anchor-row-1400.png') });
    await page.keyboard.press('Enter');
    const sent = await core.waitCmd((c) => c.cmd === 'send' && 'agent' in c && c.agent === 'analyst');
    const parts = (sent as unknown as { parts?: { kind: string }[] }).parts ?? [];
    expect(parts.find((p) => p.kind === 'anchor')).toEqual({ kind: 'anchor', artifact: 'q3', version: 4, anchor: { kind: 'cell', sheet: 'Summary', range: 'C4:E4' }, quote: '1200 1350 1410', n: 1 });
  } finally {
    await s.close();
    pages.server.close();
  }
});
