// The resting bims' idle moves (bim-idle, his m_46751: finished bims looked too static; designer
// m_46760, architect m_46761). Pure, no three: a bim at rest (done on the terrace, napping on a bed,
// asleep at its desk) plays a small move now and then, on its own seeded clock, so no two move in
// step: a weight shift, a look around, a sip, a stretch; on a deck chair a head turn, a foot wiggle,
// a yawn; asleep a deep breath, a sigh, a turn in its sleep (held until its next move), a twitch.
//
// The schedule: each bim's time is cut in SLOT-long slots shifted by a phase of its own (FNV of
// 'idle:' + its name); a slot holds one move, starting at a seeded point of its first SPREAD
// seconds, so two moves of a bim start 12-35 s apart. A move starts and ends on the rest pose (sine
// in-out). At most MAX_AT_ONCE bims move at once in an office: a move that would make a third waits
// for its bim's next slot (a turn and its way back are never held back: the turn's hold would jump).
// None under reduced motion, none in the first SETTLE_S after it came to rest (its event label), none
// with an egg or a poke on it, none when the bims are drawn smaller than MIN_PX (the tile from afar).
// The office draws at IDLE_FPS only while a move runs ('idle'), then still: idleWake says when the
// next one starts so the loop sleeps until then. Owner: bim-idle.
import type { Activity, BimFrame, Pt } from '../model';
import type { NapRest } from './nap';
import { hash, rng } from './palette';
import { restingSince, type Rig, type Rot } from './pose';

/** where a resting bim is: standing on the terrace, on a deck chair, lying on a bed, asleep at its desk */
export type IdleKind = 'stand' | 'deck' | 'bed' | 'desk';

export type IdleMove = 'sway' | 'look' | 'sip' | 'stretch' | 'wiggle' | 'yawn' | 'breath' | 'sigh' | 'turn' | 'back' | 'twitch';

/** a slot's length and the spread of its move's start in it (s): starts 12..35 s apart */
export const SLOT = 23.5;
export const SPREAD = 11.5;
/** no move in the first seconds at rest (its arrival's event label, its transition's end) */
export const SETTLE_S = 3;
/** at most this many bims moving at once in an office (designer m_46760) */
export const MAX_AT_ONCE = 2;
/** no moves when a bim is drawn smaller than this (css px for a unit of the world: the bims' height) */
export const MIN_PX = 12;

interface Entry {
  readonly move: IdleMove;
  readonly w: number;
}

/** each place's moves and their weights (the rare ones about 1 in 8) */
const MOVES: Readonly<Record<IdleKind, readonly Entry[]>> = {
  stand: [{ move: 'sway', w: 3 }, { move: 'look', w: 3 }, { move: 'sip', w: 2 }, { move: 'stretch', w: 1 }],
  deck: [{ move: 'look', w: 4 }, { move: 'wiggle', w: 3 }, { move: 'yawn', w: 1 }],
  bed: [{ move: 'breath', w: 4 }, { move: 'turn', w: 2 }, { move: 'sigh', w: 2 }],
  desk: [{ move: 'breath', w: 4 }, { move: 'turn', w: 2 }, { move: 'twitch', w: 1 }],
};

/** each move's length (s) */
export const DUR: Readonly<Record<IdleMove, number>> = {
  sway: 1.6, look: 2.4, sip: 2.0, stretch: 2.2, wiggle: 1.6, yawn: 2.0, breath: 3.0, sigh: 1.5, turn: 1.6, back: 1.6, twitch: 0.5,
};

/** where a bim rests, or null when it isn't one that idles (working, asks, failed, stopped, main, an event) */
export function idleKindOf(act: Activity): IdleKind | null {
  switch (act.k) {
    case 'done':
      return act.standing === true ? 'stand' : 'deck';
    case 'nap':
      return act.at === 'desk' ? 'desk' : 'bed';
    case 'sleep':
    case 'waitagent':
      return 'desk';
    default:
      return null;
  }
}

/** a bim's idle seed: its own, never its typing loop's phase (architect m_46761) */
export const seedOf = (name: string): number => hash('idle:' + name);

/** the slots' shift for a bim (s, 0..SLOT) */
const shifts = new Map<number, number>();
function shiftOf(seed: number): number {
  let s = shifts.get(seed);
  if (s === undefined) {
    s = rng(seed)() * SLOT;
    if (shifts.size > 4096) shifts.clear();
    shifts.set(seed, s);
  }
  return s;
}

/** the slot holding time t for a bim */
const slotAt = (seed: number, t: number): number => Math.floor((t - shiftOf(seed)) / SLOT);

