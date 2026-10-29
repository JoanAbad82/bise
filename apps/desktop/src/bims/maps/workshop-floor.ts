// The workshop's free floor past its walls (Gabriel's pick C on page bims-workshop, bims' brief):
// the walls hold 18 desks at most, the next ones sit in pods of six in the middle (two rows of three
// back to back), and the floor gets one workshop corner per pod, plus one from 13 desks on. Every
// pod and every corner has a fixed place, from the left wall (x') and the back wall (z): a desk or a
// corner never moves when another desk comes or goes (the room grows round them). Where (x', z):
//   - pod row 0 right behind the workbench and the ping-pong table (zc 6.3), two pods (x' 11.7, 18.3);
//   - the front band in front of it (z 8.5..11.1, its lane at 11.5): the lounge, the band, the Vespa, the maker bench;
//   - pod row 1 in front of that band (its back walkway is the band's lane), row 2 4.6 further, ...;
//   - corners 4..6 (the lift, the racks, the motorbike) in the left bay of rows 0, 1, 2 (x' 2.8..7.5).
// Each corner is its pieces' floor boxes (what a walk never crosses) and its nooks, the places an
// idle bim hangs at (model.ts Nook: the sofa, the drum stool, the maker bench, the lift), each joined
// straight to its lane. render/maps/workshop-floor.ts draws them to these boxes. Pure. Owner: maps-b.
import type { Box, Nook, Pt } from '../model';
import { boxAt } from './plan';

/** the walls' desks at most (slots 0..17); the next slots go to pods */
export const WALL_MAX = 18;
/** desks a pod holds: two rows of 3 back to back */
export const POD_N = 6;
/** a pod desk's pitch along its row, a pod row's chair line off its middle, a pod's middle from the next one's */
const POD_PITCH = 1.8;
const POD_CHAIR = 0.9;
const POD_STEP = 6.6;
/** pod row 0's middle, the first pod's x', the next row 4.6 further to the front */
const ROW0 = 6.3;
const POD_X0 = 11.7;
const ROW_STEP = 4.6;
/** pods in a row: the room is 27.35 wide once it has pods (18 wall desks), main's queue stands past the second */
export const PODS_PER_ROW = 2;
/** a walkway behind each pod row's chairs, off the row's middle (the back desks': 0.8 behind their chairs) */
export const POD_WAY = 1.7;
/** the front band: its corners' middle, and its lane in front of them (pod row 1's back walkway) */
const BAND_Z = 9.8;
export const BAND_LANE = BAND_Z + POD_WAY;
/** the connector on the pods' right: from the back corridor to the front one, past the last pod's post */
export const LINK_X = 21.6;
/** a pod's beam posts and its plant, off its middle along x; the beam over the back row's desks (its shades never over a head on the screen: shade.test.ts) */
export const POD_POST = 2.8;
export const POD_BEAM_Z = -0.6;
export const POD_PLANT = 3.3;

export type CornerKind = 'lounge' | 'band' | 'maker' | 'lift' | 'racks' | 'moto';
/** the corners in the order they come (bims' brief) */
export const CORNERS: readonly CornerKind[] = ['lounge', 'band', 'maker', 'lift', 'racks', 'moto'];

/** A pod: its middle (x, zc); its desks are slots 18 + 6 p .. */
export interface Pod {
  readonly x: number;
  readonly z: number;
}

/** A corner on the floor: its middle, its pieces' floor boxes (a nook's own piece is `of` it), its nooks, the lane its nooks join. */
export interface Corner {
  readonly kind: CornerKind;
  readonly x: number;
  readonly z: number;
  readonly pieces: readonly Box[];
  readonly nooks: readonly Nook[];
  readonly lane: number;
}

/** A pod desk's slot place: its pod, its column (-1, 0, 1), its row (0: back, facing the front; 1: front, facing the back). */
export function podPlace(slot: number): { pod: number; col: number; row: 0 | 1 } {
  const i = slot - WALL_MAX;
  const j = i % POD_N;
  return { pod: Math.floor(i / POD_N), col: (j % 3) - 1, row: j < 3 ? 0 : 1 };
}

/** pod row r's middle z */
export const rowZ = (r: number): number => (r === 0 ? ROW0 : BAND_LANE + POD_WAY + (r - 1) * ROW_STEP);

/** pod p's middle, x' from the left wall */
export function podAt(p: number): Pod {
  return { x: POD_X0 + (p % PODS_PER_ROW) * POD_STEP, z: rowZ(Math.floor(p / PODS_PER_ROW)) };
}

/** a pod desk's spot (x' from the left wall) and its floor box: the back row faces the front (face 0), the front row the back */
export function podDesk(slot: number): { x: number; z: number; wz: number; face: number; box: Box } {
  const { pod, col, row } = podPlace(slot);
  const c = podAt(pod);
  const x = c.x + col * POD_PITCH;
  const back = row === 0;
  const z = back ? c.z - POD_CHAIR : c.z + POD_CHAIR;
  return { x, z, wz: back ? c.z - POD_WAY : c.z + POD_WAY, face: back ? 0 : Math.PI, box: boxAt(x, back ? c.z - 0.4 : c.z + 0.4, 1.6, 0.78) };
}

/** a pod's own pieces past its desks: its two beam posts' base plates, its plant at its left end */
export function podPieces(c: Pod): Box[] {
  return [boxAt(c.x - POD_POST, c.z + POD_BEAM_Z, 0.3, 0.3), boxAt(c.x + POD_POST, c.z + POD_BEAM_Z, 0.3, 0.3), boxAt(c.x - POD_PLANT, c.z, 0.56, 0.56)];
}

