// bims/town · the town on bise's thread (page bims-maps v9, maps-e): one office per project on its own
// map and growth, its road and river round them, a sign in front of each. On FakeCore rows (3 and 12
// fake projects of every stage), off screen. Passes when:
//   - bise's thread shows the bims icon; it opens the town (not the list's office): one sign per
//     project, with its name, ∿ its agents at work and the pink ? n of its questions;
//   - the plan's check: no road or river point inside an office (the renderer's probe, 0 and 0);
//   - an idle town draws no frame (3 s); a town of 12 projects draws a frame under the office's
//     budget (FRAME_MS) in few draw calls (its offices merged);
//   - a click on an office dives in: the town eases to that office's own framing, its Office takes
//     over (its bims live), its sign has 'open'; esc eases back to the whole town; the dive is kept
//     on a reload; 'open' opens the project's main thread;
//   - a pinch zooms the town (page town-live): past LIVE_ZOOM the offices in view are posed live, 4
//     at most, their bims baked no more; esc goes back to the whole town, no office live, and an idle
//     town draws no frame again; blurred or hidden, a zoomed town draws nothing either;
//   - the signs never sit on one another (town/signs.ts); a lost WebGL context shows the line.
// Shots for bims (.harness-cache/bims-shots): 3 and 12 projects, 320 and wide, day and night; the
// dive's last town frame and the Office's first, side by side. Owner: maps-e.
import { test, expect, FakeCore, launchDesktop, type Session } from '../../harness';
import { agent, card, mainAgent } from '../../../src/bims/fixtures';
import { STAGE_AT } from '../../../src/bims/growth';
import { loseContext, setHidden, shotOf, sleep, trackpad, writeIndex, type Shot } from './world';

const shots: Shot[] = [];
test.describe.configure({ timeout: 150_000 });
test.afterAll(() => {
  if (shots.length > 0) writeIndex(shots);
});

const HOME = 'bise-home-00000000';
/** the office's frame budget (ms of the render call): a 60 Hz frame */
const FRAME_MS = 16;
/** the stages the shots show (bims: 0, 5, 9, 14), round the projects */
const STAGES = [0, 5, 9, 14, 3, 7, 11, 1, 13, 6, 9, 2];
const NAMES = ['harness', 'bise.dev', 'acme-web', 'dotfiles', 'blog', 'gab-office', 'shop', 'infra', 'notes', 'api', 'mobile', 'design'];

interface Fake {
  readonly id: string;
  readonly name: string;
  readonly stage: number;
  readonly agents: ReturnType<typeof agent>[];
  readonly asks: number;
}

/** n fake projects: each its stage, a few agents (some working), questions in some */
function fakes(n: number): Fake[] {
  return Array.from({ length: n }, (_, i) => {
    const stage = STAGES[i % STAGES.length] ?? 0;
    // a young project: a few agents and no garden; an old one: many, its big ground
    const k = 1 + Math.round(stage * 0.8) + (i % 2);
    const agents = [
      mainAgent({ status: i % 3 === 0 ? 'working' : 'idle' }),
      ...Array.from({ length: k }, (_, j) => agent(`${NAMES[i] ?? 'p'}-${String(j)}`, { status: j % 2 === 0 ? 'working' : j % 3 === 0 ? 'waiting' : 'idle', turn_ms: 1000 })),
    ];
    return { id: `p${String(i)}-0000town`, name: NAMES[i] ?? `p${String(i)}`, stage, agents, asks: i % 4 === 1 ? 2 : i % 5 === 2 ? 1 : 0 };
  });
}

function townWorld(ps: readonly Fake[], theme: 'light' | 'dark'): Record<string, unknown>[] {
  const now = Date.now();
  const evs: Record<string, unknown>[] = [
    {
      ev: 'prefs',
      prefs: {
        onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [],
        quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true },
        voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7,
        bims: { map: Object.fromEntries(ps.map((p, i) => [p.id, i % 2 === 0 ? 'loft' : 'kyoto'])) },
      },
    },
    {
      ev: 'projects',
      projects: [
        { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
        ...ps.map((p, i) => ({
          project: p.id, name: p.name, path: `/nowhere/${p.name}`, git: true, home: false, order: i + 1,
          agents: p.agents.length, working: p.agents.filter((a) => a.status === 'working').length, waits: p.asks, running: true,
        })),
      ],
    },
    { ev: 'agents', project: HOME, agents: [{ name: 'main', main: true, status: 'idle', archived: false, title: '', purpose: '', since_ms: now, waits: 0, watching: [], dir: 'main' }] },
    { ev: 'thread', project: HOME, agent: 'main', entries: [{ pos: 1, at_ms: now - 60_000, kind: 'agent', text: 'the town is open.' }], before: null, more: false },
  ];
  for (const p of ps) {
    evs.push(
      { ev: 'agents', project: p.id, agents: p.agents, places: [] },
      { ev: 'growth', project: p.id, growth: { jobs_done: STAGE_AT[p.stage] ?? 0, days_used: p.stage === 0 ? 0 : [1, 3, 7, 14, 30, 60, 100, 365][Math.min(7, Math.floor(p.stage / 2))] ?? 0, artifacts_made: p.stage * 12 } },
      { ev: 'cards', project: p.id, cards: Array.from({ length: p.asks }, (_, j) => card(100 + j, p.agents[1]?.name ?? 'main', { project: p.id })) },
    );
  }
  return evs;
}

