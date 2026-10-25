// The home islands' hover moves (designer's brief, page bims-home v11; Gabriel on v10: « une
// animation on mouse hover qui soit en 3d et animée et unique pour chaque scene »): one move per
// island, played once per hover, 0.8 to 1.6 s, starting and ending on the pose its bims hold
// (gags.ts `idle`). Pure, no three: a move is a frame at k (0..1) plus how bright its prop glows
// (the desk's little window, the lamp). Also the head that follows the pointer, and frames blended
// in between (the gag's 12 fps frames drawn smooth). Owner: bims-islands.
import type { Rig, Rot } from '../render/pose';
import { NO_PROPS } from '../render/pose';
import { AZ } from '../render/camera';
import { type Actor, type Bit, DESK, type Frame, type Island, type IslandId, PIANO, type V, facing, spot } from './gags';

export interface Shot {
  readonly frame: Frame;
  /** the scene's glow (scene.ts IslandScene.glow): 0 at rest .. 1 */
  readonly glow: number;
}

export interface Move {
  /** its length, s */
  readonly s: number;
  at(k: number): Shot;
}

const TAU = Math.PI * 2;
const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
/** 0 before a, 1 after b, smooth between */
export const env = (k: number, a: number, b: number): number => {
  const x = clamp01((k - a) / (b - a));
  return x * x * (3 - 2 * x);
};
/** 0 outside [a, b], up to 1 and back between */
const bump = (k: number, a: number, b: number): number => (k <= a || k >= b ? 0 : Math.sin((Math.PI * (k - a)) / (b - a)));
/** the shortest way from angle a to b, at t */
const lerpAngle = (a: number, b: number, t: number): number => {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return a + d * t;
};
const lerpRot = (a: Rot, b: Rot, t: number): Rot => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const lerpV = (a: V, b: V, t: number): V => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

/** a rig between two: its numbers blended, its words (mouth, props) a's until halfway. Pure. */
export function lerpRig(a: Rig, b: Rig, t: number): Rig {
  if (t <= 0) return a;
  if (t >= 1) return b;
  const half = t < 0.5 ? a : b;
  const board = a.board && b.board
    ? { x: lerp(a.board.x, b.board.x, t), y: lerp(a.board.y, b.board.y, t), z: lerp(a.board.z, b.board.z, t), rot: lerpRot(a.board.rot, b.board.rot, t) }
    : half.board;
  return {
    ...half,
    x: lerp(a.x, b.x, t), z: lerp(a.z, b.z, t), dir: lerpAngle(a.dir, b.dir, t), y: lerp(a.y, b.y, t),
    body: lerpRot(a.body, b.body, t), head: lerpRot(a.head, b.head, t), armL: lerpRot(a.armL, b.armL, t), armR: lerpRot(a.armR, b.armR, t),
    legL: lerp(a.legL, b.legL, t), legR: lerp(a.legR, b.legR, t), eyes: lerp(a.eyes, b.eyes, t),
    screen: lerp(a.screen, b.screen, t), grey: lerp(a.grey, b.grey, t), opacity: lerp(a.opacity, b.opacity, t),
    ...(a.lift !== undefined || b.lift !== undefined ? { lift: lerp(a.lift ?? 0, b.lift ?? 0, t) } : {}),
    ...(board ? { board } : {}),
  };
}

/** a bit between two of the same kind (a's otherwise). Pure. */
function lerpBit(a: Bit, b: Bit, t: number): Bit {
  if (a.kind !== b.kind) return t < 0.5 ? a : b;
  const at = lerpV(a.at, b.at, t);
  switch (a.kind) {
    case 'plane': {
      const o = b as typeof a;
      return { ...a, at, dir: lerpAngle(a.dir, o.dir, t), pitch: lerp(a.pitch, o.pitch, t), fold: lerp(a.fold, o.fold, t) };
    }
    case 'book': return { ...a, at, flip: lerp(a.flip, (b as typeof a).flip, t) };
    default: return { ...a, at, k: lerp(a.k, (b as typeof a).k, t) };
  }
}

/**
 * A frame between two, its bims blended; its bits too when both frames hold the same kinds in the same
 * order and none wraps round (a note's rise starting again), else a's until halfway. Pure.
 */
