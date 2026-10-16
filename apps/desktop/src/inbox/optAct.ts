// An option the window does itself, as the hub's row says (bise-proto OptAct, the TUI's
// sb/opt_open.rs): the asker's artifact (`sb notify --open`, a page's drafts notification's
// '1 review') opens in the window, beside the thread, at its block; a link (a merge's PR, an
// update's notes) in his browser; a sign-in is the app's own. Nothing is sent and the item stays
// until his real answer (notif-open, architect m_24679). Pure plan here; useOptAct does it.
import { useCallback } from 'react';
import { useGoArtifact } from '@/artifacts/leave';
import { openAtAnchor } from '@/artifacts/Open';
import { useStore } from '@/store';
import type { OptAct } from '@/proto/rows';
import { inbox } from '@/proto/words_inbox.gen';

export type OptPlan =
  | { readonly t: 'artifact'; readonly id: string; readonly at: string | null }
  | { readonly t: 'url'; readonly url: string }
  | { readonly t: 'sign_in' }
  | { readonly t: 'none' };

/**
 * What `act` opens: its artifact in the window when the project lists it; one gone opens its url,
 * else still its view (which says it isn't in the list any more: never a silent no-op); a link
 * in his browser. Pure.
 */
export function optPlan(act: OptAct, listed: (id: string) => boolean): OptPlan {
  if (act.act === 'sign_in') return { t: 'sign_in' };
  const id = act.artifact ?? null;
  const url = act.url ?? null;
  if (id !== null && (listed(id) || url === null)) return { t: 'artifact', id, at: act.at ?? null };
  return url === null ? { t: 'none' } : { t: 'url', url };
}

/**
 * The tip of an option that opens an artifact (designer m_24724, law 6: it says where it goes):
 * 'opens <title> beside the thread', its id when the list has no title; null for any other. Pure.
 */
export function optTip(act: OptAct | null | undefined, titleOf: (id: string) => string | undefined): string | null {
  if (act?.act !== 'open' || act.artifact == null) return null;
  return inbox.opens_beside({ title: titleOf(act.artifact) ?? act.artifact });
}

/** Does an option's act for an item of `project`. */
export function useOptAct(): (project: string, act: OptAct) => void {
  const store = useStore();
  const goArtifact = useGoArtifact();
  return useCallback(
    (project, act) => {
      const plan = optPlan(act, (id) => store.artifacts(project).some((a) => a.id === id));
      switch (plan.t) {
        case 'artifact':
          if (plan.at !== null) openAtAnchor(`${project}/${plan.id}`, plan.at);
          goArtifact(project, plan.id);
          return;
        case 'url':
          void window.bise.openExternal(plan.url);
          return;
        case 'sign_in':
          store.command({ cmd: 'sign_in', id: 'chatgpt' });
          return;
        case 'none':
          return;
      }
    },
    [store, goArtifact],
  );
}
