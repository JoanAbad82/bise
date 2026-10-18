// bims/hover · his seven asks of 2026-10 on les bims (task bims-hover), on FakeCore rows from
// src/bims/fixtures.ts, off screen. Passes when:
//   (a) a fresh window shows the list alone (the office closed: an easter egg), the AGENTS head's
//       cube not pressed; the cube opens it (the fold grows empty, then the scene fades in,
//       all under 800 ms: a frame strip) and closes it again;
//   (b) hovering an AGENTS row rings its bim at once and shows its card after the tip's delay;
//       hovering a bim tints its row;
//   (c) an agent's thread open: the office zooms on its bim (follow), a '?' out of the frame stays
//       at the edge with its arrow; main's thread: the whole office again;
//   (d) the deck chairs and the done bim on one, the sleepers' z's, light and dark;
//   (e)(f) the cube and 'the bims' in the AGENTS head left of 'all ›' (none in the title bar),
//       closed, hovered, open at 320 and wide; (f2) at rest it blinks and hops, once each, then
//       nothing runs; never open, hidden or under reduced motion; (f3) the hop's strip for bims.
// Shots: .harness-cache/bims-shots (index.html), for bims and designer to sign. Owner: bims-hover.
import { test, expect } from '../../harness';
import type { Session } from '../../harness';
import { agent, office, snap } from '../../../src/bims/fixtures';
import { bims } from '../../../src/proto/words_bims.gen';
import { thread } from '../../../src/proto/words_thread.gen';
import { Recorder, type Box } from '../../harness';
import { PNG } from 'pngjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { FakeCore } from '../../harness';
import { P, SHOTS, headOf, open, setHidden, settle, shotOf, sleep, writeIndex, type Shot } from './world';

type Frame = Awaited<ReturnType<Recorder['stop']>>[number];
/** n frames spread over the film, first and last included */
const strip = (fr: readonly Frame[], n: number): Frame[] =>
  fr.length <= n ? [...fr] : Array.from({ length: n }, (_, i) => fr[Math.round((i * (fr.length - 1)) / (n - 1))]).filter((f): f is Frame => f !== undefined);
/** `below`: px past the box's bottom (the office grows under AGENTS' head) */
function cropTo(f: Frame, box: Box, file: string, below = 320): void {
  const sc = f.scale;
  const x0 = Math.round(box.x * sc), y0 = Math.round(box.y * sc);
  const w = Math.min(Math.round(box.width * sc), f.png.width - x0), h = Math.min(Math.round(box.height * sc) + Math.round(below * sc), f.png.height - y0);
  const out = new PNG({ width: w, height: h });
  PNG.bitblt(f.png, out, x0, y0, w, h, 0, 0);
  mkdirSync(SHOTS, { recursive: true });
  writeFileSync(path.join(SHOTS, file), PNG.sync.write(out));
}

const shots: Shot[] = [];
test.describe.configure({ timeout: 180_000 });
test.afterAll(() => {
  if (shots.length > 0) writeIndex(shots);
});

async function shot(s: Session, file: string, title: string, says: string, what = 'app.right.bims'): Promise<void> {
  const box = await s.page.getByTestId(what).boundingBox();
  if (box === null) throw new Error(`nothing to shoot for ${file}`);
  await shotOf(s.cdp, s.page, box, file);
  shots.push({ file, title, says });
}

/** open an agent by a click on its bim (copy-fix's row is past the AGENTS cap of 8) */
async function clickBim(s: Session, name: string): Promise<void> {
  const h = await headOf(s.page, name);
  if (h === null) throw new Error(`no ${name} head`);
  await s.page.mouse.click(h.x, h.y + 8);
  // off the office: its card closes, the shot sees the bim
  await s.page.mouse.move(5, 300);
}

/** stage 8's terrace (its deck chairs), as grow.spec does: the check's growth, then the hub's event */
async function grown(s: Session, core: FakeCore): Promise<void> {
  const g = { jobs_done: 90, days_used: 20, artifacts_made: 160 };
  await s.page.evaluate((x) => { (window as unknown as { __biseGrow?: unknown }).__biseGrow = x; }, g);
  await core.send({ ev: 'growth', project: P, growth: g } as never);
}

