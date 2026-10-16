// How the right bar shows its agents (page bims-office v7, bims m_27494): 'list' (the rows) or
// 'bims' (the office), and with bims on, the bar at 320 or 'wide' (640 px while the office shows:
// docked when the window has room for it and the thread's 520, sliding over the thread otherwise).
// Both kept per window (keep.ts, like the sections' folds), one store for the window so the frame
// (its column's width) and the bar (its head's toggles) read the same. Owner: bims-wire.
import { useSyncExternalStore } from 'react';
import { keep } from '@/app/keep';
import { MAIN_MIN } from '@/app/resize';

export type AgentsView = 'list' | 'bims';

/** The bar's width while the office shows wide. */
export const WIDE_PX = 640;

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

/** Whether the bar shows wide now: bims on, wide picked, and a project's bar (bise's thread keeps the list in v1). Pure. */
export function showsWide(v: BimsView, project: string | undefined): boolean {
  return v.view === 'bims' && v.wide && v.lost !== true && project !== undefined && project !== '';
}

/**
 * The right column's width (--panel-w): his kept width, or 640 while the office shows wide and the
 * window has room for it beside the sidebar and the thread's MAIN_MIN. Short of room the column
 * keeps his width and the bar slides over the thread at 640 (office.css, .app-rb[data-wide]). Pure.
 */
export function panelColumn(panelW: number, wide: boolean, win: number, side: number): number {
  if (!wide || panelW >= WIDE_PX) return panelW;
  return win - side - WIDE_PX >= MAIN_MIN ? WIDE_PX : panelW;
}

/** The wide bar in its column ('docked': the column is 640) or over the thread ('over': short of room, or the bar sliding over under 1000 px). Pure. */
export function wideMode(sliding: boolean, column: number | undefined): 'docked' | 'over' {
  return !sliding && column !== undefined && column >= WIDE_PX ? 'docked' : 'over';
}

const noSub = (): (() => void) => () => undefined;
const onResize = (cb: () => void): (() => void) => {
  window.addEventListener('resize', cb);
  return () => {
    window.removeEventListener('resize', cb);
  };
};

/** The frame's right column for the bar of `project` (panelColumn): it follows the window's width only while the office shows wide. */
export function usePanelColumn(panelW: number, side: number, project: string | undefined): number {
  const wide = showsWide(useBimsView(), project);
  return useSyncExternalStore(wide ? onResize : noSub, () => panelColumn(panelW, wide, window.innerWidth, side));
}
