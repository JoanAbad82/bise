// Each inbox item's typed words (bar I6/B3, the TUI's per-card draft):
// kept when he goes to another item or leaves the inbox and comes back,
// dropped when the item is answered or closed, or when it is gone. Saved
// on input into a plain map, so a key re-renders nothing. One map for the
// window's life (makeDrafts gives a test its own). Owner: amb-home.
import { keep, type Keep } from '@/app/keep';

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

/**
 * Drafts kept in the window's keep (amb-win, keep.ts, lead m_11756): they outlive a reload, an
 * update swap and a core restart, under 'card:<project>-<id>' (his words until answered/closed).
 * A prune with no open item does nothing: an empty list right after a reload or a core
 * restart is the store refilling, not every card gone.
 */
export function keptDrafts(k: Keep): Drafts {
  const id = (key: string): string => `card:${key}`;
  return {
    get: (key) => k.text(id(key)),
    keep: (key, text) => {
      k.setText(id(key), text);
    },
    drop: (key) => {
      k.dropText(id(key));
    },
    prune: (open) => {
      if (open.size === 0) return;
      k.pruneTexts('card:', (x) => open.has(x.slice('card:'.length)));
    },
  };
}

/** The window's drafts: they outlive the inbox screen, and the window itself. */
export const inboxDrafts = keptDrafts(keep);
