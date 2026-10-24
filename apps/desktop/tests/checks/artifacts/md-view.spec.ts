// artifacts/md-view · md-artifact (Gabriel: « Cet artifact markdown ne se render pas correctement
// dans la sidebar »: learnings.md showed as raw monospace source). A .md artifact's frame_url is
// the viewer (/a/<id>/view, pages::site::viewer_kind 'markdown'), which draws it with
// kit/office/markdown.js on office/dist/office-md.js. This pages server serves the real kit and
// bundle with the viewer's CSP read from the Rust source, and the shell view.rs writes (its tags).
// Passes when, on FakeCore, at 1400 (the side panel) light and dark: the frame shows the file's
// h1 and its table as elements (not '# ' and '|' text), its quote as a blockquote, and 'source'
// shows the file as written and back. Shots: md-<theme>.png. Owner: md-artifact.
import { readFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..');

function rustConst(file: string, name: string): string {
  const src = readFileSync(path.join(ROOT, 'rust/switchboard/src/pages', file), 'utf8');
  const m = new RegExp(`pub const ${name}: &str = "((?:[^"\\\\]|\\\\.)*)";`).exec(src);
  if (m?.[1] === undefined) throw new Error(`no ${name} in ${file}`);
  return m[1];
}
const VIEW_CSP = rustConst('artifact/view.rs', 'VIEW_CSP');

const HOME = 'bise-home-00000000';
const P = 'harness-1a2b3c4d';
const NOW = Date.now();
const MIN = 60_000;

// a learnings.md-like file: headings, a table, a quote, a list, code
const MD = `# Ce que bise m'apprend — carnet de findings

Carnet tenu par l'agent \`learnings\` pour un futur article. Chaque finding : tes mots (verbatim), une synthèse, des tags, des preuves.

## Index des tags

| tag | findings |
|---|---|
| context management | F01, F02, F15 |
| memories | F02 |
| delegation | F01, F03, F04, F14, F15 |
| orchestration | F03, F04, F05, F06, F14, F15 |

---

## F01 · Un dossier privé par agent, passé par référence

Tags : context management, delegation · Date : 19 oct

> Chaque agent a son folder privé, dans lequel il peut écrire des documents, ce qui permet à tous les bims de lire et de passer par référence ces documents.

- **synthèse** : un agent écrit, un autre lit le chemin
- **preuve** : \`sb history "brief"\`, [le journal](https://bise.dev)

\`\`\`sh
sb inspect architect --query brief
\`\`\`
`;

// the shell pages/artifact/view.rs writes (its links, scripts and data- attributes)
const SHELL = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="bise-token" content="t0"><title>learnings · carnet</title>
<link rel="stylesheet" href="/kit/tokens.css"><link rel="stylesheet" href="/kit/office/viewer.css"><link rel="stylesheet" href="/kit/office/select.css">
<script src="/kit/notes-anchors.js" defer></script><script src="/kit/notes.js" defer></script>
<script type="module" src="/kit/office/viewer.js"></script><script type="module" src="/kit/office/select.js"></script><script type="module" src="/kit/office/swap.js"></script>
</head><body>
<main id="bise-office" data-artifact="learn" data-kind="markdown" data-version="1" data-latest="1" data-follows data-file="/a/learn/1/learnings.md" data-name="learnings.md" data-agent="learnings" data-title="learnings · carnet">
<p class="office-state" data-state="opening">opening learnings.md…</p>
</main></body></html>`;

const TYPES: Record<string, string> = { '.css': 'text/css', '.js': 'text/javascript' };

async function pagesServer(): Promise<{ url: string; server: Server }> {
  const server = createServer((req, res) => {
    const url = (req.url ?? '').split('?')[0] ?? '';
    const send = (status: number, type: string, body: string | Buffer) => {
      res.writeHead(status, { 'content-type': type, 'content-security-policy': VIEW_CSP });
      res.end(body);
    };
    const bundle = /^\/kit\/office\/(office-md\.js)$/.exec(url);
    const kit = /^\/kit\/([a-z-]+(?:\/[a-z-]+)?\.(?:css|js))$/.exec(url);
    if (url === '/a/learn/view') send(200, 'text/html; charset=utf-8', SHELL);
    else if (url === '/a/learn/1/learnings.md') send(200, 'text/plain; charset=utf-8', MD);
    else if (url === '/a/learn/notes') send(200, 'application/json', '{"notes":[]}');
    else if (bundle?.[1] !== undefined) send(200, 'text/javascript', readFileSync(path.join(ROOT, 'office', 'dist', bundle[1])));
    else if (kit?.[1] !== undefined) {
      let body: Buffer | null = null;
      try {
        body = readFileSync(path.join(ROOT, 'kit', kit[1]));
      } catch {
        body = null;
      }
      if (body === null) send(404, 'text/plain', 'no such file');
      else send(200, TYPES[path.extname(kit[1])] ?? 'text/plain', body);
    } else send(404, 'text/plain', 'no such file');
  });
  await new Promise<void>((ok) => server.listen(0, '127.0.0.1', ok));
  return { url: `http://127.0.0.1:${String((server.address() as AddressInfo).port)}`, server };
}

