import { describe, expect, it } from 'vitest';
import type { Office, Spot } from '../model';
import { BACK, RIGHT, UP, fitSite, siteOf, toScreen, type V3 } from './camera';
import { DART, cameraStart, viewPoint, catchPoint, dartAt, flightAt, glideAt, planFlight, planGlide, shadowOf, sizeAt, startPx, startSize, type FlightPlan } from './plane';
import { BEAT, HELD_LEN, PLANE_CATCH, heldAt } from './catch';
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
    }
  });

  it('ends in the bim\'s hand, its size, slow, even if the hand moved', () => {
    const f = plan(7);
    const end = flightAt(f, PLANE_FLIGHT);
    expect(end.p.x).toBeCloseTo(hand.x, 6);
    expect(end.p.y).toBeCloseTo(hand.y, 6);
    expect(end.p.z).toBeCloseTo(hand.z, 6);
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

  it('never loops over a pill: it moves its loop away, and sweeps past', () => {
    const seen = (a: V3, b: V3): number => Math.hypot(dot({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }, RIGHT), dot({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }, UP));
    for (const seed of [1, 2, 3, 4, 5]) {
      const free = plan(seed);
      const top = samples(free).reduce((a, b) => (b.up.y < a.up.y ? b : a));
      const pill = top.p; // a pill right where its loop would turn over
      const f = planFlight({ from: cameraStart(fit), to: hand, seed, unit: 1.4, avoid: [pill] });
      expect(f.loopAt).not.toBe(free.loopAt);
      // the worst case (a pill on its very path): its loop, which went through the pill, now keeps
      // more than half the plane's size (unit 1.4) from it on screen
      const inLoop = samples(f).filter((s) => Math.abs(s.u - f.loopAt) < f.loopW / 2);
      expect(Math.min(...inLoop.map((s) => seen(s.p, pill)))).toBeGreaterThan(1.4 * 0.6);
      expect(loopsOf(f)).toBe(1);
    }
  });

  it('ends in front of the bim, at its right hand, whichever way it faces', () => {
    for (const dir of [0, Math.PI / 2, Math.PI, -Math.PI / 3]) {
      const c = catchPoint(3, 5, dir);
      const ahead = { x: Math.sin(dir), z: Math.cos(dir) }; // bim.ts: its front is +z, turned by dir
      // 0.38 ahead, give or take its 0.1 toward the camera (so the laptop never hides it)
      const fwd = (c.x - 3) * ahead.x + (c.z - 5) * ahead.z;
      expect(fwd).toBeGreaterThan(0.27);
      expect(fwd).toBeLessThan(0.49);
      expect(Math.hypot(c.x - 3, c.z - 5)).toBeGreaterThan(0.3);
      expect(c.y).toBeLessThan(1.4); // at the hand, under its head
    }
  });

  it("a film's knobs: where it leaves, how long, no loop (hero-town m_31686)", () => {
    const left = cameraStart(fit, 0.1);
    expect(toScreen(fit, left).x).toBeCloseTo(fit.widthPx * 0.1, 3);
    expect(toScreen(fit, left).y).toBeGreaterThan(fit.heightPx);
    const short = planFlight({ from: left, to: hand, seed: 4, loops: 0, unit: 1.4, dur: 1.6 });
    const end = flightAt(short, 1.6);
    expect(end.p.x).toBeCloseTo(hand.x, 6);
    expect(end.p.z).toBeCloseTo(hand.z, 6);
    const ss = Array.from({ length: 401 }, (_, i) => flightAt(short, (i / 400) * 1.6));
    expect(Math.min(...ss.map((s) => s.up.y))).toBeGreaterThan(0); // never upside down: no loop
    expect(Math.min(...ss.map((s) => s.p.y))).toBeGreaterThan(0.5);
  });

  it('casts a soft shadow, fainter as it climbs', () => {
    const low = shadowOf({ x: 0, y: 0.5, z: 0 }, 0);
    const high = shadowOf({ x: 0, y: 4, z: 0 }, 0);
    expect(low.alpha).toBeGreaterThan(high.alpha);
    expect(high.size).toBeGreaterThan(low.size);
    expect(shadowOf({ x: 0, y: 20, z: 0 }, 0).alpha).toBe(0);
  });

  it('is replayable: the same seed the same flight, another seed another', () => {
    expect(flightAt(plan(11), 1.3)).toEqual(flightAt(plan(11), 1.3));
    expect(flightAt(plan(11), 1.3).p).not.toEqual(flightAt(plan(12), 1.3).p);
  });

  it('is a paper dart: one pointed nose, triangular wings to the tail, a keel under the spine', () => {
    const d = dartAt(0);
    const pts = Object.values(d);
    // the nose is one point, ahead of all the others: nothing else within a fifth of its length
    const front = Math.max(...pts.map((p) => p.z));
    expect(pts.filter((p) => Math.abs(p.z - front) < 1e-9).every((p) => p.x === 0 && p.y === 0)).toBe(true);
    for (const p of [d.tipR, d.tipL, d.keel]) expect(p.z).toBeLessThan(front - 0.8);
    // its wings are triangles (their corners fold onto the nose) with a dihedral, the keel hangs under
    expect(d.cornerR).toEqual(d.nose);
    expect(d.cornerL).toEqual(d.nose);
    expect(d.tipR.y).toBeGreaterThan(0);
    expect(d.tipR.x).toBeCloseTo(-d.tipL.x, 9);
    expect(d.keel.y).toBeLessThan(-0.1);
    // the width at 10% from the nose: a point, never a blunt box
    expect(DART.span * 0.1).toBeLessThan(0.05);
  });

  it('unfolds into a flat letter: the keel into the spine, the wings into the sheet', () => {
    const s = dartAt(1);
    for (const p of Object.values(s)) expect(p.y).toBeCloseTo(0, 9);
    expect(s.keel).toEqual(s.tail);
    const w = s.cornerR.x - s.cornerL.x;
    expect(w / 1).toBeGreaterThan(0.7); // a letter's width for its height
    expect(w / 1).toBeLessThan(0.85);
  });

  it('shrinks all the way from his eye to the bim\'s hand, never grows, ends at the bim\'s size', () => {
    for (const w of [320, 640, 1300]) {
      const f = fitSite(siteOf(officeFor(6)), w, 2000);
      const big = startSize(f, HELD_LEN);
      expect(big).toBeGreaterThan(1.5);
      expect(sizeAt(0, big)).toBeCloseTo(big, 9);
      expect(sizeAt(1, big)).toBe(1);
      let prev = Infinity;
      for (let i = 0; i <= 200; i++) {
        const k = sizeAt(i / 200, big);
        expect(k).toBeLessThanOrEqual(prev + 1e-12);
        prev = k;
      }
      // a steady zoom out, a little faster at first: never a speck early (over 40% of its start a
      // tenth of the way in), past half its start by a fifth of the way
      expect(sizeAt(0.1, big)).toBeGreaterThan(0.4 * big);
      expect(sizeAt(0.2, big)).toBeLessThan(0.75 * big);
      // and big on screen as it leaves, never a page
      expect(startPx(f)).toBeGreaterThanOrEqual(48);
      expect(startPx(f)).toBeLessThanOrEqual(160);
    }
  });

  it('starts all out of the view, under its bottom edge, its whole size below', () => {
    const at = toScreen(fit, cameraStart(fit));
    expect(at.y - fit.heightPx).toBeGreaterThan(startPx(fit) / 2);
  });

  it('lands in the hand: the flight and the glide end on the hand, and the hand holds it from that frame', () => {
    const glide = planGlide({ from: cameraStart(fit, 0.82), to: hand, seed: 3, dur: 2.8, px: fit.scale });
    for (const end of [flightAt(plan(2), PLANE_FLIGHT), glideAt(glide, 2.8)]) {
      expect(end.u).toBeCloseTo(1, 9);
      expect(Math.hypot(end.p.x - hand.x, end.p.y - hand.y, end.p.z - hand.z)).toBeLessThan(1e-9);
    }
    // no frame where it is gone before the hand holds it: flying until the catch, held from it
    for (const away of ['desk', 'pocket'] as const) {
      expect(heldAt(-0.001, away)).toBeNull();
      const first = heldAt(0, away);
      expect(first?.shown).toBe(true);
      expect(first?.grip).toBeCloseTo(0, 12); // held at its middle: the flight's last point
      expect(first?.hold).toBe(0); // the flight's last orientation, turning from there
      expect(first?.fold).toBe(0); // still a plane
      for (let c = 0; c < BEAT.away; c += 0.01) expect(heldAt(c, away)?.shown).toBe(true);
    }
    // read open, then: on the desk (still there at the catch's end) or into the pocket (hidden in the body)
    expect(heldAt(BEAT.read - 0.1, 'pocket')?.fold).toBe(1);
    expect(heldAt(PLANE_CATCH, 'desk')?.put).toBe(1);
    expect(heldAt(PLANE_CATCH, 'desk')?.shown).toBe(true);
    expect(heldAt(BEAT.away - 0.001, 'pocket')?.put).toBeGreaterThan(0.99);
    // reduced motion: the open sheet in its hand from the start, then on the desk
    expect(heldAt(-PLANE_FLIGHT, 'desk', true)?.fold).toBe(1);
    expect(heldAt(BEAT.read, 'desk', true)?.put).toBe(1);
  });

  it('a newer plane\'s reach cuts a catch short: its sheet goes away, never just gone', () => {
    const cut = 0.6;
    for (const away of ['desk', 'pocket'] as const) {
      const at = heldAt(cut, away, false, cut);
      expect(at).toEqual(heldAt(cut, away));
      // a little later: on its way away, still drawn; then at its end (on the desk, or hidden in the pocket)
      expect(heldAt(cut + 0.1, away, false, cut)?.shown).toBe(true);
      expect(heldAt(cut + 0.5, away, false, cut)?.put).toBe(1);
    }
    expect(heldAt(cut + 0.5, 'desk', false, cut)?.shown).toBe(true);
    expect(heldAt(cut + 0.5, 'pocket', false, cut)?.shown).toBe(false);
  });

  it("leaves from the view's point when the view gives one (the hero's sent bubble), and the glide holds it there", () => {
    const at = { x: 0.7, y: 0.75 };
    const p = toScreen(fit, viewPoint(fit, at));
    expect(p.x).toBeCloseTo(fit.widthPx * 0.7, 3);
    expect(p.y).toBeCloseTo(fit.heightPx * 0.75, 3);
    const g = planGlide({ from: viewPoint(fit, at), to: hand, seed: 2, dur: 2.8, px: fit.scale });
    const moved = viewPoint(fit, { x: 0.6, y: 0.7 });
    const s0 = glideAt(g, 0, hand, moved);
    expect(Math.hypot(s0.p.x - moved.x, s0.p.y - moved.y, s0.p.z - moved.z)).toBeLessThan(1e-9);
    expect(glideAt(g, 2.8, hand, moved).p.x).toBeCloseTo(hand.x, 6);
  });

  it("glides on a curve the size of the way he sees, never swung off by the way toward the camera", () => {
    const from = viewPoint(fit, { x: 0.8, y: 0.85 });
    const seenOf = (a: V3, b: V3): number => Math.hypot(dot({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }, RIGHT), dot({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }, UP));
    const way = seenOf(hand, from);
    for (const seed of [1, 2, 3, 4]) {
      const g = planGlide({ from, to: hand, seed, dur: 2.8, px: fit.scale });
      for (let i = 0; i <= 100; i++) {
        const p = glideAt(g, (i / 100) * 2.8).p;
        // on screen it stays near its straight way: never farther off it than a third of it
        const a = { x: dot({ x: p.x - from.x, y: p.y - from.y, z: p.z - from.z }, RIGHT), y: dot({ x: p.x - from.x, y: p.y - from.y, z: p.z - from.z }, UP) };
        const w = { x: dot({ x: hand.x - from.x, y: hand.y - from.y, z: hand.z - from.z }, RIGHT), y: dot({ x: hand.x - from.x, y: hand.y - from.y, z: hand.z - from.z }, UP) };
        const off = Math.abs(a.x * w.y - a.y * w.x) / way;
        expect(off).toBeLessThan(way / 3);
      }
    }
  });
});
