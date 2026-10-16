// thread/wake · event-wake in the window (designer's page event-wake, ambient-lead m_17770; hub
// side wake-ui, TS bedb99c2). On the REAL screens (FakeCore): perf ran a command in the background
// and waits for it, so it doesn't look idle: its right bar row says '…' in ink and 'for 2 min' on the
// right; its head a dim chip '… waiting for 2 min' instead of 'idle'; its thread ends on the line
// 'waiting for 2 min · cargo bench' (desktop-status-line A: the state first, the note after). Earlier watches' ends are the hub's wake lines: 'cargo test ended · rc 101 · after
// 3m10s' with only 'rc 101' in the error tone, '▸ its last 2 lines' folded (a click opens them),
// 'rc 0' never red, '– stopped waiting for the reindex'. Never the accent, nothing in the inbox.
// Light and dark at 1100, one frame each. Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import { thread } from '../../../src/proto/words.gen';

const P = 'acme-1a2b3c4d';
const NOW = Date.now();
const MIN = 60_000;
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const ag = (name: string, over: Record<string, unknown> = {}) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 30 * MIN, waits: 0, watching: [], ...over });
const tool = (pos: number, at: number, text: string) => ({ pos, at_ms: at, kind: 'tools', text: thread.did_run({ n: 1 }), tools: { count: 1, summary: thread.did_run({ n: 1 }), items: [{ pos, at_ms: at, text, kind: 'run', state: 'ok', ms: 300 }] } });
const world = () => [
  prefs('light'),
  {
    ev: 'projects',
    projects: [
      { project: 'bise-home-00000000', name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 1, agents: 3, working: 1, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/acme', name: 'acme' },
  {
    ev: 'agents',
    project: P,
    agents: [
      ag('main'),
      // waits for its background bench since 2 min: not idle
      ag('perf', { purpose: 'product page speed', watching: [{ id: 9, kind: 'bg', what: 'cargo bench', since_ms: NOW - 2 * MIN - 5000, resumes: true }] }),
      ag('search', { status: 'working', title: 'reindexing', since_ms: NOW - 4 * MIN }),
    ],
  },
  {
    ev: 'thread',
    project: P,
    agent: 'perf',
    entries: [
      { pos: 1, at_ms: NOW - 20 * MIN, kind: 'agent', text: 'the cache fix is in. the full test suite takes a few minutes, i run it and come back.' },
      tool(2, NOW - 20 * MIN, 'cargo test -p storefront --release'),
      { pos: 3, at_ms: NOW - 17 * MIN, kind: 'wake', text: 'cargo test ended · rc 101 · after 3m10s', wake: { id: 3, ev: 'ended', kind: 'bg', what: 'cargo test', rc: 101, after_ms: 190_000, tail: ['test cart::total ... FAILED', 'test result: FAILED. 210 passed; 2 failed'] } },
      { pos: 4, at_ms: NOW - 17 * MIN, kind: 'agent', text: '2 tests fail in cart::total. i look.' },
      { pos: 5, at_ms: NOW - 9 * MIN, kind: 'wake', text: 'cargo test ended · rc 0 · after 2m04s', wake: { id: 5, ev: 'ended', kind: 'bg', what: 'cargo test', rc: 0, after_ms: 124_000, tail: ['test cart::total ... ok', 'test checkout::pay ... ok', 'test result: ok. 212 passed; 0 failed'] } },
      { pos: 6, at_ms: NOW - 9 * MIN, kind: 'agent', text: 'all 212 tests pass. i stop watching the reindex and run the bench.' },
      { pos: 7, at_ms: NOW - 8 * MIN, kind: 'wake', text: thread.wake_stopped({ what: 'the reindex' }), wake: { id: 7, ev: 'stopped', kind: 'pid', what: 'the reindex', noted: true, after_ms: 60_000 } },
      tool(8, NOW - 2 * MIN - 5000, 'cargo bench'),
    ],
    before: null,
    more: false,
  },
];

test('thread/wake: an agent waiting for an event says what and how long; its wake lines, only a failing rc red', async () => {
  test.setTimeout(90_000);
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/perf`, size: '1100x760' });
  try {
    const { page } = s;
    await expect(page.getByTestId('thread.wake.7')).toBeVisible({ timeout: 10_000 });
    const color = (sel: string) => page.locator(sel).first().evaluate((el) => getComputedStyle(el).color);
    const token = (name: string) =>
      page.evaluate((n) => {
        const probe = document.createElement('span');
        probe.style.color = `var(${n})`;
        document.body.appendChild(probe);
        const c = getComputedStyle(probe).color;
        probe.remove();
        return c;
      }, name);
    for (const t of ['light', 'dark'] as const) {
      await core.send(prefs(t) as never);
      await expect.poll(() => page.evaluate(() => document.documentElement.dataset['theme']), { timeout: 5000 }).toBe(t);
      const accent = await token('--c-accent');
      // the sidebar: '…' in ink, its wait's age on the right, what it waits for on hover
      const row = page.getByTestId('app.right.agent.perf');
      await expect(row.locator('.app-rb-g')).toHaveText('…');
      await expect(row.locator('.app-rb-end')).toHaveText('2 min');
      await expect(row).toHaveAttribute('title', /^continues when cargo bench ends · running for 2 min · /u);
      expect(await color('[data-testid="app.right.agent.perf"] .app-rb-g'), `${t}: '…' in ink`).toBe(await token('--c-text'));
      expect(await color('[data-testid="app.right.agent.perf"] .app-rb-g'), `${t}: never the accent`).not.toBe(accent);
      // the head: a dim chip, since when, not 'idle'
      await expect(page.getByTestId('thread.head.state')).toHaveText(thread.chip_paused({ len: '2 min' }));
      // the thread's end: the state first, then what for, dim
      await expect(page.getByTestId('thread.waiting')).toHaveText('continues when cargo bench ends · running for 2 min');
      await expect(page.getByTestId('thread.waiting')).toHaveAttribute('title', 'continues when cargo bench ends · running for 2 min');
      expect(await color('[data-testid="thread.waiting"]'), `${t}: the live line dim`).toBe(await token('--c-text-2'));
      // the wake lines: the hub's words, only a non-zero rc in the error tone
      await expect(page.getByTestId('thread.wake.3')).toContainText('cargo test ended · rc 101 · after 3m10s');
      expect(await color('[data-testid="thread.wake.3"] [data-err]'), `${t}: rc 101 red`).toBe(await token('--c-err'));
      await expect(page.locator('[data-testid="thread.wake.5"] [data-err]'), 'rc 0 is never red').toHaveCount(0);
      expect(await color('[data-testid="thread.wake.5"]'), `${t}: a wake line dim`).toBe(await token('--c-text-2'));
      await expect(page.getByTestId('thread.wake.7')).toHaveText(/^–\s*stopped waiting for the reindex$/u);
      await expect(page.getByTestId('thread.wake.3.fold')).toContainText(thread.wake_tail({ n: 2 }));
      await expect(page.getByTestId('thread.wake.5.fold')).toContainText(thread.wake_tail({ n: 3 }));
      await expect(page.getByTestId('thread.wake.7.fold')).toHaveCount(0);
      await page.mouse.move(1, 300);
      await page.waitForTimeout(200);
      await page.screenshot({ path: test.info().outputPath(`wake-${t}-1100.png`) });
    }
    // designer m_17827: (1) the composer's label never says 'idle', nor the wait the line over it
    // says already (desktop-status-line A); (2) a turn that opens on its work keeps a new turn's gap
    // under a wake line; (3) a blank row over the live line
    // (no model, effort or mode in this world: the label line is 'to perf' alone)
    await expect(page.getByTestId('composer.tab.to')).toHaveText(/^to perf/u);
    await expect(page.getByTestId('composer.tab')).not.toHaveText(/waiting|idle/u);
    const gaps = await page.evaluate(() => {
      const txt = (id: string) => {
        const el = document.querySelector(`[data-testid="${id}"]`);
        if (el === null) return { top: 0, bottom: 0 };
        const range = document.createRange();
        range.selectNodeContents(el);
        const b = range.getBoundingClientRect();
        return { top: b.top, bottom: b.bottom };
      };
      // H2 (designer m_21404 (3)): a turn that opens on a tool row has its name line over it; the
      // turn's gap stays under the wake line either way
      return { underWake: txt('thread.toolrow.8').top - txt('thread.wake.7').bottom, overLive: txt('thread.waiting').top - txt('thread.toolrow.8').bottom };
    });
    expect(gaps.underWake, "the next turn's first row sits a turn's gap under the wake line").toBeGreaterThanOrEqual(10);
    expect(gaps.overLive, 'a blank row over the live line').toBeGreaterThanOrEqual(14);
    // the fold opens the output, mono
    await page.getByTestId('thread.wake.3.fold').click();
    await expect(page.getByTestId('thread.wake.3').locator('.th-wake-out')).toHaveText('test cart::total ... FAILED\ntest result: FAILED. 210 passed; 2 failed');
    await page.mouse.move(1, 300);
    await page.screenshot({ path: test.info().outputPath('wake-open-dark-1100.png') });
    // nothing in the inbox: it doesn't wait on him
    await expect(page.locator('[data-testid^="strip.row."]')).toHaveCount(0);
    // the watch ends: no more live line, the head says idle again
    await core.send({ ev: 'agents', project: P, agents: [ag('main'), ag('perf', { purpose: 'product page speed' }), ag('search', { status: 'working', title: 'reindexing', since_ms: NOW - 4 * MIN })] } as never);
    await expect(page.getByTestId('thread.waiting')).toHaveCount(0);
    await expect(page.getByTestId('thread.head.state')).toHaveText('idle');
  } finally {
    await s.close();
  }
});
