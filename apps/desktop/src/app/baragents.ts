// The agents of his projects as the right bar and the processes screen read them: one project's
// or every project's, with a stable snapshot (useSyncExternalStore). Owner: the right bar.
import { useSyncExternalStore } from 'react';
import type { Agent } from '@/proto';
import { useStore, type Store } from '@/store';
import type { ProjAgent } from './barrows';

const lastAgents = new Map<string, { from: readonly (readonly Agent[])[]; items: readonly ProjAgent[] }>();

/** The agents of one project, or of every project ('' = bise's thread), with a stable snapshot. */
export function useBarAgents(project: string): readonly ProjAgent[] {
  const store = useStore();
  const ids = (s: Store) => (project === '' ? s.projects().map((p) => p.project) : [project]);
  return useSyncExternalStore(
    (cb) => {
      const offs = ids(store).map((p) => store.subscribe(`agents:${p}`, cb));
      offs.push(store.subscribe('projects', cb));
      return () => {
        for (const off of offs) off();
      };
    },
    () => {
      const list = ids(store);
      const names = list.map((p) => {
        const row = store.projects().find((x) => x.project === p);
        return row !== undefined && row.name !== '' ? row.name : p;
      });
      const from = list.map((p) => store.agents(p));
      const key = `${project}\u0000${names.join('\n')}`;
      const was = lastAgents.get(key);
      if (was !== undefined && was.from.length === from.length && was.from.every((x, i) => x === from[i])) return was.items;
      const items: ProjAgent[] = [];
      list.forEach((p, i) => {
        for (const a of from[i] ?? []) items.push({ project: p, projectName: names[i] ?? p, a });
      });
      lastAgents.set(key, { from, items });
      return items;
    },
  );
}
