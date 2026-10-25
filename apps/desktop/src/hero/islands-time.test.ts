// The home islands' entry (islands-time.ts, designer's brief on bims-home v11): the slab's cubes rise
// in one wave from the middle in about 0.9 s, the props drop after, the bim lands last, the gag
// starts by 2.5 s; the page shadow is never there before the slab and is whole once it is up.
import { describe, expect, it } from 'vitest';
import { ISLANDS, SLAB } from '@/bims/sprites/gags';
import { ISLAND_ENTRY, NOT_YET, cellsOf, cubeAt, dropAt, landAt, planOf, settled, shadowAt } from './islands-time';

describe("an island's entry", () => {
  const cells = cellsOf(SLAB.w);

  it('rises in one wave from the middle, in about 0.9 s', () => {
    const middle = cells.find((c) => c.x === 0 && c.z === 0);
    expect(middle?.start).toBe(0);
    const far = Math.max(...cells.map((c) => c.start));
    expect(far + ISLAND_ENTRY.tiles.dur).toBeGreaterThanOrEqual(800);
    expect(far + ISLAND_ENTRY.tiles.dur).toBeLessThanOrEqual(1000);
    for (const a of cells) for (const b of cells) if (Math.hypot(a.x, a.z) < Math.hypot(b.x, b.z) - 1e-9) expect(a.start).toBeLessThanOrEqual(b.start);
    expect(settled(far + ISLAND_ENTRY.tiles.dur)).toBe(true);
  });

  it('each cube: unseen before its start, under its place while rising, at its place after', () => {
    expect(cubeAt(-1, 0).s).toBe(NOT_YET);
    expect(cubeAt(100, 0).y).toBeLessThan(0);
    expect(cubeAt(ISLAND_ENTRY.tiles.dur, 0)).toEqual({ s: 1, y: 0 });
  });

  it('the page shadow: none before the slab, growing with it, whole once it is up', () => {
    expect(shadowAt(-1, cells)).toBe(0);
    let prev = 0;
    for (let ms = 0; ms <= 1000; ms += 25) {
      const k = shadowAt(ms, cells);
      expect(k).toBeGreaterThanOrEqual(prev);
      prev = k;
    }
    expect(shadowAt(1000, cells)).toBe(1);
  });

  it('props after the slab starts, the bim last, the gag by 2.5 s', () => {
    for (const s of ISLANDS) {
      const p = planOf(s.props.length);
      for (const t of p.props) expect(t, s.id).toBeGreaterThan(0);
      expect(p.bim, s.id).toBeGreaterThanOrEqual(Math.max(0, ...p.props));
      expect(p.gag, s.id).toBeLessThanOrEqual(ISLAND_ENTRY.most);
    }
  });

  it('a prop drops and squashes once, then rests at its place', () => {
    expect(dropAt(-1, 0).s).toBe(NOT_YET);
    expect(dropAt(0, 0).y).toBeGreaterThan(0);
    expect(dropAt(400, 0)).toEqual({ y: 0, sy: 1, s: 1 });
  });

  it('the bim lands in 0.3 s: unseen before, falling, a squash, then still', () => {
    expect(landAt(-1, 0).shown).toBe(false);
    expect(landAt(50, 0).y).toBeGreaterThan(0);
    expect(landAt(240, 0).k).toBeGreaterThan(0);
    expect(landAt(300, 0)).toEqual({ y: 0, k: 0, shown: true });
  });
});
