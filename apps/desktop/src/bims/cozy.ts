// A cozy office from day one (page bims-cozy v2, bims m_32090; Gabriel: « le bureau par défaut est
// un peu austère »): what every office has at stage 0 past its desks (two plants, a coffee corner,
// a nap corner's rug and its two beds, a low shelf, two posters, a floor lamp, an object or two on
// each desk) and what each stage adds to it (`cozyAt`), and where those pieces stand on a map's
// office (`placeCozy`): against a wall the plan names (Plan.cozy), off every walk, furniture box and
// place a stage's piece stands on, at any agent count. The coffee corner is a break goal (timeline
// coffeeGoal): its spot joins the walk graph by one leg. Pure, no three: render/cozy.ts draws it,
// each map's look says in what (MapLook.cozy). Owner: bims-cozy.
import type { Box, Leg, Office, Pt, Spot } from './model';

/** What the cozy kit draws at a stage (page bims-cozy v2 « la nouvelle courbe »). */
export interface CozyStage {
  /** floor plants: 1 at 0 (the shelf's small one besides), 2 from 1, 3 from 5 */
  readonly floorPlants: number;
  /** 5: a hanging plant */
  readonly hanging: boolean;
  /** 2: the machine, a sugar pot and hanging cups go on the eating place (the corner keeps its cabinet) */
  readonly coffeeOnIsland: boolean;
  /** 3: cushions in the nap corner */
  readonly cushions: boolean;
  /** objects per desk: 1, 2 from 4 */
  readonly deskObjects: 1 | 2;
  /** 6: the posters get a frame */
  readonly framed: boolean;
  /** 7: a throw on a bed */
  readonly throwOn: boolean;
  /** shelf rows filled: 1, 2 from 8 */
  readonly shelfRows: 1 | 2;
  /** 9: every desk's lamp lit at night (office-scene) */
  readonly deskLamps: boolean;
  /** floor lamps: 1, 2 from 10 */
  readonly floorLamps: 1 | 2;
  /** 11: the plants grow big */
  readonly bigPlants: boolean;
  /** 12: a trophy on the shelf, golden at 14 */
  readonly trophy: 'none' | 'plain' | 'golden';
}

/** the stage each extra comes with (its stage's group: the unlock moment hides it with the piece) */
export const COZY_AT = {
  plant2: 1, coffeeIsland: 2, cushions: 3, deskObject2: 4, plant3: 5, hanging: 5, framed: 6, throwOn: 7,
  shelfRow2: 8, deskLamps: 9, lamp2: 10, bigPlants: 11, trophy: 12, golden: 14,
} as const;

/** What the cozy kit draws at this stage. Pure. */
export function cozyAt(stage: number): CozyStage {
  const s = Math.max(0, stage);
  const A = COZY_AT;
  return {
    floorPlants: s >= A.plant3 ? 3 : s >= A.plant2 ? 2 : 1,
    hanging: s >= A.hanging,
    coffeeOnIsland: s >= A.coffeeIsland,
    cushions: s >= A.cushions,
    deskObjects: s >= A.deskObject2 ? 2 : 1,
    framed: s >= A.framed,
    throwOn: s >= A.throwOn,
    shelfRows: s >= A.shelfRow2 ? 2 : 1,
    deskLamps: s >= A.deskLamps,
    floorLamps: s >= A.lamp2 ? 2 : 1,
    bigPlants: s >= A.bigPlants,
    trophy: s >= A.golden ? 'golden' : s >= A.trophy ? 'plain' : 'none',
  };
}

/** a room's wall a piece stands or hangs against: the back one (z 0), the left one (x0), the right one (x0 + W) */
export type Wall = 'back' | 'left' | 'right';

/** A wall the plan offers: how high it stands, and the spans along it nothing hangs on (a window, the board, the frames). */
export interface WallOf {
  readonly wall: Wall;
  readonly top: number;
  /** along the wall (x for the back wall, z for a side one) from..to: no poster there */
  readonly busy?: readonly (readonly [number, number])[];
}

/**
 * What a map's plan says about its cozy pieces (Plan.cozy): its walls, the boxes they keep off
 * (what its look draws that is not furniture: an arcade, a stove, a pillar), whether its eating
 * place has a top the coffee machine goes on at stage 2 (its height; none: a fountain, a well).
 */
