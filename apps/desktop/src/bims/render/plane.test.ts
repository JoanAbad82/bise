import { describe, expect, it } from 'vitest';
import type { Office, Spot } from '../model';
import { BACK, RIGHT, fitSite, siteOf, toScreen, type V3 } from './camera';
import { cameraStart, flightAt, planFlight, type FlightPlan } from './plane';
import { PLANE_FLIGHT } from './pose';

/** the prototype's office numbers for n agents (maps/loft.ts owns the real ones; these only size the site) */
function officeFor(n: number): Office {
  const W = 2 * (0.7 + 1.0 + 2 * 2.4) + 0.2;
  const D = 4.3 + Math.max(3, Math.ceil((n - 1) / 4)) * 2.3 + 1.0;
  const spot: Spot = { x: 0, z: 1, wz: 1, ax: 0, face: 0 };
  return {
    map: 'loft', size: '2x3', W, D, x0: -W / 2,
    island: { x0: -0.7, x1: 0.7, z0: 4.5, z1: 10 },
    desks: new Map(), mainDesk: spot, islandSpots: [], lounge: [], boardSpots: [], queue: [], door: spot, terrace: [],
    exit: spot, queueMore: [spot, spot], walks: [], furniture: [],
  };
}

const dot = (a: V3, b: V3): number => a.x * b.x + a.y * b.y + a.z * b.z;
const fit = fitSite(siteOf(officeFor(6)), 320, 2000);
const hand: V3 = { x: 2.4, y: 1.0, z: 6.2 };
const plan = (seed: number, loops = 1): FlightPlan => planFlight({ from: cameraStart(fit), to: hand, seed, loops, unit: 1.4 });
const STEPS = 600;
const samples = (f: FlightPlan) => Array.from({ length: STEPS + 1 }, (_, i) => flightAt(f, (i / STEPS) * PLANE_FLIGHT));

/** its loops: the times it goes upside down (its top under -0.5), climbing over the top of a circle */
function loopsOf(f: FlightPlan): number {
  let n = 0;
  let over = false;
  for (const s of samples(f)) {
    if (!over && s.up.y < -0.5) n++;
    over = s.up.y < -0.5;
  }
  return n;
}

describe('his paper plane', () => {
  it('starts at the camera: under the view\'s bottom edge, its middle, in front of the office', () => {
    for (const seed of [1, 2, 3, 99]) {
      const s0 = flightAt(plan(seed), 0);
      const at = toScreen(fit, s0.p);
      expect(at.y).toBeGreaterThan(fit.heightPx);
      expect(at.x).toBeCloseTo(fit.widthPx / 2, 3);
      expect(dot({ x: s0.p.x - hand.x, y: s0.p.y - hand.y, z: s0.p.z - hand.z }, BACK)).toBeGreaterThan(5);
      expect(s0.grow).toBeGreaterThan(2); // close to his eye: big
    }
  });

  it('ends in the bim\'s hand, its size, slow, even if the hand moved', () => {
    const f = plan(7);
    const end = flightAt(f, PLANE_FLIGHT);
    expect(end.p.x).toBeCloseTo(hand.x, 6);
    expect(end.p.y).toBeCloseTo(hand.y, 6);
    expect(end.p.z).toBeCloseTo(hand.z, 6);
    expect(end.grow).toBe(1);
    const moved = { x: hand.x + 0.3, y: hand.y, z: hand.z - 0.2 };
    const m = flightAt(f, PLANE_FLIGHT, moved);
    expect(m.p.x).toBeCloseTo(moved.x, 6);
    expect(m.p.z).toBeCloseTo(moved.z, 6);
    // the flare: slower over its last tenth than on average
    const d = (a: number, b: number) => {
      const p = flightAt(f, a * PLANE_FLIGHT).p;
      const q = flightAt(f, b * PLANE_FLIGHT).p;
      return Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
    };
    expect(d(0.95, 1) / 0.05).toBeLessThan(d(0.5, 0.55) / 0.05);
  });

  it('loops once (twice for the y1 egg), in the view\'s plane, upside down over the top', () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      expect(loopsOf(plan(seed))).toBe(1);
      expect(loopsOf(plan(seed, 2))).toBe(2);
      // over the top it is higher than where it went in: a circle, not a wiggle
      const ss = samples(plan(seed));
      const top = ss.reduce((a, b) => (b.up.y < a.up.y ? b : a));
      const into = ss.find((s) => Math.abs(s.u - (plan(seed).loopAt - plan(seed).loopW / 2)) < 0.01);
      expect(top.p.y - (into?.p.y ?? Infinity)).toBeGreaterThan(plan(seed).r);
    }
    expect(Math.abs(dot(plan(1).loopFwd, RIGHT))).toBeCloseTo(1, 6);
    expect(Math.min(...samples(plan(3)).map((s) => s.up.y))).toBeLessThan(-0.9);
  });

  it('zigzags: crosses its straight line, banking into each turn', () => {
    const f = plan(5);
    const from = f.from;
    const side = samples(f).map((s) => dot({ x: s.p.x - from.x - (hand.x - from.x) * s.u, y: 0, z: s.p.z - from.z - (hand.z - from.z) * s.u }, f.side));
    let crossings = 0;
    for (let i = 1; i < side.length; i++) if (Math.sign(side[i] ?? 0) !== Math.sign(side[i - 1] ?? 0)) crossings++;
    expect(crossings).toBeGreaterThanOrEqual(3);
    const banks = samples(f).filter((s) => s.u < 0.3 || s.u > 0.75).map((s) => Math.abs(dot(s.up, f.side)));
    expect(Math.max(...banks)).toBeGreaterThan(0.2);
  });

  it('stays above the floor, its nose and top square, and moves smoothly', () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
      for (const loops of [1, 2]) {
        const ss = samples(plan(seed, loops));
        for (const s of ss) {
          expect(s.p.y).toBeGreaterThan(0.5);
          expect(Math.abs(dot(s.nose, s.up))).toBeLessThan(1e-6);
          expect(Math.hypot(s.up.x, s.up.y, s.up.z)).toBeCloseTo(1, 6);
        }
        // no jump between two 5 ms frames bigger than a 60th of the way
        const ps = ss.map((s) => s.p);
        const from = ps[0] ?? hand;
        const way = Math.hypot(hand.x - from.x, hand.y - from.y, hand.z - from.z);
        ps.slice(1).forEach((b, i) => {
          const a = ps[i] ?? b;
          expect(Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)).toBeLessThan(way / 60);
        });
      }
    }
  });

  it('is replayable: the same seed the same flight, another seed another', () => {
    expect(flightAt(plan(11), 1.3)).toEqual(flightAt(plan(11), 1.3));
    expect(flightAt(plan(11), 1.3).p).not.toEqual(flightAt(plan(12), 1.3).p);
  });
});
