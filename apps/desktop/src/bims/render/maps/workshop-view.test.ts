// @vitest-environment happy-dom
// The workshop's bims in sight (Gabriel via main m_35959: main's bim stood hidden behind the roller
// door's frame on the right edge; bims m_35967 moved it to the left wall's front stretch):
// - from the office's camera (camera.ts: one isometric direction at 320 and wide, only the fit
//   changes), a ray from each desk bim's head and chest, seated, toward the camera meets no mesh of
//   the world, at 6, 12, 18, 19 and 30 desks and every stage;
// - nothing taller than 1.0 stands on the camera's sides of the room where they are before the bims (the right
//   edge in front of main's desk, the front edge right of the left aisle).
import { describe, expect, it } from 'vitest';
import { Box3, Mesh, Raycaster, Vector3, type Object3D } from 'three';
import { crowd } from '../../fixtures';
import { LAST_STAGE, NO_GROW } from '../../growth';
import { layoutOf } from '../../maps';
import type { Office } from '../../model';
import { chairSpots } from '../../sit';
import { BACK } from '../camera';
import { headBox } from '../heads.testkit';
import { STYLE } from '../style';
import { buildWorld } from '../world';
import { lookOf } from './index';

const COUNTS = [6, 12, 18, 19, 30] as const;
/** a seated bim's chest, world units */
const CHEST = 0.55;
/** how far in from an edge a piece counts as on it, and how tall it may be there */
const EDGE = 0.6;
const LOW = 1.0;
/** main's desk's depth from its chair to its front (maps/workshop.ts: its box at z + 0.6, 1.0 deep): the plant beside it is decor.ts's, on every map */
const MAIN_DEPTH = 1.1;

const turn = (): Promise<void> => new Promise((done) => { setTimeout(done, 0); });

function meshesOf(o: Office, stage: number): { meshes: Object3D[]; dispose: () => void } {
  const w = buildWorld(o, 'main', STYLE, lookOf(o.map), false, { ...NO_GROW, stage });
  w.root.updateMatrixWorld(true);
  const meshes: Object3D[] = [];
  w.root.traverse((m) => {
    if (m instanceof Mesh) meshes.push(m);
  });
  return { meshes, dispose: () => { w.dispose(); } };
}

describe('the workshop keeps its bims in sight', () => {
  it('a ray from each seated bim\'s head and chest to the camera meets nothing, every stage', async () => {
    const dir = new Vector3(BACK.x, BACK.y, BACK.z).normalize();
    const out: string[] = [];
    for (const n of COUNTS) {
      const o = layoutOf(crowd(n).agents, 'workshop');
      const marks = chairSpots(o).flatMap((s) => {
        const head = headBox(s, s.face, s === o.mainDesk, true).getCenter(new Vector3());
        const at = `${s === o.mainDesk ? 'main' : 'desk'} (${s.x.toFixed(2)},${s.z.toFixed(2)})`;
        return [{ what: `${at} head`, from: head }, { what: `${at} chest`, from: new Vector3(s.x, CHEST, s.z) }];
      });
      for (let stage = 0; stage <= LAST_STAGE; stage++) {
        const { meshes, dispose } = meshesOf(o, stage);
        for (const m of marks) {
          // past its own seat: a ray starts a little toward the camera
          const hit = new Raycaster(m.from, dir, 0.3, 80).intersectObjects(meshes, false)[0];
          if (hit) out.push(`${String(n)} desks, stage ${String(stage)}, ${m.what}: ${hit.object.name || hit.object.type} at ${hit.point.toArray().map((v) => v.toFixed(2)).join(',')}`);
        }
        dispose();
        await turn();
      }
    }
    expect(out.slice(0, 10)).toEqual([]);
  }, 240_000);

  it('stands nothing taller than 1.0 on its right edge or its front edge, every stage', async () => {
    const out: string[] = [];
    for (const n of COUNTS) {
      const o = layoutOf(crowd(n).agents, 'workshop');
      const x1 = o.x0 + o.W;
      for (let stage = 0; stage <= LAST_STAGE; stage++) {
        const { meshes, dispose } = meshesOf(o, stage);
        for (const m of meshes) {
          const b = new Box3().setFromObject(m, true);
          // a piece stands on an edge when its middle does, on the stretches before the bims: the right edge in front of
          // main's desk, the front edge right of the left aisle (the corner plant past it and the grass behind main's desk
          // stand beside the room on the screen, never before a bim: the ray law above says so)
          const cx = (b.min.x + b.max.x) / 2;
          const cz = (b.min.z + b.max.z) / 2;
          const right = cx > x1 - EDGE && cx < x1 + EDGE && cz > o.mainDesk.z + MAIN_DEPTH && cz < o.D;
          const front = cz > o.D - EDGE && cz < o.D + EDGE && cx > (o as Office & { aisle: number }).aisle && cx < x1;
          const onEdge = right || front;
          if (onEdge && b.max.y > LOW) out.push(`${String(n)} desks, stage ${String(stage)}: ${m.name || m.type} up to ${b.max.y.toFixed(2)} at (${((b.min.x + b.max.x) / 2).toFixed(2)},${((b.min.z + b.max.z) / 2).toFixed(2)})`);
        }
        dispose();
        await turn();
      }
    }
    expect(out.slice(0, 10)).toEqual([]);
  }, 240_000);
});
