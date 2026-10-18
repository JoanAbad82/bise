// The workshop (page bims-maps v4 « atelier »; its look: render/maps/workshop.ts): a garage sized
// from its desks (two of three against the back wall, the third against the left one, each facing
// its wall; the walls just past the last ones, bims m_28835), the workbench (the eating place, its
// places along both long sides) and a ping-pong table right behind the back desks' chairs, the
// roller door rolled up on the right wall, the nap place by it at the front right. Main's desk stands free at the right, its
// queue on its left, the board on the back wall above it. Its walk graph: the back corridor along the
// back desks' chairs, the left aisle along the left desks' chairs, the workbench's two sides, the
// front corridor to the nap place and the door (front left). Pure. Owner: maps-b.
import type { Agent } from '@/proto';
import type { Box, Leg, Office, Pt, Spot } from '../model';
import type { CozyHints } from '../cozy';
import { type BOffice, LOFT_LIKE, QUEUE_N, type Way, corridor, keepSlots, outside, queueMoreOf, walksOf } from './bplan';
import { type Plan, boxAt } from './plan';

export interface WorkshopOffice extends BOffice {
  /** the ping-pong table's floor box */
  readonly pingpong: Box;
  /** the left aisle's x, the front corridor's z */
  readonly aisle: number;
  readonly crossFront: number;
}

/** the back corridor (behind the back desks' chairs), a desk's pitch along its wall */
const BACK = 1.9;
const PITCH = 1.8;
const CHAIR = 1.1;

/** slot s: two of every three against the back wall (index on it), the third against the left wall */
const wallOf = (s: number): { back: boolean; i: number } =>
  s % 3 === 2 ? { back: false, i: Math.floor(s / 3) } : { back: true, i: Math.floor(s / 3) * 2 + (s % 3) };

export function workshopLayout(agents: readonly Agent[], prev?: WorkshopOffice): WorkshopOffice {
  const { names, slots, used } = keepSlots(agents, prev?.slots);
  const cap = Math.max(6, used, prev?.cap ?? 0);
  const nLeft = Math.floor(cap / 3);
  const nBack = cap - nLeft;
  // the walls just past the last desks: the back one's, then main's corner (its queue, its desk); the left one's, then the nap place
  const W = Math.max(12.5, (nBack - 1) * PITCH + 7.55);
  const D = Math.max(8.6, nLeft * PITCH + 3.3);
  const x0 = -W / 2;
  const x1 = x0 + W;
  const aisle = x0 + 1.9;
  const crossFront = D - 0.5;

  const ways: Way[] = [];
  const furniture: Box[] = [];

  // each desk faces its wall: the back wall's from the back corridor, the left wall's from the aisle
  const desks = new Map<string, Spot>();
  for (const name of names) {
    const w = wallOf(slots.get(name) ?? 0);
    let s: Spot;
    if (w.back) {
      const x = x0 + 3.2 + w.i * PITCH;
      s = { x, z: CHAIR, wz: BACK, ax: x, face: Math.PI };
      furniture.push(boxAt(x, CHAIR - 0.5, 1.6, 0.78));
    } else {
      const z = 3.0 + w.i * PITCH;
      s = { x: x0 + CHAIR, z, wz: z, ax: aisle, face: -Math.PI / 2 };
      furniture.push(boxAt(x0 + CHAIR - 0.5, z, 0.78, 1.6));
    }
    desks.set(name, s);
    ways.push({ s });
  }

  // main's desk free at the right, its queue on its left (down from the back corridor), the board on the back wall
  const mx = x1 - 1.8;
  const qx = x1 - 3.25;
  const mainDesk: Spot = { x: mx, z: 3.0, wz: 3.0, ax: qx, face: 0 };
  furniture.push(boxAt(mx, 3.6, 2.3, 1.0));
  ways.push({ s: mainDesk });
  const queue: Spot[] = [];
  for (let i = 0; i < QUEUE_N; i++) queue.push({ x: qx, z: 2.6 + i * 0.5, wz: BACK, ax: qx, face: Math.PI / 2 });
  for (const s of queue) ways.push({ s });
  const boardX = x1 - 1.6;
  const boardSpots = [-0.45, 0.45, 0].map((d) => ({ x: boardX + d, z: 0.75, wz: BACK, ax: boardX + d, face: Math.PI }));
  for (const s of boardSpots) ways.push({ s });

  // right behind the back desks' chairs: the workbench (its places on both long sides), the ping-pong table beside it
  const bx = aisle + 1.9;
  const bz = BACK + 1.45;
  const island = boxAt(bx, bz, 2.6, 0.9);
  furniture.push(island);
  const islandSpots: Spot[] = [];
  for (const o of [-1.1, -0.35, 0.4, 1.15]) {
    islandSpots.push({ x: bx + o, z: bz - 0.75, wz: bz - 0.75, ax: bx + o, face: 0 });
    islandSpots.push({ x: bx + o, z: bz + 0.75, wz: bz + 0.75, ax: bx + o, face: Math.PI });
  }
  const pingpong = boxAt(bx + 3.4, bz, 2.6, 1.5);
  furniture.push(pingpong);

  // the nap place at the front right, by the roller door: 2 rows of 4, lanes down to the front corridor
  const lounge: Spot[] = [];
  for (let i = 0; i < 8; i++) {
    const j = i % 4;
    const x = x1 - 3.9 + j * 0.95;
    const z = D - 3.0 + Math.floor(i / 4) * 1.05;
    const s = { x, z, wz: z, ax: j < 3 ? x + 0.475 : x - 0.475, face: 0 };
    lounge.push(s);
    furniture.push(boxAt(x, z - 0.05, 0.62, 0.62, s));
    ways.push({ s, to: { x: s.ax, z: crossFront } });
  }

  const out = outside(x0, D, aisle, crossFront);
  ways.push(...out.ways);
  furniture.push(...out.furniture);

  const backLeg = corridor(BACK, [...ways, ...boardSpots.map((s) => ({ s, to: { x: s.x, z: BACK } }))], [aisle, qx, ...[...desks.values()].filter((d) => d.wz === BACK).map((d) => d.x)]);
  const sides: Leg[] = [bz - 0.75, bz + 0.75].map((z) => [{ x: aisle, z }, { x: bx + 1.15, z }] as const);
  const trunk: Leg[] = [
    backLeg,
    ...out.trunk,
    [{ x: aisle, z: BACK }, { x: aisle, z: crossFront }],
    corridor(crossFront, ways, [aisle]),
    [{ x: qx, z: BACK }, { x: qx, z: 2.6 + (QUEUE_N - 1) * 0.5 }],
    ...sides,
  ];
  const walks = walksOf(trunk, ways);

  return {
    map: 'workshop',
    size: `walls${String(cap)}`,
    W, D, x0, island,
    desks, mainDesk, islandSpots, lounge, boardSpots, queue, door: out.door, terrace: out.terrace, exit: out.exit,
    walks, furniture,
    queueMore: queueMoreOf(queue, mainDesk, backLeg, x0),
    slots, cap, crossBack: BACK,
    pingpong, aisle, crossFront,
  };
}

