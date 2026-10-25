// Where his plugins' objects stand in the bims' office (bims-plugins plan p4, page bims-plugins v15,
// layout B "by corners"): each object goes to the corner its kind belongs to (CORNER: a play
// corner by the nap place, a reading corner along the left wall, a machine corner round main's
// desk, the kitchen round the eating place, the door, the terrace; the calendar hangs on the back
// wall), a little turned and close together where a team would arrange it (ORGANIC), tall things
// with their back to a wall (AGAINST), a rug under a real cluster. A free spot is off every piece
// of furniture, cozy piece, inbox and park, and a body's room off every walk: a walk never crosses
// an object, and the desks never move for one (the plan lays them without knowing the objects).
// When the office changes (an agent comes, a new size), an object keeps its spot while it is still
// free, else slides to the nearest free one of its corner; one with no room anywhere takes its
// compact one (COMPACT), and only then waits in `left` (p5's growth makes room).
// objectSpots is the one seam p4's per-map corners plug into (Plan.corners): the signature stays.
// Pure, no three. Owner: bims-life.
import type { Box, Office, Pt } from './model';
import type { PluginObject } from './plugin-objects';
import type { ObjId } from './render/objects/ids';
import { FEET, type FootOf } from './render/objects/feet';
import { inboxBox } from './inbox';
import { backBusy, backFrames } from './cozy';
import { BODY_R } from './avoid';
import { network } from './paths';
import { decorOf, terraceSlab } from './render/decor';

export type Corner = 'play' | 'read' | 'machines' | 'kitchen' | 'door' | 'hang' | 'terrace';

/** the corner each object belongs to (bims-plugins' SENSE_B, signed by Gabriel on v15; every family has its default) */
export const CORNER: Readonly<Record<ObjId, Corner>> = {
  // games: the play corner, by the nap place; the big table outside
  chess: 'play', pingpong: 'terrace', arcade: 'play', pinball: 'play', babyfoot: 'play', billiards: 'play', go: 'play', jenga: 'play', claw: 'play', cards: 'play',
  // music: with the games
  piano: 'play', jukebox: 'play', turntable: 'play', guitar: 'play', drums: 'play', synth: 'play', gramophone: 'play', cello: 'play', mic: 'play', harp: 'play',
  // knowledge: the reading corner; the telescope under the sky
  shelf: 'read', library: 'read', globe: 'read', telescope: 'terrace', map: 'hang', lectern: 'read', blackboard: 'read', dinosaur: 'read', hourglass: 'read', orrery: 'read',
  // workshop: the easel reads, the printer prints by main's desk
  easel: 'read', printer: 'machines', printer3d: 'machines', workbench: 'machines', sewing: 'read', pottery: 'read', loom: 'read', press: 'machines', electronics: 'machines', robotarm: 'machines',
  // kitchen: round the eating place; the grill and the pizza oven outside
  espresso: 'kitchen', pizzaoven: 'terrace', grill: 'terrace', popcorn: 'kitchen', icecream: 'kitchen', drinks: 'kitchen', juicebar: 'kitchen', teaset: 'kitchen', candy: 'kitchen', fridge: 'kitchen',
  // garden: outside, but the plant stays in
  plant: 'kitchen', campfire: 'terrace', pond: 'terrace', beehive: 'terrace', veggies: 'terrace', swing: 'terrace', hammock: 'terrace', fountain: 'terrace', birdhouse: 'terrace', treehouse: 'terrace', glasshouse: 'terrace',
  // animals: the cat and its things by the nap place, the dog by main, the yard's outside
  cat: 'play', catwalk: 'play', cushion: 'play', dog: 'machines', aquarium: 'play', parrot: 'read', hens: 'terrace', tortoise: 'terrace', rabbit: 'terrace', hamster: 'read', goldfish: 'read', ducks: 'terrace',
  // comms: round main; the mailbox and the birds by the door and outside
  mailbox: 'door', booth: 'machines', visio: 'machines', radio: 'machines', dovecote: 'terrace', rotary: 'machines', telegraph: 'machines', dish: 'terrace', pneumatic: 'machines', switchboard: 'machines',
  // machines: round main; the snacks by the kitchen
  rack: 'machines', macdesk: 'machines', retro: 'play', crt: 'machines', snacks: 'kitchen', photobooth: 'play', robot: 'machines', drone: 'machines', clock: 'machines', dashboard: 'machines',
  // travel: outside; the yoga mat too
  scooter: 'door', bike: 'terrace', hoop: 'terrace', surf: 'terrace', kayak: 'terrace', balloon: 'terrace', rocket: 'terrace', car: 'terrace', yoga: 'terrace', trampoline: 'terrace',
  // office: the calendar hangs, the extinguisher by the door, the files and trophies read
  calendar: 'hang', files: 'read', trophies: 'read', extinguisher: 'door', charts: 'machines', packing: 'door',
};

