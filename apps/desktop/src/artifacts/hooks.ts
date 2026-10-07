// The artifacts across his projects, from the store (one artifacts event per project). Owner: amb-kit.
import { useSyncExternalStore } from 'react';
import type { Artifact, ProjectRow } from '@/proto';
import { useProjects, useStore, type Store } from '@/store';
import type { Item } from './model';

/** One project's name as the sidebar says it (its name, else its id). */
const nameOf = (p: ProjectRow): string => (p.name !== '' ? p.name : p.project);

/**
 * Every project's artifacts as one list (subscribed to each project's artifacts:<id>), newest
 * first. The snapshot is kept while nothing changed, so a render never sees a new array for the
 * same rows.
 */
export function useAllArtifacts(only?: string): readonly Item[] {
  const store = useStore();
  const projects = useProjects();
  const shown = only === undefined || only === '' ? projects : projects.filter((p) => p.project === only);
  const ids = shown.map((p) => p.project).join('\n');
  const names = shown.map(nameOf).join('\n');
  return useSyncExternalStore(
    (cb) => {
      const offs = ids === '' ? [] : ids.split('\n').map((p) => store.subscribe(`artifacts:${p}`, cb));
      return () => {
        for (const off of offs) off();
      };
    },
    () => snapshot(store, ids, names),
  );
}

/** How many artifacts are new, across his projects: the sidebar row's '2 new'. */
export function useNewArtifacts(): number {
  return useAllArtifacts().filter((it) => it.a.new).length;
}

// the last snapshot per (ids, names) and the arrays it was built from: one per key, so panel A's
// one-project list and the global screen, mounted together, never rebuild each other's (amb-win
// m_12088: a shared one made each getSnapshot a new array, and React's tearing check loops)
const last = new Map<string, { from: readonly (readonly Artifact[])[]; items: readonly Item[] }>();

function snapshot(store: Store, ids: string, names: string): readonly Item[] {
  const list = ids === '' ? [] : ids.split('\n');
  const nm = names.split('\n');
  const from = list.map((p) => store.artifacts(p));
  const key = `${ids}\u0000${names}`;
  const was = last.get(key);
  if (was !== undefined && was.from.length === from.length && was.from.every((x, i) => x === from[i])) return was.items;
  const items: Item[] = [];
  list.forEach((p, i) => {
    for (const a of from[i] ?? []) items.push({ project: p, projectName: nm[i] ?? p, a });
  });
  items.sort((x, y) => y.a.at_ms - x.a.at_ms);
  last.set(key, { from, items });
  return items;
}
