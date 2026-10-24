// Under 900 px the folder column folds into the crumb (page artifacts-gallery v7 'à 800 px'):
// 'desktop app / agent view ▾' opens a popover with the same rows and keys (the column itself, as
// its child). A press outside or esc closes it; going somewhere closes it too. Owner: art-folders.
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Press, tipAttrs } from '@/ds';
import { library } from '@/proto/words_library.gen';

/** Below this window width the column folds into the crumb. */
export const FOLD_PX = 900;

const widthNow = (): number => (typeof window === 'undefined' ? 1100 : window.innerWidth);
const onResize = (cb: () => void) => {
  window.addEventListener('resize', cb);
  return () => { window.removeEventListener('resize', cb); };
};

/** The window is under 900 px: the column folds. */
export function useNarrow(): boolean {
  return useSyncExternalStore(onResize, widthNow) < FOLD_PX;
}

export function FoldCrumb({ label, children, testId }: { label: string; children: ReactNode; testId: string }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return undefined;
    const down = (e: PointerEvent) => {
      if (box.current?.contains(e.target as Node) !== true) setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      setOpen(false);
    };
    document.addEventListener('pointerdown', down, true);
    document.addEventListener('keydown', key, true);
    return () => {
      document.removeEventListener('pointerdown', down, true);
      document.removeEventListener('keydown', key, true);
    };
  }, [open]);
  return (
    <span ref={box} className="art-fold">
      <Press look="art-fold-crumb" aria-expanded={open} onClick={() => { setOpen(!open); }} data-testid={testId} {...tipAttrs(library.tip_crumb)}>
        {label} <span className="caret" aria-hidden="true">▾</span>
      </Press>
      {open && (
        // a click on a row goes there and closes it
        <span className="art-fold-pop" data-testid={`${testId}.pop`} onClickCapture={(e) => {
          if ((e.target as HTMLElement).closest('.art-col-new, [aria-expanded]') === null) setOpen(false);
        }}>
          {children}
        </span>
      )}
    </span>
  );
}
