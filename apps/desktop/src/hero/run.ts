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
import { newTimeline } from '../bims/timeline';
import { CAST, type Cast } from './cast';
import { activitiesOf, changesIn, eggsAt, eventsIn, filmT, growthOf, ORIGIN, rowsAt, rowsSig } from './world';

/**
 * The pre-roll, s: the film starts at 1:39 of a loop before (a calm time: every bim at its spot)
 * and plays to 0:00 undrawn, past both skaters' sessions' starts (1:46, 4:50): the first loop's
 * 0:00 is then every later loop's (run.test.ts).
 */
export const PRE_S = 201;
/** the world's clock when the film starts (its pre-roll) */
export const START_T = ORIGIN - PRE_S;

/** one day for the whole film: no clock egg can start (they are forced or off) */
const LOCAL = localOf(new Date(2026, 9, 14, 11, 0, 0));

export interface Run {
  readonly cast: Cast;
  readonly driver: OfficeDriver;
  /** its rows' signature told to the driver last */
  sig: string;
  /** the world time it was advanced to */
  at: number;
}

/** The clock of a frame at world time t: the film's one day, its eggs forced (never rolled). Pure. */
export function clockOf(office: string, t: number, night: boolean, reduced: boolean): Clock {
  return { t, local: LOCAL, night, reduced, forced: reduced ? { bims: {} } : eggsAt(office, filmT(t)) };
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
  const driver = makeDriver({ activities: activitiesOf(cast, filmT), layoutOf, newTimeline, labelsOf });
  const r: Run = { cast, driver, sig: '', at: t };
  tell(r, t);
  driver.grow(growOf(growthOf(cast)), t);
  driver.step(clockOf(cast.id, t, false, false), NO_ATTENTION);
  return r;
}

/** Every office of the film, at world time t. */
export const makeRuns = (t: number = START_T): Run[] => CAST.map((c) => makeRun(c, t));

/** Moves a run to world time t: each change in between told and stepped at its own time. */
export function advance(r: Run, t: number, night: boolean, reduced: boolean): void {
  if (t <= r.at) return;
  const evs = eventsIn(r.cast.id, r.at, t);
  for (const at of changesIn(r.cast.id, r.at, t)) {
    tell(r, at, true);
    for (const e of evs) if (e.t === at) r.driver.event(e);
    r.driver.step(clockOf(r.cast.id, at, night, reduced), NO_ATTENTION);
  }
  r.at = t;
}

/** The office's frame at its time (advance first). */
export const stepOf = (r: Run, night: boolean, reduced: boolean, a: Attention = NO_ATTENTION): Step | null =>
  r.driver.step(clockOf(r.cast.id, r.at, night, reduced), a);