/** slot n's draws: its start, its pick, its side */
function raw(seed: number, kind: IdleKind, n: number): { start: number; move: IdleMove; side: 1 | -1 } {
  const r = rng((seed ^ Math.imul(n, 0x9e3779b1)) >>> 0);
  const start = shiftOf(seed) + n * SLOT + r() * SPREAD;
  const moves = MOVES[kind];
  let p = r() * moves.reduce((s, e) => s + e.w, 0);
  let move: IdleMove = moves[0]?.move ?? 'breath';
  for (const e of moves) {
    p -= e.w;
    if (p < 0) {
      move = e.move;
      break;
    }
  }
  return { start, move, side: r() < 0.5 ? -1 : 1 };
}

/** one move of a bim's schedule */
export interface Planned {
  readonly move: IdleMove;
  readonly start: number;
  readonly dur: number;
  /** its way (a look's, a turn's, a sway's side) */
  readonly side: 1 | -1;
}

/** how far back a run of turns is followed (each turn's slot is followed by its way back) */
const CHAIN = 64;

/**
 * Slot n's move for a bim at rest since `from`, or null (it came to rest after the slot's start). A
 * turn is always followed by its way back in the next slot, on the same side.
 */
export function moveIn(seed: number, kind: IdleKind, from: number, n: number): Planned | null {
  const r = raw(seed, kind, n);
  if (r.start < from + SETTLE_S) return null;
  if (kind === 'bed' || kind === 'desk') {
    // the turns just before it, back to its rest: an odd run means slot n-1 turned, so n turns back
    let run = 0;
    for (let k = n - 1; k > n - 1 - CHAIN; k--) {
      const p = raw(seed, kind, k);
      if (p.start < from + SETTLE_S || p.move !== 'turn') break;
      run++;
    }
    if (run % 2 === 1) return { move: 'back', start: r.start, dur: DUR.back, side: raw(seed, kind, n - 1).side };
  }
  return { move: r.move, start: r.start, dur: DUR[r.move], side: r.side };
}

/** one resting bim the plan sees */
export interface Rester {
  readonly name: string;
  readonly kind: IdleKind;
  /** t it came to rest (pose.ts restingSince) */
  readonly from: number;
}

/** the frames' resting bims at t: at rest in a state that idles, never main, never under an egg or a poke */
export function restersOf(frames: readonly BimFrame[], t: number, bedAt?: (p: Pt) => NapRest | undefined): Rester[] {
  const out: Rester[] = [];
  for (const f of frames) {
    if (f.main || f.egg !== undefined) continue;
    const kind = idleKindOf(f.pose.seg.act);
    if (kind === null) continue;
    const from = restingSince({ pose: f.pose, t, reduced: false, ...(bedAt ? { bedAt } : {}) });
    // to the ms: the same rest from frame to frame (its float wobbles with t), so its moves are read, never worked again
    if (from !== null) out.push({ name: f.name, kind, from: Math.round(from * 1000) / 1000 });
  }
  return out;
}

/** what one bim plays now */
export interface IdleNow {
  readonly kind: IdleKind;
  /** the move running and its progress 0..1, or null between moves */
  readonly move: Planned | null;
  readonly u: number;
  /** the side it holds a turn on (asleep, between its turn and its way back); 0: none */
  readonly hold: -1 | 0 | 1;
}

const ends = (p: Planned): number => p.start + p.dur;
/** the turn and its way back: never held back by the cap (its hold would jump) */
const kept = (p: Planned): boolean => p.move === 'turn' || p.move === 'back';

/**
 * The moves that play around t, worked out once for a stretch of time (LINE_S) and read by each
 * frame: a frame at 30 fps only finds the move running and the next one. A line covers
 * [t0 - BACK_S, t0 + LINE_S + AHEAD_S]: the move before t (a held turn), the one running, and the
 * next that plays (moves start at most 35 s apart, a held-back one waits a slot more).
 */
const BACK_S = 40;
const AHEAD_S = 80;
const LINE_S = 30;

interface Line {
  readonly rs: readonly Rester[];
  readonly t0: number;
  /** each bim's moves that play, by start */
  readonly bims: ReadonlyMap<string, { readonly kind: IdleKind; readonly moves: readonly Planned[] }>;
  /** every move that plays, by start (the wake) */
  readonly all: readonly Planned[];
}

/** the longest move (s): a move running at a start began at most this long before it */
const LONGEST = Math.max(...Object.values(DUR));

