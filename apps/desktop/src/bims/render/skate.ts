// A skater's body at time t (pure, no three; the brief's section D, page bims-maps v10): where it
// rides on the park (Office.park) and how, from its line (skate.ts lineOf). Every point a board takes
// is on a surface or over it (parkpath.ts: the floor, a piece's top, the bowl's carved walls), never
// in a piece (skate.test.ts rides every line). Rolls follow parkpath's routes round the pieces, out of
// the ramp or the bowl first, up the stairs' bank last. The mini ramp: in through its open side, up to
// a lip, then lip to lip, each move's trick at the far lip, turned round at its end (an air over the
// coping, a 180, a stall, a grind along the coping); the quarter pipe (the vert): up to its coping,
// an air or a stall, back down; the bowl: dropped into over its coping, carves round its walls, an air
// out of it; the grinds pop onto their bar from the side; the stairs drop off the deck. A bail sits
// it on its bum where it is (down the ramp's wall first), laughing, then back on. Between two lines
// it rests on its board at its spot: still, so the loop draws nothing (the battery rule). The board
// leans with the slope under it (pitch and roll from parkpath's slopes), upright in the air.
// render/index.ts uses it for a pose with a pastime once arrived; bim.ts applies the Rig. Owner: skate-fix.
import type { Park, Pose, Pt } from '../model';
import {
  GRIND_RUN, along, approachZ, bowlPoint, lengthOf, portIn, portOut, qpPort, qpR, rampPort, rampY, route, slopeAt, stairsEntry, stairsZ, surfaceAt,
  laneOf,
} from '../parkpath';
import { BAIL_S, type Line, type Move, sinceArrived, skateAt } from '../skate';
import { NO_PROPS, type Rig, type Rot } from './pose';

/** a point of a ride: on the floor (x, z), the surface under it, a height over it (a pop, an air), and its heading when the ride says it */
interface At {
  readonly x: number;
  readonly z: number;
  readonly ys: number;
  readonly air: number;
  /** the way the body faces before the trick's spin (absent: the way it goes) */
  readonly dir?: number;
}

/** the body on the board, before it is placed */
interface Stance {
  readonly knees: number;
  readonly arms: number;
  /** the body's lift over the board */
  readonly up: number;
  /** extra turns: the body's lean back (manual) and the whole bim's spin (a 180, an air, the 900) */
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

/** what a move rides in: the park, what is built, its slot, its line and where in it */
interface Ctx {
  readonly park: Park;
  readonly stage: number;
  readonly slot: number;
  readonly line: Line;
  readonly i: number;
}

const RIDE: Stance = { knees: 0.5, arms: 1.0, up: 0, lean: 0, spin: 0, board: [0, 0, 0], boardUp: 0, mouth: 'smile', eyes: 1, sit: false };
/** the board's top over the floor, on its wheels (bim.ts): the bim stands on it */
const DECK = 0.12;
const ease = (x: number): number => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const mix = (a: number, b: number, f: number): number => a + (b - a) * f;
const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));
/** a hop's height at f (0..1) through it, `h` at its top */
const hop = (f: number, h: number): number => (f <= 0 || f >= 1 ? 0 : 4 * h * f * (1 - f));
const headingOf = (dx: number, dz: number): number => Math.atan2(dx, dz);

// ---- the mini ramp ----

/** a ramp move's far lip (its trick there): side 1 rides +x to the right lip */
const lipOf = (park: Park, side: 1 | -1): number => (side === 1 ? park.ramp.xb : park.ramp.xa);
const rampZ = (park: Park, slot: number): number => (park.ramp.z0 + park.ramp.z1) / 2 + laneOf(slot) * 0.8;
/** a grind along the coping: this far along z, towards the ramp's middle */
const GRIND_Z = 0.9;
const rampEndZ = (m: Move, park: Park, slot: number): number => rampZ(park, slot) + (m.trick === 'fifty' ? (m.side === 1 ? -GRIND_Z : GRIND_Z) : 0);
/** where each ramp move's trick starts (0..1 of its ride): the first one rides in through the open side */
const rampTrickAt = (first: boolean): number => (first ? 0.75 : 0.6);
/** where the quarter pipe's trick is (0..1), and the bowl's air (0..1 of its carve) */
const QP_A = 0.45;
const QP_B = 0.7;
const BOWL_IN = 0.3;