/** the office's camera zoom (window.__biseBims has none: read it from the '⤢ fit' button's presence) */
const zoomed = async (s: Session): Promise<boolean> => (await s.page.getByTestId('app.right.bims').getAttribute('data-zoomed')) !== null;

test("(a) closed by default; the AGENTS head's cube opens and closes the office, the open under 800 ms", async () => {
  const { s } = await open(office, { width: 1600 });
  try {
    await expect(s.page.getByTestId('app.right.bims')).toHaveCount(0);
    const icon = s.page.getByTestId('app.right.agents.bims');
    await expect(icon).toHaveAttribute('aria-pressed', 'false');
    await expect(icon).toHaveText(bims.cube_label);
    await shot(s, 'hover-a-closed.png', 'a fresh window: the office closed', "the AGENTS head's cube and 'the bims' left of 'all ›', not pressed; AGENTS shows its rows", 'app.right.agents');
    // the chunk once, so the timing below is the open's own (the first open loads three)
    await icon.click();
    await expect(s.page.getByTestId('app.right.bims')).toHaveAttribute('data-shown', 'true', { timeout: 20_000 });
    await icon.click();
    await expect(s.page.getByTestId('app.right.bims.fold')).toHaveCount(0, { timeout: 2000 });
    // the open: timed in the page (the click to the office shown, + its 220 ms fade), filmed by the screencast
    await s.page.evaluate(() => {
      const w = window as unknown as { __openAt?: number; __shownAt?: number };
      delete w.__shownAt;
      w.__openAt = performance.now();
      new MutationObserver((_, o) => {
        if (document.querySelector('[data-testid="app.right.bims"][data-shown]') === null) return;
        w.__shownAt = performance.now();
        o.disconnect();
      }).observe(document.body, { subtree: true, attributes: true, childList: true });
    });
    const rec = new Recorder(s.cdp, s.page);
    await rec.start();
    await icon.click();
    await expect(s.page.getByTestId('app.right.bims')).toHaveAttribute('data-shown', 'true', { timeout: 2000 });
    await sleep(500);
    const frames = await rec.stop();
    const took = await s.page.evaluate(() => {
      const w = window as unknown as { __openAt?: number; __shownAt?: number };
      return (w.__shownAt ?? Infinity) - (w.__openAt ?? 0);
    });
    expect(took + 220, 'the open, grown and faded in (ms)').toBeLessThan(800);
    const agentsBox = await s.page.getByTestId('app.right.agents').boundingBox();
    if (agentsBox === null) throw new Error('no AGENTS section');
    const t0 = frames[0]?.t ?? 0;
    for (const [i, f] of strip(frames, 8).entries()) {
      const file = `hover-a-open-${String(i)}.png`;
      cropTo(f, agentsBox, file);
      shots.push({ file, title: `opening, +${String(Math.round((f.t - t0) * 1000))} ms`, says: `the fold grows empty, then the office fades in (shown ${String(Math.round(took))} ms after the click, + the 220 ms fade)` });
    }
    await icon.click();
    await expect(icon).toHaveAttribute('aria-pressed', 'false');
    await expect(s.page.getByTestId('app.right.bims.fold')).toHaveCount(0, { timeout: 2000 });
  } finally {
    await s.close();
  }
});

test('(b) a row hovered rings its bim and shows its card; a bim hovered tints its row', async () => {
  const { s } = await open(office, { width: 1600 });
  try {
    await s.page.getByTestId('app.right.agents.bims').click();
    await expect(s.page.getByTestId('app.right.bims')).toHaveAttribute('data-shown', 'true', { timeout: 20_000 });
    await settle(s, 800, 6000);
    const row = s.page.getByTestId('app.right.agent.signup-perf');
    await row.hover();
    await expect(s.page.getByTestId('app.right.bims.label.signup-perf')).toBeVisible({ timeout: 2000 });
    await sleep(300);
    await shot(s, 'hover-b-row.png', "signup-perf's row hovered", 'a soft halo (the text colour, no pink) on the floor under signup-perf, its card over its head', 'app.right.agents');
    // a bim hovered: its row tints
    await s.page.mouse.move(0, 0);
    const h = await headOf(s.page, 'dark-mode');
    if (h === null) throw new Error('no dark-mode head');
    await s.page.mouse.move(h.x - 2, h.y + 4);
    await s.page.mouse.move(h.x, h.y + 6, { steps: 3 });
    await expect(s.page.getByTestId('app.right.agent.dark-mode')).toHaveAttribute('data-lit', 'true', { timeout: 2000 });
    await shot(s, 'hover-b-bim.png', 'dark-mode hovered in the office', "its card, and its AGENTS row with the rows' hover tint", 'app.right.agents');
  } finally {
    await s.close();
  }
});

