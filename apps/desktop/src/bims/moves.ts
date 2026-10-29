// The cube's moves at rest (Cube.tsx, his ask main m_28901): when the next blink and the next hop
// come, and how long each runs (office.css's keyframes last as long). Pure. Owner: bar-main.

export type Move = 'blink' | 'hop';

/** a blink: the eyes shut and open again (office.css bims-blink) */
export const BLINK_MS = 220;
/** a hop: up, down, one small bounce (office.css bims-hop) */
export const HOP_MS = 900;

/** between two blinks: 8-20 s, never on a beat (bims m_29026: at 6 s it ticks in the corner of his eye) */
export const BLINK_EVERY: readonly [number, number] = [8_000, 20_000];
/** between two hops: 2-3 min (his words) */
export const HOP_EVERY: readonly [number, number] = [120_000, 180_000];

/** The wait before the next `kind`, ms, for a draw `r` in [0, 1); `pace` (a check's) replaces it. Pure. */
export function nextIn(kind: Move, r: number, pace?: { blink?: number; hop?: number }): number {
  const fixed = kind === 'blink' ? pace?.blink : pace?.hop;
  if (fixed !== undefined) return fixed;
  const [lo, hi] = kind === 'blink' ? BLINK_EVERY : HOP_EVERY;
  return Math.round(lo + Math.min(Math.max(r, 0), 1) * (hi - lo));
}
