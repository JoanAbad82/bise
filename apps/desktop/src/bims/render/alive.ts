// The standing bims' life layer (bim-alive, his m_48065: « un humain c'est jamais debout sans
// bouger »; designer m_48119). No three: every bim standing at rest in the office (done on the
// terrace, a coffee, a visit, a report, at the door, in line with its box, waiting for one to pass,
// a poster, the big screen, a build, asks, eating at the island) breathes and shifts its weight now
// and then. It goes under bim-idle's rare moves (idle.ts).
//
// Two layers on its rig. A breath: a sine of BREATH_MIN..BREATH_MAX s of its own, its rate wandering
// ±25% (WANDER) so two bims of close rates never stay in step: a lift, the chest up, the shoulders
// open; a pure function of its name and t. A stance: held STANCE_MIN..STANCE_MAX s, then eased to
// the next in SHIFT_S: its weight on one foot then the other (the body leans and slides over it, the
// head rights itself, the free foot a little ahead), both feet now and then, its head a little
// turned, and every third stance a small turn of its whole body. The stances are the office's
// (Crowd): no two bims start a change within GAP_S of each other (a crowd in step reads as a dance),
// a bim whose change is due waits its turn; each bim joins from its own stance and its first change
// is seeded, so none starts in step.
//
// The frame rate (battery): the breath alone at LOOP_FPS (8 fps, the typing loop's: 'loop'); a
// stance change at 30 fps ('idle', bim-idle's burst) only when bims are drawn BURST_PX (idle.ts) a unit or more
// (pinched in past the follow camera: at the office's fit, even on a big window, the loop's 8 fps; at 60
// px a unit a crowd of 13 kept the office at ~27 fps, bims/idle red on b950e1cd9). None under reduced motion, none
// drawn under MIN_PX a unit (the town's tiles), none on main, a skater, under an egg or a poke, none
// while it walks, sits, gets up or changes state (its pose's motion 'walk'); it fades in over
// FADE_IN_S when it joins. Seated and lying bims are not this layer's (asleep, napping, a deck chair:
// idle.ts's moves). Owner: bim-alive.
import type { BimFrame, Motion } from '../model';
import { BURST_PX, MIN_PX } from './idle';
import { hash, rng } from './palette';
import type { Rig, Rot } from './pose';

/** a breath's length (s): each bim its own in [BREATH_MIN, BREATH_MAX] */
export const BREATH_MIN = 3.4;
export const BREATH_MAX = 4.8;
/** its breath's phase wanders ±WANDER rad over WANDER_MIN..WANDER_MAX s: its rate goes ~25% slower and faster, as one's does */
export const WANDER = 1.2;
export const WANDER_MIN = 17;
export const WANDER_MAX = 31;
/** a stance held this long (s) after its change ends, each its own in this range */
export const STANCE_MIN = 4.5;
export const STANCE_MAX = 8.5;
/** the ease from one stance to the next (s) */
export const SHIFT_S = 1.8;
/** no two bims of an office start a stance change closer than this (s, designer m_48119) */
export const GAP_S = 0.5;
/** the layer fades in this long when a bim joins it (s): no pop at its arrival */
export const FADE_IN_S = 1.2;

/** the amplitudes (designer m_48119): the breath's lift (world units, a bim ~1 tall), chest, shoulders; the stance's lean, slide, head, free foot, turns */
export const AMP = {
  breathLift: 0.018,
  breathChest: 0.025,
  breathShoulders: 0.03,
  lean: 0.045,
  slide: 0.03,
  headRight: 0.03,
  freeLeg: 0.1,
  headTurn: 0.18,
  bodyTurn: 0.14,
} as const;

/** a bim's life seed: its own, never its typing loop's nor its idle moves' */
export const aliveSeed = (name: string): number => hash('alive:' + name);

interface Clock {
  /** breath period (s) and phase (rad) */
  readonly breath: number;
  readonly phase: number;
  /** its breath's rate wanders over this long (s), from this phase (rad) */
  readonly wander: number;
  readonly wanderPhase: number;
}