export interface CozyHints {
  walls?(o: Office): readonly WallOf[];
  keepOut?(o: Office): readonly Box[];
  /** where its own stages' pieces stand in the room past the common ones (piecesNear): nothing cozy goes there */
  pieces?(o: Office): readonly Pt[];
  /** the eating place's top, its height (stage 2's machine stands on it); absent: none, the machine stays in the corner */
  readonly islandTop?: number;
}

/** A piece on the floor against a wall (or free-standing, facing the viewer, where no wall has room): its floor box, the wall, the way its front faces (three's y rotation: front = local +z). */
export interface Item {
  readonly box: Box;
  readonly wall: Wall | 'free';
  readonly face: number;
  /** its height (a poster above it hangs higher) */
  readonly h: number;
}

/** A poster on a wall: its middle, its size, the wall it hangs on and its face. */
export interface Hung {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly w: number;
  readonly h: number;
  readonly wall: Wall;
  readonly face: number;
}

/** Where an office's cozy pieces stand (Office.cozy), the same at every stage. */
export interface Cozy {
  readonly coffee: Item;
  /** where a bim stands at the coffee corner (a place of the walk graph) */
  readonly coffeeSpots: readonly Spot[];
  readonly shelf: Item;
  /** floor lamps: the nap corner's, then stage 10's */
  readonly lamps: readonly Item[];
  /** floor plants: the base one, stage 1's, stage 5's */
  readonly plants: readonly Item[];
  readonly posters: readonly Hung[];
  /** the nap corner's rug, under lounge spots 0 and 1 */
  readonly rug: Box | null;
  /** the eating place's top height (stage 2's coffee set), none: it stays in the corner */
  readonly islandTop?: number;
  /** what stage 5's hanging plant hangs over: the shelf or the cabinet when its wall is tall enough; null: neither */
  readonly hangOver: 'shelf' | 'coffee' | null;
}

/** the walls most rooms have (the loft's): the tall back one, the low left one, the right one cut away (a piece stands by its edge, nothing hangs on it) */
export const DEFAULT_WALLS = (o: Office): WallOf[] => [{ wall: 'back', top: 1.7, busy: backBusy(o) }, { wall: 'left', top: 1.0 }, { wall: 'right', top: 0 }];

const avg = (xs: readonly number[], or: number): number => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : or);

/** the back wall's spans already taken by the loft-like pieces: the board, the frames up to main's neon, the mural over the lounge */
export function backBusy(o: Office): [number, number][] {
  const bx = avg(o.boardSpots.map((s) => s.x), o.x0 + o.W / 2);
  const lx = o.lounge.map((s) => s.x);
  const out: [number, number][] = [[bx - 1.0, Math.max(bx + 1.0, o.mainDesk.x + 0.5)]];
  if (lx.length) out.push([Math.min(...lx) - 0.6, Math.max(...lx) + 0.6]);
  return out;
}

// ---- placing

/**
 * Where the stages' pieces most maps share stand in the room (stages.ts pieceAt, blook's loft
 * grower, yard.ts pieceSpots): the door, the decor plants (1, 4), the board (4), the lounge's
 * middle (3, 5), the arcade past the board (11). A map's own: Plan.cozy.pieces.
 */
export function piecesNear(o: Office): Pt[] {
  const bx = avg(o.boardSpots.map((s) => s.x), o.x0 + o.W / 2);
  const lx = o.lounge.map((s) => s.x);
  const lc = lx.length ? (Math.min(...lx) + Math.max(...lx)) / 2 : o.x0 + 2;
  const x1 = o.x0 + o.W;
  const tx = o.terrace.map((t) => t.x);
  const left = tx.length ? Math.min(...tx) < o.x0 + o.W / 2 : true;
  return [
    o.door,
    { x: o.x0 + 0.3, z: o.D - 0.22 },
    { x: x1 - 0.35, z: 3.5 },
    { x: left ? o.x0 + 0.3 : x1 - 0.3, z: o.D - 0.25 },
    { x: bx, z: 0.9 },
    { x: lc, z: 0.6 },
    { x: lc, z: 1.5 },
    { x: bx + 0.9 + 0.25 + 0.55 / 2, z: 0.3 },
  ];
}

