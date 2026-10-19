// app/row-slide · his slide-fix (main m_26887): the right bar's now line did not move on the row's
// hover, then slid left once the pointer had left. Passes when, on FakeCore, for a row whose now
// line overflows (read every animation frame in the page, not by polling):
//   - hovered: still for the 250 ms delay (designer m_26921), then its words move left over time,
//     linear at 44 px/s (Vibe Work's AuraTextHoverScroll's pace), never right;
//   - left: back at 0 within 200 ms, and nothing moves after (never left of where it was);
//   - under reduced motion: nothing moves, hovered or not.
// The slide: src/ds/slide.tsx, src/ds/css/slide.css, src/ds/hooks.ts. Owner: amb-kit.
import type { Locator, Page } from '@playwright/test';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const NOW = Date.now();
const MIN = 60_000;
const LONG = 'proofreading';
const WORDS = 'the copy of every page of the store, one by one, with the legal team in the loop';
const prefs = {
  ev: 'prefs',
  prefs: { onboarded: true, theme: 'dark', context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
};
const use = (pct: number) => ({ usage: { model: 'm', context: pct * 1000, window: 100_000, words: '', short: `${String(pct)}%` } });
const agent = (name: string, status: string, over: Record<string, unknown> = {}) => ({
  name, main: name === 'main', status, archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 14 * MIN, waits: 0, watching: [], ...over,
});
const world = [
  prefs,
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'storefront', path: '/nowhere/storefront', git: true, home: false, order: 1, agents: 4, working: 2, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/storefront', name: 'storefront' },
  {
    ev: 'agents',
    project: P,
    agents: [
      agent('main', 'idle'),
      agent('perf', 'working', { purpose: 'product page speed', turn_ms: 4 * MIN, ...use(71) }),
      agent(LONG, 'working', { purpose: WORDS, turn_ms: 6 * MIN, ...use(40) }),
      agent('launch', 'idle', { purpose: 'videos for the internals thread and the launch post', ...use(29) }),
    ],
  },
  { ev: 'agents', project: HOME, agents: [agent('main', 'idle')] },
  { ev: 'thread', project: P, agent: 'main', entries: [{ pos: 1, at_ms: NOW - MIN, kind: 'agent', text: 'perf cut the hero image.' }], before: null, more: false },
];

/** Every frame's translateX of the line's words, from the row's next mouseenter or mouseleave
 *  (`on`: t 0 there; frames before it have a negative t), kept in the page. Each recording has its
 *  own frames and its own 'on': a stopped loop whose next frame comes after the next recording
 *  started never writes into it (with one shared array and flag, under load the hover's loop lived
 *  on into the leave's frames, its t counted from the mouseenter: x -44 at 't 1276', a red
 *  'home within 200 ms' in 2 nightlies and on 10.7/10.8's land step; release-43's rs3.log). */
/** A recording: its frames, and `s`: when the browser started the transform transition the event
 *  made (its CSSTransition's startTime, ms after the event; null: none started, the line jumped or
 *  never moved). Under load Chrome starts a transition well after the event (270 ms at load 23,
 *  row-slide's runs/mutation.log): the delay and the pace are the transition's, timed from there.
 *  `a`: the frame was read once that start was known. A read while the new transition is still
 *  pending (no startTime yet) gives its end value, not where the line is: the leave's first frame
 *  read 0, the next -24.6 (runs/p3/mut-home.log), a false 'further left' (rs3.log run 3's red). */
interface Rec { xs: { t: number; x: number; a: boolean }[]; s: number | null }

async function record(role: Locator, on: 'mouseenter' | 'mouseleave'): Promise<void> {
  await role.evaluate((e, ev) => {
    const w = window as unknown as { slideRec?: Rec & { on: boolean } };
    const inner = e.querySelector('.b-slide-in') as HTMLElement;
    const row = e.closest('[data-slide-row]') ?? e;
    if (w.slideRec) w.slideRec.on = false;
    const rec = { xs: [] as Rec['xs'], s: null as number | null, on: true };
    w.slideRec = rec;
    const start = performance.now();
    let t0: number | null = null;
    row.addEventListener(ev, () => { t0 = performance.now(); }, { once: true });
    const tick = () => {
      if (!rec.on) return;
      // known before this frame: the frame where the start resolves still read the pending value
      // (load 53: x 0 at t 6 in that frame, -52.7 at t 7, home after; runs/p4/alone-1.log)
      const known = rec.s !== null;
      const x = new DOMMatrix(getComputedStyle(inner).transform).m41;
      if (t0 !== null && rec.s === null) {
        // the transition this event made: started after it (the one before, if still running, began >= 1 s earlier)
        const from = t0 - 100;
        const a = inner.getAnimations().find((n) => (n as CSSTransition).transitionProperty === 'transform' && typeof n.startTime === 'number' && n.startTime >= from);
        if (a) rec.s = Math.round((a.startTime as number) - t0);
      }
      rec.xs.push({ t: Math.round(performance.now() - (t0 ?? start + 1e6)), x, a: known });
      requestAnimationFrame(tick);
    };
    tick();
  }, on);
}

async function stop(page: Page): Promise<Rec> {
  return page.evaluate(() => {
    const w = window as unknown as { slideRec?: Rec & { on: boolean } };
    if (!w.slideRec) return { xs: [], s: null };
    w.slideRec.on = false;
    return { xs: w.slideRec.xs, s: w.slideRec.s };
  });
}

/** The frames read once the transition had started (t 0 at its start), or from the event when
 *  none started (a line that jumps or never moves keeps every frame). */
const fromStart = (r: Rec) =>
  r.xs.filter((f) => f.t >= (r.s ?? 0) && (r.s === null || f.a)).map((f) => ({ t: f.t - (r.s ?? 0), x: f.x }));

/** What fromStart drops as pending: the frames after the event read before the start was known,
 *  and the ms from the event's first frame to the first kept one (all of them when it never came). */
function pending(r: Rec): { frames: number; ms: number } {
  const after = r.xs.filter((f) => f.t >= 0);
  if (r.s === null || after.length === 0) return { frames: 0, ms: 0 };
  const kept = after.findIndex((f) => f.a);
  const last = after.at(-1)?.t ?? 0;
  return { frames: kept === -1 ? after.length : kept, ms: (kept === -1 ? last : (after[kept]?.t ?? last)) - (after[0]?.t ?? 0) };
}

const wait = (page: Page, ms: number) => page.evaluate((m) => new Promise<void>((done) => { setTimeout(done, m); }), ms);

async function launch(reduced: boolean) {
  const core = new FakeCore(world as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `project/${P}`, size: '1400x900' });
  if (reduced) await s.page.emulateMedia({ reducedMotion: 'reduce' });
  const row = s.page.getByTestId(`app.right.agent.${LONG}`);
  await expect(row).toBeVisible({ timeout: 10_000 });
  const role = s.page.getByTestId(`app.right.agent.${LONG}.role`);
  await expect(role, 'the line overflows its row').toHaveAttribute('data-over', 'true');
  return { ...s, row, role, done: async () => { await s.close(); core.dispose(); } };
}

