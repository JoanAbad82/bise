// Where the office's decor stands (pure): the plants, the parasol, the palm, the mini ramp, the door
// mat, the trees and flowers on the grass. The furniture bims sit at (desks, main's desk, the island,
// bean bags, deck chairs) is the plan's Office.furniture; decor stays off its walk network (decor.test.ts
// walks paths.ts network() past every footprint).
import type { Office } from '../model';

/** a thing's floor footprint: its centre and half sizes */
export interface Foot {
  readonly x: number;
  readonly z: number;
  readonly hw: number;
  readonly hd: number;
}

export interface Decor {
  readonly plants: readonly Foot[];
  readonly parasol: Foot;
  readonly palm: Foot;
  readonly ramp: Foot;
  /** flat on the floor at the door: walked on, not around */
  readonly doorMat: Foot;
  /** on the grass, off the floor and the terrace */
  readonly trees: readonly Foot[];
  readonly terrace: Foot;
}

export function decorOf(o: Office): Decor {
  const { x0, W, D } = o;
  const x1 = x0 + W;
  return {
    plants: [
      { x: x0 + 0.3, z: D - 0.22, hw: 0.2, hd: 0.2 },
      { x: x1 - 0.35, z: 3.5, hw: 0.2, hd: 0.2 },
    ],
    parasol: { x: x1 - 1.4, z: D + 1.9, hw: 0.05, hd: 0.05 },
    palm: { x: x1 - 0.5, z: D + 3.5, hw: 0.1, hd: 0.1 },
    ramp: { x: x1 - 2.0, z: D + 3.6, hw: 0.6, hd: 0.35 },
    doorMat: { x: o.door.x, z: D - 0.15, hw: 0.55, hd: 0.25 },
    trees: [
      { x: x0 - 0.7, z: 1.0, hw: 0.18, hd: 0.18 },
      { x: x0 - 0.7, z: D * 0.45, hw: 0.18, hd: 0.18 },
      { x: x0 - 0.7, z: D * 0.85, hw: 0.18, hd: 0.18 },
      { x: x0 + W * 0.3, z: -0.85, hw: 0.18, hd: 0.18 },
      { x: x0 + W * 0.75, z: -0.85, hw: 0.18, hd: 0.18 },
    ],
    // the terrace slab: from the floor's front edge past the last row of deck chairs
    terrace: { x: x0 + W / 2, z: D + 2.35, hw: W / 2 - 0.2, hd: 2.15 },
  };
}