/** where an object goes when its corner is full, in order (never outside for an indoor thing, never in for an outdoor one) */
const NEXT: Readonly<Record<Corner, readonly Corner[]>> = {
  play: ['read', 'kitchen', 'machines', 'door'],
  read: ['play', 'kitchen', 'machines', 'door'],
  machines: ['read', 'play', 'kitchen', 'door'],
  kitchen: ['play', 'read', 'machines', 'door'],
  door: ['machines', 'read', 'play', 'kitchen'],
  hang: [],
  terrace: [],
};

/** tall things that stand with their back to a wall (the back one or the left one) */
const AGAINST: ReadonlySet<ObjId> = new Set<ObjId>([
  'library', 'shelf', 'piano', 'jukebox', 'files', 'trophies', 'aquarium', 'rack', 'booth', 'fridge', 'blackboard', 'workbench', 'snacks', 'clock',
  'dashboard', 'switchboard', 'charts', 'drinks', 'juicebar', 'icecream', 'espresso', 'claw', 'photobooth', 'harp', 'cello', 'guitar', 'synth', 'press', 'electronics',
]);

/** the corners an assemblage lives in: things a little turned (±TURN, seeded by the plugin), closer together */
const ORGANIC: ReadonlySet<Corner> = new Set<Corner>(['play', 'machines', 'kitchen', 'terrace']);
export const TURN = 0.3;

/** a big thing's compact one in an office with no room for it (the registry's COMPACT, three-free); the others scale by COMPACT_SCALE */
export const COMPACT: Partial<Record<ObjId, ObjId>> = { library: 'shelf', pingpong: 'babyfoot', piano: 'jukebox' };
export const COMPACT_SCALE = 0.8;

/** how far an object keeps from a walk's middle line: a body and a hair */
export const WALK_GAP = BODY_R + 0.1;
/** how far from furniture, cozy pieces and the floor's edge */
const AROUND = 0.2;
/** the parasol's canopy's and the palm's fronds' half reach */
const CANOPY = 0.9;
const EDGE = 0.12;
/** two objects apart: close in an assemblage, a step elsewhere */
const GAP_ORGANIC = 0.3;
const GAP = 0.6;
/** the search's step and reach round a corner's anchor */
const STEP = 0.25;
/** a wall thing's back off its wall */
const OFF_WALL = 0.08;

export interface Placed {
  readonly key: string;
  /** what is drawn: the plugin's object, or its compact one */
  readonly obj: ObjId;
  /** the plugin's own object (its corner's: CORNER) */
  readonly of: ObjId;
  readonly n?: number;
  readonly glass: boolean;
  readonly pill: PluginObject['pill'];
  /** its middle on the floor (office units) and its turn (three's y rotation; 0: its front to +z) */
  readonly x: number;
  readonly z: number;
  readonly rot: number;
  /** it took its small one: a swap (obj is the swap's) or scaled by COMPACT_SCALE */
  readonly compact: boolean;
  /** scaled by COMPACT_SCALE (no swap for it): makeObject's compact for this obj */
  readonly scaled: boolean;
  /** its foot as drawn (compact: the swap's, or scaled) */
  readonly foot: FootOf;
  readonly corner: Corner;
  /** the floor it takes, turned (what walks and other objects keep off) */
  readonly box: Box;
}

/** a rug under a corner's real cluster (2 objects or more close together) */
export interface Rug {
  readonly box: Box;
  readonly corner: 'play' | 'read';
}

export interface Corners {
  readonly placed: readonly Placed[];
  /** what found no room even compact (p5: the office grows for them); in its order */
  readonly left: readonly PluginObject[];
  readonly rugs: readonly Rug[];
}

export const NO_CORNERS: Corners = { placed: [], left: [], rugs: [] };

