// The workshop (page bims-maps v4 « atelier »; its look: render/maps/workshop.ts): a garage sized
// from its walls' desks (two of three against the back wall, the third against the left one, each
// facing its wall; the walls just past the last ones, bims m_28835; 18 at most), the workbench (the
// eating place, its places along both long sides) and a ping-pong table right behind the back desks'
// chairs, the roller door rolled up on the left wall's front stretch, the nap place at the front right. Main's
// desk stands free at the right, its queue on its left, the board on the back wall above it. Past 18
// desks the next ones sit in pods of six on the floor, and the floor gets its workshop corners (page
// bims-workshop, Gabriel's pick C: maps/workshop-floor.ts, each at a fixed place, the room grows round
// them). Its walk graph: the back corridor along the back desks' chairs, the left aisle along the
// left desks' chairs, the workbench's two sides, a walkway behind each pod row's chairs and the front
// band's lane (from the left aisle to the link on the pods' right), the front corridor to the nap
// place and the door (front left). Pure. Owner: maps-b.
import type { Agent } from '@/proto';
import type { Box, Leg, Nook, Office, Pt, Spot } from '../model';
import type { CozyHints } from '../cozy';
import { type BOffice, LOFT_LIKE, QUEUE_N, type Way, corridor, keepSlots, outside, queueMoreOf, walksOf } from './bplan';
import { NAP_BED, NAP_ROW, type Plan, boxAt, napBedAt } from './plan';
import { type Corner, LINK_X, type Pod, VESPA_AT, VESPA_HALF, WALL_MAX, cornerOf, cornersOf, floorDepth, podAt, podDesk, podPieces, podsOf } from './workshop-floor';

/** the nap place's columns: a bed (plan.ts NAP_BED) and a lane */
const NAP_STEP = 1.2;

export interface WorkshopOffice extends BOffice {
  /** the ping-pong table's floor box */
  readonly pingpong: Box;
  /** the left aisle's x, the front corridor's z */
  readonly aisle: number;
  readonly crossFront: number;
  /** the pods on the floor (their middles), every one the room's slots reach, its desks taken or not */
  readonly pods: readonly Pod[];
  /** the workshop corners on the floor, in the order they came (maps/workshop-floor.ts) */
  readonly corners: readonly Corner[];
  /** the Vespa's place (render/maps/workshop.ts vespa); null: no room for it */
  readonly vespa: Pt | null;
  /** the roller door's span along the left wall, its front stretch (render/maps/workshop.ts shell) */
  readonly roller: { readonly z0: number; readonly z1: number };
}

/**
 * the roller door on the left wall's front stretch, past the last left desk (its box's edge + 0.3)
 * or 3 deep, whichever is further front, to 0.3 short of the front: the far side from the camera,
 * so it hides nothing (on the right edge it stood before main's desk: Gabriel via main m_35959, bims m_35967)
 */
export function rollerOf(nLeft: number, D: number): { z0: number; z1: number } {
  const lastEdge = nLeft > 0 ? 3.0 + (nLeft - 1) * PITCH + 0.8 : 0;
  return { z0: Math.max(lastEdge + 0.3, D - 3.0), z1: D - 0.3 };
}

/** the scooter parked across the roller door, its nose out through it (render/maps/workshop.ts scooter) */
export const scooterAt = (o: { x0: number; roller: { z0: number; z1: number } }): Pt => ({ x: o.x0 + 0.65, z: (o.roller.z0 + o.roller.z1) / 2 });

/** the back corridor (behind the back desks' chairs), a desk's pitch along its wall */
const BACK = 1.9;
const PITCH = 1.8;
const CHAIR = 1.1;

/** slot s (< 18): two of every three against the back wall (index on it), the third against the left wall */
const wallOf = (s: number): { back: boolean; i: number } =>
  s % 3 === 2 ? { back: false, i: Math.floor(s / 3) } : { back: true, i: Math.floor(s / 3) * 2 + (s % 3) };