type TownProbe = { frames: number; calls: number; ms: number; offices: number; merged: { from: number; to: number }; live: string[]; recent: number[]; check: { road: number; river: number }; heads: { id: string; name: string; x: number; y: number; feet: number }[] };
/** each office now (render/town.ts drawnNow): its ground in view, what of it is drawn, where, its depth against the camera's planes */
type Drawn = { id: string; inView: boolean; shown: boolean; live: boolean; fp: { x0: number; x1: number; z0: number; z1: number }; box: { x0: number; x1: number; y0: number; y1: number; z0: number; z1: number } | null; depth: { min: number; max: number; near: number; far: number } | null };
const drawnNow = (s: Session): Promise<Drawn[]> =>
  s.page.evaluate(() => (window as unknown as { __biseTownDrawn?: () => Drawn[] }).__biseTownDrawn?.() ?? []);
const probe = (s: Session): Promise<TownProbe | null> =>
  s.page.evaluate(() => (window as unknown as { __biseTown?: TownProbe }).__biseTown ?? null);

async function openTown(ps: readonly Fake[], theme: 'light' | 'dark', width = 1400): Promise<{ s: Session; core: FakeCore }> {
  const core = new FakeCore(townWorld(ps, theme) as never);
  const s = await launchDesktop({ core, route: 'bise', size: `${String(width)}x900` });
  await expect(s.page.getByTestId('app.right.agents.bims'), "bise's thread has the bims cube").toBeVisible({ timeout: 20_000 });
  return { s, core };
}

async function showTown(s: Session): Promise<void> {
  const town = s.page.getByTestId('app.right.bims.town');
  if ((await town.count()) === 0) await s.page.getByTestId('app.right.agents.bims').click();
  await expect(town).toHaveAttribute('data-state', 'on', { timeout: 20_000 });
  await expect.poll(async () => (await probe(s))?.frames ?? 0, { timeout: 10_000 }).toBeGreaterThan(0);
}

/** waits until the town stops drawing (no new frame for quietMs) */
async function settled(s: Session, quietMs = 1200, maxMs = 15_000): Promise<void> {
  const end = Date.now() + maxMs;
  let last = (await probe(s))?.frames ?? 0;
  let since = Date.now();
  while (Date.now() < end) {
    await sleep(200);
    const n = (await probe(s))?.frames ?? 0;
    if (n !== last) {
      last = n;
      since = Date.now();
    } else if (Date.now() - since >= quietMs) return;
  }
}

async function shot(s: Session, testId: string, file: string, title: string, says: string): Promise<void> {
  const b = await s.page.getByTestId(testId).boundingBox();
  if (b === null) throw new Error(`no ${testId} for ${file}`);
  await shotOf(s.cdp, s.page, b, file);
  shots.push({ file, title, says });
}

/** the town's plan check, from the renderer's probe (town/plan.ts crossings on the plan it drew) */
const crossings = async (s: Session): Promise<{ road: number; river: number } | null> => (await probe(s))?.check ?? null;

for (const n of [3, 12]) {
  for (const theme of ['light', 'dark'] as const) {
    test(`(town) ${String(n)} projects, ${theme}: signs, no crossing, idle, shots`, async () => {
      const ps = fakes(n);
      const { s } = await openTown(ps, theme);
      try {
        await showTown(s);
        await settled(s);
        for (const p of ps) {
          const sign = s.page.getByTestId(`app.right.bims.town.sign.${p.id}`);
          await expect(sign, `${p.name}'s sign`).toContainText(p.name);
          const working = p.agents.filter((a) => !a.main && a.status === 'working').length;
          await expect(s.page.getByTestId(`app.right.bims.town.working.${p.id}`)).toHaveText(`∿ ${String(working)}`);
          if (p.asks > 0) await expect(s.page.getByTestId(`app.right.bims.town.asks.${p.id}`)).toHaveText(`? ${String(p.asks)}`);
          else await expect(s.page.getByTestId(`app.right.bims.town.asks.${p.id}`)).toHaveCount(0);
        }
        expect(await crossings(s), 'no road or river point inside an office').toEqual({ road: 0, river: 0 });
        const p0 = (await probe(s))?.frames ?? 0;
        await sleep(3000);
        expect(((await probe(s))?.frames ?? 0) - p0, 'an idle town draws nothing').toBe(0);
        await shot(s, 'app.right.bims.town', `town-${String(n)}-320-${theme}.png`, `town, ${String(n)} projects, 320, ${theme}`, 'one office per project on its map and stage, the road and river round them, a sign each');
        await s.page.getByTestId('app.right.agents.width.wide').click();
        await sleep(600);
        await settled(s);
        await shot(s, 'app.right.bims.town', `town-${String(n)}-wide-${theme}.png`, `town, ${String(n)} projects, wide, ${theme}`, 'the same town at 640');
        await s.page.getByTestId('app.right.agents.width.narrow').click();
      } finally {
        await s.close();
      }
    });
  }
}

