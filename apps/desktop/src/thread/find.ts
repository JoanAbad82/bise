// ⌘F: find in a thread (bar 3.4; the TUI's find.rs + find_bar.rs).
// Owner: amb-win. Pure: the component (Find.tsx) owns the field and asks
// the store for older pages while `wantsOlder` says so; this module only
// searches what is loaded and moves the current match.
//
// The TUI's rules, kept: the whole thread is searched (older pages are
// asked one at a time until the first line); ⏎ / ↑ go older, shift+⏎ / ↓
// newer; a search starts on the newest match; a page that comes in front
// doesn't move the current match. Case-insensitive, on the entry's text
// (thinking isn't searched). The composer keeps its draft: find has its
// own field.

/** What find reads of an entry: its position and its searchable text. */
export interface Findable {
  readonly pos: number;
  readonly text: string;
}

/** One match: the entry and where in its text. */
export interface Match {
  readonly pos: number;
  readonly at: number;
}

export interface FindState {
  readonly needle: string;
  /** every match, oldest first */
  readonly matches: readonly Match[];
  /** the current match's index in `matches` (-1: none) */
  readonly current: number;
}

export const EMPTY: FindState = { needle: '', matches: [], current: -1 };

/** Every match of `needle` in `entries` (oldest first by pos, then offset). */
export function findAll(entries: Iterable<Findable>, needle: string): Match[] {
  const n = needle.toLocaleLowerCase();
  if (n.trim() === '') return [];
  const out: Match[] = [];
  const sorted = [...entries].sort((a, b) => a.pos - b.pos);
  for (const e of sorted) {
    const t = e.text.toLocaleLowerCase();
    for (let i = t.indexOf(n); i >= 0; i = t.indexOf(n, i + n.length)) out.push({ pos: e.pos, at: i });
  }
  return out;
}

/** A new needle: search again and start on the newest match. */
export function search(entries: Iterable<Findable>, needle: string): FindState {
  const matches = findAll(entries, needle);
  return { needle, matches, current: matches.length - 1 };
}

/**
 * The entries changed (an older page came in front, a new entry, one
 * replaced): search again, keeping the current match where it was (the
 * same entry and offset, else the nearest older one, else the newest).
 */
export function refresh(s: FindState, entries: Iterable<Findable>): FindState {
  const matches = findAll(entries, s.needle);
  const cur = s.matches[s.current];
  if (cur === undefined) return { needle: s.needle, matches, current: matches.length - 1 };
  let current = -1;
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    if (m !== undefined && (m.pos < cur.pos || (m.pos === cur.pos && m.at <= cur.at))) current = i;
  }
  if (current < 0) current = matches.length - 1;
  return { needle: s.needle, matches, current };
}

/** ⏎ / ↑: the match before the current one (stays on the oldest). */
export function older(s: FindState): FindState {
  return s.current > 0 ? { ...s, current: s.current - 1 } : s;
}

/** shift+⏎ / ↓: the match after the current one (stays on the newest). */
export function newer(s: FindState): FindState {
  return s.current >= 0 && s.current < s.matches.length - 1 ? { ...s, current: s.current + 1 } : s;
}

/** The counter's words: "3/12", "3/12+" while older pages may hold more, "0" with none. */
export function counter(s: FindState, more: boolean): string {
  if (s.needle.trim() === '') return '';
  const plus = more ? '+' : '';
  if (s.matches.length === 0) return more ? '0+' : '0';
  return `${s.matches.length - s.current}/${s.matches.length}${plus}`;
}

/** Keep asking older pages: a needle is set and the thread has more before. */
export function wantsOlder(s: FindState, more: boolean): boolean {
  return s.needle.trim() !== '' && more;
}

/** The current match, if any. */
export function currentMatch(s: FindState): Match | undefined {
  return s.matches[s.current];
}
