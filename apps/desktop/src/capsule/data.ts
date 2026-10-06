// The spotlight's data from the store: every project's agents and cards as one SpotData, read
// through the store's own slices (a change re-reads only when one of them changed: the snapshot
// is cached on the identity of the slices it was built from). toSpotData is the pure mapping from
// the generated row shapes (src/proto) to the spotlight's view types.
import { useCallback, useRef, useSyncExternalStore } from 'react';
import type { Agent, Card, ProjectRow } from '@/proto';
import { useProjects, useStore } from '@/store';
import type { SpotCard, SpotData, SpotFront } from '@/spotlight';

export function cardKind(c: Card): SpotCard['kind'] {
  if (c.approval !== true) return 'question';
  // a batch of drafts to send (amb-core's batched card) reads as ✉
  return c.kind.includes('draft') ? 'drafts' : 'approval';
}

export function toSpotData(
  projects: readonly ProjectRow[],
  agentsOf: (project: string) => readonly Agent[],
  cardsOf: (project: string) => readonly Card[],
  front: SpotFront | null,
): SpotData {
  const mine = [...projects].sort((a, b) => a.order - b.order);
  return {
    projects: mine
      .filter((p) => !p.home)
      .map((p) => ({ id: p.project, name: p.name, path: p.path, branch: p.branch ?? 'main', agents: p.agents })),
    agents: mine.flatMap((p) =>
      agentsOf(p.project).map((a) => ({ name: a.name, project: p.project, status: a.status, title: a.title, purpose: a.purpose, archived: a.archived })),
    ),
    cards: mine.flatMap((p) => cardsOf(p.project).map((c) => ({ id: `${p.project}.${String(c.id)}`, agent: c.agent, project: p.project, text: c.question, kind: cardKind(c) }))),
    front,
  };
}

/** Every project's agents and cards, with what's in front, re-read only when a slice changes. */
export function useSpotData(front: SpotFront | null): SpotData {
  const store = useStore();
  const projects = useProjects();
  const keys = projects.flatMap((p) => [`agents:${p.project}`, `cards:${p.project}`]).join('|');
  const subscribe = useCallback(
    (cb: () => void) => {
      const offs = keys === '' ? [] : keys.split('|').map((k) => store.subscribe(k, cb));
      return () => {
        offs.forEach((off) => {
          off();
        });
      };
    },
    [store, keys],
  );
  const cache = useRef<{ parts: readonly unknown[]; value: SpotData } | null>(null);
  const snapshot = (): SpotData => {
    const parts: unknown[] = [projects, front, ...projects.flatMap((p) => [store.agents(p.project), store.cards(p.project)])];
    const c = cache.current;
    if (c !== null && c.parts.length === parts.length && c.parts.every((x, i) => x === parts[i])) return c.value;
    const value = toSpotData(projects, (p) => store.agents(p), (p) => store.cards(p), front);
    cache.current = { parts, value };
    return value;
  };
  return useSyncExternalStore(subscribe, snapshot);
}
