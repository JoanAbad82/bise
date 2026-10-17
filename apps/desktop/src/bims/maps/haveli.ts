// The haveli map (India, a Rajasthan courtyard house; page bims-maps v5; its look:
// render/maps/haveli.ts). A U of scalloped arcades round a sandstone courtyard: low desks under
// the arches on three sides (the left column turned to the yard, the back row facing it, the right
// column turned to it), the chai cart in the middle of the yard (the eating place), the door on
// the open front side in line with it. Walkways run behind each side's chairs, along the walls.
// The back zone: the jhoola and its cushions on the left, the slate, main's desk on the right.
// The room grows to the right and to the front (its left wall never moves). Owner: maps-c.
import type { Agent } from '@/proto';
import type { Box, Leg, Office, Spot } from '../model';
import { type Plan, boxAt, deskNames } from './plan';
import { BACK_D, CROSS_BACK, backZone, frontZone, keepSlots, slotsUsed, walksOf } from './yard';

export interface HaveliOffice extends Office {
  /** desks a side */
  readonly k: number;
  /** the courtyard under the arcades */
  readonly yard: Box;
  /** the arcades' columns, where the look stands them (off every walk) */
  readonly columns: readonly { readonly x: number; readonly z: number }[];
}

const X0 = -7.0;
const Z1 = 6.2;
const SIDE = 1.9;
const BACK = 1.7;
const BACK_X = X0 + 3.3;
const widthOf = (k: number): number => Math.max(12.6, 6.5 + (k - 1) * BACK);

/** a slot's chair and the way it faces: i%3 the side (left, back, right), floor(i/3) its place there */
function chairAt(i: number, W: number): Spot {
  const n = Math.floor(i / 3);
  const x1 = X0 + W;
  switch (i % 3) {
    case 0: return { x: X0 + 1.0, z: Z1 + n * SIDE, wz: Z1 + n * SIDE, ax: X0 + 0.45, face: Math.PI / 2 };
    case 1: return { x: BACK_X + n * BACK, z: BACK_D + 0.55, wz: CROSS_BACK, ax: BACK_X + n * BACK, face: 0 };
    default: return { x: x1 - 1.0, z: Z1 + n * SIDE, wz: Z1 + n * SIDE, ax: x1 - 0.45, face: -Math.PI / 2 };
  }
}

/** a desk's box, ahead of its chair the way it faces */
function deskBox(s: Spot): Box {
  if (s.face === 0) return boxAt(s.x, s.z + 0.5, 1.4, 0.76);
  return boxAt(s.x + Math.sign(Math.sin(s.face)) * 0.5, s.z, 0.76, 1.4);
}

export function haveliLayout(agents: readonly Agent[], prev?: HaveliOffice): HaveliOffice {
  const others = deskNames(agents);
  // the room's size from the slots kept: a desk of prev keeps its slot while the width holds
  const first = keepSlots(others, prev?.desks, (i) => chairAt(i, widthOf(prev?.k ?? 3)));
  const k = Math.max(3, Math.ceil(slotsUsed(first) / 3), prev?.k ?? 0);
  const W = widthOf(k);
  const slots = W === widthOf(prev?.k ?? 3) ? first : keepSlots(others, prev?.desks, (i) => chairAt(i, W));
  const x1 = X0 + W;

  const desks = new Map<string, Spot>();
  const furniture: Box[] = [];
  for (const name of others) {
    const s = chairAt(slots.get(name) ?? 0, W);
    desks.set(name, s);
    furniture.push(deskBox(s));
  }

  // the yard and its arcades: a column between each two desks, on each side
  const yz1 = Z1 + (k - 1) * SIDE + 0.7;
  const yard: Box = { x0: X0 + 2.4, x1: x1 - 2.4, z0: 6.0, z1: yz1 };
  const columns: { x: number; z: number }[] = [];
  for (let z = Z1 - SIDE / 2; z <= yz1 + 0.01; z += SIDE) columns.push({ x: X0 + 2.2, z }, { x: x1 - 2.2, z });
  for (let x = BACK_X - BACK / 2; x <= x1 - 2.2; x += BACK) columns.push({ x, z: 6.0 });
  for (const c of columns) furniture.push(boxAt(c.x, c.z, 0.24, 0.24));

  // the chai cart in the yard's middle, its spots in a row in front and one each side
  const cx = X0 + W / 2;
  const cz = (6.3 + yz1) / 2;
  const island = boxAt(cx, cz, 1.8, 0.9);
  furniture.push(island);
  const fz = cz + 1.0;
  const islandSpots: Spot[] = [
    ...[-1.05, -0.35, 0.35, 1.05].map((d) => ({ x: cx + d, z: fz, wz: fz, ax: cx, face: Math.PI })),
    { x: cx - 1.35, z: cz, wz: fz, ax: cx, face: Math.PI / 2 },
    { x: cx + 1.35, z: cz, wz: fz, ax: cx, face: -Math.PI / 2 },
  ];
  const D = yz1 + 1.6;
  const crossFront = D - 0.5;

  const walls = [X0 + 0.45, x1 - 0.45] as const;
  const back = backZone({ x0: X0, W, main: 'right', bed: [0.62, 0.62], reach: walls });
  const front = frontZone({ x0: X0, W, D, doorX: cx, terraceU: 1.0, out: 'left' });
  furniture.push(...back.furniture, ...front.furniture);

  const trunk: Leg[] = [
    back.corridor,
    [{ x: walls[0], z: crossFront }, { x: walls[1], z: crossFront }],
    ...walls.map((x): Leg => [{ x, z: CROSS_BACK }, { x, z: crossFront }]),
    [{ x: cx, z: fz }, { x: cx, z: crossFront }],
    ...front.legs,
  ];
  const base = {
    map: 'haveli' as const,
    size: `haveli-${String(k)}`,
    W, D, x0: X0, island, desks, islandSpots,
    mainDesk: back.mainDesk, lounge: back.lounge, boardSpots: back.boardSpots, queue: back.queue,
    door: front.door, terrace: front.terrace, exit: front.exit, furniture,
  };
  return { ...base, walks: walksOf(base, trunk), queueMore: back.queueMore, k, yard, columns };
}

export const haveli: Plan<HaveliOffice> = { id: 'haveli', ready: true, layout: haveliLayout };
