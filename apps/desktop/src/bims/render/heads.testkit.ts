// The checks' heads (standing.test.ts, shade.test.ts, nap.test.ts, clip.test.ts): the box of a bim's
// head (bim.ts's head group, posed by pose.ts) standing or seated at a point, facing a way. The view
// laws (is the head seen, nothing over it on the screen) measure the head and its hair without what is
// worn on it (a cap, a beanie, a headset: architect m_43105); the laws on what may poke through a bed
// or a wall keep the whole bim. Tests only.
import { Box3, Mesh, type Object3D } from 'three';
import type { Pose, Pt, Spot } from '../model';
import { makeBim } from './bim';
import { HEAD_Y } from './laptop';
import { rigOf } from './pose';
import { STYLE } from './style';

/** what a head may graze (float noise, a hat's edge) */
export const SLACK = 0.02;

/**
 * The box of what a posed head group draws, world units: its shown meshes (a hidden one hides nothing),
 * without its headwear unless `wear` (bim.ts tags it userData.wear; an unmerged bim keeps the tags).
 */
export function headBoxOf(head: Object3D, o: { readonly wear: boolean }): Box3 {
  const box = new Box3();
  const shown = (m: Object3D): boolean => {
    for (let p: Object3D | null = m; p; p = p.parent) if (!p.visible) return false;
    return true;
  };
  head.traverse((m) => {
    if (!(m instanceof Mesh) || !shown(m)) return;
    if (!o.wear && m.userData.wear === true) return;
    box.union(new Box3().setFromObject(m, true));
  });
  return box;
}

/** the head's box without its headwear, world units: standing (a visitor's pose) or seated at its desk (typing), main's 1.18 times bigger */
export function headBox(p: Pt, face: number, main: boolean, seated: boolean): Box3 {
  const bim = makeBim(main ? 'main' : 'agent-1', main, STYLE, undefined, undefined, false);
  const spot: Spot = { x: p.x, z: p.z, wz: p.z, ax: p.x, face };
  const act = seated ? ({ k: main ? 'main' : 'work', at: main ? 'main' : 'desk' } as const) : ({ k: 'visit', at: 'desk' } as const);
  const pose: Pose = {
    x: p.x, z: p.z, dir: face, moving: false, since: 30,
    seg: { t: 0, act, sig: act.k, spot, path: { pts: [spot], seg: [], len: 0 }, speed: 2.4, from: null },
  };
  bim.apply(rigOf({ pose, t: 30, main, phase: 1.3, reduced: false }));
  bim.group.updateMatrixWorld(true);
  let head: Object3D | undefined;
  bim.group.traverse((o) => { if (!head && o.children.length > 0 && Math.abs(o.position.y - HEAD_Y) < 1e-6) head = o; });
  if (!head) throw new Error('no head group');
  const box = headBoxOf(head, { wear: false }).expandByScalar(-SLACK);
  bim.dispose();
  return box;
}