/** a string's small hash in [0, 1) (FNV-1a): the plugin's turn, the same on every run */
export function seedOf(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

const overlaps = (a: Box, b: Box, m: number): boolean => a.x0 < b.x1 + m && a.x1 > b.x0 - m && a.z0 < b.z1 + m && a.z1 > b.z0 - m;

/** a w x d foot turned by rot round (x, z): its floor box */
export function boxOf(x: number, z: number, w: number, d: number, rot: number): Box {
  const c = Math.abs(Math.cos(rot));
  const s = Math.abs(Math.sin(rot));
  const hw = (w * c + d * s) / 2;
  const hd = (w * s + d * c) / 2;
  return { x0: x - hw, x1: x + hw, z0: z - hd, z1: z + hd };
}

const footOf = (obj: ObjId, compact: boolean): { obj: ObjId; foot: FootOf } => {
  const swap = compact ? COMPACT[obj] : undefined;
  if (swap !== undefined) return { obj: swap, foot: FEET[swap] };
  const f = FEET[obj];
  if (!compact) return { obj, foot: f };
  const k = COMPACT_SCALE;
  return { obj, foot: { w: f.w * k, d: f.d * k, h: f.h * k, ...(f.wall ? { wall: true as const } : {}) } };
};

const mid = (ps: readonly Pt[], or: Pt): Pt => (ps.length === 0 ? or : { x: ps.reduce((s, p) => s + p.x, 0) / ps.length, z: ps.reduce((s, p) => s + p.z, 0) / ps.length });

/** the kept floor's cell: what the office keeps is laid on a grid once per office, a box's question is then a sum */
const CELL = 0.125;

/**
 * What the office keeps for itself (furniture, cozy pieces, the inbox, a park, a gym, a body's room
 * round every walk and every place a bim stands), as a grid of kept cells over the room and the
 * terrace, summed (a box's kept cells in four reads).
 */
interface Keep {
  readonly boxes: readonly Box[];
  readonly gx: number;
  readonly gz: number;
  readonly nx: number;
  readonly nz: number;
  /** (nx + 1) x (nz + 1) running sums of kept cells */
  readonly sum: Int32Array;
}

function keepOf(o: Office): Keep {
  const boxes: Box[] = [...o.furniture];
  const c = o.cozy;
  if (c !== undefined) {
    for (const it of [c.coffee, c.shelf, ...c.lamps, ...c.plants]) boxes.push(it.box);
  }
  if (o.inbox !== undefined) boxes.push(inboxBox(o.inbox));
  if (o.park !== undefined) boxes.push(o.park.area);
  if (o.gym !== undefined) boxes.push(o.gym.area, ...o.gym.mats);
  for (const g of o.ghosts ?? []) boxes.push({ x0: g.x - 0.8, x1: g.x + 0.8, z0: g.z - 1.0, z1: g.z + 0.4 });
  // the decor every look draws: the plants, the door mat, and on the terrace the parasol, the palm, the ramp
  const dec = decorOf(o);
  for (const f of [...dec.plants, dec.doorMat, dec.ramp]) boxes.push({ x0: f.x - f.hw - 0.3, x1: f.x + f.hw + 0.3, z0: f.z - f.hd - 0.3, z1: f.z + f.hd + 0.3 });
  // the parasol's canopy and the palm's fronds spread past their poles
  for (const f of [dec.parasol, dec.palm]) boxes.push({ x0: f.x - CANOPY, x1: f.x + CANOPY, z0: f.z - CANOPY, z1: f.z + CANOPY });
  const spots: Pt[] = [o.door, o.mainDesk, ...o.desks.values(), ...o.islandSpots, ...o.lounge, ...o.boardSpots, ...o.queue, ...o.terrace, ...(o.nooks ?? []), ...(c?.coffeeSpots ?? [])];
  const t = terraceSlab(o);
  const gx = Math.min(o.x0, t.x0) - CELL;
  const gz = Math.min(0, t.z0) - CELL;
  const nx = Math.ceil((Math.max(o.x0 + o.W, t.x1) + CELL - gx) / CELL);
  const nz = Math.ceil((Math.max(o.D, t.z1) + CELL - gz) / CELL);
  const kept = new Uint8Array(nx * nz);
  const mark = (x0: number, x1: number, z0: number, z1: number, keepIf: (cx: number, cz: number) => boolean): void => {
    const i0 = Math.max(0, Math.floor((x0 - gx) / CELL));
    const i1 = Math.min(nx - 1, Math.floor((x1 - gx) / CELL));
    const j0 = Math.max(0, Math.floor((z0 - gz) / CELL));
    const j1 = Math.min(nz - 1, Math.floor((z1 - gz) / CELL));
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) if (keepIf(gx + (i + 0.5) * CELL, gz + (j + 0.5) * CELL)) kept[i * nz + j] = 1;
  };
  // a cell is kept when any of its square comes within reach: its middle within reach + half its diagonal
  const half = CELL * Math.SQRT1_2;
  for (const b of boxes) mark(b.x0 - AROUND, b.x1 + AROUND, b.z0 - AROUND, b.z1 + AROUND, () => true);
  const r = WALK_GAP + half;
  for (const s of spots) mark(s.x - r, s.x + r, s.z - r, s.z + r, (x, z) => Math.hypot(x - s.x, z - s.z) < r);
  for (const [a, b] of network(o)) {
    mark(Math.min(a.x, b.x) - r, Math.max(a.x, b.x) + r, Math.min(a.z, b.z) - r, Math.max(a.z, b.z) + r, (x, z) => segGap({ x, z }, a, b) < r);
  }
  const sum = new Int32Array((nx + 1) * (nz + 1));
  for (let i = 0; i < nx; i++)
    for (let j = 0; j < nz; j++) sum[(i + 1) * (nz + 1) + j + 1] = (kept[i * nz + j] as number) + (sum[i * (nz + 1) + j + 1] as number) + (sum[(i + 1) * (nz + 1) + j] as number) - (sum[i * (nz + 1) + j] as number);
  return { boxes, gx, gz, nx, nz, sum };
}