test('(c) an agent opened: the office follows its bim; a pill out of frame stays at the edge; main: the whole office', async () => {
  const { s, core } = await open(office, { width: 1600 });
  try {
    await s.page.getByTestId('app.right.agents.bims').click();
    await expect(s.page.getByTestId('app.right.bims')).toHaveAttribute('data-shown', 'true', { timeout: 20_000 });
    await grown(s, core);
    await settle(s, 800, 6000);
    await clickBim(s, 'copy-fix');
    await expect.poll(() => zoomed(s), { timeout: 3000 }).toBe(true);
    await settle(s, 800, 6000);
    await shot(s, 'hover-c-follow-done.png', 'copy-fix opened (done)', 'the office zoomed on copy-fix in its deck chair; the ? pills of onboarding and deploy, out of the frame, at its edge with an arrow');
    await s.page.getByTestId('app.right.agent.signup-perf').click();
    await sleep(500);
    await settle(s, 800, 6000);
    await shot(s, 'hover-c-follow-work.png', 'signup-perf opened (working)', 'the camera moved to signup-perf at its desk, its halo under it');
    // back twice: copy-fix, then main's thread
    await s.page.getByTestId('app.title.back').click();
    await sleep(300);
    await s.page.getByTestId('app.title.back').click();
    await expect.poll(() => zoomed(s), { timeout: 3000 }).toBe(false);
    await settle(s, 800, 6000);
    await shot(s, 'hover-c-main.png', thread.from_thread({ name: 'main' }), 'the whole office again');
  } finally {
    await s.close();
  }
});

for (const theme of ['light', 'dark'] as const) {
  test(`(d) deck chairs and z's, ${theme}`, async () => {
    const { s, core } = await open(office, { theme, width: 1600 });
    try {
      await s.page.getByTestId('app.right.agents.bims').click();
      await expect(s.page.getByTestId('app.right.bims')).toHaveAttribute('data-shown', 'true', { timeout: 20_000 });
      await grown(s, core);
      await settle(s, 800, 8000);
      await expect(s.page.getByTestId('app.right.bims.zzz.login-test')).toHaveCount(1);
      await expect(s.page.getByTestId('app.right.bims.zzz.nightly')).toHaveCount(1);
      const night = theme === 'dark' ? 'night' : 'day';
      await shot(s, `hover-d-office-${theme}.png`, `the office, ${night}`, "login-test, nightly and pricing-page asleep with their 'z z Z'; copy-fix in a real deck chair");
      // the terrace close: open copy-fix (the follow camera goes there)
      await clickBim(s, 'copy-fix');
      await expect.poll(() => zoomed(s), { timeout: 3000 }).toBe(true);
      await settle(s, 800, 6000);
      await shot(s, `hover-d-chair-${theme}.png`, `the deck chairs close, ${night}`, 'a frame on four legs, the seat, the backrest at the bim\'s tilt; copy-fix lies on it, seated, not hovering');
      await s.page.getByTestId('app.right.agent.login-test').click();
      await s.page.mouse.move(5, 300);
      await sleep(600);
      await settle(s, 800, 6000);
      await shot(s, `hover-d-zzz-${theme}.png`, `login-test asleep, close, ${night}`, "its 'z z Z' rising and fading over its head");
    } finally {
      await s.close();
    }
  });
}

/** the AGENTS head alone (its line, 44 px): what designer signs of the cube and its label */
async function headShot(s: Session, file: string, title: string, says: string): Promise<void> {
  const box = await s.page.getByTestId('app.right.agents').boundingBox();
  if (box === null) throw new Error(`no AGENTS for ${file}`);
  await shotOf(s.cdp, s.page, { ...box, height: 44 }, file);
  shots.push({ file, title, says });
}

