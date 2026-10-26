// src/app/panel · the launcher's pure parts: which artifacts his words find (every word in the
// title, the kind or the maker's name, newest first), the Artifacts picker's list (the 10 newest,
// or what the field finds), whether his words are an address, what ⏎ opens, the highlighted row's
// ↑/↓ walk, whether the agent in view has changes (its rows' diff counts: the Changes row and ⌥⌘D
// only then), and which rows Open shows. Owner: nm-panel.
import type { Item } from '@/artifacts/model';
import type { Agent } from '@/proto';

/** How many found artifacts the launcher lists. */
export const FOUND_MAX = 8;
/** How many artifacts the Artifacts picker lists (⌘P). */
export const PICK_MAX = 10;

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

/** The Artifacts picker: the PICK_MAX newest, or those `q` finds. Pure. */
export function latestArtifacts(items: readonly Item[], q: string, max = PICK_MAX): readonly Item[] {
  if (q.trim() === '') return items.toSorted((a, b) => b.a.at_ms - a.a.at_ms).slice(0, max);
  return launchMatches(items, q, max);
}

/** His words are an address ('localhost:5173', 'https://…', 'bise.dev/x'), not a search. Pure. */
export function looksLikeUrl(q: string): boolean {
  const t = q.trim();
  if (t === '' || /\s/u.test(t)) return false;
  return /^[a-z][a-z0-9+.-]*:\/\//iu.test(t) || /^localhost(:\d+)?(\/|$)/iu.test(t) || /^[\w-]+(\.[\w-]+)+(:\d+)?(\/|$)/u.test(t);
}

/** What ⏎ opens: the highlighted artifact, else his words as an address (his browser), else nothing. */
export type LaunchPick = { readonly artifact: Item } | { readonly url: string } | undefined;

/** ⏎ in a launcher's or a browser tab's field, `at` the highlighted row of `found`. Pure. */
export function launchEnter(found: readonly Item[], at: number, q: string): LaunchPick {
  const hit = found[at] ?? found[0];
  if (hit !== undefined) return { artifact: hit };
  if (!looksLikeUrl(q)) return undefined;
  const t = q.trim();
  return { url: t.includes('://') ? t : `https://${t}` };
}

/** ↑ (-1) and ↓ (+1) on a list of `n` rows from `at`: stops at the ends. Pure. */
export function stepAt(at: number, n: number, dir: 1 | -1): number {
  if (n === 0) return 0;
  return Math.max(0, Math.min(n - 1, at + dir));
}

/** The agent `name` has changes to show (its rows' diff: a file at least). Pure. */
export function hasChanges(agents: readonly Agent[], name: string): boolean {
  return (agents.find((a) => a.name === name)?.changes?.files ?? 0) > 0;
}

/** An Open row of the launcher. */
export type OpenRow = 'artifacts' | 'terminal' | 'changes' | 'browser' | 'office';

/** Open's rows: Changes only when the agent in view has some (r2 #2), Office with a project. Pure. */
export function openRows(o: { readonly changes: boolean; readonly office: boolean }): readonly OpenRow[] {
  return (['artifacts', 'terminal', 'changes', 'browser', 'office'] as const).filter((r) => (r === 'changes' ? o.changes : r === 'office' ? o.office : true));
}
