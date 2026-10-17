// The patio map (Mexico, a house round a patio; page bims-maps v5; its look: render/maps/patio.ts).
// Barragán's free-standing colour walls stand in the patio, each the backdrop of a team of three
// desks, the walls in two columns, the right one a step lower (never a grid). Behind each wall's
// desks, a walkway out to the aisles (left, middle, right). In front: the long sobremesa table
// with its stools (the eating place) and the water trough. The back zone: hammocks on the left,
// the slate, main's desk on the right. Pure numbers, in floor tiles. Owner: maps-c.
import type { Agent } from '@/proto';
import type { Box, Leg, Office, Spot } from '../model';
import { type Plan, boxAt, deskNames } from './plan';
import { CROSS_BACK, backZone, frontZone, keepSlots, slotsUsed, walksOf } from './yard';

/** a colour wall: its middle, its width, its colour's index; its desks stand in front of it */
export interface Slab {
  readonly x: number;
  readonly z: number;
  readonly w: number;
  readonly c: number;
}

export interface PatioOffice extends Office {
  readonly rows: number;
  readonly slabs: readonly Slab[];
  /** the water trough's box, beside the long table */
  readonly trough: Box;
  /** the three aisles' x */
  readonly aisles: readonly [number, number, number];
}

const W = 14.4;
const X0 = -W / 2;
const AISLES = [X0 + 0.6, 0, X0 + W - 0.6] as const;
const COL = [-3.5, 3.5] as const;
const PER = 3;
const PITCH = 1.6;
const ROW = 2.7;
const STEP = 1.1;
const Z0 = 4.7;
const SLAB_W = 5.0;

const slabZ = (k: number): number => Z0 + Math.floor(k / 2) * ROW + (k % 2) * STEP;
const slabX = (k: number): number => COL[k % 2] ?? 0;

/** a slot's chair: slab floor(i/3), the i%3th desk from its left, in front of its wall */
function chairAt(i: number): { x: number; z: number } {
  const k = Math.floor(i / PER);
  return { x: slabX(k) + ((i % PER) - 1) * PITCH, z: slabZ(k) + 1.05 };
}

export function patioLayout(agents: readonly Agent[], prev?: PatioOffice): PatioOffice {
  const others = deskNames(agents);
  const slots = keepSlots(others, prev?.desks, chairAt);
  const rows = Math.max(1, Math.ceil(Math.ceil(slotsUsed(slots) / PER) / 2), prev?.rows ?? 0);
  const [aL, aM, aR] = AISLES;

  const desks = new Map<string, Spot>();
  const furniture: Box[] = [];
  for (const name of others) {
    const i = slots.get(name) ?? 0;
    const k = Math.floor(i / PER);
    const j = i % PER;
    const c = chairAt(i);
    const ax = k % 2 === 0 ? (j === 0 ? aL : aM) : j === PER - 1 ? aR : aM;
    desks.set(name, { x: c.x, z: c.z, wz: slabZ(k) + 0.5, ax, face: 0 });
    furniture.push(boxAt(c.x, c.z + 0.5, 1.4, 0.76));
  }
  const slabs: Slab[] = [];
  for (let k = 0; k < rows * 2; k++) {
    slabs.push({ x: slabX(k), z: slabZ(k), w: SLAB_W, c: k % 5 });
    furniture.push(boxAt(slabX(k), slabZ(k), SLAB_W, 0.24));
  }

  // the long table in front of the left column, its stools both sides; the trough on the right
  const deskEnd = slabZ(rows * 2 - 1) + 1.05 + 0.89;
  const tz = deskEnd + 1.35;
  const island = boxAt(COL[0], tz, 4.4, 0.9);
  const trough = boxAt(COL[1], tz, 4.2, 0.7);
  furniture.push(island, trough);
  const islandSpots: Spot[] = [];
  for (const side of [-1, 1]) {
    for (const d of [-1.5, -0.5, 0.5, 1.5]) {
      const z = tz + side * 0.8;
      islandSpots.push({ x: COL[0] + d, z, wz: z, ax: aM, face: side < 0 ? 0 : Math.PI });
    }
  }
  const crossFront = tz + 1.55;
  const D = crossFront + 0.5;

  const back = backZone({ x0: X0, W, main: 'right', bed: [0.6, 0.9], reach: AISLES });
  const front = frontZone({ x0: X0, W, D, doorX: aM, terraceU: 1.0, out: 'left' });
  furniture.push(...back.furniture, ...front.furniture);

  const trunk: Leg[] = [
    back.corridor,
    [{ x: aL, z: crossFront }, { x: aR, z: crossFront }],
    ...AISLES.map((x): Leg => [{ x, z: CROSS_BACK }, { x, z: crossFront }]),
    ...front.legs,
  ];
  const base = {
    map: 'patio' as const,
    size: `patio-${String(rows)}`,
    W, D, x0: X0, island, desks, islandSpots,
    mainDesk: back.mainDesk, lounge: back.lounge, boardSpots: back.boardSpots, queue: back.queue,
    door: front.door, terrace: front.terrace, exit: front.exit, furniture,
  };
  return { ...base, walks: walksOf(base, trunk), queueMore: back.queueMore, rows, slabs, trough, aisles: AISLES };
}

export const patio: Plan<PatioOffice> = { id: 'patio', ready: true, layout: patioLayout };