/**
 * Whether the i-th planned move plays (cands sorted by start): fewer than MAX_AT_ONCE other bims'
 * moves, started before it (the same start: the name first), still run at its start.
 */
function plays(cands: readonly { readonly name: string; readonly p: Planned }[], i: number): boolean {
  const c = cands[i];
  if (!c) return false;
  if (kept(c.p)) return true;
  const s = c.p.start;
  let busy = 0;
  for (let j = i - 1; j >= 0; j--) {
    const o = cands[j];
    if (!o || o.p.start < s - LONGEST) break;
    if (o.name !== c.name && ends(o.p) > s && (o.p.start < s || o.name < c.name)) busy++;
  }
  // the same start after it in the sort, a name first
  for (let j = i + 1; j < cands.length; j++) {
    const o = cands[j];
    if (!o || o.p.start > s) break;
    if (o.name !== c.name && o.name < c.name) busy++;
  }
  return busy < MAX_AT_ONCE;
}

function lineOf(rs: readonly Rester[], t0: number): Line {
  const a = t0 - BACK_S;
  const b = t0 + LINE_S + AHEAD_S;
  const cands: { name: string; p: Planned }[] = [];
  for (const r of rs) {
    const seed = seedOf(r.name);
    for (let k = slotAt(seed, a); k <= slotAt(seed, b); k++) {
      const p = moveIn(seed, r.kind, r.from, k);
      if (p) cands.push({ name: r.name, p });
    }
  }
  cands.sort((x, y) => x.p.start - y.p.start);
  const bims = new Map<string, { kind: IdleKind; moves: Planned[] }>(rs.map((r) => [r.name, { kind: r.kind, moves: [] }]));
  const all: Planned[] = [];
  for (let i = 0; i < cands.length; i++) {
    const c = cands[i];
    if (!c || !plays(cands, i)) continue;
    bims.get(c.name)?.moves.push(c.p);
    all.push(c.p);
  }
  return { rs, t0, bims, all };
}

const same = (a: readonly Rester[], b: readonly Rester[]): boolean =>
  a.length === b.length &&
  a.every((r, i) => {
    const o = b[i];
    return o !== undefined && r.name === o.name && r.kind === o.kind && r.from === o.from;
  });

/** the last line, kept while the same bims rest the same way and t stays in its stretch (a memo: the same rs and t give the same plan) */
let last: Line | null = null;
function lineAt(rs: readonly Rester[], t: number): Line {
  if (last && t >= last.t0 && t < last.t0 + LINE_S && same(last.rs, rs)) return last;
  last = lineOf(rs, t);
  return last;
}

function planOf(l: Line, t: number): Map<string, IdleNow> {
  const out = new Map<string, IdleNow>();
  for (const [name, b] of l.bims) {
    // its last move started by t: running, or done (a turn in its sleep held until its way back)
    let p: Planned | null = null;
    for (const m of b.moves) {
      if (m.start > t) break;
      p = m;
    }
    if (p && t < ends(p)) out.set(name, { kind: b.kind, move: p, u: (t - p.start) / p.dur, hold: 0 });
    else if (p && p.move === 'turn') out.set(name, { kind: b.kind, move: null, u: 0, hold: p.side });
  }
  // a bim at rest with nothing on: not in the plan (its rig as posed)
  return out;
}

function wakeOf(l: Line, t: number): number | null {
  for (const p of l.all) if (p.start > t) return p.start - t;
  return null;
}

/** every resting bim's idle state at t (the office's; the same resters and t give the same plan) */
export function idlePlan(rs: readonly Rester[], t: number): Map<string, IdleNow> {
  return planOf(lineAt(rs, t), t);
}

/** s from t until the next idle move that plays starts, or null: none rests. The loop sleeps until then. */
export function idleWake(rs: readonly Rester[], t: number): number | null {
  return wakeOf(lineAt(rs, t), t);
}

/**
 * An office frame's idle moves: every resting bim's state at t and the s until the next move (the
 * loop's wake). None under reduced motion, none when a world unit is drawn under MIN_PX (scale: world
 * units per css px, camera.ts Fit.scale).
 */
export function idleFrame(
  frames: readonly BimFrame[],
  t: number,
  o: { readonly reduced: boolean; readonly scale: number; readonly bedAt?: (p: Pt) => NapRest | undefined },
): { plan: Map<string, IdleNow>; wake: number | null } {
  const rs = o.reduced || o.scale <= 0 || 1 / o.scale < MIN_PX ? [] : restersOf(frames, t, o.bedAt);
  const l = lineAt(rs, t);
  return { plan: planOf(l, t), wake: wakeOf(l, t) };
}