test('(town) 12 projects: a frame under the budget, offices merged', async () => {
  const { s, core } = await openTown(fakes(12), 'light');
  try {
    await showTown(s);
    await settled(s);
    const p = await probe(s);
    expect(p?.offices, "one office per project, bise's home among them").toBe(13);
    expect(p?.ms ?? 999, `a frame's render call, ms (budget ${String(FRAME_MS)})`).toBeLessThan(FRAME_MS);
    expect(p?.merged.to ?? 999, 'merged: far fewer draw calls than meshes').toBeLessThan((p?.merged.from ?? 0) / 10);
    // a row changes: one frame, then still again
    const f0 = (await probe(s))?.frames ?? 0;
    const ps = fakes(12);
    const q = ps[3];
    if (q !== undefined) await core.send({ ev: 'agents', project: q.id, agents: q.agents.map((a) => ({ ...a, status: 'working' })), places: [] } as never);
    await expect.poll(async () => ((await probe(s))?.frames ?? 0) - f0, { timeout: 5000 }).toBeGreaterThan(0);
    await settled(s);
    const after = await probe(s);
    expect(after?.ms ?? 999, 'a frame after the change, ms').toBeLessThan(FRAME_MS);
    console.log(`town 12: frame ${String(after?.ms.toFixed(2))} ms, ${String(after?.calls)} draw calls, ${String(after?.merged.from)} meshes merged into ${String(after?.merged.to)}`);
  } finally {
    await s.close();
  }
});

for (const theme of ['light', 'dark'] as const) {
  test(`(town) a click dives into an office, esc comes back, ${theme}`, async () => {
    const ps = fakes(3);
    const { s, core } = await openTown(ps, theme);
    const target = ps[1];
    if (target === undefined) throw new Error('no project');
    try {
      await showTown(s);
      await settled(s);
      // the sign dives in; the town's last frame, then the Office's first
      await s.page.getByTestId(`app.right.bims.town.sign.${target.id}`).click();
      await expect(s.page.getByTestId('app.right.bims.town')).toHaveAttribute('data-phase', /^(swapIn|office)$/u, { timeout: 4000 });
      const office = s.page.getByTestId('app.right.bims');
      await expect(office, "its Office, live").toHaveAttribute('data-state', 'on', { timeout: 10_000 });
      await shot(s, 'app.right.bims.town', `town-dive-last-${theme}.png`, `dive, the town's last frame, ${theme}`, "the town at the Office's own framing: the same block, the neighbours dim");
      await expect(s.page.getByTestId('app.right.bims.town')).toHaveAttribute('data-phase', 'office', { timeout: 4000 });
      await sleep(500);
      await shot(s, 'app.right.bims', `town-dive-first-${theme}.png`, `dive, the Office's first frame, ${theme}`, 'the same block and size: only the surroundings change');
      await expect(s.page.getByTestId('app.right.bims.town.open'), "the sign's open").toBeVisible();
      // kept per window: a reload shows the Office again
      await s.page.reload();
      await expect(s.page.getByTestId('app.right.bims'), 'the dive is kept').toHaveAttribute('data-state', 'on', { timeout: 20_000 });
      // esc: back to the whole town
      // the Office has the focus (its top left corner is the town's '⤢ town')
      await s.page.getByTestId('app.right.bims').focus();
      await s.page.keyboard.press('Escape');
      await expect(s.page.getByTestId('app.right.bims.town')).toHaveAttribute('data-phase', 'town', { timeout: 5000 });
      await expect(s.page.getByTestId('app.right.bims')).toHaveCount(0);
      // open: the project's main thread
      await s.page.getByTestId(`app.right.bims.town.sign.${target.id}`).click();
      await expect(s.page.getByTestId('app.right.bims.town.open')).toBeVisible({ timeout: 6000 });
      await s.page.getByTestId('app.right.bims.town.open').click();
      await core.waitCmd((c) => c.cmd === 'subscribe' && c.project === target.id).catch(() => undefined);
      await expect(s.page.getByTestId('app.title.crumb')).toContainText(target.name, { timeout: 5000 });
    } finally {
      await s.close();
    }
  });
}

