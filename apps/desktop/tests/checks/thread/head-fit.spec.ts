// thread/head-fit · head-overflow (Gabriel: « Parfois, la description de ce qu'il fait peut overflow
// avec le nom de l'agent »: art-gallery's name drawn over 'Propose a redesign…'). A maker's thread
// beside its artifact names it in its head: the name, then its role, cut with '…'. The live name had a
// min-width of 0, so on a short row it shrank under its own text and the role was drawn over it.
// Passes when, on FakeCore, a long name and a long role, at 1400 and 1100 (the thread beside the
// artifact) and 800 (the thread slid over it), light and dark: the name's box and the role's box never
// meet, the name shows whole, and the role ends with '…' (it is cut, never drawn past its box).
// Shots: head-<width>-<theme>.png. Owner: head-overflow.
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'harness-1a2b3c4d';
const NOW = Date.now();
const MIN = 60_000;
const NAME = 'art-gallery-and-its-shelves';
const ROLE =
  'Propose a redesign of the artifacts page (desktop app first, terminal after): shelves by theme, one artifact can sit on several shelves, a preview for each image, and a folder tree that fits the terminal too';

async function pagesServer(): Promise<{ url: string; server: Server }> {
  const server = createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end('<!doctype html><html><body><h1>artifacts gallery</h1></body></html>');
  });
  await new Promise<void>((ok) => server.listen(0, '127.0.0.1', ok));
  return { url: `http://127.0.0.1:${String((server.address() as AddressInfo).port)}`, server };
}

const agent = (name: string, purpose: string, status = 'idle') => ({ name, main: name === 'main', status, archived: false, title: '', purpose, since_ms: NOW - 14 * MIN, waits: 0, watching: [] });
const world = (pages: string, theme: 'light' | 'dark') => [
  { ev: 'prefs', prefs: { onboarded: true, theme } },
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'harness', path: '/nowhere/harness', git: true, home: false, order: 1, agents: 2, working: 1, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/harness', name: 'harness' },
  { ev: 'agents', project: P, agents: [agent('main', "main's job"), agent(NAME, ROLE, 'working')] },
  { ev: 'agents', project: HOME, agents: [agent('main', "main's job")] },
  {
    ev: 'thread',
    project: P,
    agent: NAME,
    entries: [
      { pos: 1, at_ms: NOW - 6 * MIN, kind: 'you', text: 'propose a redesign of the artifacts page' },
      { pos: 2, at_ms: NOW - 5 * MIN, kind: 'artifact', text: 'artifacts gallery', made: { id: 'gal', agent: NAME, title: 'artifacts gallery', kind: 'page', kind_word: 'page', v: 1 } },
    ],
    before: null,
    more: false,
  },
  {
    ev: 'artifacts',
    project: P,
    items: [{ id: 'gal', kind: 'page', title: 'artifacts gallery', agent: NAME, version: 1, at_ms: NOW - 5 * MIN, url: `${pages}/a/gal`, frame_url: `${pages}/a/gal`, new: false }],
  },
];

type Fit = { meet: boolean; nameWhole: boolean; roleCut: boolean; name: string; role: string };

for (const width of [1400, 1100, 800] as const) {
  for (const theme of ['light', 'dark'] as const) {
    test(`thread/head-fit: the maker's name is never covered by its role (${String(width)}, ${theme})`, async () => {
      test.setTimeout(90_000);
      const pages = await pagesServer();
      const core = new FakeCore(world(pages.url, theme) as unknown as ConstructorParameters<typeof FakeCore>[0]);
      const s = await launchDesktop({ core, route: `artifacts/${P}/gal`, size: `${String(width)}x900` });
      try {
        const { page } = s;
        // under 1000 px the thread slides over its artifact from '◧ <maker>'
        if (width < 1000) await page.getByTestId('app.art.maker').click();
        const head = page.getByTestId('thread.head').last();
        await expect(head.getByTestId('thread.head.name')).toHaveText(NAME, { timeout: 10_000 });
        await expect(head.getByTestId('thread.head.role')).toBeVisible();
        const fit = await head.evaluate((h): Fit => {
          const name = h.querySelector<HTMLElement>('[data-testid="thread.head.name"]');
          const role = h.querySelector<HTMLElement>('[data-testid="thread.head.role"]');
          if (name === null || role === null) throw new Error('no name or role in the head');
          const n = name.getBoundingClientRect();
          const r = role.getBoundingClientRect();
          const box = (b: DOMRect) => `${String(Math.round(b.left))}..${String(Math.round(b.right))}`;
          return {
            // half a pixel of rounding; the role starts after the name's right edge
            meet: n.right > r.left + 0.5 && r.right > n.left + 0.5,
            nameWhole: name.scrollWidth <= name.clientWidth + 1,
            roleCut: getComputedStyle(role).textOverflow === 'ellipsis' && role.scrollWidth > role.clientWidth,
            name: box(n),
            role: box(r),
          };
        });
        await page.screenshot({ path: test.info().outputPath(`head-${String(width)}-${theme}.png`), clip: { x: 0, y: 0, width, height: 260 } });
        expect(fit.meet, `the name (${fit.name}) and the role (${fit.role}) meet`).toBe(false);
        expect(fit.nameWhole, `the name is cut (${fit.name})`).toBe(true);
        expect(fit.roleCut, `the role is not cut with '…' (${fit.role})`).toBe(true);
      } finally {
        await s.close();
        pages.server.close();
      }
    });
  }
}
