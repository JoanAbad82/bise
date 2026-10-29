import { describe, expect, it } from 'vitest';
import { ENTRY } from '@/hero/entry';
import { ISLAND_ENTRY } from '@/hero/islands-time';
import { SIDE, cellIndexAt, gridOf, piecesOf, planFor, startsOf, thingEnd, type Thing } from './entrance-time';

const slab = { x0: -1.8, x1: 1.8, z0: -1, z1: 1 };
const at = (x: number, z: number, y = 0, top = 0.6, half = 0.2): Thing => ({ x, z, y, top, box: { x0: x - half, x1: x + half, z0: z - half, z1: z + half } });

describe('the banners entrance: the islands wave on a banner slab', () => {
  it('cuts the slab in cubes about the islands size, the middle first, the corners last', () => {
    const g = gridOf(slab);
    expect(g.nx).toBe(12);
    expect(g.nz).toBe(7);
    expect(g.side).toBeCloseTo(SIDE, 1);
    const mid = g.cells[cellIndexAt(g, 0, 0)]?.start ?? -1;
    const corner = g.cells[cellIndexAt(g, 1.79, 0.99)]?.start ?? -1;
    expect(mid).toBeLessThan(200);
    expect(corner).toBeCloseTo(ENTRY.tiles.from + ENTRY.tiles.span, 0);
  });

  it('cuts a ground box along the cubes it lies on, nothing past it', () => {
    const g = gridOf(slab);
    const wall = { x0: -1.8, x1: 1.8, z0: -1, z1: -0.84 };
    const ps = piecesOf(g, wall);
    expect(ps).toHaveLength(12);
    expect(ps.reduce((a, p) => a + p.w * p.d, 0)).toBeCloseTo(3.6 * 0.16, 6);
    expect(piecesOf(g, slab)).toHaveLength(84);
  });

  it('a thing comes with the cube under its foot; one on a desk once the desk has popped', () => {
    const g = gridOf(slab);
    const desk = at(1.2, 0.5, 0, 0.63, 0.5);
    const notes = at(1.0, 0.4, 0.63, 0.7, 0.1);
    const plant = at(-1.5, -0.8);
    const [d = 0, n = 0, p = 0] = startsOf(g, [desk, notes, plant]);
    expect(d).toBe(g.cells[cellIndexAt(g, 1.2, 0.5)]?.start);
    expect(n).toBeGreaterThanOrEqual(d + ENTRY.thing.dur);
    expect(p).toBe(g.cells[cellIndexAt(g, -1.5, -0.8)]?.start);
  });

  it('the bims land once every cube and thing is in, and the scene is still when they have', () => {
    const g = gridOf(slab);
    const things = [at(0, 0), at(1.7, 0.9)];
    const starts = startsOf(g, things);
    const withBim = planFor(g, things, starts, 1);
    const last = Math.max(...g.cells.map((c) => c.start + ENTRY.tiles.dur), ...starts.map(thingEnd));
    expect(withBim.bim).toBe(last);
    expect(withBim.done).toBe(withBim.bim + ISLAND_ENTRY.bim.dur);
    expect(planFor(g, things, starts, 0).done).toBe(withBim.bim);
    // the islands' budget: built by 2.5 s
    expect(withBim.done).toBeLessThanOrEqual(ISLAND_ENTRY.most);
  });
});