export function workshopLayout(agents: readonly Agent[], prev?: WorkshopOffice): WorkshopOffice {
  const { names, slots, used } = keepSlots(agents, prev?.slots);
  const cap = Math.max(6, used, prev?.cap ?? 0);
  // the walls hold 18 desks at most: the room's width and its walls' depth from them, then deeper for the floor's pods and corners
  const onWalls = Math.min(cap, WALL_MAX);
  const nLeft = Math.floor(onWalls / 3);
  const nBack = onWalls - nLeft;
  // the walls just past the last desks: the back one's, then main's corner (its queue, its desk); the left one's, then the nap place
  const W = Math.max(12.5, (nBack - 1) * PITCH + 7.55);
  const D = Math.max(8.6, nLeft * PITCH + 3.3, floorDepth(cap));
  const x0 = -W / 2;
  const x1 = x0 + W;
  const aisle = x0 + 1.9;
  const crossFront = D - 0.5;

  const ways: Way[] = [];
  const furniture: Box[] = [];
  /** the floor's walkways: z -> the rightmost x a desk or a nook joins it at */
  const lanes = new Map<number, number>();
  const lane = (z: number, x: number): void => { lanes.set(z, Math.max(lanes.get(z) ?? -Infinity, x)); };

  // each wall desk faces its wall: the back wall's from the back corridor, the left wall's from the aisle;
  // a pod desk faces its pod's middle, from the walkway behind its row
  const desks = new Map<string, Spot>();
  for (const name of names) {
    const slot = slots.get(name) ?? 0;
    let s: Spot;
    if (slot >= WALL_MAX) {
      const p = podDesk(slot);
      const x = x0 + p.x;
      s = { x, z: p.z, wz: p.wz, ax: x, face: p.face };
      furniture.push({ ...p.box, x0: x0 + p.box.x0, x1: x0 + p.box.x1 });
      lane(p.wz, x);
    } else {
      const w = wallOf(slot);
      if (w.back) {
        const x = x0 + 3.2 + w.i * PITCH;
        s = { x, z: CHAIR, wz: BACK, ax: x, face: Math.PI };
        furniture.push(boxAt(x, CHAIR - 0.5, 1.6, 0.78));
      } else {
        const z = 3.0 + w.i * PITCH;
        s = { x: x0 + CHAIR, z, wz: z, ax: aisle, face: -Math.PI / 2 };
        furniture.push(boxAt(x0 + CHAIR - 0.5, z, 0.78, 1.6));
      }
    }
    desks.set(name, s);
    ways.push({ s });
  }

  // the pods' beams and plants, and the corners: every one the room's slots reach (nothing goes when a desk leaves)
  const pods = Array.from({ length: podsOf(cap) }, (_, p): Pod => {
    const c = podAt(p);
    return { x: x0 + c.x, z: c.z };
  });
  for (const p of pods) furniture.push(...podPieces(p));
  const corners = Array.from({ length: cornersOf(cap) }, (_, i) => cornerOf(i, x0));
  const nooks: Nook[] = [];
  for (const c of corners) {
    furniture.push(...c.pieces);
    for (const n of c.nooks) {
      nooks.push(n);
      ways.push({ s: n });
      lane(n.wz, n.x);
    }
  }
  // with pods, every floor walkway runs on to the link on their right (from the back corridor to the front one)
  const link = pods.length > 0 ? x0 + LINK_X : null;
  if (link !== null) for (const z of [...lanes.keys()]) lane(z, link);

  // main's desk free at the right, its queue on its left (down from the back corridor), the board on the back wall
  const mx = x1 - 1.8;
  const qx = x1 - 3.25;
  const mainDesk: Spot = { x: mx, z: 3.0, wz: 3.0, ax: qx, face: 0 };
  furniture.push(boxAt(mx, 3.6, 2.3, 1.0));
  ways.push({ s: mainDesk });
  // the nap place's first row: its beds start here (below); the land queue stops short of them
  const napZ0 = D - 1.2 - NAP_ROW;
  const napFront = napZ0 - NAP_BED.back - NAP_BED.d / 2;
  const queue: Spot[] = [];
  for (let i = 0; i < QUEUE_N; i++) {
    const z = 2.6 + i * 0.5;
    if (i > 0 && z > napFront - 0.3) break;
    queue.push({ x: qx, z, wz: BACK, ax: qx, face: Math.PI / 2 });
  }
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
    // clear of the ping-pong table on the left, of the scooter by the roller door; the land queue stops short of the first row
    const x = x1 - 4.65 + j * NAP_STEP;
    const z = napZ0 + Math.floor(i / 4) * NAP_ROW;
    const s = { x, z, wz: z, ax: j < 3 ? x + NAP_STEP / 2 : x - NAP_STEP / 2, face: 0 };
    lounge.push(s);
    furniture.push(napBedAt(s));
    ways.push({ s, to: { x: s.ax, z: crossFront } });
  }

  const out = outside(x0, D, aisle, crossFront);
  ways.push(...out.ways);
  furniture.push(...out.furniture);

  const backLeg = corridor(BACK, [...ways, ...boardSpots.map((s) => ({ s, to: { x: s.x, z: BACK } }))], [aisle, qx, ...(link !== null ? [link] : []), ...[...desks.values()].filter((d) => d.wz === BACK).map((d) => d.x)]);
  const sides: Leg[] = [bz - 0.75, bz + 0.75].map((z) => [{ x: aisle, z }, { x: bx + 1.15, z }] as const);
  const floor: Leg[] = [...lanes].map(([z, x]) => [{ x: aisle, z }, { x, z }] as const);
  const trunk: Leg[] = [
    backLeg,
    ...out.trunk,
    [{ x: aisle, z: BACK }, { x: aisle, z: crossFront }],
    corridor(crossFront, ways, [aisle, ...(link !== null ? [link] : [])]),
    [{ x: qx, z: BACK }, { x: qx, z: queue[queue.length - 1]?.z ?? 2.6 }],
    ...sides,
    ...floor,
    ...(link !== null ? [[{ x: link, z: BACK }, { x: link, z: crossFront }] as const] : []),
  ];
  const walks = walksOf(trunk, ways);

  // the Vespa: on the front band once the room has corners; before, in the free front middle as it was
  const bench = { x: bx, z: bz };
  const free0 = bench.x + 1.6;
  const free1 = x1 - 4.6;
  const vespa = corners.length > 0 ? { x: x0 + VESPA_AT.x, z: VESPA_AT.z } : free1 - free0 > 2.6 ? { x: (free0 + free1) / 2 + 0.3, z: (bench.z + 0.75 + crossFront) / 2 } : null;

  return {
    map: 'workshop',
    size: `walls${String(cap)}`,
    W, D, x0, island,
    desks, mainDesk, islandSpots, lounge, boardSpots, queue, door: out.door, terrace: out.terrace, exit: out.exit,
    walks, furniture,
    queueMore: queueMoreOf(queue, mainDesk, backLeg, x0),
    slots, cap, crossBack: BACK,
    pingpong, aisle, crossFront, pods, corners, vespa, roller: rollerOf(nLeft, D),
    ...(nooks.length > 0 ? { nooks } : {}),
    // each pod's lamp beam lights the floor at night (render/world.ts poolsOf)
    ...(pods.length > 0 ? { lamps: pods.map((p) => ({ x: p.x, z: p.z })) } : {}),
  };
}

