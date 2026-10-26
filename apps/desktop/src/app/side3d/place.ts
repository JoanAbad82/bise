// src/app/side3d · the window's one sideLayout, kept here for everyone who places by it (the
// right side, nm-thread's column, nm-composer's floating composer): SideHost computes it from the
// window's width, the left width (rail + sidebar) and the tabbed panel, and puts it here; the
// readers subscribe (useSideLayout). Designer's condition (m_42050): it is computed again only at
// a resize's end (RESIZE_END_MS after the last resize event), when the sidebar or the panel
// folds, or when he goes to a page that shows no side (layout sideShows), never while he types or
// scrolls. Owner: nm-side.
import { useEffect, useSyncExternalStore } from 'react';
import { sideLayout, type SideLayout } from './layout';

/** a resize has ended when no resize event came for this long, ms */
export const RESIZE_END_MS = 160;

let now: SideLayout = sideLayout(typeof window === 'undefined' ? 1440 : window.innerWidth, 0, false);
const subs = new Set<() => void>();

/** Put a new layout (SideHost's); its readers hear it only when a place changed. */
export function setSideLayout(next: SideLayout): void {
  if (next.colLeft === now.colLeft && next.colW === now.colW && next.world === now.world && next.gutter === now.gutter && next.side === now.side) return;
  now = next;
  for (const f of [...subs]) f();
}

/** The layout now, outside React (a test, a measure). */
export const sideLayoutNow = (): SideLayout => now;

/** The window's layout, live: nm-thread's column and nm-composer's floating composer read it. */
export function useSideLayout(): SideLayout {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => {
        subs.delete(cb);
      };
    },
    () => now,
  );
}

/** The window's width at the end of each resize (none while it goes on), and at once on mount. */
export function onResizeEnd(cb: (w: number) => void): () => void {
  let t: ReturnType<typeof setTimeout> | null = null;
  const f = () => {
    if (t !== null) clearTimeout(t);
    t = setTimeout(() => {
      t = null;
      cb(window.innerWidth);
    }, RESIZE_END_MS);
  };
  window.addEventListener('resize', f);
  return () => {
    window.removeEventListener('resize', f);
    if (t !== null) clearTimeout(t);
  };
}

/** In SideHost: compute the layout at a resize's end, when the left width or the panel changes, and when the route shows the side or not (layout sideShows). */
export function useLayoutDriver(winW: number, leftW: number, panel: { readonly open: boolean; readonly width: number }, shows: boolean): void {
  useEffect(() => {
    setSideLayout(sideLayout(winW, leftW, panel.open, panel.open && panel.width > 0 ? panel.width : undefined, shows));
  }, [winW, leftW, panel.open, panel.width, shows]);
}
