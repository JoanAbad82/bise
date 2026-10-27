// When he last looked at each project (round 3, the H1 sidebar; architect m_44801, project-pulse
// m_44820): his view state, kept in the app's prefs as `seen.<project hub id>` = ms, so a second
// window and a restart agree (and the TUI can read the same key). The sidebar's rows count what
// came after it (projectfacts.ts: new artifacts, unread and its dot, a news). This module is its
// one writer.
//
// Seen (proj-unread, designer m_47372): he looks at a project while its main's thread is on screen
// at its newest row (not scrolled up to read) in a window in front (not hidden, not behind another
// app: pearl/away.ts). It is marked seen when that starts, when it ends (what came while he looked
// is seen too), and when the project's pulse brings something new while it lasts. Anything else
// (another agent's thread of the project, its artifacts, main scrolled up, the window behind)
// leaves what came unseen, so its row keeps its dot, across a restart too (the key is in prefs).
// Owner: r3-projects.
import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { usePrefs, useStore, type Store } from '@/store';
import { getPref, type Prefs } from '@/settings/prefs';
import { SEEN_PREFIX } from '@/proto/app_methods.gen';
import type { Pulse } from '@/proto';
import { awayNow, watchAway } from '@/pearl/away';

/** The prefs key of a project's last look: bise_proto::rows::seen_key's, so the TUI reads the same. */
export const seenKey = (project: string): string => `${SEEN_PREFIX}${project}`;

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

// the main threads on screen at their newest row: one per mounted thread screen that says so
const atEnd = new Map<symbol, string>();
const listeners = new Set<() => void>();
const tell = (): void => {
  for (const l of listeners) l();
};

/** The project he looks at now: its main's thread at its newest row, the window in front; none: none. */
export function lookedAtNow(): string | undefined {
  if (awayNow()) return undefined;
  for (const p of atEnd.values()) return p;
  return undefined;
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  const stop = watchAway(l);
  return () => {
    listeners.delete(l);
    stop();
  };
}

/** The project he looks at (lookedAtNow), kept fresh. */
export function useLookedAt(): string | undefined {
  return useSyncExternalStore(subscribe, lookedAtNow);
}

/** A thread screen says whether it shows `project`'s main at its newest row (`on`); it stops saying at unmount. */
export function useShowsMainAtEnd(project: string, on: boolean): void {
  useEffect(() => {
    if (!on) return undefined;
    const me = Symbol(project);
    atEnd.set(me, project);
    tell();
    return () => {
      atEnd.delete(me);
      tell();
    };
  }, [project, on]);
}

/** The newest thing a pulse counts against his last look (an entry for him, an artifact, a past news); none: nothing. Pure. */
export function newestOf(p: Pulse | null | undefined): number | undefined {
  if (p == null) return undefined;
  const n = p.news != null && p.news.what.kind !== 'scheduled' ? [p.news.at_ms] : [];
  const all = [...(p.said_at ?? []), ...(p.artifacts_at ?? []), ...n];
  return all.length === 0 ? undefined : Math.max(...all);
}

/**
 * The project he looks at (useLookedAt) is seen when he starts looking, when he stops (what came
 * while he looked is seen too), and when its pulse's newest (newestOf) moves while he looks.
 */
export function useMarkSeen(looked: string | undefined, newest: number | undefined): void {
  const store = useStore();
  useEffect(() => {
    if (looked === undefined) return undefined;
    markSeen(store, looked);
    return () => {
      markSeen(store, looked);
    };
  }, [store, looked]);
  const last = useRef<{ looked: string | undefined; newest: number | undefined }>({ looked, newest });
  useEffect(() => {
    const was = last.current;
    last.current = { looked, newest };
    if (looked !== undefined && was.looked === looked && was.newest !== newest) markSeen(store, looked);
  }, [store, looked, newest]);
}
