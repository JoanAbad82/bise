// thread/delivery · his message's delivery mark (designer's messages-right v3 tab 'got it, read it',
// ambient-lead m_17135/m_17142, qa-native's STEERRX; the TUI's render.rs mark_span). On the REAL
// thread screen (FakeCore): after the time under the last bubble of his run, '✓' faint when the
// agent got it (busy, it waits for its next step), '✓✓' dim when it read it, never the accent, with a
// tooltip '<agent> got it' / '<agent> read it'; a message to someone else names that agent; sent shows
// the time alone; a steered one's 'steered · … read it mid-turn' line is its ✓✓ (no mark); a failed
// one says '▲ not sent' in the error tone; earlier bubbles of a run show time + mark on hover.
// Light and dark, 1100 and 600. Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import { thread } from '../../../src/proto/words.gen';

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
      { project: 'bise-home-00000000', name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
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
      // sent while bise was idle: straight to read
      { pos: 1, at_ms: NOW - 30 * MIN, kind: 'you', msg_id: 11, delivery: 'read', text: 'why is the checkout slow on fridays?' },
      { pos: 2, at_ms: NOW - 28 * MIN, kind: 'agent', text: 'the image pipeline ships 2 MB thumbnails to phones.' },
      // a run of two: the first's time + mark on hover, the last's always
      { pos: 3, at_ms: NOW - 20 * MIN, kind: 'you', msg_id: 12, delivery: 'read', text: 'cap them at 400 KB' },
      { pos: 4, at_ms: NOW - 19 * MIN, kind: 'you', msg_id: 13, delivery: 'read', text: 'and show me before / after' },
      { pos: 5, at_ms: NOW - 15 * MIN, kind: 'agent', text: 'running the bench three more times…' },
      // to perf, from bise's thread: perf got it (busy)
      { pos: 6, at_ms: NOW - 12 * MIN, kind: 'you', to: 'perf', msg_id: 14, delivery: 'received', text: 'keep the cap for the tablets too' },
      { pos: 7, at_ms: NOW - 10 * MIN, kind: 'agent', text: 'merged. the thumbnails are 380 KB now.' },
      // a steer: its line is its ✓✓
      { pos: 8, at_ms: NOW - 6 * MIN + 1000, kind: 'you', msg_id: 15, delivery: 'read', steered_at: 9, text: 'also try webp' },
      { pos: 9, at_ms: NOW - 6 * MIN, kind: 'tools', text: thread.did_run({ n: 1 }), tools: { count: 1, summary: thread.did_run({ n: 1 }), items: [{ pos: 9, at_ms: NOW - 6 * MIN, text: 'pnpm bench', kind: 'run', state: 'ok', ms: 6000 }] } },
      { pos: 10, at_ms: NOW - 5 * MIN, kind: 'agent', text: 'webp saves another 30%.' },
      // a failed one: '▲ not sent' in the error tone
      { pos: 11, at_ms: NOW - 4 * MIN, kind: 'you', msg_id: 16, delivery: 'failed', text: 'and tell launch' },
      { pos: 12, at_ms: NOW - 3 * MIN, kind: 'agent', text: 'on it.' },
      // got it, busy
      { pos: 13, at_ms: NOW - 2 * MIN, kind: 'you', msg_id: 17, delivery: 'received', text: 'ship it' },
      { pos: 14, at_ms: NOW - 1 * MIN, kind: 'agent', text: 'shipping.' },
      // sent, not got yet: the time alone
      { pos: 15, at_ms: NOW - 30_000, kind: 'you', msg_id: 18, delivery: 'sent', text: 'and the changelog' },
    ],
    before: null,
    more: false,
  },
];

