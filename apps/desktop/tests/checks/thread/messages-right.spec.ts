// thread/messages-right · designer's messages-right v1 (http://127.0.0.1:47438/p/messages-right;
// the user via main m_16062, ambient-lead m_16065/m_16096). On the REAL thread screen (FakeCore):
// what he said sits on the right of the 720 px column in a soft bubble (at most 75% of the column,
// 85% under 640 px with 48 px kept on the left), no 'you' line; what agents said stays on the left,
// full column. His answer to a card goes right with its dim '✓ you answered …' head; a message to
// someone else than the thread's owner gets a dim 'to perf'; the time shows under the last bubble
// of a 2 min run, on hover for the others. Checked at 1100 and 600 px, light and dark. Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'shop-ab9f3c3b';
const NOW = Date.now();
const MIN = 60_000;
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const ag = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 9 * MIN, waits: 0 });
const world = () => [
  prefs('light'),
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'shop', path: '/nowhere/shop', git: true, home: false, order: 1, agents: 2, working: 0, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/shop', name: 'shop' },
  { ev: 'agents', project: P, agents: [ag('main'), ag('perf')] },
  {
    ev: 'thread',
    project: P,
    agent: 'main',
    entries: [
      { pos: 1, at_ms: NOW - 30 * MIN, kind: 'you', text: 'the checkout gets slower every friday afternoon. can you find why? it was fine last month, and nothing in the cart code changed since.' },
      { pos: 2, at_ms: NOW - 28 * MIN, kind: 'agent', text: "the image pipeline ships 2 MB thumbnails to phones since tuesday's change. the cache is fine." },
      // a run of two within 2 min: the time under the second only
      { pos: 3, at_ms: NOW - 20 * MIN, kind: 'you', text: 'cap them at 400 KB' },
      { pos: 4, at_ms: NOW - 19 * MIN, kind: 'you', text: 'and show me before / after on a phone and a tablet' },
      { pos: 5, at_ms: NOW - 15 * MIN, kind: 'agent', text: 'perf and search are both on storefront.' },
      // to someone else than the thread's owner: a dim 'to perf' over it
      { pos: 6, at_ms: NOW - 12 * MIN, kind: 'you', to: 'perf', text: 'keep the 400 KB cap for the tablets too' },
      { pos: 7, at_ms: NOW - 10 * MIN, kind: 'agent', text: 'perf asks: merge the cap into main? 1. merge 2. not yet' },
      // his answer to a card: his side, '✓ you answered perf' over his words
      { pos: 8, at_ms: NOW - 8 * MIN, kind: 'approval', text: 'you answered perf: 1 · merge', approval: { ok: true, text: 'you answered perf: 1 · merge' } },
      { pos: 9, at_ms: NOW - 6 * MIN, kind: 'agent', text: 'merged. the thumbnails are 380 KB now.' },
    ],
    before: null,
    more: false,
  },
];