const agent = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 14 * MIN, waits: 0, watching: [] });
const world = (pages: string, theme: 'light' | 'dark') => [
  { ev: 'prefs', prefs: { onboarded: true, theme } },
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'harness', path: '/nowhere/harness', git: true, home: false, order: 1, agents: 2, working: 0, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/harness', name: 'harness' },
  { ev: 'agents', project: P, agents: [agent('main'), agent('learnings')] },
  { ev: 'agents', project: HOME, agents: [agent('main')] },
  {
    ev: 'thread',
    project: P,
    agent: 'learnings',
    entries: [
      { pos: 1, at_ms: NOW - 6 * MIN, kind: 'you', text: 'garde un carnet de ce que bise m’apprend' },
      { pos: 2, at_ms: NOW - 5 * MIN, kind: 'artifact', text: 'learnings · carnet', made: { id: 'learn', agent: 'learnings', title: 'learnings · carnet', kind: 'file', kind_word: 'file', v: 1 } },
    ],
    before: null,
    more: false,
  },
  {
    ev: 'artifacts',
    project: P,
    items: [
      { id: 'learn', kind: 'file', title: 'learnings · carnet', agent: 'learnings', version: 1, at_ms: NOW - 5 * MIN, url: '/nowhere/Documents/learnings.md', frame_url: `${pages}/a/learn/view`, new: false },
    ],
  },
];

for (const theme of ['light', 'dark'] as const) {
  test(`artifacts/md-view: a .md artifact draws as a document in the side panel (${theme})`, async () => {
    test.setTimeout(90_000);
    const pages = await pagesServer();
    const core = new FakeCore(world(pages.url, theme) as unknown as ConstructorParameters<typeof FakeCore>[0]);
    const s = await launchDesktop({ core, route: `artifacts/${P}/learn`, size: '1400x900' });
    try {
      const { page } = s;
      await expect(page.getByTestId('artifact.page')).toBeVisible({ timeout: 10_000 });
      const doc = page.frameLocator('[data-testid="artifact.page"]');
      await expect(doc.locator('.md-doc h1')).toHaveText("Ce que bise m'apprend — carnet de findings", { timeout: 10_000 });
      await expect(doc.locator('.md-doc table th').first()).toHaveText('tag');
      await expect(doc.locator('.md-doc table tbody tr')).toHaveCount(4);
      await expect(doc.locator('.md-doc blockquote')).toContainText('Chaque agent a son folder privé');
      await expect(doc.locator('.md-doc')).not.toContainText('| tag |');
      await page.screenshot({ path: test.info().outputPath(`md-${theme}.png`) });
      // 'source': the file as written, and back
      await doc.locator('.md-toggle').click();
      await expect(doc.locator('.md-source')).toContainText('| tag | findings |');
      await expect(doc.locator('.md-doc')).toBeHidden();
      await page.screenshot({ path: test.info().outputPath(`md-${theme}-source.png`) });
      await doc.locator('.md-toggle').click();
      await expect(doc.locator('.md-doc h1')).toBeVisible();
    } finally {
      await s.close();
      pages.server.close();
    }
  });
}
