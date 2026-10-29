// The scheduled tasks across his projects, from the store's scheduled:<project> slices (amb-feed's
// HubEv scheduled, 284bd5c6; none until the hub said). Owner: amb-kit.
import { useSyncExternalStore } from 'react';
import { useProjects, useStore, type Store } from '@/store';
import type { ScheduledTask, Task } from './model';

const tasksOf = (store: Store, project: string): readonly ScheduledTask[] => store.scheduled(project);

// one snapshot per (ids, names): two callers with different `only` never rebuild each other's
// (amb-win m_12088: a shared one loops React's tearing check)
const last = new Map<string, { from: readonly (readonly ScheduledTask[])[]; items: readonly Task[] }>();

/** Every project's live scheduled tasks (or one project's), with a stable snapshot. */
export function useAllScheduled(only?: string): readonly Task[] {
  const store = useStore();
  const projects = useProjects();
  const shown = only === undefined || only === '' ? projects : projects.filter((p) => p.project === only);
  const ids = shown.map((p) => p.project).join('\n');
  const names = shown.map((p) => (p.name !== '' ? p.name : p.project)).join('\n');
  return useSyncExternalStore(
    (cb) => {
      const offs = ids === '' ? [] : ids.split('\n').map((p) => store.subscribe(`scheduled:${p}`, cb));
      return () => {
        for (const off of offs) off();
      };
    },
    () => {
      const list = ids === '' ? [] : ids.split('\n');
      const nm = names.split('\n');
      const from = list.map((p) => tasksOf(store, p));
      const key = `${ids}\u0000${names}`;
      const was = last.get(key);
      if (was !== undefined && was.from.length === from.length && was.from.every((x, i) => x === from[i])) return was.items;
      const items: Task[] = [];
      list.forEach((p, i) => {
        for (const t of from[i] ?? []) items.push({ project: p, projectName: nm[i] ?? p, t });
      });
      last.set(key, { from, items });
      return items;
    },
  );
}