test('thread/messages-right: his words on the right in a bubble, agents on the left, at 1100 and 600, light and dark', async () => {
  test.setTimeout(120_000);
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `project/${P}`, size: '1100x760' });
  try {
    const { page } = s;
    await expect(page.getByTestId('thread.you.1')).toBeVisible({ timeout: 10_000 });
    const win = await s.app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().sort((a, b) => (b.getSize()[0] ?? 0) - (a.getSize()[0] ?? 0))[0]?.id ?? -1);
    const size = async (w: number) => {
      // under the window's 680 px floor too: designer's < 640 px case
      await s.app.evaluate(({ BrowserWindow }, [id, w2]) => {
        const bw = BrowserWindow.fromId(id ?? -1);
        bw?.setMinimumSize(400, 400);
        bw?.setContentSize(w2 ?? 0, 760);
      }, [win, w]);
      await expect.poll(() => page.evaluate(() => window.innerWidth), { timeout: 5000 }).toBe(w);
      await page.waitForTimeout(200);
    };
    const theme = async (t: 'light' | 'dark') => {
      await core.send(prefs(t) as never);
      await expect.poll(() => page.evaluate(() => document.documentElement.dataset['theme']), { timeout: 5000 }).toBe(t);
      await page.waitForTimeout(200);
    };
    // every row's box against its column (the row is the column's width)
    const boxes = () =>
      page.evaluate(() =>
        Array.from(document.querySelectorAll<HTMLElement>('[data-testid="thread.list"] .th-row[data-side]')).map((row) => {
          const col = row.getBoundingClientRect();
          const bubble = row.querySelector<HTMLElement>('.th-bubble');
          const msg = row.querySelector<HTMLElement>('.b-msg');
          const b = (bubble ?? msg)?.getBoundingClientRect();
          return {
            id: row.dataset['testid'] ?? '',
            side: row.dataset['side'] ?? '',
            col: { left: col.left, right: col.right, width: col.width },
            box: b === undefined ? null : { left: b.left, right: b.right, width: b.width },
            who: Array.from(row.querySelectorAll('.b-who b')).map((x) => x.textContent),
          };
        }),
      );
    for (const t of ['light', 'dark'] as const) {
      await theme(t);
      for (const w of [1100, 600]) {
        await size(w);
        const rows = await boxes();
        const his = rows.filter((r) => r.side === 'you');
        const theirs = rows.filter((r) => r.side === 'them');
        expect(his.map((r) => r.id), `${t} ${String(w)}: his rows on his side`).toEqual(['thread.entry.1', 'thread.entry.3', 'thread.entry.4', 'thread.entry.6', 'thread.entry.8']);
        for (const r of his) {
          expect.soft(r.box, `${t} ${String(w)} ${r.id}: a bubble`).not.toBeNull();
          if (r.box === null) continue;
          expect.soft(Math.abs(r.box.right - r.col.right), `${t} ${String(w)} ${r.id}: on the column's right edge`).toBeLessThanOrEqual(1);
          const most = w < 640 ? Math.min(0.85 * r.col.width, r.col.width - 48) : 0.75 * r.col.width;
          expect.soft(r.box.width, `${t} ${String(w)} ${r.id}: at most ${w < 640 ? '85% (48 px kept left)' : '75%'} of the column`).toBeLessThanOrEqual(most + 1);
          expect.soft(r.who, `${t} ${String(w)} ${r.id}: no 'you' line`).toEqual([]);
        }
        for (const r of theirs) {
          if (r.box === null) continue;
          expect.soft(Math.abs(r.box.left - r.col.left), `${t} ${String(w)} ${r.id}: agents on the column's left edge`).toBeLessThanOrEqual(1);
        }
        // the long first message fills its 75% (85%) and wraps, never the column
        const first = his[0]?.box;
        if (first) expect.soft(first.width, `${t} ${String(w)}: a long message takes its whole width`).toBeGreaterThan((w < 640 ? 0.7 : 0.6) * (his[0]?.col.width ?? 0));
        await page.mouse.move(1, 300);
        await page.screenshot({ path: test.info().outputPath(`right-${t}-${String(w)}.png`) });
      }
    }
    await size(1100);
    // the time: under the last bubble of a 2 min run; on hover for the one before
    const op = (id: string) => page.getByTestId(id).evaluate((e) => Number(getComputedStyle(e).opacity));
    expect(await op('thread.you.4.under'), 'the last of the run shows its time').toBe(1);
    expect(await op('thread.you.3.under'), 'inside a run, the time waits for a hover').toBe(0);
    await page.getByTestId('thread.you.3').hover();
    await expect.poll(() => op('thread.you.3.under'), { timeout: 2000 }).toBe(1);
    // to someone else than the thread's owner: 'to perf'; to the owner: nothing
    await expect(page.getByTestId('thread.you.6.head')).toHaveText('to perf');
    await expect(page.getByTestId('thread.you.1.head')).toHaveCount(0);
    // his answer to a card: '✓ you answered perf' dim over his words
    await expect(page.getByTestId('thread.approval.8.head')).toHaveText('✓you answered perf');
    await expect(page.getByTestId('thread.approval.8.words')).toHaveText('1 · merge');
  } finally {
    await s.close();
    core.dispose();
  }
});
