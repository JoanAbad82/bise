// His paper plane (q-planes, three): white paper folded in two wings, thrown from his side of the
// screen (the camera's: in from the view's bottom edge, big, as if from his hand) to the bim's hand
// at its desk in PLANE_FLIGHT seconds; then the bim holds it (pose.ts caught). The flight is a paper
// plane's (bims-plane): a glide that sinks in an arc, a zigzag that banks into each turn, a gentle
// pitch wave (phugoid), a little yaw wobble, one looping on its way, and a nose-up flare into the
// hand. Its speed comes from its height: slower up the climbs and over the loop, faster in the dives.
// The path is pure and seeded (planFlight, flightAt); the mesh only follows it.
import { BufferAttribute, BufferGeometry, CircleGeometry, DoubleSide, Group, LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial, type Material } from 'three';
import { BACK, RIGHT, UP, type Fit, type V3 } from './camera';
import { WORLD, rng } from './palette';
import { PLANE_FLIGHT } from './pose';
import type { Style } from './style';

const Y: V3 = { x: 0, y: 1, z: 0 };
const add = (a: V3, b: V3, k = 1): V3 => ({ x: a.x + b.x * k, y: a.y + b.y * k, z: a.z + b.z * k });
const sub = (a: V3, b: V3): V3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const mul = (a: V3, k: number): V3 => ({ x: a.x * k, y: a.y * k, z: a.z * k });
const dot = (a: V3, b: V3): number => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a: V3, b: V3): V3 => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
const norm = (a: V3): V3 => {
  const l = Math.hypot(a.x, a.y, a.z);
  return l < 1e-9 ? Y : mul(a, 1 / l);
};
const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number): number => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** 0 → 1 with no speed at either end: a loop enters and leaves on the path's own tangent */
const smoother = (t: number): number => t * t * t * (t * (t * 6 - 15) + 10);

/** how far below the view's bottom edge it starts, css px (past half its own size there); how high above the floor at least, units */
const START_PX = 12;
const START_Y = 1.6;
/** the u sampling of the time table */
const N = 240;

/**
 * Its length on screen as it leaves (close to his eye: big), css px: a fifth of the view's width,
 * never under START_MIN_PX nor over START_MAX_PX (bims m_32994: it never covers a pill or a name for
 * more than a blink, it shrinks fast).
 */
const START_MIN_PX = 48;
const START_MAX_PX = 160;
/** the iso view's shortening of its length on screen */
const FORESHORTEN = 1.25;
export function startPx(fit: Fit): number {
  return Math.min(START_MAX_PX, Math.max(START_MIN_PX, 0.2 * fit.widthPx));
}

/** how many times its held size (catch.ts HELD_LEN) it is as it leaves, for that view. Pure. */
export function startSize(fit: Fit, heldLen: number): number {
  return Math.max(1, (startPx(fit) * FORESHORTEN * fit.scale) / heldLen);
}

/**
 * Its size along the way (u: 0 his hand, 1 the bim's), times its held size: `big` at the start, 1 in
 * the bim's hand, shrinking all the way like a plane flying away from the eye (its distance grows,
 * its size goes as 1 / distance: fast at first), its shrink easing out into the hand (Gabriel: « leur
 * taille ne change pas »). Never grows. Pure.
 */
export function sizeAt(u: number, big: number): number {
  const k = clamp01(u);
  const far = 1 - (1 - k) * (1 - k);
  return 1 / (1 / big + (1 - 1 / big) * far);
}

/**
 * Where his plane leaves from: the middle of the view's bottom edge, just under it (`below` css px:
 * a big plane starts all out of the view), toward the camera (an ortho view: the same spot on screen,
 * in front of everything), and START_Y above the floor at least. Pure.
 */
export function cameraStart(fit: Fit, startX = 0.5, below = START_PX + startPx(fit) / 2): V3 {
  // startX: where along the bottom edge, a fraction of the view's width (a film's feed sits bottom left)
  const vx = fit.left + (fit.right - fit.left) * clamp01(startX);
  const vy = fit.bottom - below * fit.scale;
  const onScreen = add(add(fit.target, RIGHT, vx), UP, vy);
  // along BACK the screen spot stays; far enough toward him to be above the floor and in front of the office
  const k = Math.max(8, (START_Y - onScreen.y) / BACK.y);
  return add(onScreen, BACK, k);
}

