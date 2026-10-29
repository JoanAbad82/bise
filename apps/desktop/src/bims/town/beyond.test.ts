// The app's town past its lawn (town/beyond.ts, his m_49446): the grass reaches past any view the pan
// allows, the road and the river run off past it, trees fill a band round the lawn, never on the road
// or the river, the same for the same town.
import { describe, expect, it } from 'vitest';
import { agent, mainAgent } from '../fixtures';
import { layoutOf } from '../maps';
import { growOf } from '../growth';
import { BANK, ROAD, townPlan } from './plan';
import { siteOf, townSeed } from './ground';
import { beyondOf, farOf } from './beyond';
import { ROOM } from './pan';

function town(n: number) {
  const sites = Array.from({ length: n }, (_, i) => siteOf(`p${String(i)}`, layoutOf([mainAgent(), agent('a'), agent('b')]), growOf({ jobs_done: 15, days_used: 14, artifacts_made: 0 })));
  return townPlan(sites, townSeed(sites.map((s) => s.id)));
}

const dist = (pts: readonly { x: number; z: number }[], x: number, z: number): number => {
  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (a === undefined || b === undefined) continue;
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const l2 = dx * dx + dz * dz;
    const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / l2));
    best = Math.min(best, Math.hypot(a.x + t * dx - x, a.z + t * dz - z));
  }
  return best;
};

describe('the town past its lawn', () => {
  it.each([1, 4, 12])('grass past any view, the road and river off its edges, trees round the lawn and never on them (%i projects)', (n) => {
    const plan = town(n);
    const b = beyondOf(plan);
    const { lawn } = plan;
    const lw = lawn.x1 - lawn.x0;
    const ld = lawn.z1 - lawn.z0;
    // the pan's ROOM past the fit, and a whole lawn more on each side: still grass
    expect(b.far.x0).toBeLessThan(lawn.x0 - lw * (ROOM + 1));
    expect(b.far.x1).toBeGreaterThan(lawn.x1 + lw * (ROOM + 1));
    expect(b.far.z0).toBeLessThan(lawn.z0 - ld * (ROOM + 1));
    expect(b.far.z1).toBeGreaterThan(lawn.z1 + ld * (ROOM + 1));
    expect(farOf(lawn)).toEqual(b.far);
    const past = (p: { x: number; z: number }): boolean => p.x < b.far.x0 || p.x > b.far.x1 || p.z < b.far.z0 || p.z > b.far.z1;
    for (const line of [b.road, ...(plan.river.length > 1 ? [b.river] : [])]) {
      expect(past(line[0] ?? { x: 0, z: 0 })).toBe(true);
      expect(past(line[line.length - 1] ?? { x: 0, z: 0 })).toBe(true);
    }
    expect(b.trees.length).toBeGreaterThan(20);
    for (const t of b.trees) {
      const inLawn = t.x > lawn.x0 && t.x < lawn.x1 && t.z > lawn.z0 && t.z < lawn.z1;
      expect(inLawn, `tree at ${t.x.toFixed(1)},${t.z.toFixed(1)} in the lawn`).toBe(false);
      expect(dist(b.road, t.x, t.z)).toBeGreaterThan(ROAD + 1);
      if (plan.river.length > 1) expect(dist(b.river, t.x, t.z)).toBeGreaterThan(BANK + 1);
    }
    expect(beyondOf(plan)).toEqual(b);
  });
});
