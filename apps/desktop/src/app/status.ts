// The window's one status line (designer's desktop-notices page (1), approved by main m_20156):
// what bise does by itself (core down or restarted, an update ready, /update's build, a reload)
// says so on ONE line under the title bar, never under the composer. One at a time: the worst
// wins (down > failed > in progress > ready or done), the others wait behind it. Pure; the
// line itself is StatusLine.tsx. Owner: amb-home.
import type { ReactNode } from 'react';

/** How bad a line is: the higher wins the one line. */
export const RANK = { done: 1, ready: 1, running: 2, failed: 3, down: 4 } as const;

/** One candidate for the line: its rank and what it draws (its own test ids). */
export type StatusPart = { readonly rank: number; readonly node: ReactNode };

/** The line to show: the highest rank, the first of equals (the callers' order). Pure. */
export function worst(parts: readonly (StatusPart | null)[]): StatusPart | null {
  let best: StatusPart | null = null;
  for (const p of parts) if (p !== null && (best === null || p.rank > best.rank)) best = p;
  return best;
}