test('(town) a pinch zooms in: the offices in view go live, 4 at most; esc: the whole town, idle', async () => {
  const { s } = await openTown(fakes(12), 'light');
  try {
    await showTown(s);
    await settled(s);
    expect((await probe(s))?.live ?? [], 'from afar, no office live').toEqual([]);
    const box = await s.page.getByTestId('app.right.bims.town').boundingBox();
    if (box === null) throw new Error('no town');
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    // fingers apart: a ctrl wheel with deltaY < 0, as Chromium sends a trackpad pinch
    for (let i = 0; i < 12; i++) await trackpad(s.cdp, x, y, { dy: -20, pinch: true });
    await expect(s.page.getByTestId('app.right.bims.town')).toHaveAttribute('data-zoomed', 'true');
    await expect.poll(async () => (await probe(s))?.live.length ?? 0, { timeout: 5000, message: 'offices in view posed live' }).toBeGreaterThan(0);
    expect((await probe(s))?.live.length ?? 99, 'never more than 4 live offices').toBeLessThanOrEqual(4);
    // the live offices draw at their own rates: a second of their frames, the median's render call
    await sleep(1000);
    const zp = await probe(s);
    const recent = [...(zp?.recent ?? [])].sort((a, b) => a - b);
    const median = recent[Math.floor(recent.length / 2)] ?? 999;
    console.log(`town 12 zoomed: ${String(zp?.live.length)} live, median frame ${median.toFixed(2)} ms of ${String(recent.length)}, ${String(zp?.calls)} draw calls`);
    expect(median, "a live frame's render call, median ms").toBeLessThan(FRAME_MS);
    await shot(s, 'app.right.bims.town', 'town-12-zoomed-light.png', 'town, 12 projects, pinched in', 'the offices in view live: their real bims at work');
    await s.page.getByTestId('app.right.bims.town').focus();
    await s.page.keyboard.press('Escape');
    await expect(s.page.getByTestId('app.right.bims.town')).not.toHaveAttribute('data-zoomed', 'true');
    await expect.poll(async () => (await probe(s))?.live.length ?? 99, { timeout: 5000 }).toBe(0);
    await settled(s);
    const f0 = (await probe(s))?.frames ?? 0;
    const w0 = Date.now();
    await sleep(3000);
    const whys = await s.page.evaluate((since) => ((window as unknown as { __biseTownWhy?: { t: number; why: string }[] }).__biseTownWhy ?? []).filter((x) => x.t >= since).map((x) => x.why), w0);
    expect(((await probe(s))?.frames ?? 0) - f0, `back at the whole town, idle: no frame (asked by: ${whys.join(', ')})`).toBe(0);
  } finally {
    await s.close();
  }
});

/** a June noon and night (sky.ts LAT 46°N), clear: the town's sky pinned (window.__biseLocal, __biseSky) */
const MOMENTS = [
  { key: 'noon', h: 13, m: 50 },
  { key: 'night', h: 2, m: 0 },
] as const;

for (const theme of ['light', 'dark'] as const) {
  for (const at of MOMENTS) {
    test(`(town) the sky's one light, ${at.key}, ${theme}: day materials, pools capped, frames under budget, shots`, async () => {
      const { s } = await openTown(fakes(12), theme);
      try {
        await s.page.evaluate((x) => {
          const w = window as unknown as { __biseLocal?: unknown; __biseSky?: unknown };
          w.__biseLocal = { y: 2026, mo: 6, d: 21, s: x.h * 3600 + x.m * 60 };
          w.__biseSky = { weather: 'clear' };
        }, at);
        await showTown(s);
        // every office baked (a busy machine: the bakes take a while), then still
        await settled(s, 2500, 60_000);
        const p = await probe(s);
        console.log(`town 12 ${at.key} ${theme}: frame ${String(p?.ms.toFixed(2))} ms, ${String(p?.calls)} draw calls`);
        expect(p?.ms ?? 999, `a frame's render call, ms (budget ${String(FRAME_MS)})`).toBeLessThan(FRAME_MS);
        await shot(s, 'app.right.bims.town', `townlight-${at.key}-320-${theme}.png`, `town, ${at.key}, 320, ${theme}`, "the office's one light: day materials, the lawn and road their colours; night: the moon's blue, the lamps and the pools of the offices nearest the view");
        await s.page.getByTestId('app.right.agents.width.wide').click();
        await sleep(600);
        await settled(s);
        await shot(s, 'app.right.bims.town', `townlight-${at.key}-wide-${theme}.png`, `town, ${at.key}, wide, ${theme}`, 'the same town at 640');
        // one office pinched in: its bims live under the same light
        const box = await s.page.getByTestId('app.right.bims.town').boundingBox();
        if (box === null) throw new Error('no town');
        const x = box.x + box.width / 2;
        const y = box.y + Math.min(box.height, 900 - box.y) / 2;
        for (let i = 0; i < 16; i++) await trackpad(s.cdp, x, y, { dy: -20, pinch: true });
        await expect(s.page.getByTestId('app.right.bims.town')).toHaveAttribute('data-zoomed', 'true');
        await expect.poll(async () => (await probe(s))?.live.length ?? 0, { timeout: 5000 }).toBeGreaterThan(0);
        await sleep(1000);
        const zp = await probe(s);
        const recent = [...(zp?.recent ?? [])].sort((a, b) => a - b);
        const median = recent[Math.floor(recent.length / 2)] ?? 999;
        console.log(`town 12 zoomed ${at.key} ${theme}: ${String(zp?.live.length)} live, median frame ${median.toFixed(2)} ms`);
        expect(median, "a live frame's render call, median ms").toBeLessThan(FRAME_MS);
        await shot(s, 'app.right.bims.town', `townlight-${at.key}-zoomed-${theme}.png`, `town, ${at.key}, pinched in, ${theme}`, 'an office close up, its bims live, under the same light');
      } finally {
        await s.close();
      }
    });
  }
}

