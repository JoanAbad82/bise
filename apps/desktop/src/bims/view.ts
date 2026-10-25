// How the right bar shows its agents (page bims-office v7, bims m_27494): 'list' (the rows alone,
// the default: the office is an easter egg he opens with the title bar's icon, Frame.tsx) or 'bims'
// (the office above the rows: he keeps the list while the bims are open), and with bims
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

/** A kept value read back: anything but 'bims' is the list (the default), anything but true is 320. Pure. */
export function viewOf(view: unknown, wide: unknown): BimsView {
  return { view: view === 'bims' ? 'bims' : 'list', wide: wide === true };
}

const listeners = new Set<() => void>();
let current: BimsView | null = null;

function read(): BimsView {
  current ??= viewOf(keep.view(VIEW_KEY), keep.view(WIDE_KEY));
  return current;
}

function write(next: BimsView): void {
  keep.setView(VIEW_KEY, next.view === 'bims' ? 'bims' : undefined);
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