// ---- the moves' bodies

/** 0 at both ends, 1 in the middle, no jolt at either end (sine in-out) */
const bump = (u: number): number => (1 - Math.cos(2 * Math.PI * u)) / 2;
/** out (eased), held, back (eased): `a` the share of the way out and of the way back */
function outHoldBack(u: number, a: number): number {
  const e = (x: number): number => (1 - Math.cos(Math.PI * x)) / 2;
  if (u < a) return e(u / a);
  if (u > 1 - a) return e((1 - u) / a);
  return 1;
}
const ease = (u: number): number => (1 - Math.cos(Math.PI * Math.min(1, Math.max(0, u)))) / 2;
const mix3 = (a: Rot, b: Rot, f: number): Rot => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
const add = (a: Rot, d: Rot): Rot => [a[0] + d[0], a[1] + d[1], a[2] + d[2]];

/** a sip's arm: the mug at its mouth (pose.ts's done sip) */
const SIP: Rot = [-2.25, 0, -0.45];

/** the turn in its sleep at f (0 rest .. 1 turned) on a side */
function turned(r: Rig, kind: IdleKind, side: number, f: number): Rig {
  if (kind === 'desk') return { ...r, head: add(r.head, [0, side * 0.25 * f, 0]) };
  return { ...r, head: add(r.head, [0, side * 0.4 * f, side * 0.15 * f]), body: add(r.body, [0, 0, side * 0.08 * f]) };
}

/** the rig with its idle move (or its held turn) on top; 'idle' motion while a move runs */
export function idleRig(r: Rig, n: IdleNow): Rig {
  const m = n.move;
  if (m === null) return n.hold === 0 ? r : turned(r, n.kind, n.hold, 1);
  const u = n.u;
  const s = m.side;
  const out = ((): Rig => {
    switch (m.move) {
      case 'sway': {
        const b = bump(u);
        return { ...r, body: add(r.body, [0, 0, s * 0.04 * b]), head: add(r.head, [0, 0, -s * 0.02 * b]) };
      }
      case 'look':
        return { ...r, head: add(r.head, [0, s * 0.4 * outHoldBack(u, 0.375), 0]) };
      case 'sip': {
        const e = outHoldBack(u, 0.35);
        return { ...r, armR: mix3(r.armR, SIP, e), head: add(r.head, [-0.08 * e, 0, 0]), ...(e > 0.5 ? { mouth: 'oh' as const, eyes: Math.min(r.eyes, 0.6) } : {}) };
      }
      case 'stretch': {
        const e = outHoldBack(u, 0.4);
        return { ...r, armL: mix3(r.armL, [0, 0, -2.7], e), body: add(r.body, [-0.08 * e, 0, 0]), head: add(r.head, [-0.1 * e, 0, 0]), ...(e > 0.5 ? { mouth: 'oh' as const, eyes: 0.15 } : {}) };
      }
      case 'wiggle': {
        const w = Math.sin(2 * Math.PI * 3 * u) * 0.12 * bump(u);
        return { ...r, legL: r.legL + w, legR: r.legR - w };
      }
      case 'yawn': {
        const e = outHoldBack(u, 0.35);
        return { ...r, head: add(r.head, [-0.15 * e, 0, 0]), ...(e > 0.3 ? { mouth: 'oh' as const, eyes: 0.15 } : {}) };
      }
      case 'breath': {
        const b = bump(u);
        return n.kind === 'desk'
          ? { ...r, y: r.y + 0.01 * b, body: add(r.body, [-0.03 * b, 0, 0]) }
          : { ...r, y: r.y + 0.02 * b, body: add(r.body, [-0.03 * b, 0, 0]) };
      }
      case 'sigh': {
        const b = bump(u);
        return { ...r, y: r.y + 0.015 * b, armL: add(r.armL, [-0.08 * b, 0, 0]), armR: add(r.armR, [-0.08 * b, 0, 0]) };
      }
      case 'turn':
        return turned(r, n.kind, s, ease(u));
      case 'back':
        return turned(r, n.kind, s, 1 - ease(u));
      case 'twitch': {
        const b = bump(u) * Math.sin(Math.PI * 2 * 2 * u);
        return { ...r, head: add(r.head, [-0.06 * b, 0, 0]), armR: add(r.armR, [0.08 * b, 0, 0]) };
      }
    }
  })();
  return { ...out, motion: r.motion === 'still' || r.motion === 'loop' || r.motion === 'blend' ? 'idle' : r.motion };
}
