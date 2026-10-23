// The climbing gym, « la salle de bloc » (page bims-climb v4, Gabriel: « on peut l'ajouter », no
// clipping; bims' brief and its addendum m_37952: « que le bureau soit unique aussi »; its look:
// render/maps/climb.ts). A bouldering gym in an old Paris hall, never a brand. Pure numbers, in floor
// tiles, x right, z towards the viewer (0 at the back wall). Two bands left to right: the climbing hall
// (HALL_W) and the café side (OFFICE_W), open to each other but for a low glass rail with a gap on the
// back corridor. The hall: ONE folded wall down its left side and along its back (Gym.line, a
// chamfered corner between), one run of mats at its foot, two rest spots on its floor (climb.ts: a
// climber rests there between two problems). The café side: the stretching zone (yoga mats, the nap
// place) and the route setters' board across the back; long wooden tables in rows facing the street,
// a stool per seat, an aisle on their right; the café bar along the front edge (the eating place),
// the door beside it, main at the reception counter by the door with its land queue on its right; the
// pavement out front (the terrace). The rows grow towards the front, a table per row; the hall never
// moves a desk. Walk graph: the back corridor (from the hall's rest spots to the right lane), the
// aisle, the front corridor (the bar's line), the right lane (the queue), the door line to the
// pavement's walkway, and each place's way in. Owner: bims-climb.
import type { Agent } from '@/proto';
import { bims } from '@/proto/words_bims.gen';
import type { Box, Gym, Leg, Office, Pt, Spot, WallPt } from '../model';
import { QUEUE_GAP } from '../model';
import type { CozyHints } from '../cozy';
import { NAP_ROW, NAP_Z0, type Plan, type Things, boxAt, deskNames, napBedAt, wayIn } from './plan';

/** the climbing gym's office: the numbers its look reads past the common ones */
export interface ClimbOffice extends Office {
  readonly map: 'climb';
  readonly rows: number;
  /** the café side's left edge (the glass rail between it and the hall) */
  readonly ox0: number;
  readonly crossBack: number;
  readonly crossFront: number;
  readonly aisle: number;
  /** the right lane's x (the land queue stands on it) */
  readonly lane: number;
  readonly gym: Gym;
}

export const HALL_W = 9.6;
/** the hall's brick walls and the steel on them (the climbing wall's top is climbwall.ts WALL_TOP) */
export const HALL_H = 3.7;
/** the café's back wall (brick too): posters and the route-grade cards hang on it, the hanging plants over them */
export const CAFE_WALL_H = 2.2;
export const OFFICE_W = 11.0;
/** a table's seats, their pitch, the rows' pitch, the first row's seats */
export const SEATS = 7;
export const SEAT_DX = 1.2;
const DZ = 1.95;
const DESK_Z0 = 5.0;
const CROSS_BACK = DESK_Z0 - 0.5;
const MIN_D = 16;
const LOUNGE_N = 8;
const LOUNGE_W = 4.4;
/** the first mat's middle from the glass rail: a step off the hall's tall brick, so every napper's head shows */
const LOUNGE_X0 = 1.25;
const QUEUE_N = 6;
const TERRACE_N = 12;
const TERRACE_GAP = 1.15;
/** the deck chairs' rows on the pavement: tight enough to leave the street its kerb and cobbles (render/decor.ts terraceSlab) */
const TERRACE_ROW = 1.0;
const TERRACE_WALK = 0.8;
const EXIT_OUT = 2.5;
/** the café bar along the front edge: its x from the café side's edge, its depth */
export const BAR = { x0: 0.8, x1: 5.0, d: 0.7 } as const;
/** the reception counter (main's desk): its size */
export const COUNTER = { w: 2.3, d: 1.0 } as const;

