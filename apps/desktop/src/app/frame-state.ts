// The left side of the window, one store for every reader (bise fait mac): whether he hid the
// sidebar (⌘\, the bar's button, a drag under 160) and its width (200-320 by its border), both kept
// (keep.ts) across launches. The frame (Frame.tsx useFrame) writes them; the right side (nm-side's
// SideHost, its sideLayout) reads the room the left takes with useLeftWidth, so two readers never
// drift. The rail is always there (56). Owner: nm-frame.
import { useSyncExternalStore } from 'react';
import { keep } from './keep';
import { keptWidth, SIDE } from './resize';
import { NARROW_PX } from './side';

/** The rail's width: always there, on every screen. */
export const RAIL_W = 56;

interface Left {
  /** he hid the sidebar (kept) */
  readonly hidden: boolean;
  /** its width when shown (kept, in SIDE's limits) */
  readonly width: number;
}

const HIDDEN_KEY = 'frame.side.hidden';
const WIDTH_KEY = 'frame.side.w';

let left: Left | null = null;
const listeners = new Set<() => void>();

function read(): Left {
  if (left === null) left = { hidden: keep.view(HIDDEN_KEY) === true, width: keptWidth(keep.view(WIDTH_KEY), SIDE.min, SIDE.max, SIDE.def) };
  return left;
}

function set(next: Left): void {
  const now = read();
  if (next.hidden === now.hidden && next.width === now.width) return;
  if (next.hidden !== now.hidden) keep.setView(HIDDEN_KEY, next.hidden);
  if (next.width !== now.width) keep.setView(WIDTH_KEY, next.width);
  left = next;
  for (const l of listeners) l();
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** The sidebar's kept state now, re-rendered on each change. */
export function useLeft(): Left {
  return useSyncExternalStore(subscribe, read);
}

export const frameLeft = {
  hide: (hidden: boolean): void => {
    set({ ...read(), hidden });
  },
  width: (width: number): void => {
    set({ ...read(), width });
  },
};

/** The room the left takes at a window width: the rail, plus the sidebar when docked (never under 1000 px). Pure. */
export function leftWidthOf(win: number, l: Left): number {
  return RAIL_W + (win >= NARROW_PX && !l.hidden ? l.width : 0);
}

function useWindowWidth(): number {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener('resize', cb);
      return () => {
        window.removeEventListener('resize', cb);
      };
    },
    () => window.innerWidth,
  );
}

/** The room the left takes now (rail + docked sidebar), for the right side's layout. */
export function useLeftWidth(): number {
  return leftWidthOf(useWindowWidth(), useLeft());
}

/** Test seam: forget the store (a test's keep is fresh). */
export function resetFrameLeft(): void {
  left = null;
}
