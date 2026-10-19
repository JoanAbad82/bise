// One office's brain (page town-live p1, architect m_28994): what its bims do, out of Office.tsx so
// the minimap and the town drive an office the same way. Rows in (the project's agents, cards,
// places, his map pick, its growth, hub/activity's events), out per frame: the office's plan,
// each bim's pose with its easter egg and halo, the look the renderer draws (night, eggs, growth,
// the unlock moment) and the labels; plus what the still office's clock check compares. It keeps
// the timeline, today's lands, his konami time, his pokes and the unlock moment. No React, no three, no DOM:
// the caller hands it the clock (t, his local time, night, reduced motion) and the forced eggs of
// a check; the look carries his local time's sky (sky.ts skyAt; none for the hero's film). Owner: bims-wire.
import type { Agent } from '@/proto';
import type { BimEvent, BimFrame, Label, Look, NewTimelineFn, ActivitiesFn, LabelsFn, LayoutFn, Office, Snapshot, Timeline } from './model';
import { clockSig, eggLabels, eggsAt, NO_EGGS, noteLands, withForced, type Forced, type Land, type Local } from './eggs';
import { builtAt, NO_GROW, UNLOCK_LABEL, UNLOCK_WALK, unlockOf, type Grow } from './growth';
import { dayOf } from './skate';
import { MAX_WALK_S, SETTLE_S } from './timeline';
import type { MapId } from './maps/ids';
import { skyAt, skyOf, type Sky, type Weather } from './sky';
import { forcedPokes, notePokes, NO_POKES, pokesAt, pokeWake, roomOf, type Click, type PokeLog } from './pokes';

/** The pure modules a driver runs on: feed.ts's, or fakes in a test. */
export interface DriverParts {
  readonly activities: ActivitiesFn;
  readonly layoutOf: LayoutFn;
  readonly newTimeline: NewTimelineFn;
  readonly labelsOf: LabelsFn;
  /** false: its idle bims never take up a pastime (the hero's film: no skater, bims-film v8); absent: the app's */
  readonly pastimes?: boolean;
}

/** The clock and the room a frame is drawn in, read by the caller. */
export interface Clock {
  /** s */
  readonly t: number;
  readonly local: Local;
  readonly night: boolean;
  readonly reduced: boolean;
  /** a check's frozen eggs (test mode, window.__biseEggs): only these, never a roll; absent: the scheduler's */
  readonly forced?: Forced | null;
  /** a check's pinned weather (test mode, window.__biseSky); absent: the slot's spell (sky.ts) */
  readonly weather?: Weather;
  /** false: no sky (the theme's fixed light, the hero's film); absent: his local time's */
  readonly sky?: boolean;
}

/** What he points at in this office: the hovered bim, ctrl held, the row under his pointer, the bim the camera follows. */
export interface Attention {
  readonly hover: string | null;
  readonly held: boolean;
  readonly lit: string | null;
  readonly follow: string | null;
}

export const NO_ATTENTION: Attention = { hover: null, held: false, lit: null, follow: null };

/** One frame's brain. */
export interface Step {
  readonly office: Office;
  /** the live agents it was laid for (the renderer's setOffice) and the map he picked (the drawn one is office.map: the loft for a map not ready yet) */
  readonly agents: readonly Agent[];
  readonly want: MapId;
  /** the office's plan is new this frame (another agent, another map): the renderer gets it again */
  readonly reshaped: boolean;
  /** each bim's pose at t, before its egg */
  readonly frames: readonly BimFrame[];
  /** what the renderer draws: the poses with their eggs and halos */
  readonly played: readonly BimFrame[];
  readonly look: Look;
  readonly labels: ReadonlyMap<string, Label>;
  /** whether anything walks at t (timeline.moving) */
  readonly moving: boolean;
  /** s until a poke starts or ends that no frame would see (a delayed one, a word alone); null: none */
  readonly wake: number | null;
}

