// A card's half answer (bar I6/B3, the TUI's per-card draft), one inbox commit 2b. The block's
// composer keeps it: while the open card takes words, the composer's draft key is the card's own
// (amb-web's draftKey, a3c7a5f9), so his words for that card swap in when it opens and out when it
// folds, wherever the block opens it (any thread, bise's view). The thread's own draft never moves.
// Kept in the window's keep through keptStorage, so it outlives a reload and a quit; a send from
// the card blanks it (PmField). Cards answered or closed elsewhere leave their key behind: the
// block prunes them here. Owner: amb-home.
import type { Keep } from '@/app/keep';

/** In every card draft key: the composer's store key ends with it, whatever prefix it adds. */
const MARK = 'inbox#card:';

/** The composer's draft key while `c` is open and takes words. Pure. */
export function cardDraftKey(c: { project: string; card: number }): string {
  return `${MARK}${c.project}-${String(c.card)}`;
}

/** A card key's project ('shop-5e6f7a8b-12' -> 'shop-5e6f7a8b'). Pure. */
export function projectOf(key: string): string {
  const at = key.lastIndexOf('-');
  return at < 0 ? key : key.slice(0, at);
}

/**
 * The card drafts that may go: a kept field whose card is not in `open`, within the projects whose
 * cards are in `open` (after a reload the projects' rows come one hub at a time: home's cards alone
 * must not take shop's drafts, qa-flows 82b584d6). An empty `open` (the store refilling) keeps all;
 * an unreadable entry set aside ('.unread') always stays. Pure.
 */
export function deadDraft(open: ReadonlySet<string>): (id: string) => boolean {
  const live = new Set([...open].map(projectOf));
  return (id) => {
    const at = id.indexOf(MARK);
    if (open.size === 0 || at < 0) return false;
    const key = id.slice(at + MARK.length);
    if (key.includes('.')) return false;
    return !open.has(key) && live.has(projectOf(key));
  };
}

/** Drops the kept drafts of the cards gone from `open` (card keys, cardKey's form). */
export function pruneCardDrafts(k: Keep, open: ReadonlySet<string>): void {
  const dead = deadDraft(open);
  k.pruneTexts('ls:', (id) => !dead(id));
}