/** a point's distance to a leg */
function segGap(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const l = dx * dx + dz * dz;
  const t = l === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / l));
  return Math.hypot(p.x - (a.x + t * dx), p.z - (a.z + t * dz));
}

/** how many kept cells a box touches */
function keptIn(k: Keep, b: Box): number {
  const i0 = Math.max(0, Math.floor((b.x0 - k.gx) / CELL));
  const i1 = Math.min(k.nx, Math.ceil((b.x1 - k.gx) / CELL));
  const j0 = Math.max(0, Math.floor((b.z0 - k.gz) / CELL));
  const j1 = Math.min(k.nz, Math.ceil((b.z1 - k.gz) / CELL));
  if (i1 <= i0 || j1 <= j0) return 0;
  const s = k.sum;
  const w = k.nz + 1;
  return (s[i1 * w + j1] as number) - (s[i0 * w + j1] as number) - (s[i1 * w + j0] as number) + (s[i0 * w + j0] as number);
}

/** the floor an object may stand on in a corner: the room's, or the terrace's slab */
function areaOf(o: Office, corner: Corner): Box {
  if (corner === 'terrace') return terraceSlab(o);
  return { x0: o.x0 + EDGE, x1: o.x0 + o.W - EDGE, z0: EDGE, z1: o.D - EDGE };
}

/** where a corner gathers (its things are searched nearest first) */
function anchorOf(o: Office, corner: Corner): Pt {
  const isl = { x: (o.island.x0 + o.island.x1) / 2, z: (o.island.z0 + o.island.z1) / 2 };
  switch (corner) {
    case 'play':
      return mid(o.lounge, isl);
    case 'read':
      return { x: o.x0, z: o.D * 0.4 };
    case 'machines':
      return o.mainDesk;
    case 'kitchen':
      return isl;
    case 'door':
      return { x: o.door.x, z: o.D };
    case 'hang':
      return { x: o.mainDesk.x, z: 0 };
    case 'terrace': {
      const t = terraceSlab(o);
      return { x: t.x1, z: (t.z0 + t.z1) / 2 };
    }
  }
}

/** two objects apart: close when both stand in an assemblage, a step when either does not (the same both ways, so a kept spot stays free) */
const gapOf = (a: Corner, b: Corner): number => (ORGANIC.has(a) && ORGANIC.has(b) ? GAP_ORGANIC : GAP);

/** whether a box is free in a corner: on its area, off what the office keeps, a body's room off every walk and every place, apart from the others */
function free(b: Box, corner: Corner, area: Box, keep: Keep, taken: readonly Placed[]): boolean {
  if (b.x0 < area.x0 || b.x1 > area.x1 || b.z0 < area.z0 || b.z1 > area.z1) return false;
  if (keptIn(keep, b) > 0) return false;
  for (const p of taken) if (overlaps(b, p.box, gapOf(corner, p.corner))) return false;
  return true;
}

interface Try {
  readonly x: number;
  readonly z: number;
  readonly rot: number;
}