/** the move before m within its piece's block (null: m opens it, after its roll) */
const blockPrev = (c: Ctx): Move | null => {
  const p = c.line.moves[c.i - 1];
  return p && p.trick !== 'roll' ? p : null;
};
const blockIndex = (c: Ctx): number => {
  let k = 0;
  for (let j = c.i - 1; j >= 0 && c.line.moves[j]?.trick !== 'roll'; j--) k++;
  return k;
};

function rideRamp(m: Move, c: Ctx, f: number): At {
  const { park, slot } = c;
  const { r } = park.ramp;
  const s = m.side;
  const to = lipOf(park, s);
  const zc = rampZ(park, slot);
  const head = headingOf(s, 0);
  const prev = blockPrev(c);
  const fa = rampTrickAt(prev === null);
  if (f < fa) {
    if (prev === null) {
      // in from the floor through the open side, round onto the flat bottom, up to the lip
      const port = rampPort(park, slot);
      const g = f / fa;
      if (g < 0.4) {
        const t = g / 0.4;
        const u = 1 - t;
        const x = u * u * port.x + 2 * u * t * port.x + t * t * (port.x + s * 1.0);
        const z = u * u * port.z + 2 * u * t * zc + t * t * zc;
        return { x, z, ys: surfaceAt(park, c.stage, x, z), air: 0 };
      }
      const x = mix(port.x + s * 1.0, to, ease((g - 0.4) / 0.6));
      return { x, z: zc, ys: rampY(park, x), air: 0, dir: head };
    }
    // from the lip it stands on (the foot after a bail) down, across, up to the far lip
    const x0 = prev.bail ? lipOf(park, prev.side) - prev.side * r : lipOf(park, prev.side);
    const u = ease(f / fa);
    const x = mix(x0, to, u);
    return { x, z: mix(rampEndZ(prev, park, slot), zc, u), ys: rampY(park, x), air: 0, dir: head };
  }
  const u = (f - fa) / (1 - fa);
  const stall = (d: number): At => ({ x: to + s * d * clamp01(Math.min(u, 1 - u) * 6), z: zc, ys: r, air: 0, dir: head });
  switch (m.trick) {
    case 'fs_air':
      return { x: to, z: zc, ys: r, air: hop(u, 1.0), dir: head };
    case 'fs_180':
    case 'bs_180':
      return { x: to, z: zc, ys: r, air: hop(u, 0.6), dir: head };
    case 'pump':
      return { x: to, z: zc, ys: r, air: hop(u, 0.15), dir: head };
    case 'fifty':
      return { x: to, z: zc + (s === 1 ? -GRIND_Z : GRIND_Z) * ease(u), ys: r, air: 0, dir: head };
    case 'rock_to_fakie':
      return stall(0.12);
    default:
      // a stall on the deck past the coping (the drop in's too)
      return stall(0.18);
  }
}

// ---- the quarter pipe, the vert ----

function rideQp(m: Move, c: Ctx, f: number): At {
  const { park, stage, slot } = c;
  const q = park.qp;
  const r = qpR(park, stage);
  const port = qpPort(park, stage, slot);
  // facing up its wall (-z); the trick's spin turns it back down
  const dir = Math.PI;
  const x = port.x;
  if (f < QP_A) {
    const z = mix(port.z, q.zLip, ease(f / QP_A));
    return { x, z, ys: surfaceAt(park, stage, x, z), air: 0, dir };
  }
  if (f > QP_B) {
    const z = mix(q.zLip, port.z, ease((f - QP_B) / (1 - QP_B)));
    return { x, z, ys: surfaceAt(park, stage, x, z), air: 0, dir };
  }
  const u = (f - QP_A) / (QP_B - QP_A);
  if (m.trick === 'axle_stall') return { x, z: q.zLip - 0.15 * clamp01(Math.min(u, 1 - u) * 6), ys: r, air: 0, dir };
  return { x, z: q.zLip, ys: r, air: hop(u, m.trick === 'nine' ? 1.4 : 0.85), dir };
}

// ---- the bowl ----

