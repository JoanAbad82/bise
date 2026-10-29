// How Overview shows its agents (page bims-office v7, bims m_27494): 'bims' (the office above the
// rows, the default since r2-launcher #9, designer m_44486: the map belongs at a project's Overview's
// top) or 'list' (the rows alone, once he hid it with the head's 'the bims'), and with bims
// on, the bar at 320 or 'wide'. Both kept per window (keep.ts, like the sections' folds), one
// store for the window. The wide bar's column (panelColumn, usePanelColumn, wideMode) left with
// the right bar (nm-panel's tabbed panel, native-mac). Owner: bims-wire.
import { useSyncExternalStore } from 'react';
import { keep } from '@/app/keep';

export type AgentsView = 'list' | 'bims';

const VIEW_KEY = 'frame.rb.agents.view';
const WIDE_KEY = 'frame.rb.agents.wide';

export interface BimsView {
  readonly view: AgentsView;
  readonly wide: boolean;
  /** the office couldn't draw here (WebGL lost): the list shows, no width toggle, never wide. Not kept. */
  readonly lost?: boolean;
}

/** A kept value read back: anything but 'list' is the bims (the default), anything but true is 320. Pure. */
export function viewOf(view: unknown, wide: unknown): BimsView {
  return { view: view === 'list' ? 'list' : 'bims', wide: wide === true };
}

const listeners = new Set<() => void>();
let current: BimsView | null = null;

function read(): BimsView {
  current ??= viewOf(keep.view(VIEW_KEY), keep.view(WIDE_KEY));
  return current;
}

function write(next: BimsView): void {
  keep.setView(VIEW_KEY, next.view === 'list' ? 'list' : undefined);
  keep.setView(WIDE_KEY, next.wide ? true : undefined);
  current = next;
  for (const l of [...listeners]) l();
}

export const bimsView = {
  get: read,
  setView(view: AgentsView): void {
    if (read().view !== view) write({ ...read(), view });
  },
  setWide(wide: boolean): void {
    if (read().wide !== wide) write({ ...read(), wide });
  },
  /** Office.tsx: the office lost its WebGL context (true) or draws again (false) */
  setLost(lost: boolean): void {
    if ((read().lost === true) !== lost) write({ ...read(), lost });
  },
  /** tests: forget the cached value (keep.ts was reset under it) */
  reset(): void {
    current = null;
  },
};

export function useBimsView(): BimsView {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
  );
}
