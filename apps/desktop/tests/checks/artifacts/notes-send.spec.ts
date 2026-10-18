// artifacts/notes-send · his bug (« le bouton send a pas l'air de marcher », main m_31347): on page
// desk-hood his pick went to design, the page went `updating`, design's turn never ended, and
// notes.js's send returned without a word while the page was `updating`: his 5 notes stayed drafts.
// Passes when, on FakeCore with a fake pages server serving the real kit, a page `updating` (a pick
// sent, its agent still on it), opened in the artifact view: a note typed (t on a block) then ⌘⏎
// goes, then a note typed then the send bar's button goes, then the frame's send: each time the
// server marks the note sent and the page's agent gets one message with exactly that note.
// Owner: notes-send.
import { readFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import type { FrameLocator } from '@playwright/test';
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
const TITLE = 'desk hood';
const AGENT = 'design';

// the real server's shell (rust/switchboard/src/pages/server.rs: shell), the page at v2, updating
const PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="bise-token" content="t">
<title>${TITLE}</title>
<link rel="stylesheet" href="/kit/tokens.css"><link rel="stylesheet" href="/kit/kit.css"><link rel="stylesheet" href="/kit/notes.css">
<script src="/kit/kit.js" defer></script><script src="/kit/pearl.js" defer></script><script src="/kit/notelines.js" defer></script>
<script src="/kit/notes-anchors.js" defer></script><script src="/kit/notes-fold.js" defer></script><script src="/kit/notes.js" defer></script>
</head><body><main id="bise-page" data-page="hood" data-version="2" data-latest="2" data-agent="${AGENT}" data-title="${TITLE}" data-state="updating">
<section data-kit="heading" data-id="h"><h1>${TITLE}</h1></section>
<section data-kit="prose" data-id="copy"><p>each one works in its own copy of the repo, and heavy jobs wait their turn.</p></section>
</main></body></html>`;

type Note = { id: string; status: string; text?: string; [k: string]: unknown };

/** A pages server that keeps the drafts, sends them like the real one (all drafts it holds, one
 * message to the page's agent) and never leaves `updating` (the agent's turn goes on). */
async function pagesServer(): Promise<{ url: string; server: Server; notes: Map<string, Note>; messages: string[][] }> {
  const notes = new Map<string, Note>([['n1', { id: 'n1', kind: 'pick', block: 'copy', status: 'sent', text: 'B and C, sketched', sent_ms: NOW - MIN }]]);
  const messages: string[][] = [];
  const server = createServer((req, res) => {
    const url = (req.url ?? '').split('?')[0] ?? '';
    const kit = /^\/kit\/([a-z-]+\.(css|js))$/.exec(url);
    const head = (type: string) => ({ 'content-type': type, 'content-security-policy': PAGE_CSP });
    const json = (status: number, v: unknown) => { res.writeHead(status, head('application/json')); res.end(JSON.stringify(v)); };
    let body = '';
    req.on('data', (c: Buffer) => { body += c.toString(); });
    req.on('end', () => {
      if (kit?.[1] !== undefined) {
        res.writeHead(200, head(kit[2] === 'css' ? 'text/css' : 'text/javascript'));
        res.end(readFileSync(path.join(KIT, kit[1])));
      } else if (url === '/p/hood/meta') {
        json(200, {
          id: 'hood', title: TITLE, agent: AGENT, state: 'updating',
          versions: [1, 2].map((n) => ({ n, at_ms: NOW - (3 - n) * 10 * MIN, blocks: {} })),
          notes: [...notes.values()],
        });
      } else if (url === '/p/hood') {
        res.writeHead(200, head('text/html; charset=utf-8'));
        res.end(PAGE);
      } else if (req.method === 'POST' && url === '/api/p/hood/notes') {
        if (req.headers['x-bise-token'] !== 't') { json(403, { error: 'no token' }); return; }
        const list = (JSON.parse(body) as { notes: Note[] }).notes;
        for (const [id, n] of notes) if (n.status === 'draft') notes.delete(id);
        for (const n of list) notes.set(n.id, { ...n, status: 'draft' });
        json(200, { notes: [...notes.values()] });
      } else if (req.method === 'POST' && url === '/api/p/hood/send') {
        if (req.headers['x-bise-token'] !== 't') { json(403, { error: 'no token' }); return; }
        const sent = [...notes.values()].filter((n) => n.status === 'draft');
        for (const n of sent) notes.set(n.id, { ...n, status: 'sent', sent_ms: Date.now() });
        if (sent.length > 0) messages.push(sent.map((n) => n.text ?? ''));
        json(200, { sent: sent.length, agent: AGENT });
      } else {
        json(404, { error: 'no such page' });
      }
    });
  });
  await new Promise<void>((ok) => server.listen(0, '127.0.0.1', ok));
  return { url: `http://127.0.0.1:${String((server.address() as AddressInfo).port)}`, server, notes, messages };
}

