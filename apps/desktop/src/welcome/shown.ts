// Which projects show their welcome in this window now (Welcome.tsx mounts, unmounts): the right
// bar's office stays closed while the welcome's office is the thread's (page new-project-home a1:
// one office on screen), and opens as it docks there. View state only, never kept. Owner: project-home.
import { useSyncExternalStore } from 'react';

const on = new Map<string, number>();
const listeners = new Set<() => void>();
let version = 0;

function bump(): void {
  version++;
  for (const l of [...listeners]) l();
}

export const welcoming = {
  /** a welcome shows in `project`; the returned function says it went */
  add(project: string): () => void {
    on.set(project, (on.get(project) ?? 0) + 1);
    bump();
    return () => {
      const n = (on.get(project) ?? 1) - 1;
      if (n <= 0) on.delete(project);
      else on.set(project, n);
      bump();
    };
  },
  has: (project: string): boolean => on.has(project),
};

/** whether a welcome shows in `project` now */
export function useWelcoming(project: string): boolean {
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => version,
  );
  return welcoming.has(project);
}
