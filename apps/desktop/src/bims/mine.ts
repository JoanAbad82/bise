// His own bim's look as the window knows it now (page bim-pick): set from his prefs' `bim` by the
// store (store/machine prefs), read by what draws his bim: the coin's heads (app/side3d) and the
// office (render/index.ts makeRenderer -> office-scene setMine). One value and its listeners, the
// shape useSyncExternalStore takes; three-free, so the side's entry chunk may import it. The
// bise.dev hero never sets it: its main stays today's. Owner: bim-pick.
import { type Look, lookOf, sameLook } from './render/look';

let mine: Look | null = null;
const subs = new Set<() => void>();

/** his look now; null: never picked (today's main) */
export function myLook(): Look | null {
  return mine;
}

/** his look from his prefs' `bim` value; the listeners hear only a change */
export function setMyLook(v: unknown): void {
  const next = lookOf(v);
  if (sameLook(next, mine)) return;
  mine = next;
  for (const fn of [...subs]) fn();
}

/** listen for a new look; the returned function stops */
export function onMyLook(fn: () => void): () => void {
  subs.add(fn);
  return () => {
    subs.delete(fn);
  };
}