export function lerpFrame(a: Frame, b: Frame, t: number): Frame {
  const bims = a.bims.map((x, i): Actor => { const y = b.bims[i]; return y ? { name: x.name, rig: lerpRig(x.rig, y.rig, t) } : x; });
  const ab = a.bits ?? [];
  const bb = b.bits ?? [];
  const same = ab.length === bb.length && ab.every((x, i) => {
    const y = bb[i];
    return y !== undefined && x.kind === y.kind && !('k' in x && 'k' in y && y.k < x.k);
  });
  const bits = same ? ab.map((x, i) => lerpBit(x, bb[i] ?? x, t)) : t < 0.5 ? ab : bb;
  return bits.length > 0 ? { bims, bits } : { bims };
}

/** the gag at t s from its start, at fps, its frames blended: the held pose once over. Pure. */
export function gagAt(s: Island, t: number, fps: number): Frame {
  const rest = s.frames[s.idle] ?? s.frames[0];
  if (!rest) throw new Error(`${s.id}: no frames`);
  const x = Math.max(0, t * fps);
  const i = Math.floor(x);
  if (i >= s.seq.length - 1) return rest;
  const a = s.frames[s.seq[i] ?? s.idle] ?? rest;
  const b = s.frames[s.seq[i + 1] ?? s.idle] ?? rest;
  return a === b ? a : lerpFrame(a, b, env(x - i, 0, 1));
}

/** the gag's length, s */
export const gagLength = (s: Island, fps: number): number => (s.seq.length - 1) / fps;

// ---- the head that follows the pointer

/** how far a head turns to the pointer: its yaw, its nod */
export const LOOK = { yaw: 1.0, pitch: 0.45 } as const;
/** a head's height over its bim's place, standing */
const HEAD_Y = 0.95;

/**
 * The head's turn toward a point of the world (the pointer, pulled toward the viewer): its yaw from
 * its way, its nod (down > 0), both kept to LOOK, its roll kept. Pure.
 */
export function lookAt(r: Rig, p: V): Rot {
  const hy = (r.lift ?? 0) + r.y + HEAD_Y;
  const dx = p[0] - r.x, dy = p[1] - hy, dz = p[2] - r.z;
  let yaw = Math.atan2(dx, dz) - r.dir;
  yaw = Math.atan2(Math.sin(yaw), Math.cos(yaw));
  const pitch = -Math.atan2(dy, Math.hypot(dx, dz));
  const c = (v: number, m: number): number => Math.max(-m, Math.min(m, v));
  return [c(pitch - r.body[0], LOOK.pitch), c(yaw, LOOK.yaw), r.head[2]];
}

/** a frame's bims' heads turned toward p by w (0 its own .. 1 at p). Pure. */
export function looking(f: Frame, p: V, w: number): Frame {
  if (w <= 0) return f;
  return { ...f, bims: f.bims.map((b) => ({ ...b, rig: { ...b.rig, head: lerpRot(b.rig.head, lookAt(b.rig, p), clamp01(w)) } })) };
}

// ---- the seven moves

const restOf = (s: Island): Frame => {
  const f = s.frames[s.idle];
  if (!f) throw new Error(`${s.id}: no held pose`);
  return f;
};
const one = (f: Frame, i = 0): Rig => {
  const b = f.bims[i];
  if (!b) throw new Error('no bim');
  return b.rig;
};
const with1 = (f: Frame, rig: Rig, bits?: readonly Bit[]): Frame => {
  const b0 = f.bims[0];
  return { bims: [{ name: b0?.name ?? '', rig }, ...f.bims.slice(1)], ...(bits && bits.length > 0 ? { bits } : {}) };
};
/** the rig at k along key poses [k, rig], blended smooth between them */
const keys = (k: number, ks: readonly (readonly [number, Rig])[]): Rig => {
  const first = ks[0];
  if (!first) throw new Error('no keys');
  if (k <= first[0]) return first[1];
  for (let i = 1; i < ks.length; i++) {
    const a = ks[i - 1], b = ks[i];
    if (a && b && k <= b[0]) return lerpRig(a[1], b[1], env(k, a[0], b[0]));
  }
  return ks.at(-1)?.[1] ?? first[1];
};