const clocks = new Map<number, Clock>();
/** a bim's breath clock, from its seed (memoized: read every frame) */
export function clockOf(seed: number): Clock {
  let c = clocks.get(seed);
  if (c === undefined) {
    const r = rng(seed);
    c = {
      breath: BREATH_MIN + r() * (BREATH_MAX - BREATH_MIN),
      phase: r() * 2 * Math.PI,
      wander: WANDER_MIN + r() * (WANDER_MAX - WANDER_MIN),
      wanderPhase: r() * 2 * Math.PI,
    };
    if (clocks.size > 4096) clocks.clear();
    clocks.set(seed, c);
  }
  return c;
}

/** a bim's breath at t: 0 out .. 1 in (the same name and t give the same breath) */
export function breathAt(name: string, t: number): number {
  const c = clockOf(aliveSeed(name));
  const wander = WANDER * Math.sin((2 * Math.PI * t) / c.wander + c.wanderPhase);
  return (1 - Math.cos((2 * Math.PI * t) / c.breath + c.phase + wander)) / 2;
}

/** one stance: the foot its weight is on (-1 left, 0 both, 1 right), its head's turn, its body's turn (rad) */
export interface Stance {
  readonly weight: number;
  readonly head: number;
  readonly turn: number;
}

const draw = (seed: number, n: number): (() => number) => rng((seed ^ Math.imul(n, 0x9e3779b1)) >>> 0);

/** a share of the stances on both feet; the others on one foot, left and right in turn */
const BOTH = 0.2;

/** stance n of a bim: a foot (left and right in turn, both now and then: the weight moves), a head, and its body's turn (new every third) */
export function stanceAt(seed: number, n: number): Stance {
  const r = draw(seed, n);
  const side = (n & 1) === (seed & 1) ? 1 : -1;
  const weight = r() < BOTH ? 0 : side;
  const head = (r() * 2 - 1) * AMP.headTurn;
  const turn = (draw(seed ^ 0x5bd1e995, Math.floor(n / 3))() * 2 - 1) * AMP.bodyTurn;
  return { weight, head, turn };
}

/** how long stance n is held after its change (s) */
const holdOf = (seed: number, n: number): number => STANCE_MIN + draw(seed ^ 0x27d4eb2f, n)() * (STANCE_MAX - STANCE_MIN);

const ease = (u: number): number => (u <= 0 ? 0 : u >= 1 ? 1 : (1 - Math.cos(Math.PI * u)) / 2);
const mixS = (a: Stance, b: Stance, f: number): Stance => ({ weight: a.weight + (b.weight - a.weight) * f, head: a.head + (b.head - a.head) * f, turn: a.turn + (b.turn - a.turn) * f });

/** what the layer adds to a bim at t */
export interface Life extends Stance {
  /** 0 out .. 1 in */
  readonly breath: number;
  /** its fade in: 0 none .. 1 whole */
  readonly k: number;
  /** a stance change runs */
  readonly shifting: boolean;
}

interface Held {
  readonly seed: number;
  joined: number;
  from: Stance;
  to: Stance;
  /** its last change's start (-Infinity: none yet) */
  at: number;
  /** when its next change is due */
  next: number;
  n: number;
  seen: boolean;
}

/**
 * An office's standing bims' stances: one per renderer. Each frame: begin(t), then life(name, t) for
 * each bim that stands at rest, in the frames' order, then end() (a bim not seen leaves it). One
 * change at most starts in a frame, none within GAP_S of the last: the one longest due; the others wait.
 */
export interface Crowd {
  begin(t: number): void;
  life(name: string, t: number): Life;
  /** whether a stance change ran in this frame */
  end(): boolean;
}

