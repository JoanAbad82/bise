// The town's projects (page bims-maps v9): which offices it draws, in which order, and what each one
// brings to the plan (its ground and its door) and to its sign (its name, ∿ its working agents, ? the
// questions waiting on him). One office per project, bise's own home at the heart (bims m_29650);
// past TOWN_MAX the active ones first (working or waiting), then the bar's order. Each
// office is its project's own: its map (his /bims pick, prefs bims.map.<project>) and its growth.
// Its ground for the plan: town/ground.ts (the renderer's side). Pure. Owner: maps-e.
import type { Agent, Card, Growth, Place } from '@/proto';
import type { MapId } from '../maps/ids';
import { TOWN_MAX } from './plan';

/** One project as the town reads it (the store's rows, mapped in town/useTown.ts). */
export interface TownProject {
  readonly id: string;
  readonly name: string;
  readonly map: MapId;
  readonly growth: Growth | null;
  readonly agents: readonly Agent[];
  readonly cards: readonly Card[];
  readonly places: readonly Place[];
  /** the bar's order (ProjectRow.order) */
  readonly order: number;
  /** bise's own home: always in the town, at its heart */
  readonly home?: boolean;
}

/** What a sign says: the project's name, its agents at work, the questions waiting on him. */
export interface Sign {
  readonly id: string;
  readonly name: string;
  readonly working: number;
  readonly asks: number;
}

/** The project's live agents (archived ones have left the office). Pure. */
export const liveAgents = (p: TownProject): readonly Agent[] => p.agents.filter((a) => !a.archived);

/** Its sign: ∿ the non-main agents working, ? his open questions from its agents (the office's '?' pills). Pure. */
export function signOf(p: TownProject): Sign {
  const live = liveAgents(p);
  const names = new Set(live.map((a) => a.name));
  return {
    id: p.id,
    name: p.name,
    working: live.filter((a) => !a.main && a.status === 'working').length,
    asks: p.cards.filter((c) => c.kind === 'question' && names.has(c.agent)).length,
  };
}

/** The offices the town draws: every project's in the bar's order; past `max`, the active ones first. Pure. */
export function townProjects(all: readonly TownProject[], max = TOWN_MAX): TownProject[] {
  const ordered = [...all].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  if (ordered.length <= max) return ordered;
  const busy = (p: TownProject): boolean => {
    const s = signOf(p);
    return s.working > 0 || s.asks > 0;
  };
  // bise's home first: it is the town's heart
  const keep = new Set([...ordered.filter((p) => p.home === true), ...ordered.filter((p) => p.home !== true && busy(p)), ...ordered.filter((p) => p.home !== true && !busy(p))].slice(0, max).map((p) => p.id));
  return ordered.filter((p) => keep.has(p.id));
}
