// src/app/side3d · the floating world's beats (designer's rule m_42974, from Gabriel's ask m_42966;
// as labels only, designer m_44998: the world is always the whole map, never a follow or a zoom).
// Every BEAT_EVERY_MS ± BEAT_JITTER_MS, when something happened in the last RECENT_MS, a beat
// names that agent over its bim (World.tsx BeatLabel) for EASE_MS + HOLD_MS. First match wins: an
// agent that just asks, then one that just changed state; never two beats within GAP_MS, never the
// same agent twice in a row unless it asks again. None while grown, nor under reduced motion. The
// beat picker is pure; World.tsx runs the clock. Owner: nm-side.
import type { Agent, Status } from '@/proto';

/** a beat comes every 30 s ± 8 */
export const BEAT_EVERY_MS = 30_000;
export const BEAT_JITTER_MS = 8_000;
/** only what happened this recently makes a beat */
export const RECENT_MS = 20_000;
/** at least this long between two beats */
export const GAP_MS = 20_000;
/** a beat's label lasts its old camera move's ease in and hold */
export const EASE_MS = 600;
export const HOLD_MS = 6_000;

/** What made a beat, by priority (first wins). */
export type Why = 'asks' | 'state';
const RANK: Readonly<Record<Why, number>> = { asks: 0, state: 1 };

/** Something an agent just did. */
export interface Happened {
  readonly agent: string;
  readonly why: Why;
  /** ms */
  readonly at: number;
}

/** An agent as the beats see it: its status and whether it asks him something. */
export interface Seen {
  readonly status: Status;
  readonly asks: boolean;
}

/** The project's live agents, main out (the lead is on screen at rest anyway), by name. Pure. */
export function seenOf(agents: readonly Agent[]): ReadonlyMap<string, Seen> {
  const m = new Map<string, Seen>();
  for (const a of agents) if (!a.main && !a.archived) m.set(a.name, { status: a.status, asks: a.waits > 0 });
  return m;
}

/** What happened between two looks: an agent that started asking, one that changed state (a new one: started). Pure. */
export function happenedOf(prev: ReadonlyMap<string, Seen>, next: ReadonlyMap<string, Seen>, at: number): Happened[] {
  const out: Happened[] = [];
  for (const [agent, s] of next) {
    const was = prev.get(agent);
    if (s.asks && was?.asks !== true) out.push({ agent, why: 'asks', at });
    else if (was === undefined || was.status !== s.status) out.push({ agent, why: 'state', at });
  }
  return out;
}

/** The last beat: its agent and when it started. */
export interface LastBeat {
  readonly agent: string;
  readonly at: number;
}

/**
 * The beat to play now, or null: GAP_MS after the last one at least, from what happened in the
 * last RECENT_MS, asks before state changes, the newest first; the last beat's agent again only
 * when it asks after that beat. Pure.
 */
export function pickBeat(happened: readonly Happened[], now: number, last: LastBeat | null): Happened | null {
  if (last !== null && now - last.at < GAP_MS) return null;
  const ok = happened.filter((h) => now - h.at <= RECENT_MS && (last === null || h.agent !== last.agent || (h.why === 'asks' && h.at > last.at)));
  if (ok.length === 0) return null;
  return [...ok].sort((a, b) => RANK[a.why] - RANK[b.why] || b.at - a.at)[0] ?? null;
}

/** What is still worth keeping at `now` (RECENT_MS). Pure. */
export function stillRecent(happened: readonly Happened[], now: number): Happened[] {
  return happened.filter((h) => now - h.at <= RECENT_MS);
}

/** something just happened: its beat comes this soon at the soonest (ui-review m_43571: a tick 30 s ± 8 away missed the 20 s an ask stays recent) */
export const BEAT_SOON_MS = 2_000;

/**
 * The next tick when something just happened at `now`: pulled in to BEAT_SOON_MS, or to GAP_MS
 * after the last beat if that is later (still within RECENT_MS of it), never pushed back. Pure.
 */
export function tickSoon(now: number, tickAt: number, last: LastBeat | null): number {
  const soon = Math.max(now + BEAT_SOON_MS, last === null ? 0 : last.at + GAP_MS);
  return Math.min(tickAt, soon);
}

/** The wait before the next beat, from a draw r in [0, 1): 30 s ± 8. Pure. */
export function beatDelay(r: number): number {
  return Math.round(BEAT_EVERY_MS + (2 * r - 1) * BEAT_JITTER_MS);
}