// (e) the AGENTS head's cube and 'the bims' (his ask, main m_28901), for designer: closed, hovered,
// open at 320 and wide; light and dark
for (const theme of ['light', 'dark'] as const) {
  test(`(e) the head's cube, closed, hovered, open at 320 and wide, ${theme}`, async () => {
    const { s } = await open(office, { theme, width: 1600 });
    try {
      const icon = s.page.getByTestId('app.right.agents.bims');
      await s.page.mouse.move(5, 400);
      await headShot(s, `hover-e-closed-${theme}.png`, `the cube closed, ${theme}`, "'AGENTS · 15' … the pink cube and 'the bims', then 'all ›'");
      await icon.hover();
      await sleep(700);
      await headShot(s, `hover-e-hover-${theme}.png`, `the cube hovered, ${theme}`, `the hover tint behind cube and label, still pink; its tip '${bims.cube_open_tip}'`);
      for (const wide of [false, true]) {
        const w = wide ? 'wide' : '320';
        if ((await icon.getAttribute('aria-pressed')) !== 'true') await icon.click();
        await expect(icon).toHaveAttribute('aria-pressed', 'true');
        await expect(s.page.getByTestId('app.right.bims')).toHaveAttribute('data-shown', 'true', { timeout: 20_000 });
        await s.page.getByTestId(wide ? 'app.right.agents.width.wide' : 'app.right.agents.width.narrow').click();
        await sleep(400);
        await s.page.mouse.move(5, 400);
        await headShot(s, `hover-e-open-${w}-${theme}.png`, `the office open, ${w}, ${theme}`, "'320 wide', then the cube pressed (the hover tint stays), then 'all ›'");
      }
    } finally {
      await s.close();
    }
  });
}

// ---- bims-fix (his two asks, main m_28300) ----------------------------------------------------

/** the follow camera's zoom now (the renderer's probe; 1 = the fit) */
const zoomNow = (s: Session): Promise<number> =>
  s.page.evaluate(() => (window as unknown as { __biseBims?: { zoom: () => number } }).__biseBims?.zoom() ?? 0);

/** the element at the centre of a test id's box is that element (or inside it): shown, not covered */
async function onTop(s: Session, id: string): Promise<boolean> {
  return s.page.evaluate((t) => {
    const el = document.querySelector(`[data-testid="${t}"]`);
    if (el === null) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4 || r.right > window.innerWidth || r.bottom > window.innerHeight || r.left < 0 || r.top < 0) return false;
    const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return at !== null && (at === el || el.contains(at));
  }, id);
}

// (f) the cube in his window state (the right bar open, a 1280 px window): in the AGENTS head, left
// of 'all ›' on its line, the title bar has none; it opens and closes the office at 320 and wide
test("(f) the cube in his window: in the AGENTS head left of 'all ›', none in the title bar; it opens and closes", async () => {
  const { s } = await open(office, { width: 1280 });
  try {
    const icon = s.page.getByTestId('app.right.agents.bims');
    await expect(s.page.getByTestId('app.panel')).toBeVisible();
    // the title bar's cube is gone (moved, not copied)
    await expect(s.page.getByTestId('app.title').locator('svg mask circle')).toHaveCount(0);
    expect(await onTop(s, 'app.right.agents.bims'), 'the cube shown, on top, inside the window').toBe(true);
    const all = s.page.getByTestId('app.right.agents.all');
    for (const wide of [false, true]) {
      const w = wide ? 'wide' : '320';
      // left of 'all ›', on its line, apart from it
      const cb = await icon.boundingBox();
      const ab = await all.boundingBox();
      if (cb === null || ab === null) throw new Error("no cube or no 'all ›'");
      expect(cb.x + cb.width, `the cube before 'all ›' (${w})`).toBeLessThan(ab.x);
      expect(Math.abs(cb.y + cb.height / 2 - (ab.y + ab.height / 2))).toBeLessThan(2);
      if ((await icon.getAttribute('aria-pressed')) !== 'true') await icon.click();
      await expect(s.page.getByTestId('app.right.bims')).toHaveAttribute('data-shown', 'true', { timeout: 20_000 });
      await s.page.getByTestId(wide ? 'app.right.agents.width.wide' : 'app.right.agents.width.narrow').click();
      await sleep(400);
      expect(await onTop(s, 'app.right.agents.bims'), `the cube on top at ${w}`).toBe(true);
      // the width switch before the cube
      const sw = await s.page.getByTestId('app.right.agents.width').boundingBox();
      const cb2 = await icon.boundingBox();
      if (sw === null || cb2 === null) throw new Error('no switch or no cube');
      expect(sw.x + sw.width).toBeLessThanOrEqual(cb2.x);
      await icon.click();
      await expect(s.page.getByTestId('app.right.bims.fold')).toHaveCount(0, { timeout: 2000 });
      await expect(icon).toHaveAttribute('aria-pressed', 'false');
      await expect(s.page.getByTestId('app.right.agents.width')).toHaveCount(0);
      await expect(s.page.getByTestId('app.panel')).toBeVisible();
    }
    // short room (designer m_28987): the label goes whole, never a clipped 'the bi'; the cube stays
    const label = icon.locator('.bims-cube-label');
    for (const px of [300, 240, 200, 180, 160, 140]) {
      await s.page.getByTestId('app.right.agents').evaluate((el, w) => { (el as HTMLElement).style.width = `${String(w)}px`; }, px);
      await sleep(50);
      const [bb, lb, gb] = await Promise.all([icon.boundingBox(), label.boundingBox(), icon.locator('svg').boundingBox()]);
      if (bb === null || lb === null || gb === null) throw new Error('no cube, label or glyph');
      const whole = lb.x >= bb.x - 0.5 && lb.x + lb.width <= bb.x + bb.width + 0.5 && lb.y >= bb.y - 0.5 && lb.y + lb.height <= bb.y + bb.height + 0.5;
      // no room: the label stays laid out to be measured, unseen (data-room=cube, bims-toggle 590a1aa2d)
      const gone = (await icon.getAttribute('data-room')) === 'cube' && (await label.evaluate((e) => getComputedStyle(e).visibility)) === 'hidden';
      expect(whole || gone, `at ${String(px)} px the label is whole or gone (button ${JSON.stringify(bb)}, label ${JSON.stringify(lb)})`).toBe(true);
      expect(gb.x >= bb.x - 0.5 && gb.x + gb.width <= bb.x + bb.width + 0.5, `at ${String(px)} px the cube stays whole`).toBe(true);
    }
  } finally {
    await s.close();
  }
});