/**
 * where its right hand catches (bim.ts: armR at +0.24 across, the catch reaches 0.38 forward), office
 * units; a little high and toward the camera so the laptop or its head never hide it (bims m_31601)
 */
const CATCH = { across: 0.24, ahead: 0.38, y: 1.1, toCamera: 0.1 } as const;
const BACK_LEVEL = Math.hypot(BACK.x, BACK.z);

/**
 * Where the plane ends: in front of the bim at (x, z) facing `dir` (bim.ts rotation.y), at its right
 * hand as it reaches out (pose.ts caught), never on its head or its spot (Gabriel via hero-town m_31513). Pure.
 */
export function catchPoint(x: number, z: number, dir: number): V3 {
  const c = Math.cos(dir);
  const s = Math.sin(dir);
  const cam = CATCH.toCamera / BACK_LEVEL;
  return {
    x: x + CATCH.across * c + CATCH.ahead * s + BACK.x * cam,
    y: CATCH.y,
    z: z - CATCH.across * s + CATCH.ahead * c + BACK.z * cam,
  };
}

/** one flight, planned once when it leaves (seeded: the same flight for the same message) */
export interface FlightPlan {
  readonly from: V3;
  readonly to: V3;
  /** the zigzag: its axis (level, across the way), amplitude, number of waves, and which side first */
  readonly side: V3;
  readonly zig: number;
  readonly waves: number;
  readonly sign: 1 | -1;
  /** how high its glide arcs over the straight line */
  readonly lift: number;
  /** the pitch wave (phugoid): amplitude, waves, phase */
  readonly phug: number;
  readonly phugWaves: number;
  readonly phase: number;
  /** the looping: where (u, the way's fraction) its middle is, its u width per turn, turns, radius, and the way it goes (level, a screen axis) */
  readonly loopAt: number;
  readonly loopW: number;
  readonly loops: number;
  readonly r: number;
  readonly loopFwd: V3;
  /** its flight's length, seconds */
  readonly dur: number;
  /** time (0..1) at u = i / N, from its speed along the path */
  readonly times: readonly number[];
}

export interface PlanInput {
  readonly from: V3;
  readonly to: V3;
  readonly seed: number;
  /** turns of the looping: 1, 2 for the y1 egg */
  readonly loops?: number;
  /** the plane's scale on screen (office-scene: never under PLANE_MIN_PX): the loop and zigzag size with it */
  readonly unit?: number;
  /** the '?' / '✗' pills on the way (the bims' heads): it never loops over one, it sweeps past (bims m_31314) */
  readonly avoid?: readonly V3[];
  /** its flight's length, seconds (unset: PLANE_FLIGHT; a film's later, shorter ones) */
  readonly dur?: number;
}

/** how far on screen (view-plane units) a point is from another: the iso view's own distance */
function onScreen(a: V3, b: V3): number {
  const d = sub(a, b);
  return Math.hypot(dot(d, RIGHT), dot(d, UP));
}

/** the loop's places to try, u of its middle (seeded order: the same flight for the same message) */
const LOOP_AT = [0.42, 0.46, 0.5, 0.54, 0.38, 0.58, 0.34, 0.62] as const;

/** the path's point at u (0: from, 1: to), the plane's own path before time; `to` may have moved since the plan */
function pathAt(f: FlightPlan, u: number, to: V3): V3 {
  const env = Math.sin(Math.PI * u);
  let p = add(f.from, sub(to, f.from), u);
  p = add(p, Y, f.lift * env + f.phug * env * Math.sin(2 * Math.PI * f.phugWaves * u + f.phase));
  // the zigzag crosses the line at the loop, at its fastest sideways: the loop goes on from that swing
  p = add(p, f.side, f.sign * f.zig * Math.pow(env, 0.8) * Math.sin(2 * Math.PI * f.waves * (u - f.loopAt)));
  const half = (f.loopW * f.loops) / 2;
  if (Math.abs(u - f.loopAt) < half) {
    const a = 2 * Math.PI * f.loops * smoother((u - f.loopAt + half) / (2 * half));
    p = add(add(p, f.loopFwd, f.r * Math.sin(a)), Y, f.r * (1 - Math.cos(a)));
  }
  return p;
}

