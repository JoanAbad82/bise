// Each object's hover move (Gabriel, the plugins banner: « au hover des objects, il devrait y avoir
// une petite animation (différente pour chaque object) pour montrer qu'ils sont cliquables »): one
// short move, HOVER_MS long, its own for every object (its kind, its size, its count), that ends
// where it began, so the room draws no frame once it is done. The globe spins, the dog hops, the
// plant sways, the arcade shakes, the scooter rocks forward. Reduced motion: none (the caller).
// Pure, no three. Owner: bims-life.
import { FEET, type FootOf } from './feet';
import { OBJ_IDS, type ObjId } from './ids';

/** how long one hover move lasts, ms */
export const HOVER_MS = 700;

/**
 * a move's kind: hop (lift a, n hops), wiggle (a turn of a rad back and forth, n times), spin (a
 * whole turns), turn (a rad there and back once), squash (a squash and stretch, n times), nod
 * (tips forward a rad, n times), sway (leans aside a rad, n times), shake (side to side a, n
 * times), pulse (swells by a, n times)
 */
export type HoverKind = 'hop' | 'wiggle' | 'spin' | 'turn' | 'squash' | 'nod' | 'sway' | 'shake' | 'pulse';

export interface HoverMove {
  readonly kind: HoverKind;
  readonly a: number;
  readonly n: number;
}

/** where a move has the object at one time: added to its rest pose */
export interface HoverPose {
  /** up, floor units */
  readonly lift: number;
  /** aside, floor units (along the object's own x) */
  readonly dx: number;
  /** its turns, rad: about y, x (tips forward), z (leans aside) */
  readonly yaw: number;
  readonly pitch: number;
  readonly roll: number;
  /** its scale's factors */
  readonly sx: number;
  readonly sy: number;
  readonly sz: number;
}

export const REST: HoverPose = { lift: 0, dx: 0, yaw: 0, pitch: 0, roll: 0, sx: 1, sy: 1, sz: 1 };

const m = (kind: HoverKind, a: number, n = 1): HoverMove => ({ kind, a, n });

/** every object's move: what it does, as it would (render/objects/hover.test.ts: no two the same) */
export const HOVER: Readonly<Record<ObjId, HoverMove>> = {
  // games
  chess: m('wiggle', 0.12, 2), pingpong: m('hop', 0.06, 3), arcade: m('shake', 0.03, 6), pinball: m('nod', 0.08, 3), babyfoot: m('shake', 0.04, 4),
  billiards: m('sway', 0.05, 2), go: m('pulse', 0.05, 1), jenga: m('sway', 0.1, 3), claw: m('hop', 0.1, 1), cards: m('turn', 0.6),
  // music
  piano: m('squash', 0.08, 2), jukebox: m('pulse', 0.06, 4), turntable: m('spin', 1), guitar: m('sway', 0.12, 2), drums: m('hop', 0.05, 4),
  synth: m('pulse', 0.04, 3), gramophone: m('wiggle', 0.1, 3), cello: m('sway', 0.08, 3), mic: m('nod', 0.15, 2), harp: m('sway', 0.06, 1),
  // knowledge
  shelf: m('squash', 0.04, 1), library: m('nod', 0.04, 1), globe: m('spin', 2), telescope: m('nod', 0.2, 1), map: m('wiggle', 0.06, 1),
  lectern: m('nod', 0.1, 2), blackboard: m('shake', 0.02, 3), dinosaur: m('hop', 0.15, 2), hourglass: m('turn', Math.PI), orrery: m('turn', 1.2),
  // workshop
  easel: m('sway', 0.07, 2), printer: m('shake', 0.025, 8), printer3d: m('pulse', 0.03, 5), workbench: m('squash', 0.03, 2), sewing: m('shake', 0.015, 10),
  pottery: m('spin', 3), loom: m('wiggle', 0.05, 4), press: m('squash', 0.1, 3), electronics: m('pulse', 0.05, 2), robotarm: m('wiggle', 0.2, 1),
  // kitchen
  espresso: m('shake', 0.02, 5), pizzaoven: m('pulse', 0.04, 2), grill: m('hop', 0.07, 2), popcorn: m('hop', 0.04, 5), icecream: m('wiggle', 0.08, 2),
  drinks: m('sway', 0.05, 3), juicebar: m('shake', 0.025, 4), teaset: m('squash', 0.06, 1), candy: m('turn', 0.4), fridge: m('shake', 0.03, 2),
  // garden
  plant: m('sway', 0.09, 2), campfire: m('pulse', 0.08, 3), pond: m('pulse', 0.02, 2), beehive: m('shake', 0.02, 7), veggies: m('hop', 0.05, 1),
  swing: m('nod', 0.25, 2), hammock: m('sway', 0.15, 2), fountain: m('pulse', 0.03, 4), birdhouse: m('wiggle', 0.15, 2), treehouse: m('sway', 0.03, 1),
  glasshouse: m('pulse', 0.02, 1),
  // animals
  cat: m('squash', 0.12, 1), catwalk: m('hop', 0.03, 2), cushion: m('squash', 0.15, 1), dog: m('hop', 0.12, 3), aquarium: m('wiggle', 0.04, 3),
  parrot: m('nod', 0.18, 3), hens: m('hop', 0.06, 4), tortoise: m('wiggle', 0.04, 1), rabbit: m('hop', 0.18, 2), hamster: m('shake', 0.03, 4),
  goldfish: m('wiggle', 0.03, 5), ducks: m('sway', 0.1, 4),
  // comms
  mailbox: m('hop', 0.1, 2), booth: m('shake', 0.02, 6), visio: m('nod', 0.06, 2), radio: m('pulse', 0.05, 5), dovecote: m('hop', 0.08, 2),
  rotary: m('turn', 0.5), telegraph: m('shake', 0.01, 8), dish: m('wiggle', 0.25, 1), pneumatic: m('hop', 0.05, 3), switchboard: m('pulse', 0.03, 3),
  // machines
  rack: m('pulse', 0.03, 6), macdesk: m('nod', 0.05, 1), retro: m('shake', 0.025, 3), crt: m('squash', 0.05, 2), snacks: m('shake', 0.035, 5),
  photobooth: m('pulse', 0.04, 1), robot: m('hop', 0.08, 3), drone: m('hop', 0.2, 1), clock: m('wiggle', 0.1, 6), dashboard: m('pulse', 0.05, 3),
  // travel
  scooter: m('nod', 0.1, 1), bike: m('nod', 0.07, 2), hoop: m('spin', 1.0, 2), surf: m('sway', 0.12, 1), kayak: m('sway', 0.14, 2),
  balloon: m('hop', 0.25, 1), rocket: m('hop', 0.3, 1), car: m('squash', 0.07, 2), yoga: m('squash', 0.1, 1), trampoline: m('squash', 0.2, 2),
  // office
  calendar: m('sway', 0.04, 2), files: m('nod', 0.03, 2), trophies: m('wiggle', 0.1, 1), extinguisher: m('wiggle', 0.06, 2), charts: m('sway', 0.03, 3),
  packing: m('hop', 0.07, 1),
};

