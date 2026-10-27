// src/app/side3d · the bims' world over the outer card (page outer-world v2, his pick #799): a tile
// 280 wide over the card, 140 high by default, hideable (×, back by the cube in the Agents head or
// View › Show the Bims) and resizable in height by the 8 px gap between it and the card (96 to half
// the window's height, a double-click back to 140). Its height and whether it is hidden are kept per
// window (keep.ts), one store for every reader (the tile, the cube, the View menu). The stack's
// top (OUTER_TOP), the one place it is set. The card under it scrolls as a whole (outerrows.ts:
// how many rows each section shows). Owner: nm-side.
import { useSyncExternalStore } from 'react';
import { keep } from '../keep';

/** the tile's height by default and after a double-click on the handle, css px */
export const TILE_H = 140;
/** the tile's least height */
export const TILE_MIN = 96;
/** the gap between the tile and the card: the handle */
export const TILE_GAP = 8;
/** the room the stack (the tile, its handle, the card) keeps under the bar, at the window's right and above its bottom: 12, the one gap (his m_46677: the tile sat on the bar) */
export const OUTER_GAP = 12;
/** the stack's top, css px: the bar's 52 (--h-bar) and its gap. The tile's, or the card's with no tile; inline, the one place it is set */
export const OUTER_TOP = 52 + OUTER_GAP;

/** The tile's most height: half the window's. Never under TILE_MIN. Pure. */
export function tileMax(winH: number): number {
  return Math.max(TILE_MIN, Math.floor(winH / 2));
}

/** A height in the tile's bounds for that window (a kept one that is not a number: TILE_H). Pure. */
export function clampTile(h: unknown, winH: number): number {
  const n = typeof h === 'number' && Number.isFinite(h) ? Math.round(h) : TILE_H;
  return Math.min(tileMax(winH), Math.max(TILE_MIN, n));
}

interface Tile {
  /** he hid it (×): the card takes the full height (kept) */
  readonly hidden: boolean;
  /** its height as he left it, before the window's bounds (kept) */
  readonly h: number;
}

const HIDDEN_KEY = 'outer.world.hidden';
const H_KEY = 'outer.world.h';

let tile: Tile | null = null;
const listeners = new Set<() => void>();

function read(): Tile {
  if (tile === null) {
    const h = keep.view(H_KEY);
    tile = { hidden: keep.view(HIDDEN_KEY) === true, h: typeof h === 'number' && Number.isFinite(h) ? h : TILE_H };
  }
  return tile;
}

function set(next: Tile): void {
  const now = read();
  if (next.hidden === now.hidden && next.h === now.h) return;
  if (next.hidden !== now.hidden) keep.setView(HIDDEN_KEY, next.hidden ? true : undefined);
  if (next.h !== now.h) keep.setView(H_KEY, next.h === TILE_H ? undefined : next.h);
  tile = next;
  for (const l of listeners) l();
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** The tile's kept state now, re-rendered on each change. */
export function useOuterWorld(): Tile {
  return useSyncExternalStore(subscribe, read);
}

export const outerWorld = {
  get: read,
  hide: (hidden: boolean): void => {
    set({ ...read(), hidden });
  },
  /** a height from the handle, clamped to the window's bounds */
  height: (h: number, winH: number): void => {
    set({ ...read(), h: clampTile(h, winH) });
  },
  /** tests: forget what this run read (keep.ts holds what is kept) */
  reset: (): void => {
    tile = null;
  },
};