/** its glide line (the arc without the waves and the loop): the height its speed is measured against */
function glideY(f: FlightPlan, u: number, to: V3): number {
  return f.from.y + (to.y - f.from.y) * u + f.lift * Math.sin(Math.PI * u);
}

/** Plan a flight from `from` (cameraStart) to `to` (the bim's hand). Pure: the same input, the same flight. */
export function planFlight(inp: PlanInput): FlightPlan {
  const { from, to } = inp;
  const unit = Math.max(1, inp.unit ?? 1);
  // 0: no loop (a film's later, shorter flights), 1 his message's, 2 the y1 egg's
  const loops = Math.max(0, Math.round(inp.loops ?? 1));
  const rand = rng(inp.seed);
  const way = sub(to, from);
  const level = Math.hypot(way.x, way.z);
  const side = level < 1e-6 ? RIGHT : norm(cross({ x: way.x, y: 0, z: way.z }, Y));
  const sign: 1 | -1 = rand() < 0.5 ? 1 : -1;
  // the loop turns in the view's plane (up and screen-right), forward the way the zigzag swings there
  const loopFwd = mul(RIGHT, dot(side, RIGHT) * sign >= 0 ? 1 : -1);
  // sized on the screen: the way toward the camera (BACK) shows no length in the iso view, so the
  // zigzag and the loop scale with the way he sees, never under the plane's own size
  const seen = Math.hypot(dot(way, RIGHT), dot(way, UP));
  const r = Math.max(0.95 * unit, 0.13 * seen) * (0.9 + 0.25 * rand());
  const draft: FlightPlan = {
    from, to, side, sign, loops, r, loopFwd, dur: inp.dur ?? PLANE_FLIGHT,
    zig: Math.min(Math.max(1.3 * unit, 0.32 * seen) * (0.8 + 0.4 * rand()), 0.3 * Math.max(level, 1)),
    waves: 1.6 + 0.5 * rand(),
    lift: 0.5 + 0.08 * Math.hypot(way.x, way.y, way.z) + 0.3 * rand(),
    phug: 0.12 * unit,
    phugWaves: 2.5 + rand(),
    phase: rand() * Math.PI * 2,
    loopAt: 0.5,
    loopW: 0.2,
    times: [],
  };
  // where it loops: the first place (from a seeded start) whose circle keeps clear of every pill on
  // screen; none clear, the one farthest from them
  const clear = 0.9 * unit;
  const start = Math.floor(rand() * 4);
  const avoid = inp.avoid ?? [];
  let best = { at: 0.5, gap: -Infinity };
  for (let i = 0; i < LOOP_AT.length; i++) {
    const at = LOOP_AT[(start + i) % LOOP_AT.length] ?? 0.5;
    // the loop's own points (24 along its window): the nearest any comes to a pill on screen
    const cand = { ...draft, loopAt: at };
    const half = (cand.loopW * loops) / 2;
    let gap = Infinity;
    for (let k = 0; k <= 24 && avoid.length > 0; k++) {
      const p = pathAt(cand, at - half + (2 * half * k) / 24, to);
      for (const q of avoid) gap = Math.min(gap, onScreen(p, q));
    }
    if (gap > clear) { best = { at, gap }; break; }
    if (gap > best.gap) best = { at, gap };
  }
  const plan: FlightPlan = { ...draft, loopAt: best.at };
  // time from speed: a steady glide's speed v0, less up a climb and more down a dive than its glide
  // line (v² = v0² - 2g·Δy), thrown fast from his hand, slowed by the flare into the bim's hand
  const g = 9.8;
  const v0sq = 2 * g * 2 * r * 1.35;
  const times = [0];
  let prev = pathAt(plan, 0, to);
  let total = 0;
  for (let i = 1; i <= N; i++) {
    const u = i / N;
    const p = pathAt(plan, u, to);
    const um = (i - 0.5) / N;
    const ym = (p.y + prev.y) / 2;
    const v = Math.sqrt(Math.max(0.1 * v0sq, v0sq - 2 * g * (ym - glideY(plan, um, to))))
      * (1 + 0.8 * (1 - smooth(0, 0.22, um)))
      * (1 - 0.5 * smooth(0.8, 1, um));
    total += Math.hypot(p.x - prev.x, p.y - prev.y, p.z - prev.z) / v;
    times.push(total);
    prev = p;
  }
  return { ...plan, times: times.map((t) => (total > 0 ? t / total : 0)) };
}