/** what the cube does now ('blink', 'hop', none) and the window's animations on it */
const cubeNow = (s: Session): Promise<{ move: string | null; anims: number }> =>
  s.page.evaluate(() => {
    const el = document.querySelector('[data-testid="app.right.agents.bims"]');
    return { move: el?.getAttribute('data-move') ?? null, anims: el === null ? 0 : el.getAnimations({ subtree: true }).length };
  });

// (f2) the cube lives at rest (his ask, main m_28901): a blink, a hop, each once, then still; none
// open, hidden, or under reduced motion. Paced for the check (__biseCubePace), 2-3 min in his app
/** every move the cube starts from now, with the animations it runs then (recorded in the page: a hop lasts 900 ms) */
const recordMoves = (s: Session): Promise<void> =>
  s.page.evaluate(() => {
    const el = document.querySelector('[data-testid="app.right.agents.bims"]');
    const w = window as unknown as { __cubeMoves?: { move: string; anims: number }[] };
    w.__cubeMoves = [];
    if (el === null) return;
    new MutationObserver(() => {
      const move = el.getAttribute('data-move');
      if (move !== null) w.__cubeMoves?.push({ move, anims: el.getAnimations({ subtree: true }).length });
    }).observe(el, { attributes: true, attributeFilter: ['data-move'] });
  });
const movesSeen = (s: Session): Promise<{ move: string; anims: number }[]> =>
  s.page.evaluate(() => (window as unknown as { __cubeMoves?: { move: string; anims: number }[] }).__cubeMoves ?? []);

