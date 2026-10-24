// The window's one picture queue (queue.ts) over window.bise.thumb; null where there is no
// window.bise (a component test with no bridge: the cards keep their faint icon). Owner: art-thumbs.
import type { BiseApi } from '@/shared/api';
import { ThumbQueue } from './queue';

let q: ThumbQueue | null | undefined;

/** The window's queue, made at its first ask; null with no window.bise.thumb. */
export function thumbQueue(): ThumbQueue | null {
  if (q !== undefined) return q;
  const api = (globalThis as { bise?: Partial<BiseApi> }).bise;
  const run = api?.thumb;
  q = run === undefined ? null : new ThumbQueue((req, want) => run(req, want));
  return q;
}

/** Tests: the next thumbQueue() reads window.bise again. */
export function resetThumbQueue(): void {
  q = undefined;
}
