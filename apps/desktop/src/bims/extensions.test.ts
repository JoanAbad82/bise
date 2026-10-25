// His sketch's growth (extensions.ts): an extension only when his objects need it, in its sketch
// slot (the wing on the right from the back wall, the garden in front of the terrace from the left),
// every object placed again on the grown floor by p4's laws, its walks clear of every piece.
import { describe, expect, it } from 'vitest';
import { layoutOf } from './maps';
import { objectSpots } from './corners';
import { breaksOf, crewOf, objsOf } from './corners.test';
import { GROWS, NO_NEED, either, gardenOf, grownFor, needOf, wingOf, withExtensions } from './extensions';
import { terraceSlab } from './render/decor';
import { network } from './paths';
import type { Box, Leg } from './model';

const overlaps = (a: Box, b: Box): boolean => a.x0 < b.x1 - 1e-9 && a.x1 > b.x0 + 1e-9 && a.z0 < b.z1 - 1e-9 && a.z1 > b.z0 + 1e-9;
/** a leg through a box (both ends' segment meets it) */
function legThrough(l: Leg, b: Box): boolean {
  const [a, c] = l;
  for (let i = 0; i <= 40; i++) {
    const x = a.x + ((c.x - a.x) * i) / 40;
    const z = a.z + ((c.z - a.z) * i) / 40;
    if (x > b.x0 + 1e-6 && x < b.x1 - 1e-6 && z > b.z0 + 1e-6 && z < b.z1 - 1e-6) return true;
  }
  return false;
}

describe("his sketch's growth", () => {
  it('needs the wing for an indoor thing left, the garden for an outdoor one, nothing for none', () => {
    const [lib, ping] = [objsOf(34).find((p) => p.obj === 'library'), objsOf(34).find((p) => p.obj === 'pingpong')];
    if (!lib || !ping) throw new Error('fixtures');
    expect(needOf([])).toEqual(NO_NEED);
    expect(needOf([lib])).toEqual({ wing: true, garden: false });
    expect(needOf([ping])).toEqual({ wing: false, garden: true });
    expect(needOf([lib, ping])).toEqual({ wing: true, garden: true });
    expect(either({ wing: true, garden: false }, { wing: false, garden: true })).toEqual({ wing: true, garden: true });
  });

  it('a few objects that fit: the square alone, the same office', () => {
    const o = layoutOf(crewOf(3), 'loft');
    const g = grownFor(o, objsOf(10), []);
    expect(g.need).toEqual(NO_NEED);
    expect(g.office).toBe(o);
  });

  it('each extension in its sketch slot: the wing past the right side from the back wall, the garden in front of the terrace from the left', () => {
    for (const n of [1, 12, 20, 31]) {
      const o = layoutOf(crewOf(n), 'loft');
      const w = wingOf(o);
      const g = gardenOf(o);
      expect(w.x0).toBe(o.x0 + o.W);
      expect(w.z0).toBe(0);
      expect(w.z1).toBeLessThanOrEqual(o.D);
      expect(g.x0).toBe(o.x0);
      expect(g.z0).toBe(terraceSlab(o).z1);
      expect(g.x1).toBeGreaterThan(o.door.x);
    }
  });

  it('a full collection grows the loft, and every object stands by the laws on the grown floor', () => {
    for (const n of [1, 3, 12, 20, 31]) {
      const o = layoutOf(crewOf(n), 'loft');
      const objs = objsOf(34);
      const square = objectSpots(o, objs);
      const g = grownFor(o, objs, []);
      expect(g.need, `${String(n)} agents`).toEqual(needOf(square.left));
      const c = objectSpots(g.office, objs, square.placed);
      expect(breaksOf(g.office, c), `${String(n)} agents`).toEqual([]);
      // it takes in more than the square did
      expect(c.left.length, `${String(n)} agents`).toBeLessThan(square.left.length);
    }
  });

  it("the wing's walk and the garden's path cross no furniture, and join the office's network", () => {
    for (const n of [1, 12, 20, 31]) {
      const o = layoutOf(crewOf(n), 'loft');
      const g = withExtensions(o, { wing: true, garden: true });
      const added = g.walks.slice(o.walks.length);
      expect(added.length).toBeGreaterThan(0);
      for (const l of added) for (const f of o.furniture) expect(legThrough(l, f), `${String(n)} agents: ${JSON.stringify(l)} through ${JSON.stringify(f)}`).toBe(false);
      // every new leg's end is on the network: the wing's and the garden's far ends are reached from the door
      const net = network(g);
      const ends = added.flatMap(([a, b]) => [a, b]);
      for (const e of ends) expect(net.some(([a, b]) => (Math.hypot(a.x - e.x, a.z - e.z) < 1e-6 || Math.hypot(b.x - e.x, b.z - e.z) < 1e-6))).toBe(true);
    }
  });

  it('nothing drawn of the square moves: the grown office keeps its desks, furniture and walls', () => {
    const o = layoutOf(crewOf(12), 'loft');
    const g = withExtensions(o, { wing: true, garden: true });
    expect([g.x0, g.W, g.D]).toEqual([o.x0, o.W, o.D]);
    expect(g.desks).toBe(o.desks);
    expect(g.furniture).toBe(o.furniture);
    expect(overlaps(g.wing ?? { x0: 0, x1: 0, z0: 0, z1: 0 }, { x0: o.x0, x1: o.x0 + o.W, z0: 0, z1: o.D })).toBe(false);
  });

  it('grows the loft only so far (each map grows in its own step)', () => {
    expect([...GROWS]).toEqual(['loft']);
  });
});