// desktop or terminal? (desk): it hops up to stand on the desk, waves at you; the little window lights up.
function ways(s: Island): Move {
  const rest = restOf(s);
  const R = one(rest);
  const crouch: Rig = { ...R, body: [0.25, 0, 0], armL: [0.5, 0, -0.3], armR: [0.5, 0, 0.3], legL: -1.35, legR: -1.35 };
  const stand: Rig = { ...R, y: 0, lift: DESK.h, z: R.z - 0.14, legL: 0, legR: 0, body: [0, 0, 0], head: [0, 0, 0], armL: [0, 0, -0.3], armR: [0, 0, 0.3] };
  const wave = (k: number): Rig => ({ ...stand, armR: [0, 0, 2.5 - Math.sin(k * TAU * 2) * 0.45], armL: [0, 0, -0.4], mouth: 'laugh', eyes: 0.3, head: [0, 0, -0.08] });
  return {
    s: 1.6,
    at(k) {
      if (k >= 1) return { frame: rest, glow: 0 };
      let r: Rig;
      if (k < 0.1) r = lerpRig(R, crouch, env(k, 0, 0.1));
      else if (k < 0.3) {
        const u = env(k, 0.1, 0.3);
        r = lerpRig(crouch, stand, u);
        r = { ...r, lift: (r.lift ?? 0) + 0.3 * Math.sin(Math.PI * u) };
      } else if (k < 0.36) r = { ...stand, squash: { k: 0.35 * bump(k, 0.3, 0.36), at: 0 } };
      else if (k < 0.8) r = lerpRig(stand, wave(env(k, 0.36, 0.8)), env(k, 0.36, 0.46) * (1 - env(k, 0.66, 0.8)));
      else {
        const u = env(k, 0.8, 1);
        r = lerpRig(stand, R, u);
        r = { ...r, lift: (r.lift ?? 0) + 0.18 * Math.sin(Math.PI * u) };
      }
      return { frame: with1(rest, r), glow: env(k, 0.28, 0.4) * (1 - env(k, 0.85, 1)) };
    },
  };
}

// babysit robots (beanbag): it dozes off, one eye opens at you, it rolls over, and its sleep bubble pops.
function why(s: Island): Move {
  const rest = restOf(s);
  const R = one(rest);
  const asleep = one(s.frames[0] ?? rest);
  const peek: Rig = { ...asleep, eyes: 0.45, mouth: 'oh', head: [-0.05, -0.35, 0.15] };
  const rolled: Rig = { ...asleep, body: [-0.36, 0, 0.5], head: [-0.1, 0.4, 0.35], armL: [-0.1, 0, -0.9], armR: [-0.3, 0, 0.3], eyes: 0.1 };
  const nose: V = [R.x + Math.sin(R.dir) * 0.24, 0.98, R.z + Math.cos(R.dir) * 0.24];
  return {
    s: 1.6,
    at(k) {
      if (k >= 1) return { frame: rest, glow: 0 };
      const r = keys(k, [[0, R], [0.18, asleep], [0.35, asleep], [0.45, peek], [0.55, peek], [0.72, rolled], [0.82, rolled], [1, R]]);
      const bits: Bit[] = [];
      if (k > 0.12 && k < 0.8) bits.push({ kind: 'bubble', at: nose, k: (k - 0.12) / 0.68 });
      if (k > 0.2 && k < 0.7) {
        const p = spot(0.35, -0.15);
        bits.push({ kind: 'z', at: [p.x, 1.2 + env(k, 0.2, 0.7) * 0.5, p.z], k: env(k, 0.2, 0.7) });
      }
      return { frame: with1(rest, r, bits), glow: 0 };
    },
  };
}

