// bims/office · les bims (page bims-office v7, spec les-bims-sc-narios-du-bureau §1, §2, §5), the
// right bar's AGENTS as an office, on FakeCore rows from src/bims/fixtures.ts, off screen.
// Passes when:
//   (1) the list view never loads the three chunk (CDP scriptParsed against the built chunk that
//       holds three's REVISION); the office loads it (the control), and back on list it stays one;
//   (2) at 320 and wide (640): at rest no label, only the '?' pills (onboarding, deploy) and the
//       '✗' pill (search-index), with no name in them; a row change shows an event label for ~3 s
//       then nothing; four at once show at most 3 event labels; ⌃ held shows every bim's name; a
//       hover shows the app's tip, one line, the bim's name in it; a click on a bim opens that agent;
//   (3) a world of still poses (asleep, failed, blocked, done, stopped, main reading) draws 0 frames
//       once arrived; a working bim loops at ~8 fps, never 60; hidden draws 0 whatever the world;
//       reduced motion: 0 frames at rest, and a bim that changes place fades (no x,z between its
//       two spots, model.ts Look.reduced);
//   (4) a lost WebGL context shows the list with its line.
// Shots: .harness-cache/bims-shots/*.png and index.html (the designer signs it). Owner: bims-qa.
import { FakeCore, Recorder, changedInside, launchDesktop, test, expect, type Session } from '../../harness';
import { agent, office, snap, watch } from '../../../src/bims/fixtures';
import type { Snapshot } from '../../../src/bims/model';
import path from 'node:path';
import {
  P, SHOTS, headOf, loseContext, overlay, probe, rowsOf, setHidden, threeChunks, watchScripts,
  world, writeIndex, type Shot,
} from './world';

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
const shots: Shot[] = [];

/** Every live bim's name in the office (archived rows have no bim). */
const NAMES = office.agents.filter((a) => !a.archived).map((a) => a.name);

/** The office's world with these agents' rows replaced (an event: a row that changes). */
const withRows = (base: Snapshot, over: Record<string, Partial<(typeof office.agents)[number]>>): Snapshot => ({
  ...base,
  agents: base.agents.map((a) => (over[a.name] === undefined ? a : { ...a, ...over[a.name] })),
});

async function open(snapshot: Snapshot, o: { theme?: 'light' | 'dark'; reduced?: boolean; width?: number } = {}): Promise<{ s: Session; core: FakeCore }> {
  const core = new FakeCore(world(snapshot, o.theme ?? 'light') as never);
  const s = await launchDesktop({ core, route: `project/${P}`, size: `${String(o.width ?? 1400)}x900` });
  if (o.reduced === true) await s.page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(s.page.getByTestId('app.right.agents.view.list')).toBeVisible({ timeout: 20_000 });
  return { s, core };
}

/** The office on, its renderer loaded and drawing. */
async function showOffice(s: Session): Promise<void> {
  await s.page.getByTestId('app.right.agents.view.bims').click();
  await expect(s.page.getByTestId('app.right.bims')).toHaveAttribute('data-state', 'on', { timeout: 20_000 });
  await expect.poll(async () => (await probe(s.page))?.frames ?? 0, { timeout: 10_000 }).toBeGreaterThan(0);
}

/** Waits until the renderer stops drawing (no new frame for `quietMs`), at most `maxMs`. */
async function settle(s: Session, quietMs = 1500, maxMs = 20_000): Promise<void> {
  const end = Date.now() + maxMs;
  let last = (await probe(s.page))?.frames ?? 0;
  let since = Date.now();
  while (Date.now() < end) {
    await sleep(250);
    const n = (await probe(s.page))?.frames ?? 0;
    if (n !== last) { last = n; since = Date.now(); } else if (Date.now() - since >= quietMs) return;
  }
}

/** Frames the renderer drew in `ms` (the probe) and canvas frames the compositor showed (the Recorder). */
async function drawnIn(s: Session, ms: number): Promise<{ frames: number; shown: number }> {
  const box = await s.page.getByTestId('app.right.bims.canvas').boundingBox();
  if (box === null) throw new Error('no office canvas');
  const rec = new Recorder(s.cdp, s.page);
  const f0 = (await probe(s.page))?.frames ?? 0;
  await rec.start();
  await sleep(ms);
  const fr = await rec.stop();
  const f1 = (await probe(s.page))?.frames ?? 0;
  const shown = changedInside(fr, box).filter((n) => n > 0).length;
  return { frames: f1 - f0, shown };
}

async function shot(s: Session, file: string, title: string, says: string): Promise<void> {
  const bar = await s.page.getByTestId('app.right.bims').boundingBox();
  await s.page.screenshot({ path: path.join(SHOTS, file), ...(bar === null ? {} : { clip: bar }) });
  shots.push({ file, title, says });
}

test.afterAll(() => {
  if (shots.length > 0) writeIndex(shots);
});