const agent = (name: string) => ({ name, main: name === 'main', status: 'working', archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 14 * MIN, waits: 0, watching: [] });
const world = (pages: string) => [
  { ev: 'prefs', prefs: { onboarded: true, theme: 'dark' } },
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'storefront', path: '/nowhere/shop', git: true, home: false, order: 1, agents: 2, working: 1, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/shop', name: 'storefront' },
  { ev: 'agents', project: P, agents: [agent('main'), agent(AGENT)] },
  { ev: 'agents', project: HOME, agents: [agent('main')] },
  {
    ev: 'artifacts',
    project: P,
    items: [{ id: 'hood', kind: 'page', title: TITLE, agent: AGENT, version: 2, at_ms: NOW - 10 * MIN, url: `${pages}/p/hood`, new: false }],
  },
];

/** A note typed on the copy block: n on the block (its keyboard key), the words, ⏎ (a draft in
 * the list). Keys through locators: the off-screen window never has the OS focus. */
async function typeNote(frame: FrameLocator, words: string): Promise<void> {
  await frame.locator('section[data-id="copy"]').press('n');
  await expect(frame.locator('.bn-composer.bn-on')).toHaveCount(1, { timeout: 5000 });
  const input = frame.locator('.bn-composer textarea.bn-input');
  await input.pressSequentially(words);
  await input.press('Enter');
  await expect(frame.locator('.bn-item.bn-draft', { hasText: words })).toHaveCount(1, { timeout: 5000 });
}

test('artifacts/notes-send: on a page updating, his typed notes go with ⌘⏎, the send bar and the frame’s send', async () => {
  test.setTimeout(90_000);
  const pages = await pagesServer();
  const core = new FakeCore(world(pages.url) as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `artifacts/${P}/hood`, size: '1400x900' });
  try {
    const { page } = s;
    await expect(page.getByTestId('artifact.page')).toBeVisible({ timeout: 10_000 });
    const frame = page.frameLocator('[data-testid="artifact.page"]');
    // the meta is in: the sent pick in the list
    // (the box comes folded once read: notes-fold.js; counted, not looked at)
    await expect(frame.locator('.bn-item.bn-sent[data-note="n1"]')).toHaveCount(1, { timeout: 10_000 });
    const sentOf = (text: string) => [...pages.notes.values()].filter((n) => n.text === text).map((n) => n.status);

    // 1. typed, then ⌘⏎
    await typeNote(frame, 'cest vague ca');
    await frame.locator('section[data-id="copy"]').press('Meta+Enter');
    await expect.poll(() => sentOf('cest vague ca'), { timeout: 5000, message: '⌘⏎: the note is sent' }).toEqual(['sent']);
    expect(pages.messages).toEqual([['cest vague ca']]);
    await expect(frame.locator('.bn-item.bn-draft')).toHaveCount(0);

    // 2. typed, then the send bar's button
    await typeNote(frame, 'trop llm-y je trouve');
    // a click in the page's frame, links.spec's way: the off-screen window's frame takes no real mouse
    await frame.locator('.bn-bar .bn-send').evaluate((b) => { (b as HTMLButtonElement).click(); });
    await expect.poll(() => sentOf('trop llm-y je trouve'), { timeout: 5000, message: 'the send bar: the note is sent' }).toEqual(['sent']);
    expect(pages.messages).toEqual([['cest vague ca'], ['trop llm-y je trouve']]);

    // 3. typed, then the frame's send
    await typeNote(frame, 'parle de worktree');
    await frame.locator('header.bise-frame [data-bise-send]').evaluate((b) => { (b as HTMLButtonElement).click(); });
    await expect.poll(() => sentOf('parle de worktree'), { timeout: 5000, message: 'the frame’s send: the note is sent' }).toEqual(['sent']);
    expect(pages.messages).toEqual([['cest vague ca'], ['trop llm-y je trouve'], ['parle de worktree']]);
    await expect(frame.locator('.bn-item.bn-draft')).toHaveCount(0);
    await page.screenshot({ path: test.info().outputPath('notes-sent.png') });
  } finally {
    await s.close();
    pages.server.close();
  }
});
