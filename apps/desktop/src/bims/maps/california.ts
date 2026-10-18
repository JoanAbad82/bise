// California (page bims-maps v10, Gabriel: « un peu plus grand et un petit peu plus éloigné des
// bureaux, dans une map un peu plus grande »; its look: render/maps/california.ts). Pure numbers, in
// floor tiles, x right, z towards the viewer (0 at the back wall). Three bands left to right: the
// office's own room (OFFICE_W, closed on the park side by a low hedge), a strip of grass, palms and a
// sandy path (GAP_W), then the skatepark on its own slab (PARK_W). The office: the lounge, the board
// and main's desk with its land queue across the back; 3 desk columns, an aisle on their right; the
// taco truck (the eating place) at the front left, the door beside it, the terrace out front. The
// park (Office.park, skate.ts): a mini ramp across the back, the lone quarter pipe (the vert from
// stage 13), a funbox, the 4-stair and its handrail, a ledge, a flat rail, a curb, the pool bowl;
// skaters reach it along the sandy path through a gap in the hedge. Walk graph: the back corridor,
// the aisle, the front corridor, the path to the park, the door line to the terrace's walkway, and
// each place's way in. The room grows by desk rows (never shrinks while its agents live); the park
// is as deep as the room. Owner: maps-d.
import type { Agent } from '@/proto';
import { type Bar, type Box, type Leg, type Office, type Park, type Pt, QUEUE_GAP, type Spot } from '../model';
import { backBusy, type CozyHints } from '../cozy';
import { type Plan, boxAt, deskNames, wayIn } from './plan';

/** California's office: the numbers its look reads past the common ones. */
export interface CaliforniaOffice extends Office {
  readonly map: 'california';
  readonly rows: number;
  /** the three bands' x edges: the room's right wall (the hedge), the park slab's left edge */
  readonly roomX1: number;
  readonly parkX0: number;
  /** the corridors' z, the aisle's x, the sandy path's z (to the park) */
  readonly crossBack: number;
  readonly crossFront: number;
  readonly aisle: number;
  readonly pathZ: number;
  readonly park: Park;
}

export const OFFICE_W = 11.0;
export const GAP_W = 3.4;
export const PARK_W = 13.5;
/** desk columns, their pitch across and along, the first row's chairs */
const COLS = 3;
const DX = 2.05;
const DZ = 1.95;
const DESK_Z0 = 4.4;
/** the back zone's corridor: the first desk row's walkway */
const CROSS_BACK = DESK_Z0 - 0.5;
const MIN_D = 16;
const LOUNGE_N = 10;
const LOUNGE_W = 4.4;
const QUEUE_N = 6;
const TERRACE_N = 12;
const TERRACE_GAP = 1.15;
const TERRACE_WALK = 0.8;
const EXIT_OUT = 2.5;
/** the taco truck: its size (along x, along z) */
export const TRUCK = { w: 3.0, d: 1.2 } as const;
/** the pool session's line-up past the 2 rest spots */
const POOL_N = 6;