test('(town) zoomed in: a live bim shows its line on hover, a click opens its agent; labels never overlap', async () => {
  const { s } = await openTown(fakes(12), 'light');
  try {
    await showTown(s);
    await settled(s);
    const box = await s.page.getByTestId('app.right.bims.town').boundingBox();
    if (box === null) throw new Error('no town');
    // ~2.2x, past the live zoom (1.6x): bise's home in the middle (main alone) and its neighbours live
    for (let i = 0; i < 4; i++) await trackpad(s.cdp, box.x + box.width / 2, box.y + box.height / 2, { dy: -20, pinch: true });
    await expect(s.page.getByTestId('app.right.bims.town')).toHaveAttribute('data-zoomed', 'true');
    // a bim of a live office, not main (main's thread is the project's), well inside the view
    // and alone where it is hovered: the nearest body wins the pick (render/pick.ts, 14 px), so a
    // neighbour's body as close would take the hover (an office's bims stand ~5 px apart at this zoom):
    // the bim with the most room round its hover point
    const toSeg = (p: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }): number => {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const l2 = dx * dx + dy * dy;
      const f = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
      return Math.hypot(p.x - (a.x + dx * f), p.y - (a.y + dy * f));
    };
    const pickOne = async () => {
      const heads = (await probe(s))?.heads ?? [];
      const room = (h: (typeof heads)[number]): number => {
        const p = { x: h.x, y: (h.y + h.feet) / 2 };
        return Math.min(Infinity, ...heads.filter((o) => o !== h).map((o) => toSeg(p, { x: o.x, y: o.y }, { x: o.x, y: o.feet })));
      };
      const inView = heads.filter((h) => h.name !== 'main' && h.x > 30 && h.x < box.width - 30 && h.y > 40 && h.feet < box.height - 10);
      // the one with the most room round it, and some (a body exactly behind another is the front one's)
      return inView.sort((a, b) => room(b) - room(a)).find((h) => room(h) > 2);
    };
    await expect
      .poll(async () => (await pickOne()) !== undefined, { timeout: 5000, message: `a live bim in view (live ${JSON.stringify((await probe(s))?.live)}, heads ${JSON.stringify((await probe(s))?.heads.map((x) => `${x.name}@${String(Math.round(x.x))},${String(Math.round(x.y))}`))})` })
      .toBe(true);
    await settled(s, 800, 4000);
    const h = await pickOne();
    if (h === undefined) throw new Error('no live bim');
    // hover: its line over its head (the minimap's hover, one line)
    await s.page.mouse.move(box.x + h.x, box.y + (h.y + h.feet) / 2);
    const label = s.page.getByTestId(`app.right.bims.town.label.${h.id}.${h.name}`);
    await expect(label, 'the hovered bim has its line').toHaveAttribute('data-mode', 'hover', { timeout: 3000 });
    await expect(label).toContainText(h.name);
    // the labels shown, none over another
    const boxes = await s.page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>('[data-testid^="app.right.bims.town.label."]'))
        .filter((e) => e.style.visibility !== 'hidden')
        .map((e) => e.getBoundingClientRect())
        .map((r) => ({ x: r.x, y: r.y, w: r.width, h: r.height })),
    );
    for (const [i, a] of boxes.entries()) {
      for (const b of boxes.slice(i + 1)) {
        const over = a.x < b.x + b.w - 1 && b.x < a.x + a.w - 1 && a.y < b.y + b.h - 1 && b.y < a.y + a.h - 1;
        expect(over, `two labels overlap at ${String(Math.round(a.x))},${String(Math.round(a.y))}`).toBe(false);
      }
    }
    await shot(s, 'app.right.bims.town', 'town-12-hover-light.png', 'town, zoomed in, a bim hovered', "its line over its head, as in its office; the pills where they wait");
    // click: that agent's thread
    await s.page.mouse.click(box.x + h.x, box.y + (h.y + h.feet) / 2);
    await expect.poll(() => s.page.evaluate(() => sessionStorage.getItem('bise.history') ?? ''), { timeout: 3000 }).toContain(`agent/${h.id}/${h.name}`);
  } finally {
    await s.close();
  }
});