/** the wall's foot line: its step along the floor, its left run's x and its back run's z (from the hall's edges) */
export const WALL_STEP = 0.8;
const WALL_IN = 0.75;
/** a part of the wall: how many planar panels, its profile (o1 at 1.4 m, o2 at the top) */
interface Zone {
  readonly n: number;
  readonly o1: number;
  readonly o2: number;
}
/** from the corner towards the front: a roof, an overhang, a vertical, a slab */
const LEFT: readonly Zone[] = [
  { n: 2, o1: 0.5, o2: 1.7 },
  { n: 2, o1: 0.2, o2: 0.85 },
  { n: 2, o1: 0, o2: 0.05 },
  { n: 2, o1: -0.15, o2: -0.5 },
];
/** from the corner to the right: a vertical, an overhang, a slab */
const BACK: readonly Zone[] = [
  { n: 2, o1: 0.05, o2: 0.1 },
  { n: 2, o1: 0.25, o2: 0.95 },
  { n: 2, o1: -0.12, o2: -0.45 },
];
/** the chamfer's two vertices at the corner */
const CORNER = { o1: 0.35, o2: 1.1 } as const;
/** a mat's depth from the wall's foot: this, and more under a steep part */
const MAT_D = 1.4;
const MAT_STEEP = 0.8;
/** between two mats: a seam */
const MAT_GAP = 0.03;
/** the mats' top and the wall's middle tier (climbwall.ts MAT_H, WALL_MID: the plan stays free of it) */
const MAT_TOP = 0.3;
const MID = 1.4;

export function climbLayout(agents: readonly Agent[], prev?: ClimbOffice): ClimbOffice {
  const others = deskNames(agents);
  const slots = deskSlots(others, prev);
  const used = Math.max(0, ...[...slots.values()].map((s) => s + 1));
  const rows = Math.max(2, Math.ceil(used / SEATS), prev?.rows ?? 0);
  const W = HALL_W + OFFICE_W;
  const lastRow = DESK_Z0 + (rows - 1) * DZ;
  const D = Math.max(MIN_D, lastRow + 0.9 + 3.3);
  const x0 = -W / 2;
  const ox0 = x0 + HALL_W;
  const aisle = ox0 + 9.2;
  const lane = ox0 + 10.2;
  const crossBack = CROSS_BACK;
  const crossFront = D - 2.6;

  const desks = new Map<string, Spot>();
  for (const name of others) {
    const s = slots.get(name) ?? 0;
    const x = ox0 + 0.9 + (s % SEATS) * SEAT_DX;
    const z = DESK_Z0 + Math.floor(s / SEATS) * DZ;
    desks.set(name, { x, z, wz: z - 0.5, ax: aisle, face: 0 });
  }

  // the café bar along the front edge, its 4 places on the front corridor facing it
  const island: Box = { x0: ox0 + BAR.x0, x1: ox0 + BAR.x1, z0: D - 1.5, z1: D - 1.5 + BAR.d };
  const islandSpots: Spot[] = [0.2, 0.4, 0.6, 0.8].map((f) => {
    const x = island.x0 + (island.x1 - island.x0) * f;
    return { x, z: island.z0 - 0.45, wz: crossFront, ax: x, face: 0 };
  });

  // the stretching zone across the back left: 4 mats a row, a lane between two columns to the back corridor
  const step = (LOUNGE_W - 0.9) / 3;
  const lounge: Spot[] = [];
  for (let i = 0; i < LOUNGE_N; i++) {
    const j = i % 4;
    const x = ox0 + LOUNGE_X0 + j * step;
    const z = NAP_Z0 + Math.floor(i / 4) * NAP_ROW;
    lounge.push({ x, z, wz: z, ax: j < 3 ? x + step / 2 : x - step / 2, face: 0 });
  }
  // the route setters' board on its pillar at the back
  const boardX = ox0 + LOUNGE_X0 - 0.65 + LOUNGE_W + 1.15;
  const boardSpots = [-0.45, 0.45, 0].map((o) => ({ x: boardX + o, z: 0.75, wz: crossBack, ax: boardX + o, face: Math.PI }));

  // main at the reception counter by the door, facing the street; its queue on the right lane
  const mx = ox0 + 8.0;
  const mz = D - 1.75;
  const mainDesk: Spot = { x: mx, z: mz, wz: crossFront, ax: mx, face: 0 };
  const queue: Spot[] = [];
  for (let i = 0; i < QUEUE_N; i++) queue.push({ x: lane, z: mz + 0.15 - i * QUEUE_GAP, wz: mz + 0.15 - i * QUEUE_GAP, ax: lane, face: 0 });

  // the door between the bar and the counter; the pavement's terrace past it
  const door: Spot = { x: ox0 + 6.0, z: D + 0.2, wz: crossFront, ax: ox0 + 6.0, face: Math.PI };
  const terrace: Spot[] = [];
  for (let i = 0; i < TERRACE_N; i++) {
    const j = i % 4;
    const x = ox0 + 0.9 + j * TERRACE_GAP;
    const z = D + 1.5 + Math.floor(i / 4) * TERRACE_ROW;
    terrace.push({ x, z, wz: z, ax: j < 3 ? x + TERRACE_GAP / 2 : x - TERRACE_GAP / 2, face: 0 });
  }
  const tw = D + TERRACE_WALK;
  const exit: Spot = { x: x0 - EXIT_OUT, z: tw, wz: tw, ax: x0 - EXIT_OUT, face: -Math.PI / 2 };

  const gym = gymOf(x0, ox0, D, crossBack);
  const places = { desks, mainDesk, islandSpots, lounge, boardSpots, queue, door, terrace, exit };
  const base = { map: 'climb' as const, size: String(rows), W, D, x0, island, ...places, gym, height: HALL_H };
  const furniture = furnitureOf(base);
  const walks = walksOf({ ...base, crossBack, crossFront, aisle, lane, tw });
  const last = queue.at(-1) ?? mainDesk;
  const queueMore: Leg = [{ x: lane, z: last.z }, { x: lane, z: crossBack }];
  return { ...base, rows, ox0, crossBack, crossFront, aisle, lane, walks, furniture, queueMore };
}

