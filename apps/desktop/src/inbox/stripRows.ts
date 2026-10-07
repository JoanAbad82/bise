// The thread's inbox strip (bar W7/K24), pure: which of a project's items
// it lists, numbered for ctrl+1-9, which rows show and how many fold into
// '+ n more', and the key that opens row N. Strip.tsx draws it. Owner:
// amb-home.
//
// The TUI's (rust/tui/src/sb/card_draw.rs): its own box above the divider,
// a row per item numbered in the inbox's order (row N is what ctrl+N
// opens), at most STRIP_ROWS rows then '+ n more', the item open in place
// where its row was. Not ported: approvals that came together sharing a
// row (order.ts says why).
import type { Card } from '@/proto';
import { cardKey, sortCards } from './order';

/** At most this many item rows in the box, then '+ n more' (card_draw.rs STRIP_ROWS). */
export const STRIP_ROWS = 3;

/** ctrl+1 to ctrl+9 open rows 1 to 9. */
export const STRIP_KEYS = 9;

/** The project's items in the inbox's order, the ones acted on here left out. */
export function stripList(cards: readonly Card[], project: string, gone: ReadonlySet<string>): Card[] {
  return sortCards(cards.filter((c) => c.project === project)).filter((c) => !gone.has(cardKey(c)));
}

export interface StripRow {
  readonly card: Card;
  /** its number: ctrl+n opens it */
  readonly n: number;
  /** open in place */
  readonly open: boolean;
}

export interface StripView {
  readonly rows: readonly StripRow[];
  /** the items folded into '+ n more' */
  readonly more: number;
  /** the first of them (a click on '+ n more' opens it) */
  readonly next: Card | undefined;
}

/**
 * The rows the box shows: the first STRIP_ROWS, and the open item where
 * its number puts it when it is further down; the rest fold into '+ n more'.
 */
export function stripView(list: readonly Card[], open: string | null): StripView {
  const rows: StripRow[] = [];
  let next: Card | undefined;
  list.forEach((card, i) => {
    const isOpen = cardKey(card) === open;
    if (i < STRIP_ROWS || isOpen) rows.push({ card, n: i + 1, open: isOpen });
    else next ??= card;
  });
  return { rows, more: list.length - rows.length, next };
}

export interface CtrlDigit {
  readonly code: string;
  readonly metaKey: boolean;
  readonly altKey: boolean;
  readonly ctrlKey: boolean;
  readonly shiftKey: boolean;
}

/** ctrl+1-9 (ctrl alone, read by `code`): the row it opens; none: not the strip's key. */
export function stripKey(e: CtrlDigit): number | undefined {
  if (!e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return undefined;
  const m = /^Digit([1-9])$/.exec(e.code);
  return m ? Number(m[1]) : undefined;
}

/** What ctrl+n opens: row n's item (none: no such row, or n past STRIP_KEYS). */
export function stripOpen(list: readonly Card[], n: number): string | undefined {
  const c = n >= 1 && n <= STRIP_KEYS ? list[n - 1] : undefined;
  return c ? cardKey(c) : undefined;
}

/** A row's words: who, then the question's first line (the TUI's `? t3 · npm publish`). */
export function stripWords(c: Card): { who: string; what: string } {
  return { who: c.agent, what: c.question.split('\n')[0] ?? '' };
}
