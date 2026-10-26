// When he last looked at each project (round 3, the H1 sidebar; architect m_44801, project-pulse
// m_44820): his view state, kept in the app's prefs as `seen.<project hub id>` = ms, so a second
// window and a restart agree (and the TUI can read the same key). The sidebar's rows count what
// came after it (projectfacts.ts: new artifacts, unread, a news). This module is its one writer:
// the project in view is marked seen when he opens it and when he leaves it (what came while he
// looked is seen too). Owner: r3-projects.
import { useEffect, useMemo } from 'react';
import { usePrefs, useStore, type Store } from '@/store';
import { getPref, type Prefs } from '@/settings/prefs';

/** The prefs key of a project's last look. */
export const seenKey = (project: string): string => `seen.${project}`;

/** When he last looked at `project`, from the prefs; undefined: never. Pure. */
export function seenOf(prefs: Prefs | null, project: string): number | undefined {
  const v = getPref(prefs, seenKey(project));
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

/** Every project's last look, re-read when the prefs change. */
export function useSeen(): (project: string) => number | undefined {
  const prefs = usePrefs() as Prefs | null;
  return useMemo(() => (project: string) => seenOf(prefs, project), [prefs]);
}

/** Marks a project seen now: one prefs_set. */
export function markSeen(store: Store, project: string, now: number = Date.now()): void {
  store.command({ cmd: 'prefs_set', key: seenKey(project), value: now });
}

/** The project in view is seen when he opens it and when he leaves it. */
export function useMarkSeen(here: string | undefined): void {
  const store = useStore();
  useEffect(() => {
    if (here === undefined) return undefined;
    markSeen(store, here);
    return () => {
      markSeen(store, here);
    };
  }, [store, here]);
}