/** the plane at a moment: where, its nose and its top (an orthonormal pair); its size is sizeAt(u) */
export interface FlightFrame {
  readonly p: V3;
  readonly nose: V3;
  readonly up: V3;
  /** u: how far along its path (0..1) */
  readonly u: number;
}

/** u at time fraction f (the time table's inverse) */
function uAt(times: readonly number[], f: number): number {
  let lo = 0;
  let hi = times.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if ((times[mid] ?? 0) <= f) lo = mid;
    else hi = mid;
  }
  const a = times[lo] ?? 0;
  const b = times[hi] ?? 1;
  return (lo + (b > a ? (f - a) / (b - a) : 0)) / (times.length - 1);
}

/** how far into the loop's window (0 out, 1 well in): the bank and the wobble give way to the loop's own turn */
function inLoop(f: FlightPlan, u: number): number {
  if (f.loops === 0) return 0;
  const half = (f.loopW * f.loops) / 2;
  return 1 - smooth(half * 0.6, half + 0.05, Math.abs(u - f.loopAt));
}

/**
 * The plane s seconds into its flight (PLANE_FLIGHT long), flying to `to` (the hand, which may have
 * moved since the plan; the path bends to it). Pure.
 */
export function flightAt(f: FlightPlan, s: number, to: V3 = f.to): FlightFrame {
  const u = uAt(f.times, clamp01(s / f.dur));
  const du = 1 / N;
  const p = pathAt(f, u, to);
  const a = pathAt(f, Math.max(0, u - du), to);
  const b = pathAt(f, Math.min(1, u + du), to);
  const d1 = sub(b, a);
  const d2 = add(add(b, a), p, -2);
  let nose = norm(d1);
  // the flare: the nose comes up as it settles into the hand
  nose = norm(add(nose, Y, 0.9 * smooth(0.86, 1, u) * Math.hypot(nose.x, nose.z)));
  // the bank: into the turn, from how fast its level heading turns (a cartoon's, never past ~50°)
  const lv = Math.hypot(d1.x, d1.z);
  const turn = lv < 1e-9 ? 0 : (d1.x * d2.z - d1.z * d2.x) / (lv * lv * lv);
  const loop = inLoop(f, u);
  const env = Math.sin(Math.PI * u);
  const bank = (1 - loop) * Math.max(-0.85, Math.min(0.85, Math.atan(turn * 3)));
  const wobble = (1 - loop) * env * 0.09 * Math.sin(2 * Math.PI * 7 * u + f.phase * 1.7);
  // its top: up, rolled by the bank about the nose; in the loop, toward the loop's centre (upside down over the top)
  const half = (f.loopW * f.loops) / 2;
  const la = Math.abs(u - f.loopAt) < half ? 2 * Math.PI * f.loops * smoother((u - f.loopAt + half) / (2 * half)) : 0;
  const loopUp = add(mul(f.loopFwd, -Math.sin(la)), Y, Math.cos(la));
  const levelUp = norm(add(Y, cross(nose, Y), bank));
  let up = norm(add(mul(levelUp, 1 - loop), loopUp, loop));
  // the yaw wobble: the nose swings a little about its top
  nose = norm(add(nose, cross(up, nose), wobble));
  // orthonormal: the top square to the nose
  up = norm(sub(up, mul(nose, dot(up, nose))));
  return { p, nose, up, u };
}

/**
 * The film's paper plane (the hero, designer's hero-fix-2 §2: « trop vite, pas comme un avion en
 * papier »): light and slow. Tossed from the feed (it rises TOSS_PX over its first 0.3 s, slowing at
 * the top), then a glide at a nearly constant speed down one wide curve, rolling into it (never past
 * GLIDE_BANK) and level again after; a slow pitch wobble; it flares into the hand (nose up, half its
 * speed over its last 0.25 s). No zigzag, no loop. The app's flight (planFlight) is unchanged.
 */
