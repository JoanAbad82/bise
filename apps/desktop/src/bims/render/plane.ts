// His paper plane (q-planes, three): white paper folded in two wings, gliding down from above the
// canvas's top edge to the bim's hand at its desk in PLANE_FLIGHT seconds; then the bim holds it
// (pose.ts caught). The flight path is pure (flightAt); the mesh only follows it.
import { Group, Mesh, type Material } from 'three';
import { RIGHT, type V3 } from './camera';
import { WORLD } from './palette';
import { PLANE_FLIGHT } from './pose';
import type { Style } from './style';

/**
 * where the plane is s seconds into its flight: from `top` units above the hand, gliding in from the
 * left; `loop` (y1, 1 in 50): a looping in the middle of its way before it lands
 */
export function flightAt(hand: V3, top: number, s: number, loop = false): { p: V3; heading: V3; roll: number } {
  const f = Math.min(1, Math.max(0, s / PLANE_FLIGHT));
  // ease out: fast from the top, a soft landing in the hand
  const e = 1 - (1 - f) * (1 - f);
  const side = (1 - e) * 1.6;
  const wobble = Math.sin(f * Math.PI * 3) * 0.12 * (1 - f);
  const p = {
    x: hand.x - RIGHT.x * side + wobble,
    y: hand.y + top * (1 - e),
    z: hand.z - RIGHT.z * side,
  };
  const heading = { x: RIGHT.x * 1.6 * 2 * (1 - f), y: -top * 2 * (1 - f) - 0.01, z: RIGHT.z * 1.6 * 2 * (1 - f) };
  if (loop && f > 0.2 && f < 0.6) {
    // a circle in the view's plane: up, over and back down on its way
    const a = ((f - 0.2) / 0.4) * Math.PI * 2;
    const r = 0.45;
    return {
      p: { x: p.x + RIGHT.x * Math.sin(a) * r, y: p.y + (1 - Math.cos(a)) * r, z: p.z + RIGHT.z * Math.sin(a) * r },
      heading: { x: RIGHT.x * Math.cos(a), y: Math.sin(a), z: RIGHT.z * Math.cos(a) },
      roll: 0,
    };
  }
  return { p, heading, roll: Math.sin(f * Math.PI * 2) * 0.35 };
}

export interface Plane {
  readonly group: Group;
  dispose(): void;
}

export function makePlane(style: Style): Plane {
  const g = new Group();
  const paper: Material = style.material(WORLD.paper, { flat: true });
  const fold: Material = style.material(WORLD.paperShade, { flat: true });
  // its nose along +z: two wings in a shallow V, a keel under them
  const wingL = new Mesh(style.box(0.16, 0.012, 0.42), paper);
  wingL.position.set(-0.08, 0, 0);
  wingL.rotation.z = 0.25;
  const wingR = new Mesh(style.box(0.16, 0.012, 0.42), paper);
  wingR.position.set(0.08, 0, 0);
  wingR.rotation.z = -0.25;
  const keel = new Mesh(style.box(0.02, 0.07, 0.38), fold);
  keel.position.set(0, -0.035, -0.01);
  g.add(wingL, wingR, keel);
  g.scale.setScalar(1.3);
  return {
    group: g,
    dispose() {
      for (const m of [wingL, wingR, keel]) m.geometry.dispose();
      paper.dispose();
      fold.dispose();
    },
  };
}
