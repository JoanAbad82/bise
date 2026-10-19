// ⌘F: find in a thread (bar 3.4; the TUI's find.rs + find_bar.rs). Owner: thread-perf.
// Pure: FindBar owns the field, asks the hub (`thread/find`, store.find) and feeds this module.
//
// The whole thread is searched by the hub (thread-perf, architect m_26633): it answers every entry
// that holds the needle up to a line (`found {hits, upto}`, bise_proto::thread::find's rule, one
// rule with the TUI). The entries after `upto` (new lines while find is open) are matched here as
// they come. A match is (entry pos, k-th match in that entry): it stays the same match while lines
// append, so the current one never moves by itself (his bug: the list jumped back to it on every
// new line). ⏎ / ↑ go older, shift+⏎ / ↓ newer; a search starts on the newest match.
// Case-insensitive, without overlaps, on the entry's find text (entry.ts findText; thinking isn't
// searched). An older hub without thread/find: the loaded entries only, and the count says '+'.

/** What find reads of an entry: its position and its searchable text. */
export interface Findable {
  readonly pos: number;
  readonly text: string;
}

/** One entry's hits: its pos and how many matches it holds (the hub's FindHit). */
export interface Hit {
  readonly pos: number;
  readonly n: number;
}

/** One match: the entry and which of its matches (from 0). */
export interface Match {
  readonly pos: number;
  readonly k: number;
}

export interface FindState {
  readonly needle: string;
  /** the find asked of the hub for this needle (0: none asked) */
  readonly rid: number;
  /** every entry with a match, oldest first */
  readonly hits: readonly Hit[];
  /** the hub searched up to this line; the entries after it are matched here (-1: no answer yet) */
  readonly upto: number;
  /** the current match (none: no match) */
  readonly at: Match | undefined;
  /** bumped when the current match moves by his doing (a new needle, ⏎, the first answer): the list goes there then only */
  readonly moved: number;
  /** the count is of the loaded entries only (no answer yet, or a hub without thread/find) */
  readonly partial: boolean;
}

export const EMPTY: FindState = { needle: '', rid: 0, hits: [], upto: -1, at: undefined, moved: 0, partial: false };

/** Where `needle` is in `text`, case-insensitive, without overlaps (find's own rule). */
export function offsetsIn(text: string, needle: string): number[] {
  const n = needle.toLocaleLowerCase();
  if (n.trim() === '') return [];
  const t = text.toLocaleLowerCase();
  const out: number[] = [];
  for (let i = t.indexOf(n); i >= 0; i = t.indexOf(n, i + n.length)) out.push(i);
  return out;
}

/** The entries of `entries` after `after` that hold `needle`, oldest first. */
export function hitsIn(entries: Iterable<Findable>, needle: string, after = -1): Hit[] {
  const out: Hit[] = [];
  for (const e of entries) {
    if (e.pos <= after) continue;
    const n = offsetsIn(e.text, needle).length;
    if (n > 0) out.push({ pos: e.pos, n });
  }
  return out.sort((a, b) => a.pos - b.pos);
}

const sameHit = (a: Hit, b: Hit | undefined): boolean => b !== undefined && a.pos === b.pos && a.n === b.n;
const total = (hits: readonly Hit[]): number => hits.reduce((a, h) => a + h.n, 0);
const newest = (hits: readonly Hit[]): Match | undefined => {
  const h = hits.at(-1);
  return h === undefined ? undefined : { pos: h.pos, k: h.n - 1 };
};

/** `at` if it is still a match of `hits`, else the nearest older one, else the newest. */
function keep(hits: readonly Hit[], at: Match | undefined): Match | undefined {
  if (at === undefined) return newest(hits);
  let best: Match | undefined;
  for (const h of hits) {
    if (h.pos < at.pos) best = { pos: h.pos, k: h.n - 1 };
    else if (h.pos === at.pos) return { pos: h.pos, k: Math.min(at.k, h.n - 1) };
    else break;
  }
  return best ?? newest(hits);
}

