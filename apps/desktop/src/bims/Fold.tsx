// The office opening and closing (Gabriel: it loaded and popped in as one block): an accordion over
// the AGENTS rows. Open: the fold grows empty to the office's height (its last one, or a guess
// from the width, Office.tsx), then the scene fades in once its first frame is drawn (office.css,
// [data-shown]); the whole under 800 ms. Close: the scene fades out with the fold shrinking, then
// the office unmounts. Reduced motion: no grow, a short fade (office.css). The grow is CSS grid's
// rows 0fr -> 1fr, so it follows the office's own height. Owner: bims-hover.
import { useEffect, useState, type ReactNode } from 'react';
import { reducedMotion } from '@/ds/hooks';

/** the fold's grow and shrink, ms (office.css --bims-fold) */
export const FOLD_MS = 280;

type Phase = 'gone' | 'closed' | 'open' | 'closing';

/** The fold's next phase when `open` changes. Pure. */
export function foldOf(phase: Phase, open: boolean): Phase {
  if (open) return phase === 'gone' ? 'closed' : 'open';
  return phase === 'gone' ? 'gone' : 'closing';
}

export function BimsFold({ open, children }: { open: boolean; children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>(open ? 'closed' : 'gone');
  // `open` changed: the next phase now, during this render (React's derived state)
  const [was, setWas] = useState(open);
  if (was !== open) {
    setWas(open);
    setPhase(foldOf(phase, open));
  }
  useEffect(() => {
    // mounted closed: open on the next frame, so the grow has a start
    if (phase === 'closed') {
      const raf = requestAnimationFrame(() => {
        setPhase('open');
      });
      return () => {
        cancelAnimationFrame(raf);
      };
    }
    if (phase === 'closing') {
      const t = setTimeout(
        () => {
          setPhase('gone');
        },
        reducedMotion() ? 120 : FOLD_MS,
      );
      return () => {
        clearTimeout(t);
      };
    }
    return undefined;
  }, [phase]);
  if (phase === 'gone') return null;
  return (
    <div className="bims-fold" data-open={phase === 'open' || undefined} data-testid="app.right.bims.fold" data-phase={phase}>
      <div className="bims-fold-in">{children}</div>
    </div>
  );
}
