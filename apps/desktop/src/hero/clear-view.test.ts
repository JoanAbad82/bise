// @vitest-environment happy-dom
// kiln's main is seen whole in every shot it acts in (Gabriel via main m_31852: it stood hidden behind
// the workshop's roller door frame). The film's camera is the app's one isometric direction (only its
// zoom and its aim move), so the law is one ray each: from main's head and its body at its desk, toward
// the camera, through kiln's world as world.ts builds it with what the film drops (TownOpts.clearView).
import { describe, expect, it } from 'vitest';
import { Mesh, Raycaster, Vector3, type Object3D } from 'three';
import { growOf } from '../bims/growth';
import { layoutOf } from '../bims/maps';
import { BACK } from '../bims/render/camera';
import { HEAD_Y } from '../bims/render/laptop';
import { lookOf } from '../bims/render/maps';
import { STYLE } from '../bims/render/style';
import { buildWorld } from '../bims/render/world';
import { CAST, KILN } from './cast';
import { growthOf, rowsAt } from './world';

/** main's head and its chest, seated at its desk, world units */
const MARKS = [
  { what: 'head', y: HEAD_Y },
  { what: 'body', y: 0.55 },
] as const;

describe("kiln's main", () => {
  it('is seen head and body from the camera once the film drops what its map tags as in the way', () => {
    const c = CAST.find((x) => x.id === KILN);
    if (!c) throw new Error('no kiln');
    const o = layoutOf(rowsAt(c, 0).agents, c.map);
    const w = buildWorld(o, 'main', STYLE, lookOf(o.map), false, growOf(growthOf(c)));
    w.root.updateMatrixWorld(true);
    const tagged: Object3D[] = [];
    const meshes: Mesh[] = [];
    w.root.traverse((m) => {
      if (m.userData.occludes === true) tagged.push(m);
      else if (m instanceof Mesh) meshes.push(m);
    });
    // the door's frame is tagged: without it, nothing would stand in the way to drop
    expect(tagged.length).toBeGreaterThan(0);
    const dir = new Vector3(BACK.x, BACK.y, BACK.z).normalize();
    const blocked: string[] = [];
    for (const m of MARKS) {
      const from = new Vector3(o.mainDesk.x, m.y, o.mainDesk.z);
      const ray = new Raycaster(from, dir, 0.05, 80);
      for (const h of ray.intersectObjects(meshes, false)) blocked.push(`${m.what}: ${h.object.name || h.object.type} at ${h.point.toArray().map((v) => v.toFixed(2)).join(',')}`);
    }
    w.dispose();
    expect(blocked).toEqual([]);
  });
});
