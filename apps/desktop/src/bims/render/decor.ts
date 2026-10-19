// Where the office's decor stands (pure): the plants, the parasol, the palm, the mini ramp, the door
// mat, the trees and flowers on the grass. The furniture bims sit at (desks, main's desk, the island,
// bean bags, deck chairs) is the plan's Office.furniture; decor stays off its walk network (decor.test.ts
// walks paths.ts network() past every footprint). The terrace slab's box (terraceSlab, what every
// look draws) and where the town's dirt path meets the office (pathEnd).
import type { Box, MapId, Office, Pt } from '../model';

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

/** the maps whose looks draw render/maps/yard.ts's terrace: round the deck chairs, not the whole front */
const YARD_TERRACE: ReadonlySet<MapId> = new Set(['patio', 'haveli', 'tropical', 'cyclades', 'sahel']);

/**
 * The terrace slab's floor box (from stage 1; the looks draw this box: stages.ts and blook.ts the
 * whole front, yard.ts round the deck chairs, California's on the room's left). Pure.
 */
export function terraceSlab(o: Office): Box {
  if (o.map === 'california') return { x0: o.x0 + 0.4, x1: o.x0 + 5.2, z0: o.D + 0.3, z1: o.D + 4.4 };
  if (YARD_TERRACE.has(o.map)) {
    const xs = o.terrace.map((t) => t.x);
    const zs = o.terrace.map((t) => t.z);
    return { x0: Math.min(...xs) - 0.8, x1: Math.max(...xs) + 0.8, z0: o.D + 0.15, z1: Math.max(...zs) + 0.8 };
  }
  const t = decorOf(o).terrace;
  return { x0: t.x - t.hw, x1: t.x + t.hw, z0: t.z - t.hd, z1: t.z + t.hd };
}

/** the dirt path's half width in the town, and its apron's (bims m_32735: it widens ~1.5x where it arrives) */
export const PATH_HALF = 0.5;
export const APRON_HALF = 0.75;
/** how deep the apron is, along the path */
export const APRON_D = 0.6;

/**
 * Where the town's dirt path meets the office (bims m_32735): at the door's x, the terrace's front
 * edge once the terrace is built (stage 1) and the apron fits on it, else the floor's front edge
 * (the door is beside the terrace on some maps). Every map's door is on the front (z = D + 0.2,
 * facing the back); the path runs +z from here. Pure.
 */
export function pathEnd(o: Office, stage: number): Pt {
  const x = o.door.x;
  const t = terraceSlab(o);
  const onTerrace = stage >= 1 && x - APRON_HALF >= t.x0 && x + APRON_HALF <= t.x1;
  return { x, z: onTerrace ? t.z1 : o.D };
}