export interface GlidePlan {
  readonly from: V3;
  readonly to: V3;
  /** the curve's side (level, across the way, its sign seeded) and how far it bows, units */
  readonly side: V3;
  readonly bow: number;
  /** the toss's rise, units */
  readonly toss: number;
  readonly dur: number;
  readonly phase: number;
  /** u (the path's fraction) at time i / N, from the speed profile along the path's length */
  readonly us: readonly number[];
}

/** the toss's rise, css px, and its length, s; the flare's length, s, its pitch, rad; the bank at most, rad; the wobble */
const TOSS_PX = 30;
const TOSS_S = 0.3;
const FLARE_S = 0.25;
const FLARE_PITCH = (10 * Math.PI) / 180;
export const GLIDE_BANK = (25 * Math.PI) / 180;
const WOBBLE = { pitch: (4 * Math.PI) / 180, period: 1.2 } as const;

/** the glide's path at u: a cubic from the toss to the hand, bowed to one side, the toss's bump on it */
function glidePath(g: GlidePlan, u: number, to: V3): V3 {
  const d = sub(to, g.from);
  const c1 = add(add(g.from, d, 0.35), g.side, g.bow);
  const c2 = add(add(g.from, d, 0.72), g.side, g.bow * 0.55);
  const v = 1 - u;
  const b = add(add(add(mul(g.from, v * v * v), c1, 3 * v * v * u), c2, 3 * v * u * u), to, u * u * u);
  const bump = smooth(0, 0.1, u) * (1 - smooth(0.1, 0.45, u));
  return add(b, Y, g.toss * bump);
}

/** Plan a glide from `from` (the feed's side of the screen) to `to` (the hand); `px`: units per css px. Pure. */
export function planGlide(inp: { readonly from: V3; readonly to: V3; readonly seed: number; readonly dur: number; readonly px: number }): GlidePlan {
  const rand = rng(inp.seed);
  const d = sub(inp.to, inp.from);
  const level = Math.hypot(d.x, d.z);
  const side = level < 1e-9 ? { x: 1, y: 0, z: 0 } : mul({ x: -d.z / level, y: 0, z: d.x / level }, rand() < 0.5 ? 1 : -1);
  const base = { from: inp.from, to: inp.to, side, bow: 0.22 * level, toss: TOSS_PX * inp.px, dur: inp.dur, phase: rand() * Math.PI * 2, us: [] as number[] };
  // the path's length table, then the time it takes along it: a little faster out of the hand
  // (slowing at the toss's top), steady, then half speed in the flare
  const len: number[] = [0];
  let prev = glidePath(base, 0, inp.to);
  for (let i = 1; i <= N; i++) {
    const p = glidePath(base, i / N, inp.to);
    len.push((len[i - 1] ?? 0) + Math.hypot(p.x - prev.x, p.y - prev.y, p.z - prev.z));
    prev = p;
  }
  const total = len[N] ?? 1;
  const tossT = TOSS_S / inp.dur;
  const flareT = FLARE_S / inp.dur;
  const speed = (t: number): number => (1 + 0.35 * (1 - smooth(0, tossT, t))) * (1 - 0.5 * smooth(1 - flareT, 1, t));
  const dist: number[] = [0];
  for (let j = 1; j <= N; j++) dist.push((dist[j - 1] ?? 0) + speed((j - 0.5) / N));
  const dmax = dist[N] ?? 1;
  let i = 0;
  for (let j = 0; j <= N; j++) {
    const want = ((dist[j] ?? 0) / dmax) * total;
    while (i < N && (len[i + 1] ?? total) < want) i++;
    const a = len[i] ?? 0;
    const b = len[i + 1] ?? total;
    base.us.push(Math.min(1, (i + (b > a ? (want - a) / (b - a) : 0)) / N));
  }
  return base;
}

