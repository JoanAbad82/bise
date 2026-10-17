// les bims' skatepark (page bims-maps v10, brief section D; architect m_28726): skating is how a map
// with a park (Office.park, the California map) draws an idle bim, never a fact, so the activity stays
// 'nap' or 'snack' and this module only adds a pastime on top. Who skates (`pastimes`: 2 at most,
// picked by a 10-min hash window; every idle bim in the bowl on the Sunday pool session, one Sunday
// in four once the bowl is built; nobody under reduced motion), and what a skater does (`lineOf`):
// lines of 8-12 s chained from a trick table (keys only: labels.ts has the words), each trick ~1.5x
// slower than real, a bail ~1 in 10, then a rest at least as long on its board, still (no frame: the
// battery rule). The 900 on the vert at the 900th job (the jobs' high-water mark). Pure: the clock,
// the stage and his local day are passed in. render/skate.ts poses a skater from a line. Owner: maps-d.
import { hash } from './activity';
import type { Activity, BimFrame, FunIn, Office, Pastime, Pose } from './model';

/** the park's pieces a trick rides on */
export type Feature = 'flat' | 'funbox' | 'qp' | 'curb' | 'rail' | 'ramp' | 'stairs' | 'ledge' | 'bowl' | 'vert';

/** the stage each piece is built at (growth.ts's stages; the brief: 3 curb .. 13 vert, 14 the golden board) */
export const FEATURE_STAGE: Readonly<Record<Feature, number>> = {
  flat: 0, funbox: 0, qp: 0, curb: 3, rail: 5, ramp: 7, stairs: 9, ledge: 9, bowl: 11, vert: 13,
};
/** the golden board at the mark */
export const GOLDEN_STAGE = 14;

export type TrickKey =
  | 'drop_in' | 'pump' | 'rock_to_fakie' | 'axle_stall' | 'fs_180' | 'bs_180'
  | 'ollie' | 'kickflip' | 'heelflip' | 'shove_it' | 'tre_flip'
  | 'fifty' | 'five_o' | 'boardslide' | 'nosegrind'
  | 'manual' | 'no_comply' | 'carve' | 'fs_air' | 'nine';

/** a trick's real length (s): the line plays it SLOW times longer, so it reads at 320 */
export const TRICK_S: Readonly<Record<TrickKey, number>> = {
  drop_in: 0.9, pump: 1.1, rock_to_fakie: 1.1, axle_stall: 1.1, fs_180: 1.1, bs_180: 1.1,
  ollie: 0.7, kickflip: 0.8, heelflip: 0.8, shove_it: 0.8, tre_flip: 0.9,
  fifty: 1.1, five_o: 1.1, boardslide: 1.1, nosegrind: 1.1,
  manual: 1.3, no_comply: 0.8, carve: 1.5, fs_air: 1.1, nine: 1.8,
};
export const SLOW = 1.5;

/** what each piece offers (the ramp: a drop in, then 2-3 of its own; the bowl: carves and an air) */
const ON: Readonly<Record<Feature, readonly TrickKey[]>> = {
  flat: ['manual', 'no_comply', 'ollie', 'kickflip', 'heelflip', 'shove_it'],
  funbox: ['ollie', 'manual', 'kickflip'],
  qp: ['fs_air', 'axle_stall'],
  curb: ['fifty', 'five_o', 'nosegrind'],
  rail: ['fifty', 'boardslide'],
  ledge: ['fifty', 'five_o', 'boardslide', 'nosegrind'],
  stairs: ['ollie', 'kickflip', 'heelflip', 'shove_it'],
  ramp: ['pump', 'rock_to_fakie', 'axle_stall', 'fs_180', 'bs_180'],
  bowl: ['carve', 'carve', 'fs_air'],
  vert: ['fs_air', 'axle_stall'],
};

/** tricks that never bail (riding, not trying) */
const SAFE: ReadonlySet<TrickKey> = new Set(['drop_in', 'pump', 'carve', 'manual']);

/** one move of a line: a trick on a piece, or a roll towards the next piece (or home, `on` null) */
export interface Move {
  readonly trick: TrickKey | 'roll';
  readonly on: Feature | null;
  /** from the line's start (s), and its length (s), a bail included */
  readonly t0: number;
  readonly dur: number;
  /** it falls at its end: on its bum, laughs, gets back on (BAIL_S of the dur) */
  readonly bail: boolean;
  /** the ramp's moves: from the left lip (1) or the right one (-1) */
  readonly side: 1 | -1;
}

