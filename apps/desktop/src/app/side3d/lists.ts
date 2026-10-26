// src/app/side3d · whose agents and asks the folded side lists (his m_45581, m_45583): the scope
// of the panel's Overview (side.ts panelProject), one place for both: a project's own; on bise's
// own screen and thread ('') every project's, the home's first, then the projects' rows' order.
// Each project's agents keep the hub's rank (model inRank), each agent its project (`projectOf`:
// its rows open and act in it). listedOf is pure; useListed reads it from the store with a stable
// snapshot. Owner: nm-side.
import { useSyncExternalStore } from 'react';
import type { Agent, Card } from '@/proto';
import { useStore, type Store } from '@/store';
import { inRank } from './model';

/** What the side lists of its scope. */
export interface Listed {
  /** every agent of the scope, archived too (the counts, the archived foot) */
  readonly agents: readonly Agent[];
  /** the live ones in the hub's rank, project by project, the home's first */
  readonly live: readonly Agent[];
  /** each listed agent's project */
  readonly projectOf: ReadonlyMap<Agent, string>;
  /** the open cards of the scope (an agent's comic bubble reads its own) */
  readonly cards: readonly Card[];
  /** what waits for him in the scope: its projects' rows' pink counts */
  readonly waits: number;
}

/** One project's part of the scope. */
export interface ProjectPart {
  readonly project: string;
  readonly agents: readonly Agent[];
  readonly cards: readonly Card[];
  readonly waits: number;
}

/**
 * The projects the side lists: `scope` alone, or ('' bise's own) every project, the home's
 * first. Pure.
 */
export function scopeIds(scope: string, projects: readonly string[], home: string): string[] {
  if (scope !== '') return [scope];
  return [...projects.filter((p) => p === home), ...projects.filter((p) => p !== home)];
}

/** The scope's lists from its projects' parts, in that order. Pure. */
export function listedOf(parts: readonly ProjectPart[]): Listed {
  const projectOf = new Map<Agent, string>();
  for (const p of parts) for (const a of p.agents) projectOf.set(a, p.project);
  return {
    agents: parts.flatMap((p) => p.agents),
    live: parts.flatMap((p) => inRank(p.agents)),
    projectOf,
    cards: parts.flatMap((p) => p.cards),
    waits: parts.reduce((n, p) => n + p.waits, 0),
  };
}

const last = new Map<string, { from: readonly unknown[]; listed: Listed }>();

/** The side's lists of `scope` ('' every project's, `home` first), live from the store. */
export function useListed(scope: string, home: string): Listed {
  const store = useStore();
  return useSyncExternalStore(
    (cb) => {
      const offs = [store.subscribe('projects', cb), ...ids(store, scope, home).map((p) => store.subscribe(`agents:${p}`, cb))];
      return () => {
        for (const off of offs) off();
      };
    },
    () => snapshot(store, scope, home),
  );
}

function ids(store: Store, scope: string, home: string): string[] {
  return scopeIds(scope, store.projects().map((p) => p.project), home);
}

/** The same rows read the same Listed (useSyncExternalStore wants a stable snapshot). */
function snapshot(store: Store, scope: string, home: string): Listed {
  const rows = store.projects();
  const list = ids(store, scope, home);
  const parts = list.map((p) => ({ project: p, agents: store.agents(p), cards: store.cards(p), waits: rows.find((r) => r.project === p)?.waits ?? 0 }));
  const from = parts.flatMap((p) => [p.project, p.agents, p.cards, p.waits]);
  const key = `${scope}\u0000${home}`;
  const was = last.get(key);
  if (was !== undefined && was.from.length === from.length && was.from.every((x, i) => x === from[i])) return was.listed;
  const listed = listedOf(parts);
  last.set(key, { from, listed });
  return listed;
}