test("thread/delivery: ✓ got it faint, ✓✓ read it dim after the time under his bubble, the agent's name in its tooltip", async () => {
  test.setTimeout(120_000);
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `project/${P}`, size: '1100x760' });
  try {
    const { page } = s;
    await expect(page.getByTestId('thread.you.15')).toBeVisible({ timeout: 10_000 });
    const mark = (pos: number) => page.getByTestId(`thread.you.${String(pos)}.mark`);
    const under = (pos: number) => page.getByTestId(`thread.you.${String(pos)}.under`);
    const color = (pos: number) => mark(pos).evaluate((el) => getComputedStyle(el).color);
    const token = (name: string) =>
      page.evaluate((n) => {
        const probe = document.createElement('span');
        probe.style.color = `var(${n})`;
        document.querySelector('.th-you')?.appendChild(probe);
        const c = getComputedStyle(probe).color;
        probe.remove();
        return c;
      }, name);
    const check = async (t: string) => {
      // the bottom rows (the virtual list draws what shows)
      await expect(mark(13)).toHaveText('✓');
      await expect(mark(13)).toHaveAttribute('title', thread.got_it({ who: 'bise' }));
      await expect(under(13)).toHaveText(/^\d\d:\d\d ✓$/u);
      await expect(mark(11)).toHaveText(thread.not_sent);
      await expect(mark(15), `${t}: sent shows the time alone`).toHaveCount(0);
      await expect(under(15)).toHaveText(/^\d\d:\d\d$/u);
      expect(await color(13), `${t}: ✓ faint`).toBe(await token('--c-text-3'));
      expect(await color(11), `${t}: not sent in the error tone`).toBe(await token('--c-err'));
      const accent = await token('--c-accent');
      expect(await color(13), `${t}: never the accent`).not.toBe(accent);
      // the steer: its line is its ✓✓, no mark
      await page.getByTestId('thread.you.8').evaluate((el) => { el.scrollIntoView({ block: 'center' }); });
      await expect(under(8)).toHaveText(/^steered · \S+ read it mid-turn$/u);
      await expect(mark(8)).toHaveCount(0);
      // to perf: perf got it
      await page.getByTestId('thread.you.6').evaluate((el) => { el.scrollIntoView({ block: 'center' }); });
      await expect(mark(6)).toHaveText('✓');
      await expect(mark(6)).toHaveAttribute('title', thread.got_it({ who: 'perf' }));
      // the run: the last's ✓✓ always, dim, never the accent; the first's on hover
      await page.getByTestId('thread.you.4').evaluate((el) => { el.scrollIntoView({ block: 'center' }); });
      await expect(mark(4)).toHaveText('✓✓');
      await expect(mark(4)).toHaveAttribute('title', thread.read_it({ who: 'bise' }));
      expect(await color(4), `${t}: ✓✓ dim`).toBe(await token('--c-text-2'));
      expect(await color(4), `${t}: never the accent`).not.toBe(accent);
      const op = (pos: number) => under(pos).evaluate((e) => Number(getComputedStyle(e).opacity));
      expect(await op(4)).toBe(1);
      expect(await op(3), 'inside a run, time + mark wait for a hover').toBe(0);
      await expect(mark(3)).toHaveText('✓✓');
      await page.getByTestId('thread.you.3').hover();
      await expect.poll(() => op(3), { timeout: 2000 }).toBe(1);
      await page.mouse.move(1, 300);
    };
    const win = await s.app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().sort((a, b) => (b.getSize()[0] ?? 0) - (a.getSize()[0] ?? 0))[0]?.id ?? -1);
    const size = async (w: number) => {
      await s.app.evaluate(({ BrowserWindow }, [id, w2]) => {
        const bw = BrowserWindow.fromId(id ?? -1);
        bw?.setMinimumSize(400, 400);
        bw?.setContentSize(w2 ?? 0, 760);
      }, [win, w]);
      await expect.poll(() => page.evaluate(() => window.innerWidth), { timeout: 5000 }).toBe(w);
      await page.waitForTimeout(200);
    };
    for (const t of ['light', 'dark'] as const) {
      await core.send(prefs(t) as never);
      await expect.poll(() => page.evaluate(() => document.documentElement.dataset['theme']), { timeout: 5000 }).toBe(t);
      for (const w of [1100, 600]) {
        await size(w);
        await check(`${t} ${String(w)}`);
        // the shot: the run and 'to perf' in the middle, then the bottom (✓, not sent, sent)
        await page.getByTestId('thread.you.6').evaluate((el) => { el.scrollIntoView({ block: 'center' }); });
        await page.waitForTimeout(150);
        await page.screenshot({ path: test.info().outputPath(`delivery-${t}-${String(w)}-a.png`) });
        // the list is virtual: at 600 the last bubbles aren't drawn while 6 sits in the middle; to
        // the end first, then the row (amb-feed m_22774: 'thread.you.15' never came)
        await page.locator('[data-testid="thread.list"]').evaluate((el) => {
          const sc = el.querySelector<HTMLElement>('[data-virtuoso-scroller]') ?? el;
          sc.scrollTop = sc.scrollHeight;
        });
        await expect(page.getByTestId('thread.you.15')).toBeAttached({ timeout: 5000 });
        await page.getByTestId('thread.you.15').evaluate((el) => { el.scrollIntoView({ block: 'end' }); });
        await page.waitForTimeout(150);
        await page.screenshot({ path: test.info().outputPath(`delivery-${t}-${String(w)}-b.png`) });
      }
    }
  } finally {
    await s.close();
  }
});

