// @vitest-environment happy-dom
// The typing hands' law (Gabriel m_49096: in the hero film and the office, the typing hands went
// through the desk's edge): a bim typing at its desk, an agent or main, every 1/8 s of its loop,
// rests each hand on its laptop's keys (laptop.ts KEYS, onKeys): over the base's top, never into it,
// on the base's front half, both hands apart, and taps them in turn.
import { describe, expect, it } from 'vitest';
import { Box3, Mesh, SphereGeometry, Vector3 } from 'three';
import type { Pose, Spot } from '../model';
import { makeBim } from './bim';
import { KEYS, LAPTOP } from './laptop';
import { rigOf } from './pose';
import { STYLE } from './style';

const SPOT: Spot = { x: 0, z: 0, wz: 0, ax: 0, face: 0 };

function hands(main: boolean, t: number, hot: boolean): Box3[] {
  const b = makeBim(main ? 'main' : 'agent-1', main, STYLE, undefined, undefined, false);
  const act = { k: main ? 'main' : hot ? 'hot' : 'work', at: 'desk' } as const;
  const pose: Pose = { x: 0, z: 0, dir: 0, moving: false, since: 30, seg: { t: 0, act, sig: act.k, spot: SPOT, path: { pts: [SPOT], seg: [], len: 0 }, speed: 2.4, from: null } };
  b.apply(rigOf({ pose, t, main, phase: 0.7, reduced: false }));
  b.group.updateMatrixWorld(true);
  const out: Box3[] = [];
  b.group.traverse((o) => {
    if (!(o instanceof Mesh) || (o.parent?.name !== 'armL' && o.parent?.name !== 'armR')) return;
    const g = o.geometry as unknown;
    if (g instanceof SphereGeometry && g.parameters.radius === 0.066) out.push(new Box3().setFromObject(o));
  });
  b.dispose();
  return out;
}

describe('typing: the hands on the keys', () => {
  const base = LAPTOP.base;
  const back = KEYS.z1 + base.d / 2;
  for (const [who, main, hot] of [['an agent', false, false], ['an agent, hot', false, true], ['main', true, false]] as const) {
    it(`${who}: each hand over the keys, never in the base or the desk, on the laptop, both apart`, () => {
      const lifts: number[][] = [[], []];
      for (let i = 0; i < 16; i++) {
        const hs = hands(main, 30 + i / 8, hot);
        expect(hs).toHaveLength(2);
        hs.forEach((h, k) => {
          const c = h.getCenter(new Vector3());
          // never into the base (a hair's breadth of the sphere's facets), at most a tap over it
          expect(h.min.y, `${who} hand ${String(k)} at ${String(i)}`).toBeGreaterThan(KEYS.y - 0.002);
          expect(h.min.y).toBeLessThan(KEYS.y + 0.035);
          // on the laptop's base, its front part (the keys), never over its edge or under the lid
          expect(c.z).toBeGreaterThan(KEYS.z0 + 0.04);
          expect(c.z).toBeLessThan(back - 0.12);
          expect(Math.abs(c.x)).toBeLessThan(base.w / 2 - 0.05);
          lifts[k]?.push(h.min.y);
        });
        expect(Math.abs((hs[0]?.getCenter(new Vector3()).x ?? 0) - (hs[1]?.getCenter(new Vector3()).x ?? 0))).toBeGreaterThan(0.2);
      }
      // each hand taps: it lifts and comes back down
      for (const l of lifts) expect(Math.max(...l) - Math.min(...l)).toBeGreaterThan(0.008);
    });
  }
});