export interface OfficeDriver {
  /** a new snapshot, agents or map: the next step lays the office again if its shape changed */
  rows(snap: Snapshot, agents: readonly Agent[], map: MapId): void;
  /** the growth drawn now (its high-water mark); a stage past the last one starts the unlock moment at t */
  grow(g: Grow, t: number): void;
  /** hub/activity: a plane, a visit, a report */
  event(e: BimEvent): void;
  /** he typed the konami code at t */
  konami(t: number): void;
  /** he clicked this bim: its poke (pokes.ts) starts at t */
  poke(name: string, t: number): void;
  /** the frame at this clock; null before any rows */
  step(c: Clock, a: Attention): Step | null;
  /**
   * The office still (the town's far offices, page town-live): the rows heard at c.t, every bim
   * posed STILL_AHEAD s later (its walk done, at its state's spot), reduced motion, no egg, no
   * halo, no unlock moment; the labels are the pills ('?', '✗'). null before any rows.
   */
  still(c: Clock): Step | null;
  /** the still office's check: true when the clock's eggs or an activity changed since the last step (the next step hears the rows again) */
  stale(c: Clock): boolean;
}

/** the sky of a clock (sky.ts): its slot's, a check's pinned weather on its sun; none when the clock says so */
function skyOfClock(c: Clock): Sky | null {
  if (c.sky === false) return null;
  const m = skyAt(c.local);
  return c.weather === undefined ? m.sky : skyOf(m.sun, c.weather);
}
const skyKey = (c: Clock): string => (c.sky === false ? '' : `${String(skyAt(c.local).slot)}|${c.weather ?? ''}`);

/** The office's agents in a stable shape (the live rows: archived ones have left). Pure. */
export const officeKey = (agents: readonly Agent[], map: MapId): string => `${map}|${agents.map((a) => `${a.name}${a.main ? '*' : ''}`).join(',')}`;

/** how far ahead a still office is posed: past a walk (MAX_WALK_S) and its settling */
export const STILL_AHEAD = MAX_WALK_S + SETTLE_S + 1;