// designer m_17197: one frame with a ✓ bubble, a ✓✓ bubble, a steered one and a spoken one
// ('said · 0:0N ✓✓'), light and dark at 1100. The spoken turn goes through voice mode as the core
// sends it (hearing -> sending -> his entry), then voice mode closes so the composer is back.
test('thread/delivery: the four marks in one frame (✓, ✓✓, steered, said ✓✓), light and dark', async () => {
  test.setTimeout(90_000);
  const A = 'acme-1a2b3c4d';
  const ASKED = 'now do the same for the tablet sizes';
  const vm = (state: string, extra: Record<string, unknown> = {}) => ({ ev: 'voice_mode', project: A, agent: 'perf', on: true, state, ...extra });
  const core = new FakeCore([
    prefs('light'),
    {
      ev: 'projects',
      projects: [
        { project: 'bise-home-00000000', name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
        { project: A, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 1, agents: 2, working: 0, waits: 0, running: true },
      ],
    },
    { ev: 'roles', items: [{ about: 'speech to text', kind: 'voice', model: 'mistral/voxtral-mini-latest', name: 'voice', role: 'voice', source: 'env' }] },
    { ev: 'welcome', project: A, proto: 1, workspace: '/nowhere/acme', name: 'acme' },
    { ev: 'agents', project: A, agents: [ag('main'), ag('perf')] },
    {
      ev: 'thread',
      project: A,
      agent: 'perf',
      entries: [
        { pos: 1, at_ms: NOW - 20 * MIN, kind: 'you', msg_id: 21, delivery: 'read', text: 'cap the thumbnails at 400 KB' },
        { pos: 2, at_ms: NOW - 18 * MIN, kind: 'agent', text: 'capped. running the bench three more times…' },
        { pos: 3, at_ms: NOW - 12 * MIN + 1000, kind: 'you', msg_id: 22, delivery: 'read', steered_at: 4, text: 'also try webp' },
        { pos: 4, at_ms: NOW - 12 * MIN, kind: 'tools', text: thread.did_run({ n: 1 }), tools: { count: 1, summary: thread.did_run({ n: 1 }), items: [{ pos: 4, at_ms: NOW - 12 * MIN, text: 'pnpm bench --webp', kind: 'run', state: 'ok', ms: 4000 }] } },
        { pos: 5, at_ms: NOW - 10 * MIN, kind: 'agent', text: 'webp saves another 30%. still benching the phones…' },
        { pos: 6, at_ms: NOW - 8 * MIN, kind: 'you', msg_id: 23, delivery: 'received', text: 'and keep the old jpegs for a week' },
        { pos: 7, at_ms: NOW - 6 * MIN, kind: 'agent', text: 'done: phones 380 KB, the old jpegs stay until friday.' },
      ],
      before: null,
      more: false,
    },
  ] as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${A}/perf`, size: '1100x760' });
  try {
    const { page } = s;
    await expect(page.getByTestId('thread.you.6')).toBeVisible({ timeout: 10_000 });
    // his spoken turn: ∿ turns voice mode on, heard for ~1 s, sent, then his entry lands (read: perf was idle)
    await page.getByTestId('composer.voice').click();
    await core.waitCmd((c) => c.cmd === 'voice_mode', 3000);
    await core.send(vm('listening') as never);
    await core.send(vm('hearing', { heard: ASKED }) as never);
    await page.waitForTimeout(1100);
    await core.send(vm('sending', { heard: ASKED }) as never);
    await core.send(vm('thinking') as never);
    await core.send({ ev: 'entry', project: A, agent: 'perf', entry: { pos: 8, at_ms: Date.now(), kind: 'you', msg_id: 24, delivery: 'read', text: ASKED } } as never);
    await expect(page.getByTestId('thread.you.8.under')).toHaveText(/^said · 0:0[1-3] ✓✓$/u, { timeout: 3000 });
    await core.send({ ev: 'entry', project: A, agent: 'perf', entry: { pos: 9, at_ms: Date.now(), kind: 'agent', text: 'on it: the 768 and 1024 sizes.' } } as never);
    await core.send({ ev: 'voice_mode', project: A, agent: 'perf', on: false, state: 'listening' } as never);
    await expect(page.getByTestId('thread.you.6.under')).toHaveText(/^\d\d:\d\d ✓$/u);
    await expect(page.getByTestId('thread.you.1.under')).toHaveText(/^\d\d:\d\d ✓✓$/u);
    await expect(page.getByTestId('thread.you.3.under')).toHaveText(/^steered · perf read it mid-turn$/u);
    for (const t of ['light', 'dark'] as const) {
      await core.send(prefs(t) as never);
      await expect.poll(() => page.evaluate(() => document.documentElement.dataset['theme']), { timeout: 5000 }).toBe(t);
      await page.mouse.move(1, 300);
      await page.waitForTimeout(300);
      await page.screenshot({ path: test.info().outputPath(`marks-${t}-1100.png`) });
    }
  } finally {
    await s.close();
  }
});
