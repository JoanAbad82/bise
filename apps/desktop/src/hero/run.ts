// The hero film's offices run by the app's own brains (office-driver.ts, one per office): each told
// its rows (world.ts) when they change and its messages when they come, stepped exactly at those
// times (so a walk starts on its beat, never a frame late, and every loop plays the same), then
// asked for the frame at any t with the eggs the score forces then. The film starts PRE_S before
// 0:00 (the pre-roll, never drawn) so the first loop's 0:00 is the same frame as every later one's.
// Pure (no DOM, no three): the film draws its steps, the checks read them. Owner: hero-town.
import { localOf } from '../bims/eggs';
import { growOf } from '../bims/growth';
import { labelsOf } from '../bims/labels';
import { layoutOf } from '../bims/maps';
import { makeDriver, NO_ATTENTION, type Attention, type Clock, type OfficeDriver, type Step } from '../bims/office-driver';
import type { Activity, BimFrame, Office, PlaneFlight, Spot } from '../bims/model';
import { newTimeline } from '../bims/timeline';
import { CAST, FILM_S, NOTES, REVIEWER, type Cast } from './cast';
import { activitiesOf, changesIn, eggsAt, eventsIn, filmT, growthOf, loopOf, ORIGIN, rowsAt, rowsSig } from './world';

/**
 * The world's clock when the film starts: its first loop's 0:00. Every loop starts from fresh office
 * brains at its 0:00 (the fold erased the town, the wave builds it again: bims-film v11), so every
 * loop is the first one (run.test.ts).
 */
export const START_T = ORIGIN;

/** one day for the whole film: no clock egg can start (they are forced or off) */
const LOCAL = localOf(new Date(2026, 9, 14, 11, 0, 0));

export interface Run {
  readonly cast: Cast;
  /** this loop's brains (a new one at each loop's 0:00) */
  driver: OfficeDriver;
  /** its rows' signature told to the driver last */
  sig: string;
  /** the loop it plays (loopOf) */
  loop: number;
  /** its brains' clock it was advanced to: the first loop's world time (ORIGIN + the time into the loop), whatever loop it plays */
  at: number;
}

/** The clock of a frame at world time t: the film's one day, its eggs forced (never rolled), no sky. Pure. */
export function clockOf(office: string, t: number, night: boolean, reduced: boolean): Clock {
  // the film's own fixed light (its theme's), never his clock's sky: the film stays deterministic
  return { t, local: LOCAL, night, reduced, forced: reduced ? { bims: {} } : eggsAt(office, filmT(t)), sky: false };
}

/** its rows at t told to its driver: when they changed, or always (`beat`: the timeline hears them again) */
function tell(r: Run, t: number, beat = false): void {
  const sig = rowsSig(r.cast, filmT(t));
  if (sig === r.sig && !beat) return;
  r.sig = sig;
  const { snap, agents } = rowsAt(r.cast, filmT(t));
  r.driver.rows(snap, agents, r.cast.map);
}

/** One office's run, its rows heard at world time t (the film's start). */
export function makeRun(cast: Cast, t: number): Run {
  const loop = loopOf(t);
  const r: Run = { cast, driver: brains(cast), sig: '', loop, at: t };
  fresh(r, t - loop * FILM_S);
  return r;
}

/** the reviewer stands beside the first crate in main's queue (bims-film v13), a step to its side */
export function reviewSpot(name: string, o: Office, act: Activity): Spot | null {
  if (name !== REVIEWER || act.at !== 'desk' || act.k === 'visit') return null;
  const q = o.queue[0];
  if (q === undefined) return null;
  const side = 0.9;
  return { ...q, x: q.x + Math.cos(q.face) * side, z: q.z - Math.sin(q.face) * side, wz: q.wz };
}

// no skater: the film never shows the park (bims-film v8, Gabriel's review); every agent pops at its
// desk, never by the door (bims-film v13)
const brains = (cast: Cast): OfficeDriver =>
  makeDriver({ activities: activitiesOf(cast, filmT), layoutOf, newTimeline: () => newTimeline({ enterAtSpot: true, spotOf: reviewSpot }), labelsOf, pastimes: false });

/** its brains new at world time t (a loop's 0:00, or the film's start), its rows there told */
function fresh(r: Run, t: number): void {
  r.driver = brains(r.cast);
  r.sig = '';
  r.at = t;
  tell(r, t);
  r.driver.grow(growOf(growthOf(r.cast)), t);
  r.driver.step(clockOf(r.cast.id, t, false, false), NO_ATTENTION);
}

/** Every office of the film, at world time t. */
export const makeRuns = (t: number = START_T): Run[] => CAST.map((c) => makeRun(c, t));

/** Moves a run to world time t: each change in between told and stepped at its own time. */
export function advance(r: Run, t: number, night: boolean, reduced: boolean): void {
  // a new loop: new brains at its 0:00, on the first loop's clock (the fold took every bim; nothing
  // carries over, and every seed the app takes from its clock is the same): every loop is the first
  const loop = loopOf(t);
  if (loop < r.loop) return;
  if (loop > r.loop) {
    r.loop = loop;
    fresh(r, ORIGIN);
  }
  const lt = t - loop * FILM_S;
  if (lt <= r.at) return;
  const evs = eventsIn(r.cast.id, r.at, lt);
  for (const at of changesIn(r.cast.id, r.at, lt)) {
    tell(r, at, true);
    for (const e of evs) if (e.t === at) r.driver.event(e);
    r.driver.step(clockOf(r.cast.id, at, night, reduced), NO_ATTENTION);
  }
  r.at = lt;
}

/** where his planes leave from, a fraction of the view's width along its bottom edge: under the feed (bims-plane m_31729) */
export const FEED_X = 0.82;
/** his planes' least length on screen, css px (designer m_31992: ~40 px wide, never a speck) */
export const FEED_PLANE_PX = 36;

/**
 * A frame's plane with the score's flight (cast.ts Note.flight: its length, its loops) and the feed's
 * start, found by the film time it left at (±0.05 s); a plane the score has no flight for is the app's.
 * Pure.
 */
export function withFlight(office: string, f: BimFrame, t: number): BimFrame {
  const fly = (p: PlaneFlight): PlaneFlight => {
    const left = filmT(t - p.since);
    const n = NOTES.find((x) => x.office === office && x.from === 'you' && x.to === f.name && x.flight !== undefined && Math.abs(x.at - left) < 0.05);
    return n?.flight === undefined ? p : { ...p, dur: n.flight.dur, loops: n.flight.loops, startX: FEED_X, glide: true, minPx: FEED_PLANE_PX };
  };
  const { plane, aloft } = f.pose;
  if (plane === undefined && aloft === undefined) return f;
  // the earlier ones still on their way fly theirs too (designer m_32877: a new plane never cuts one)
  return { ...f, pose: { ...f.pose, ...(plane === undefined ? {} : { plane: fly(plane) }), ...(aloft === undefined ? {} : { aloft: aloft.map(fly) }) } };
}

/** The office's frame at its time (advance first), its planes flown as the score says. */
export function stepOf(r: Run, night: boolean, reduced: boolean, a: Attention = NO_ATTENTION): Step | null {
  const st = r.driver.step(clockOf(r.cast.id, r.at, night, reduced), a);
  if (st === null || !st.played.some((f) => f.pose.plane !== undefined || f.pose.aloft !== undefined)) return st;
  const fly = (fs: readonly BimFrame[]): BimFrame[] => fs.map((f) => withFlight(r.cast.id, f, r.at));
  return { ...st, frames: fly(st.frames), played: fly(st.played) };
}
