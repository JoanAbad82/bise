// gate/counts · TOOLCOUNT's cases the rich world doesn't have (ambient-lead m_17195, amb-home 29ec1b92): on the real
// thread screen (FakeCore, fake data), an edit of one file reads '± Hero.tsx' with '+18 −6' dim after it, a move
// reads both names '± old.rs → new.rs', an edit of several files reads '± a.rs and 2 more' with the sum of their
// lines, and a command has no counts. Crops of each line at 1100 and 600, light and dark, for designer's sheet:
// BISE_COUNTS_OUT/counts-<theme>-<width>-<case>.png, plus index.md (appended). Owner of the feature: amb-home.
import { appendFileSync, mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const OUT = process.env['BISE_COUNTS_OUT'] ?? path.join(os.homedir(), '.bise', 'gate', 'try-gate', 'counts');
const P = 'acme-1a2b3c4d';
const NOW = Date.now();
const MIN = 60_000;
const ag = (name: string) => ({ name, dir: name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 90 * MIN, waits: 0 });
const item = (pos: number, text: string, kind: string, files?: { path: string; add: number; del: number }[]) => ({ pos, at_ms: NOW - 7 * MIN + pos * 1000, text, kind, state: 'ok', ms: 120, ...(files ? { files } : {}) });
const CASES = [
  { pos: 42, name: 'one', words: '± Hero.tsx', count: '+18 −6' },
  { pos: 43, name: 'move', words: '± old.rs → new.rs', count: '+2 −1' },
  { pos: 44, name: 'several', words: '± a.rs and 2 more', count: '+9 −4' },
  { pos: 45, name: 'command', words: '$ cargo test', count: null },
] as const;
const world = (theme: string) => [
  { ev: 'prefs', prefs: { onboarded: true, theme } },
  { ev: 'projects', projects: [{ project: P, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 0, agents: 2, working: 0, waits: 0, running: true }] },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/acme', name: 'acme' },
  { ev: 'agents', project: P, agents: [ag('main'), ag('perf')] },
  {
    ev: 'thread',
    project: P,
    agent: 'perf',
    entries: [
      { pos: 1, at_ms: NOW - 9 * MIN, kind: 'you', text: 'make the hero lighter and move the old parser' },
      {
        pos: 41,
        at_ms: NOW - 7 * MIN,
        kind: 'tools',
        text: 'edited 5 files, ran 1 command',
        tools: {
          count: 4,
          summary: 'edited 5 files, ran 1 command',
          items: [
            item(42, 'edit: {"file_path":"web/Hero.tsx"}', 'edit', [{ path: 'web/Hero.tsx', add: 18, del: 6 }]),
            item(43, 'edit: {"file_path":"src/new.rs"}', 'edit', [{ path: 'src/old.rs → src/new.rs', add: 2, del: 1 }]),
            item(44, 'edit: {"file_path":"src/a.rs"}', 'edit', [{ path: 'src/a.rs', add: 5, del: 1 }, { path: 'src/b.rs', add: 3, del: 2 }, { path: 'src/c.rs', add: 1, del: 1 }]),
            item(45, 'bash: {"command":"cargo test"}', 'run'),
          ],
        },
      },
      { pos: 50, at_ms: NOW - 6 * MIN, kind: 'agent', text: 'Done: the hero is lighter and the parser moved.' },
    ],
    before: null,
    more: false,
  },
];

test("gate/counts: '± file +a −d', a move, 'x and N more', none on a command; 1100 + 600, light + dark", async () => {
  test.setTimeout(120_000);
  mkdirSync(OUT, { recursive: true });
  const rows: string[] = [`\n## gate/counts (${new Date().toISOString()})\n`, '| case | theme · width | line | counts | counts ink vs words ink |', '|---|---|---|---|---|'];
  try {
    for (const theme of ['light', 'dark'] as const) {
      const core = new FakeCore(world(theme) as unknown as ConstructorParameters<typeof FakeCore>[0]);
      const s = await launchDesktop({ core, route: `agent/${P}/perf`, size: '1100x760' });
      try {
        const { page } = s;
        for (const width of [1100, 600]) {
          await s.app.evaluate(({ BrowserWindow }, w) => {
            for (const b of BrowserWindow.getAllWindows()) if (b.webContents.getURL().includes('index.html')) b.setContentSize(w, 760);
          }, width);
          await page.waitForTimeout(500);
          // the tools row may come folded: open it so every line shows
          const lines = page.locator('[data-testid="thread.toolrow.41"] .th-tool-line');
          if ((await lines.count()) < CASES.length) await page.getByTestId('thread.tools.41').click().catch(() => undefined);
          await expect(lines).toHaveCount(CASES.length, { timeout: 10_000 });
          await page.screenshot({ path: path.join(OUT, `counts-${theme}-${String(width)}.png`) });
          for (const c of CASES) {
            const line = page.getByTestId(`thread.tool.${String(c.pos)}`);
            await expect(line).toContainText(c.words);
            const count = page.getByTestId(`thread.tool.${String(c.pos)}.count`);
            const shown = (await count.count()) > 0 ? (await count.innerText()).trim() : '';
            if (c.count === null) expect(shown, `${c.name}: a command has no counts`).toBe('');
            else expect(shown, `${c.name}: the counts`).toBe(c.count);
            const inks = c.count === null ? 'none' : `${await count.evaluate((e) => getComputedStyle(e).color)} vs ${await line.locator('.th-tool-text').evaluate((e) => getComputedStyle(e).color)}`;
            await line.screenshot({ path: path.join(OUT, `counts-${theme}-${String(width)}-${c.name}.png`) });
            rows.push(`| ${c.name} | ${theme} · ${String(width)} | ${(await line.innerText()).replace(/\s+/g, ' ').trim()} | ${shown || '(none)'} | ${inks} |`);
          }
        }
      } finally {
        await s.close();
        core.dispose();
      }
    }
  } finally {
    appendFileSync(path.join(OUT, 'index.md'), `${rows.join('\n')}\n`);
  }
});
