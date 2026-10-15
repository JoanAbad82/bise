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

/** The block + the composer leave the thread at least this share of the window (designer m_26234). */
export const THREAD_MIN = 0.4;

export interface Fit {
  /** the window's height */
  readonly win: number;
  /** the folded block's height and what is under it, its rows left out (its head, the composer…) */
  readonly fixed: number;
  /** one row's height ('+ n more' as much) */
  readonly row: number;
  /** the items waiting */
  readonly items: number;
}

/**
 * How many item rows the folded block shows: STRIP_ROWS, fewer (3 → 2 → 1) while it and the
 * composer, with the '+ n more' row when one is left out, would leave the thread less than THREAD_MIN
 * of the window; never 0, never a scroll inside the block (designer m_26234). Pure.
 */
export function fitRows(f: Fit): number {
  for (let r = STRIP_ROWS; r > 1; r--) {
    const lines = Math.min(r, f.items) + (f.items > r ? 1 : 0);
    if (f.win - (f.fixed + lines * f.row) >= THREAD_MIN * f.win) return r;
  }
  return 1;
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

export interface RowWords {
  /** the agent alone, on every row: its sign says what it is (designer m_26234) */
  readonly who: string;
  /** a tool call's command: '$ ' before it, in accent */
  readonly cmd: boolean;
  /** its first line ('npm publish', 'a.rs +1 file · +3 −1', 'make test · 3 lines'), '' when none */
  readonly what: string;
  /** the hub's second line ('approved · checks pass'), faint after it; '' when none */
  readonly note: string;
}

/**
 * A row's words as the TUI's box_row and its shape (rust/tui/src/sb/card_draw.rs, cards.rs): the
 * agent (never the TUI's 't3 failed' title: designer m_26234), then a tool call's command (`$ npm publish`, `· n lines` when it has more), a patch's first file and
 * its +/− counts, else the first line that has words; the hub's note after it. Pure.
 */
export function rowWords(c: Card): RowWords {
  const who = c.agent;
  const note = (c.note ?? '').replace(/\s+/gu, ' ').trim();
  const nl = String.fromCharCode(10);
  if (c.kind !== 'approval') {
    const what = c.question.split(nl).map((l) => l.trim()).find((l) => l !== '') ?? '';
    return { who, cmd: false, what, note };
  }
  // an approval: the command (or a patch) up to the first blank line, then its reason
  const head = c.question.replace(/^\n+|\n+$/gu, '').split(nl + nl)[0] ?? '';
  const lines = head.split(nl);
  if (head.startsWith('diff --git') || head.startsWith('--- ')) {
    const files = lines.filter((l) => l.startsWith('+++ ')).map((l) => l.slice(4).trim().replace(/^b\//u, ''));
    const plus = lines.filter((l) => l.startsWith('+') && !l.startsWith('+++')).length;
    const minus = lines.filter((l) => l.startsWith('-') && !l.startsWith('---')).length;
    const more = files.length > 1 ? ` +${String(files.length - 1)} file${files.length > 2 ? 's' : ''} ·` : '';
    return { who, cmd: false, what: `${files[0] ?? 'a file'}${more} +${String(plus)} −${String(minus)}`, note };
  }
  const first = (lines[0] ?? '').trim();
  return { who, cmd: first !== '', what: lines.length > 1 ? `${first} · ${String(lines.length)} lines` : first, note };
}

/** A row's words: who, then the question's first line (the TUI's `? t3 · npm publish`). */
export function stripWords(c: Card): { who: string; what: string } {
  return { who: c.agent, what: c.question.split('\n')[0] ?? '' };
}
