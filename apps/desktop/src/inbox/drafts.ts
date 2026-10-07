// Each inbox item's typed words (bar I6/B3, the TUI's per-card draft):
// kept when he goes to another item or leaves the inbox and comes back,
// dropped when the item is answered or closed, or when it is gone. Saved
// on input into a plain map, so a key re-renders nothing. One map for the
// window's life (makeDrafts gives a test its own). Owner: amb-home.

export interface Drafts {
  /** the item's words ('' when none) */
  get: (key: string) => string;
  /** his words as they are now ('' forgets them) */
  keep: (key: string, text: string) => void;
  /** answered or closed: the words went with it */
  drop: (key: string) => void;
  /** only the items still open keep words */
  prune: (open: ReadonlySet<string>) => void;
}

export function makeDrafts(): Drafts {
  const words = new Map<string, string>();
  return {
    get: (key) => words.get(key) ?? '',
    keep: (key, text) => {
      if (text === '') words.delete(key);
      else words.set(key, text);
    },
    drop: (key) => {
      words.delete(key);
    },
    prune: (open) => {
      for (const k of [...words.keys()]) if (!open.has(k)) words.delete(k);
    },
  };
}

/** The window's drafts: they outlive the inbox screen. */
export const inboxDrafts = makeDrafts();