/** a bim's room each side of a walk: no piece closer to a leg */
export const WALK_CLEAR = 0.25;
/** room round a bed (a napper's head is past its box) and round other furniture */
const BED_CLEAR = 0.3;
const FURN_CLEAR = 0.08;
/** round where a stage's piece stands */
const PIECE_CLEAR = 0.75;
/** how far off its wall a piece stands or hangs (a wall's face may stand a little into the room) */
const WALL_GAP = 0.05;
/** the step pieces slide along a wall by */
const STEP = 0.1;

/** the sizes of the pieces: along the wall, deep, high */
export const SIZE = {
  coffee: { w: 0.8, d: 0.45, h: 1.0 },
  shelf: { w: 1.1, d: 0.35, h: 0.8 },
  lamp: { w: 0.36, d: 0.36, h: 1.35 },
  plant: { w: 0.46, d: 0.46, h: 1.1 },
  poster: { w: 0.42, h: 0.52 },
} as const;
/** how far behind its spot a napper's head reaches, and its half width (pose.ts's lying head, with room) */
const HEAD_BACK = 0.9;
const HEAD_HALF = 0.3;
/** a wall the hanging plant's bracket (1.45 up) goes on stands at least this high */
const HANG_WALL = 1.55;
/** how far a bim stands from the coffee cabinet's front */
const COFFEE_STAND = 0.42;

const overlap = (a: Box, b: Box, m = 0): boolean => a.x0 < b.x1 + m && a.x1 > b.x0 - m && a.z0 < b.z1 + m && a.z1 > b.z0 - m;

/** the distance from a leg to a box (0 when it goes through) */
export function legToBox([a, b]: Leg, box: Box): number {
  const n = Math.max(2, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.05));
  let best = Infinity;
  for (let i = 0; i <= n; i++) {
    const x = a.x + ((b.x - a.x) * i) / n;
    const z = a.z + ((b.z - a.z) * i) / n;
    const dx = Math.max(box.x0 - x, 0, x - box.x1);
    const dz = Math.max(box.z0 - z, 0, z - box.z1);
    best = Math.min(best, Math.hypot(dx, dz));
  }
  return best;
}

/** the floor box of a piece w along the wall, d deep, its middle at `at` along it */
function boxOn(o: Office, wall: Wall, at: number, w: number, d: number): Box {
  const g = WALL_GAP;
  if (wall === 'back') return { x0: at - w / 2, x1: at + w / 2, z0: g, z1: g + d };
  if (wall === 'left') return { x0: o.x0 + g, x1: o.x0 + g + d, z0: at - w / 2, z1: at + w / 2 };
  const x1 = o.x0 + o.W;
  return { x0: x1 - g - d, x1: x1 - g, z0: at - w / 2, z1: at + w / 2 };
}

/** the way a piece against that wall faces (its front: into the room) */
export const faceOf = (wall: Wall): number => (wall === 'back' ? 0 : wall === 'left' ? Math.PI / 2 : -Math.PI / 2);

const centre = (b: Box): Pt => ({ x: (b.x0 + b.x1) / 2, z: (b.z0 + b.z1) / 2 });

/** what the pieces keep off: the furniture, the walks, where a stage's piece stands, the map's own boxes */
interface Room {
  readonly o: Office;
  readonly walls: readonly WallOf[];
  readonly legs: Leg[];
  readonly solid: Box[];
  readonly pieces: readonly Pt[];
  readonly taken: Box[];
}

function clear(r: Room, b: Box): boolean {
  const { o } = r;
  if (b.x0 < o.x0 || b.x1 > o.x0 + o.W || b.z0 < 0 || b.z1 > o.D) return false;
  for (const f of o.furniture) if (overlap(b, f, f.of ? BED_CLEAR : FURN_CLEAR)) return false;
  for (const f of r.solid) if (overlap(b, f, FURN_CLEAR)) return false;
  for (const f of r.taken) if (overlap(b, f, 0.06)) return false;
  for (const p of r.pieces) if (p.x > b.x0 - PIECE_CLEAR && p.x < b.x1 + PIECE_CLEAR && p.z > b.z0 - PIECE_CLEAR && p.z < b.z1 + PIECE_CLEAR) return false;
  for (const l of r.legs) if (legToBox(l, b) < WALK_CLEAR) return false;
  return true;
}