// questions you can actually answer (paper plane): it throws the plane, which loops once round the island and comes back to its hand.
function arts(s: Island): Move {
  const rest = restOf(s);
  const R = one(rest);
  const fwd = (d: number, up: number): V => [R.x + Math.sin(R.dir) * d - Math.cos(R.dir) * 0.08, up, R.z + Math.cos(R.dir) * d + Math.sin(R.dir) * 0.08];
  const hand = fwd(0.34, 0.82);
  const noSheet = { ...NO_PROPS };
  const fold: Rig = { ...R, props: noSheet, armL: [-1.2, 0, 0.3], armR: [-1.2, 0, -0.3], head: [0.3, 0, 0] };
  const back: Rig = { ...R, props: noSheet, armL: [0, 0, -0.3], armR: [-0.5, 0, 0.5], body: [-0.1, 0, 0], head: [0, 0, 0] };
  const thrown: Rig = { ...R, props: noSheet, armL: [0, 0, -0.3], armR: [-1.9, 0, 0.2], body: [0.15, 0, 0], head: [-0.1, 0, 0], mouth: 'oh' };
  const watch: Rig = { ...R, props: noSheet, armL: [0, 0, -0.3], armR: [-0.2, 0, 0.3], head: [-0.15, 0, 0] };
  const catchR: Rig = { ...R, props: noSheet, armL: [0, 0, -0.3], armR: [-1.7, 0, 0.35], mouth: 'laugh', eyes: 0.3, head: [0.15, 0, 0] };
  /** the loop: once round the island's middle, out of the hand and back into it */
  const R0 = 1.25;
  const a0 = Math.atan2(hand[0], hand[2]);
  const circle = (u: number): V => {
    const a = a0 + TAU * u;
    return [Math.sin(a) * R0, 1.15 + 0.25 * Math.sin(TAU * u), Math.cos(a) * R0];
  };
  const path = (u: number): V => {
    const p = circle(u);
    const w = Math.min(env(u, 0, 0.18), 1 - env(u, 0.82, 1));
    return lerpV(hand, p, w);
  };
  const T0 = 0.24, T1 = 0.86;
  const planeAt = (k: number): Bit => {
    if (k < T0) return { kind: 'plane', at: hand, dir: R.dir, pitch: 0.2, fold: 0.55 * (1 - env(k, 0, 0.16)) };
    if (k > T1) return { kind: 'plane', at: hand, dir: R.dir, pitch: 0.2, fold: 0.55 * env(k, T1 + 0.02, 0.98) };
    const u = (k - T0) / (T1 - T0);
    const p = path(u);
    const q = path(Math.min(1, u + 0.01));
    const v = [q[0] - p[0], q[1] - p[1], q[2] - p[2]] as const;
    const h = Math.hypot(v[0], v[2]);
    return { kind: 'plane', at: p, dir: Math.atan2(v[0], v[2]), pitch: Math.atan2(v[1], h), fold: 0, roll: -0.5 * env(u, 0.1, 0.25) * (1 - env(u, 0.75, 0.9)) };
  };
  return {
    s: 1.6,
    at(k) {
      if (k >= 1) return { frame: rest, glow: 0 };
      let r = keys(k, [[0, R], [0.12, fold], [0.2, back], [0.26, thrown], [0.36, watch], [0.8, watch], [0.88, catchR], [0.93, catchR], [1, R]]);
      const pl = planeAt(k);
      // its head follows the plane round
      // (behind it, the head lets go rather than swing across: its weight follows how much it faces the plane)
      if (k > T0 && k < T1) {
        const yaw = Math.atan2(pl.at[0] - r.x, pl.at[2] - r.z) - r.dir;
        const facingIt = Math.max(0, Math.cos(yaw));
        r = { ...r, head: lerpRot(r.head, lookAt(r, pl.at), bump(k, T0, T1) ** 0.5 * facingIt) };
      }
      const bits: Bit[] = k < 0.97 ? [pl] : [];
      if (k >= 0.97) r = { ...r, props: R.props };
      return { frame: with1(rest, r, bits), glow: 0 };
    },
  };
}