/**
 * The hall's wall, mats and rest spots. The foot line runs from the front of the left side to the
 * back, round a chamfered corner, then along the back to the right: zones of planar panels (a
 * problem's place: climbwall.ts routes) joined by one twisted panel each (the arêtes and dihedrals).
 */
export function gymOf(x0: number, ox0: number, D: number, crossBack: number): Gym {
  const lx = x0 + WALL_IN;
  const bz = WALL_IN;
  const S = WALL_STEP;
  const h = Math.SQRT1_2;
  // the left run, from the corner forwards, then reversed: the line starts at the front
  const left: WallPt[] = [];
  let k = 1;
  for (const z of LEFT) {
    for (let i = 0; i <= z.n; i++) left.push({ x: lx, z: bz + S + S * (k + i), nx: 1, nz: 0, o1: z.o1, o2: z.o2 });
    k += z.n + 1;
  }
  const corner: WallPt[] = [
    { x: lx, z: bz + S, nx: h, nz: h, ...CORNER },
    { x: lx + S, z: bz, nx: h, nz: h, ...CORNER },
  ];
  const back: WallPt[] = [];
  k = 1;
  for (const z of BACK) {
    for (let i = 0; i <= z.n; i++) back.push({ x: lx + S + S * (k + i), z: bz, nx: 0, nz: 1, o1: z.o1, o2: z.o2 });
    k += z.n + 1;
  }
  const line = [...left.reverse(), ...corner, ...back];
  const mats = matsOf(line);
  const leftFront = left[0]?.z ?? bz;
  const backEnd = back.at(-1)?.x ?? lx;
  // a rest spot before each run's middle, on the floor past its mats
  const leftMat = Math.max(...mats.filter((m) => m.z0 > bz + S + 0.5).map((m) => m.x1));
  const backMat = Math.max(...mats.filter((m) => m.x0 > lx + S + 0.5).map((m) => m.z1));
  const s0x = Math.max(leftMat + 0.5, lx + 3.15);
  const s0z = (bz + S * 2 + leftFront) / 2 + 1.2;
  const s1x = (lx + S + backEnd) / 2;
  const s1z = backMat + 0.55;
  const spots: Spot[] = [
    { x: s0x, z: s0z, wz: s0z, ax: s0x, face: -Math.PI / 2 },
    { x: s1x, z: s1z, wz: crossBack, ax: s1x, face: Math.PI },
  ];
  return { area: { x0, x1: ox0, z0: 0, z1: D }, line, mats, spots };
}

/** each panel's mat depth: MAT_D, more under a steep part (its top over the room) */
const matDepth = (a: WallPt, b: WallPt): number => MAT_D + Math.max(0, a.o2, b.o2) * MAT_STEEP;

/**
 * The mats along the foot, one per run piece (the left run, the corner, the back run) and per depth,
 * a seam between two: axis boxes, the corner's a square (its look cuts the wall's chamfer out of it).
 */