/** a wall's spans along it where nothing tall stands (the board, main's neon, the mural, the frames, a poster); x for the back wall, z for the left one */
function wallSpans(o: Office): { back: [number, number][]; left: [number, number][] } {
  const back: [number, number][] = [...backBusy(o), ...backFrames(o)];
  const left: [number, number][] = [];
  for (const h of o.cozy?.posters ?? []) {
    if (h.wall === 'back') back.push([h.x - h.w / 2, h.x + h.w / 2]);
    if (h.wall === 'left') left.push([h.z - h.w / 2, h.z + h.w / 2]);
  }
  return { back, left };
}

const crosses = (spans: readonly (readonly [number, number])[], a: number, b: number): boolean => spans.some(([s, e]) => a < e && b > s);

/** one call's searches: the kept floor, each corner's floor and its points nearest its anchor first (laid once) */
interface Ctx {
  readonly o: Office;
  readonly keep: Keep;
  readonly spans: { back: [number, number][]; left: [number, number][] };
  readonly grids: Map<Corner, readonly Pt[]>;
}

function gridOf(c: Ctx, corner: Corner): readonly Pt[] {
  const had = c.grids.get(corner);
  if (had !== undefined) return had;
  const area = areaOf(c.o, corner);
  const a = anchorOf(c.o, corner);
  const ps: Pt[] = [];
  for (let x = area.x0; x <= area.x1 + 1e-9; x += STEP) for (let z = area.z0; z <= area.z1 + 1e-9; z += STEP) ps.push({ x, z });
  const r = (p: Pt): number => Math.hypot(p.x - a.x, p.z - a.z);
  ps.sort((p, q) => r(p) - r(q) || p.x - q.x || p.z - q.z);
  c.grids.set(corner, ps);
  return ps;
}

/** a wall thing's spots in a corner, nearest its anchor first: along the back wall, then the left one (turned to face the room), off their busy spans; a hung one flat on the wall */
function wallTries(c: Ctx, corner: Corner, foot: FootOf): readonly Try[] {
  const area = areaOf(c.o, corner);
  const a = anchorOf(c.o, corner);
  const off = corner === 'hang' ? 0 : OFF_WALL;
  const out: Try[] = [];
  const z = area.z0 + foot.d / 2 + off;
  for (let x = area.x0 + foot.w / 2; x <= area.x1 - foot.w / 2 + 1e-9; x += STEP) {
    if (!crosses(c.spans.back, x - foot.w / 2, x + foot.w / 2)) out.push({ x, z, rot: 0 });
  }
  const x = area.x0 + foot.d / 2 + off;
  for (let z2 = area.z0 + foot.w / 2; z2 <= area.z1 - foot.w / 2 + 1e-9; z2 += STEP) {
    if (!crosses(c.spans.left, z2 - foot.w / 2, z2 + foot.w / 2)) out.push({ x, z: z2, rot: Math.PI / 2 });
  }
  const r = (t: Try): number => Math.hypot(t.x - a.x, t.z - a.z);
  return out.sort((p, q) => r(p) - r(q) || p.x - q.x || p.z - q.z);
}

