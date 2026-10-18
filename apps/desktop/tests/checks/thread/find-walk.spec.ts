// thread/find-walk · his words (find-scroll): « ça scroll plus l'historique jusqu'à la mention du
// match de ma recherche quand j'appuie sur entrée ou sur les flèches, ça reste au premier match ».
// A 600-entry thread, the last 50 loaded, 'tangerine' in 6 entries: one loaded but scrolled out of
// view, five far above what is loaded (their page read around them). ⌘F, the word, then ⏎ x3,
// ⇧⏎, ↓, ↑. Passes when, after each key: the count says the right 'n/6', one row is marked, it is
// the expected entry, and it is shown (scrolled into view, hit-testable). The scripted core
// (FakeCore) answers each `page` / `page_after` with its entries and `find` with every hit.
// Owner: find-scroll.
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import type { Page } from '@playwright/test';
import { expectShown } from './shown';

const P = 'acme-1a2b3c4d';
const NOW = 1_791_100_000_000;
const N = 600;
const LIMIT = 50;
const WORD = 'tangerine';
/** The entries holding WORD, oldest first: 570 is loaded but out of view, the others above the window. */
const HITS = [100, 200, 300, 400, 500, 570];

const prefs = {
  ev: 'prefs',
  prefs: { onboarded: true, theme: 'light', context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
};
const agent = (name: string, status: string) => ({ name, main: name === 'main', status, archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW, waits: 0 });
const world = () => [
  prefs,
  {
    ev: 'projects',
    projects: [
      { project: 'bise-home-00000000', name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'storefront', path: '/nowhere/storefront', git: true, home: false, order: 1, agents: 2, working: 0, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/storefront', name: 'storefront' },
  { ev: 'agents', project: P, agents: [agent('main', 'idle'), agent('perf', 'idle')] },
];

/** Entry `pos`'s words: 1 to 4 lines, WORD in the HITS entries. */
function textOf(pos: number): string {
  const n = 1 + ((pos * 7919) % 4);
  const lines = Array.from({ length: n }, (_, i) => `line ${String(i)} of row ${String(pos)}: the build went through the checks`);
  if (HITS.includes(pos)) lines.push(`the ${WORD} note of row ${String(pos)}`);
  return lines.join('\n');
}
/** Entries 299-301: messages from main, folded into one '▸ 3 messages between 2 agents' row. */
const RUN = [299, 300, 301];
const entry = (pos: number) =>
  RUN.includes(pos)
    ? { pos, at_ms: NOW + pos * 1000, kind: 'from_agent', from: 'main', to: 'perf', text: textOf(pos) }
    : { pos, at_ms: NOW + pos * 1000, kind: pos % 3 === 0 ? 'you' : 'agent', text: textOf(pos) };
const range = (a: number, b: number) => Array.from({ length: Math.max(0, b - a) }, (_, i) => entry(a + i));

type Cmd = { cmd: string; agent?: string; before?: number; after?: number; limit?: number; needle?: string; rid?: number };

/** The scripted hub: pages and finds answered as they come. */
class Hub {
  private seen = 0;
  private stop = false;
  constructor(private readonly core: FakeCore) {}
  async serve(): Promise<void> {
    while (!this.stop) {
      const cmds = this.core.cmds() as unknown as Cmd[];
      for (const c of cmds.slice(this.seen)) {
        if (c.agent !== 'perf') continue;
        const limit = c.limit ?? LIMIT;
        if (c.cmd === 'page' && c.before !== undefined) {
          const from = Math.max(1, c.before - limit);
          await this.core.send({ ev: 'thread', project: P, agent: 'perf', entries: range(from, c.before), before: from, more: from > 1 } as never);
        } else if (c.cmd === 'page_after' && c.after !== undefined) {
          const to = Math.min(N + 1, c.after + 1 + limit);
          await this.core.send({ ev: 'thread', project: P, agent: 'perf', entries: range(c.after + 1, to), before: c.after + 1, more: true } as never);
        } else if (c.cmd === 'find' && c.needle !== undefined) {
          const n = c.needle.toLowerCase();
          const hits: { pos: number; n: number }[] = [];
          for (let p = 1; p <= N; p++) if (textOf(p).toLowerCase().includes(n)) hits.push({ pos: p, n: 1 });
          await this.core.send({ ev: 'thread_hits', project: P, agent: 'perf', rid: c.rid, needle: c.needle, hits, upto: N } as never);
        }
      }
      this.seen = cmds.length;
      await new Promise((r) => setTimeout(r, 30));
    }
  }
  end(): void {
    this.stop = true;
  }
}

/** What the list draws now (for a red run's message). */
const drawn = (page: Page) =>
  page.evaluate(() => {
    const ids = Array.from(document.querySelectorAll('[data-testid^="thread.entry."]'), (e) => e.getAttribute('data-testid') ?? '');
    const hit = document.querySelector('[data-testid^="thread.entry."][data-hit]')?.getAttribute('data-testid');
    return `rows ${ids[0] ?? '-'}..${ids.at(-1) ?? '-'} (${String(ids.length)}), marked ${hit ?? 'none'}, count ${document.querySelector('[data-testid="thread.find.count"]')?.textContent ?? '-'}`;
  });

test('thread/find-walk: ⏎, ⇧⏎ and the arrows go to each match and scroll the thread to it', async () => {
  test.setTimeout(120_000);
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/perf` });
  const hub = new Hub(core);
  try {
    const { page } = s;
    hub.serve().catch((e: unknown) => {
      console.error('find-walk: the scripted hub stopped:', e);
    });
    await core.waitCmd((c) => c.cmd === 'subscribe' && (c as unknown as Cmd).agent === 'perf', 10_000);
    await core.send({ ev: 'thread', project: P, agent: 'perf', entries: range(N - LIMIT + 1, N + 1), before: N - LIMIT + 1, more: true } as never);
    await expect(page.getByTestId(`thread.entry.${String(N)}`)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('thread.entry.570'), 'the newest match starts out of view').not.toBeInViewport();

    await page.getByTestId('composer.field').first().click();
    await page.keyboard.press('Meta+f');
    const field = page.getByTestId('thread.find.field');
    await expect(field, '⌘F focuses the find field').toBeFocused();
    const count = page.getByTestId('thread.find.count');
    const marked = page.locator('[data-testid^="thread.entry."][data-hit]');

    /** After a key: the count, the one marked row, and that row on screen. */
    const at = async (what: string, pos: number): Promise<void> => {
      const i = HITS.length - HITS.indexOf(pos);
      await expect(count, `${what}: the count`).toHaveText(`${String(i)}/${String(HITS.length)}`, { timeout: 5000 });
      // red: what the list draws and the last pages asked, in the message (find-walk-red)
      await expect(marked, `${what}: one marked row`)
        .toHaveCount(1, { timeout: 5000 })
        .catch(async (e: unknown) => {
          const asks = (core.cmds() as unknown as Cmd[]).filter((c) => c.agent === 'perf' && c.cmd.startsWith('page')).slice(-6);
          throw new Error(`${String(e)}; ${await drawn(page)}; last pages asked: ${asks.map((c) => `${c.cmd} ${String(c.before ?? c.after)}/${String(c.limit)}`).join(', ')}`);
        });
      await expect(marked, `${what}: the marked row is entry ${String(pos)} (${await drawn(page)})`).toHaveAttribute('data-testid', `thread.entry.${String(pos)}`, { timeout: 5000 });
      await expectShown(marked, `${what}: entry ${String(pos)} scrolled into view (${await drawn(page)})`, 5000);
      await page.screenshot({ path: test.info().outputPath(`${String(pos)}-${what.replace(/\W+/g, '-')}.png`) });
    };

    await page.keyboard.type(WORD);
    await at('typed', 570);
    await page.keyboard.press('Enter');
    await at('⏎ 1', 500);
    await page.keyboard.press('Enter');
    await at('⏎ 2', 400);
    await page.keyboard.press('Enter');
    await at('⏎ 3', 300);
    await page.keyboard.press('Shift+Enter');
    await at('⇧⏎', 400);
    await page.keyboard.press('ArrowDown');
    await at('↓', 500);
    await page.keyboard.press('ArrowUp');
    await at('↑', 400);
    await expect(field, 'the field keeps the focus').toBeFocused();
  } finally {
    hub.end();
    await s.close();
    core.dispose();
  }
});