function matsOf(line: readonly WallPt[]): Box[] {
  const out: Box[] = [];
  const g = MAT_GAP;
  const ci = line.findIndex((p) => p.nx > 0 && p.nz > 0);
  const c0 = line[ci];
  const c1 = line[ci + 1];
  if (!c0 || !c1) return out;
  const dc = Math.max(matDepth(c0, c1), matDepth(line[ci - 1] ?? c0, c0), matDepth(c1, line[ci + 2] ?? c1));
  const lx = c0.x;
  const bz = c1.z;
  // a mat keeps off the wall's surface at its own top (an overhang's foot leans into the room)
  const inner = (pts: readonly WallPt[]): number => Math.max(0, ...pts.map((p) => p.o1)) * (MAT_TOP / MID) + g;
  const inC = inner(line.filter((p) => Math.hypot(p.x - lx, p.z - bz) < dc + 0.9));
  out.push({ x0: lx + inC, x1: lx + dc, z0: bz + inC, z1: bz + dc });
  // the left run: panels from the front to the corner, grouped by depth
  const runs = (pts: readonly WallPt[], along: 'z' | 'x'): void => {
    let start = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const d = matDepth(pts[i] as WallPt, pts[i + 1] as WallPt);
      const nextD = i + 2 < pts.length ? matDepth(pts[i + 1] as WallPt, pts[i + 2] as WallPt) : -1;
      if (Math.abs(nextD - d) < 1e-6) continue;
      const a = pts[start] as WallPt;
      const b = pts[i + 1] as WallPt;
      const inn = inner(pts.slice(Math.max(0, start - 1), i + 3));
      if (along === 'z') {
        const z0 = Math.max(Math.min(a.z, b.z), bz + dc) + g;
        const z1 = Math.max(a.z, b.z);
        if (z1 - z0 > 0.1) out.push({ x0: lx + inn, x1: lx + d, z0, z1: z1 - g });
      } else {
        const xa = Math.max(Math.min(a.x, b.x), lx + dc) + g;
        const xb = Math.max(a.x, b.x);
        if (xb - xa > 0.1) out.push({ x0: xa, x1: xb - g, z0: bz + inn, z1: bz + d });
      }
      start = i + 1;
    }
  };
  runs(line.slice(0, ci + 1), 'z');
  runs(line.slice(ci + 1), 'x');
  return out;
}

/** stage 4's hanging plants, high on the back wall over the stretching zone (x from the café's edge): the posters keep the wall right of the board */
export const HANGING = [1.6, 3.0, 4.4] as const;

/** the route-grade cards' span on the café's back wall (its look's frames): right of the board to the corner */
export function framesSpan(o: ClimbOffice): readonly [number, number] {
  return [(o.boardSpots[2]?.x ?? o.ox0 + 5.5) + 1.2, o.x0 + o.W - 0.6];
}

/** the shoe-rental shelves by the reception, along the right edge (its look draws them) */
export function shoeShelves(o: ClimbOffice): Box {
  const z = o.mainDesk.z - 1.2;
  return { x0: o.x0 + o.W - 0.45, x1: o.x0 + o.W - 0.05, z0: z - 1.0, z1: z + 1.0 };
}

/** the pieces its look puts in the café side (render/maps/climb.ts pieceAt): nothing cozy there */
const climbPieces = (o: Office): Pt[] => {
  const c = o as ClimbOffice;
  return [...HANGING.map((x) => ({ x: c.ox0 + x, z: 0.3 })), { x: c.ox0 + 10.5, z: c.D - 0.6 }];
};

/** its walls: the back wall of the café side (the board's pillar busy), never the hall's brick, nor the glass rail */
const climbCozy: CozyHints = {
  pieces: climbPieces,
  walls: (o) => {
    const c = o as ClimbOffice;
    const bx = (c.boardSpots[2] ?? c.door).x;
    return [
      { wall: 'back', top: CAFE_WALL_H, busy: [[o.x0, c.ox0 + 0.2], [bx - 1.0, bx + 1.0]] },
      { wall: 'left', top: 0 },
      { wall: 'right', top: 0 },
    ];
  },
  keepOut: (o) => {
    const c = o as ClimbOffice;
    return [{ x0: o.x0, x1: c.ox0 + 0.15, z0: 0, z1: o.D + 0.5 }, shoeShelves(c)];
  },
};

/** its 14 pieces (words: rust/proto/src/words/bims.rs stage_climb_*) */
const THINGS: Things = {
  1: bims.stage_climb_1, 2: bims.stage_climb_2, 3: bims.stage_climb_3, 4: bims.stage_climb_4, 5: bims.stage_climb_5, 6: bims.stage_climb_6, 7: bims.stage_climb_7,
  8: bims.stage_climb_8, 9: bims.stage_climb_9, 10: bims.stage_climb_10, 11: bims.stage_climb_11, 12: bims.stage_climb_12, 13: bims.stage_climb_13, 14: bims.stage_climb_14,
};