/** The glide s seconds after the toss, to `to` (the hand, which may have moved). Pure. */
export function glideAt(g: GlidePlan, s: number, to: V3 = g.to): FlightFrame {
  const t = clamp01(s / g.dur);
  const k = t * N;
  const j = Math.min(N - 1, Math.floor(k));
  const u = (g.us[j] ?? 0) + ((g.us[j + 1] ?? 1) - (g.us[j] ?? 0)) * (k - j);
  const du = 1 / N;
  const p = glidePath(g, u, to);
  const a = glidePath(g, Math.max(0, u - du), to);
  const b = glidePath(g, Math.min(1, u + du), to);
  const d1 = sub(b, a);
  const d2 = add(add(b, a), p, -2);
  let nose = norm(d1);
  const flat = Math.hypot(nose.x, nose.z);
  // the pitch: its slow wobble (gone at both ends), and the flare's nose up over its last FLARE_S
  const env = smooth(0, 0.15, t) * (1 - smooth(0.85, 1, t));
  const pitch = WOBBLE.pitch * env * Math.sin((2 * Math.PI * s) / WOBBLE.period + g.phase) + FLARE_PITCH * smooth(1 - FLARE_S / g.dur, 1, t);
  nose = norm(add(nose, Y, Math.tan(pitch) * flat));
  // the bank: into the curve, from how fast its level heading turns, never past GLIDE_BANK
  const lv = Math.hypot(d1.x, d1.z);
  const turn = lv < 1e-9 ? 0 : (d1.x * d2.z - d1.z * d2.x) / (lv * lv * lv);
  const bank = Math.max(-GLIDE_BANK, Math.min(GLIDE_BANK, Math.atan(turn * 3)));
  let up = norm(add(Y, cross(nose, Y), Math.tan(bank)));
  up = norm(sub(up, mul(nose, dot(up, nose))));
  return { p, nose, up, u };
}

/** its ground shadow (bims m_31314: it sells the height, the loop's most): how dark at the floor, gone by FADE_H units up */
const SHADOW_ALPHA = 0.2;
const SHADOW_FADE_H = 7;

/** The shadow under a plane at p over a floor at y=floor: its opacity and size (1: the plane's), 0 high up. Pure. */
export function shadowOf(p: V3, floor: number): { alpha: number; size: number } {
  const h = Math.max(0, p.y - floor);
  return { alpha: SHADOW_ALPHA * (1 - smooth(0, SHADOW_FADE_H, h)), size: 1 + h * 0.12 };
}

/**
 * The folded paper dart (Gabriel: « il n'est pas en triangle au bout, il n'est pas pointu »), length 1
 * along +z, its nose at z = 0.5: one point; two triangular wings from the nose to their tips at the
 * tail, a little dihedral; a triangular keel under the spine. `fold` 0 the plane, 1 the open sheet
 * it was folded from (a letter, 0.78 wide): the keel flattens into the spine, the wings open to the
 * sheet's halves, their leading edges stay as its creases. Seven points, the same triangles at every
 * fold (one face each, never two on one plane: the coplanar law). Pure.
 */
export const DART = { span: 0.3, dihedral: 0.07, keel: 0.16, sheet: 0.39 } as const;
export type Dart = Record<'nose' | 'tail' | 'tipR' | 'cornerR' | 'tipL' | 'cornerL' | 'keel', V3>;
export function dartAt(fold: number): Dart {
  const f = clamp01(fold);
  const lerp = (a: V3, b: V3): V3 => add(a, sub(b, a), f);
  const nose = { x: 0, y: 0, z: 0.5 };
  const tail = { x: 0, y: 0, z: -0.5 };
  const { span, dihedral, keel, sheet } = DART;
  return {
    nose, tail,
    tipR: lerp({ x: span, y: dihedral, z: -0.5 }, { x: sheet, y: 0, z: -0.5 }),
    cornerR: lerp(nose, { x: sheet, y: 0, z: 0.5 }),
    tipL: lerp({ x: -span, y: dihedral, z: -0.5 }, { x: -sheet, y: 0, z: -0.5 }),
    cornerL: lerp(nose, { x: -sheet, y: 0, z: 0.5 }),
    keel: lerp({ x: 0, y: -keel, z: -0.5 }, tail),
  };
}
/** the wings' triangles, the keel's, and the ink's edges, as the dart's point names */
const WING_TRIS = [['nose', 'tail', 'tipR'], ['nose', 'tipR', 'cornerR'], ['nose', 'tipL', 'tail'], ['nose', 'cornerL', 'tipL']] as const;
const KEEL_TRIS = [['nose', 'keel', 'tail']] as const;
const INK_EDGES = [
  ['nose', 'tipR'], ['tipR', 'tail'], ['nose', 'cornerR'], ['cornerR', 'tipR'],
  ['nose', 'tipL'], ['tipL', 'tail'], ['nose', 'cornerL'], ['cornerL', 'tipL'],
  ['nose', 'tail'], ['nose', 'keel'], ['keel', 'tail'],
] as const;
type Name = keyof Dart;

