// The town's camera (town/camera.ts): its near and far planes hold the whole town for any view of it,
// so no office nearest the camera is cut off (town-fix: from ~12 projects the fixed near plane, DIST
// from the target, cut the town's front corner).
import { describe, expect, it } from 'vitest';
import { agent, mainAgent } from '../fixtures';
import { layoutOf } from '../maps';
import { growOf } from '../growth';
import { BACK, DIST } from '../render/camera';
import { rngOf, townPlan, type TownSite } from './plan';
import { siteOf, townSeed } from './ground';
import { townDepth, townFit } from './camera';

const JOBS = [0, 3, 15, 60, 150, 1000];
const DAYS = [0, 3, 14, 60, 365];

function sites(n: number, seed: number): TownSite[] {
  const r = rngOf(seed);
  return Array.from({ length: n }, (_, i) => {
    const agents = [mainAgent(), ...Array.from({ length: 1 + Math.floor(r() * 14) }, (_, j) => agent(`a${String(j)}`))];
    return siteOf(`p${String(i)}`, layoutOf(agents), growOf({ jobs_done: JOBS[Math.floor(r() * JOBS.length)] ?? 0, days_used: DAYS[Math.floor(r() * DAYS.length)] ?? 0, artifacts_made: 0 }));
  });
}

describe('town camera', () => {
  // one test per project count, the misses gathered in one expect: 6 towns and ~40k expects in one
  // test took over 5 s at gate load (load ~60, bims-vitest); the same towns, targets and corners
  it.each([1, 3, 12, 20, 25, 40])('puts every office, from under its block to its roof, between the near and far planes, at the fit and at any office as target (%i projects)', (n) => {
    const ss = sites(n, n);
    const plan = townPlan(ss, townSeed(ss.map((x) => x.id)));
    const fit = townFit(plan, 640, 4000);
    const targets = [fit.target, ...plan.offices.map((p) => ({ x: (p.fp.x0 + p.fp.x1) / 2, y: 0, z: (p.fp.z0 + p.fp.z1) / 2 }))];
    const bad: string[] = [];
    for (const t of targets) {
      const { near, far } = townDepth(plan, t);
      for (const p of plan.offices) {
        for (const x of [p.fp.x0, p.fp.x1]) for (const y of [-1.35, 3.5]) for (const z of [p.fp.z0, p.fp.z1]) {
          const d = DIST - ((x - t.x) * BACK.x + (y - t.y) * BACK.y + (z - t.z) * BACK.z);
          const at = `target (${t.x.toFixed(1)},${t.z.toFixed(1)}): ${p.id} at ${d.toFixed(2)}`;
          if (!(d > near)) bad.push(`${at}, nearer than the near plane ${near.toFixed(2)}`);
          if (!(d < far)) bad.push(`${at}, past the far plane ${far.toFixed(2)}`);
        }
      }
    }
    expect(bad.slice(0, 6), `${String(n)} projects`).toEqual([]);
  });
});
