// src/app/menus · an action a menu asks of the screen that shows a thing (bise fait mac, native-lead
// m_42173): Rename can't take its new name in a native menu, so the menu asks; the screen that shows
// the thing takes it (the thread head's inline rename, the sidebar's project row) with
// useEntityAction, and says so. Nobody takes it: the caller's fallback runs (the agents page, the
// projects settings). One set of takers per window, outside React. Owner: nm-menus.
import { useEffect, useRef } from 'react';
import type { Entity } from '@/shared/entity';

/** What a menu may ask a screen. */
export type EntityAction = 'rename';

/** A taker: true when it took `e` (it shows it and can do the action). */
type Taker = (e: Entity) => boolean;

const takers = new Map<EntityAction, Set<Taker>>();

/** Asks the shown screens; true when one took it (the newest first). */
export function askEntityAction(action: EntityAction, e: Entity): boolean {
  const set = takers.get(action);
  if (set === undefined) return false;
  return [...set].reverse().some((t) => t(e));
}

/** In a screen: `take(e)` runs `action` on `e` when it shows it, and returns true; false lets another try. */
export function useEntityAction(action: EntityAction, take: Taker): void {
  const latest = useRef(take);
  useEffect(() => {
    latest.current = take;
  });
  useEffect(() => {
    const t: Taker = (e) => latest.current(e);
    const set = takers.get(action) ?? new Set<Taker>();
    takers.set(action, set);
    set.add(t);
    return () => {
      set.delete(t);
    };
  }, [action]);
}
