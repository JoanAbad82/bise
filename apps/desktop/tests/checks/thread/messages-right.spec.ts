// thread/messages-right · designer's messages-right v1 (http://127.0.0.1:47438/p/messages-right;
// the user via main m_16062, ambient-lead m_16065/m_16096). On the REAL thread screen (FakeCore):
// what he said sits on the right of the 720 px column in a soft bubble (at most 75% of the column,
// 85% under 640 px with 48 px kept on the left), no 'you' line; what agents said stays on the left,
// full column. His answer to a card goes right with its dim '✓ you answered …' head; a message to
// someone else than the thread's owner gets a dim 'to perf'; the time shows on hover only (H12).
// Checked at 1100 and 600 px, light and dark. Owner: amb-win.
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
  // a message the hub holds until main's turn ends (rows::Agent.queued): a dashed bubble at the bottom
  { ev: 'agents', project: P, agents: [{ ...ag('main'), queued: [{ id: 1, text: 'then open a PR', created_ms: NOW - MIN }] }, ag('perf')] },
  {
    ev: 'thread',
    project: P,
    agent: 'main',
    entries: [
      { pos: 1, at_ms: NOW - 30 * MIN, kind: 'you', text: 'the checkout gets slower every friday afternoon. can you find why? it was fine last month, and nothing in the cart code changed since.' },
      { pos: 2, at_ms: NOW - 28 * MIN, kind: 'agent', text: "the image pipeline ships 2 MB thumbnails to phones since tuesday's change. the cache is fine." },
      // a run of two within 2 min: their times on hover only (H12)
      { pos: 3, at_ms: NOW - 20 * MIN, kind: 'you', text: 'cap them at 400 KB' },
      { pos: 4, at_ms: NOW - 19 * MIN, kind: 'you', text: 'and show me before / after on a phone and a tablet' },
      { pos: 5, at_ms: NOW - 15 * MIN, kind: 'agent', text: 'perf and search are both on storefront.' },
      // to someone else than the thread's owner: a dim 'to perf' over it
      { pos: 6, at_ms: NOW - 12 * MIN, kind: 'you', to: 'perf', text: 'keep the 400 KB cap for the tablets too' },
      { pos: 7, at_ms: NOW - 10 * MIN, kind: 'agent', text: 'perf asks: merge the cap into main? 1. merge 2. not yet' },
      // his answer to a card: his side, '✓ you answered perf' over his words
      { pos: 8, at_ms: NOW - 8 * MIN, kind: 'approval', text: 'you answered perf: 1 · merge', approval: { ok: true, text: 'you answered perf: 1 · merge' } },
      { pos: 9, at_ms: NOW - 6 * MIN, kind: 'agent', text: 'merged. the thumbnails are 380 KB now.' },
      // a steer (amb-tools' 7335fde7 seed, qa-native m_16425): written while the bench ran, so its
      // pos is before the bench's; the hub's receipt (steered_at 11) says the agent read it after
      // the bench: it shows there, between the two benches (amb-feed 9633cd2a)
      { pos: 10, at_ms: NOW - 5 * MIN + 1000, kind: 'you', text: 'also try webp', msg_id: 41, steered_at: 11 },
      { pos: 11, at_ms: NOW - 5 * MIN, kind: 'tools', text: 'ran 1 command', tools: { count: 1, summary: 'ran 1 command', items: [{ pos: 11, at_ms: NOW - 5 * MIN, text: 'pnpm bench', kind: 'run', state: 'ok', ms: 6000 }] } },
      { pos: 12, at_ms: NOW - 4 * MIN + 2000, kind: 'tools', text: 'ran 1 command', tools: { count: 1, summary: 'ran 1 command', items: [{ pos: 12, at_ms: NOW - 4 * MIN + 2000, text: 'pnpm bench --webp', kind: 'run', state: 'ok', ms: 4000 }] } },
      { pos: 13, at_ms: NOW - 3 * MIN, kind: 'agent', text: 'webp saves another 30%, as you asked mid-way.' },
      // a quote he sent: first in his bubble, its rail and source, from its typed parts (the
      // window never parses the text's <selection>, delta review D1)
      {
        pos: 14,
        at_ms: NOW - 2 * MIN,
        kind: 'you',
        text: '<selection from="main">\nwebp saves another 30%.\n</selection>\nis that on the tablets too?',
        parts: [
          { kind: 'quote', from: 'main', text: 'webp saves another 30%.' },
          { kind: 'text', text: 'is that on the tablets too?' },
        ],
      },
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
        expect(his.map((r) => r.id), `${t} ${String(w)}: his rows on his side`).toEqual(['thread.entry.1', 'thread.entry.3', 'thread.entry.4', 'thread.entry.6', 'thread.entry.8', 'thread.entry.10', 'thread.entry.14']);
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
    // at the bottom while the list rests there (the virtual list draws what shows): a quote, its
    // source and text first in his bubble, then his words, never the raw tag; a queued bubble
    // the source by the name the thread shows ('bise' for a main, designer m_16360), as the steer and queued words
    await expect(page.getByTestId('thread.you.14.quote.1')).toContainText('bise');
    await expect(page.getByTestId('thread.you.10.under')).toHaveText('steered · bise read it mid-turn');
    await expect(page.getByTestId('thread.you.14.quote.1')).toContainText('webp saves another 30%.');
    expect(await page.getByTestId('thread.you.14').innerText()).not.toContain('<selection');
    // queued: never a bubble in the thread, the composer's drawer (thread/queue-drawer.spec.ts)
    await expect(page.locator('[data-testid^="thread.queued."]')).toHaveCount(0);
    await expect(page.getByTestId('composer.queue.1.text')).toHaveText('then open a PR');
    await page.mouse.move(1, 300);
    // the loop above ends on dark: light first, for real (designer m_16360: it was dark twice)
    await theme('light');
    await page.screenshot({ path: test.info().outputPath('cases-light-1100.png') });
    await core.send(prefs('dark') as never);
    await page.waitForTimeout(300);
    await page.screenshot({ path: test.info().outputPath('cases-dark-1100.png') });
    // the time (H12, designer m_19832): never under his bubbles, the last of a run included; on hover only
    const op = (id: string) => page.getByTestId(id).evaluate((e) => Number(getComputedStyle(e).opacity));
    expect(await op('thread.you.4.under'), 'the last of the run: its time waits for a hover too').toBe(0);
    expect(await op('thread.you.3.under'), 'inside a run, the time waits for a hover').toBe(0);
    await page.getByTestId('thread.you.3').hover();
    await expect.poll(() => op('thread.you.3.under'), { timeout: 2000 }).toBe(1);
    await page.getByTestId('thread.you.4').hover();
    await expect.poll(() => op('thread.you.4.under'), { timeout: 2000 }).toBe(1);
    // to someone else than the thread's owner: 'to perf'; to the owner: nothing
    await expect(page.getByTestId('thread.you.6.head')).toHaveText('to perf');
    await expect(page.getByTestId('thread.you.1.head')).toHaveCount(0);
    // his answer to a card: '✓ you answered perf' dim over his words
    await expect(page.getByTestId('thread.approval.8.head')).toHaveText('✓you answered perf');
    await expect(page.getByTestId('thread.approval.8.words')).toHaveText('1 · merge');
    // designer m_16246: the bottom-right corner 6 px, the others 16; a run's bubbles 4 px apart
    const corners = await page.getByTestId('thread.you.1').locator('.th-bubble').evaluate((b) => {
      const s = getComputedStyle(b);
      return [s.borderTopLeftRadius, s.borderTopRightRadius, s.borderBottomRightRadius, s.borderBottomLeftRadius];
    });
    expect(corners).toEqual(['16px', '16px', '6px', '16px']);
    const gap = await page.evaluate(() => {
      const a = document.querySelector('[data-testid="thread.you.3"] .th-bubble')?.getBoundingClientRect();
      const b = document.querySelector('[data-testid="thread.you.4"] .th-bubble')?.getBoundingClientRect();
      return a && b ? b.top - a.bottom : -1;
    });
    expect(Math.round(gap), "a run's bubbles 4 px apart").toBe(4);
    // a steer: 'steered · bise read it mid-turn' under it (bise: this is shop's main, named bise);
    // the list is virtual: walk it from the top down until its row is drawn (taller rows since the
    // tiers' 20 px heads, it can be above or below what the checks before left in view)
    for (let i = 0; i < 40 && (await page.getByTestId('thread.you.10').count()) === 0; i++) {
      await page.evaluate((step) => {
        const el = document.querySelector('.th-list [data-virtuoso-scroller="true"]');
        if (el) el.scrollTop = step * 150;
      }, i);
      await page.waitForTimeout(100);
    }
    await expect(page.getByTestId('thread.you.10.under')).toHaveText(/^steered · \S+ read it mid-turn$/u);
    // where the agent read it: after the first bench (tools 11), before the second (tools 12)
    // (the list is virtual: the steer is brought to the middle so both benches are drawn)
    await page.getByTestId('thread.you.10').evaluate((el) => { el.scrollIntoView({ block: 'center' }); });
    await expect(page.getByTestId('thread.toolrow.12')).toBeVisible();
    const ys = await page.evaluate(() => ['thread.toolrow.11', 'thread.you.10', 'thread.toolrow.12'].map((id) => document.querySelector(`[data-testid="${id}"]`)?.getBoundingClientRect().top ?? -1));
    expect(ys[0] ?? -1, 'the first bench is drawn').toBeGreaterThan(0);
    expect((ys[0] ?? 0) < (ys[1] ?? 0) && (ys[1] ?? 0) < (ys[2] ?? 0), `bench 11, the steer, bench 12, top to bottom (${ys.join(', ')})`).toBe(true);
  } finally {
    await s.close();
    core.dispose();
  }
});
