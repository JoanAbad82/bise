// An option the window does itself, as the hub's row says (bise-proto OptAct, the TUI's
// sb/opt_open.rs): the asker's artifact (`sb notify --open`, a page's drafts notification's
// '1 review') opens in the window, beside the thread, at its block; a link (a merge's PR, an
// update's notes) in his browser; a sign-in is the app's own. Nothing is sent and the item stays
// until his real answer (notif-open, architect m_24679). The plan is optPlan.ts's, decided in the
// store's machine; useOptAct gives it the act.
import { useCallback } from 'react';
import { useStore } from '@/store';
import type { OptAct } from '@/proto/rows';
import { inbox } from '@/proto/words_inbox.gen';

/**
 * The tip of an option that opens an artifact (designer m_24724, law 6: it says where it goes):
 * 'opens <title> beside the thread', its id when the list has no title; null for any other. Pure.
 */
export function optTip(act: OptAct | null | undefined, titleOf: (id: string) => string | undefined): string | null {
  if (act?.act !== 'open' || act.artifact == null) return null;
  return inbox.opens_beside({ title: titleOf(act.artifact) ?? act.artifact });
}

/**
 * Does an option's act for an item of `project`: the store's machine decides what it opens
 * (optPlan.ts, store/machine/cards.ts) and the app's edge runs it (app/edge.ts).
 */
export function useOptAct(): (project: string, act: OptAct) => void {
  const store = useStore();
  return useCallback(
    (project, act) => {
      store.do({ i: 'open', project, act });
    },
    [store],
  );
}
