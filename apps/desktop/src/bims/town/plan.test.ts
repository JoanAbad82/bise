// The town's plan (town/plan.ts): no road or river point inside an office for 1..20 projects of every
// size and growth, on many seeds (page bims-maps v9: « un contrôle compte les points de route ou de
// rivière dans un bureau : 0 »); every door has its path to the road; trees and houses stand free.
import { describe, expect, it } from 'vitest';
import { agent, mainAgent } from '../fixtures';
import { layoutOf } from '../maps';
import { growOf } from '../growth';
import { BANK, ROAD, crossings, perRow, rngOf, seedOf, smooth, townPlan, type TownPlan, type TownSite } from './plan';
import { siteOf, townSeed } from './ground';

/** a project's site: n agents, that many jobs done (its stage) and days used (its garden) */
function site(id: string, n: number, jobs: number, days: number): TownSite {
  const agents = [mainAgent(), ...Array.from({ length: n }, (_, i) => agent(`a${String(i)}`))];
  return siteOf(id, layoutOf(agents), growOf({ jobs_done: jobs, days_used: days, artifacts_made: 0 }));
}

const JOBS = [0, 3, 15, 60, 150, 1000];
const DAYS = [0, 3, 14, 60, 365];

/** n projects of mixed sizes, from a seed */
function sites(n: number, seed: number): TownSite[] {
  const r = rngOf(seed);
  return Array.from({ length: n }, (_, i) =>
    site(`p${String(i)}`, 1 + Math.floor(r() * 14), JOBS[Math.floor(r() * JOBS.length)] ?? 0, DAYS[Math.floor(r() * DAYS.length)] ?? 0),
  );
}

const inOffice = (plan: TownPlan, x: number, z: number, m: number): boolean =>
  plan.offices.some((p) => x > p.fp.x0 - m && x < p.fp.x1 + m && z > p.fp.z0 - m && z < p.fp.z1 + m);

describe('town plan', () => {
  it('lays no road or river point inside an office, 1..20 projects, many draws', () => {
    for (let n = 1; n <= 20; n++) {
      for (let s = 0; s < 6; s++) {
        const ss = sites(n, n * 101 + s);
        const plan = townPlan(ss, townSeed(ss.map((x) => x.id)) + s);
        expect(crossings(plan), `${String(n)} projects, draw ${String(s)}`).toEqual({ road: 0, river: 0 });
        expect(plan.offices).toHaveLength(n);
      }
    }
  });

  it('keeps every office apart from the others', () => {
    for (const n of [3, 6, 12, 20]) {
      const plan = townPlan(sites(n, n), 7);
      plan.offices.forEach((a, i) => {
        for (const b of plan.offices.slice(i + 1)) {
          const meet = a.fp.x0 < b.fp.x1 && b.fp.x0 < a.fp.x1 && a.fp.z0 < b.fp.z1 && b.fp.z0 < a.fp.z1;
          expect(meet, `${a.id} and ${b.id} overlap (${String(n)} projects)`).toBe(false);
        }
      });
    }
  });

  it('gives every door a dirt path to the road, outside every other office', () => {
    for (const n of [1, 3, 7, 12, 20]) {
      const plan = townPlan(sites(n, n + 3), 11);
      expect(plan.paths, `${String(n)} projects: one path per door`).toHaveLength(n);
      for (const pa of plan.paths) {
        expect(pa.z1).toBeGreaterThan(pa.z0);
        for (let z = pa.z0 + 0.3; z < pa.z1; z += 0.5) {
          const others = plan.offices.filter((p) => !(Math.abs(p.door.x - pa.x) < 1e-9 && Math.abs(p.door.z - pa.z0) < 1e-9));
          expect(inOffice({ ...plan, offices: others }, pa.x, z, 0), `a path through an office at ${pa.x.toFixed(1)}, ${z.toFixed(1)}`).toBe(false);
        }
      }
    }
  });

  it('crosses the river on bridges, one per crossing, from two projects', () => {
    expect(townPlan(sites(1, 1), 1).river).toHaveLength(0);
    for (const n of [2, 3, 6, 12]) {
      const plan = townPlan(sites(n, n), 5);
      expect(plan.river.length).toBeGreaterThan(10);
      expect(plan.bridges.length, `${String(n)} projects`).toBeGreaterThanOrEqual(1);
    }
  });

  it('stands trees and houses on free grass only', () => {
    const plan = townPlan(sites(12, 12), 3);
    expect(plan.trees.length).toBeGreaterThan(20);
    for (const t of [...plan.trees, ...plan.houses]) {
      expect(inOffice(plan, t.x, t.z, 1), 'in an office').toBe(false);
      expect(plan.road.every((q) => Math.hypot(q.x - t.x, q.z - t.z) > ROAD + 1)).toBe(true);
      expect(plan.river.every((q) => Math.hypot(q.x - t.x, q.z - t.z) > BANK)).toBe(true);
      expect(t.x > plan.lawn.x0 && t.x < plan.lawn.x1 && t.z > plan.lawn.z0 && t.z < plan.lawn.z1).toBe(true);
    }
  });

  it('draws the same town for the same projects', () => {
    const ss = sites(6, 9);
    expect(townPlan(ss, 42)).toEqual(townPlan(ss, 42));
    expect(seedOf('a')).not.toBe(seedOf('b'));
  });

  it('puts up to 3 offices in a row, then about a square', () => {
    expect([1, 2, 3, 4, 6, 12, 20].map(perRow)).toEqual([1, 2, 3, 3, 3, 4, 6]);
  });

  it('smooths a corner without leaving its reach', () => {
    const line = smooth([{ x: 0, z: 0 }, { x: 10, z: 0 }, { x: 10, z: 10 }], 2);
    expect(line.every((q) => q.x >= -1e-9 && q.x <= 10 + 1e-9 && q.z >= -1e-9 && q.z <= 10 + 1e-9)).toBe(true);
    expect(line[0]).toEqual({ x: 0, z: 0 });
    expect(line.at(-1)).toEqual({ x: 10, z: 10 });
  });
});
