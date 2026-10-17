// A skater's body at time t (pure, no three; the brief's section D, page bims-maps v10): where it
// rides on the park (Office.park) and how, from its line (skate.ts lineOf). Each trick is a short
// sequence of poses, as the prototype's kickflip chronophoto: knees bent, the tail popped, the board
// turning under it in the air, caught, knees bent on landing. Rolls ride from one piece to the next,
// pushing; the mini ramp's moves cross from lip to lip on its transitions; the grinds sit on their
// bar; the bowl carves round its walls; a bail sits it on its bum, laughing, then back on. Between two
// lines it rests on its board at its spot: still, so the loop draws nothing (the battery rule).
// render/index.ts uses it for a pose with a pastime once arrived; bim.ts applies the Rig. Owner: maps-d.
import type { Park, Pose } from '../model';
import { BAIL_S, FEATURE_STAGE, type Move, sinceArrived, skateAt } from '../skate';
import { NO_PROPS, type Rig, type Rot } from './pose';

/** a point of a ride: on the floor (x, z), the surface's height there, a height over it (a pop, an air), and the way it goes */
interface At {
  readonly x: number;
  readonly z: number;
  /** the surface under it (a ramp's transition, a funbox's top, a bar) */
  readonly ys: number;
  /** in the air over the surface */
  readonly air: number;
}

/** the body on the board, before it is placed */
interface Stance {
  readonly knees: number;
  readonly arms: number;
  /** the body's lift over the board */
  readonly up: number;
  /** extra turns: the body's lean back (manual) and the whole bim's spin (a 180, the 900) */
  readonly lean: number;
  readonly spin: number;
  readonly board: Rot;
  /** the board's own height over the feet's (a flip pops it) */
  readonly boardUp: number;
  readonly mouth: Rig['mouth'];
  readonly eyes: number;
  /** sitting on its bum (a bail) */
  readonly sit: boolean;
}

const RIDE: Stance = { knees: 0.5, arms: 1.0, up: 0, lean: 0, spin: 0, board: [0, 0, 0], boardUp: 0, mouth: 'smile', eyes: 1, sit: false };
/** the board's top over the floor: the bim stands on it */
const DECK = 0.1;
const ease = (x: number): number => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const mix = (a: number, b: number, f: number): number => a + (b - a) * f;
const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));
/** a hop's height at f (0..1) through it, `h` at its top */
const hop = (f: number, h: number): number => (f <= 0 || f >= 1 ? 0 : 4 * h * f * (1 - f));

/** the radius of the lone quarter pipe: the vert from its stage */
const qpR = (park: Park, stage: number): number => (stage >= FEATURE_STAGE.vert ? park.qp.r13 : park.qp.r);

/** a transition's height at d (0 at its bottom .. r at its lip): a quarter circle of radius r */
const trans = (d: number, r: number): number => {
  const u = Math.max(0, Math.min(r, d));
  return r - Math.sqrt(Math.max(0, r * r - u * u));
};

/** the mini ramp's surface at x: the left transition, the flat, the right one */
function rampY(park: Park, x: number): number {
  const { xa, xb, r } = park.ramp;
  if (x < xa + r) return trans(xa + r - x, r);
  if (x > xb - r) return trans(x - (xb - r), r);
  return 0;
}

