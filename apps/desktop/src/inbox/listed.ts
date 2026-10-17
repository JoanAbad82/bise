// What the inbox lists (fast-try p4 slice 1b, architect m_29799/m_29832): every project's open
// items in the hub's order (each card's rank, order.ts), the ones he answered or closed in this
// window left out (the store's acted set, store/acted.ts), each with the refusal of his act on it
// here (store/refused.ts), the words its card says. Pure: no React, never the '@/store' index; it
// imports store/acted.ts and store/refused.ts directly, both pure (the store's machine imports this
// file: the block, the waiting count and the feature tests read the inbox through the store).
// Owner: amb-home.
import type { Card, ProjectRow } from '@/proto';
import { actedKeys, type Acted } from '@/store/acted';
import { refusedOf, type Refused } from '@/store/refused';
import { withConfirmOptions } from './model';
import { cardKey, sortCards } from './order';

/** One item as a view draws it: the hub's card and the refusal of his answer or close of it here, or null. */
export type InboxItem = Card & { readonly refused: Refused | null };

/** Every project's open items, in the inbox's order (the hub's rank), the ones acted on here left out. Pure. */
export function blockList(rows: readonly ProjectRow[], gone: ReadonlySet<string>): Card[] {
  return sortCards(rows.flatMap((r) => (r.cards ?? []).map(withConfirmOptions))).filter((c) => !gone.has(cardKey(c)));
}

/**
 * What the inbox lists: every project's open items, the ones he answered or closed in this window
 * left out (the store's acted set). Pure.
 */
export function inboxCards(rows: readonly ProjectRow[], acted: readonly Acted[]): Card[] {
  return blockList(rows, actedKeys(acted));
}

/** The cards as items: each with its refusal here, or null; the same cards, in the same order. Pure. */
export function withRefused(cards: readonly Card[], refused: readonly Refused[]): InboxItem[] {
  return cards.map((c) => ({ ...c, refused: refusedOf(refused, c.project, c.id) }));
}