/** A new needle (`rid` the find asked of the hub, 0 when it can't): the loaded entries meanwhile, on the newest match. */
export function search(entries: Iterable<Findable>, needle: string, rid: number, moved = 0): FindState {
  const hits = needle.trim() === '' ? [] : hitsIn(entries, needle);
  return { needle, rid, hits, upto: -1, at: newest(hits), moved: moved + 1, partial: needle.trim() !== '' };
}

/** The find asked of the hub for `needle` (FindBar asks once the needle is still): its rid, if he hasn't typed on since. */
export function asked(s: FindState, needle: string, rid: number): FindState {
  return s.needle === needle ? { ...s, rid } : s;
}

/**
 * The hub's answer: its hits up to `upto`, then the loaded entries after it. A stale answer (an
 * older needle's) changes nothing. The current match stays the one he is on when the hub has it;
 * the first answer moves the list to it only when it changed.
 */
export function found(s: FindState, ev: { rid: number; hits: readonly Hit[]; upto: number }, entries: Iterable<Findable>): FindState {
  if (ev.rid !== s.rid || s.needle.trim() === '') return s;
  const hits = [...ev.hits, ...hitsIn(entries, s.needle, ev.upto)];
  const at = keep(hits, s.at);
  const same = at !== undefined && s.at !== undefined && at.pos === s.at.pos && at.k === s.at.k;
  return { ...s, hits, upto: ev.upto, at, moved: same ? s.moved : s.moved + 1, partial: false };
}

/**
 * The loaded entries changed (a new line, a tools entry growing, a page): the matches after the
 * hub's `upto` are counted again here (all of them while no answer came). The current match stays.
 */
export function refresh(s: FindState, entries: Iterable<Findable>): FindState {
  if (s.needle.trim() === '') return s;
  const list = [...entries];
  const fresh = hitsIn(list, s.needle, s.upto);
  // before the hub's answer the loaded ones are all there is; after it, the hub's up to `upto`
  const kept = s.upto < 0 ? [] : s.hits.filter((h) => h.pos <= s.upto);
  const hits = [...kept, ...fresh];
  if (hits.length === s.hits.length && hits.every((h, i) => sameHit(h, s.hits[i]))) return s;
  return { ...s, hits, at: keep(hits, s.at) };
}

/** The current match's place from the oldest (0-based), -1 with none. */
function indexOf(s: FindState): number {
  if (s.at === undefined) return -1;
  let i = 0;
  for (const h of s.hits) {
    if (h.pos === s.at.pos) return i + s.at.k;
    i += h.n;
  }
  return -1;
}

/** The match at place `i` from the oldest. */
function matchAt(hits: readonly Hit[], i: number): Match | undefined {
  let left = i;
  for (const h of hits) {
    if (left < h.n) return { pos: h.pos, k: left };
    left -= h.n;
  }
  return undefined;
}

/** ⏎ / ↑: the match before the current one (stays on the oldest). */
export function older(s: FindState): FindState {
  const i = indexOf(s);
  const at = i > 0 ? matchAt(s.hits, i - 1) : undefined;
  return at === undefined ? s : { ...s, at, moved: s.moved + 1 };
}

/** shift+⏎ / ↓: the match after the current one (stays on the newest). */
export function newer(s: FindState): FindState {
  const i = indexOf(s);
  const at = i >= 0 ? matchAt(s.hits, i + 1) : undefined;
  return at === undefined ? s : { ...s, at, moved: s.moved + 1 };
}

/** The counter's words: "3/12" (3rd from the newest), "3/12+" while the count is partial, "0" with none. */
export function counter(s: FindState): string {
  if (s.needle.trim() === '') return '';
  const plus = s.partial ? '+' : '';
  const all = total(s.hits);
  if (all === 0) return `0${plus}`;
  return `${String(all - indexOf(s))}/${String(all)}${plus}`;
}

/** The current match, if any. */
export function currentMatch(s: FindState): Match | undefined {
  return s.at;
}
