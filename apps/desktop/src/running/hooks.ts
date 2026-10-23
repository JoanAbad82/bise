// The processes across his projects, from the store's processes:<project> slices (HubEv processes,
// one per project; the core asks every running hub while the list is open: core cmd
// processes_all, architect m_38378), and all of bise's running count from the projects rows.
// Owner: procs-desktop.
import { useSyncExternalStore } from 'react';
import { useProjects, useStore, type Store } from '@/store';
import { runningCount, type Proc, type ProcItem } from './model';

const procsOf = (store: Store, project: string): readonly Proc[] => store.processes(project);

// one snapshot per (ids, names), as useAllScheduled
const last = new Map<string, { from: readonly (readonly Proc[])[]; items: readonly ProcItem[] }>();

/** Every project's processes (or one project's), in his sidebar's order, with a stable snapshot. */
export function useAllProcesses(only?: string): readonly ProcItem[] {
  const store = useStore();
  const projects = useProjects();
  const shown = only === undefined || only === '' ? projects : projects.filter((p) => p.project === only);
  const ids = shown.map((p) => p.project).join('\n');
  const names = shown.map((p) => (p.name !== '' ? p.name : p.project)).join('\n');
  return useSyncExternalStore(
    (cb) => {
      const offs = ids === '' ? [] : ids.split('\n').map((p) => store.subscribe(`processes:${p}`, cb));
      return () => {
        for (const off of offs) off();
      };
    },
    () => {
      const list = ids === '' ? [] : ids.split('\n');
      const nm = names.split('\n');
      const from = list.map((p) => procsOf(store, p));
      const key = `${ids}\u0000${names}`;
      const was = last.get(key);
      if (was !== undefined && was.from.length === from.length && was.from.every((x, i) => x === from[i])) return was.items;
      const items: ProcItem[] = [];
      list.forEach((p, i) => {
        for (const x of from[i] ?? []) items.push({ project: p, projectName: nm[i] ?? p, p: x });
      });
      last.set(key, { from, items });
      return items;
    },
  );
}

/** All of bise's running processes: the sidebar's count (its agents' procs, where the hub runs). */
export function useRunningCount(): number {
  return runningCount(useProjects());
}