export function newCrowd(): Crowd {
  const held = new Map<string, Held>();
  let last = -Infinity;
  let shifting = false;
  /** the bim whose change starts in this frame (begin picks it) */
  let go: Held | null = null;
  return {
    begin(t) {
      shifting = false;
      go = null;
      // the clock went back (a new office clock): the gap counts from now
      if (last > t) last = -Infinity;
      // the change longest due goes first (never the frames' order: a bim late in it would wait forever)
      if (t - last >= GAP_S) {
        for (const h of held.values()) if (h.next <= t && (go === null || h.next < go.next)) go = h;
        if (go !== null) last = t;
      }
      for (const h of held.values()) h.seen = false;
    },
    life(name, t) {
      let h = held.get(name);
      if (h === undefined) {
        const seed = aliveSeed(name);
        // its own stance, its first change somewhere in its first hold: never in step with one that joins with it
        const n = Math.floor(draw(seed ^ 0x165667b1, 0)() * 6);
        const s = stanceAt(seed, n);
        h = { seed, joined: t, from: s, to: s, at: -Infinity, next: t + draw(seed ^ 0x165667b1, 1)() * STANCE_MAX, n, seen: true };
        held.set(name, h);
      }
      h.seen = true;
      if (t < h.joined) {
        // its clock went back: start again from here
        h.joined = t;
        h.next = t + holdOf(h.seed, h.n);
      }
      if (h === go) {
        const f = ease((t - h.at) / SHIFT_S);
        h.from = mixS(h.from, h.to, f);
        h.n += 1;
        h.to = stanceAt(h.seed, h.n);
        h.at = t;
        h.next = t + SHIFT_S + holdOf(h.seed, h.n);
      }
      const u = (t - h.at) / SHIFT_S;
      const on = u >= 0 && u < 1;
      if (on) shifting = true;
      return { ...mixS(h.from, h.to, ease(u)), breath: breathAt(name, t), k: ease((t - h.joined) / FADE_IN_S), shifting: on };
    },
    end() {
      for (const [name, h] of held) if (!h.seen) held.delete(name);
      return shifting;
    },
  };
}

/** whether a rig stands on its feet: legs down, not lying back, not seated, not up in the air */
export function stands(r: Rig): boolean {
  return Math.abs(r.legL) < 0.4 && Math.abs(r.legR) < 0.4 && Math.abs(r.body[0]) < 0.45 && r.y < 0.2 && (r.lift ?? 0) === 0;
}

const add = (a: Rot, d: Rot): Rot => [a[0] + d[0], a[1] + d[1], a[2] + d[2]];

/**
 * The rig with its life on top. A still pose turns 'loop' (the breath, LOOP_FPS); a stance change
 * drawn big enough (burst) turns it 'idle' (30 fps); a pose that moves keeps its motion.
 */
export function aliveRig(r: Rig, l: Life, burst: boolean): Rig {
  const k = l.k;
  // just joined: as posed, but the loop goes on (its fade in is next frame's)
  if (k <= 0) return r.motion === 'still' ? { ...r, motion: 'loop' } : r;
  const b = l.breath * k;
  const w = l.weight * k;
  const turn = l.turn * k;
  // the weight on a foot: the body slides over it and leans to it, the head rights itself, the free foot a little ahead
  const slide = w * AMP.slide;
  const c = Math.cos(r.dir);
  const s = Math.sin(r.dir);
  const motion: Motion = burst && l.shifting && (r.motion === 'still' || r.motion === 'loop') ? 'idle' : r.motion === 'still' ? 'loop' : r.motion;
  return {
    ...r,
    x: r.x + slide * c,
    z: r.z - slide * s,
    dir: r.dir + turn,
    y: r.y + b * AMP.breathLift,
    body: add(r.body, [-b * AMP.breathChest, 0, -w * AMP.lean]),
    head: add(r.head, [b * AMP.breathChest * 0.5, l.head * k - turn * 0.5, w * AMP.headRight]),
    armL: add(r.armL, [0, 0, -b * AMP.breathShoulders]),
    armR: add(r.armR, [0, 0, b * AMP.breathShoulders]),
    legL: r.legL - Math.max(0, w) * AMP.freeLeg,
    legR: r.legR - Math.max(0, -w) * AMP.freeLeg,
    motion,
  };
}

/** whether the office's bims get the layer: never under reduced motion, never drawn under MIN_PX a unit (scale: world units per css px) */
export const aliveOn = (o: { readonly reduced: boolean; readonly scale: number }): boolean => !o.reduced && o.scale > 0 && 1 / o.scale >= MIN_PX;

/**
 * A bim's rig with its life, as the office draws it (between crowd.begin and crowd.end): only
 * standing at rest (its pose still or looping), never main's, a skater's or under an egg.
 */
export function aliveOf(crowd: Crowd, f: BimFrame, r: Rig, t: number, o: { readonly reduced: boolean; readonly scale: number; readonly skater: boolean }): Rig {
  if (!aliveOn(o) || o.skater || f.main || f.egg !== undefined) return r;
  if (r.motion !== 'still' && r.motion !== 'loop') return r;
  if (!stands(r)) return r;
  return aliveRig(r, crowd.life(f.name, t), 1 / o.scale >= BURST_PX);
}