/** a carve's inset: deep in the bowl at its ends, up the wall at its middle; an air goes up to the coping */
const bowlD = (air: boolean, g: number): number => (air ? 0.75 - 0.72 * Math.sin(Math.PI * g) : 0.75 - 0.45 * Math.sin(Math.PI * g));
const bowlTh = (c: Ctx, k: number): number => Math.PI + c.slot * 0.9 + k * Math.PI;

function rideBowl(m: Move, c: Ctx, f: number): At {
  const { park, stage } = c;
  const b = park.bowl;
  const k = blockIndex(c);
  const first = k === 0;
  const th0 = bowlTh(c, k);
  if (first && f < BOWL_IN) {
    // dropped in over the coping from its port
    const a = portIn(park, stage, 'bowl', m.side, c.slot);
    const p = bowlPoint(b, bowlD(false, 0), th0);
    const u = f / BOWL_IN;
    const x = mix(a.x, p.x, u);
    const z = mix(a.z, p.z, u);
    return { x, z, ys: surfaceAt(park, stage, x, z), air: 0 };
  }
  const g = first ? (f - BOWL_IN) / (1 - BOWL_IN) : f;
  const air = m.trick === 'fs_air';
  const p = bowlPoint(b, bowlD(air, g), th0 + Math.PI * g);
  return { x: p.x, z: p.z, ys: surfaceAt(park, stage, p.x, p.z), air: air ? hop((g - 0.35) / 0.3, 0.8) : 0 };
}

// ---- the rest of the pieces ----

/** where a move rides at f (0..1), its trick's part only (a bail's fall comes after) */
function rideAt(m: Move, c: Ctx, f: number): At {
  const { park, stage, slot } = c;
  switch (m.on) {
    case 'flat':
    case 'funbox': {
      const a = portIn(park, stage, m.on, m.side, slot);
      const b = portOut(park, stage, m.on, m.side, slot);
      const x = mix(a.x, b.x, f);
      return { x, z: a.z, ys: surfaceAt(park, stage, x, a.z), air: 0 };
    }
    case 'curb':
    case 'rail':
    case 'ledge': {
      const b = park[m.on];
      const zA = approachZ(park, m.on);
      const [xs, xe] = m.side === 1 ? [b.x0 - GRIND_RUN, b.x1 + GRIND_RUN] : [b.x1 + GRIND_RUN, b.x0 - GRIND_RUN];
      const x = mix(xs, xe, f);
      if (f < 0.2) {
        // popped up first, then onto the bar
        const u = f / 0.2;
        return { x, z: mix(zA, b.z, ease((u - 0.3) / 0.7)), ys: 0, air: b.h * ease(u / 0.5) + hop(u, 0.15) };
      }
      if (f > 0.8) {
        // off the bar's side first, then down
        const u = (f - 0.8) / 0.2;
        return { x, z: mix(b.z, zA, ease(u / 0.7)), ys: 0, air: b.h * (1 - ease((u - 0.5) / 0.5)) + hop(u, 0.12) };
      }
      return { x, z: b.z, ys: b.h, air: 0 };
    }
    case 'stairs': {
      const s = park.stairs;
      const sz = stairsZ(s);
      const e = stairsEntry(park);
      const start = e[e.length - 1] ?? { x: s.xTop - 0.5, z: sz };
      const land = s.xBottom + 0.5;
      // along the deck to its edge, the pop, down past the steps, the landing rolled out
      if (f < 0.2) return { x: mix(start.x, s.xTop, f / 0.2), z: sz, ys: s.h, air: 0 };
      if (f < 0.8) {
        const u = (f - 0.2) / 0.6;
        return { x: mix(s.xTop, land, u), z: sz, ys: 0, air: s.h * (1 - u * u) + hop(u, 0.3) };
      }
      return { x: mix(land, portOut(park, stage, 'stairs', 1, slot).x, (f - 0.8) / 0.2), z: sz, ys: 0, air: 0 };
    }
    case 'ramp':
      return rideRamp(m, c, f);
    case 'qp':
    case 'vert':
      return rideQp(m, c, f);
    case 'bowl':
      return rideBowl(m, c, f);
    case null:
      return { x: park.area.x0, z: park.area.z0, ys: 0, air: 0 };
  }
}

