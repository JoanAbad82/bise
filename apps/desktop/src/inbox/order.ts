// The inbox's order: the TUI's (rust/tui/src/sb/cards.rs sorted_cards),
// so ⌘I lists the same items in the same order as the terminal's inbox
// (bar ⛔5). Pure: no React, no store. Owner: amb-home.
//
// No table here: each card carries its `rank` (bise-proto rows::card_rank,
// the one table the TUI reads too; architect m_9549), 0 = what blocks an
// agent most. Inside one hub the TUI sorts on (rank, id); ids are one
// counter per hub, so across projects the key is (rank, since_ms, project,
// id): the oldest first inside a rank, which on one hub is the id order.
//
// Not ported: the TUI's strip puts approvals that came together on one row
// (card_draw.rs entries); the kind `approval` has no producer yet, and the
// inbox here lists its cards one per row.
import type { Card } from '@/proto';

/** card_rank("") (any kind nobody taught us): a card from an older hub without `rank`. */
export const UNKNOWN_RANK = 6;

/** The fields of a card the order reads. */
export type Ranked = Pick<Card, 'id' | 'project' | 'since_ms' | 'rank'>;

export function rankOf(c: Ranked): number {
  return c.rank ?? UNKNOWN_RANK;
}

/** The cards in reading order: what blocks an agent first, then the oldest. */
export function sortCards<C extends Ranked>(cards: readonly C[]): C[] {
  return [...cards].sort(
    (a, b) => rankOf(a) - rankOf(b) || a.since_ms - b.since_ms || cmp(a.project, b.project) || a.id - b.id,
  );
}

function cmp(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** A card's key across projects (ids are per hub). */
export function cardKey(c: Pick<Card, 'id' | 'project'>): string {
  return `${c.project}-${String(c.id)}`;
}
