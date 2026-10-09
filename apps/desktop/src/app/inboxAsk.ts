// b1/b2 (his card #476): ⌘I and a notification's click open the inbox block IN PLACE, on the
// screen he is on, never a route (amb-home's openInbox, eb3da983). A plain ⌘I opens its first
// item at once (nothing waits: nothing opens). A card asked by a notification may come before the
// core's rows list it (the window just opened on it): the ask waits here until the rows have that
// card, for ASK_MS at most, then the block opens it. Owner: amb-win.
import { useEffect, useState } from 'react';
import { openInbox } from '@/inbox';
import { useProjects } from '@/store';
import type { ProjectRow } from '@/proto';

export type InboxAt = { readonly project: string; readonly card: number };

/** How long a notification's card may take to reach the rows before the ask is dropped. */
export const ASK_MS = 10_000;

let pending: { at: InboxAt; until: number } | null = null;
const subs = new Set<() => void>();

/** Open the block: on that card when it is listed (now or within ASK_MS), else on its first item now. */
export function askInbox(at?: InboxAt): void {
  if (at === undefined) {
    openInbox();
    return;
  }
  pending = { at, until: Date.now() + ASK_MS };
  for (const f of [...subs]) f();
}

/** Whether the core's rows list that card. Pure. */
export function listsCard(rows: readonly ProjectRow[], at: InboxAt): boolean {
  return rows.some((r) => r.project === at.project && (r.cards ?? []).some((c) => c.id === at.card));
}

/** In the shell (above every inbox block): a waiting ask opens its card once the rows have it. */
export function useInboxAsks(): void {
  const rows = useProjects();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const f = () => {
      setTick((t) => t + 1);
    };
    subs.add(f);
    return () => {
      subs.delete(f);
    };
  }, []);
  useEffect(() => {
    const p = pending;
    if (p === null) return;
    if (Date.now() > p.until) {
      pending = null;
      return;
    }
    if (!listsCard(rows, p.at)) return;
    pending = null;
    openInbox(p.at);
  }, [rows, tick]);
}
