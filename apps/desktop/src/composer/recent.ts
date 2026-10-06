// The files he picked in the `@` list, newest first (the TUI's files::picked, B8): a picked path
// ranks first in its tier the next time (a recent path-only match never jumps over a name match).
// Kept in the renderer's storage with the drafts, across projects (the TUI keeps one list too).
import type { Store } from './drafts';
import type { PickFile } from './sources';

const KEY = 'bise.composer.v1.recent-files';
export const RECENT_MAX = 30;

export function loadRecent(store: Store): string[] {
  try {
    const v: unknown = JSON.parse(store.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** A file was picked: it goes first in the list (once), the oldest beyond RECENT_MAX go. */
export function picked(store: Store, path: string): void {
  const next = [path, ...loadRecent(store).filter((p) => p !== path)].slice(0, RECENT_MAX);
  store.setItem(KEY, JSON.stringify(next));
}

/** The core's ranked files, recent picks first within their tier (files.rs rank's tiers: exact
 *  name, name prefix, name fuzzy, path only; one tier when browsing a folder or for an empty
 *  query). Otherwise the core's order stays. */
export function recentFirst(files: readonly PickFile[], query: string, recent: readonly string[]): PickFile[] {
  if (recent.length === 0) return [...files];
  const q = (query.split('/').pop() ?? '').toLowerCase();
  const tier = (f: PickFile): number => {
    if (q === '') return 0;
    const name = (f.path.replace(/\/$/u, '').split('/').pop() ?? '').toLowerCase();
    if (name === q || name.replace(/\.[^.]*$/u, '') === q) return 0;
    if (name.startsWith(q)) return 1;
    return fuzzy(name, q) ? 2 : 3;
  };
  const rank = (f: PickFile): number => {
    const i = recent.indexOf(f.path);
    return i < 0 ? recent.length : i;
  };
  return files
    .map((f, i) => ({ f, i, t: tier(f), r: rank(f) }))
    .sort((a, b) => a.t - b.t || a.r - b.r || a.i - b.i)
    .map((x) => x.f);
}

/** The query's chars appear in the name in order (the TUI's fuzzy name match). */
function fuzzy(name: string, q: string): boolean {
  let i = 0;
  for (const c of name) if (c === q[i]) i += 1;
  return i >= q.length;
}
