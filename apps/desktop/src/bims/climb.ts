// les bims' bouldering (the climbing gym map, bims' brief « Climbers »): climbing is how a map with a
// gym (Office.gym) draws an idle bim, never a fact, so the activity stays 'nap' or 'snack' and this
// module only adds a pastime on top, as skate.ts does. Who climbs (`climbers`: 2 at most, never main,
// picked by a hash window; nobody under reduced motion), and what a climber does (`lineOf`): a line
// of 8-12 s on one problem of its run (climbwall.ts routes): it walks onto the mats, chalks up, climbs
// stance after stance and tops out (rings the bell once it is built, else a fist up), then drops onto
// the mat and walks back; ~1 line in 8 it slips off a move instead, falls onto the mat and sits there
// in a puff of chalk. Then it rests at its spot at least as long, still (no frame: the battery rule).
// Pure: the clock and the stage are passed in, the falls and the problems seeded by the bim's name
// and the line's number. render/climb.ts poses a climber from a line. Owner: bims-climb.
import { hash } from './activity';
import type { Activity, BimFrame, ClimbPastime, FunIn, Gym, Office, Pose, Pt } from './model';
import { walkTime } from './avoid';
import { MAT_H, MOVES, type Route, add, mul, placeAt, rng, routes, stancesOf, unit } from './climbwall';

/** the base's step back from where an upright body would just clear the wall (its hands chalk up in front) */
const BASE_OUT = 0.15;

/** the bell over every problem's top comes with this stage (climb.ts top-outs ring it) */
export const BELL_STAGE = 7;
/** the golden hold at the big wall's top */
export const GOLDEN_STAGE = 14;
/** a line's length (s), the session's: the rest after a line is at least as long as it */
export const LINE_MIN = 8;
export const LINE_MAX = 12;
export const SESSION_S = 24;
/** at most this many climb at once; who climbs changes with this window (s) */
export const MAX_CLIMBERS = 2;
export const WINDOW_S = 600;
/** about one line in this many ends in a fall */
export const FALL_ONE_IN = 8;
/** the beats' lengths (s): a move's reach (every limb off, the body up) then its hold */
export const BEAT = {
  chalk: 0.8, mount: 0.5, reach: 0.4, hold: 0.5, bell: 1.2, cheer: 0.8, drop: 0.7, land: 0.4, slip: 0.35, fall: 0.7, sit: 1.4, up: 0.5,
} as const;
/** walking on the floor and the mats (tiles per second), its slowest past a long line */
export const WALK = 2.2;

/** a point a climber stands at, on the floor or on a mat (y its feet), the way it faces */
export interface Stand {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly dir: number;
}

/** one beat of a line, from the line's start (t0) for dur s */
export type Beat =
  | { readonly k: 'walk'; readonly t0: number; readonly dur: number; readonly from: Stand; readonly to: Stand }
  | { readonly k: 'chalk'; readonly t0: number; readonly dur: number }
  | { readonly k: 'mount'; readonly t0: number; readonly dur: number }
  /** from stance `to - 1` to stance `to`: the reach, then the hold */
  | { readonly k: 'move'; readonly t0: number; readonly dur: number; readonly to: number }
  | { readonly k: 'bell' | 'cheer'; readonly t0: number; readonly dur: number }
  /** off the wall from stance `from`: dropping from the top (lands on its feet), or slipping then falling (lands on its bum) */
  | { readonly k: 'drop' | 'slip' | 'fall'; readonly t0: number; readonly dur: number; readonly from: number }
  | { readonly k: 'land' | 'sit' | 'up'; readonly t0: number; readonly dur: number };

export interface Line {
  readonly route: number;
  readonly beats: readonly Beat[];
  readonly len: number;
  /** it falls (else it tops out) */
  readonly fall: boolean;
  /** it rings the bell at the top (the bell built) */
  readonly bell: boolean;
  /** where it stands on the mat before mounting, and where it lands */
  readonly base: Stand;
  readonly landing: Stand;
}

/** the problems a rest spot climbs */
export const routesOf = (g: Gym, slot: number): Route[] => routes(g).filter((r) => r.slot === slot && stancesOf(r).length === MOVES + 1);

/**
 * Who climbs now, by name: idle bims only (nap or snack), never main, MAX_CLIMBERS at most, picked
 * by a hash of their name and the 10-min window. None without a gym or under reduced motion.
 */