export interface Plane {
  /** the plane itself (length 1 along +z: the caller scales it), oriented by the caller */
  readonly group: Group;
  /** its soft shadow, flat on the floor (the caller places it; hidden off the slab) */
  readonly shadow: Mesh;
  /** a hairline ink edge (light theme: white paper on the cream page needs one) */
  setInk(on: boolean): void;
  /** 0 the folded plane, 1 the open sheet (dartAt) */
  setFold(fold: number): void;
  dispose(): void;
}

function fill(buf: BufferAttribute, d: Dart, list: readonly (readonly Name[])[]): void {
  let i = 0;
  for (const names of list) for (const n of names) { const p = d[n]; buf.setXYZ(i++, p.x, p.y, p.z); }
  buf.needsUpdate = true;
}

export function makePlane(style: Style): Plane {
  const g = new Group();
  const paper: Material = style.material(WORLD.paper, { flat: true });
  const shade: Material = style.material(WORLD.paperShade, { flat: true });
  // one face each, seen from both sides
  paper.side = DoubleSide;
  shade.side = DoubleSide;
  const part = (tris: number, m: Material): { mesh: Mesh; pos: BufferAttribute } => {
    const geo = new BufferGeometry();
    const pos = new BufferAttribute(new Float32Array(tris * 9), 3);
    geo.setAttribute('position', pos);
    return { mesh: new Mesh(geo, m), pos };
  };
  const wings = part(WING_TRIS.length, paper);
  const keel = part(KEEL_TRIS.length, shade);
  // the ink edge: the outline and the creases, a hairline at any size (lines are one px)
  const inkGeo = new BufferGeometry();
  const inkPos = new BufferAttribute(new Float32Array(INK_EDGES.length * 6), 3);
  inkGeo.setAttribute('position', inkPos);
  const inkMat = new LineBasicMaterial({ color: WORLD.ink, transparent: true, opacity: 0.55 });
  const ink = new LineSegments(inkGeo, inkMat);
  g.add(wings.mesh, keel.mesh, ink);
  let last = -1;
  const setFold = (fold: number): void => {
    const f = clamp01(fold);
    if (f === last) return;
    last = f;
    const d = dartAt(f);
    fill(wings.pos, d, WING_TRIS);
    fill(keel.pos, d, KEEL_TRIS);
    fill(inkPos, d, INK_EDGES);
    for (const geo of [wings.mesh.geometry, keel.mesh.geometry, inkGeo]) {
      geo.computeBoundingSphere();
    }
    wings.mesh.geometry.computeVertexNormals();
    // flat on the sheet: no keel left to draw
    keel.mesh.visible = f < 0.97;
  };
  setFold(0);
  const shadowMat = new MeshBasicMaterial({ color: WORLD.ink, transparent: true, opacity: SHADOW_ALPHA, depthWrite: false });
  const shadow = new Mesh(new CircleGeometry(0.2, 24), shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(0.8, 1.4, 1); // longer along the nose (its local y once flat; the caller turns it)
  shadow.visible = false;
  return {
    group: g,
    shadow,
    setInk(on) {
      ink.visible = on;
    },
    setFold,
    dispose() {
      for (const geo of [wings.mesh.geometry, keel.mesh.geometry, inkGeo, shadow.geometry]) geo.dispose();
      paper.dispose();
      shade.dispose();
      inkMat.dispose();
      shadowMat.dispose();
    },
  };
}