test('(f2) the cube blinks and hops at rest, once each, never open, hidden or with reduced motion', async () => {
  const { s } = await open(office, { width: 1600 });
  try {
    await s.page.evaluate(() => { (window as unknown as { __biseCubePace?: unknown }).__biseCubePace = { blink: 600, hop: 1500 }; });
    await recordMoves(s);
    // the pace is read when the timers start: a hover and a leave start them again
    const icon = s.page.getByTestId('app.right.agents.bims');
    await icon.hover();
    await s.page.mouse.move(5, 400);
    await expect.poll(async () => (await movesSeen(s)).map((m) => m.move), { timeout: 4000 }).toEqual(expect.arrayContaining(['blink', 'hop']));
    const seen = await movesSeen(s);
    expect(seen.find((m) => m.move === 'blink')?.anims, 'a blink: the two eyes').toBe(2);
    expect(seen.find((m) => m.move === 'hop')?.anims, 'a hop: the cube once').toBe(1);
    // between moves, nothing runs
    await expect.poll(async () => cubeNow(s), { timeout: 3000 }).toEqual({ move: null, anims: 0 });
    // hidden: no move for 3 s
    await setHidden(s.page, true);
    for (let i = 0; i < 12; i++) {
      await sleep(250);
      expect(await cubeNow(s)).toEqual({ move: null, anims: 0 });
    }
    await recordMoves(s);
    await setHidden(s.page, false);
    await expect.poll(async () => (await movesSeen(s)).length, { timeout: 3000 }).toBeGreaterThan(0);
    // open: still
    await icon.click();
    await expect(icon).toHaveAttribute('aria-pressed', 'true');
    for (let i = 0; i < 12; i++) {
      await sleep(250);
      expect((await cubeNow(s)).move).toBeNull();
    }
    await icon.click();
    // reduced motion: still (a hover and a leave start it again)
    await s.page.emulateMedia({ reducedMotion: 'reduce' });
    await icon.hover();
    await s.page.mouse.move(5, 400);
    for (let i = 0; i < 12; i++) {
      await sleep(250);
      expect(await cubeNow(s)).toEqual({ move: null, anims: 0 });
    }
  } finally {
    await s.close();
  }
});

// (f3) the hop, filmed for bims to sign: a strip of its frames, light and dark
for (const theme of ['light', 'dark'] as const) {
  test(`(f3) the hop and the blink, a strip, ${theme}`, async () => {
    const { s } = await open(office, { theme, width: 1600 });
    try {
      await s.page.evaluate(() => { (window as unknown as { __biseCubePace?: unknown }).__biseCubePace = { blink: 60_000, hop: 1200 }; });
      const icon = s.page.getByTestId('app.right.agents.bims');
      await icon.hover();
      await s.page.mouse.move(5, 400);
      const box = await icon.boundingBox();
      if (box === null) throw new Error('no cube');
      const rec = new Recorder(s.cdp, s.page);
      await rec.start();
      await expect.poll(async () => (await cubeNow(s)).move, { timeout: 6000, intervals: [50] }).toBe('hop');
      await sleep(1100);
      const frames = await rec.stop();
      // room above for the 5 px hop, the whole button below
      const pad = { x: box.x - 8, y: box.y - 10, width: box.width + 16, height: box.height + 16 };
      for (const [i, f] of strip(frames.slice(-40), 10).entries()) {
        const file = `cube-hop-${theme}-${String(i)}.png`;
        cropTo(f, pad, file, 0);
        shots.push({ file, title: `the hop, ${theme}, frame ${String(i)}`, says: 'up 5 px, down, squashed as it lands, one small bounce; 900 ms' });
      }
      await s.page.evaluate(() => { (window as unknown as { __biseCubePace?: unknown }).__biseCubePace = { blink: 600, hop: 60_000 }; });
      await icon.hover();
      await s.page.mouse.move(5, 400);
      await expect.poll(async () => (await cubeNow(s)).move, { timeout: 6000, intervals: [50] }).toBe('blink');
      await sleep(100);
      await shotOf(s.cdp, s.page, pad, `cube-blink-${theme}.png`);
      shots.push({ file: `cube-blink-${theme}.png`, title: `a blink, ${theme}`, says: 'the eyes shut, 220 ms' });
    } finally {
      await s.close();
    }
  });
}

