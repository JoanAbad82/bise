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
//     on a reload; 'open' opens the project's main thread.
// Shots for bims (.harness-cache/bims-shots): 3 and 12 projects, 320 and wide, day and night; the
// dive's last town frame and the Office's first, side by side. Owner: maps-e.
import { test, expect, FakeCore, launchDesktop, type Session } from '../../harness';
import { agent, card, mainAgent } from '../../../src/bims/fixtures';
import { STAGE_AT } from '../../../src/bims/growth';
import { shotOf, sleep, writeIndex, type Shot } from './world';

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
    const k = 2 + ((i * 5) % 7);
    const agents = [
      mainAgent({ status: i % 3 === 0 ? 'working' : 'idle' }),
      ...Array.from({ length: k }, (_, j) => agent(`${NAMES[i] ?? 'p'}-${String(j)}`, { status: j % 2 === 0 ? 'working' : j % 3 === 0 ? 'waiting' : 'idle', turn_ms: 1000 })),
    ];
    return { id: `p${String(i)}-0000town`, name: NAMES[i] ?? `p${String(i)}`, stage: STAGES[i % STAGES.length] ?? 0, agents, asks: i % 4 === 1 ? 2 : i % 5 === 2 ? 1 : 0 };
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
      { ev: 'growth', project: p.id, growth: { jobs_done: STAGE_AT[p.stage] ?? 0, days_used: p.stage * 4, artifacts_made: p.stage * 12 } },
      { ev: 'cards', project: p.id, cards: Array.from({ length: p.asks }, (_, j) => card(100 + j, p.agents[1]?.name ?? 'main', { project: p.id })) },
    );
  }
  return evs;
}

type TownProbe = { frames: number; calls: number; ms: number; offices: number; merged: { from: number; to: number }; check: { road: number; river: number } };
const probe = (s: Session): Promise<TownProbe | null> =>
  s.page.evaluate(() => (window as unknown as { __biseTown?: TownProbe }).__biseTown ?? null);

async function openTown(ps: readonly Fake[], theme: 'light' | 'dark', width = 1400): Promise<{ s: Session; core: FakeCore }> {
  const core = new FakeCore(townWorld(ps, theme) as never);
  const s = await launchDesktop({ core, route: 'bise', size: `${String(width)}x900` });
  await expect(s.page.getByTestId('app.title.bims'), "bise's thread has the bims icon").toBeVisible({ timeout: 20_000 });
  return { s, core };
}

async function showTown(s: Session): Promise<void> {
  const town = s.page.getByTestId('app.right.bims.town');
  if ((await town.count()) === 0) await s.page.getByTestId('app.title.bims').click();
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
    expect(p?.offices, 'one office per project').toBe(12);
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
