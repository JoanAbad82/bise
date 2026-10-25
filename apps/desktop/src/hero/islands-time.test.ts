// The home islands' entry (islands-time.ts; designer's brief on bims-home v11 and Gabriel's note: the
// hero's cube wave from the middle): the cubes rise in the hero's own wave (its stagger, its curve),
// each thing comes with its cube and squashes once, the bim lands last, the gag starts by 2.5 s; the
// page shadow is never there before the slab and is whole once it is up.
import { describe, expect, it } from 'vitest';
import { ISLANDS, SLAB } from '@/bims/sprites/gags';
import { ENTRY, NOT_YET, tileStart } from './entry';
import { GRID, ISLAND_ENTRY, cellAt, cellsOf, cubeAt, landAt, planOf, settled, shadowAt, thingAt } from './islands-time';

describe("an island's entry", () => {
  const cells = cellsOf(SLAB.w);
  const side = SLAB.w / GRID;

  it("rises in the hero's own wave: the middle first, the corners at the hero's span", () => {
    const middle = cells.find((c) => Math.abs(c.x) < 1e-9 && Math.abs(c.z) < 1e-9);
    expect(middle?.start).toBe(tileStart(0, 1));
    expect(Math.max(...cells.map((c) => c.start))).toBe(tileStart(1, 1));
    for (const a of cells) for (const b of cells) if (Math.hypot(a.x, a.z) < Math.hypot(b.x, b.z) - 1e-9) expect(a.start).toBeLessThanOrEqual(b.start);
    expect(settled(tileStart(1, 1) + ENTRY.tiles.dur, cells)).toBe(true);
  });

  it('each cube: unseen before its start, under its place while rising, at its place after', () => {
    expect(cubeAt(-1, 0, side).s).toBe(NOT_YET);
    expect(cubeAt(100, 0, side).y).toBeLessThan(0);
    expect(cubeAt(ENTRY.tiles.dur, 0, side)).toEqual({ s: 1, y: 0 });
  });

  it('a thing comes a beat after its cube, rides it up, squashes once, then rests', () => {
    const c = cellAt(cells, 0.5, -0.3);
    expect(thingAt(c.start, c, side).s).toBe(NOT_YET);
    const mid = thingAt(c.start + ENTRY.thing.after + 60, c, side);
    expect(mid.s).toBeGreaterThan(NOT_YET);
    expect(mid.y).toBeLessThan(0);
    const sq = thingAt(c.start + ENTRY.tiles.dur + ISLAND_ENTRY.squash.dur / 2, c, side);
    expect(sq.sy).toBeLessThan(0.95);
    expect(thingAt(c.start + 2000, c, side)).toEqual({ y: 0, s: 1, sy: 1 });
  });

  it('the page shadow: none before the slab, growing with it, whole once it is up', () => {
    expect(shadowAt(-1, cells)).toBe(0);
    let prev = 0;
    for (let ms = 0; ms <= 2500; ms += 25) {
      const k = shadowAt(ms, cells);
      expect(k).toBeGreaterThanOrEqual(prev);
      prev = k;
    }
    expect(shadowAt(2500, cells)).toBe(1);
  });

  it('the bim lands after every cube and thing, the gag by 2.5 s', () => {
    for (const s of ISLANDS) {
      const things = s.props.map((p) => cellAt(cells, p.x, p.z));
      const p = planOf(cells, things);
      expect(p.bim, s.id).toBeGreaterThanOrEqual(Math.max(...cells.map((c) => c.start + ENTRY.tiles.dur)));
      expect(p.gag, s.id).toBeLessThanOrEqual(ISLAND_ENTRY.most);
    }
  });

  it('the bim lands in 0.3 s: unseen before, falling, a squash, then still', () => {
    expect(landAt(-1, 0).shown).toBe(false);
    expect(landAt(50, 0).y).toBeGreaterThan(0);
    expect(landAt(240, 0).k).toBeGreaterThan(0);
    expect(landAt(300, 0)).toEqual({ y: 0, k: 0, shown: true });
  });
});