/** every place along the room's floor walls a piece of w by d may stand, nearest `to` first */
function spotsFor(r: Room, w: number, d: number, to: Pt): Item[] {
  const { o } = r;
  const out: Item[] = [];
  for (const wl of r.walls) {
    const [a, b] = wl.wall === 'back' ? [o.x0, o.x0 + o.W] : [0, o.D];
    for (let at = a + w / 2 + 0.05; at <= b - w / 2 - 0.05 + 1e-9; at += STEP) {
      const box = boxOn(o, wl.wall, Math.round(at * 100) / 100, w, d);
      out.push({ box, wall: wl.wall, face: faceOf(wl.wall), h: 0 });
    }
  }
  const dist = (i: Item): number => Math.hypot(centre(i.box).x - to.x, centre(i.box).z - to.z);
  return out.sort((p, q) => dist(p) - dist(q));
}

/** where no wall has room: every place on the floor a free-standing piece may stand, facing the viewer (+z), nearest `to` first */
function freeSpots(r: Room, w: number, d: number, to: Pt): Item[] {
  const { o } = r;
  const out: Item[] = [];
  for (let x = o.x0 + w / 2 + 0.1; x <= o.x0 + o.W - w / 2 - 0.1; x += STEP) {
    for (let z = d / 2 + 0.1; z <= o.D - d / 2 - 0.1; z += STEP) {
      const cx = Math.round(x * 100) / 100;
      const cz = Math.round(z * 100) / 100;
      out.push({ box: { x0: cx - w / 2, x1: cx + w / 2, z0: cz - d / 2, z1: cz + d / 2 }, wall: 'free', face: 0, h: 0 });
    }
  }
  const dist = (i: Item): number => Math.hypot(centre(i.box).x - to.x, centre(i.box).z - to.z);
  return out.sort((p, q) => dist(p) - dist(q));
}

function place(r: Room, w: number, d: number, h: number, to: Pt, ok: (i: Item) => boolean = () => true): Item | null {
  for (const i of spotsFor(r, w, d, to)) {
    if (onBusy(r, i) || !clear(r, i.box) || !ok(i)) continue;
    const it = { ...i, h };
    r.taken.push(it.box);
    return it;
  }
  // no wall has room (a room lined with desks, a corridor along each wall): standing free on the floor
  for (const i of freeSpots(r, w, d, to)) {
    if (!clear(r, i.box) || !ok(i)) continue;
    const it = { ...i, h };
    r.taken.push(it.box);
    return it;
  }
  return null;
}

/** a piece against a wall where the wall is taken (the board, the frames, the mural come down to ~0.8: every cozy piece is taller) */
function onBusy(r: Room, i: Item): boolean {
  const wl = r.walls.find((w) => w.wall === i.wall);
  const [lo, hi] = i.wall === 'back' ? [i.box.x0, i.box.x1] : [i.box.z0, i.box.z1];
  return (wl?.busy ?? []).some(([s, e]) => hi > s - 0.05 && lo < e + 0.05);
}

/** the coffee corner's spot: in front of the cabinet, facing it, and its leg to the nearest walk it reaches clear */
function coffeeSpot(r: Room, it: Item): { spot: Spot; leg: Leg } | null {
  const c = centre(it.box);
  const dir = { x: Math.sin(it.face), z: Math.cos(it.face) };
  const half = it.wall === 'back' || it.wall === 'free' ? (it.box.z1 - it.box.z0) / 2 : (it.box.x1 - it.box.x0) / 2;
  const p = { x: c.x + dir.x * (half + COFFEE_STAND), z: c.z + dir.z * (half + COFFEE_STAND) };
  let best: { q: Pt; d: number } | null = null;
  for (const [a, b] of r.legs) {
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const l2 = dx * dx + dz * dz;
    const f = l2 > 0 ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / l2)) : 0;
    const q = { x: a.x + dx * f, z: a.z + dz * f };
    const dd = Math.hypot(q.x - p.x, q.z - p.z);
    if (dd > 2.6 || (best && dd >= best.d)) continue;
    const leg: Leg = [p, q];
    if (r.o.furniture.some((x) => legToBox(leg, x) < 0.12)) continue;
    if ([...r.solid, ...r.taken].some((x) => x !== it.box && legToBox(leg, x) < WALK_CLEAR)) continue;
    best = { q, d: dd };
  }
  if (!best) return null;
  const spot: Spot = { x: p.x, z: p.z, wz: best.q.z, ax: best.q.x, face: it.face + Math.PI };
  return { spot, leg: [p, best.q] };
}

