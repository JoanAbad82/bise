// ⌘F's current match, for the rows: a tiny store per thread screen, so a
// move to the next match re-renders the two rows it touches (the one it
// leaves, the one it reaches), never the list. Owner: amb-win.
import { createContext, useContext, useSyncExternalStore } from 'react';

export interface FindMark {
  get(): number | undefined;
  set(pos: number | undefined): void;
  subscribe(l: () => void): () => void;
}

export function createFindMark(): FindMark {
  let cur: number | undefined;
  const ls = new Set<() => void>();
  return {
    get: () => cur,
    set(pos) {
      if (pos === cur) return;
      cur = pos;
      for (const l of [...ls]) l();
    },
    subscribe(l) {
      ls.add(l);
      return () => ls.delete(l);
    },
  };
}

const none: FindMark = createFindMark();
export const FindMarkContext = createContext<FindMark>(none);

/** This entry holds ⌘F's current match. */
export function useIsCurrent(pos: number): boolean {
  const m = useContext(FindMarkContext);
  return useSyncExternalStore(
    (l) => m.subscribe(l),
    () => m.get() === pos,
  );
}