export const climb: Plan<ClimbOffice> = { id: 'climb', ready: true, layout: climbLayout, things: THINGS, cozy: climbCozy };

/**
 * The walk graph: the back corridor from the hall's rest spot lane to the right lane, the aisle down
 * to the front corridor, the front corridor from the bar's left to the right lane, the right lane (the
 * queue) between the two corridors, the door line to the pavement's walkway, the walkway out to the
 * exit; then each place's way in, joined to the corridor straight ahead when it ends off the trunk.
 */
function walksOf(o: Omit<ClimbOffice, 'walks' | 'furniture' | 'queueMore' | 'rows' | 'ox0'> & { tw: number }): [Leg, ...Leg[]] {
  const { crossBack, crossFront, aisle, lane, tw, exit, door, gym } = o;
  const s0 = gym.spots[0] as Spot;
  const spots = [...o.desks.values(), o.mainDesk, ...o.islandSpots, ...o.lounge, ...o.boardSpots, ...o.queue, door, ...o.terrace, exit, ...gym.spots];
  const frontX = Math.min(...o.islandSpots.map((s) => s.ax));
  const trunk: [Leg, ...Leg[]] = [
    [{ x: s0.ax, z: crossBack }, { x: lane, z: crossBack }],
    [{ x: aisle, z: crossBack }, { x: aisle, z: crossFront }],
    [{ x: frontX, z: crossFront }, { x: lane, z: crossFront }],
    [{ x: lane, z: crossBack }, { x: lane, z: Math.max(crossFront, ...o.queue.map((q) => q.z)) }],
    [{ x: door.ax, z: crossFront }, { x: door.ax, z: tw }],
    [{ x: exit.x, z: tw }, { x: Math.max(door.ax, ...o.terrace.map((s) => s.ax)), z: tw }],
  ];
  const onTrunk = (p: Pt): boolean => trunk.some(([a, b]) => onAxisLeg(a, b, p));
  const out: [Leg, ...Leg[]] = [trunk[0], ...trunk.slice(1)];
  for (const s of spots) {
    out.push(...wayIn(s));
    const entry = { x: s.ax, z: s.wz };
    if (!onTrunk(entry)) out.push([entry, { x: s.ax, z: s.wz < crossBack + 1e-6 || s.x < o.x0 + HALL_W ? crossBack : s.wz > crossFront ? tw : crossFront }]);
  }
  return out;
}

function onAxisLeg(a: Pt, b: Pt, p: Pt): boolean {
  const t = 1e-4;
  if (Math.abs(a.x - b.x) < 1e-6) return Math.abs(p.x - a.x) < t && p.z >= Math.min(a.z, b.z) - t && p.z <= Math.max(a.z, b.z) + t;
  if (Math.abs(a.z - b.z) < 1e-6) return Math.abs(p.z - a.z) < t && p.x >= Math.min(a.x, b.x) - t && p.x <= Math.max(a.x, b.x) + t;
  return false;
}

/** each seat's stretch of table ahead of it, the counter, the bar, each stretching mat and deck chair, the climbing mats */
function furnitureOf(o: Pick<Office, 'desks' | 'mainDesk' | 'island' | 'lounge' | 'terrace'> & { gym: Gym }): Box[] {
  const out: Box[] = [];
  for (const d of o.desks.values()) out.push(boxAt(d.x, d.z + 0.5, SEAT_DX, 0.78));
  out.push(boxAt(o.mainDesk.x, o.mainDesk.z + 0.6, COUNTER.w, COUNTER.d));
  const i = o.island;
  out.push({ x0: i.x0 - 0.05, x1: i.x1 + 0.05, z0: i.z0 - 0.05, z1: i.z1 + 0.05 });
  for (const l of o.lounge) out.push(napBedAt(l));
  for (const t of o.terrace) out.push(boxAt(t.x, t.z + 0.05, 0.5, 0.95, t));
  out.push(...o.gym.mats);
  return out;
}

/** each agent's seat (row by row, SEATS a row): kept from `prev`, else the first free one */
function deskSlots(names: readonly string[], prev: ClimbOffice | undefined): Map<string, number> {
  const slots = new Map<string, number>();
  const taken = new Set<number>();
  if (prev) {
    for (const name of names) {
      const d = prev.desks.get(name);
      if (!d) continue;
      const s = Math.round((d.z - DESK_Z0) / DZ) * SEATS + Math.round((d.x - prev.ox0 - 0.9) / SEAT_DX);
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