export interface Line {
  readonly moves: readonly Move[];
  readonly len: number;
}

/** a line's length (s), the session's length (s): the rest after a line is at least as long as it */
export const LINE_MIN = 8;
export const LINE_MAX = 12;
export const SESSION_S = 24;
/** a bail's fall, laugh and back on (s) */
export const BAIL_S = 2.0;
/** at most this many skate at once (the pool session aside) */
export const MAX_SKATERS = 2;
/** who skates changes with this window (s) */
export const WINDOW_S = 600;
/** the 900 (Tony Hawk, 1999) at this many jobs done */
export const NINE_JOBS = 900;
/** a trick's name over a followed bim (s) */
export const TRICK_LABEL_S = 1.5;

/** a seeded generator, the same on every run (mulberry32) */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T>(xs: readonly T[], r: number): T => xs[Math.min(xs.length - 1, Math.floor(r * xs.length))] as T;

/** the pieces built at this stage (the vert stands where the lone quarter pipe was) */
export function built(stage: number): Feature[] {
  return (Object.keys(FEATURE_STAGE) as Feature[]).filter((f) => FEATURE_STAGE[f] <= stage && !(f === 'qp' && stage >= FEATURE_STAGE.vert));
}

/** whether the Sunday pool session is on: a Sunday, one in four, the bowl built */
export function poolDay(fun: Pick<FunIn, 'dow' | 'day' | 'stage'>): boolean {
  // weeks counted from a Sunday (1970-01-01 was a Thursday)
  return fun.dow === 0 && fun.stage >= FEATURE_STAGE.bowl && Math.floor((fun.day + 4) / 7) % 4 === 0;
}

/** the days since 1970 of a local date (FunIn.day) */
export const dayOf = (y: number, mo: number, d: number): number => Math.floor(Date.UTC(y, mo - 1, d) / 86_400_000);

/**
 * Who skates now, by name (the others nap or snack as the activity says): idle bims only (a bim
 * asking, failed, busy or in line never skates), MAX_SKATERS at most, picked by a hash of their name
 * and the 10-min window; every idle one on the pool session. None without a park or under reduced
 * motion. Slots by name, so two skaters keep their spots while both skate.
 */
export function pastimes(acts: ReadonlyMap<string, Activity>, o: Office, t: number, fun: FunIn | undefined): ReadonlyMap<string, Pastime> {
  const out = new Map<string, Pastime>();
  const park = o.park;
  if (!fun || fun.reduced || !park || park.spots.length === 0) return out;
  const pool = poolDay(fun);
  const win = Math.floor(t / WINDOW_S);
  const idle = [...acts].filter(([, a]) => a.k === 'nap' || a.k === 'snack').map(([name]) => name);
  const cap = pool ? park.spots.length : Math.min(MAX_SKATERS, park.spots.length);
  const chosen = idle
    .map((name) => ({ name, h: hash(`${name}|${String(win)}`) }))
    .sort((a, b) => a.h - b.h || (a.name < b.name ? -1 : 1))
    .slice(0, cap)
    .map((c) => c.name)
    .sort();
  const nine = fun.jobs === NINE_JOBS && fun.stage >= FEATURE_STAGE.vert;
  chosen.forEach((name, slot) => out.set(name, { kind: 'skate', slot, pool, nine: nine && slot === 0, stage: fun.stage }));
  return out;
}

/** the moves a piece gives at this point of the line */
function block(f: Feature, r: () => number, rare: boolean): TrickKey[] {
  if (f === 'ramp') {
    const n = 2 + Math.floor(r() * 2);
    return ['drop_in', ...Array.from({ length: n }, () => pick(ON.ramp, r()))];
  }
  if (f === 'bowl') return ['carve', 'carve', r() < 0.5 ? 'fs_air' : 'carve'];
  if (f === 'stairs' && rare) return ['tre_flip'];
  return [pick(ON[f], r())];
}

/**
 * A skater's line n (pure: the same name, n and pastime give the same line): rolls and tricks
 * chained from its rest spot and back, LINE_MIN..LINE_MAX s, each trick SLOW times its real length,
 * ~1 in 10 a bail. The pool session rides the bowl only; the 900 opens one line in three of its skater.
 */
