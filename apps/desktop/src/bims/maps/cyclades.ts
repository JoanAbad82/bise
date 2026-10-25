// The Cyclades map (Greece, an island's white houses; page bims-maps v5; its look:
// render/maps/cyclades.ts). Little whitewashed cubes, three desks each, open to the front and to
// the right, in two columns stepped and nudged so no two line up; behind each cube's chairs a
// walkway out its open side to a lane. On the right, the kafeneio under its reed pergola: two
// tables and their blue chairs (the eating place). The door between the two columns, the terrace on
// the left, the sea all round. Owner: maps-c.
import type { Agent } from '@/proto';
import type { Box, Leg, Office, Pt, Spot } from '../model';
import { type Plan, boxAt, deskNames } from './plan';
import { ROOM } from './room';
import { CROSS_BACK, backZone, frontZone, keepSlots, slotsUsed, walksOf } from './yard';

/** a cube: its middle (the desks' row), its width; the first one has the blue dome */
export interface Cube {
  readonly x: number;
  readonly z: number;
  readonly w: number;
}

export interface CycladesOffice extends Office {
  readonly rows: number;
  readonly cubes: readonly Cube[];
  /** the kafeneio's two tables, the pergola's posts */
  readonly tables: readonly Box[];
  readonly posts: readonly Pt[];
  readonly lanes: readonly [number, number, number];
}

const W = 16.4;
const X0 = -W / 2;
const PER = 3;
const PITCH = 1.5;
const CUBE_W = 4.8;
const LANES = [X0 + 6.45, X0 + 12.9, X0 + 16.0] as const;
const COL = [X0 + 3.3, X0 + 9.7] as const;

/** a cube's nudge: -0.3, 0 or 0.3 across, stable per cube */
const nudge = (k: number): number => (((k * 7 + 3) % 3) - 1) * 0.3;
const cubeX = (k: number): number => (COL[k % 2] ?? 0) + nudge(k);
const cubeZ = (k: number): number => 5.2 + Math.floor(k / 2) * 3.6 + (k % 2) * 1.3;

function chairAt(i: number): Pt {
  const k = Math.floor(i / PER);
  return { x: cubeX(k) + ((i % PER) - 1) * PITCH, z: cubeZ(k) + 0.45 };
}

export function cycladesLayout(agents: readonly Agent[], prev?: CycladesOffice): CycladesOffice {
  const others = deskNames(agents);
  const slots = keepSlots(others, prev?.desks, chairAt);
  const rows = Math.max(1, Math.ceil(Math.ceil(slotsUsed(slots) / PER) / 2), prev?.rows ?? 0);
  const [r0, r1, r2] = LANES;

  const desks = new Map<string, Spot>();
  const furniture: Box[] = [];
  for (const name of others) {
    const i = slots.get(name) ?? 0;
    const k = Math.floor(i / PER);
    const c = chairAt(i);
    desks.set(name, { x: c.x, z: c.z, wz: cubeZ(k) - 0.1, ax: k % 2 === 0 ? r0 : r1, face: 0 });
    furniture.push(boxAt(c.x, c.z + 0.5, 1.3, 0.76));
  }
  const cubes: Cube[] = [];
  for (let k = 0; k < rows * 2; k++) {
    const x = cubeX(k);
    const z = cubeZ(k);
    cubes.push({ x, z, w: CUBE_W });
    furniture.push(boxAt(x, z - 0.55, CUBE_W + 0.1, 0.22), boxAt(x - CUBE_W / 2 - 0.05, z + 0.65, 0.22, 2.4));
  }

  // the kafeneio: two tables under the pergola, a chair each side, one behind the first, one before the second
  const px = X0 + 14.6;
  const pz = 4.8;
  const tables = [boxAt(px, pz + 1.0, 0.9, 0.9), boxAt(px, pz + 2.6, 0.9, 0.9)];
  const posts: Pt[] = [{ x: px - 1.1, z: pz - 0.2 }, { x: px + 1.1, z: pz - 0.2 }, { x: px - 1.1, z: pz + 3.9 }, { x: px + 1.1, z: pz + 3.9 }];
  furniture.push(...tables, ...posts.map((p) => boxAt(p.x, p.z, 0.16, 0.16)));
  const islandSpots: Spot[] = [];
  for (const tz of [pz + 1.0, pz + 2.6]) {
    islandSpots.push({ x: px - 0.75, z: tz, wz: tz, ax: r1, face: Math.PI / 2 }, { x: px + 0.75, z: tz, wz: tz, ax: r2, face: -Math.PI / 2 });
  }
  islandSpots.push({ x: px, z: pz + 0.25, wz: pz + 0.25, ax: r1, face: 0 }, { x: px, z: pz + 3.35, wz: pz + 3.35, ax: r1, face: Math.PI });
  const island = tables[1] as Box;

  const crossFront = Math.max(cubeZ(rows * 2 - 1) + 0.45 + 0.89 + 1.3, pz + 4.6);
  const D = crossFront + 0.5;
  const back = backZone({ x0: X0, W, main: 'right', reach: LANES });
  const front = frontZone({ x0: X0, W, D, doorX: r0, terraceU: 1.0, out: 'left' });
  furniture.push(...back.furniture, ...front.furniture);

  const trunk: Leg[] = [
    back.corridor,
    [{ x: r0, z: crossFront }, { x: r2, z: crossFront }],
    ...LANES.map((x): Leg => [{ x, z: CROSS_BACK }, { x, z: crossFront }]),
    ...front.legs,
  ];
  const base = {
    map: 'cyclades' as const,
    size: `cyclades-${String(rows)}`,
    W, D, x0: X0, island, desks, islandSpots,
    mainDesk: back.mainDesk, lounge: back.lounge, boardSpots: back.boardSpots, queue: back.queue,
    door: front.door, terrace: front.terrace, exit: front.exit, furniture,
  };
  return { ...base, walks: walksOf(base, trunk), queueMore: back.queueMore, rows, cubes, tables, posts, lanes: LANES };
}

/** the first cube's dome on its back wall (render/maps/cyclades.ts cube): no floor lamp's shade under it */
const domeKeep = (o: Office): Box[] => {
  const c = (o as CycladesOffice).cubes[0];
  if (!c) return [];
  const x = c.x - c.w / 2 + 0.8;
  const z0 = c.z - 0.55;
  return [{ x0: x - 0.65, x1: x + 0.65, z0: z0 - 0.65, z1: z0 + 0.65 }];
};

export const cyclades: Plan<CycladesOffice> = { id: 'cyclades', ready: true, layout: cycladesLayout, cozy: { keepOut: domeKeep }, room: ROOM };
