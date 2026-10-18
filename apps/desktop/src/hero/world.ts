// The hero film's world (cast.ts) as the app's own rows, so the town is driven by the real office
// brains (office-driver.ts), timelines, poses and eggs: each office's agents at film time T, the
// activity of an idle bim (its office life is the score's, never the app's clock-driven one: the
// film replays), the eggs forced at T (the app's withForced: written, never rolled), the messages
// as the app's BimEvents, and every time something changes (the film steps its drivers there,
// exactly). Film time T is in [0, FILM_S); the world's clock t runs on (world t = ORIGIN + elapsed),
// T = (t - ORIGIN) mod FILM_S. Pure, no DOM, no three. Owner: hero-town.
import type { Agent, Growth, Place } from '@/proto';
import type { Activity, ActivitiesFn, BimEvent, Snapshot } from '../bims/model';
import { activities as appActivities } from '../bims/activity';
import type { Forced } from '../bims/eggs';
import { GARDEN_AT, STAGE_AT } from '../bims/growth';
import { CAST, EGGS, FILM_S, NOTES, type Bim, type Cast, type Mode } from './cast';

/** the world's clock at the film's 0:00 of its first loop, s (any day: the film's eggs are forced, its clock eggs off) */
export const ORIGIN = 1_800_000_000;

/** Film time of a world time. Pure. */
export function filmT(t: number): number {
  const x = (t - ORIGIN) % FILM_S;
  return x < 0 ? x + FILM_S : x;
}

/** The loop a world time is in (0 the first; the pre-roll is -1). Pure. */
export const loopOf = (t: number): number => Math.floor((t - ORIGIN) / FILM_S);

/** A bim's mode at film time T: its last change at or before T, else its life's last one (the loop closes). Pure. */
export function modeAt(b: Bim, T: number): Mode {
  let m: Mode | null = null;
  for (const [at, mode] of b.life) if (at <= T) m = mode;
  return m ?? b.life[b.life.length - 1]?.[1] ?? { k: 'gone' };
}

/** an office's growth: its stage's jobs, a garden and frames to go with it (bims' hero stills' recipe) */
export function growthOf(c: Cast): Growth {
  return { jobs_done: STAGE_AT[c.stage] ?? 0, days_used: GARDEN_AT[Math.min(GARDEN_AT.length - 1, Math.floor(c.stage / 2))] ?? 0, artifacts_made: c.stage * 12 };
}

const NOW_MS = ORIGIN * 1000;

/** The app's row of a bim in that mode (only the fields activity.ts reads matter). Pure. */
export function rowOf(b: Bim, m: Mode): Agent {
  const base = {
    name: b.name,
    main: b.main === true,
    status: 'idle',
    phase: null,
    archived: false,
    title: '',
    purpose: '',
    since_ms: NOW_MS,
    waits: 0,
    dir: b.name,
    watching: [],
    waiting_on: null,
    turn_ms: null,
    place_id: b.main === true ? '' : `wt:${b.name}`,
  } as unknown as Agent;
  const at = (o: Partial<Agent>): Agent => ({ ...base, ...o });
  switch (m.k) {
    case 'work':
      return at({ status: 'working', ...(m.doing ? { doing: { kind: m.doing, since_ms: NOW_MS } } : {}) });
    case 'main':
      return at({ status: 'working' });
    case 'sleep':
      return at({ status: 'waiting', watching: [{ id: 1, kind: 'bg', what: 'bench', since_ms: NOW_MS, resumes: true }] as Agent['watching'] });
    case 'asks':
      return at({ status: 'waiting', waits: 1, waiting_on: { who: 'you' } });
    case 'failed':
      return at({ status: 'failed' });
    case 'wait':
      return at({ status: 'waiting', waiting_on: { who: 'agent', name: m.on } });
    case 'done':
      return at({ status: 'done' });
    default:
      return base;
  }
}

/**
 * One office's rows at film time T: the snapshot's agents (the gone ones absent: no bim) and its
 * places (the land queue); the office is laid for every bim of the film, gone or not (`agents`), so
 * a newcomer takes its own desk and never moves the others. Pure.
 */
