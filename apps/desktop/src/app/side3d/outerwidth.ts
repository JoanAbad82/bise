// src/app/side3d · the outer card's width he dragged by its left border (his m_48003, designer
// m_48013): the card and its tile take it together, in layout OUTER's limits (260-480, 292 by
// default) and never more than leaves the thread its column (layout outerFit). Kept app-wide like
// the sidebar's (keep.ts, one key: none at the default), one store for every reader (SideHost's
// layout driver, the border). A drag is clamped to the window it happens in; a kept width the
// window cannot hold now is a wish the layout draws smaller. Owner: nm-side.
import { useSyncExternalStore } from 'react';
import { keep as windowKeep, type Keep } from '../keep';
import { OUTER, outerFit } from './layout';

const W_KEY = 'outer.w';

/** A kept width read back: a number in OUTER's limits, else the default. Pure. */
export function keptOuter(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.min(OUTER.max, Math.max(OUTER.min, Math.round(v))) : OUTER.def;
}

export interface OuterWidth {
  /** his width now (kept), before the window's room */
  readonly want: () => number;
  /** his drag on the border asks `w` with `room` px beside the left (the window less the rail and the sidebar) */
  readonly drag: (w: number, room: number) => void;
  /** a double-click or Enter on the border: back to 292 */
  readonly reset: () => void;
  readonly subscribe: (cb: () => void) => () => void;
}

/** The store over a keep (the window's; a test passes its own). */
export function createOuterWidth(keep: Keep): OuterWidth {
  let w: number | null = null;
  const subs = new Set<() => void>();
  const read = (): number => (w ??= keptOuter(keep.view(W_KEY)));
  const put = (next: number): void => {
    if (next === read()) return;
    w = next;
    keep.setView(W_KEY, next === OUTER.def ? undefined : next);
    for (const f of [...subs]) f();
  };
  return {
    want: read,
    drag: (want, room) => {
      put(outerFit(room, want) ?? keptOuter(want));
    },
    reset: () => {
      put(OUTER.def);
    },
    subscribe: (cb) => {
      subs.add(cb);
      return () => {
        subs.delete(cb);
      };
    },
  };
}

/** The window's one store. */
export const outerWidth: OuterWidth = createOuterWidth(windowKeep);

/** His card width now, re-rendered on each change. */
export function useOuterWant(): number {
  return useSyncExternalStore(outerWidth.subscribe, outerWidth.want);
}
