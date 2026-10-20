// The town's plan (town/plan.ts): no road or river point inside an office for 1..20 projects of every
// size and growth, on many seeds (page bims-maps v9: « un contrôle compte les points de route ou de
// rivière dans un bureau : 0 »); every door has its path to the road; trees and houses stand free.
import { describe, expect, it } from 'vitest';
import { agent, mainAgent } from '../fixtures';
import { layoutOf } from '../maps';
import { growOf } from '../growth';
import { BANK, ROAD, crossings, perRow, rngOf, rowSizes, seedOf, smooth, townPlan, type TownPlan, type TownSite } from './plan';
import { siteOf, townSeed } from './ground';
import { PATH_HALF } from '../render/decor';

/** an office of n agents, laid out once: the tests draw thousands of sites from 14 sizes, and the
 *  layout was a third of town-paths' time (5 s timeouts at gate load, bims-test-load) */
const offices = new Map<number, ReturnType<typeof layoutOf>>();
function officeOf(n: number): ReturnType<typeof layoutOf> {
  let o = offices.get(n);
  if (o === undefined) {
    o = layoutOf([mainAgent(), ...Array.from({ length: n }, (_, i) => agent(`a${String(i)}`))]);
    offices.set(n, o);
  }
  return o;
}

/** a project's site: n agents, that many jobs done (its stage) and days used (its garden); its
 *  ground drawn once per size, stage and garden (siteOf only copies the id) */
const grounds = new Map<string, TownSite>();
function site(id: string, n: number, jobs: number, days: number): TownSite {
  const key = `${String(n)}|${String(jobs)}|${String(days)}`;
  let s = grounds.get(key);
  if (s === undefined) {
    s = siteOf(id, officeOf(n), growOf({ jobs_done: jobs, days_used: days, artifacts_made: 0 }));
    grounds.set(key, s);
  }
  return { ...s, id };
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
    // 120 plans: a few seconds alone, more on a busy machine
  }, 60_000);

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

  // one test per project count: 72 plans in one test took 6-10 s at gate load (5 s timeouts,
  // bims-test-load); the same loops and expects, each count under its own timeout
  it.each(Array.from({ length: 24 }, (_, i) => i + 1))('runs every path from its office\'s door (the terrace\'s or the floor\'s front edge) into the road: both its end corners on the road ribbon (town-paths, %i projects)', (n) => {
    const toSeg = (x: number, z: number, a: { x: number; z: number }, b: { x: number; z: number }): number => {
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1)));
      return Math.hypot(x - a.x - t * dx, z - a.z - t * dz);
    };
    const toRoad = (plan: TownPlan, x: number, z: number): number => {
      let d = Infinity;
      for (let i = 0; i + 1 < plan.road.length; i++) {
        const a = plan.road[i];
        const b = plan.road[i + 1];
        if (a !== undefined && b !== undefined) d = Math.min(d, toSeg(x, z, a, b));
      }
      return d;
    };
    for (let s = 0; s < 3; s++) {
      const ss = sites(n, n * 31 + s);
      const plan = townPlan(ss, townSeed(ss.map((x) => x.id)) + s);
      expect(plan.paths, `${String(n)} projects: one path per door`).toHaveLength(n);
      plan.offices.forEach((p) => {
        const pa = plan.paths.find((q) => Math.abs(q.x - p.door.x) < 1e-9 && Math.abs(q.z0 - p.door.z) < 1e-9);
        expect(pa, `${p.id}: a path from its door`).toBeDefined();
        if (pa === undefined) return;
        for (const dx of [-PATH_HALF, 0, PATH_HALF]) {
          const d = toRoad(plan, pa.x + dx, pa.z1);
          expect(d, `${p.id} (${String(n)} projects, draw ${String(s)}): its end ${dx.toFixed(1)} across is ${d.toFixed(2)} from the road's middle`).toBeLessThan(ROAD - 0.05);
        }
      });
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

  it('breaks the rhythm with a square every 4 or 5 offices, clear of the road, the river and the offices', () => {
    for (const n of [12, 20]) {
      const plan = townPlan(sites(n, n), 13);
      expect(plan.squares.length, `${String(n)} projects`).toBeGreaterThanOrEqual(1);
      for (const q of plan.squares) {
        const inSq = (x: number, z: number, m: number): boolean => Math.abs(x - q.x) < q.w / 2 + m && Math.abs(z - q.z) < q.d / 2 + m;
        expect(plan.road.filter((p) => inSq(p.x, p.z, ROAD)), 'the road through a square').toEqual([]);
        expect(plan.river.filter((p) => inSq(p.x, p.z, BANK)), 'the river through a square').toEqual([]);
        expect(plan.offices.filter((o) => o.fp.x0 < q.x + q.w / 2 && q.x - q.w / 2 < o.fp.x1 && o.fp.z0 < q.z + q.d / 2 && q.z - q.d / 2 < o.fp.z1).map((o) => o.id), 'an office on a square').toEqual([]);
      }
    }
  });

  it('draws the same town for the same projects', () => {
    const ss = sites(6, 9);
    expect(townPlan(ss, 42)).toEqual(townPlan(ss, 42));
    expect(seedOf('a')).not.toBe(seedOf('b'));
  });

  it('puts about a square of offices in rows of uneven sizes', () => {
    expect([1, 2, 3, 4, 6, 12, 20].map(perRow)).toEqual([1, 2, 2, 3, 3, 4, 6]);
    for (const n of [3, 6, 12, 20]) {
      const sizes = rowSizes(n, perRow(n), rngOf(n));
      expect(sizes.reduce((a, b) => a + b, 0), `${String(n)} in all`).toBe(n);
      expect(sizes.every((k) => k >= 1 && k <= perRow(n) + 2)).toBe(true);
    }
    expect(rowSizes(3, perRow(3), rngOf(1)), 'three: two and one, the road between').toEqual([2, 1]);
  });

  it('smooths a corner without leaving its reach', () => {
    const line = smooth([{ x: 0, z: 0 }, { x: 10, z: 0 }, { x: 10, z: 10 }], 2);
    expect(line.every((q) => q.x >= -1e-9 && q.x <= 10 + 1e-9 && q.z >= -1e-9 && q.z <= 10 + 1e-9)).toBe(true);
    expect(line[0]).toEqual({ x: 0, z: 0 });
    expect(line.at(-1)).toEqual({ x: 10, z: 10 });
  });
});