/** pods for `cap` desk slots */
export const podsOf = (cap: number): number => Math.max(0, Math.ceil((cap - WALL_MAX) / POD_N));
/** corners for `cap` desk slots: one per pod, plus one from 13 desks on */
export const cornersOf = (cap: number): number => Math.min(CORNERS.length, cap >= 13 ? 1 + podsOf(cap) : 0);

// ---- each corner in its own frame: x across, z towards the front (its lane), its middle at 0

interface Local {
  readonly pieces: readonly (readonly [number, number, number, number])[];
  /** x, z, face, sit, the piece it sits in (its index) */
  readonly nooks: readonly (readonly [number, number, number, boolean, number?])[];
}

/**
 * The pieces (x0, x1, z0, z1) and the nooks of each corner, as render/maps/workshop-floor.ts
 * draws them. Every nook's way runs straight to the lane (+z), 0.25 at least off every other piece.
 */
export const LOCAL: Readonly<Record<CornerKind, Local>> = {
  // the sofa's two halves (a nook each), two armchairs, the cable-reel table, the floor lamp, the plant
  lounge: {
    pieces: [[-1.27, 0, -1.33, -0.42], [0, 1.27, -1.33, -0.42], [-1.93, -1.17, -0.03, 0.73], [1.17, 1.93, -0.03, 0.73], [-0.4, 0.4, -0.05, 0.75], [1.55, 1.95, -1.3, -0.9], [-2.25, -1.55, -1.3, -0.6]],
    nooks: [[-0.65, -0.75, 0, true, 0], [0.65, -0.75, 0, true, 1]],
  },
  // the drum kit, its stool (the drummer's nook, facing the kit), the amp, the guitar on its stand, the mic
  band: {
    pieces: [[-1.3, 0.65, -1.0, 0.15], [-0.52, -0.08, 0.28, 0.72], [0.7, 1.3, -0.75, -0.35], [0.75, 1.15, 0.2, 0.6], [0.13, 0.37, 0.73, 0.97]],
    nooks: [[-0.3, 0.5, Math.PI, true, 1]],
  },
  // the bench with its three printers, the drill press, a stool; two bims stand at the bench
  maker: {
    pieces: [[-1.9, 1.1, -0.85, 0.05], [1.45, 1.95, -0.65, -0.15], [-1.4, -1.0, 0.25, 0.65]],
    nooks: [[-0.4, 0.5, Math.PI, false], [0.6, 0.5, Math.PI, false]],
  },
  // the two-post lift with the old car up (its posts either side of it), the tool chest; two bims stand in front of it
  lift: {
    pieces: [[-2.0, 1.0, -0.92, 0.92], [1.5, 2.1, -0.35, 0.17]],
    nooks: [[-1.2, 1.3, Math.PI, false], [0.2, 1.3, Math.PI, false]],
  },
  // the pallet rack, a pallet of boxes, the hand truck
  racks: {
    pieces: [[-1.7, 1.7, -1.0, -0.3], [-0.1, 1.1, 0.0, 1.0], [-1.45, -0.95, 0.2, 0.75]],
    nooks: [],
  },
  // the motorbike on its stand, a stack of tyres, a plant
  moto: {
    pieces: [[-1.1, 1.0, -0.4, 0.4], [1.24, 1.96, -0.36, 0.36], [-2.0, -1.2, -0.4, 0.4]],
    nooks: [],
  },
};

/** where corner i stands (x' from the left wall, z): 0..2 on the front band, then the left bay of pod rows 0, 1, 2 */
export function cornerAt(i: number): { x: number; z: number; lane: number } {
  if (i < 3) return { x: [4.9, 9.6, 16.4][i] ?? 4.9, z: BAND_Z, lane: BAND_LANE };
  const z = rowZ(i - 3);
  return { x: 5.15, z, lane: z + POD_WAY };
}

/** the Vespa's place on the front band once the room has corners (between the band and the maker bench) */
export const VESPA_AT: Pt = { x: 12.6, z: BAND_Z };
/** its floor box's half size: ~1.7 long turned 45° (side on to the camera, render/maps/workshop.ts vespa), ~0.78 each way */
export const VESPA_HALF = 0.8;

/** corner i in a room whose left wall is at x0 */
export function cornerOf(i: number, x0: number): Corner {
  const kind = CORNERS[i] ?? 'lounge';
  const at = cornerAt(i);
  const cx = x0 + at.x;
  const l = LOCAL[kind];
  const nookAt = l.nooks.map(([x, z, face, sit]): Pt & { face: number; sit: boolean } => ({ x: cx + x, z: at.z + z, face, sit }));
  const pieces = l.pieces.map(([a, b, c, d], j): Box => {
    const n = l.nooks.findIndex((q) => q[4] === j);
    const of = n >= 0 ? nookAt[n] : undefined;
    return { x0: cx + a, x1: cx + b, z0: at.z + c, z1: at.z + d, ...(of ? { of: { x: of.x, z: of.z } } : {}) };
  });
  const nooks = nookAt.map((p): Nook => ({ x: p.x, z: p.z, wz: at.lane, ax: p.x, face: p.face, sit: p.sit }));
  return { kind, x: cx, z: at.z, pieces, nooks, lane: at.lane };
}

/** how deep the room must be for these pods and corners: the band's lane, the last pod row's front walkway, each with room to the front corridor */
export function floorDepth(cap: number): number {
  const rows = Math.ceil(podsOf(cap) / PODS_PER_ROW);
  const band = cornersOf(cap) > 0 ? BAND_LANE + 1.4 : 0;
  const pods = rows > 1 ? rowZ(rows - 1) + POD_WAY + 1.1 : 0;
  return Math.max(band, pods);
}
