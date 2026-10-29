// The climbing wall's laws, pure (climbwall.ts): every problem climbs from the mat to the top, each
// stance's hands and feet on the surface at the bim's own limb lengths (architect m_37970: no stretch),
// its body clear of the wall, a hold under every limb, the volumes off every problem's lane. The real
// meshes' law (his condition, every frame): render/climb.test.ts.
import { describe, expect, it } from 'vitest';
import { agent, mainAgent } from './fixtures';
import { climbLayout } from './maps/climb';
import {
  CLEAR, MOVES, SKEL, TOUCH, WALL_TOP, bodyClear, decorHolds, footCorners, freeOf, handAt, insideVolume, len, routeHolds, routes, stancesOf, sub, toWorld, volumes,
} from './climbwall';

const office = (n: number) => climbLayout([mainAgent(), ...Array.from({ length: n }, (_, i) => agent(`a${String(i)}`))]);

describe('the climbing wall', () => {
  const o = office(6);
  const rs = routes(o.gym);

  it('has six problems, three a run, from slab to overhang', () => {
    expect(rs.length).toBe(6);
    expect(rs.filter((r) => r.slot === 0).length).toBe(3);
    expect(rs.some((r) => r.o2 < -0.3) && rs.some((r) => r.o2 > 0.8)).toBe(true);
  });

  for (const r of rs) {
    it(`problem ${String(r.id)}: every stance on the surface at the bim's own reach, its body clear`, () => {
      const ss = stancesOf(r);
      expect(ss.length).toBe(MOVES + 1);
      for (const s of ss) {
        expect(bodyClear(r, s.f)).toBeGreaterThanOrEqual(CLEAR - 1e-6);
        ([-1, 1] as const).forEach((side, i) => {
          const sh = toWorld(s.f, { x: side * SKEL.shoulder.x, y: SKEL.shoulder.y, z: 0 });
          const hand = handAt(s.f, side, s.arms[i] as never);
          expect(len(sub(hand, sh))).toBeCloseTo(SKEL.arm, 6);
          expect(len(sub(hand, s.hands[i] as never))).toBeLessThan(1e-6);
          expect(freeOf(r, hand) - SKEL.hand).toBeCloseTo(TOUCH.hand, 3);
          const near = Math.min(...footCorners(s.f, side, s.legs[i] as number).map((c) => freeOf(r, c)));
          expect(near).toBeCloseTo(TOUCH.foot, 3);
        });
      }
      const top = ss.at(-1);
      expect(Math.max(...(top?.hands ?? []).map((h) => h.y))).toBeGreaterThan(WALL_TOP - 0.35);
      expect(Math.max(...(top?.hands ?? []).map((h) => h.y))).toBeLessThan(WALL_TOP);
    });

    it(`problem ${String(r.id)}: a hold under every limb`, () => {
      const hs = routeHolds(r);
      for (const s of stancesOf(r)) for (const p of [...s.hands, ...s.feet]) expect(hs.some((h) => len(sub(h.p, p)) < SKEL.hand + 0.03)).toBe(true);
    });
  }

  it('keeps its volumes off every stance and has some', () => {
    const vs = volumes(o.gym);
    expect(vs.length).toBeGreaterThan(5);
    for (const r of rs) for (const s of stancesOf(r)) for (const p of [...s.hands, ...s.feet]) for (const x of vs) expect(insideVolume(x, p)).toBeLessThan(-0.1);
  });

  it('scatters other holds off the problems', () => {
    expect(decorHolds(o.gym).length).toBeGreaterThan(60);
  });
});