export function californiaLayout(agents: readonly Agent[], prev?: CaliforniaOffice): CaliforniaOffice {
  const others = deskNames(agents);
  const slots = deskSlots(others, prev);
  const used = Math.max(0, ...[...slots.values()].map((s) => s + 1));
  const rows = Math.max(3, Math.ceil(used / COLS), prev?.rows ?? 0);
  const W = OFFICE_W + GAP_W + PARK_W;
  const D = Math.max(MIN_D, DESK_Z0 - 0.2 + rows * DZ + 2.6);
  const x0 = -W / 2;
  const roomX1 = x0 + OFFICE_W;
  const parkX0 = roomX1 + GAP_W;
  const aisle = x0 + 7.5;
  const crossBack = CROSS_BACK;
  const crossFront = D - 2.4;

  const desks = new Map<string, Spot>();
  for (const name of others) {
    const s = slots.get(name) ?? 0;
    const x = x0 + 1.9 + (s % COLS) * DX;
    const z = DESK_Z0 + Math.floor(s / COLS) * DZ;
    desks.set(name, { x, z, wz: z - 0.5, ax: aisle, face: 0 });
  }

  // the taco truck at the front left, its 4 places in a line before its window
  const tx = x0 + 3.9;
  const tz = D - 1.4;
  const island = boxAt(tx, tz, TRUCK.w, TRUCK.d);
  const islandSpots: Spot[] = [-1.2, -0.4, 0.4, 1.2].map((dx) => ({ x: tx + dx, z: crossFront, wz: crossFront, ax: tx + dx, face: 0 }));

  // the lounge across the back left: 4 a row, a lane between two columns to the back corridor
  const step = (LOUNGE_W - 0.9) / 3;
  const lounge: Spot[] = [];
  for (let i = 0; i < LOUNGE_N; i++) {
    const j = i % 4;
    const x = x0 + 0.65 + j * step;
    const z = 1.0 + Math.floor(i / 4) * 1.05;
    lounge.push({ x, z, wz: z, ax: j < 3 ? x + step / 2 : x - step / 2, face: 0 });
  }
  const boardX = x0 + LOUNGE_W + 1.15;
  const boardSpots = [-0.45, 0.45, 0].map((o) => ({ x: boardX + o, z: 0.75, wz: crossBack, ax: boardX + o, face: Math.PI }));

  // main's desk at the back right of the room, its queue on its left
  const mx = roomX1 - 1.6;
  const qx = mx - 1.45;
  const mainDesk: Spot = { x: mx, z: 1.25, wz: 0.8, ax: qx, face: 0 };
  const queue: Spot[] = [];
  for (let i = 0; i < QUEUE_N; i++) queue.push({ x: qx, z: 1.3 + i * QUEUE_GAP, wz: crossBack, ax: qx, face: Math.PI / 2 });

  // the door at the front, left of the truck, on a terrace lane; the terrace past it
  const door: Spot = { x: x0 + 1.0 + TERRACE_GAP / 2, z: D + 0.2, wz: crossFront, ax: x0 + 1.0 + TERRACE_GAP / 2, face: Math.PI };
  const terrace: Spot[] = [];
  for (let i = 0; i < TERRACE_N; i++) {
    const j = i % 4;
    const x = x0 + 1.0 + j * TERRACE_GAP;
    const z = D + 1.5 + Math.floor(i / 4) * TERRACE_GAP;
    terrace.push({ x, z, wz: z, ax: j < 3 ? x + TERRACE_GAP / 2 : x - TERRACE_GAP / 2, face: 0 });
  }
  const tw = D + TERRACE_WALK;
  const exit: Spot = { x: x0 - EXIT_OUT, z: tw, wz: tw, ax: x0 - EXIT_OUT, face: -Math.PI / 2 };

  const park = parkOf(parkX0, x0 + W - 0.2, 0.4, D - 0.2);
  const pathZ = park.flat.z;
  const places = { desks, mainDesk, islandSpots, lounge, boardSpots, queue, door, terrace, exit };
  const base = { map: 'california' as const, size: String(rows), W, D, x0, island, ...places, park };
  const furniture = furnitureOf(base);
  const walks = walksOf({ ...base, crossBack, crossFront, aisle, tw, pathZ });
  const left = Math.min(...walks[0].map((p) => p.x));
  const queueMore: Leg = [{ x: qx, z: crossBack }, { x: Math.max(left, x0 + 1.5), z: crossBack }];
  return { ...base, rows, roomX1, parkX0, crossBack, crossFront, aisle, pathZ, walks, furniture, queueMore };
}

/** where its look puts its pieces in the room (render/maps/california.ts pieceAt: the agave, the crate, the cooler): nothing cozy there */
const californiaPieces = (o: Office): Pt[] => {
  const c = o as CaliforniaOffice;
  return [{ x: c.x0 + 0.5, z: c.D - 0.6 }, { x: c.island.x1 + 0.5, z: c.island.z0 + 0.3 }, { x: c.roomX1 - 0.6, z: c.D * 0.5 }];
};

/** its look's walls (render/maps/california.ts shell): the sunset mural on the back wall's left, the low left wall and its three surfboards near the front */
const californiaCozy: CozyHints = {
  pieces: californiaPieces,
  walls: (o) => [{ wall: 'back', top: 1.7, busy: [...backBusy(o), [o.x0, o.x0 + 4.8]] }, { wall: 'left', top: 1.1 }, { wall: 'right', top: 0 }],
  keepOut: (o) => [{ x0: o.x0, x1: o.x0 + 0.5, z0: o.D - 4.35, z1: o.D - 2.45 }],
};

