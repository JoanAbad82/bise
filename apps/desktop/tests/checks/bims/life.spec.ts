// bims/life · Gabriel and Lucas on les bims (task bims-life), on FakeCore rows, off screen, the
// office's clock set (Playwright's page.clock: the timeline reads Date.now; (a) flows from a minute where
// every bim naps, (b) is pinned frame by frame). Passes when:
//   (a) on each map where a napper's head went into a piece (the loft's and the greenhouse's arcade
//       cabinet at stage 11, the haveli's jhoola at 8, the Sahel's buttress, the riad's banquette
//       cushions, the workshop's scooter), every idle bim asleep on its bed draws, the nap place
//       full, its piece moved off the heads (render/lying.test.ts checks every map x stage);
//   (b) an idle bim at the island eats: picks a fruit from the bowl, bites it, chews (a frame strip).
// Shots: .harness-cache/bims-shots (life-*.png), for bims to sign. Owner: bims-life.
import { test, expect, type Session } from '../../harness';
import type { FakeCore } from '../../harness';
import { agent, mainAgent, snap } from '../../../src/bims/fixtures';
import { idleLife } from '../../../src/bims/activity';
import { BITE_S, PICK_S } from '../../../src/bims/render/pose';
import { P, headOf, open, settle, shotOf, showOffice, trackpad, writeIndex, type Shot } from './world';

const shots: Shot[] = [];
test.describe.configure({ timeout: 240_000 });
test.afterAll(() => {
  if (shots.length > 0) writeIndex(shots);
});

const NAMES = ['nap-a', 'nap-b', 'nap-c', 'nap-d', 'nap-e', 'nap-f', 'nap-g', 'nap-h', 'nap-i'];
const IDLE = snap([mainAgent({ status: 'idle' }), ...NAMES.map((n) => agent(n))]);
const T0 = 1_791_100_000;

/** `n` seconds from T0 on, each the start of a minute where every one of `names` naps (s), in order */
function napTimes(names: readonly string[], n: number): number[] {
  const out: number[] = [];
  const naps = (t: number): boolean => names.every((x) => idleLife(x, t).k === 'nap');
  for (let t = T0; t < T0 + 200_000 && out.length < n; t += 5) {
    let all = true;
    for (let u = t; u <= t + 60 && all; u += 1) all = naps(u);
    if (all) { out.push(t); t += 120; }
  }
  if (out.length < n) throw new Error('not enough minutes where they all nap');
  return out;
}

/** the first second from T0 where `name` has just come to the island, the others napping */
function snackTime(name: string): number {
  for (let t = T0; t < T0 + 20_000; t++) {
    const a = idleLife(name, t);
    // a fruit (a mug is only sipped), a stay long enough for the strip
    if (a.k === 'snack' && a.fruit !== 2 && idleLife(name, t - 1).k !== 'snack' && idleLife(name, t + 40).k === 'snack') return t + 1;
  }
  throw new Error(`no snack for ${name}`);
}

async function pick(s: Session, core: FakeCore, map: string, jobs: number): Promise<void> {
  await core.send({ ev: 'prefs', prefs: { onboarded: true, theme: 'light', excluded_apps: [], bims: { map: { [P]: map } } } } as never);
  await expect(s.page.getByTestId('app.right.bims'), 'his pick draws').toHaveAttribute('data-map', map, { timeout: 8000 });
  const g = { jobs_done: jobs, days_used: 30, artifacts_made: 200 };
  await s.page.evaluate((x) => { (window as unknown as { __biseGrow?: unknown }).__biseGrow = x; }, g);
  await core.send({ ev: 'growth', project: P, growth: g } as never);
}

/** a box around these bims' heads, `pad` css px round it, inside the office's canvas */
async function around(s: Session, names: readonly string[], pad: number): Promise<{ x: number; y: number; width: number; height: number }> {
  const hs = (await Promise.all(names.map((n) => headOf(s.page, n)))).filter((h): h is { x: number; y: number } => h !== null);
  const c = await s.page.getByTestId('app.right.bims.canvas').boundingBox();
  if (hs.length === 0 || c === null) throw new Error('no head on view');
  const x0 = Math.max(c.x, Math.min(...hs.map((h) => h.x)) - pad), x1 = Math.min(c.x + c.width, Math.max(...hs.map((h) => h.x)) + pad);
  const y0 = Math.max(c.y, Math.min(...hs.map((h) => h.y)) - pad), y1 = Math.min(c.y + c.height, Math.max(...hs.map((h) => h.y)) + pad);
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}

