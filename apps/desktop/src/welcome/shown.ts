// Which projects show their welcome in this window now (Welcome.tsx mounts, unmounts): the outer
// card's tile (side3d OuterWorld.tsx) is an empty frame while the welcome's office is the thread's
// (page new-project-home a1: one office on screen; native-lead m_47921), and its office mounts as
// the welcome docks there: at its fit while the welcome's copy flies in, its chrome and its follow
// camera once it landed (designer m_47950). View state only, never kept. Owner: project-home.
import { useSyncExternalStore } from 'react';

const on = new Map<string, number>();
const listeners = new Set<() => void>();
let version = 0;

function bump(): void {
  version++;
  for (const l of [...listeners]) l();
}

/** a count per project: one more, and the function that takes it back once */
function counter(of: Map<string, number>, project: string): () => void {
  of.set(project, (of.get(project) ?? 0) + 1);
  bump();
  let done = false;
  return () => {
    if (done) return;
    done = true;
    const n = (of.get(project) ?? 1) - 1;
    if (n <= 0) of.delete(project);
    else of.set(project, n);
    bump();
  };
}

const docking = new Map<string, number>();

export const welcoming = {
  /** a welcome shows in `project`; the returned function says it went */
  add: (project: string): (() => void) => counter(on, project),
  /** its office flies into the tile (dock.ts): the tile's office at its fit, its chrome held; the returned function says it landed */
  dock: (project: string): (() => void) => counter(docking, project),
  has: (project: string): boolean => on.has(project),
};

/** the outer tile's office in `project` now: 'welcome' (the welcome holds it: an empty frame), 'docking' (the welcome's copy flies in), null (its own) */
export type TilePhase = 'welcome' | 'docking' | null;

/** the tile's phase for `project` (see TilePhase) */
export function useWelcoming(project: string): TilePhase {
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => version,
  );
  return on.has(project) ? 'welcome' : docking.has(project) ? 'docking' : null;
}