test('(town) zoomed in, blurred or hidden: no frame; signs never overlap', async () => {
  const { s } = await openTown(fakes(12), 'light', 1400);
  try {
    await showTown(s);
    await settled(s);
    await s.page.getByTestId('app.right.agents.width.wide').click();
    await settled(s);
    // the signs shown, none over another (bims m_30199)
    const boxes = (await Promise.all(fakes(12).map((p) => s.page.getByTestId(`app.right.bims.town.sign.${p.id}`).boundingBox()))).filter((b): b is NonNullable<typeof b> => b !== null && b.width > 0);
    for (const [i, a] of boxes.entries()) {
      for (const b of boxes.slice(i + 1)) {
        const over = a.x < b.x + b.width - 1 && b.x < a.x + a.width - 1 && a.y < b.y + b.height - 1 && b.y < a.y + a.height - 1;
        expect(over, `two signs overlap at ${String(Math.round(a.x))},${String(Math.round(a.y))}`).toBe(false);
      }
    }
    const box = await s.page.getByTestId('app.right.bims.town').boundingBox();
    if (box === null) throw new Error('no town');
    // wide, the town is taller than the window: pinch at the middle of what shows
    const vh = s.page.viewportSize()?.height ?? 900;
    const top = Math.max(box.y, 0);
    const py = top + (Math.min(box.y + box.height, vh) - top) / 2;
    const px = box.x + box.width / 2;
    // nothing over the wide bar's middle: the 320 column's border handle sat there (app.split.panel)
    const hit = await s.page.evaluate(([x, y]) => {
      const el = document.elementFromPoint(x, y);
      return el?.closest('[data-testid="app.right.bims.town"]') !== null && el !== null ? 'town' : `${el?.tagName ?? 'nothing'} ${el?.getAttribute('data-testid') ?? ''}`;
    }, [px, py] as const);
    expect(hit, "the wide town's middle is the town's").toBe('town');
    for (let i = 0; i < 12; i++) await trackpad(s.cdp, px, py, { dy: -20, pinch: true });
    await expect(s.page.getByTestId('app.right.bims.town')).toHaveAttribute('data-zoomed', 'true');
    await expect.poll(async () => (await probe(s))?.live.length ?? 0, { timeout: 5000 }).toBeGreaterThan(0);
    await s.page.evaluate(() => {
      (window as unknown as { __biseBlur?: boolean }).__biseBlur = true;
      window.dispatchEvent(new Event('blur'));
    });
    await sleep(500);
    let f0 = (await probe(s))?.frames ?? 0;
    await sleep(2000);
    expect(((await probe(s))?.frames ?? 0) - f0, 'blurred, zoomed in: 0 frames').toBe(0);
    await s.page.evaluate(() => {
      (window as unknown as { __biseBlur?: boolean }).__biseBlur = false;
      window.dispatchEvent(new Event('focus'));
    });
    await setHidden(s.page, true);
    await sleep(500);
    f0 = (await probe(s))?.frames ?? 0;
    await sleep(2000);
    expect(((await probe(s))?.frames ?? 0) - f0, 'hidden, zoomed in: 0 frames').toBe(0);
    await setHidden(s.page, false);
  } finally {
    await s.close();
  }
});

/** how far an office's drawn box may pass its ground (its plan footprint), world units: a roof's eave, a tree's crown */
const DRAWN_MARGIN = 1.5;

