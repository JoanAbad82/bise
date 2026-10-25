// The sidebar's 'new to connect' dot (page plugins v48): what the band suggested the last time he
// opened the plugins place, as one key (model.ts newKey). The app's own view state (architect
// m_40075: kept by the app, never in the core): one localStorage item, read at start, written when
// the place shows its band. The dot shows while the summary's key differs from the one he saw.
// Owner: plug-desktop.
import { useSyncExternalStore } from 'react';
import type { PluginsSummary } from '@/proto';
import { newKey } from './model';

export const SEEN_KEY = 'bise.plugins.seen.v1';

export interface SeenStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const subs = new Set<() => void>();

function storage(): SeenStore | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** The key he last saw ('' never). */
export function seenKey(st: SeenStore | null = storage()): string {
  try {
    return st?.getItem(SEEN_KEY) ?? '';
  } catch {
    return '';
  }
}

/** He looked at the band with this summary: the dot goes until something new comes. */
export function markSeen(s: PluginsSummary | null, st: SeenStore | null = storage()): void {
  const k = newKey(s);
  if (s === null || k === seenKey(st)) return;
  try {
    st?.setItem(SEEN_KEY, k);
  } catch {
    // a full or blocked storage: the dot stays, nothing else breaks
  }
  for (const f of subs) f();
}

/** Something new to connect he hasn't seen (none to suggest: no dot). Pure. */
export function isNew(s: PluginsSummary | null, seen: string): boolean {
  const k = newKey(s);
  return k !== '' && k !== seen;
}

/** [`isNew`] for the summary in view, re-read when he marks it seen. */
export function useNewToConnect(s: PluginsSummary | null): boolean {
  const seen = useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => {
        subs.delete(cb);
      };
    },
    () => seenKey(),
  );
  return isNew(s, seen);
}
