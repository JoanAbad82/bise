// The entry build's timeline (design's hero-entry §2, Gabriel's ripple): its eases, one wave of
// cubes from the middle out, and the whole map there by 2.4 s.
import { describe, expect, it } from 'vitest';
import { cellOf, easeInOut, ENTRY, gridOf, popAt, popOut, tileAt, tileStart, wordsAt } from './entry';

const LAWN = { x0: -30, x1: 30, z0: -25, z1: 25 };

describe('the entry build', () => {
  it('eases in and out: slow ends, the middle at half', () => {
    expect(easeInOut(0)).toBeCloseTo(0);
    expect(easeInOut(0.5)).toBeCloseTo(0.5, 3);
    expect(easeInOut(1)).toBeCloseTo(1);
    expect(easeInOut(0.1)).toBeLessThan(0.05);
  });

  it('pops with a 4% overshoot, then settles at its size', () => {
    const peak = Math.max(...Array.from({ length: 101 }, (_, i) => popOut(i / 100)));
    expect(peak).toBeGreaterThan(1.035);
    expect(peak).toBeLessThan(1.045);
    expect(popOut(1)).toBeCloseTo(1);
  });

  it('cuts the lawn into equal cubes that tile it exactly', () => {
    const g = gridOf(LAWN);
    expect(g.nx * g.cw).toBeCloseTo(60);
    expect(g.nz * g.cd).toBeCloseTo(50);
    const a = cellOf(LAWN, -30, -25);
    const b = cellOf(LAWN, 30, 25);
    expect(a.x).toBeCloseTo(-30 + g.cw / 2);
    expect(a.z).toBeCloseTo(-25 + g.cd / 2);
    expect(b.x).toBeCloseTo(30 - g.cw / 2);
    expect(b.z).toBeCloseTo(25 - g.cd / 2);
  });

  it('rises as one wave: the nearer cube always first, never a cube out of turn', () => {
    const ds = Array.from({ length: 20 }, (_, i) => i * 2);
    const starts = ds.map((d) => tileStart(d, 38));
    for (let i = 1; i < starts.length; i++) expect(starts[i] ?? 0).toBeGreaterThanOrEqual(starts[i - 1] ?? 0);
    expect(tileStart(0, 38)).toBe(ENTRY.tiles.from);
    expect(tileStart(38, 38)).toBe(ENTRY.tiles.from + ENTRY.tiles.span);
    // a cube: under its place and nothing before its start, settled at its place after its rise
    expect(tileAt(100, 200).y).toBeLessThan(0);
    expect(tileAt(100, 200).s).toBeLessThan(0.01);
    expect(tileAt(200 + ENTRY.tiles.dur, 200)).toEqual({ s: 1, y: 0 });
  });

  it('has the whole map there by 2.4 s: the last cube, thing, office and bim', () => {
    const lastCube = ENTRY.tiles.from + ENTRY.tiles.span + ENTRY.tiles.dur;
    const lastThing = ENTRY.tiles.from + ENTRY.tiles.span + ENTRY.thing.after + ENTRY.thing.dur;
    const lastOffice = ENTRY.tiles.from + ENTRY.tiles.span + ENTRY.thing.after + ENTRY.drop + 5 * 12 + ENTRY.furniture;
    const lastBim = ENTRY.bims.from + 14 * ENTRY.bims.gap + ENTRY.bims.pop;
    expect(Math.max(lastCube, lastThing, lastOffice, lastBim)).toBeLessThanOrEqual(ENTRY.built);
    expect(popAt(ENTRY.built, ENTRY.bims.from + 14 * ENTRY.bims.gap, ENTRY.bims.pop)).toBe(1);
    expect(wordsAt(ENTRY.built)).toBeCloseTo(1);
    expect(wordsAt(2000)).toBe(0);
    expect(ENTRY.cam.to).toBe(ENTRY.done);
  });
});
