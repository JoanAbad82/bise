// src/app/side3d · the agents lists move calmly (side-sort, designer m_47454): the hub's rank
// (switchboard proto_view/rank.rs) moves a row at each turn edge; while the pointer is over a list or
// one of its rows has keyboard focus, the order he sees holds (heldOrder), and when it moves, each
// row that changed place slides there (slideOf, 160 ms ease-out; under reduced motion it jumps).
// Pure: useCalm.ts runs it on the DOM. Owner: nm-side.

/** How long a row slides to its new place (designer m_47454). */
export const SLIDE_MS = 160;

/**
 * `next` in the order he sees (`shown`, keys): the rows still there keep their order, a gone one
 * leaves its place, a newcomer goes right after the row before it in `next` (the first: at the
 * top), so a worktree's rows stay under their head. Nothing shown yet: `next`. Pure.
 */
export function heldOrder<T>(shown: readonly string[] | null, next: readonly T[], keyOf: (r: T) => string): T[] {
  if (shown === null || shown.length === 0) return next.slice();
  const byKey = new Map(next.map((r) => [keyOf(r), r]));
  const out = shown.filter((k) => byKey.has(k));
  const placed = new Set(out);
  next.forEach((r, i) => {
    const k = keyOf(r);
    if (placed.has(k)) return;
    const before = i === 0 ? undefined : keyOf(next[i - 1] as T);
    out.splice(before === undefined ? 0 : out.indexOf(before) + 1, 0, k);
    placed.add(k);
  });
  return out.map((k) => byKey.get(k) as T);
}

/**
 * The slides a new order asks for: each row on both sides of it that moved, by how many px it
 * starts from its old place (old top - new top). Nothing when the order is the same (a row that
 * grows moves the ones under it, no slide). Pure.
 */
export function slideOf(was: readonly string[], now: readonly string[], wasTop: ReadonlyMap<string, number>, nowTop: ReadonlyMap<string, number>): Map<string, number> {
  const out = new Map<string, number>();
  const kept = now.filter((k) => was.includes(k));
  const before = was.filter((k) => now.includes(k));
  if (kept.every((k, i) => before[i] === k)) return out;
  for (const k of kept) {
    const a = wasTop.get(k);
    const b = nowTop.get(k);
    if (a !== undefined && b !== undefined && a !== b) out.set(k, a - b);
  }
  return out;
}