/** where a move leaves it: its ride's end, or down the ramp's wall after a bail there */
function endOf(m: Move, c: Ctx): Pt {
  const a = rideAt(m, c, 1);
  if (m.on === 'ramp' && m.bail) return { x: lipOf(c.park, m.side) - m.side * c.park.ramp.r, z: a.z };
  return { x: a.x, z: a.z };
}

/** a bail's place at b (0..1 through it): where the trick ended; on the ramp it slides down the wall first */
function bailAt(m: Move, c: Ctx, b: number): At {
  const a = rideAt(m, c, 1);
  if (m.on !== 'ramp') return { ...a, ys: surfaceAt(c.park, c.stage, a.x, a.z), air: 0 };
  const to = lipOf(c.park, m.side);
  const x = mix(to, to - m.side * c.park.ramp.r, ease(b / 0.3));
  return { x, z: a.z, ys: rampY(c.park, x), air: 0, dir: a.dir };
}

/** a roll's way: out of the piece it rode (the ramp's open side, over the bowl's coping), round the pieces, up the stairs' bank */
function rollWay(c: Ctx, home: Pt): Pt[] {
  const { park, stage, slot, line, i } = c;
  const prev = line.moves[i - 1];
  const m = line.moves[i] as Move;
  const pts: Pt[] = [];
  let a: Pt = home;
  if (prev && prev.on) {
    const e = endOf(prev, { ...c, i: i - 1 });
    a = portOut(park, stage, prev.on, prev.side, slot);
    if (prev.on === 'ramp') {
      const { xa, xb, r } = park.ramp;
      const fx = Math.max(xa + r + 0.3, Math.min(xb - r - 0.3, e.x));
      pts.push(e, { x: fx, z: e.z }, { x: a.x, z: e.z });
    } else if (prev.on === 'bowl') {
      const b = park.bowl;
      const th = Math.atan2(a.z - b.z, a.x - b.x);
      pts.push(e, bowlPoint(b, 0.45, th), bowlPoint(b, 0, th));
    }
  }
  const b = m.on ? portIn(park, stage, m.on, m.side, slot) : home;
  pts.push(...route(park, stage, a, b));
  if (m.on === 'stairs') pts.push(...stairsEntry(park).slice(1));
  return pts;
}

/** the body through a trick at f (its whole move) and u (its trick's part, at a lip or in the air) */
function stanceOf(m: Move, f: number, u: number): Stance {
  const k = m.trick;
  const pop = (flip: Rot): Stance => {
    // crouch, pop, the board turns under it in the air, caught, knees bent on the landing
    if (f < 0.25) return { ...RIDE, knees: mix(0.5, 1.1, f / 0.25) };
    if (f < 0.75) {
      const v = (f - 0.25) / 0.5;
      const turn = ease(Math.min(1, v / 0.85));
      return { ...RIDE, knees: 1.1, arms: 1.4, up: hop(v, 0.12), boardUp: hop(v, 0.22), board: [flip[0] * turn, flip[1] * turn, flip[2] * turn] };
    }
    return { ...RIDE, knees: mix(1.0, 0.5, (f - 0.75) / 0.25) };
  };
  // a turn at a lip or the coping: spun round by the trick's end
  const kick = (turn: number, a: number, b: number): number => turn * ease((u - a) / (b - a));
  const air = (turn: number): Stance => ({ ...RIDE, knees: u > 0.1 && u < 0.9 ? 1.3 : 0.6, arms: u > 0.15 && u < 0.85 ? 1.9 : 1.1, spin: turn * ease(u) });
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
      const v = clamp01((f - 0.2) / 0.6);
      return { ...RIDE, knees: 0.8, arms: 1.3, boardUp: hop(v, 0.25), board: [hop(v, 0.7), 0, 0] };
    }
    case 'manual':
      return { ...RIDE, knees: 0.6, arms: 1.5, lean: -0.25, board: [-0.28 * clamp01(Math.min(f, 1 - f) * 6), 0, 0] };
    case 'fifty':
      if (m.on === 'ramp') {
        // along the coping, the board along it, then turned back in
        const spin = u < 0.15 ? (Math.PI / 2) * ease(u / 0.15) : u < 0.85 ? Math.PI / 2 : Math.PI / 2 + (Math.PI / 2) * ease((u - 0.85) / 0.15);
        return { ...RIDE, knees: 0.75, arms: 1.4, spin };
      }
      return { ...RIDE, knees: 0.7, arms: 1.3 };
    case 'five_o':
      return { ...RIDE, knees: 0.6, arms: 1.4, lean: -0.15, board: [-0.22, 0, 0] };
    case 'nosegrind':
      return { ...RIDE, knees: 0.8, arms: 1.3, lean: 0.15, board: [0.22, 0, 0] };
    case 'boardslide':
      return { ...RIDE, knees: 0.75, arms: 1.4, board: [0, Math.PI / 2, 0], spin: f > 0.2 && f < 0.8 ? Math.PI / 2 : 0 };
    case 'drop_in':
    case 'axle_stall':
      return { ...RIDE, knees: 0.8, arms: 1.2, spin: kick(Math.PI, 0.3, 0.8) };
    case 'pump':
      return { ...RIDE, knees: 0.5 + Math.abs(Math.sin(f * Math.PI * 2)) * 0.5, spin: kick(Math.PI, 0.1, 0.9) };
    case 'rock_to_fakie':
      // the front truck over the coping, rocked, then turned back in
      return { ...RIDE, knees: 0.8, arms: 1.2, board: [-0.5 * hop(clamp01(u / 0.5), 1), 0, 0], spin: kick(Math.PI, 0.45, 0.95) };
    case 'fs_180':
      return { ...RIDE, knees: 1.0, arms: 1.3, spin: Math.PI * ease(u) };
    case 'bs_180':
      return { ...RIDE, knees: 1.0, arms: 1.3, spin: -Math.PI * ease(u) };
    case 'carve':
      return { ...RIDE, knees: 0.75, arms: 1.1 };
    case 'fs_air':
      // over the coping: knees up, a hand grabbing, turned round (a full turn in the bowl, which it carves on)
      return air(m.on === 'bowl' ? Math.PI * 2 : Math.PI);
    case 'nine':
      return air(Math.PI * 5);
    case 'roll':
      return RIDE;
  }
}