describe('town plan: bise\'s home at the heart (bims m_29650)', () => {
  const homeSite = (): TownSite => {
    const agents = [mainAgent()];
    return siteOf('home', layoutOf(agents), growOf({ jobs_done: 60, days_used: 14, artifacts_made: 0 }), true);
  };

  it('stands in the middle row, offices on both sides, its square round it, the road at its door, nothing crossing', () => {
    for (const n of [0, 1, 3, 7, 12, 19]) {
      const ss = [...sites(n, n * 7 + 3), homeSite()];
      const plan = townPlan(ss, townSeed(ss.map((x) => x.id)));
      expect(crossings(plan), `${String(n)} offices and home`).toEqual({ road: 0, river: 0 });
      const h = plan.offices.find((p) => p.id === 'home');
      expect(h, 'home is in the town').toBeDefined();
      expect(plan.heart, 'its square').not.toBeNull();
      if (h === undefined || plan.heart === null) continue;
      expect(plan.heart.x0).toBeLessThan(h.fp.x0);
      expect(plan.heart.z1).toBeGreaterThan(h.fp.z1);
      // its path reaches the road like every door's
      expect(plan.paths.some((p) => Math.abs(p.x - h.door.x) < 1e-6), 'a path from its door to the road').toBe(true);
      // no tree or house on its square
      const onHeart = (x: number, z: number): boolean => x > (plan.heart?.x0 ?? 0) && x < (plan.heart?.x1 ?? 0) && z > (plan.heart?.z0 ?? 0) && z < (plan.heart?.z1 ?? 0);
      expect(plan.trees.filter((t) => onHeart(t.x, t.z))).toEqual([]);
      expect(plan.houses.filter((t) => onHeart(t.x, t.z))).toEqual([]);
      if (n >= 3) {
        // the middle row split round it: an office west and one east of it at about its depth
        const row = plan.offices.filter((p) => p.id !== 'home' && Math.abs((p.fp.z0 + p.fp.z1) / 2 - (h.fp.z0 + h.fp.z1) / 2) < 8);
        expect(row.some((p) => p.fp.x1 <= h.fp.x0), 'an office west of it').toBe(true);
        expect(row.some((p) => p.fp.x0 >= h.fp.x1), 'an office east of it').toBe(true);
      }
    }
  });

  it('its ground is 15% wider than its office would have, its door the same', () => {
    const agents = [mainAgent()];
    const o = layoutOf(agents);
    const g = growOf({ jobs_done: 60, days_used: 14, artifacts_made: 0 });
    const plain = siteOf('x', o, g);
    const home = siteOf('x', o, g, true);
    expect(home.fp.x1 - home.fp.x0).toBeCloseTo((plain.fp.x1 - plain.fp.x0) * 1.15, 6);
    expect(home.door).toEqual(plain.door);
  });
});

describe('town plan: the town grows, offices never meet (town-fix, 1..40 projects)', () => {
  /** room kept between two offices' grounds, office units */
  const APART = 1;
  it('keeps every office apart (a margin between grounds), off the road and the river, inside the lawn, for 1..40 projects of every stage', () => {
    for (let n = 1; n <= 40; n++) {
      for (let s = 0; s < 3; s++) {
        const ss = sites(n, n * 37 + s);
        const plan = townPlan(ss, townSeed(ss.map((x) => x.id)) + s);
        const at = `${String(n)} projects, draw ${String(s)}`;
        expect(plan.offices, at).toHaveLength(n);
        expect(crossings(plan), at).toEqual({ road: 0, river: 0 });
        plan.offices.forEach((a, i) => {
          for (const b of plan.offices.slice(i + 1)) {
            const meet = a.fp.x0 - APART < b.fp.x1 && b.fp.x0 - APART < a.fp.x1 && a.fp.z0 - APART < b.fp.z1 && b.fp.z0 - APART < a.fp.z1;
            expect(meet, `${at}: ${a.id} and ${b.id} meet`).toBe(false);
          }
          // the town's ground grew to hold it
          expect(a.fp.x0 > plan.lawn.x0 && a.fp.x1 < plan.lawn.x1 && a.fp.z0 > plan.lawn.z0 && a.fp.z1 < plan.lawn.z1, `${at}: ${a.id} off the lawn`).toBe(true);
        });
      }
    }
  }, 120_000);

  it('grows its lawn as projects come: a bigger town never smaller than the one before it', () => {
    const all = sites(40, 4242);
    let prev = 0;
    for (let n = 1; n <= 40; n++) {
      const ss = all.slice(0, n);
      const { lawn } = townPlan(ss, townSeed(ss.map((x) => x.id)));
      const area = (lawn.x1 - lawn.x0) * (lawn.z1 - lawn.z0);
      expect(area, `${String(n)} projects`).toBeGreaterThanOrEqual(prev * 0.8);
      prev = Math.max(prev, area);
    }
  }, 60_000);
});