export function rowsAt(c: Cast, T: number): { readonly snap: Snapshot; readonly agents: readonly Agent[] } {
  const present: Agent[] = [];
  const all: Agent[] = [];
  const places: Place[] = [];
  for (const b of c.bims) {
    const m = modeAt(b, T);
    const row = rowOf(b, m);
    all.push(row);
    if (m.k === 'gone') continue;
    present.push(row);
    if (m.k === 'landing') places.push({ id: `wt:${b.name}`, branch: `sb/${b.name}`, agents: [b.name], landing: m.rank });
  }
  return { snap: { agents: present, cards: [], places }, agents: all };
}

/** A signature of an office's rows at T: the film hands them to its driver again only when it changes. Pure. */
export function rowsSig(c: Cast, T: number): string {
  return c.bims.map((b) => `${b.name}:${JSON.stringify(modeAt(b, T))}`).join('|');
}

/**
 * The office's activities, the app's own but an idle bim's office life: the score's (a nap, or its
 * snack trip with its fruit) where the app would roll one from the clock. `T` reads film time. Pure.
 */
export function activitiesOf(c: Cast, T: (t: number) => number): ActivitiesFn {
  const byName = new Map(c.bims.map((b) => [b.name, b]));
  return (snap, t) => {
    const acts = new Map(appActivities(snap, t));
    for (const [name, a] of acts) {
      if (a.k !== 'nap' && a.k !== 'snack') continue;
      const b = byName.get(name);
      if (!b) continue;
      const m = modeAt(b, T(t));
      const life: Activity = m.k === 'snack' ? { k: 'snack', at: 'island', key: m.trip, fruit: m.fruit } : { k: 'nap', at: 'lounge' };
      acts.set(name, life);
    }
    return acts;
  };
}

/** The eggs forced in an office at film time T (eggs.ts Forced: each with how far into it). Pure. */
export function eggsAt(office: string, T: number): Forced {
  const bims: Record<string, { kind: (typeof EGGS)[number]['kind']; since: number }> = {};
  for (const e of EGGS) {
    if (e.office !== office || T < e.at || T >= e.at + e.dur) continue;
    bims[e.bim] = { kind: e.kind, since: T - e.at };
  }
  return { bims };
}

/** The office's messages with their world time, in (t0, t1]: his are planes, an agent's a coffee or a visit. Pure. */
export function eventsIn(office: string, t0: number, t1: number): BimEvent[] {
  const out: BimEvent[] = [];
  if (t1 <= t0) return out;
  for (let loop = loopOf(t0); loop <= loopOf(t1); loop++) {
    for (const n of NOTES) {
      if (n.office !== office) continue;
      const t = ORIGIN + loop * FILM_S + n.at;
      if (t <= t0 || t > t1) continue;
      out.push({ kind: 'message', from: n.from === 'you' ? { who: 'you' } : { who: 'agent', name: n.from }, to: { who: 'agent', name: n.to }, mode: 'queued', expectsReply: false, t });
    }
  }
  return out;
}

/** Every film time something changes in an office (a row, a message), sorted: the film steps its driver there. Pure. */
export function changesOf(office: string): readonly number[] {
  const c = CAST.find((x) => x.id === office);
  const ts = new Set<number>();
  for (const b of c?.bims ?? []) for (const [at] of b.life) ts.add(at);
  for (const n of NOTES) if (n.office === office) ts.add(n.at);
  return [...ts].sort((a, b) => a - b);
}

/** the film's heartbeat, s: its offices hear their rows again this often (a coffee ends, a bim walks back) */
export const BEAT_S = 1;

/**
 * The world times in (t0, t1] where an office hears its rows: each change (across a loop's end too)
 * and each BEAT_S of film time (the app's rows change often; the timeline ends a played event only
 * when it hears them). Sorted, each once. Pure.
 */
export function changesIn(office: string, t0: number, t1: number): number[] {
  if (t1 <= t0) return [];
  const out = new Set<number>();
  const at = changesOf(office);
  for (let loop = loopOf(t0); loop <= loopOf(t1); loop++) {
    const from = ORIGIN + loop * FILM_S;
    for (const a of at) {
      const t = from + a;
      if (t > t0 && t <= t1) out.add(t);
    }
    for (let b = 0; b < FILM_S; b += BEAT_S) {
      const t = from + b;
      if (t > t0 && t <= t1) out.add(t);
    }
  }
  return [...out].sort((a, b) => a - b);
}
