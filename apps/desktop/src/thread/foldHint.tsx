// ctrl held (app/held.ts, the TUI's ctrlhint.rs `folds`): each fold in the thread says what ctrl+o
// does now, '⌃O expand' (open everything closed) or '⌃O collapse' (after a ctrl+o opened them all),
// after its words; and the facts the composer's held keys need (composer/heldkeys.ts). Owner: amb-win.
import { useContext, useSyncExternalStore, type ReactNode } from 'react';
import { Kbd } from '@/ds';
import { useHeld, useModHeld } from '@/app/held';
import type { HeldCtx, HeldMod } from '@/composer/heldkeys';
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

/** What the composer's row lists while a modifier is held (heldkeys.ts heldPairs): the window's
 *  facts, read once when the hold starts (the inbox block's count and open item, a fold, a code
 *  block, the Overview's agents, a thread in view), as before native-mac (82ef3003e). None while
 *  nothing is held. */
export function useComposerHeld(): { mod: HeldMod; ctx: HeldCtx } | null {
  const mod = useHeld();
  const all = useAllFolds();
  // ⌥⌘ held is the title bar's (the panel's ⌥⌘B keycap): the composer lists nothing for it
  if (mod === null || mod === 'AltMeta') return null;
  const block = document.querySelector<HTMLElement>('[data-testid="inbox.block"]');
  const list = document.querySelector('[data-testid="thread.list"]');
  return {
    mod,
    ctx: {
      fold: list?.querySelector('.b-fold[role="button"]') != null ? foldWord(all.open) : null,
      inbox: Number(block?.dataset.count ?? 0),
      itemOpen: block?.dataset.open !== undefined,
      code: list?.querySelector('.th-code') != null,
      agents: document.querySelectorAll('[data-testid^="app.right.agent."]').length,
      thread: list !== null,
    },
  };
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
