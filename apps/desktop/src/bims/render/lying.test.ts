// @vitest-environment happy-dom
// No lying pose goes through the furniture (Gabriel, bims-life: on the loft at stage 11 the last
// bean bag's napper had its head inside the arcade cabinet). For every ready map, at every growth
// stage, a small and a big office: the world as world.ts builds it, a napper on each bed that stage
// has (growth.ts bedsAt), and its head's box (bim.ts's head group, posed by pose.ts) against every
// mesh of the world but its own bed's (the meshes inside the bed's floor box: a pillow, a hammock).
import { describe, expect, it } from 'vitest';
import { Box3, Mesh, type Object3D } from 'three';
import { crowd } from '../fixtures';
import { readyMaps, layoutOf } from '../maps';
import { bedsAt, LAST_STAGE, NO_GROW } from '../growth';
import type { Activity, Box, Office, Pose, Spot } from '../model';
import { buildWorld } from './world';
import { lookOf } from './maps';
import { makeBim } from './bim';
import { HEAD_Y } from './laptop';
import { rigOf } from './pose';
import { STYLE } from './style';

/** what a head may graze (float noise, a hat's edge) */
const SLACK = 0.02;

/** the head's box of a bim posed with `act` at `spot`, world units */
function headBox(spot: Spot, act: Activity): Box3 {
  const bim = makeBim('agent-1', false, STYLE);
  const pose: Pose = {
    x: spot.x, z: spot.z, dir: spot.face, moving: false, since: 30,
    seg: { t: 0, act, sig: act.k, spot, path: { pts: [spot], seg: [], len: 0 }, speed: 2.4, from: null },
  };
  bim.apply(rigOf({ pose, t: 30, main: false, phase: 1.3, reduced: false }));
  bim.group.updateMatrixWorld(true);
  let head: Object3D | undefined;
  bim.group.traverse((o) => { if (!head && o.children.length > 0 && Math.abs(o.position.y - HEAD_Y) < 1e-6) head = o; });
  if (!head) throw new Error('no head group');
  const box = new Box3().setFromObject(head, true).expandByScalar(-SLACK);
  bim.dispose();
  return box;
}

const inside = (b: Box3, f: Box): boolean => b.min.x >= f.x0 - 0.1 && b.max.x <= f.x1 + 0.1 && b.min.z >= f.z0 - 0.1 && b.max.z <= f.z1 + 0.1;
const fmt = (b: Box3): string => `${b.min.toArray().map((v) => v.toFixed(2)).join(',')}..${b.max.toArray().map((v) => v.toFixed(2)).join(',')}`;

/** each napper's head that goes through a mesh of the world at this stage */
function hits(o: Office, stage: number): string[] {
  const w = buildWorld(o, 'main', STYLE, lookOf(o.map), false, { ...NO_GROW, stage });
  w.root.updateMatrixWorld(true);
  const meshes: Box3[] = [];
  w.root.traverse((m) => { if (m instanceof Mesh) meshes.push(new Box3().setFromObject(m, true)); });
  w.dispose();
  const out: string[] = [];
  o.lounge.slice(0, bedsAt(stage)).forEach((s, i) => {
    const head = headBox(s, { k: 'nap', at: 'lounge' });
    const bed = o.furniture.find((f) => f.of?.x === s.x && f.of.z === s.z);
    for (const b of meshes) {
      if (bed && inside(b, bed)) continue;
      if (b.intersectsBox(head)) out.push(`stage ${String(stage)}, bed ${String(i)}: head ${fmt(head)} in ${fmt(b)}`);
    }
  });
  return out;
}

describe('lying: no napper lays its head in the furniture', () => {
  for (const id of readyMaps()) {
    it(`${id}: every bed, stages 0..${String(LAST_STAGE)}, 3 and 20 agents`, () => {
      const out: string[] = [];
      for (const n of [3, 20]) {
        const o = layoutOf(crowd(n).agents, id);
        for (let stage = 0; stage <= LAST_STAGE; stage++) out.push(...hits(o, stage).map((h) => `${String(n)} agents, ${h}`));
      }
      expect(out).toEqual([]);
      // 30 worlds built per map: seconds alone, more on a loaded machine
    }, 60_000);
  }
});