export function climbers(acts: ReadonlyMap<string, Activity>, o: Office, t: number, fun: FunIn | undefined): ReadonlyMap<string, ClimbPastime> {
  const out = new Map<string, ClimbPastime>();
  const gym = o.gym;
  if (!fun || fun.reduced || !gym || gym.spots.length === 0) return out;
  const win = Math.floor(t / WINDOW_S);
  const idle = [...acts].filter(([name, a]) => (a.k === 'nap' || a.k === 'snack') && o.desks.has(name)).map(([name]) => name);
  const cap = Math.min(MAX_CLIMBERS, gym.spots.length);
  const chosen = idle
    .map((name) => ({ name, h: hash(`${name}|climb|${String(win)}`) }))
    .sort((a, b) => a.h - b.h || (a.name < b.name ? -1 : 1))
    .slice(0, cap)
    .map((c) => c.name)
    .sort();
  chosen.forEach((name, slot) => out.set(name, { kind: 'climb', slot, stage: fun.stage }));
  return out;
}

/** a frame's way as a heading (three's y turn: +z at 0) */
const heading = (dx: number, dz: number): number => Math.atan2(dx, dz);

/** where it stands on the mat before a problem: upright, its face a step from the wall */
export function baseOf(r: Route): Stand {
  const f = placeAt(r, 0, MAT_H, 0);
  const p = add(f.g, mul(r.n, BASE_OUT));
  return { x: p.x, y: MAT_H, z: p.z, dir: f.dir };
}

/** a landing's least distance from the wall's foot (the mats are 1.4 deep at least) */
const LAND_OUT = 0.75;

/** where a climber off stance k lands on the mat: out from the wall, under where it was */
export function landingOf(r: Route, k: number): Stand {
  const s = stancesOf(r)[k];
  const g = s ? s.f.g : r.o;
  // at least LAND_OUT from the wall's foot, and a step out from under where it was
  const s0 = (g.x - r.o.x) * r.n.x + (g.z - r.o.z) * r.n.z;
  const p = add({ x: g.x, y: 0, z: g.z }, mul(r.n, Math.max(LAND_OUT - s0, 0.3)));
  return { x: p.x, y: MAT_H, z: p.z, dir: Math.atan2(-r.n.x, -r.n.z) };
}

/** its rest spot as a stand on the floor */
const restOf = (g: Gym, slot: number): Stand => {
  const s = g.spots[slot] ?? g.spots[0];
  return { x: s?.x ?? 0, y: 0, z: s?.z ?? 0, dir: s?.face ?? 0 };
};

/**
 * A climber's line n (pure: the same name, n and pastime give the same line): a problem of its run,
 * LINE_MIN..LINE_MAX s from its rest spot and back. A fall ~1 in FALL_ONE_IN, off a move in the
 * middle; a top-out rings the bell once it is built.
 */
export function lineOf(name: string, n: number, p: ClimbPastime, g: Gym): Line | null {
  const rs = routesOf(g, p.slot);
  if (rs.length === 0) return null;
  const r = rng(hash(`${name}|climb|${String(n)}`));
  const route = rs[Math.min(rs.length - 1, Math.floor(r() * rs.length))] as Route;
  const fall = r() < 1 / FALL_ONE_IN;
  const at = fall ? 1 + Math.floor(r() * (MOVES - 1)) : MOVES;
  const bell = !fall && p.stage >= BELL_STAGE;
  return compose(route, p.slot, g, fall, at, bell);
}

