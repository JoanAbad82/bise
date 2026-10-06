// ⌘E: open or close everything folded in a thread (tui-parity F1; the
// TUI's ctrl+o). A tiny store per thread screen: a press bumps its version
// and flips `open`; each folded row (tools, a long message) takes that state
// when the version changes and keeps its own clicks in between. Owner: amb-win.
import { createContext, useContext, useState, useSyncExternalStore } from 'react';

export interface FoldAll {
  readonly open: boolean;
  /** 0: never pressed */
  readonly v: number;
}

export interface Folds {
  get(): FoldAll;
  toggle(): void;
  subscribe(l: () => void): () => void;
}

export function createFolds(): Folds {
  let s: FoldAll = { open: false, v: 0 };
  const ls = new Set<() => void>();
  return {
    get: () => s,
    toggle() {
      s = { open: !s.open, v: s.v + 1 };
      for (const l of [...ls]) l();
    },
    subscribe(l) {
      ls.add(l);
      return () => ls.delete(l);
    },
  };
}

export const FoldsContext = createContext<Folds>(createFolds());

/** A folded row's open state: its own clicks, and every ⌘E since it mounted. */
export function useFold(start = false): [boolean, (f: (o: boolean) => boolean) => void] {
  const folds = useContext(FoldsContext);
  const all = useSyncExternalStore(
    (l) => folds.subscribe(l),
    () => folds.get(),
  );
  const [own, setOwn] = useState({ open: all.v > 0 ? all.open : start, v: all.v });
  if (own.v !== all.v) setOwn({ open: all.open, v: all.v });
  const open = own.v !== all.v ? all.open : own.open;
  return [
    open,
    (f) => {
      setOwn((x) => ({ open: f(x.open), v: x.v }));
    },
  ];
}
