// A browser-only artifact (designer m_21714, his feedback main m_21706): a PR, a link, any kind
// with no in-app view (model.ts leaves). A click or ⏎ on its row (the artifacts list, the right
// bar, ⌘K, its thread chip) or space opens his browser at once: no panel, no history entry, the
// list keeps its selection. Every other kind opens in the window as before. Owner: amb-web.
import { useCallback } from 'react';
import { useRouter } from '@/app/router';
import { useStore } from '@/store';
import { leaves, type Leaving } from './model';

export { inApp, leaves, LEAVES, type Leaving } from './model';

const openExternal = (): ((u: string) => unknown) | undefined =>
  (globalThis as { bise?: { openExternal?: (u: string) => unknown } }).bise?.openExternal;

/**
 * Open one artifact from any list: a browser-only one in his browser (nothing in the window
 * moves), else its route. `known` is the row's own idea of it, for an artifact the store
 * doesn't hold (a thread chip's `made`).
 */
export function useGoArtifact(): (project: string, id: string, known?: Leaving) => void {
  const router = useRouter();
  const store = useStore();
  return useCallback(
    (project, id, known) => {
      const a = store.artifacts(project).find((x) => x.id === id) ?? known;
      const go = openExternal();
      if (a !== undefined && leaves(a) && go !== undefined) {
        void go(a.url ?? '');
        return;
      }
      router.go({ screen: 'artifacts', project, id });
    },
    [router, store],
  );
}
