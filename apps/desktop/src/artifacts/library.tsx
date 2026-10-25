// The artifacts library in the window's sidebar (bise fait mac, plan decision d2, mockup 7): on the
// artifacts route nm-frame's Sidebar renders <ArtLibrary /> under its '← Projects' row (its words,
// its esc and ⌘[), in the projects' place: All artifacts, Recent, Unfiled, then the folders. The
// state stays the page's (Screen.tsx: the place, the open themes, the field, the drop targets, the
// folder menu): the page publishes its column's props here (publishColumn) on each render and the
// library draws them, so the page and the sidebar never hold two copies. While a library is
// mounted the page draws no column of its own (useLibraryShown); with none (the onboarding's
// window, before the sidebar mounts it, under 900 px's fold) the page keeps its column. A small
// external store (useSyncExternalStore), no React context: the sidebar is outside the page's tree.
// Owner: nm-pages-a.
import { useEffect, useSyncExternalStore } from 'react';
import { FolderColumn, type ColumnProps } from './Column';

/** What the page hands the library: the column's props but its test id. */
export type ColumnBits = Omit<ColumnProps, 'testId'>;

let bits: ColumnBits | null = null;
let shown = 0;
const listeners = new Set<() => void>();
const notify = () => {
  for (const l of listeners) l();
};
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

/** The page's column now (null: the page is not mounted). Screen.tsx calls it on each render, null when it leaves. */
export function publishColumn(b: ColumnBits | null): void {
  if (b === bits) return;
  bits = b;
  notify();
}

/** A library is mounted in the sidebar: the page draws no column of its own. */
export function useLibraryShown(): boolean {
  return useSyncExternalStore(subscribe, () => shown > 0);
}

/** The library as the sidebar mounts it (no props: nm-frame's contract, m_42267). */
export function ArtLibrary() {
  useEffect(() => {
    shown += 1;
    notify();
    return () => {
      shown -= 1;
      notify();
    };
  }, []);
  const b = useSyncExternalStore(subscribe, () => bits);
  return b === null ? null : <FolderColumn {...b} side testId="artifacts.lib" />;
}
