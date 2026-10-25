// The right column's count for the titlebar's '↗ artifacts · 5 ⌥⌘0' (the column itself is the right
// bar, RightBar.tsx, since designer's desktop-right-bar v5). Owner: amb-win.
import { useSyncExternalStore } from 'react';
import { useStore, type Store } from '@/store';

/** The projects the panel reads: one, or every one for '' (bise's own thread). */
function idsOf(store: Store, project: string | undefined): string[] {
  if (project === undefined) return [];
  return project === '' ? store.projects().map((p) => p.project) : [project];
}

/** How many artifacts a project has (every project's for ''): the titlebar button's count, a number. */
export function useArtifactCount(project: string | undefined): number {
  const store = useStore();
  const ids = idsOf(store, project).join('\n');
  return useSyncExternalStore(
    (cb) => {
      const offs = (ids === '' ? [] : ids.split('\n')).map((p) => store.subscribe(`artifacts:${p}`, cb));
      offs.push(store.subscribe('projects', cb));
      return () => {
        for (const off of offs) off();
      };
    },
    () => idsOf(store, project).reduce((n, p) => n + store.artifacts(p).length, 0),
  );
}
