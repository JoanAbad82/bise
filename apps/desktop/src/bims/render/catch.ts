// His paper plane's catch (plane-catch, Gabriel: « là l'avion disparaît et tout de suite il a quelque
// chose dans la main »): its beats and where the plane is in the bim's hand at each one. Pure, no
// three. One plane from his side of the screen to its end, never swapped: the bim looks up and raises
// its right arm before the plane lands (REACH_S), the plane lands on the hand's real point (office-scene
// flies it there), the hand gives a little, brings it in, it unfolds into a sheet, a short read, then
// it goes away: laid on the desk beside the laptop (a seated bim; it stays there while the bim keeps
// its state, timeline.ts Pose.letter) or folded and slipped into the pocket at its hip (a standing
// one), then a short thumbs up. pose.ts caught() poses the arm on these beats; office-scene.ts puts
// the plane where heldAt says, in the bim's frame (x its right arm's side, y up, z ahead).
import type { Activity } from '../model';
import type { V3 } from './camera';

/** the plane's length in the bim's hand, office units: a letter for a bim */
export const HELD_LEN = 0.28;

/** the beats, seconds from the catch (c = 0: the plane in the hand); REACH_S before it, the arm goes up */
export const REACH_S = 0.5;
export const BEAT = {
  give: 0.15,
  bring: 0.45,
  unfold: 0.75,
  read: 1.35,
  away: 1.75,
  thumbs: 2.05,
} as const;
/** the catch's length after the flight, s */
export const PLANE_CATCH = 2.2;

/** where a caught plane goes once read */
export type Away = 'desk' | 'pocket';

/** at its own desk (its activity's spot) it lays the sheet there; anywhere else, its pocket */
export const awayOf = (act: Pick<Activity, 'at'>): Away => (act.at === 'desk' ? 'desk' : 'pocket');

/** the plane in the hand at a moment of the catch */
export interface Held {
  /** 0 the folded plane, 1 the open sheet (plane.ts makePlane setFold) */
  readonly fold: number;
  /** 0 open, 1 folded in four (the pocket's) */
  readonly quarter: number;
  /** its nose and its top in the bim's frame (an orthonormal pair) */
  readonly nose: V3;
  readonly up: V3;
  /** how much of that orientation (0: still the flight's last, 1: all of it) */
  readonly hold: number;
  /** where the hand grips it, along its length (-0.5 the tail .. 0.5 the nose) */
  readonly grip: number;
  /** 0 in the hand; 1 at its end: in the pocket (pocket) or on the desk (desk) */
  readonly put: number;
  /** drawn: false once it is inside the pocket (the body hides it there first) */
  readonly shown: boolean;
}

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
const ease = (a: number, b: number, x: number): number => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const norm = (a: V3): V3 => {
  const l = Math.hypot(a.x, a.y, a.z);
  return { x: a.x / l, y: a.y / l, z: a.z / l };
};
const mixV = (a: V3, b: V3, f: number): V3 => ({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, z: a.z + (b.z - a.z) * f });

/** held in, nose ahead and a little up; read: open, its face to the bim's eyes; the pocket: nose down; the desk: flat */
const HOLD = { nose: norm({ x: 0, y: 0.3, z: 0.95 }), up: norm({ x: 0, y: 0.95, z: -0.3 }) };
const READ = { nose: norm({ x: 0, y: 0.87, z: 0.5 }), up: norm({ x: 0, y: 0.5, z: -0.87 }) };
const POCKET = { nose: { x: 0, y: -1, z: 0 }, up: { x: 0, y: 0, z: 1 } };
const DESK = { nose: norm({ x: 0.17, y: 0, z: 0.98 }), up: { x: 0, y: 1, z: 0 } };

/** the pocket: from the hand at its hip, this far into the body (the hoodie hides it), bim frame */
export const POCKET_SINK: V3 = { x: -0.12, y: 0, z: -0.08 };
/** the desk's spot for it: beside the laptop on its right arm's side, toward the bim, bim frame (y: the desk top's) */
export const DESK_SPOT = { x: 0.42, z: 0.3 } as const;

/** an orientation between two (nlerp, then square again) */
function turn(a: { nose: V3; up: V3 }, b: { nose: V3; up: V3 }, f: number): { nose: V3; up: V3 } {
  const nose = norm(mixV(a.nose, b.nose, f));
  const u = mixV(a.up, b.up, f);
  const d = u.x * nose.x + u.y * nose.y + u.z * nose.z;
  return { nose, up: norm({ x: u.x - nose.x * d, y: u.y - nose.y * d, z: u.z - nose.z * d }) };
}

/**
 * The plane c seconds after the catch (c < 0: still flying, not held). `reduced` (reduced motion): no
 * flight, no fold: the open sheet in the hand from the plane's start (c = -flight) to the read's end,
 * then where it goes. Pure.
 */
export function heldAt(c: number, away: Away, reduced = false): Held | null {
  if (reduced) {
    if (c >= BEAT.read) return away === 'desk' ? { fold: 1, quarter: 0, ...DESK, hold: 1, grip: 0, put: 1, shown: true } : null;
    return { fold: 1, quarter: 0, ...READ, hold: 1, grip: -0.4, put: 0, shown: true };
  }
  if (c < 0) return null;
  const fold = ease(BEAT.bring, BEAT.unfold, c);
  let o = turn(HOLD, READ, ease(BEAT.bring, BEAT.bring + 0.2, c));
  let grip = -0.4 * ease(BEAT.bring, BEAT.unfold, c);
  let quarter = 0;
  let put = 0;
  if (away === 'desk') {
    const k = ease(BEAT.read, BEAT.away, c);
    o = turn(o, DESK, k);
    grip *= 1 - k;
    put = k;
  } else {
    quarter = ease(BEAT.read, BEAT.read + 0.2, c);
    o = turn(o, POCKET, ease(BEAT.read, BEAT.read + 0.2, c));
    grip = grip + (-0.3 - grip) * quarter;
    put = ease(BEAT.read + 0.2, BEAT.away, c);
  }
  return {
    fold, quarter, ...o, grip, put,
    hold: ease(0, 0.3, c),
    shown: away === 'desk' || c < BEAT.away,
  };
}

/** the open sheet on its desk after the catch (timeline.ts Pose.letter): where heldAt's desk ends */
export const ON_DESK: Held = { fold: 1, quarter: 0, ...DESK, hold: 1, grip: 0, put: 1, shown: true };
