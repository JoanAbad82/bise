// ctrl held (app/held.ts, the TUI's ctrlhint.rs `folds`): each fold in the thread says what ctrl+o
// does now, '⌃O expand' (open everything closed) or '⌃O collapse' (after a ctrl+o opened them all),
// after its words. Owner: amb-win.
import { useContext, useSyncExternalStore, type ReactNode } from 'react';
import { Kbd } from '@/ds';
import { useModHeld } from '@/app/held';
import { FoldsContext, type FoldAll } from './folds';

/** ctrl+o's word now: 'collapse' once a ctrl+o (or ⌘E) opened every fold, else 'expand'. Pure. */
export const foldWord = (allOpen: boolean): 'expand' | 'collapse' => (allOpen ? 'collapse' : 'expand');

/** The thread's last ctrl+o / ⌘E (folds.ts). */
function useAllFolds(): FoldAll {
  const folds = useContext(FoldsContext);
  return useSyncExternalStore(
    (l) => folds.subscribe(l),
    () => folds.get(),
  );
}

/** The fold's hint while ctrl is held alone, else none. */
export function useFoldHint(): ReactNode {
  const ctrl = useModHeld('Control');
  const all = useAllFolds();
  if (!ctrl) return undefined;
  return (
    <span className="th-fold-hint" data-testid="thread.fold.hint">
      <Kbd>⌃O</Kbd> {foldWord(all.open)}
    </span>
  );
}