/** the order objects take their spots: hung and wall things first (they need a wall), then the biggest; the key breaks ties */
function orderOf(objs: readonly PluginObject[]): PluginObject[] {
  const rank = (p: PluginObject): number => (CORNER[p.obj] === 'hang' ? 0 : AGAINST.has(p.obj) ? 1 : 2);
  const area = (p: PluginObject): number => FEET[p.obj].w * FEET[p.obj].d;
  return [...objs].sort((a, b) => rank(a) - rank(b) || area(b) - area(a) || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
}

/**
 * Every plugin object's spot in this office. `prev`: the spots drawn before (another size, an
 * agent more): each keeps its own while it is still free (those go first, so no newcomer takes
 * one). The same office, objects and prev give the same spots. Pure.
 */
export function objectSpots(o: Office, objs: readonly PluginObject[], prev: readonly Placed[] = []): Corners {
  if (objs.length === 0) return NO_CORNERS;
  const c: Ctx = { o, keep: keepOf(o), spans: wallSpans(o), grids: new Map() };
  const was = new Map(prev.map((p) => [p.key, p]));
  const placed: Placed[] = [];
  const left: PluginObject[] = [];
  const todo: PluginObject[] = [];
  // the ones still free where they were, first
  for (const p of orderOf(objs)) {
    const b = was.get(p.key);
    const at = b === undefined ? null : kept(c, p, b, placed);
    if (at === null) todo.push(p);
    else placed.push(at);
  }
  for (const p of todo) {
    const at = place(c, p, placed);
    if (at === null) left.push(p);
    else placed.push(at);
  }
  return { placed, left, rugs: rugsOf(placed, c.keep) };
}

function placedOf(p: PluginObject, obj: ObjId, compact: boolean, foot: FootOf, corner: Corner, t: Try): Placed {
  return {
    key: p.key, obj, of: p.obj, ...(p.n === undefined ? {} : { n: p.n }), glass: p.glass, pill: p.pill,
    x: t.x, z: t.z, rot: t.rot, compact, scaled: compact && COMPACT[p.obj] === undefined, foot, corner, box: boxOf(t.x, t.z, foot.w, foot.d, t.rot),
  };
}

/** its spot of before, while it is still free and the same object; null: it moves */
function kept(c: Ctx, p: PluginObject, before: Placed, taken: readonly Placed[]): Placed | null {
  const { obj, foot } = footOf(p.obj, before.compact);
  if (before.obj !== obj || before.of !== p.obj) return null;
  return free(before.box, before.corner, areaOf(c.o, before.corner), c.keep, taken) ? placedOf(p, obj, before.compact, foot, before.corner, before) : null;
}

function place(c: Ctx, p: PluginObject, taken: readonly Placed[]): Placed | null {
  const home = CORNER[p.obj];
  const corners: readonly Corner[] = [home, ...NEXT[home]];
  // a tall thing tries a wall first, its compact one at a wall next, then standing free in the room (turned to it)
  const walled = AGAINST.has(p.obj);
  const tries: readonly (readonly [boolean, boolean])[] = walled ? [[false, true], [true, true], [false, false], [true, false]] : [[false, false], [true, false]];
  for (const [compact, against] of tries) {
    if (compact && COMPACT[p.obj] === undefined && !(FEET[p.obj].w * FEET[p.obj].d > 1)) continue;
    const { obj, foot } = footOf(p.obj, compact);
    for (const corner of corners) {
      const area = areaOf(c.o, corner);
      const turn = ORGANIC.has(corner) ? (seedOf(p.key) * 2 - 1) * TURN : 0;
      if ((against && corner !== 'terrace') || corner === 'hang') {
        for (const t of wallTries(c, corner, foot)) {
          if (free(boxOf(t.x, t.z, foot.w, foot.d, t.rot), corner, area, c.keep, taken)) return placedOf(p, obj, compact, foot, corner, t);
        }
        continue;
      }
      // the floor's points nearest the corner's anchor: one turned box's half sizes for all of them
      const cs = Math.abs(Math.cos(turn));
      const sn = Math.abs(Math.sin(turn));
      const hw = (foot.w * cs + foot.d * sn) / 2;
      const hd = (foot.w * sn + foot.d * cs) / 2;
      for (const q of gridOf(c, corner)) {
        const b = { x0: q.x - hw, x1: q.x + hw, z0: q.z - hd, z1: q.z + hd };
        if (free(b, corner, area, c.keep, taken)) return placedOf(p, obj, compact, foot, corner, { x: q.x, z: q.z, rot: turn });
      }
    }
  }
  return null;
}

/** the rug's margin round its cluster, and how close two things are to share one */
const RUG_PAD = 0.35;
const RUG_NEAR = 2.6;

/** a rug under each play or reading corner's real cluster, kept off the furniture */
function rugsOf(placed: readonly Placed[], keep: Keep): Rug[] {
  const out: Rug[] = [];
  for (const corner of ['play', 'read'] as const) {
    const ps = placed.filter((p) => p.corner === corner && !p.foot.wall);
    const first = ps[0];
    if (first === undefined) continue;
    const near = ps.filter((p) => Math.hypot(p.x - first.x, p.z - first.z) < RUG_NEAR);
    if (near.length < 2) continue;
    const box = {
      x0: Math.min(...near.map((p) => p.box.x0)) - RUG_PAD,
      x1: Math.max(...near.map((p) => p.box.x1)) + RUG_PAD,
      z0: Math.min(...near.map((p) => p.box.z0)) - RUG_PAD,
      z1: Math.max(...near.map((p) => p.box.z1)) + RUG_PAD,
    };
    if (keep.boxes.some((f) => overlaps(box, f, 0))) continue;
    out.push({ box, corner });
  }
  return out;
}