// (g) the follow camera close (his shot 3): the followed bim at least 3x its fit size on screen, at 320 and wide
for (const wide of [false, true]) {
  const w = wide ? 'wide' : '320';
  test(`(g) the follow camera close, ${w}`, async () => {
    const { s, core } = await open(office, { width: 1600 });
    try {
      await s.page.getByTestId('app.right.agents.bims').click();
      await expect(s.page.getByTestId('app.right.bims')).toHaveAttribute('data-shown', 'true', { timeout: 20_000 });
      if (wide) await s.page.getByTestId('app.right.agents.width.wide').click();
      await grown(s, core);
      await settle(s, 800, 6000);
      expect(await zoomNow(s)).toBeCloseTo(1);
      await shot(s, `fix-g-fit-${w}.png`, `the whole office, ${w}`, 'the fit, before he opens an agent');
      // at its left: wide slid over, the 320 column's resize border runs down the bar's middle
      await s.page.getByTestId('app.right.agent.signup-perf').click({ position: { x: 24, y: 10 } });
      await s.page.mouse.move(5, 300);
      await expect.poll(() => zoomNow(s), { timeout: 3000 }).toBeGreaterThanOrEqual(3);
      await settle(s, 800, 6000);
      // its head on the canvas, near the middle (the camera aims at it), inside the frame
      const h = await headOf(s.page, 'signup-perf');
      const box = await s.page.getByTestId('app.right.bims.canvas').boundingBox();
      if (h === null || box === null) throw new Error('signup-perf off the view');
      expect(h.x).toBeGreaterThan(box.x);
      expect(h.x).toBeLessThan(box.x + box.width);
      expect(h.y).toBeGreaterThan(box.y);
      expect(h.y).toBeLessThan(box.y + box.height);
      await shot(s, `fix-g-follow-${w}.png`, `signup-perf opened, ${w} (zoom ${(await zoomNow(s)).toFixed(1)}x)`, 'the bim and its desk fill a good part of the view, about his shot 3');
      await s.page.getByTestId('app.right.agent.login-test').click({ position: { x: 24, y: 10 } });
      await s.page.mouse.move(5, 300);
      await sleep(500);
      await settle(s, 800, 6000);
      expect(await zoomNow(s)).toBeGreaterThanOrEqual(3);
      await shot(s, `fix-g-follow-next-${w}.png`, `login-test opened, ${w}`, 'the camera moved to login-test, as close, held inside the office');
      // '⤢ fit': the whole office again
      await s.page.getByTestId('app.right.bims.fit').click();
      await expect.poll(() => zoomNow(s), { timeout: 3000 }).toBeCloseTo(1);
    } finally {
      await s.close();
    }
  });
}

// (h) his ai-docs office (main m_28473): idle bims nap only on a bean bag the stage built; past them, at their desk
const NAPPERS = snap([
  agent('main', { main: true, place_id: '', status: 'idle' }),
  ...['docs-a', 'docs-b', 'docs-c', 'docs-d'].map((n) => agent(n, { status: 'idle', title: 'idle' })),
  agent('etrade-question', { status: 'working', title: 'reads the api', turn_ms: 60_000 }),
]);
for (const [stage, jobs] of [[0, 0], [3, 6]] as const) {
  test(`(h) nappers at stage ${String(stage)}: on a built bean bag or at their desk, never in the air`, async () => {
    const g = { jobs_done: jobs, days_used: 1, artifacts_made: 0 };
    const { s, core } = await open(NAPPERS, { width: 1600, growth: g });
    try {
      await s.page.getByTestId('app.right.agents.bims').click();
      await expect(s.page.getByTestId('app.right.bims')).toHaveAttribute('data-shown', 'true', { timeout: 20_000 });
      // the check's growth, then the hub's event (as grow.spec): the office draws this stage
      await s.page.evaluate((x) => { (window as unknown as { __biseGrow?: unknown }).__biseGrow = x; }, g);
      await core.send({ ev: 'growth', project: P, growth: g } as never);
      await expect.poll(() => s.page.getByTestId('app.right.bims').getAttribute('data-stage'), { timeout: 5000 }).toBe(String(stage));
      await settle(s, 800, 8000);
      await s.page.mouse.move(5, 400);
      const where = stage === 0 ? 'no bean bag yet: the four nap at their desks, heads down' : 'two bean bags: two nap on them, the others at their desks';
      await shot(s, `fix-h-nap-stage${String(stage)}.png`, `idle bims at stage ${String(stage)}`, where);
      // close on two of them (the follow camera): a bean bag under the one in the lounge, a desk under the other
      for (const n of ['docs-a', 'docs-c']) {
        await s.page.getByTestId(`app.right.agent.${n}`).click({ position: { x: 24, y: 10 } });
        await s.page.mouse.move(5, 400);
        await sleep(500);
        await settle(s, 800, 6000);
        await shot(s, `fix-h-nap-stage${String(stage)}-${n}.png`, `${n} at stage ${String(stage)}, close`, 'lying on a bean bag the stage built, or head down at its desk: never in the air');
      }
    } finally {
      await s.close();
    }
  });
}
