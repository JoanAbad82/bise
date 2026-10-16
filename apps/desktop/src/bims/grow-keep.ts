// The office's high-water mark per project (growth.ts raise): kept in the window's view record
// (keep.ts, no age), so a reload, a relaunch or a hub that counts one less never shrinks the
// office. The drawing rule is the client's (architect m_27970); the hub stores nothing. Owner: bims-grow.
import { keep } from '@/app/keep';
import type { Growth } from '@/proto';
import { growthOfKept, raise } from './growth';

const key = (project: string): string => `bims.grow.${project}`;

/** The project's mark raised by `g` (kept when it moved); `g` null: the mark as kept. */
export function growHigh(project: string, g: Growth | null): Growth | null {
  const kept = growthOfKept(keep.view(key(project)));
  const high = raise(kept, g);
  if (high && JSON.stringify(high) !== JSON.stringify(kept)) keep.setView(key(project), high);
  return high;
}