export const california: Plan<CaliforniaOffice> = { id: 'california', ready: true, layout: californiaLayout, cozy: californiaCozy };

/**
 * The park on its slab (x px0..px1, z pz0..pz1), v10's drawing: the mini ramp across the back left
 * (lips 5.4 apart: 3 m of flat between two transitions of 1.2, its flat bottom open on its front
 * side, where a skater rolls in), the lone quarter pipe at the back right, the 4-stair on the left
 * with the bank up to its deck, the funbox in the middle, the ledge and the curb in a row, the flat
 * rail along the front, the bowl carved at the front right; the flat lane between, where the sandy
 * path comes in. The rest spots stand clear of the bench, every piece clear of the others' ways in
 * (parkpath.ts's ports; skate.test.ts rides every line).
 */
export function parkOf(px0: number, px1: number, pz0: number, pz1: number): Park {
  const flatZ = (pz0 + 7.6 + (pz1 - 4.0)) / 2;
  const spots: Spot[] = [];
  const rest = px0 + 1.4;
  for (const dz of [0.45, 1.45]) spots.push({ x: rest, z: flatZ + dz, wz: flatZ, ax: rest, face: Math.PI / 2 });
  for (let i = 0; i < POOL_N; i++) {
    const x = px0 + 2.6 + i * 0.7;
    spots.push({ x, z: flatZ + 1.45, wz: flatZ, ax: x, face: Math.PI / 2 });
  }
  const bar = (x0: number, x1: number, z: number, h: number): Bar => ({ x0, x1, z, h });
  return {
    area: { x0: px0, x1: px1, z0: pz0, z1: pz1 },
    spots,
    flat: bar(px0 + 2.6, px0 + 7.2, flatZ, 0),
    curb: bar(px0 + 5.5, px0 + 7.0, pz1 - 3.4, 0.2),
    rail: bar(px0 + 0.9, px0 + 4.9, pz1 - 1.6, 0.42),
    ledge: bar(px0 + 0.8, px0 + 4.8, pz1 - 3.4, 0.45),
    stairs: {
      x0: px0, xTop: px0 + 2.4, xBottom: px0 + 2.4 + 4 * 0.42, z0: pz0 + 4.8, z1: pz0 + 7.2, h: 0.8, railZ: pz0 + 6.95,
      bankX0: px0 + 0.8, bankZ: pz0 + 8.6,
    },
    ramp: { xa: px0 + 1.0, xb: px0 + 1.0 + 1.2 + 3.0 + 1.2, r: 1.2, z0: pz0 + 0.2, z1: pz0 + 3.6 },
    qp: { x0: px1 - 3.8, x1: px1 - 0.6, zLip: pz0 + 0.6, r: 1.0, r13: 1.7 },
    funbox: { x: px0 + 8.6, z: pz0 + 7.2, hw: 1.0, hd: 1.1, h: 0.5, run: 1.35 },
    bowl: { x: px1 - 3.0, z: pz1 - 3.4, hw: 2.3, hd: 2.5, rc: 1.4, depth: 0.95 },
    // one bench by the rest spots on the grass side, one on the right edge past the quarter pipe
    benches: [
      { x0: px0 + 0.125, x1: px0 + 0.575, z0: flatZ - 1.9, z1: flatZ - 0.4 },
      { x0: px1 - 0.575, x1: px1 - 0.125, z0: pz0 + 5.3, z1: pz0 + 6.8 },
    ],
    // the floodlights on the slab's back and left edges and its far corners, never on the camera's
    // side (front, right) where a pole would stand between a piece and the view (bims m_28843)
    poles: [
      { x: px0 + 0.15, z: pz0 + 0.15 }, { x: px1 - 0.15, z: pz0 + 0.15 }, { x: px0 + 0.15, z: pz0 + 4.3 },
      { x: px0 + 0.15, z: pz1 - 0.15 }, { x: (px0 + px1) / 2 + 1.0, z: pz0 + 0.15 },
    ],
  };
}

/**
 * The walk graph: the back corridor (from the lounge's leftmost lane to the queue), the aisle down to
 * the front corridor, the front corridor (the truck's line) from the door's lane to the aisle, the
 * sandy path from the aisle to the park's rest spots and on along the flat lane (the pool line-up),
 * the door line to the terrace's walkway, the walkway out to the exit; then each place's way in.
 */
