import { describe, expect, it } from 'vitest';
import { crowd } from './fixtures';
import type { Box, Office, Path, Pt } from './model';
import { loftLayout as layoutOf } from './maps/loft';
import { along, type Leg, network, path } from './paths';

const furniture = (o: Office) => o.furniture;
const exitOf = (o: Office) => o.exit;

const SIZES = [1, 5, 14, 17, 31];

/** a value the test knows is there */
function must<T>(x: T | undefined): T {
  if (x === undefined) throw new Error('missing');
  return x;
}

function spotsOf(o: Office): Pt[] {
  return [...o.desks.values(), o.mainDesk, ...o.islandSpots, ...o.lounge, ...o.boardSpots, ...o.queue, o.door, ...o.terrace];
}

const near = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.z - b.z) < 1e-4;

/** an axis-aligned leg through a box's inside (touching its edge is fine) */
function crosses([a, b]: Leg, box: Box): boolean {
  const lx = Math.min(a.x, b.x);
  const hx = Math.max(a.x, b.x);
  const lz = Math.min(a.z, b.z);
  const hz = Math.max(a.z, b.z);
  const e = 1e-6;
  return lx < box.x1 - e && hx > box.x0 + e && lz < box.z1 - e && hz > box.z0 + e;
}

/** a box the leg may cross: the bean bag or deck chair of the place at one of its ends */
const own = (box: Box, ends: readonly Pt[]) => box.of !== undefined && ends.some((p) => near(p, box.of as Pt));

function onNetwork(o: Office, p: Pt): boolean {
  return network(o).some(([a, b]) => {
    const t = 1e-4;
    if (Math.abs(a.x - b.x) < t) return Math.abs(p.x - a.x) < t && p.z >= Math.min(a.z, b.z) - t && p.z <= Math.max(a.z, b.z) + t;
    return Math.abs(p.z - a.z) < t && p.x >= Math.min(a.x, b.x) - t && p.x <= Math.max(a.x, b.x) + t;
  });
}

/** what's wrong with a walk: a point (every 0.1 tile) off the network, a piece of furniture crossed */
function faults(o: Office, p: Path, ends: readonly Pt[]): string[] {
  const out: string[] = [];
  for (let d = 0; d <= p.len; d += 0.1) if (!onNetwork(o, along(p, d))) out.push(`off the network at ${String(d)}: ${JSON.stringify(p.pts)}`);
  const boxes = furniture(o);
  for (let i = 1; i < p.pts.length; i++) {
    for (const box of boxes) {
      if (!own(box, ends) && crosses([must(p.pts[i - 1]), must(p.pts[i])], box)) out.push(`${JSON.stringify(p.pts)} crosses ${JSON.stringify(box)}`);
    }
  }
  return out;
}

describe('network', () => {
  for (const n of SIZES) {
    it(`${String(n)} agents: every leg straight, none through a desk, the island, a bean bag or a deck chair`, () => {
      const o = layoutOf(crowd(n - 1).agents);
      const legs = network(o);
      expect(legs.length).toBeGreaterThan(20);
      for (const leg of legs) {
        const [a, b] = leg;
        expect(Math.abs(a.x - b.x) < 1e-9 || Math.abs(a.z - b.z) < 1e-9).toBe(true);
        for (const box of furniture(o)) if (!own(box, leg)) expect(crosses(leg, box), JSON.stringify({ leg, box })).toBe(false);
      }
    });
  }
});

describe('path', () => {
  for (const n of SIZES) {
    it(`${String(n)} agents: walks between places stay on the network`, () => {
      const o = layoutOf(crowd(n - 1).agents);
      const spots = spotsOf(o);
      const hubs = [o.door, o.mainDesk, must(o.lounge[0]), must(o.terrace[11]), must(o.islandSpots[1]), must(o.queue[0]), exitOf(o)];
      const bad: string[] = [];
      for (const a of spots) {
        for (const b of hubs) {
          const p = path(o, a, b);
          if (!near(must(p.pts[0]), a) || !near(must(p.pts.at(-1)), b)) bad.push(`ends: ${JSON.stringify(p.pts)}`);
          bad.push(...faults(o, p, [a, b]));
        }
      }
      expect(bad).toEqual([]);
    });
  }

  it('walks from the middle of a walk (a state changed on the way)', () => {
    const o = layoutOf(crowd(9).agents);
    const desk = o.desks.get('agent-7') as Pt;
    const first = path(o, desk, must(o.lounge[2]));
    for (const f of [0.1, 0.3, 0.5, 0.77, 0.95]) {
      const here = along(first, first.len * f);
      for (const to of [desk, must(o.terrace[5]), must(o.boardSpots[0]), must(o.queue[2])]) {
        const p = path(o, here, to);
        expect(near(must(p.pts[0]), here)).toBe(true);
        expect(near(must(p.pts.at(-1)), to)).toBe(true);
        expect(faults(o, p, [here, to, desk, must(o.lounge[2])])).toEqual([]);
      }
    }
  });

  it('goes back the way it came when the target is behind it', () => {
    const o = layoutOf(crowd(5).agents);
    const desk = o.desks.get('agent-1') as Pt;
    const out = path(o, desk, o.door);
    const here = along(out, 0.5);
    const back = path(o, here, desk);
    expect(back.len).toBeCloseTo(0.5, 5);
  });

  it('takes the shortest way: the land queue moves up in a straight line', () => {
    const o = layoutOf(crowd(5).agents);
    const p = path(o, must(o.queue[1]), must(o.queue[0]));
    expect(p.pts).toHaveLength(2);
    expect(p.len).toBeCloseTo(0.5, 5);
  });

  it('is a single point when it is already there', () => {
    const o = layoutOf(crowd(2).agents);
    const p = path(o, o.door, o.door);
    expect(p.len).toBe(0);
    expect(along(p, 3)).toEqual({ x: o.door.x, z: o.door.z, dir: 0 });
  });
});

describe('along', () => {
  const p = { pts: [{ x: 0, z: 0 }, { x: 0, z: 2 }, { x: 3, z: 2 }], seg: [2, 3], len: 5 };
  it('reads the point d tiles in and the way it faces', () => {
    expect(along(p, 1)).toEqual({ x: 0, z: 1, dir: 0 });
    expect(along(p, 3)).toEqual({ x: 1, z: 2, dir: Math.PI / 2 });
    expect(along(p, 99)).toEqual({ x: 3, z: 2, dir: Math.PI / 2 });
    expect(along(p, -1)).toEqual({ x: 0, z: 0, dir: 0 });
  });
});