test('(1) the list view never loads the three chunk', async () => {
  const chunks = threeChunks();
  expect(chunks, 'out/renderer has exactly one chunk with three in it (pnpm build first)').toHaveLength(1);
  const { s } = await open(office);
  try {
    const parsed = await watchScripts(s.cdp);
    await sleep(3000);
    expect(parsed().filter((f) => chunks.includes(f)), 'the list loaded three').toEqual([]);
    await showOffice(s);
    expect(parsed().filter((f) => chunks.includes(f)), 'the office loads three (the control)').toHaveLength(1);
    await s.page.getByTestId('app.right.agents.view.list').click();
    await expect(s.page.getByTestId('app.right.bims')).toHaveCount(0);
    await expect(s.page.getByTestId(`app.right.agent.${NAMES[1] ?? ''}`)).toBeVisible();
  } finally {
    await s.close();
  }
});

/** 320 at rest; wide = 640, docked when the window has room, slid over the thread when not (bims-wire m_27585). */
const SIZES = [
  { w: 320, win: 1400, wide: null },
  { w: 640, win: 1600, wide: 'docked' },
  { w: 640, win: 1100, wide: 'over' },
] as const;

for (const { w, win, wide } of SIZES) {
  const tag = wide === null ? String(w) : `${String(w)}-${wide}`;
  test(`(2) the office at ${tag}: labels, pills, ⌃, hover, click`, async () => {
    const { s, core } = await open(office, { width: win });
    try {
      await showOffice(s);
      if (wide !== null) {
        await s.page.getByTestId('app.right.agents.width.wide').click();
        await expect(s.page.getByTestId('app.panel')).toHaveAttribute('data-wide', wide, { timeout: 3000 });
      }
      const bar = await s.page.getByTestId('app.right.bims').boundingBox();
      expect(Math.round(bar?.width ?? 0), `the office is ${String(w)} wide`).toBe(w);
      await settle(s);

      // at rest: no label, the '?' and '✗' pills, no name in them
      const rest = await overlay(s.page);
      expect(rest.labels, 'no label at rest').toEqual([]);
      expect(rest.pills.map((p) => `${p.name}:${p.pill}`).sort()).toEqual(['deploy:asks', 'onboarding:asks', 'search-index:failed']);
      for (const p of rest.pills) expect(p.text, `${p.name}'s pill has no name`).not.toContain(p.name);
      await shot(s, `rest-${tag}.png`, `at rest, ${tag} px`, "no label; '?' over onboarding and deploy, '✗' over search-index");

      // an event: signup-perf is done -> 'signup-perf · done' for 3 s, then nothing
      await core.send(rowsOf(withRows(office, { 'signup-perf': { status: 'done', title: 'landed' } })) as never);
      await expect.poll(async () => (await overlay(s.page)).labels.filter((l) => l.mode === 'event').map((l) => l.name), { timeout: 2000 }).toEqual(['signup-perf']);
      const t0 = Date.now();
      await shot(s, `event-${tag}.png`, `an event, ${tag} px`, "signup-perf done: its label 'signup-perf · done' over it, 3 s");
      await sleep(Math.max(0, 2400 - (Date.now() - t0)));
      expect((await overlay(s.page)).labels.filter((l) => l.mode === 'event'), 'still shown at 2.4 s').toHaveLength(1);
      await expect.poll(async () => (await overlay(s.page)).labels.filter((l) => l.mode === 'event').length, { timeout: 2500 }).toBe(0);
      expect(Date.now() - t0, 'gone by 3 s + the 0.6 s fade').toBeLessThan(4400);

      // four events at once: at most 3 event labels at any time
      await core.send(rowsOf(withRows(office, {
        'signup-perf': { status: 'working', turn_ms: 1000 }, 'dark-mode': { status: 'done' }, 'empty-state': { status: 'working', turn_ms: 1000 }, nightly: { status: 'done', watching: [] },
      })) as never);
      let most = 0;
      for (let i = 0; i < 16; i++) {
        most = Math.max(most, (await overlay(s.page)).labels.filter((l) => l.mode === 'event').length);
        if (i === 3) await shot(s, `events-${tag}.png`, `four events at once, ${tag} px`, 'at most 3 event labels at a time');
        await sleep(250);
      }
      expect(most, 'at most 3 event labels').toBeLessThanOrEqual(3);
      expect(most, 'the events show').toBeGreaterThan(0);
      await core.send(rowsOf(office) as never);
      await settle(s);

      // ⌃ held: every bim's name
      await s.page.keyboard.down('Control');
      await expect.poll(async () => (await overlay(s.page)).labels.filter((l) => l.mode === 'name').length, { timeout: 3000 }).toBe(NAMES.length);
      await shot(s, `held-${tag}.png`, `⌃ held, ${tag} px`, 'every name, small, over each bim');
      await s.page.keyboard.up('Control');
      await expect.poll(async () => (await overlay(s.page)).labels.length, { timeout: 2000 }).toBe(0);

      // hover: the app's tip, one line, with the bim's name
      const head = await headOf(s.page, 'cookie-banner');
      expect(head, "cookie-banner's head on the canvas").not.toBeNull();
      await s.page.mouse.move(head?.x ?? 0, (head?.y ?? 0) + 6);
      const tip = s.page.getByTestId('tip.words');
      await expect(tip).toContainText('cookie-banner', { timeout: 3000 });
      const lines = await tip.evaluate((e) => Math.round(e.getBoundingClientRect().height / (parseFloat(getComputedStyle(e).lineHeight) || 18)));
      expect(lines, 'the tip is one line').toBe(1);
      await shot(s, `hover-${tag}.png`, `hover, ${tag} px`, "the app's tip over cookie-banner: 'name · state · title', one line");

      // click: opens that agent (a row's open: the thread route)
      await s.page.mouse.click(head?.x ?? 0, (head?.y ?? 0) + 6);
      await expect.poll(() => s.page.evaluate(() => sessionStorage.getItem('bise.history') ?? ''), { timeout: 3000 }).toContain(`agent/${P}/cookie-banner`);
    } finally {
      await s.close();
    }
  });
}