// it talks back (piano): a quick run of keys, and three notes float up and fade.
function fun(s: Island): Move {
  const rest = restOf(s);
  const R = one(rest);
  const keysOn: Rig = { ...R, head: [0.15, 0, 0], eyes: 1, mouth: 'smile' };
  const ax = Math.cos(PIANO.turn), az = -Math.sin(PIANO.turn);
  const note = (n: number, k: number): Bit | null => {
    const from = 0.22 + n * 0.14;
    const p = (k - from) / 0.55;
    if (p <= 0 || p >= 1) return null;
    const u = -0.25 + n * 0.25;
    return { kind: 'note', at: [PIANO.x + ax * u, 1.05 * PIANO.scale + 0.1, PIANO.z + az * u], k: p * 0.9, fade: 1 - env(p, 0.7, 1) };
  };
  return {
    s: 1.4,
    at(k) {
      if (k >= 1) return { frame: rest, glow: 0 };
      let r = keys(k, [[0, R], [0.12, keysOn], [0.72, keysOn], [0.86, { ...R, mouth: 'laugh', eyes: 0.3 }], [1, R]]);
      const run = bump(k, 0.12, 0.72) > 0 ? Math.min(1, bump(k, 0.12, 0.72) * 3) : 0;
      if (run > 0) {
        const ph = ((k - 0.12) / 0.6) * TAU * 6;
        const l = 0.32 * Math.max(0, Math.sin(ph)) * run;
        const rr = 0.32 * Math.max(0, Math.sin(ph + Math.PI)) * run;
        // the run goes up the keys: its hands and its body drift along them
        const along = env(k, 0.12, 0.72) - 0.5;
        r = { ...r, armL: [-1.05 - l, 0, 0.1 + along * 0.3], armR: [-1.05 - rr, 0, -0.1 + along * 0.3], body: [0.05, 0, -along * 0.12], head: [0.12, along * 0.4, 0] };
      }
      const bits = [0, 1, 2].map((n) => note(n, k)).filter((b): b is Bit => b !== null);
      return { frame: with1(rest, r, bits), glow: 0 };
    },
  };
}

// the hard parts (skate): a kickflip by the ramp, then it lands.
function hard(s: Island): Move {
  const rest = restOf(s);
  const R = one(rest);
  // its stance across the board (gags.ts SIDE): the knees bend, the body stays sideways, the head looks ahead
  const crouch: Rig = { ...R, y: R.y - 0.11, legL: 1.0, legR: -0.6, body: [0.15, R.body[1], 0], head: [-0.15, 0.6, 0], armL: [0, 0, -0.9], armR: [0, 0, 0.9] };
  const up: Rig = { ...R, legL: 0.8, legR: -0.5, armL: [0, 0, -1.35], armR: [0, 0, 1.35], mouth: 'oh', head: [0.15, 0.4, 0] };
  const top: Rig = { ...up, mouth: 'laugh', eyes: 0.3 };
  const landed: Rig = { ...crouch, mouth: 'laugh', eyes: 0.3 };
  const yes: Rig = { ...R, mouth: 'laugh', eyes: 0.3, armR: [0, 0, 2.4] };
  /** in the air from A to B of k */
  const A = 0.2, B = 0.68;
  return {
    s: 1.2,
    at(k) {
      if (k >= 1) return { frame: rest, glow: 0 };
      let r = keys(k, [[0, R], [A, crouch], [A + 0.1, up], [0.5, top], [B, top], [0.76, landed], [0.88, yes], [1, R]]);
      if (k > A && k < B) {
        const u = (k - A) / (B - A);
        const flip = env(u, 0.1, 0.85);
        r = {
          ...r,
          lift: 0.5 * Math.sin(Math.PI * u),
          // the kickflip: the board pops up to the feet's height and rolls once about its length
          board: { x: 0, y: 0.08 + 0.1 * Math.sin(Math.PI * u), z: 0, rot: [-0.3 * bump(u, 0, 0.3), 0, TAU * flip] },
        };
      }
      if (k > B && k < 0.8) r = { ...r, squash: { k: 0.3 * bump(k, B, 0.8), at: 0 } };
      return { frame: with1(rest, r), glow: 0 };
    },
  };
}