export function lineOf(name: string, n: number, p: Pastime): Line {
  const r = rng(hash(`${name}|line|${String(n)}`));
  const target = LINE_MIN + r() * (LINE_MAX - LINE_MIN);
  const have = p.pool ? (['bowl'] as Feature[]) : built(p.stage);
  const moves: Move[] = [];
  let t = 0;
  const home = 1.2;
  const add = (trick: Move['trick'], on: Feature | null, dur: number, bail: boolean, side: 1 | -1): void => {
    moves.push({ trick, on, t0: t, dur, bail, side });
    t += dur;
  };
  if (p.nine && n % 3 === 0 && have.includes('vert')) {
    add('roll', 'vert', 1.4, false, 1);
    // he tries it: lands one in two
    const bail = n % 2 === 1;
    add('nine', 'vert', TRICK_S.nine * SLOW + (bail ? BAIL_S : 0), bail, 1);
  }
  let last: Feature | null = null;
  for (let tries = 0; tries < 12; tries++) {
    const choices = have.filter((f) => f !== last || have.length === 1);
    const f = pick(choices, r());
    const rare = r() < 1 / 8;
    const keys = block(f, r, rare);
    const side: 1 | -1 = r() < 0.5 ? 1 : -1;
    const roll = 0.9 + r() * 0.6;
    const parts = keys.map((k) => ({ k, bail: !SAFE.has(k) && r() < 0.1 }));
    const dur = parts.reduce((s, x) => s + TRICK_S[x.k] * SLOW + (x.bail ? BAIL_S : 0), 0);
    if (t + roll + dur + home > LINE_MAX) {
      if (t + home >= LINE_MIN) break;
      continue;
    }
    add('roll', f, roll, false, side);
    let sd = side;
    for (const x of parts) {
      add(x.k, f, TRICK_S[x.k] * SLOW + (x.bail ? BAIL_S : 0), x.bail, sd);
      // on the ramp each move rides from one lip to the other, its trick at the far one
      if (f === 'ramp') sd = sd === 1 ? -1 : 1;
    }
    last = f;
    if (t + home >= target) break;
  }
  add('roll', null, Math.min(LINE_MAX - t, Math.max(home, LINE_MIN - t)), false, 1);
  return { moves, len: t };
}

/** Where a skater is in its sessions, u s after it reached its spot: its line, the move and how far into it. */
export interface SkateNow {
  readonly n: number;
  readonly line: Line;
  /** null: resting on its board (no frame) until `restLeft` s */
  readonly move: Move | null;
  /** 0..1 through the move */
  readonly f: number;
  /** s into the move */
  readonly into: number;
  readonly restLeft: number;
}

export function skateAt(name: string, p: Pastime, u: number): SkateNow {
  const v = Math.max(0, u);
  const n = Math.floor(v / SESSION_S);
  const at = v - n * SESSION_S;
  const line = lineOf(name, n, p);
  if (at >= line.len) return { n, line, move: null, f: 0, into: 0, restLeft: SESSION_S - at };
  const move = line.moves.find((m) => at < m.t0 + m.dur) ?? null;
  const into = move ? at - move.t0 : 0;
  return { n, line, move, f: move && move.dur > 0 ? into / move.dur : 0, into, restLeft: 0 };
}

/** s since a skater reached its spot (negative: still walking there) */
export function sinceArrived(pose: Pose): number {
  const s = pose.seg;
  return pose.since - (s.path.len > 0.01 ? s.path.len / s.speed : 0);
}

/** the trick shown over a followed skater at its pose: the first TRICK_LABEL_S of each trick; null else */
export function trickNow(name: string, pose: Pose): TrickKey | null {
  const p = pose.seg.pastime;
  if (!p || pose.moving) return null;
  const now = skateAt(name, p, sinceArrived(pose));
  const m = now.move;
  if (!m || m.trick === 'roll' || now.into >= TRICK_LABEL_S) return null;
  return m.trick;
}

/**
 * When the loop must wake for the next line (s from t): the soonest resting skater's rest left;
 * null with none resting (the rests draw nothing, so a timer starts the next line).
 */
export function wakeIn(frames: readonly BimFrame[]): number | null {
  let soon: number | null = null;
  for (const f of frames) {
    const p = f.pose.seg.pastime;
    if (!p || f.pose.moving) continue;
    const now = skateAt(f.name, p, sinceArrived(f.pose));
    if (now.move !== null) continue;
    soon = soon === null ? now.restLeft : Math.min(soon, now.restLeft);
  }
  return soon;
}
