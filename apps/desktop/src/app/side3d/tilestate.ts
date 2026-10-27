// src/app/side3d · the bims' world over the outer card (page outer-world v2, his pick #799): a tile
// 280 wide over the card, 140 high by default, hideable (×, back by the cube in the Agents head or
// View › Show the Bims) and resizable in height by the 8 px gap between it and the card (96 to half
// the window's height, a double-click back to 140). Its height and whether it is hidden are kept per
// window (keep.ts), one store for every reader (the tile, the cube, the View menu). The give-way
// inside the card (outerFold) is pure: Agents keeps its 15 rows first, then the other sections fold
// to one row, then to their head, then the agents' list scrolls. Owner: nm-side.
import { useSyncExternalStore } from 'react';
import { keep } from '../keep';

/** the tile's height by default and after a double-click on the handle, css px */
export const TILE_H = 140;
/** the tile's least height */
export const TILE_MIN = 96;
/** the gap between the tile and the card: the handle */
export const TILE_GAP = 8;
/** the card's top with no tile: the bar's 52 (--h-bar); and the room it keeps above the window's bottom */
export const OUTER_TOP = 52;
export const OUTER_FOOT = 12;

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

/** How a section other than Agents shows in the card: its 2 rows, 1, or its head alone with a one-line summary. */
export type Fold = 2 | 1 | 0;

/** the card's own measures for the give-way, css px (OuterCard.tsx, side3d.css) */
export const CARD_PAD = 4 + 8;
export const SEC_GAP = 8;
export const HEAD_H = 36;
export const AGENT_ROW_H = 28;
export const ROW_H = 48;
export const EMPTY_H = 28;

/** What the card holds: its agents' lines (15 at most, the '+ N more' as one) and each other section's rows (0: its empty line). */
export interface CardNeeds {
  readonly agentLines: number;
  readonly sections: readonly number[];
}

/**
 * The give-way inside the card (outer-world v2): the room in, how the other sections show out, and
 * whether the agents' list scrolls. Agents keeps its lines first; then the other sections fold to
 * one row, all together, then to their head; past that the agents' list scrolls. A section with no
 * rows keeps its empty line until the heads alone. Pure.
 */
export function outerFold(room: number, needs: CardNeeds): { readonly fold: Fold; readonly scrolls: boolean } {
  const agents = HEAD_H + needs.agentLines * AGENT_ROW_H;
  const n = needs.sections.length;
  const at = (f: Fold) => CARD_PAD + agents + n * (SEC_GAP + HEAD_H) + needs.sections.reduce((s, rows) => s + (f === 0 ? 0 : rows === 0 ? EMPTY_H : Math.min(f, rows) * ROW_H), 0);
  if (at(2) <= room) return { fold: 2, scrolls: false };
  if (at(1) <= room) return { fold: 1, scrolls: false };
  return { fold: 0, scrolls: at(0) > room };
}