/** a line on a problem: off stance `at` (a fall) or from its top (MOVES), its walks timed so it lasts LINE_MIN..LINE_MAX */
export function compose(route: Route, slot: number, g: Gym, fall: boolean, at: number, bell: boolean): Line {
  const rest = restOf(g, slot);
  const base = baseOf(route);
  const landing = landingOf(route, at);
  const wallBeats: { k: Beat['k']; dur: number; to?: number; from?: number }[] = [{ k: 'mount', dur: BEAT.mount }];
  for (let k = 1; k <= at; k++) wallBeats.push({ k: 'move', dur: BEAT.reach + BEAT.hold, to: k });
  if (fall) wallBeats.push({ k: 'slip', dur: BEAT.slip, from: at }, { k: 'fall', dur: BEAT.fall, from: at }, { k: 'sit', dur: BEAT.sit }, { k: 'up', dur: BEAT.up });
  else wallBeats.push({ k: bell ? 'bell' : 'cheer', dur: bell ? BEAT.bell : BEAT.cheer }, { k: 'drop', dur: BEAT.drop, from: at }, { k: 'land', dur: BEAT.land });
  const wall = wallBeats.reduce((s, b) => s + b.dur, 0);
  const dOut = Math.hypot(base.x - rest.x, base.z - rest.z);
  const dBack = Math.hypot(rest.x - landing.x, rest.z - landing.z);
  // the walks at WALK, faster when the line would pass LINE_MAX; the chalk-up longer to reach LINE_MIN
  let speed = WALK;
  if (wall + BEAT.chalk + (dOut + dBack) / speed > LINE_MAX) speed = (dOut + dBack) / Math.max(0.5, LINE_MAX - wall - BEAT.chalk);
  const walkS = (dOut + dBack) / speed;
  const chalk = Math.max(BEAT.chalk, LINE_MIN - wall - walkS);
  const beats: Beat[] = [];
  let t = 0;
  const outDir = heading(base.x - rest.x, base.z - rest.z);
  beats.push({ k: 'walk', t0: t, dur: dOut / speed, from: { ...rest, dir: outDir }, to: { ...base, dir: outDir } });
  t += dOut / speed;
  beats.push({ k: 'chalk', t0: t, dur: chalk });
  t += chalk;
  for (const b of wallBeats) {
    if (b.k === 'move') beats.push({ k: 'move', t0: t, dur: b.dur, to: b.to ?? 1 });
    else if (b.k === 'slip' || b.k === 'fall' || b.k === 'drop') beats.push({ k: b.k, t0: t, dur: b.dur, from: b.from ?? 0 });
    else beats.push({ k: b.k as 'mount' | 'bell' | 'cheer' | 'land' | 'sit' | 'up', t0: t, dur: b.dur });
    t += b.dur;
  }
  const backDir = heading(rest.x - landing.x, rest.z - landing.z);
  beats.push({ k: 'walk', t0: t, dur: dBack / speed, from: { ...landing, dir: backDir }, to: { ...rest, dir: backDir } });
  t += dBack / speed;
  return { route: route.id, beats, len: t, fall, bell, base, landing };
}

/** Where a climber is in its sessions, u s after it reached its spot: its line, the beat and how far into it. */
export interface ClimbNow {
  readonly n: number;
  readonly line: Line | null;
  /** null: resting at its spot (no frame) until `restLeft` s */
  readonly beat: Beat | null;
  /** 0..1 through the beat, and s into it */
  readonly f: number;
  readonly into: number;
  readonly restLeft: number;
}

export function climbAt(name: string, p: ClimbPastime, u: number, g: Gym): ClimbNow {
  const v = Math.max(0, u);
  const n = Math.floor(v / SESSION_S);
  const at = v - n * SESSION_S;
  const line = lineOf(name, n, p, g);
  if (!line || at >= line.len) return { n, line, beat: null, f: 0, into: 0, restLeft: SESSION_S - at };
  const beat = line.beats.find((b) => at < b.t0 + b.dur) ?? null;
  const into = beat ? at - beat.t0 : 0;
  return { n, line, beat, f: beat && beat.dur > 0 ? into / beat.dur : 0, into, restLeft: 0 };
}

/** s since a climber reached its spot (negative: still walking there) */
export function sinceArrived(pose: Pose): number {
  const s = pose.seg;
  return pose.since - (s.path.len > 0.01 ? walkTime(s) : 0);
}

/**
 * When the loop must wake for the next line (s from t): the soonest resting climber's rest left;
 * null with none resting (the rests draw nothing, so a timer starts the next line).
 */
export function climbWake(frames: readonly BimFrame[], o: Office | null): number | null {
  const g = o?.gym;
  if (!g) return null;
  let soon: number | null = null;
  for (const f of frames) {
    const p = f.pose.seg.pastime;
    if (p?.kind !== 'climb' || f.pose.moving) continue;
    const now = climbAt(f.name, p, sinceArrived(f.pose), g);
    if (now.beat !== null) continue;
    soon = soon === null ? now.restLeft : Math.min(soon, now.restLeft);
  }
  return soon;
}

/** the mats' lift at a floor point: on a mat its top, rising over a short step before its edge (no foot ever in one) */
export const STEP_IN = { full: 0.5, ramp: 0.3 } as const;
export function liftAt(g: Gym, p: Pt): number {
  let best = 0;
  for (const m of g.mats) {
    const dx = Math.max(m.x0 - p.x, 0, p.x - m.x1);
    const dz = Math.max(m.z0 - p.z, 0, p.z - m.z1);
    const d = Math.hypot(dx, dz);
    const k = d <= STEP_IN.full ? 1 : d >= STEP_IN.full + STEP_IN.ramp ? 0 : 1 - (d - STEP_IN.full) / STEP_IN.ramp;
    best = Math.max(best, k * MAT_H);
  }
  return best;
}

/** the unit way from a stand to another, on the floor */
export const wayOf = (a: Pt, b: Pt): Pt => {
  const u = unit({ x: b.x - a.x, y: 0, z: b.z - a.z });
  return { x: u.x, z: u.z };
};