const CASES = [
  { map: 'loft', stage: 11, jobs: 250, says: 'the arcade cabinet past the whiteboard; the last bean bag\'s napper lays its head on the rug, nothing behind it' },
  { map: 'greenhouse', stage: 11, jobs: 250, says: 'the arcade cabinet past the whiteboard, the frames past it' },
  { map: 'haveli', stage: 8, jobs: 60, says: 'the jhoola along the lounge\'s side wall, between its rows; the first row\'s heads clear of it' },
  { map: 'sahel', stage: 5, jobs: 15, says: 'the buttress behind the third mat moved into the lane beside it' },
  { map: 'riad', stage: 5, jobs: 15, says: 'the banquette\'s cushions thinner against the wall, the heads in front of them' },
  { map: 'workshop', stage: 5, jobs: 15, says: 'the scooter parked along the roller door\'s wall, out of the last napper\'s head' },
] as const;

test('(a) every napper\'s head clear of the furniture on the maps that had one in it', async () => {
  const { s, core } = await open(IDLE, { width: 1600 });
  try {
    // the clock set to a minute where every bim naps, flowing from there (their walks end)
    const at = napTimes(NAMES, CASES.length);
    await s.page.clock.setSystemTime((at[0] ?? T0) * 1000);
    await showOffice(s);
    await s.page.getByTestId('app.right.agents.width.wide').click();
    for (const [i, c] of CASES.entries()) {
      await s.page.clock.setSystemTime((at[i] ?? T0) * 1000);
      await pick(s, core, c.map, c.jobs);
      // the new room: every bim at its spot, the ones with no bed walking to their desks
      await s.page.waitForTimeout(7000);
      await settle(s, 1500, 12_000);
      const box = await s.page.getByTestId('app.right.bims').boundingBox();
      if (box === null) throw new Error('no office');
      await shotOf(s.cdp, s.page, box, `life-${c.map}-${String(c.stage)}.png`);
      shots.push({ file: `life-${c.map}-${String(c.stage)}.png`, title: `${c.map}, stage ${String(c.stage)}: the nap place full`, says: c.says });
      // closer: the nap place, a pinch in on its heads (none on view: the whole shot only)
      const near = await around(s, NAMES.slice(0, 8), 70).catch(() => null);
      if (near !== null) {
        const cx = near.x + near.width / 2, cy = near.y + near.height / 2;
        for (let i = 0; i < 6; i++) await trackpad(s.cdp, cx, cy, { dy: -60, pinch: true });
        await settle(s, 1500, 8000);
        const zoomed = await around(s, NAMES.slice(0, 8), 90).catch(() => null);
        if (zoomed !== null && zoomed.width > 120 && zoomed.height > 120) {
          await shotOf(s.cdp, s.page, zoomed, `life-${c.map}-${String(c.stage)}-near.png`);
          shots.push({ file: `life-${c.map}-${String(c.stage)}-near.png`, title: `${c.map}, stage ${String(c.stage)}: the heads, near`, says: c.says });
        }
      }
      // back to the whole office for the next map
      await s.page.getByTestId('app.right.bims.fit').click();
      await settle(s, 600, 4000);
    }
  } finally {
    await s.close().catch(() => undefined);
    core.dispose();
  }
});

test('(b) an idle bim at the island eats: picks a fruit, bites, chews (a frame strip)', async () => {
  const name = 'nap-a';
  const t = snackTime(name);
  const one = snap([mainAgent({ status: 'idle' }), agent(name)]);
  const { s, core } = await open(one, { width: 1600 });
  try {
    // the office's first look at t: it stands at the island already (no walk), its stay from t
    await s.page.clock.setFixedTime(t * 1000);
    await showOffice(s);
    await s.page.getByTestId('app.right.agents.width.wide').click();
    await settle(s, 600, 3000);
    const h = await headOf(s.page, name);
    if (h === null) throw new Error('no bim on view');
    for (let i = 0; i < 8; i++) await trackpad(s.cdp, h.x, h.y, { dy: -60, pinch: true });
    const steps = [0.2, 0.6, 1.0, 1.4, PICK_S + 0.3, PICK_S + 0.55, PICK_S + 0.9, PICK_S + 1.5, PICK_S + 1.7, PICK_S + BITE_S + 0.3, PICK_S + BITE_S + 0.6, PICK_S + BITE_S + 1.6];
    const says = ['reaches into the bowl', 'into the bowl', 'picked, coming up', 'the fruit at its chest', 'up to its mouth, mouth open', 'the bite', 'down, a bite smaller', 'chewing', 'chewing', 'the second bite', 'down, smaller again', 'chewing'];
    for (const [i, dt] of steps.entries()) {
      await s.page.clock.setFixedTime((t + dt) * 1000);
      await s.page.waitForTimeout(400);
      const at = await headOf(s.page, name);
      if (at === null) throw new Error('the bim went off view');
      const file = `life-eat-${String(i).padStart(2, '0')}.png`;
      await shotOf(s.cdp, s.page, { x: at.x - 110, y: at.y - 80, width: 220, height: 220 }, file);
      shots.push({ file, title: `eating, ${dt.toFixed(1)} s after it came`, says: says[i] ?? '' });
    }
  } finally {
    await s.close().catch(() => undefined);
    core.dispose();
  }
});