test('app/row-slide: the hovered row slides its now line left over time; on leave it is home within 200 ms and still', async () => {
  const { page, row, role, done } = await launch(false);
  try {
    await page.mouse.move(1, 450);
    await wait(page, 300);
    await record(role, 'mouseenter');
    await row.hover();
    await wait(page, 1200);
    const h = await stop(page);
    await record(role, 'mouseleave');
    await page.mouse.move(1, 450);
    await wait(page, 800);
    const l = await stop(page);
    await page.screenshot({ path: test.info().outputPath('row-slide-after.png') });
    // t from the start of the transition the enter (the leave) made, not from the event
    const hovered = fromStart(h);
    const left = fromStart(l);
    const say = JSON.stringify({ started: { hovered: h.s, left: l.s }, hovered: hovered.filter((_, i) => i % 4 === 0), left: left.filter((_, i) => i % 4 === 0) });
    expect(h.s, `the hover starts a transform transition: ${say}`).not.toBeNull();
    // and soon: a hover style that reaches the line late (a slow render, a debounce) is a lag he sees.
    // 1000 ms: well above the browser's own start under load (~270 ms at load 23, review-gates m_33500)
    test.info().annotations.push({ type: 'hover start', description: `${String(h.s)} ms after the mouseenter` });
    expect(h.s ?? Infinity, `the hover's transition starts within 1000 ms of the mouseenter: ${say}`).toBeLessThan(1000);
    // the frames dropped as pending stay a short window: a startTime that never resolves would
    // otherwise leave nothing to judge (~300 ms, review-gates m_33541)
    for (const [name, r] of [['hover', h], ['leave', l]] as const) {
      const p = pending(r);
      test.info().annotations.push({ type: `${name} pending`, description: `${String(p.frames)} frames over ${String(p.ms)} ms` });
      expect(p.ms, `the ${name}'s frames read before its transition started span <= 300 ms (${String(p.frames)} frames): ${say}`).toBeLessThanOrEqual(300);
    }
    // hovered: still at first (the 250 ms delay), then left at ~44 px/s, more and more, never back right
    expect(hovered.length, 'frames while hovered').toBeGreaterThan(10);
    expect(hovered.filter((f) => f.t < 200).every((f) => f.x === 0), `still for the delay: ${say}`).toBe(true);
    const mid = hovered.find((f) => f.t >= 600);
    const end = hovered.at(-1)?.x ?? 0;
    expect(mid?.x ?? 0, `moved left by 600 ms: ${say}`).toBeLessThan(-6);
    expect(end, `further left by the end: ${say}`).toBeLessThan((mid?.x ?? 0) - 4);
    expect(hovered.every((f, i) => f.x <= (hovered[i - 1]?.x ?? 0) + 0.01), `never right while hovered: ${say}`).toBe(true);
    // left: from the leave on, never a frame further left than the one before, at 0 within 200 ms,
    // still after. Not 'never left of the last hovered frame read': the line slides on between that
    // read and the leave (longer under load: one frame 'further left' red in test:land, land-reds)
    const back = left.findIndex((f, i) => i > 0 && f.x < (left[i - 1]?.x ?? -Infinity) - 0.01);
    expect(back, `never further left after the leave: ${say} first at ${JSON.stringify(left.slice(Math.max(0, back - 3), back + 3))}`).toBe(-1);
    const home = left.filter((f) => f.t >= 200);
    expect(home.length, 'frames after 200 ms').toBeGreaterThan(5);
    const away = home.findIndex((f) => Math.abs(f.x) >= 0.5);
    expect(away, `home within 200 ms and still: ${say} first at ${JSON.stringify(home.slice(Math.max(0, away - 3), away + 3))}`).toBe(-1);
    await expect(role, 'cut again at rest').not.toHaveText(WORDS);
  } finally {
    await done();
  }
});

test('app/row-slide: under reduced motion the now line never moves', async () => {
  const { page, row, role, done } = await launch(true);
  try {
    await record(role, 'mouseenter');
    await row.hover();
    await wait(page, 700);
    await page.mouse.move(1, 450);
    await wait(page, 400);
    const { xs } = await stop(page);
    expect(xs.length).toBeGreaterThan(10);
    expect(xs.every((f) => f.x === 0), JSON.stringify(xs.filter((_, i) => i % 6 === 0))).toBe(true);
    await expect(role, "its '…' stays").not.toHaveText(WORDS);
  } finally {
    await done();
  }
});
