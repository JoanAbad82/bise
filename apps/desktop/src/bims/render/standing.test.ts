// @vitest-environment happy-dom
// A bim standing up at its desk never has its head in what hangs over it (bims m_33087, bims-sit:
// on the nordic table its head seemed to go into a pendant as it got up). For every ready map, a
// small and a big office, its first and last stage: a bim standing at each chair's spot, in front
// of it (G) and beside it (S, sit.ts), its head's box (bim.ts's head group, posed by pose.ts; main's
// 1.18 times bigger at main's desk) against every mesh of the world that hangs (its bottom over
// 0.9: a pendant, a shelf, a sign).
import { describe, expect, it } from 'vitest';
import { Box3, type Object3D } from 'three';
import { crowd } from '../fixtures';
import { readyMaps, layoutOf } from '../maps';
import { LAST_STAGE, NO_GROW } from '../growth';
import type { Office, Pose, Pt, Spot } from '../model';
import { chairSpots, sidePoints, toLocal, SIT } from '../sit';
import { buildWorld } from './world';
import { meshBoxes } from './cozy';
import { lookOf } from './maps';
import { makeBim } from './bim';
import { HEAD_Y } from './laptop';
import { rigOf } from './pose';
import { STYLE } from './style';

/** what a head may graze (float noise, a hat's edge) */
const SLACK = 0.02;
/** a mesh hangs when its bottom is over this (a standing bim's shoulders) */
const HANGS = 0.9;

const turn = (): Promise<void> => new Promise((done) => { setTimeout(done, 0); });

/** the head's box of a bim standing at p, facing its desk */
function headBox(p: Pt, face: number, main: boolean): Box3 {
  const bim = makeBim(main ? 'main' : 'agent-1', main, STYLE);
  const spot: Spot = { x: p.x, z: p.z, wz: p.z, ax: p.x, face };
  const pose: Pose = {
    x: p.x, z: p.z, dir: face, moving: false, since: 30,
    seg: { t: 0, act: { k: 'visit', at: 'desk' }, sig: 'visit', spot, path: { pts: [spot], seg: [], len: 0 }, speed: 2.4, from: null },
  };
  bim.apply(rigOf({ pose, t: 30, main, phase: 1.3, reduced: false }));
  bim.group.updateMatrixWorld(true);
  let head: Object3D | undefined;
  bim.group.traverse((o) => { if (!head && o.children.length > 0 && Math.abs(o.position.y - HEAD_Y) < 1e-6) head = o; });
  if (!head) throw new Error('no head group');
  const box = new Box3().setFromObject(head, true).expandByScalar(-SLACK);
  bim.dispose();
  return box;
}

const fmt = (b: Box3): string => `${b.min.toArray().map((v) => v.toFixed(2)).join(',')}..${b.max.toArray().map((v) => v.toFixed(2)).join(',')}`;

/** each standing head at a chair that goes into a hanging mesh at this stage */
function hits(o: Office, stage: number): string[] {
  const w = buildWorld(o, 'main', STYLE, lookOf(o.map), false, { ...NO_GROW, stage });
  const hanging = meshBoxes(w.root).filter((b) => b.min.y > HANGS);
  w.dispose();
  const out: string[] = [];
  for (const s of chairSpots(o)) {
    const main = s === o.mainDesk;
    // its side: where the way in leaves G (withSeats); both when none
    const G = sidePoints(s, 1).G;
    const leg = o.walks.find(([a, b]) => (Math.hypot(a.x - G.x, a.z - G.z) < 1e-4 && Math.hypot(b.x - s.x, b.z - s.z) > 1e-4) || (Math.hypot(b.x - G.x, b.z - G.z) < 1e-4 && Math.hypot(a.x - s.x, a.z - s.z) > 1e-4));
    const S = leg ? (Math.hypot(leg[0].x - G.x, leg[0].z - G.z) < 1e-4 ? leg[1] : leg[0]) : null;
    const side = S && toLocal(s, S).u < 0 ? -1 : 1;
    for (const [what, p] of [['spot', s], ['G', G], ['S', S ?? sidePoints(s, side).S]] as const) {
      const head = headBox(p, s.face, main);
      for (const b of hanging) if (b.intersectsBox(head)) out.push(`stage ${String(stage)}, (${s.x.toFixed(2)},${s.z.toFixed(2)}) ${what}: head ${fmt(head)} in ${fmt(b)}`);
    }
  }
  return out;
}

describe('standing: no bim getting up at its desk puts its head in what hangs over it', () => {
  it('the side point is beside the chair', () => {
    expect(SIT.side).toBeGreaterThan(0.42);
  });
  for (const id of readyMaps()) {
    it(`${id}: every chair, stages 0 and ${String(LAST_STAGE)}, 3 and 20 agents`, async () => {
      const out: string[] = [];
      for (const n of [3, 20]) {
        const o = layoutOf(crowd(n).agents, id);
        for (const stage of [0, LAST_STAGE]) {
          out.push(...hits(o, stage).map((h) => `${String(n)} agents, ${h}`));
          await turn();
        }
      }
      expect(out.slice(0, 6)).toEqual([]);
    }, 60_000);
  }
});
