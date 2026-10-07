// Quoting the thread (his bug 3, parity M6/B7; the TUI's quote.rs and
// input.rs:415): text selected in the thread, then a key typed, goes into the
// composer as a quote chip (`❝ 1`, its strip 'first words… main · 3 lines')
// followed by that key; ⌘' quotes without typing. Pure rules here; the
// listeners are in ThreadScreen. Owner: amb-win.

export interface KeyLike {
  readonly key: string;
  readonly metaKey: boolean;
  readonly ctrlKey: boolean;
  readonly altKey: boolean;
}

const GRAPHEMES = new Intl.Segmenter();

/**
 * What a key does to a selection in the thread: 'type' (a printable key: the
 * quote goes in, then the key), 'quote' (⌘': the quote alone), or nothing
 * (moves, copies, the window's keys). Pure.
 */
export function quoteKey(e: KeyLike): 'type' | 'quote' | undefined {
  if (e.metaKey && !e.ctrlKey && !e.altKey && e.key === "'") return 'quote';
  if (e.metaKey || e.ctrlKey) return undefined;
  // one character (a letter, a digit, a space, an accent typed with ⌥): his words begin
  return Array.from(GRAPHEMES.segment(e.key)).length === 1 ? 'type' : undefined;
}

/** Who said the quoted words, as the TUI's strip names them: his row is 'you', any other the agent's. Pure. */
export function quoteFrom(rowKind: string | null | undefined, rowFrom: string | null | undefined, agent: string): string {
  if (rowKind === 'you') return 'you';
  if (rowKind === 'from_agent' && rowFrom != null && rowFrom !== '') return rowFrom;
  return agent;
}

/** The selected words, as they read (trailing blank lines dropped), or '' when there's nothing to quote. Pure. */
export function quoteText(selected: string): string {
  return selected.replace(/\s+$/u, '').trim() === '' ? '' : selected.replace(/\n+$/u, '');
}