/** a move at t (0..1 of HOVER_MS): REST at 0 and at 1, so the room stops on its rest frame. Pure. */
export function hoverAt(mv: HoverMove, t: number): HoverPose {
  if (!(t > 0) || t >= 1) return REST;
  // its swing grows and dies away over the move
  const env = Math.sin(Math.PI * t);
  const wave = Math.sin(2 * Math.PI * mv.n * t) * env;
  switch (mv.kind) {
    case 'hop':
      return { ...REST, lift: mv.a * Math.abs(Math.sin(Math.PI * mv.n * t)) };
    case 'wiggle':
      return { ...REST, yaw: mv.a * wave };
    case 'spin': {
      // eased in and out: it ends a whole number of turns round, its rest pose
      const e = t * t * (3 - 2 * t);
      return { ...REST, yaw: 2 * Math.PI * mv.a * e };
    }
    case 'turn':
      return { ...REST, yaw: mv.a * env };
    case 'squash': {
      const sy = 1 - mv.a * wave;
      const sxz = 1 / Math.sqrt(sy);
      return { ...REST, sx: sxz, sy, sz: sxz };
    }
    case 'nod':
      return { ...REST, pitch: mv.a * wave };
    case 'sway':
      return { ...REST, roll: mv.a * wave };
    case 'shake':
      return { ...REST, dx: mv.a * wave };
    case 'pulse': {
      const k = 1 + mv.a * Math.abs(Math.sin(Math.PI * mv.n * t));
      return { ...REST, sx: k, sy: k, sz: k };
    }
  }
}

/** the least a move carries its farthest corner, floor units: ~3 px at the plugins banner's 1x fit (designer m_41950) */
export const MIN_TRAVEL = 0.07;

/** how far a move carries the farthest corner of a w x d x h box (its foot, base at the floor's middle). Pure. */
export function travelOf(mv: HoverMove, f: Pick<FootOf, 'w' | 'd' | 'h'>): number {
  const corners: [number, number, number][] = [];
  for (const x of [-f.w / 2, f.w / 2]) for (const y of [0, f.h]) for (const z of [-f.d / 2, f.d / 2]) corners.push([x, y, z]);
  let most = 0;
  for (let i = 1; i < 50; i++) {
    const p = hoverAt(mv, i / 50);
    const [cx, sx] = [Math.cos(p.pitch), Math.sin(p.pitch)];
    const [cy, sy] = [Math.cos(p.yaw), Math.sin(p.yaw)];
    const [cz, sz] = [Math.cos(p.roll), Math.sin(p.roll)];
    for (const [x0, y0, z0] of corners) {
      // scaled about its base, turned (three's XYZ: Rx Ry Rz), moved
      let x = x0 * p.sx;
      let y = y0 * p.sy;
      let z = z0 * p.sz;
      [x, y] = [x * cz - y * sz, x * sz + y * cz];
      [x, z] = [x * cy + z * sy, -x * sy + z * cy];
      [y, z] = [y * cx - z * sx, y * sx + z * cx];
      most = Math.max(most, Math.hypot(x + p.dx - x0, y + p.lift - y0, z - z0));
    }
  }
  return most;
}

/**
 * each object's move as played: its own, its swing raised until its farthest corner travels
 * MIN_TRAVEL (a big shelf's nod reads as much as a mug's hop); two raised to the same, the later
 * one (OBJ_IDS's order) a little more, so each object keeps a move of its own
 */
export const MOVES: Readonly<Record<ObjId, HoverMove>> = (() => {
  const taken = new Set<string>();
  const out: Partial<Record<ObjId, HoverMove>> = {};
  for (const id of OBJ_IDS) {
    const mv = HOVER[id];
    const t = travelOf(mv, FEET[id]);
    const k = t > 0 && t < MIN_TRAVEL ? MIN_TRAVEL / t : 1;
    let a = Math.round(mv.a * k * 1000) / 1000;
    while (taken.has(`${mv.kind} ${String(a)} ${String(mv.n)}`)) a = Math.round((a + 0.006) * 1000) / 1000;
    taken.add(`${mv.kind} ${String(a)} ${String(mv.n)}`);
    out[id] = { ...mv, a };
  }
  return out as Record<ObjId, HoverMove>;
})();
