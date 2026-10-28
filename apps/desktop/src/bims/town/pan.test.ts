// The town's pan (town/pan.ts, his m_49446): it moves at the fit too, stops at ROOM past the fit with
// iOS's rubber (resists more the further he pulls, never a view's size), springs back on release;
// reduced motion: a plain line.
import { describe, expect, it } from 'vitest';
import { FIT } from '../zoom';
import { boundOf, overshot, panTown, ROOM, rubber, settle, SPRING_S, springAt, townWheel, unrubber } from './pan';

const W = 400;
const H = 200;

describe('town pan', () => {
  it('moves at the fit, as far as ROOM past it, no further with the rubber off (reduced motion)', () => {
    const a = panTown(FIT, -40, 0, W, H, false);
    expect(a.u).toBeCloseTo(0.5 + 40 / W);
    const far = panTown(FIT, -10_000, -10_000, W, H, false);
    expect(far.u).toBeCloseTo(boundOf(1).hi);
    expect(far.v).toBeCloseTo(boundOf(1).hi);
    expect(boundOf(1).hi).toBeCloseTo(0.5 + ROOM);
    expect(overshot(far)).toBe(false);
  });

  it("past the bound the rubber resists: each pull shows less than the last, never the view's size", () => {
    let c = panTown(FIT, -ROOM * W, 0, W, H);
    expect(c.u).toBeCloseTo(boundOf(1).hi);
    const shown: number[] = [];
    for (let i = 0; i < 20; i++) {
      const was = c.u;
      c = panTown(c, -50, 0, W, H);
      shown.push((c.u - was) * W);
    }
    expect(overshot(c)).toBe(true);
    for (let i = 1; i < shown.length; i++) expect(shown[i]).toBeLessThan(shown[i - 1] ?? Infinity);
    expect((c.u - boundOf(1).hi) * W).toBeLessThan(W);
    // pulled back the same way: the same place (stateless: the overshoot is the rubber's state)
    for (let i = 0; i < 20; i++) c = panTown(c, 50, 0, W, H);
    expect(c.u).toBeCloseTo(boundOf(1).hi, 6);
  });

  it("the rubber is iOS's curve and its inverse", () => {
    for (const x of [1, 10, 100, 1000]) expect(unrubber(rubber(x, W), W)).toBeCloseTo(x, 6);
    expect(rubber(W, W)).toBeCloseTo((1 - 1 / 1.55) * W);
    expect(rubber(-5, W)).toBe(0);
  });

  it('springs back to the bound when he lets go, eased, landed by SPRING_S', () => {
    let c = FIT;
    for (let i = 0; i < 10; i++) c = panTown(c, 0, -80, W, H);
    expect(overshot(c)).toBe(true);
    const to = settle(c);
    const at = [0, 0.05, 0.1, 0.2, 0.4].map((s) => springAt(c, s)?.v ?? to.v);
    expect(at[0]).toBeCloseTo(c.v);
    for (let i = 1; i < at.length; i++) expect(Math.abs((at[i] ?? 0) - to.v)).toBeLessThan(Math.abs((at[i - 1] ?? 0) - to.v));
    expect(springAt(c, SPRING_S)).toBeNull();
  });

  it('two fingers pan at the fit, a pinch zooms and keeps the view in its bound', () => {
    const c = townWheel(FIT, { dx: 30, dy: 0, mode: 0, ctrl: false }, 200, 100, W, H, H);
    expect(c.u).toBeGreaterThan(0.5);
    const z = townWheel(FIT, { dx: 0, dy: -100, mode: 0, ctrl: true }, 0, 0, W, H, H);
    expect(z.zoom).toBeGreaterThan(1);
    expect(overshot(z)).toBe(false);
    // a pinch out past the fit: back to zoom 1, inside the bound
    const out = townWheel(z, { dx: 0, dy: 5000, mode: 0, ctrl: true }, 0, 0, W, H, H);
    expect(out.zoom).toBe(1);
    expect(overshot(out)).toBe(false);
  });
});