// you'll ask (reading): the lamp flicks brighter, it turns a page and peeks at you over the book.
function faq(s: Island): Move {
  const rest = restOf(s);
  const R = one(rest);
  const book0 = rest.bits?.find((b) => b.kind === 'book');
  if (book0?.kind !== 'book') throw new Error('faq: no book');
  const down: Rig = { ...R, head: [0.35, 0.05, 0] };
  const peek: Rig = { ...R, head: [-0.12, -0.12, 0.05], eyes: 0.7, armL: [-1.55, 0, 0.4], armR: [-1.55, 0, -0.4] };
  const flick = (k: number): number => {
    // on, a dip, on again, then held until it eases back
    if (k < 0.05) return k / 0.05;
    if (k < 0.09) return 1 - 0.75 * ((k - 0.05) / 0.04);
    if (k < 0.13) return 0.25 + 0.75 * ((k - 0.09) / 0.04);
    return 1 - env(k, 0.78, 1);
  };
  return {
    s: 1.5,
    at(k) {
      if (k >= 1) return { frame: rest, glow: 0 };
      const r = keys(k, [[0, R], [0.18, down], [0.55, down], [0.66, peek], [0.84, peek], [1, R]]);
      // a new page: from the right half over to the left
      const flip = k < 0.24 ? 1 - env(k, 0.14, 0.24) : env(k, 0.26, 0.5);
      const up = 0.14 * env(k, 0.55, 0.66) * (1 - env(k, 0.84, 1));
      const book: Bit = { ...book0, at: [book0.at[0], book0.at[1] + up, book0.at[2]], flip };
      return { frame: with1(rest, r, [book]), glow: flick(k) };
    },
  };
}

// desktop or terminal? (the end, two bims): a high five, then both wave.
function end(s: Island): Move {
  const rest = restOf(s);
  const A = one(rest, 0), B = one(rest, 1);
  const a1: Rig = { ...A, ...spot(-0.27, 0.05), dir: facing(1, 0.6), armR: [0, 0, 2.7], armL: [0, 0, -0.3], mouth: 'smile' };
  const b1: Rig = { ...B, ...spot(0.27, -0.05), dir: facing(-1, 0.6), armL: [0, 0, -2.7], armR: [0, 0, 0.3], mouth: 'smile' };
  const a2: Rig = { ...a1, body: [0, 0, -0.18], armR: [0, 0, 2.2], mouth: 'laugh', eyes: 0.3 };
  const b2: Rig = { ...b1, body: [0, 0, 0.18], armL: [0, 0, -2.2], mouth: 'laugh', eyes: 0.3 };
  const arm = (k: number): number => 2.5 - Math.sin(k * TAU) * 0.4;
  return {
    s: 1.6,
    at(k) {
      if (k >= 1) return { frame: rest, glow: 0 };
      let a = keys(k, [[0, A], [0.28, a1], [0.36, a2], [0.42, a2], [0.58, { ...A, mouth: 'laugh', eyes: 0.3 }], [0.9, { ...A, mouth: 'laugh', eyes: 0.3 }], [1, A]]);
      let b = keys(k, [[0, B], [0.28, b1], [0.36, b2], [0.42, b2], [0.58, { ...B, mouth: 'laugh', eyes: 0.3 }], [0.9, { ...B, mouth: 'laugh', eyes: 0.3 }], [1, B]]);
      // the slap: a little hop as their hands meet
      const hop = 0.12 * bump(k, 0.3, 0.42);
      a = { ...a, lift: (a.lift ?? 0) + hop };
      b = { ...b, lift: (b.lift ?? 0) + hop };
      const w = bump(k, 0.55, 0.95);
      if (w > 0) {
        const p = env(k, 0.55, 0.95) * 2;
        a = { ...a, armL: [0, 0, -lerp(0.3, arm(p), Math.min(1, w * 2))] };
        b = { ...b, armR: [0, 0, lerp(0.3, arm(p + 0.5), Math.min(1, w * 2))] };
      }
      const [x, y] = rest.bims;
      return { frame: { bims: [{ name: x?.name ?? '', rig: a }, { name: y?.name ?? '', rig: b }] }, glow: 0 };
    },
  };
}

const MOVES: Readonly<Record<IslandId, (s: Island) => Move>> = { ways, why, arts, fun, hard, faq, end };

/** an island's hover move */
export const moveOf = (s: Island): Move => MOVES[s.id](s);

/** the camera's way toward the viewer (a head looking at you faces it) */
export const TO_VIEWER = AZ;
