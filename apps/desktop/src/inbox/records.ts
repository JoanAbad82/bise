// The hub's records of what he answered or what was withdrawn, every project's (inbox-record's
// inbox/history and inbox/recorded, through the store's `inbox:<project>` slices): asked of each
// project's hub when the screen opens (a page of PAGE_MAX), the next page when he reaches the list's
// end, merged newest first. The head's '41 answered' is the hubs' totals, not the loaded rows.
// Owner: inbox-screen.
import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import type { ProjectRow } from '@/proto';
import { useStore, type InboxList } from '@/store';
import { mergeRecords, type InboxRecord } from './past';

/** inbox/history's largest page (bise_proto::inbox::PAGE_MAX). */
export const PAGE_MAX = 200;

export interface Records {
  readonly items: readonly InboxRecord[];
  /** every hub's answered total */
  readonly answered: number;
  /** some hub has older records */
  readonly more: boolean;
  /** asks every hub that has more for its next page */
  readonly older: () => void;
}

type Held = readonly (readonly [string, InboxList])[];

export function useInboxRecords(rows: readonly ProjectRow[]): Records {
  const store = useStore();
  const ids = rows.map((r) => r.project).join(' ');
  useEffect(() => {
    if (ids === '') return;
    for (const project of ids.split(' ')) store.command({ cmd: 'inbox_history', project, limit: PAGE_MAX });
  }, [store, ids]);
  // the held lists, the same array while none of the slices changed (a stable snapshot)
  const last = useRef<{ key: string; refs: readonly (InboxList | null)[]; held: Held } | null>(null);
  const lists = useSyncExternalStore(
    (cb) => {
      const offs = ids === '' ? [] : ids.split(' ').map((p) => store.subscribe(`inbox:${p}`, cb));
      return () => {
        for (const off of offs) off();
      };
    },
    (): Held => {
      const projects = ids === '' ? [] : ids.split(' ');
      const refs = projects.map((p) => store.inbox(p));
      const l = last.current;
      if (l !== null && l.key === ids && l.refs.every((r, i) => r === refs[i])) return l.held;
      const held: Held = projects.flatMap((p, i) => {
        const x = refs[i];
        return x == null ? [] : [[p, x] as const];
      });
      last.current = { key: ids, refs, held };
      return held;
    },
  );
  const older = useCallback(() => {
    for (const [project, l] of lists) {
      const end = l.items[l.items.length - 1];
      if (l.more && end !== undefined) store.command({ cmd: 'inbox_history', project, before: end.card, limit: PAGE_MAX });
    }
  }, [store, lists]);
  return useMemo(
    () => ({
      items: mergeRecords(lists.map(([, l]) => l.items)),
      answered: lists.reduce((n, [, l]) => n + l.answered, 0),
      more: lists.some(([, l]) => l.more),
      older,
    }),
    [lists, older],
  );
}
