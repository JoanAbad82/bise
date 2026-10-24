// The background fill (artifacts-in-folders brief part 2: « the rest in the background one at a
// time »): every card's picture the grid's list holds is made into the cache, after the cards in
// view, one at a time, so a scroll finds them made. Owner: art-thumbs.
import { useEffect } from 'react';
import type { ThumbReq } from '@/shared/api';
import type { Item } from '../model';
import { planOf } from './plan';
import { thumbQueue } from './run';

/** The made pictures of these items, as requests (tiles and bare icons need none). Pure. */
export function fillReqs(items: readonly Item[]): ThumbReq[] {
  const out: ThumbReq[] = [];
  for (const it of items) {
    const p = planOf(it);
    if (p.how === 'file' || p.how === 'page') out.push({ how: p.how, src: p.src, project: p.project, id: p.id, v: p.v, sig: p.sig });
  }
  return out;
}

/** Once per list: its pictures queued behind the cards in view (no window.bise: nothing). */
export function usePrefetch(items: readonly Item[]): void {
  useEffect(() => {
    thumbQueue()?.fill(fillReqs(items));
  }, [items]);
}
