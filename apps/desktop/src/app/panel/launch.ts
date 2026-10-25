// src/app/panel · the launcher's search, pure: which artifacts his words find (every word in the
// title, the kind or the maker's name, newest first, 8 at most) and whether they are an address.
// Owner: nm-panel.
import type { Item } from '@/artifacts/model';

/** How many found artifacts the launcher lists. */
export const FOUND_MAX = 8;

/** The artifacts whose title, kind or maker hold every word of `q` (case aside), newest first. Pure. */
export function launchMatches(items: readonly Item[], q: string, max = FOUND_MAX): readonly Item[] {
  const words = q.toLowerCase().split(/\s+/u).filter((x) => x !== '');
  if (words.length === 0) return [];
  return items
    .filter((x) => {
      const hay = `${x.a.title} ${x.a.kind} ${x.a.agent}`.toLowerCase();
      return words.every((wd) => hay.includes(wd));
    })
    .toSorted((a, b) => b.a.at_ms - a.a.at_ms)
    .slice(0, max);
}

/** His words are an address ('localhost:5173', 'https://…', 'bise.dev/x'), not a search. Pure. */
export function looksLikeUrl(q: string): boolean {
  const t = q.trim();
  if (t === '' || /\s/u.test(t)) return false;
  return /^[a-z][a-z0-9+.-]*:\/\//iu.test(t) || /^localhost(:\d+)?(\/|$)/iu.test(t) || /^[\w-]+(\.[\w-]+)+(:\d+)?(\/|$)/u.test(t);
}