/** the trick's part of a move (0..1): at the lip, the coping or in the air; f elsewhere */
function trickU(m: Move, c: Ctx, f: number): number {
  switch (m.on) {
    case 'ramp': {
      const a = rampTrickAt(blockPrev(c) === null);
      return clamp01((f - a) / (1 - a));
    }
    case 'qp':
    case 'vert':
      return clamp01((f - QP_A) / (QP_B - QP_A));
    case 'bowl': {
      const g = blockIndex(c) === 0 ? (f - BOWL_IN) / (1 - BOWL_IN) : f;
      return clamp01((g - 0.35) / 0.3);
    }
    default:
      return f;
  }
}

/** its way at a point of the ride: from where it was a moment before */
const wayOf = (a: Pt, b: Pt, fallback: number): number => (Math.hypot(b.x - a.x, b.z - a.z) < 1e-4 ? fallback : Math.atan2(b.x - a.x, b.z - a.z));

/** the board's half length: its ends sit on the slope, as its wheels do */
const HALF = 0.42;

/**
 * The board seated on the slope under it: its height (the chord between the slope under its two
 * ends, over a transition's sag), its pitch along its heading (that chord's) and its roll across (the
 * slope's); upright and at its ride's height in the air.
 */
function seatOf(park: Park, stage: number, at: At, head: number): { base: number; tilt: [number, number] } {
  const sx = Math.sin(head);
  const sz = Math.cos(head);
  // a rigid board: tilted, its ends come closer seen from above; a few rounds settle them on the slope
  const ends = (h: number): [number, number] => [surfaceAt(park, stage, at.x + sx * h, at.z + sz * h), surfaceAt(park, stage, at.x - sx * h, at.z - sz * h)];
  // the half length seen from above that its own tilt gives (h = HALF cos(tilt)), by halving
  let lo = 0;
  let hi = HALF;
  for (let i = 0; i < 14; i++) {
    const mid = (lo + hi) / 2;
    const [a, b] = ends(mid);
    if (Math.hypot(mid * 2, a - b) > 2 * HALF) hi = mid;
    else lo = mid;
  }
  const h = lo;
  const [front, back] = ends(h);
  const e = 0.04;
  const gx = (slopeAt(park, stage, at.x + e, at.z) - slopeAt(park, stage, at.x - e, at.z)) / (2 * e);
  const gz = (slopeAt(park, stage, at.x, at.z + e) - slopeAt(park, stage, at.x, at.z - e)) / (2 * e);
  const across = gx * sz - gz * sx;
  const k = clamp01(1 - at.air / 0.3);
  const lim = (v: number): number => Math.max(-1.35, Math.min(1.35, v));
  const base = Math.max(at.ys, mix(at.ys, (front + back) / 2, k));
  return { base, tilt: [lim(-Math.atan2(front - back, 2 * h)) * k, lim(Math.atan(across)) * k] };
}

