// `:name:` emoji in the composer (the TUI's emoji.rs, E22 and W13): a `:` and two letters at a
// word start open the emoji list; a typed closing `:` after a known name puts the emoji in its
// place. The table is emoji.tsv, a copy of rust/tui/src/emoji.tsv (pure.test.ts fails when they
// differ), one line per emoji: glyph, shortcodes, search tags, description, tab-separated.
// Pure, over the caret's line up to the caret; offsets are UTF-16 (the editor's).
import DATA from './emoji.tsv?raw';

export interface Emoji {
  readonly glyph: string;
  /** the shortcodes (`clap`, `+1`, `thumbsup`...) */
  readonly names: readonly string[];
  /** search words (`applause`, `praise`...), never shortcodes */
  readonly tags: readonly string[];
  readonly desc: string;
}

let table: Emoji[] | null = null;

export function all(): readonly Emoji[] {
  table ??= DATA.split('\n').flatMap((line) => {
    const [glyph = '', names = '', tags = '', desc = ''] = line.split('\t');
    const ns = names.split(' ').filter((n) => n !== '');
    return glyph === '' || ns.length === 0 ? [] : [{ glyph, names: ns, tags: tags.split(' ').filter((t) => t !== ''), desc }];
  });
  return table;
}

/** The emoji of a shortcode (exact name, case-insensitive). */
export function get(name: string): string | null {
  const n = name.toLowerCase();
  return all().find((e) => e.names.includes(n))?.glyph ?? null;
}

const nameChar = (c: string): boolean => /^[A-Za-z0-9_+-]$/u.test(c);

/** A shortcode starts after a line start, a space, an opening bracket or quote, or a non-ASCII
 *  symbol (`👏:tada:`); never after a letter, a digit, `:` or `/` (`http://`, `12:30`, `std::`). */
function opensAfter(prev: string | undefined): boolean {
  if (prev === undefined || /\s/u.test(prev) || '([{"'.includes(prev)) return true;
  return (prev.codePointAt(0) ?? 0) > 0x7f && !/[\p{L}\p{N}]/u.test(prev);
}

/** The `:word` ending at the end of `before`: its `:`'s UTF-16 offset and the word. */
function rawToken(before: string): { start: number; query: string } | null {
  let start = before.length;
  while (start > 0 && nameChar(before.charAt(start - 1))) start -= 1;
  if (start === 0 || before.charAt(start - 1) !== ':') return null;
  const colon = start - 1;
  const prev = Array.from(before.slice(0, colon)).pop();
  if (!opensAfter(prev)) return null;
  return { start: colon, query: before.slice(start) };
}

/** The `:word` of the list: it ends at the caret, opens a word, has 2 letters (`:)`, `:30` don't). */
export function emojiToken(before: string): { start: number; query: string } | null {
  const t = rawToken(before);
  return t !== null && (t.query.match(/[A-Za-z]/gu)?.length ?? 0) >= 2 ? t : null;
}

/** After a typed `:` ending `before`: a known `:name:` there, its start and its emoji. */
export function typedEmoji(before: string): { start: number; glyph: string } | null {
  if (!before.endsWith(':')) return null;
  const t = rawToken(before.slice(0, -1));
  const glyph = t === null ? null : get(t.query);
  return t === null || glyph === null ? null : { start: t.start, glyph };
}

/** Most entries the list shows. */
export const EMOJI_MAX = 50;

const rankName = (q: string, n: string): number | null => (n === q ? 0 : n.startsWith(q) ? 1 : n.includes(q) ? 2 : null);
const rankTag = (q: string, t: string): number | null => (t === q ? 3 : q.length >= 3 && t.startsWith(q) ? 4 : null);

/** Optimal string alignment distance (Levenshtein plus adjacent swaps). */
function edits(a: readonly string[], b: readonly string[]): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= a.length; i += 1) {
    const row = d[i] ?? [];
    const up = d[i - 1] ?? [];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min((up[j] ?? 0) + 1, (row[j - 1] ?? 0) + 1, (up[j - 1] ?? 0) + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, (d[i - 2]?.[j - 2] ?? 0) + 1);
      row[j] = v;
    }
  }
  return d[a.length]?.[b.length] ?? 0;
}

/** A misspelling of `word` or of its start: 1 edit for 3 to 5 letters, 2 from 6. */
function closeTo(q: string, word: string): boolean {
  const qs = Array.from(q);
  const n = qs.length;
  if (n < 3) return false;
  const max = n >= 6 ? 2 : 1;
  const w = Array.from(word);
  for (let l = Math.max(1, n - max); l <= Math.min(w.length, n + max); l += 1) if (edits(qs, w.slice(0, l)) <= max) return true;
  return false;
}

/** The emojis for a query, best first, each with the shortcode shown (emoji.rs filter): exact name,
 *  name prefix, name substring, tag, tag prefix, then close misspellings; shorter names first. */
export function filterEmoji(query: string): { readonly emoji: Emoji; readonly name: string }[] {
  const q = query.toLowerCase();
  if (q === '') return [];
  const hits: { r: number; len: number; i: number; emoji: Emoji; name: string }[] = [];
  all().forEach((e, i) => {
    const first = e.names[0] ?? '';
    let best: { r: number; name: string } | null = null;
    for (const n of e.names) {
      const r = rankName(q, n);
      if (r !== null && (best === null || r < best.r || (r === best.r && n.length < best.name.length))) best = { r, name: n };
    }
    if (best === null) {
      const r = e.tags.reduce<number | null>((m, t) => {
        const x = rankTag(q, t);
        return x === null ? m : m === null ? x : Math.min(m, x);
      }, null);
      if (r !== null) best = { r, name: first };
    }
    if (best === null && [...e.names, ...e.tags].some((w) => closeTo(q, w))) best = { r: 5, name: first };
    if (best !== null) hits.push({ r: best.r, len: best.name.length, i, emoji: e, name: best.name });
  });
  hits.sort((a, b) => a.r - b.r || a.len - b.len || a.i - b.i);
  return hits.slice(0, EMOJI_MAX).map((h) => ({ emoji: h.emoji, name: h.name }));
}