/** the Vespa's floor box (its turned length, side on to the camera) */
export const vespaBox = (v: Pt): Box => boxAt(v.x, v.z, VESPA_HALF * 2, VESPA_HALF * 2);

/** where its look puts the loft's pieces past the common ones (render/maps/workshop.ts loftGrower: the arcade by the left wall, the nap place's middle): nothing cozy there */
const workshopPieces = (o: Office): Pt[] => [{ x: o.x0 + 0.5, z: 1.2 }, { x: o.x0 + o.W - 2.5, z: o.D - 2.5 }];

/** its look's walls (render/maps/workshop.ts): the tall back one, its left part taken (the mural, the frames, the pegboard, the board); the roller door and its scooter on the left one's front stretch, the tyre on the right edge */
const workshopCozy: CozyHints = {
  pieces: workshopPieces,
  walls: (o) => {
    const bx = o.boardSpots.reduce((s, p) => s + p.x, 0) / Math.max(1, o.boardSpots.length);
    return [{ wall: 'back', top: 2.1, busy: [[o.x0, bx + 1.0], [o.mainDesk.x - 0.6, o.mainDesk.x + 0.6]] }, { wall: 'left', top: 1.0 }, { wall: 'right', top: 0 }];
  },
  keepOut: (o) => {
    // the right edge kept low: the tyre, nothing tall before main's desk
    const out: Box[] = [{ x0: o.x0 + o.W - 0.8, x1: o.x0 + o.W, z0: 4.1, z1: o.D }];
    // the roller door's scooter across the left wall's front stretch
    const ws = o as WorkshopOffice;
    const sc = scooterAt(ws);
    out.push({ x0: o.x0, x1: sc.x + 0.6, z0: Math.min(sc.z - 0.35, ws.roller.z0), z1: Math.max(sc.z + 0.35, ws.roller.z1) });
    // the Vespa (render/maps/workshop.ts shell), the floor's corners with their rugs (maps/workshop-floor.ts)
    if (ws.vespa) out.push(vespaBox(ws.vespa));
    for (const c of ws.corners) out.push(cornerRug(c));
    return out;
  },
};

/** a corner's whole floor (its rug and its pieces) */
export function cornerRug(c: Corner): Box {
  const xs = c.pieces.flatMap((p) => [p.x0, p.x1]);
  const zs = c.pieces.flatMap((p) => [p.z0, p.z1]);
  return { x0: Math.min(c.x - 1.4, ...xs), x1: Math.max(c.x + 1.4, ...xs), z0: Math.min(c.z - 1.1, ...zs), z1: Math.max(c.z + 1.1, ...zs) };
}

export const workshop: Plan<WorkshopOffice> = { id: 'workshop', ready: true, layout: workshopLayout, things: LOFT_LIKE, cozy: workshopCozy };