/** The skater's rig at t: its line's move, or at rest on its board at its spot. Null: no pastime or not arrived. */
export function skateRig(name: string, pose: Pose, park: Park, phase: number): Rig | null {
  const p = pose.seg.pastime;
  if (!p || pose.moving) return null;
  const spot = park.spots[p.slot] ?? park.spots[0];
  if (!spot) return null;
  const now = skateAt(name, p, sinceArrived(pose), park);
  const m = now.move;
  if (!m) return rest(spot.x, spot.z, spot.face);

  const c: Ctx = { park, stage: p.stage, slot: p.slot, line: now.line, i: now.line.moves.indexOf(m) };
  const trickT = m.bail ? Math.max(0.01, m.dur - BAIL_S) : m.dur;
  const f = clamp01(now.into / trickT);
  let at: At;
  let before: Pt;
  let dir: number;
  if (m.trick === 'roll') {
    // from where the last move left it to where the next one starts (or home): it rides, pushing
    const way = rollWay(c, spot);
    const len = lengthOf(way);
    const s = ease(f) * len;
    const pt = along(way, s);
    at = { x: pt.x, z: pt.z, ys: surfaceAt(park, p.stage, pt.x, pt.z), air: 0 };
    before = s > 0.05 ? along(way, s - 0.05) : pt;
    const ahead = along(way, s + 0.05);
    dir = m.on === null && f >= 0.98 ? spot.face : wayOf(before, ahead, spot.face);
  } else {
    const bailing = m.bail && now.into > trickT;
    at = bailing ? bailAt(m, c, (now.into - trickT) / BAIL_S) : rideAt(m, c, f);
    const b = rideAt(m, c, Math.max(0, f - 0.02));
    before = f < 0.02 && c.i > 0 ? rideAt(m, c, 0) : b;
    dir = at.dir ?? wayOf(before, at, wayOf(rideAt(m, c, f), rideAt(m, c, Math.min(1, f + 0.02)), spot.face));
  }
  const bailing = m.bail && now.into > trickT;
  const s = m.trick === 'roll' ? push(f, now.into, phase) : stanceOf(m, f, trickU(m, c, f));
  const body = bailing ? bail((now.into - trickT) / BAIL_S) : s;
  const head = dir + body.spin;
  const seat = seatOf(park, p.stage, at, head);
  const tilt = seat.tilt;
  // never an end of the board in a surface (an air leaving a wall, a bail on a slope): lifted clear
  const pitch = tilt[0];
  const hx = Math.sin(head) * Math.cos(pitch) * HALF;
  const hz = Math.cos(head) * Math.cos(pitch) * HALF;
  const dy = -Math.sin(pitch) * HALF;
  let lift = seat.base + at.air;
  for (const k of [1, -1]) lift = Math.max(lift, surfaceAt(park, p.stage, at.x + k * hx, at.z + k * hz) - k * dy);
  return rigFrom(at.x, at.z, head, lift, tilt, body, 'skate');
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
      lift, tilt, board: { x: 0.2, y: 0.08, z: 0.7, rot: [0, 0.5, Math.PI] },
    };
  }
  return {
    x, z, dir, y: DECK + s.up - k * 0.08, body: [s.lean, 1.25, 0], head: [0, -1.0, 0],
    armL: [0, 0, -s.arms], armR: [0, 0, s.arms], legL: k, legR: -k * 0.6,
    eyes: s.eyes, mouth: s.mouth, props: { ...NO_PROPS, skate: true }, screen: 0, lamp: true, grey: 0, opacity: 1, motion,
    lift, tilt, board,
  };
}