/** where a move rides at f (0..1), its trick's part only (a bail's fall comes after) */
function rideAt(m: Move, park: Park, stage: number, slot: number, f: number): At {
  const lane = (slot % 2 === 0 ? -1 : 1) * 0.35;
  switch (m.on) {
    case 'flat': {
      const b = park.flat;
      const [a, c] = m.side === 1 ? [b.x0, b.x1] : [b.x1, b.x0];
      return { x: mix(a, c, f), z: b.z + lane, ys: 0, air: 0 };
    }
    case 'curb':
    case 'rail':
    case 'ledge': {
      const b = park[m.on];
      // in from the side, popped onto the bar at 0.2, along it, off at 0.8
      const [a, c] = m.side === 1 ? [b.x0 - 0.9, b.x1 + 0.9] : [b.x1 + 0.9, b.x0 - 0.9];
      const x = mix(a, c, f);
      const on = f >= 0.2 && f <= 0.8;
      const zIn = b.z + 0.45;
      const z = f < 0.2 ? mix(zIn, b.z, ease(f / 0.2)) : f > 0.8 ? mix(b.z, zIn, ease((f - 0.8) / 0.2)) : b.z;
      // the pop up onto it, the drop off it
      const air = f < 0.2 ? ease(f / 0.2) * b.h + hop(f / 0.2, 0.15) : f > 0.8 ? (1 - ease((f - 0.8) / 0.2)) * b.h : 0;
      return { x, z, ys: on ? b.h : 0, air: on ? 0 : air };
    }
    case 'stairs': {
      const s = park.stairs;
      const z = (s.z0 + s.z1) / 2 - 0.3;
      // along the deck, the pop at its edge, down past the steps, the landing rolled out
      if (f < 0.3) return { x: mix(s.x0 + 0.4, s.xTop, f / 0.3), z, ys: s.h, air: 0 };
      if (f < 0.8) {
        const u = (f - 0.3) / 0.5;
        const x = mix(s.xTop, s.xBottom + 0.7, u);
        return { x, z, ys: 0, air: mix(s.h, 0, u * u) + hop(u, 0.3) };
      }
      return { x: mix(s.xBottom + 0.7, s.xBottom + 1.9, (f - 0.8) / 0.2), z, ys: 0, air: 0 };
    }
    case 'funbox': {
      const b = park.funbox;
      const [a, c] = m.side === 1 ? [b.x - b.hw - b.run - 0.6, b.x + b.hw + b.run + 0.6] : [b.x + b.hw + b.run + 0.6, b.x - b.hw - b.run - 0.6];
      const x = mix(a, c, f);
      const d = Math.abs(x - b.x);
      const ys = d <= b.hw ? b.h : d <= b.hw + b.run ? b.h * (1 - (d - b.hw) / b.run) : 0;
      return { x, z: b.z + lane * 0.6, ys, air: 0 };
    }
    case 'ramp': {
      const { xa, xb, z0, z1 } = park.ramp;
      // from the lip it starts at to the other one, its trick at the far lip (the last quarter)
      const [from, to] = m.side === 1 ? [xa + 0.05, xb - 0.05] : [xb - 0.05, xa + 0.05];
      const u = ease(Math.min(1, f / 0.75));
      const x = mix(from, to, u);
      return { x, z: (z0 + z1) / 2 + lane, ys: rampY(park, x), air: 0 };
    }
    case 'qp':
    case 'vert': {
      const q = park.qp;
      const r = qpR(park, stage);
      const bottom = q.zLip + r;
      // in from the flat, up the transition to the lip, the air over it, back down
      const out = bottom + 2.2;
      const x = (q.x0 + q.x1) / 2 + lane;
      const z = f < 0.45 ? mix(out, q.zLip + 0.05, ease(f / 0.45)) : f > 0.7 ? mix(q.zLip + 0.05, out, ease((f - 0.7) / 0.3)) : q.zLip + 0.05;
      return { x, z, ys: trans(bottom - z, r), air: 0 };
    }
    case 'bowl': {
      const b = park.bowl;
      // round its walls, one turn a carve; each skater on its own ring (the pool session)
      const k = 0.55 + ((slot * 37) % 30) / 100;
      const th = Math.PI + slot * 0.9 + f * Math.PI * 2;
      return { x: b.x + Math.cos(th) * b.hw * k, z: b.z + Math.sin(th) * b.hd * k, ys: 0.05, air: 0 };
    }
    case null:
    default:
      return { x: park.spots[0]?.x ?? park.area.x0, z: park.spots[0]?.z ?? park.area.z0, ys: 0, air: 0 };
  }
}