/** where its look puts the loft's pieces past the common ones (render/maps/workshop.ts loftGrower: the arcade by the left wall, the nap place's middle): nothing cozy there */
const workshopPieces = (o: Office): Pt[] => [{ x: o.x0 + 0.5, z: 1.2 }, { x: o.x0 + o.W - 2.5, z: o.D - 2.5 }];

/** its look's walls (render/maps/workshop.ts): the tall back one, its left part taken (the mural, the frames, the pegboard, the board); the roller door and its scooter along the right one */
const workshopCozy: CozyHints = {
  pieces: workshopPieces,
  walls: (o) => {
    const bx = o.boardSpots.reduce((s, p) => s + p.x, 0) / Math.max(1, o.boardSpots.length);
    return [{ wall: 'back', top: 2.1, busy: [[o.x0, bx + 1.0], [o.mainDesk.x - 0.6, o.mainDesk.x + 0.6]] }, { wall: 'left', top: 1.0 }, { wall: 'right', top: 0 }];
  },
  keepOut: (o) => {
    const out: Box[] = [{ x0: o.x0 + o.W - 0.8, x1: o.x0 + o.W, z0: 4.1, z1: o.D }];
    // the old car in the front middle and its tyres (render/maps/workshop.ts shell)
    const bx = (o.island.x0 + o.island.x1) / 2;
    const bz = (o.island.z0 + o.island.z1) / 2;
    const free0 = bx + 1.6;
    const free1 = o.x0 + o.W - 4.6;
    const cz = (bz + 0.75 + o.D - 0.5) / 2;
    if (free1 - free0 > 2.6) out.push({ x0: free0 - 0.2, x1: free1 + 0.3, z0: cz - 0.8, z1: cz + 0.8 });
    return out;
  },
};

export const workshop: Plan<WorkshopOffice> = { id: 'workshop', ready: true, layout: workshopLayout, things: LOFT_LIKE, cozy: workshopCozy };
