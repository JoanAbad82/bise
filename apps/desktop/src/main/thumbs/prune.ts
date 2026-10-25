// The thumbs cache's cap (architect m_39772: nothing else cleans <bise home>/cache/thumbs): past
// ~500 MB, the pictures least recently read go first until it is under the cap again. Checked at
// most once per app start and after each picture made, never while one is read. toPrune is pure.
// Owner: art-thumbs.
import { readdirSync, statSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

/** The cache's cap: ~893 artifacts take ~55 MB, so it holds about eight libraries like his. */
export const CAP_BYTES = 500 * 1024 * 1024;

export interface CachedFile {
  readonly path: string;
  readonly bytes: number;
  /** last read (ms) */
  readonly atime: number;
}

/** The files to delete so the rest fit under `cap`: the oldest read first. Pure. */
export function toPrune(files: readonly CachedFile[], cap: number): string[] {
  let total = files.reduce((n, f) => n + f.bytes, 0);
  if (total <= cap) return [];
  const out: string[] = [];
  for (const f of [...files].sort((a, b) => a.atime - b.atime || a.path.localeCompare(b.path))) {
    if (total <= cap) break;
    out.push(f.path);
    total -= f.bytes;
  }
  return out;
}

/** The pictures under the cache's root (one level of project folders). */
function list(root: string): CachedFile[] {
  const out: CachedFile[] = [];
  let projects: string[];
  try {
    projects = readdirSync(root);
  } catch {
    return out;
  }
  for (const p of projects) {
    let names: string[];
    try {
      names = readdirSync(join(root, p));
    } catch {
      continue;
    }
    for (const n of names) {
      if (!n.endsWith('.png')) continue;
      try {
        const st = statSync(join(root, p, n));
        out.push({ path: join(root, p, n), bytes: st.size, atime: st.atimeMs });
      } catch {
        // gone meanwhile
      }
    }
  }
  return out;
}

/** Deletes the oldest-read pictures past the cap; how many went. */
export function prune(root: string, cap = CAP_BYTES): number {
  const gone = toPrune(list(root), cap);
  for (const f of gone) {
    try {
      unlinkSync(f);
    } catch {
      // gone meanwhile
    }
  }
  return gone.length;
}