/** A poster's place on a wall with room for one: over `near` when it can, off its busy spans and the others. */
function hang(r: Room, near: Pt, others: readonly Hung[], floor: readonly Item[]): Hung | null {
  const { o } = r;
  const { w, h } = SIZE.poster;
  const cands: { hg: Hung; d: number }[] = [];
  for (const wl of r.walls) {
    if (wl.top < 0.95) continue;
    const ph = Math.min(h, wl.top - 0.5);
    const y = wl.top - 0.14 - ph / 2;
    const [a, b] = wl.wall === 'back' ? [o.x0, o.x0 + o.W] : [0, o.D];
    for (let at = a + w / 2 + 0.15; at <= b - w / 2 - 0.15; at += STEP) {
      const lo = at - w / 2;
      const hi = at + w / 2;
      if ((wl.busy ?? []).some(([s, e]) => hi > s && lo < e)) continue;
      if (others.some((p) => p.wall === wl.wall && Math.abs((wl.wall === 'back' ? p.x : p.z) - at) < w + 0.25)) continue;
      // a piece standing under it taller than its bottom
      const under = floor.some((it) => it.wall === wl.wall && it.h > y - ph / 2 - 0.05 && (wl.wall === 'back' ? it.box.x0 < hi && it.box.x1 > lo : it.box.z0 < hi && it.box.z1 > lo));
      if (under) continue;
      // nothing that stands by the wall there (a stage's piece, the map's own)
      const strip = boxOn(o, wl.wall, at, w, 0.3);
      if (r.pieces.some((p) => p.x > strip.x0 - 0.4 && p.x < strip.x1 + 0.4 && p.z > strip.z0 - 0.4 && p.z < strip.z1 + 0.4)) continue;
      if (r.solid.some((x) => overlap(strip, x))) continue;
      const z = wl.wall === 'back' ? WALL_GAP : at;
      const x = wl.wall === 'back' ? at : wl.wall === 'left' ? o.x0 + WALL_GAP : o.x0 + o.W - WALL_GAP;
      cands.push({ hg: { x, y, z, w, h: ph, wall: wl.wall, face: faceOf(wl.wall) }, d: Math.hypot(x - near.x, z - near.z) });
    }
  }
  cands.sort((p, q) => p.d - q.d);
  return cands[0]?.hg ?? null;
}

/** where a napper's head lies on that lounge spot: behind it, the way it faces (render/lying.test.ts checks the real pose) */
export function headRoom(s: Spot): Box {
  const bx = -Math.sin(s.face);
  const bz = -Math.cos(s.face);
  const ends = [0.2, HEAD_BACK].map((d) => ({ x: s.x + bx * d, z: s.z + bz * d }));
  const xs = ends.map((p) => p.x);
  const zs = ends.map((p) => p.z);
  return { x0: Math.min(...xs) - HEAD_HALF, x1: Math.max(...xs) + HEAD_HALF, z0: Math.min(...zs) - HEAD_HALF, z1: Math.max(...zs) + HEAD_HALF };
}

/** the nap corner's rug: under lounge spots 0 and 1's beds, a little past them */
function rugOf(o: Office): Box | null {
  const beds = o.lounge.slice(0, 2).map((s) => o.furniture.find((f) => f.of?.x === s.x && f.of.z === s.z)).filter((b): b is Box => b !== undefined);
  if (beds.length === 0) return null;
  const m = 0.12;
  return {
    x0: Math.max(o.x0 + 0.02, Math.min(...beds.map((b) => b.x0)) - m),
    x1: Math.min(o.x0 + o.W - 0.02, Math.max(...beds.map((b) => b.x1)) + m),
    z0: Math.max(0.02, Math.min(...beds.map((b) => b.z0)) - m),
    z1: Math.min(o.D - 0.02, Math.max(...beds.map((b) => b.z1)) + m),
  };
}

/**
 * Where the cozy pieces stand on this office (null: no room for the coffee corner or the shelf, a
 * plan the law test fails). Nothing cozy stands where a stage's piece goes (piecesNear, the plan's
 * own: render/cozy.test.ts checks every look's pieceAt). Pure: the same office gives the same places.
 */