/** the body through a trick at f (its trick's part) */
function stanceOf(m: Move, f: number): Stance {
  const k = m.trick;
  const pop = (flip: Rot): Stance => {
    // crouch, pop, the board turns under it in the air, caught, knees bent on the landing
    if (f < 0.25) return { ...RIDE, knees: mix(0.5, 1.1, f / 0.25) };
    if (f < 0.75) {
      const u = (f - 0.25) / 0.5;
      const turn = ease(Math.min(1, u / 0.85));
      return { ...RIDE, knees: 1.1, arms: 1.4, up: hop(u, 0.12), boardUp: hop(u, 0.22), board: [flip[0] * turn, flip[1] * turn, flip[2] * turn] };
    }
    return { ...RIDE, knees: mix(1.0, 0.5, (f - 0.75) / 0.25) };
  };
  switch (k) {
    case 'ollie':
      return pop([0, 0, 0]);
    case 'kickflip':
      return pop([0, 0, Math.PI * 2]);
    case 'heelflip':
      return pop([0, 0, -Math.PI * 2]);
    case 'shove_it':
      return pop([0, Math.PI, 0]);
    case 'tre_flip':
      return pop([0, Math.PI * 2, Math.PI * 2]);
    case 'no_comply': {
      // the front foot down, the board popped up against the back one, then back on
      const u = clamp01((f - 0.2) / 0.6);
      return { ...RIDE, knees: 0.8, arms: 1.3, boardUp: hop(u, 0.25), board: [hop(u, 0.7), 0, 0] };
    }
    case 'manual':
      return { ...RIDE, knees: 0.6, arms: 1.5, lean: -0.25, board: [-0.28 * clamp01(Math.min(f, 1 - f) * 6), 0, 0] };
    case 'fifty':
      return { ...RIDE, knees: 0.7, arms: 1.3 };
    case 'five_o':
      return { ...RIDE, knees: 0.6, arms: 1.4, lean: -0.15, board: [-0.22, 0, 0] };
    case 'nosegrind':
      return { ...RIDE, knees: 0.8, arms: 1.3, lean: 0.15, board: [0.22, 0, 0] };
    case 'boardslide':
      return { ...RIDE, knees: 0.75, arms: 1.4, board: [0, Math.PI / 2, 0], spin: f > 0.2 && f < 0.8 ? Math.PI / 2 : 0 };
    case 'drop_in':
      return { ...RIDE, knees: mix(0.3, 0.8, f), arms: 1.1 };
    case 'pump':
      return { ...RIDE, knees: 0.5 + Math.abs(Math.sin(f * Math.PI * 2)) * 0.5 };
    case 'rock_to_fakie':
    case 'axle_stall': {
      // stalled on the coping, the last quarter
      const u = clamp01((f - 0.75) / 0.25);
      return { ...RIDE, knees: 0.8, arms: 1.2, board: [k === 'rock_to_fakie' ? -0.5 * hop(u, 1) : 0, 0, 0] };
    }
    case 'fs_180':
    case 'bs_180': {
      const u = clamp01((f - 0.7) / 0.3);
      return { ...RIDE, knees: 1.0, arms: 1.3, up: hop(u, 0.35), spin: (k === 'fs_180' ? 1 : -1) * Math.PI * ease(u) };
    }
    case 'carve':
      return { ...RIDE, knees: 0.75, arms: 1.1 };
    case 'fs_air':
    case 'nine': {
      // over the lip: the grab (knees up, a hand down), a half turn; the 900 two and a half
      const u = clamp01((f - 0.4) / 0.35);
      const turns = k === 'nine' ? 2.5 : 0.5;
      return { ...RIDE, knees: u > 0 && u < 1 ? 1.3 : 0.6, arms: 1.0, up: hop(u, k === 'nine' ? 1.3 : 0.6), spin: Math.PI * 2 * turns * ease(u) };
    }
    case 'roll':
      return RIDE;
  }
}

/** where the move takes it in the air (an air over the lip, a 180 over the coping) besides its ride */
const airOf = (m: Move, s: Stance): number => (m.trick === 'fs_air' || m.trick === 'nine' || m.trick === 'fs_180' || m.trick === 'bs_180' ? s.up : 0);

/** its way at a point of the ride: from where it was a moment before */
const wayOf = (a: At, b: At, fallback: number): number => (Math.hypot(b.x - a.x, b.z - a.z) < 1e-4 ? fallback : Math.atan2(b.x - a.x, b.z - a.z));