/** what is wrong with the offices in view at this frame: not drawn, drawn off its ground, or cut by the camera's near or far plane */
async function drawnFaults(s: Session, where: string): Promise<string[]> {
  const out: string[] = [];
  for (const d of await drawnNow(s)) {
    if (!d.inView) continue;
    const at = `${where}: ${d.id}${d.live ? ' (live)' : ''}`;
    if (!d.shown || d.box === null || d.depth === null) {
      out.push(`${at} in view, not drawn`);
      continue;
    }
    const b = d.box;
    const m = DRAWN_MARGIN;
    if (b.x0 < d.fp.x0 - m || b.x1 > d.fp.x1 + m || b.z0 < d.fp.z0 - m || b.z1 > d.fp.z1 + m) {
      out.push(`${at} drawn off its ground: x ${b.x0.toFixed(1)}..${b.x1.toFixed(1)} z ${b.z0.toFixed(1)}..${b.z1.toFixed(1)}, its ground x ${d.fp.x0.toFixed(1)}..${d.fp.x1.toFixed(1)} z ${d.fp.z0.toFixed(1)}..${d.fp.z1.toFixed(1)}`);
    }
    if (d.depth.min < d.depth.near || d.depth.max > d.depth.far) {
      out.push(`${at} cut by the camera: depth ${d.depth.min.toFixed(1)}..${d.depth.max.toFixed(1)}, near ${d.depth.near.toFixed(1)} far ${d.depth.far.toFixed(1)}`);
    }
  }
  return out;
}

// 12 and 20: the check; 3 and 25: bims' shots too
for (const n of [3, 12, 20, 25]) {
  test(`(town) ${String(n)} projects, a camera path: every office in view drawn whole, on its own ground`, async () => {
    const ps = fakes(n);
    const { s, core } = await openTown(ps, 'light');
    try {
      await showTown(s);
      await settled(s);
      const faults: string[] = [...(await drawnFaults(s, 'fit'))];
      await shot(s, 'app.right.bims.town', `town-${String(n)}-path-fit.png`, `town, ${String(n)} projects, the whole town`, 'every office drawn, the ones nearest the camera (bottom) too');
      const all = await drawnNow(s);
      expect(all.length, "one office per project, bise's home among them").toBe(n + 1);
      expect(all.filter((d) => !d.inView).map((d) => d.id), 'at the fit every office is in view').toEqual([]);
      const near = Math.min(...all.map((d) => (d.depth ? d.depth.min - d.depth.near : 999)));
      console.log(`town ${String(n)}: nearest office ${near.toFixed(1)} past the near plane`);
      const town = s.page.getByTestId('app.right.bims.town');
      const box = await town.boundingBox();
      if (box === null) throw new Error('no town');
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      // pinched in past the live zoom, then a tour: the four corners and back through the middle
      for (let i = 0; i < 6; i++) await trackpad(s.cdp, cx, cy, { dy: -20, pinch: true });
      await expect(town).toHaveAttribute('data-zoomed', 'true');
      const path: [string, number, number][] = [['middle', 0, 0], ['top left', -1, -1], ['top right', 1, -1], ['bottom right', 1, 1], ['bottom left', -1, 1], ['bottom', 0, 1]];
      for (const [name, dx, dy] of path) {
        // two fingers: many small steps to the edge (the pan stops at the town's)
        for (let i = 0; i < 12; i++) await trackpad(s.cdp, cx, cy, { dx: dx * 80, dy: dy * 80 });
        if (dx === 0 && dy === 0) await sleep(300);
        await settled(s, 600, 6000);
        faults.push(...(await drawnFaults(s, name)));
        if (name === 'middle') {
          // a live office's desks light up and go dark (its agents start and stop): its walls baked again in place
          const live = (await probe(s))?.live ?? [];
          for (const status of ['working', 'idle'] as const) {
            for (const p of ps.filter((x) => live.includes(x.id))) await core.send({ ev: 'agents', project: p.id, agents: p.agents.map((a) => ({ ...a, status })), places: [] } as never);
            await sleep(400);
            await settled(s, 600, 6000);
            faults.push(...(await drawnFaults(s, `middle, ${status}`)));
          }
        }
        if (name === 'middle') await shot(s, 'app.right.bims.town', `town-${String(n)}-path-middle.png`, `town, ${String(n)} projects, pinched in at its middle, desks lit and dark again`, 'the live offices whole, their walls on their own ground under their bims');
      }
      expect(faults, 'every office in view drawn whole, on its own ground').toEqual([]);
    } finally {
      await s.close();
    }
  });
}

test('(town) a lost WebGL context shows the line', async () => {
  const { s } = await openTown(fakes(3), 'light');
  try {
    await showTown(s);
    expect(await loseContext(s.page, 'app.right.bims.town.canvas'), 'WEBGL_lose_context on the town canvas').toBe(true);
    await expect(s.page.getByTestId('app.right.bims.lost')).toBeVisible({ timeout: 5000 });
  } finally {
    await s.close();
  }
});

/**
 * What is wrong with the town's marks now (bims m_31373): two shown marks (signs, the live bims'
 * labels) over one another, a sign without its name (a bare pill), a sign cut by the town's edge.
 */
