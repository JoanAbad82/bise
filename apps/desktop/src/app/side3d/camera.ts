// src/app/side3d · the floating world's camera (designer's rule m_42974, from Gabriel's ask m_42966:
// the world was too far out to read). At rest it frames the project's main (its lead) LEAD_UNITS
// desk tiles across; every BEAT_EVERY_MS ± BEAT_JITTER_MS, when something happened in the last
// RECENT_MS, a beat zooms on that agent (bims/focus.ts's follow, FOLLOW_ZOOM), holds HOLD_MS, then
// goes back to the lead. First match wins: an agent that just asks, then one that just changed
// state; never two beats within GAP_MS, never the same agent twice in a row unless it asks again.
// Hover: the whole office; reduced motion: the lead only, no beats. The beat picker and the shot
// are pure; World.tsx runs the clock and feeds bims/Office's `follow` and `followZoom`. Owner: nm-side.
import { FOLLOW_ZOOM } from '@/bims/focus';
import { MAX_ZOOM } from '@/bims/zoom';
import type { Agent, Status } from '@/proto';

/** the lead framing: this many desk tiles across the world's width */
export const LEAD_UNITS = 6;
/** a beat comes every 30 s ± 8 */
export const BEAT_EVERY_MS = 30_000;
export const BEAT_JITTER_MS = 8_000;
/** only what happened this recently makes a beat */
export const RECENT_MS = 20_000;
/** at least this long between two beats */
export const GAP_MS = 20_000;
/** a beat: its ease in, then its hold (the ease back is the follow camera's own, to the lead) */
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

/** The wait before the next beat, from a draw r in [0, 1): 30 s ± 8. Pure. */
export function beatDelay(r: number): number {
  return Math.round(BEAT_EVERY_MS + (2 * r - 1) * BEAT_JITTER_MS);
}

/**
 * The lead framing's zoom for an office W × D tiles: LEAD_UNITS across the frame. The fit shows
 * its iso diamond, (W + D) / √2 tiles wide; an office narrower than that stays at the fit. Pure.
 */
export function leadZoom(W: number, D: number): number {
  const across = (W + D) / Math.SQRT2;
  return Math.min(MAX_ZOOM, Math.max(1, across / LEAD_UNITS));
}

/** What the office looks at: the agent it follows (null: the whole office) and how close. */
export interface Shot {
  readonly follow: string | null;
  readonly zoom: number;
}

/**
 * The shot now: the whole office while hovered; the lead at its framing under reduced motion or
 * with no beat; a beat's agent at the follow zoom. `lead` null (no main): the whole office. Pure.
 */
export function shotOf(o: { readonly lead: string | null; readonly zoom: number; readonly beat: string | null; readonly hover: boolean; readonly reduced: boolean }): Shot {
  if (o.hover || o.lead === null) return { follow: null, zoom: o.zoom };
  if (o.beat !== null && !o.reduced) return { follow: o.beat, zoom: FOLLOW_ZOOM };
  return { follow: o.lead, zoom: o.zoom };
}