export function makeDriver(parts: DriverParts): OfficeDriver {
  const timeline: Timeline = parts.newTimeline();
  let snap: Snapshot | null = null;
  let agents: readonly Agent[] = [];
  let map: MapId | null = null;
  let fresh = true;
  let events: BimEvent[] = [];
  let office: Office | null = null;
  let shape = '';
  let g: Grow = NO_GROW;
  let seen: Grow | null = null;
  let unlock: { stage: number; at: number } | undefined;
  let lands: { day: string; lands: readonly Land[] } = { day: '', lands: [] };
  let konamiAt: number | null = null;
  let clicks: Click[] = [];
  let pokes: PokeLog = NO_POKES;
  let lastActs = '';
  let lastClock = '';
  /** the sky's slot and pin the last step drew (skyKey): a new slot is a frame (its blend) */
  let lastSky = '';

  return {
    rows(s, as, m) {
      snap = s;
      agents = as;
      map = m;
      fresh = true;
    },
    grow(next, t) {
      g = next;
      // the first growth drawn is no moment; a stage past the last drawn one is
      const u = unlockOf(seen, next);
      if (u !== null) unlock = { stage: u, at: t };
      seen = next;
      // the timeline hears of it too: a napper at its desk takes a bean bag the stage built (timeline.ts bedFor)
      fresh = true;
    },
    event(e) {
      events.push(e);
      fresh = true;
    },
    konami(t) {
      konamiAt = t;
    },
    poke(name, t) {
      clicks.push({ name, t });
    },
    step(c, a) {
      const heard = hear(c);
      if (heard === null) return null;
      return pose(heard.office, heard.reshaped, c, a);
    },
    still(c) {
      const heard = hear(c);
      if (heard === null) return null;
      return pose(heard.office, heard.reshaped, { ...c, t: c.t + STILL_AHEAD, reduced: true, forced: { bims: {} } }, NO_ATTENTION, true);
    },
    stale(c) {
      if (snap === null) return false;
      // the clock's eggs (the eclipse, friday 17:00, midnight) start and end without a row change
      // a new sky slot (sky.ts: every 5 min at most) is a frame too: its blend
      const changed = clockSig(c.local, c.night, agents) !== lastClock || skyKey(c) !== lastSky || JSON.stringify([...parts.activities(snap, c.t)]) !== lastActs;
      // the next step hears the rows again: the timeline walks the bims to their new activities
      if (changed) fresh = true;
      return changed;
    },
  };

  /** the rows since the last frame, heard at c.t: the office laid again if its shape changed, the timeline told */
  function hear(c: Clock): { office: Office; reshaped: boolean } | null {
      if (snap === null || map === null) return null;
      const { t, local, reduced } = c;
      let reshaped = false;
      if (fresh) {
        fresh = false;
        const key = officeKey(agents, map);
        if (office === null || key !== shape) {
          shape = key;
          office = parts.layoutOf(agents, map);
          reshaped = true;
        }
        const acts = parts.activities(snap, t);
        lastActs = JSON.stringify([...acts]);
        // a map with a park: who skates reads the stage, the jobs' high-water mark (never the live count), his day, reduced motion
        const fun = parts.pastimes === false ? undefined : { stage: g.stage, jobs: g.jobs, dow: local.dow, day: dayOf(local.y, local.mo, local.d), reduced };
        timeline.update(acts, office, t, events, builtAt(g.stage), fun);
        events = [];
      }
      return office === null ? null : { office, reshaped };
  }

  /** every bim at c.t, its egg and halo, the look and the labels; `still`: no unlock moment */
  function pose(office: Office, reshaped: boolean, c: Clock, a: Attention, still = false): Step {
      const { t, local, night, reduced } = c;
      const main = new Set(agents.filter((x) => x.main).map((x) => x.name));
      const frames: BimFrame[] = [];
      for (const name of timeline.names(t)) {
        const pose = timeline.poseAt(name, t);
        if (pose !== null) frames.push({ name, main: main.has(name), pose });
      }
      // his easter eggs (eggs.ts): one pass between the poses and the labels; a check's forced ones alone
      lands = noteLands(lands, frames, local);
      const eg = c.forced !== undefined ? withForced(NO_EGGS, c.forced) : eggsAt({ t, frames, agents, cards: snap?.cards.length ?? 0, local, night, reduced, lands: lands.lands, konami: konamiAt, stage: g.stage });
      lastClock = clockSig(local, night, agents);
      lastSky = skyKey(c);
      // his pokes (pokes.ts): a click heard against the bim's state now; a poke beats its egg while it plays
      pokes = notePokes(pokes, clicks, frames, roomOf(office));
      clicks = [];
      const pk = c.forced !== undefined ? forcedPokes(c.forced?.pokes, reduced) : pokesAt(pokes, frames, t, reduced);
      const played = frames.map((f) => {
        const e = pk.get(f.name) ?? eg.bims.get(f.name);
        const lit = f.name === a.lit || f.name === a.follow;
        return e === undefined ? (lit ? { ...f, lit } : f) : { ...f, egg: e, ...(lit ? { lit } : {}) };
      });
      // the office grows: what it draws, and the unlock moment while it lasts
      const u = still ? undefined : unlock;
      const sky = skyOfClock(c);
      const look: Look = { night, reduced, eggs: eg.office, grow: g, ...(u ? { unlock: u } : {}), ...(sky ? { sky } : {}) };
      if (u && t - u.at > UNLOCK_WALK + UNLOCK_LABEL) unlock = undefined;
      const words = new Map([...pk].map(([n, x]) => [n, x.label]));
      const labels = parts.labelsOf(played, { t, hover: a.hover, held: a.held, agents, eggs: eggLabels(eg), pokes: words, follow: a.follow, park: office.park });
      const wake = c.forced !== undefined ? null : pokeWake(pokes, frames, t, reduced);
      return { office, agents, want: map ?? office.map, reshaped, frames, played, look, labels, moving: timeline.moving(t), wake };
  }
}