async function markFaults(s: Session, where: string): Promise<string[]> {
  const out = await s.page.evaluate(() => {
    const town = document.querySelector('[data-testid="app.right.bims.town"]');
    if (town === null) return ['no town'];
    const tb = town.getBoundingClientRect();
    const shown = (e: HTMLElement): boolean => e.style.visibility !== 'hidden' && e.offsetWidth > 0;
    const marks = [
      ...Array.from(document.querySelectorAll<HTMLElement>('[data-testid^="app.right.bims.town.sign."]')).filter(shown).map((e) => ({ e, what: `sign ${e.querySelector('.bims-sign-name')?.textContent ?? '?'}`, sign: true })),
      ...Array.from(document.querySelectorAll<HTMLElement>('[data-testid^="app.right.bims.town.label."]')).filter(shown).map((e) => ({ e, what: `label ${(e.dataset.testid ?? '').split('.').pop() ?? '?'}`, sign: false })),
    ].map((m) => ({ ...m, r: m.e.getBoundingClientRect() }));
    const faults: string[] = [];
    const at = (r: DOMRect): string => `${String(Math.round(r.x - tb.x))},${String(Math.round(r.y - tb.y))}`;
    for (const m of marks) {
      if (!m.sign) continue;
      const name = m.e.querySelector<HTMLElement>('.bims-sign-name');
      if (name === null || name.offsetWidth === 0) faults.push(`${m.what} at ${at(m.r)}: a bare pill, no name`);
      if (m.r.x < tb.x - 0.5 || m.r.y < tb.y - 0.5 || m.r.right > tb.right + 0.5 || m.r.bottom > tb.bottom + 0.5) faults.push(`${m.what} at ${at(m.r)}: cut by the town's edge`);
      // seen whole: its two ends are its own on screen (nothing over them, no parent's clip)
      for (const x of [m.r.x + 2, m.r.right - 2]) {
        const hit = document.elementFromPoint(x, m.r.y + m.r.height / 2);
        if (hit === null || !m.e.contains(hit)) faults.push(`${m.what} at ${at(m.r)}: its end at x ${String(Math.round(x - tb.x))} not seen (${hit === null ? 'off the window' : `${hit.tagName.toLowerCase()}.${hit.className} ${hit.getAttribute('data-testid') ?? ''}`})`);
      }
    }
    for (const [i, a] of marks.entries()) {
      for (const b of marks.slice(i + 1)) {
        const over = a.r.x < b.r.right - 1 && b.r.x < a.r.right - 1 && a.r.y < b.r.bottom - 1 && b.r.y < a.r.bottom - 1;
        if (over) faults.push(`${a.what} at ${at(a.r)} over ${b.what} at ${at(b.r)}`);
      }
    }
    return faults;
  });
  return out.map((f) => `${where}: ${f}`);
}

// bims m_31373: at the fit and pinched in on live offices, 3/12/25/40 projects, light and dark
for (const n of [3, 12, 25, 40]) {
  for (const theme of ['light', 'dark'] as const) {
    test(`(town) ${String(n)} projects, ${theme}: no mark over another, none without its name, fit and live`, async () => {
      const { s } = await openTown(fakes(n), theme);
      try {
        await showTown(s);
        await settled(s);
        const faults = await markFaults(s, 'fit');
        const shownSigns = await s.page.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>('[data-testid^="app.right.bims.town.sign."]')).filter((e) => e.style.visibility !== 'hidden').length);
        console.log(`town ${String(n)} ${theme}: ${String(shownSigns)} signs shown at the fit`);
        await shot(s, 'app.right.bims.town', `signs-${String(n)}-fit-${theme}.png`, `signs, ${String(n)} projects, the fit, ${theme}`, 'every sign whole with its name (compact: name and pills), none over another; no room: hidden whole');
        const town = s.page.getByTestId('app.right.bims.town');
        const box = await town.boundingBox();
        if (box === null) throw new Error('no town');
        // pinched in past the live zoom, then closer: the live offices' bims and their labels under the signs
        for (const [step, k] of [['live', 5], ['close', 6]] as const) {
          for (let i = 0; i < k; i++) await trackpad(s.cdp, box.x + box.width / 2, box.y + box.height / 2, { dy: -20, pinch: true });
          await expect(town).toHaveAttribute('data-zoomed', 'true');
          await expect.poll(async () => (await probe(s))?.live.length ?? 0, { timeout: 5000, message: 'offices in view posed live' }).toBeGreaterThan(0);
          await sleep(600);
          // the bims walk, their labels come and go: a few looks
          for (let j = 0; j < 4; j++) {
            faults.push(...(await markFaults(s, `${step} #${String(j)}`)));
            await sleep(350);
          }
          await shot(s, 'app.right.bims.town', `signs-${String(n)}-${step}-${theme}.png`, `signs, ${String(n)} projects, pinched in (${step}), ${theme}`, "the live bims' labels win: a live office's sign above its back wall, or hidden");
        }
        expect(faults, 'no mark over another, none without its name').toEqual([]);
      } finally {
        await s.close();
      }
    });
  }
}
