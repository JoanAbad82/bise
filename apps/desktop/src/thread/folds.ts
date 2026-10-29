// ⌘E: open or close everything folded in a thread (tui-parity F1; the
// TUI's ctrl+o). A tiny store per thread screen: a press bumps its version
// and flips `open`; each folded row (tools, a long message) takes that state
// when the version changes and keeps its own clicks in between. Owner: amb-win.
import { createContext, useContext, useState, useSyncExternalStore } from 'react';
import { keep } from '@/app/keep';

export interface FoldAll {
  readonly open: boolean;
  /** 0: never pressed */
  readonly v: number;
}

export interface Folds {
  get(): FoldAll;
  toggle(): void;
  subscribe(l: () => void): () => void;
  /** its thread ('<project>/<agent>'): a row's own open fold is kept under it (keep.ts) */
  readonly thread?: string;
}

export function createFolds(thread?: string): Folds {
  let s: FoldAll = { open: false, v: 0 };
  const ls = new Set<() => void>();
  return {
    ...(thread === undefined ? {} : { thread }),
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

/**
 * A folded row's open state: its own clicks, and every ⌘E since it mounted. `pos`: the row's
 * entry; his own open fold is kept across a reload under its thread (keep.ts, no age).
 */
export function useFold(start = false, pos?: number): [boolean, (f: (o: boolean) => boolean) => void] {
  const folds = useContext(FoldsContext);
  const all = useSyncExternalStore(
    (l) => folds.subscribe(l),
    () => folds.get(),
  );
  const kept = folds.thread === undefined || pos === undefined ? undefined : `fold:${folds.thread}/${String(pos)}`;
  const [own, setOwn] = useState(() => ({ open: all.v > 0 ? all.open : kept !== undefined && keep.view(kept) === true ? true : start, v: all.v }));
  if (own.v !== all.v) setOwn({ open: all.open, v: all.v });
  const open = own.v !== all.v ? all.open : own.open;
  return [
    open,
    (f) => {
      setOwn((x) => {
        const next = f(x.open);
        if (kept !== undefined) keep.setView(kept, next ? true : undefined);
        return { open: next, v: x.v };
      });
    },
  ];
}
