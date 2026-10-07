// The scheduled tasks across his projects, from the store's scheduled:<project> slices (amb-feed's
// HubEv scheduled, 284bd5c6; none until the hub said). Owner: amb-kit.
import { useSyncExternalStore } from 'react';
import { useProjects, useStore, type Store } from '@/store';
import type { ScheduledTask, Task } from './model';

const tasksOf = (store: Store, project: string): readonly ScheduledTask[] => store.scheduled(project);

let last: { key: string; from: readonly (readonly ScheduledTask[])[]; items: readonly Task[] } | null = null;

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
      if (last !== null && last.key === key && last.from.length === from.length && last.from.every((x, i) => x === from[i])) return last.items;
      const items: Task[] = [];
      list.forEach((p, i) => {
        for (const t of from[i] ?? []) items.push({ project: p, projectName: nm[i] ?? p, t });
      });
      last = { key, from, items };
      return items;
    },
  );
}
