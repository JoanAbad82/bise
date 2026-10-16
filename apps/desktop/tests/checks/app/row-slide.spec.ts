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
 *  (`on`: t 0 there; frames before it have a negative t), kept in the page. */
async function record(role: Locator, on: 'mouseenter' | 'mouseleave'): Promise<void> {
  await role.evaluate((e, ev) => {
    const w = window as unknown as { slideXs: { t: number; x: number }[]; slideOn: boolean };
    const inner = e.querySelector('.b-slide-in') as HTMLElement;
    const row = e.closest('[data-slide-row]') ?? e;
    w.slideXs = [];
    w.slideOn = true;
    const start = performance.now();
    let t0: number | null = null;
    row.addEventListener(ev, () => { t0 = performance.now(); }, { once: true });
    const tick = () => {
      if (!w.slideOn) return;
      w.slideXs.push({ t: Math.round(performance.now() - (t0 ?? start + 1e6)), x: new DOMMatrix(getComputedStyle(inner).transform).m41 });
      requestAnimationFrame(tick);
    };
    tick();
  }, on);
}

async function stop(page: Page): Promise<{ t: number; x: number }[]> {
  return page.evaluate(() => {
    const w = window as unknown as { slideXs: { t: number; x: number }[]; slideOn: boolean };
    w.slideOn = false;
    return w.slideXs;
  });
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
    const hovered = (await stop(page)).filter((f) => f.t >= 0);
    await record(role, 'mouseleave');
    await page.mouse.move(1, 450);
    await wait(page, 800);
    const left = (await stop(page)).filter((f) => f.t >= 0);
    await page.screenshot({ path: test.info().outputPath('row-slide-after.png') });
    const say = JSON.stringify({ hovered: hovered.filter((_, i) => i % 4 === 0), left: left.filter((_, i) => i % 4 === 0) });
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
    expect(left.every((f, i) => f.x >= (left[i - 1]?.x ?? -Infinity) - 0.01), `never further left after the leave: ${say}`).toBe(true);
    const home = left.filter((f) => f.t >= 200);
    expect(home.length, 'frames after 200 ms').toBeGreaterThan(5);
    expect(home.every((f) => Math.abs(f.x) < 0.5), `home within 200 ms and still: ${say}`).toBe(true);
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
    const xs = await stop(page);
    expect(xs.length).toBeGreaterThan(10);
    expect(xs.every((f) => f.x === 0), JSON.stringify(xs.filter((_, i) => i % 6 === 0))).toBe(true);
    await expect(role, "its '…' stays").not.toHaveText(WORDS);
  } finally {
    await done();
  }
});