/** The skater's rig at t: its line's move, or at rest on its board at its spot. Null: no pastime or not arrived. */
export function skateRig(name: string, pose: Pose, park: Park, phase: number): Rig | null {
  const p = pose.seg.pastime;
  if (!p || pose.moving) return null;
  const spot = park.spots[p.slot] ?? park.spots[0];
  if (!spot) return null;
  const now = skateAt(name, p, sinceArrived(pose));
  const m = now.move;
  if (!m) return rest(spot.x, spot.z, spot.face);

  const trickT = m.bail ? Math.max(0.01, m.dur - BAIL_S) : m.dur;
  const f = clamp01(now.into / trickT);
  const prev = now.line.moves[now.line.moves.indexOf(m) - 1];
  const home: At = { x: spot.x, z: spot.z, ys: 0, air: 0 };
  const endOf = (mv: Move | undefined): At => (mv ? rideAt(mv, park, p.stage, p.slot, 1) : home);
  let at: At;
  let before: At;
  if (m.trick === 'roll') {
    // from where the last move ended to where the next one starts (or home): it rides, pushing
    const next = now.line.moves[now.line.moves.indexOf(m) + 1];
    const a = endOf(prev);
    const b = next ? rideAt(next, park, p.stage, p.slot, 0) : home;
    const u = ease(f);
    const lerp = (v: number): At => ({ x: mix(a.x, b.x, v), z: mix(a.z, b.z, v), ys: mix(a.ys + a.air, b.ys + b.air, ease(clamp01(v * 3))), air: 0 });
    at = lerp(u);
    before = lerp(Math.max(0, u - 0.02));
    if (u >= 0.98) before = lerp(0.96);
  } else {
    at = rideAt(m, park, p.stage, p.slot, f);
    before = rideAt(m, park, p.stage, p.slot, Math.max(0, f - 0.02));
    if (f < 0.02) before = endOf(prev);
  }
  let dir = wayOf(before, at, spot.face);
  if (m.trick === 'roll' && f >= 0.98) dir = spot.face;
  const s = m.trick === 'roll' ? push(f, now.into, phase) : stanceOf(m, f);
  // the slope under it along its way: it leans with the ramp, rolls into a carve
  const ds = Math.hypot(at.x - before.x, at.z - before.z);
  const pitch = ds > 1e-4 ? -Math.atan2(at.ys - before.ys, ds) : 0;
  const roll = m.on === 'bowl' && m.trick === 'carve' ? -0.45 : 0;
  const lift = at.ys + at.air + airOf(m, s);
  const bailing = m.bail && now.into > trickT;
  const body = bailing ? bail((now.into - trickT) / BAIL_S) : s;
  return rigFrom(at.x, at.z, dir + body.spin, bailing ? 0 : lift, bailing ? [0, 0] : [Math.max(-1.4, Math.min(1.4, pitch)), roll], body, 'skate');
}

/** a roll's body: riding, a push now and then (the back foot down, then up) */
function push(f: number, into: number, phase: number): Stance {
  const w = Math.sin((into + phase) * 5);
  return { ...RIDE, knees: 0.45, arms: 0.9, up: f < 0.6 && w > 0.6 ? -0.02 : 0 };
}

/** a bail through u (0..1): down on its bum and laughing, then back up on its board */
function bail(u: number): Stance {
  if (u < 0.15) return { ...RIDE, knees: 1.2, arms: 2.2, mouth: 'oh', eyes: 1, board: [0, 0, Math.PI * 0.6 * (u / 0.15)] };
  if (u < 0.8) return { ...RIDE, sit: true, mouth: 'laugh', eyes: 0.3 };
  return { ...RIDE, knees: mix(1.2, 0.5, (u - 0.8) / 0.2), mouth: 'laugh', eyes: 0.3 };
}

/** at rest between two lines: standing at its spot, one foot on its board (still: no frame) */
function rest(x: number, z: number, face: number): Rig {
  const r = rigFrom(x, z, face, 0, [0, 0], { ...RIDE, knees: 0, arms: 0.2 }, 'still');
  return { ...r, y: 0, legL: 0, legR: -0.35, body: [0, 0, 0], head: [0, 0, 0], board: { x: 0.12, y: 0.08, z: 0.25, rot: [0, 0.3, 0] } };
}

/** the Rig from a place and a stance: the body sideways on the board (the prototype's stance), the head ahead */
function rigFrom(x: number, z: number, dir: number, lift: number, tilt: readonly [number, number], s: Stance, motion: Rig['motion']): Rig {
  const k = s.knees;
  const board = { x: 0, y: 0.08 + s.boardUp, z: 0, rot: s.board };
  if (s.sit) {
    return {
      x, z, dir, y: -0.12, body: [-0.5, 0, 0], head: [-0.2, 0, 0], armL: [0, 0, -0.6], armR: [0, 0, 0.6], legL: -1.45, legR: -1.45,
      eyes: s.eyes, mouth: s.mouth, props: { ...NO_PROPS, skate: true }, screen: 0, lamp: true, grey: 0, opacity: 1, motion,
      lift: 0, tilt, board: { x: 0.2, y: 0.08, z: 0.7, rot: [0, 0.5, Math.PI] },
    };
  }
  return {
    x, z, dir, y: DECK + s.up - k * 0.08, body: [s.lean, 1.25, 0], head: [0, -1.0, 0],
    armL: [0, 0, -s.arms], armR: [0, 0, s.arms], legL: k, legR: -k * 0.6,
    eyes: s.eyes, mouth: s.mouth, props: { ...NO_PROPS, skate: true }, screen: 0, lamp: true, grey: 0, opacity: 1, motion,
    lift, tilt, board,
  };
}