function walksOf(o: Omit<CaliforniaOffice, 'walks' | 'furniture' | 'queueMore' | 'rows' | 'roomX1' | 'parkX0'> & { tw: number }): [Leg, ...Leg[]] {
  const { crossBack, crossFront, aisle, tw, exit, door, pathZ, park } = o;
  const spots = [...o.desks.values(), o.mainDesk, ...o.islandSpots, ...o.lounge, ...o.boardSpots, ...o.queue, door, ...o.terrace, exit, ...park.spots];
  const backX = spots.filter((s) => s.wz <= crossBack + 1e-6).map((s) => s.ax);
  const parkX = park.spots.map((s) => s.ax);
  const trunk: [Leg, ...Leg[]] = [
    [{ x: Math.min(aisle, ...backX), z: crossBack }, { x: Math.max(aisle, ...backX), z: crossBack }],
    [{ x: aisle, z: crossBack }, { x: aisle, z: crossFront }],
    [{ x: door.ax, z: crossFront }, { x: aisle, z: crossFront }],
    [{ x: aisle, z: pathZ }, { x: Math.max(...parkX), z: pathZ }],
    [{ x: door.ax, z: crossFront }, { x: door.ax, z: tw }],
    // the terrace's walkway, from the exit past the door to its rightmost lane
    [{ x: exit.x, z: tw }, { x: Math.max(door.ax, ...o.terrace.map((s) => s.ax)), z: tw }],
  ];
  const onTrunk = (p: Pt): boolean => trunk.some(([a, b]) => onAxisLeg(a, b, p));
  const out: [Leg, ...Leg[]] = [trunk[0], ...trunk.slice(1)];
  for (const s of spots) {
    out.push(...wayIn(s));
    const entry = { x: s.ax, z: s.wz };
    if (!onTrunk(entry)) out.push([entry, { x: s.ax, z: s.wz < crossBack ? crossBack : tw }]);
  }
  return out;
}

function onAxisLeg(a: Pt, b: Pt, p: Pt): boolean {
  const t = 1e-4;
  if (Math.abs(a.x - b.x) < 1e-6) return Math.abs(p.x - a.x) < t && p.z >= Math.min(a.z, b.z) - t && p.z <= Math.max(a.z, b.z) + t;
  if (Math.abs(a.z - b.z) < 1e-6) return Math.abs(p.z - a.z) < t && p.x >= Math.min(a.x, b.x) - t && p.x <= Math.max(a.x, b.x) + t;
  return false;
}

/** each desk ahead of its chair, main's desk, the truck, each bean bag and deck chair */
function furnitureOf(o: Pick<Office, 'desks' | 'mainDesk' | 'island' | 'lounge' | 'terrace'>): Box[] {
  const out: Box[] = [];
  for (const d of o.desks.values()) out.push(boxAt(d.x, d.z + 0.5, 1.6, 0.78));
  out.push(boxAt(o.mainDesk.x, o.mainDesk.z + 0.6, 2.3, 1.0));
  const i = o.island;
  out.push({ x0: i.x0 - 0.05, x1: i.x1 + 0.05, z0: i.z0 - 0.05, z1: i.z1 + 0.05 });
  for (const l of o.lounge) out.push(boxAt(l.x, l.z - 0.05, 0.72, 0.72, l));
  for (const t of o.terrace) out.push(boxAt(t.x, t.z + 0.05, 0.5, 0.95, t));
  return out;
}

/** each agent's desk slot (row by row, 3 a row): kept from `prev`, else the first free one */
function deskSlots(names: readonly string[], prev: CaliforniaOffice | undefined): Map<string, number> {
  const slots = new Map<string, number>();
  const taken = new Set<number>();
  if (prev) {
    const x0 = prev.x0;
    for (const name of names) {
      const d = prev.desks.get(name);
      if (!d) continue;
      const s = Math.round((d.z - DESK_Z0) / DZ) * COLS + Math.round((d.x - x0 - 1.9) / DX);
      slots.set(name, s);
      taken.add(s);
    }
  }
  let next = 0;
  for (const name of names) {
    if (slots.has(name)) continue;
    while (taken.has(next)) next++;
    slots.set(name, next);
    taken.add(next);
  }
  return slots;
}
