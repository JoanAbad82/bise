// The artifacts library in the window's sidebar (bise fait mac, plan decision d2, mockup 7): on the
// artifacts route nm-frame's Sidebar renders <ArtLibrary /> under its '← Projects' row (its words,
// its esc and ⌘[), in the projects' place: All artifacts, Recent, Unfiled, then the folders. The
// state stays the page's (Screen.tsx: the place, the open themes, the field, the drop targets, the
// folder menu): the page publishes its column's props here (publishColumn) on each render and the
// library draws them, so the page and the sidebar never hold two copies; a page that leaves takes
// back only its own (retractColumn), never the next page's. While a library is
// mounted the page draws no column of its own (useLibraryShown); with none (the onboarding's
// window, before the sidebar mounts it, under 900 px's fold) the page keeps its column. A small
// external store (useSyncExternalStore), no React context: the sidebar is outside the page's tree.
// Owner: nm-pages-a.
import { useEffect, useSyncExternalStore } from 'react';
import { columnPlaces, FolderColumn, type ColumnProps } from './Column';
import type { At } from './folders';

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

/** The page's column now (null: the page is not mounted). Screen.tsx calls it on each render. */
export function publishColumn(b: ColumnBits): void {
  if (b === bits) return;
  bits = b;
  notify();
}

/** The page leaves: the library goes, unless a newer page published since. A click on a row is a
 *  new route, so App.tsx remounts the page (its key): the new page publishes in its layout effect,
 *  the old one leaves after it (a passive effect's cleanup). Cleared then, the sidebar drew no
 *  'Library' nor 'Folders' until the new page rendered again, about a second (his m_45883). */
export function retractColumn(b: ColumnBits | null): void {
  if (b === null || b !== bits) return;
  bits = null;
  notify();
}

/** A library is mounted in the sidebar: the page draws no column of its own. */
export function useLibraryShown(): boolean {
  return useSyncExternalStore(subscribe, () => shown > 0);
}

/** The page's places in the column's order (Column.tsx columnPlaces), none while the page is not
 *  mounted: app/keys.ts's ⌘1-9 on the artifacts page (rail-keys, designer m_45492). */
export function libraryPlaces(): readonly At[] | undefined {
  return bits === null ? undefined : columnPlaces(bits);
}

/** Go to a place of the library, as a click on its row. */
export function goLibrary(at: At): void {
  bits?.onGo(at);
}

/** The library as the sidebar mounts it (nm-frame's contract, m_42267); `digits`: ⌘ held, its rows' ⌘1-9. */
export function ArtLibrary({ digits = false }: { digits?: boolean }) {
  useEffect(() => {
    shown += 1;
    notify();
    return () => {
      shown -= 1;
      notify();
    };
  }, []);
  const b = useSyncExternalStore(subscribe, () => bits);
  return b === null ? null : <FolderColumn {...b} side digits={digits} testId="artifacts.lib" />;
}