export function placeCozy(o: Office, hints: CozyHints): Cozy | null {
  const pieces = [...piecesNear(o), ...(hints.pieces?.(o) ?? [])];
  const r: Room = {
    o,
    walls: hints.walls?.(o) ?? DEFAULT_WALLS(o),
    legs: [...o.walks],
    solid: [...(hints.keepOut?.(o) ?? [])],
    pieces: pieces.filter((p) => p.x >= o.x0 - 0.5 && p.x <= o.x0 + o.W + 0.5 && p.z >= -0.5 && p.z <= o.D + 0.5),
    taken: [],
  };
  const isl = centre(o.island);
  const l01 = o.lounge.slice(0, 2);
  const nap = { x: avg(l01.map((s) => s.x), o.x0 + 1), z: avg(l01.map((s) => s.z), 1) };
  const rug = rugOf(o);
  if (rug) r.solid.push(rug);
  // under the back wall's taken spans (its art comes down to ~0.8), not even a side wall's piece in the corner
  for (const [s, e] of r.walls.find((w) => w.wall === 'back')?.busy ?? []) r.solid.push({ x0: s, x1: e, z0: 0, z1: 0.42 });
  // a napper lies with its head past its bed's back (pose.ts): nothing there, on any spot a stage beds
  r.solid.push(...o.lounge.map(headRoom));
  // the coffee corner first (by the eating place, its spot reaching a walk), then the shelf by the nap corner
  const C = SIZE.coffee;
  let cs: { spot: Spot; leg: Leg } | null = null;
  const coffee = place(r, C.w, C.d, C.h, isl, (i) => {
    cs = coffeeSpot(r, i);
    return cs !== null;
  });
  const found = cs as { spot: Spot; leg: Leg } | null;
  if (!coffee || !found) return null;
  const { spot, leg } = found;
  r.legs.push(leg);
  const S = SIZE.shelf;
  const shelf = place(r, S.w, S.d, S.h, nap);
  if (!shelf) return null;
  const L = SIZE.lamp;
  const P = SIZE.plant;
  const lamp0 = place(r, L.w, L.d, L.h, nap);
  const plant0 = place(r, P.w, P.d, P.h, centre(shelf.box));
  const plant1 = place(r, P.w, P.d, P.h, centre(coffee.box));
  const plant2 = place(r, P.w, P.d, P.h, { x: o.mainDesk.x, z: o.mainDesk.z });
  const lamp1 = place(r, L.w, L.d, L.h, centre(shelf.box));
  const floor = [coffee, shelf, ...[lamp0, lamp1, plant0, plant1, plant2].filter((x): x is Item => x !== null)];
  const tall = (it: Item): boolean => (r.walls.find((w) => w.wall === it.wall)?.top ?? 0) >= HANG_WALL;
  const hangOver = tall(shelf) ? 'shelf' : tall(coffee) ? 'coffee' : null;
  const p0 = hang(r, centre(shelf.box), [], floor);
  const p1 = hang(r, centre(coffee.box), p0 ? [p0] : [], floor);
  return {
    coffee,
    coffeeSpots: [spot],
    shelf,
    lamps: [lamp0, lamp1].filter((x): x is Item => x !== null),
    plants: [plant0, plant1, plant2].filter((x): x is Item => x !== null),
    posters: [p0, p1].filter((x): x is Hung => x !== null),
    rug,
    hangOver,
    ...(hints.islandTop !== undefined ? { islandTop: hints.islandTop } : {}),
  };
}

/** The office with its cozy pieces and the coffee corner's leg on its walk graph (maps/index.ts layoutOf). Pure. */
export function withCozy(o: Office, hints: CozyHints): Office {
  const cozy = placeCozy(o, hints);
  if (!cozy) return o;
  const legs = cozy.coffeeSpots.map((s): Leg => [{ x: s.x, z: s.z }, { x: s.ax, z: s.wz }]);
  return { ...o, cozy, walks: [...o.walks, ...legs] };
}

/**
 * Where an idle bim goes for its break: a coffee (a trip whose drink is coffee, fruit 2, or two bims'
 * coffee) at the corner while the machine stands there (stages 0-1, or always where the eating
 * place has no top); the rest stays at the island. Pure.
 */
export function coffeeAtCorner(o: Office, stage: number | undefined, coffee: boolean): boolean {
  if (!o.cozy || !coffee || stage === undefined) return false;
  return stage < COZY_AT.coffeeIsland || o.cozy.islandTop === undefined;
}
