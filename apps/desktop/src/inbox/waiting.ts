// What waits on him, everywhere: every project's open items minus the ones he just answered or
// closed (the store's acted set), plus bise's own notifications ask while the block lists it. One
// inbox, one number (designer m_25639, m_25690): the sidebar's pink count, the title bar's 'N
// waiting', the inbox screen and the block above the composer all read this list. Owner: inbox-screen.
import { useEffect, useMemo, useState } from 'react';
import type { Card, ProjectRow } from '@/proto';
import { useInboxItems, useProjects } from '@/store';
import { notifyCard, useNotifyAsks } from './Block';

export function useWaitingList(): readonly Card[] {
  const rows = useProjects();
  // the inbox's one view, from the store (machine/cards.ts inboxView)
  const real = useInboxItems();
  const asks = useNotifyAsks(real.length);
  // the Dock's badge and the window title (main/counts.ts) count it too
  useEffect(() => {
    window.bise.notify.listed?.(asks);
  }, [asks]);
  const home = rows.find((r) => r.home)?.project ?? '';
  const [since] = useState(() => Date.now());
  return useMemo(() => (asks ? [...real, notifyCard(home, since)] : real), [real, asks, home, since]);
}

/**
 * How many wait: the list's length, plus the `waits` of a project row that carries no cards (a row
 * from an older hub, or a fixture's): its items aren't known, its number is. Pure.
 */
export function waitingCount(list: readonly Card[], rows: readonly Pick<ProjectRow, 'cards' | 'waits'>[]): number {
  return list.length + rows.reduce((n, r) => n + (r.cards == null ? r.waits : 0), 0);
}

/** The one number (the sidebar's pink count, the title bar's 'N waiting'). */
export function useWaitingCount(): number {
  return waitingCount(useWaitingList(), useProjects());
}