/** Asleep, failed, blocked, done, stopped, main reading: no pose loops (model.ts Motion). */
const STILL = snap([
  agent('main', { main: true, place_id: '', status: 'idle' }),
  agent('login-test', { status: 'waiting', watching: [watch('cargo test')] }),
  agent('cookie-banner', { status: 'blocked' }),
  agent('search-index', { status: 'failed' }),
  agent('copy-fix', { status: 'done' }),
  agent('import', { status: 'done', phase: 'stopped' }),
]);

test('(3) no frame while every bim is still or the window hidden; ~8 fps for a loop', async () => {
  const { s, core } = await open(STILL);
  try {
    await showOffice(s);
    await settle(s);
    const still = await drawnIn(s, 3000);
    expect(still, 'a still office draws nothing').toEqual({ frames: 0, shown: 0 });

    // one bim types: the loop's rate, never the display's
    await core.send(rowsOf(withRows(STILL, { 'cookie-banner': { status: 'working', turn_ms: 1000 } })) as never);
    await settle(s, 0, 4000);
    await sleep(3000);
    const loop = await drawnIn(s, 3000);
    expect(loop.frames / 3, 'a typing bim: ~8 fps').toBeGreaterThan(4);
    expect(loop.frames / 3, 'never the display rate').toBeLessThan(12);

    // hidden: nothing, whatever the world
    await setHidden(s.page, true);
    await sleep(300);
    expect(await drawnIn(s, 2000), 'hidden draws nothing').toEqual({ frames: 0, shown: 0 });
    await setHidden(s.page, false);
    await expect.poll(async () => (await drawnIn(s, 1000)).frames, { timeout: 4000 }).toBeGreaterThan(0);
  } finally {
    await s.close();
  }
});

test('(3) reduced motion: no loop, a bim that moves fades (no walk)', async () => {
  const { s, core } = await open(office, { reduced: true });
  try {
    await showOffice(s);
    await settle(s);
    expect(await drawnIn(s, 2000), 'the office with typing bims draws nothing under reduced motion').toEqual({ frames: 0, shown: 0 });
    await shot(s, 'reduced-rest.png', 'reduced motion, at rest', 'every pose reads without motion: no loop runs');

    // empty-state wakes up (lounge -> its desk): a fade, never a walk
    const t0 = Date.now() / 1000;
    await core.send(rowsOf(withRows(office, { 'empty-state': { status: 'working', turn_ms: 1000 } })) as never);
    await settle(s);
    const trace = ((await probe(s.page))?.trace ?? []).filter((p) => p.name === 'empty-state' && p.t >= t0 - 1);
    const spots = new Set(trace.map((p) => `${p.x.toFixed(2)},${p.z.toFixed(2)}`));
    expect(trace.length, 'the move was drawn').toBeGreaterThan(1);
    expect(spots.size, `empty-state stood at ${[...spots].join(' ')}: two spots at most, nothing between`).toBeLessThanOrEqual(2);
    expect(trace.some((p) => p.op > 0.05 && p.op < 0.95), 'it faded').toBe(true);
  } finally {
    await s.close();
  }
});

test('(4) a lost WebGL context shows the list with its line', async () => {
  const { s } = await open(office);
  try {
    await showOffice(s);
    expect(await loseContext(s.page), 'WEBGL_lose_context on the office canvas').toBe(true);
    await expect(s.page.getByTestId('app.right.bims.lost')).toBeVisible({ timeout: 5000 });
    await expect(s.page.getByTestId('app.right.bims.canvas')).toHaveCount(0);
    await expect(s.page.getByTestId('app.right.agent.signup-perf')).toBeVisible();
    const box = await s.page.getByTestId('app.right.agents').boundingBox();
    await s.page.screenshot({ path: path.join(SHOTS, 'lost.png'), ...(box === null ? {} : { clip: box }) });
    shots.push({ file: 'lost.png', title: 'WebGL lost', says: 'the list again, with its one line' });
  } finally {
    await s.close();
  }
});
