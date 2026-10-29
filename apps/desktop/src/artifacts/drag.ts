// Drag and drop between the cards and the folders (page artifacts-gallery v7 'déplacer'): a card
// (or the picked ones) dragged onto a folder of the column or a tile. The ghost is the thumbnail
// itself, tilted, with the count when several move. Holding 600 ms on a closed theme opens it, as
// the Finder does. The drop is the screen's (a move, its count shown 2 s, then a toast 5 s).
// The payload and the hold's timing are pure; the hooks wire them to the DOM. Owner: art-folders.
import { useEffect, useRef, useState, type DragEvent } from 'react';
import type { DropTarget } from './Column';

/** The drag's type: only bise's cards, never a file from the Finder (Drops.tsx takes those). */
export const DRAG_TYPE = 'application/x-bise-artifacts';
/** Holding a drag on a closed theme this long opens it. */
export const HOLD_OPEN_MS = 600;
/** How long a folder shows its new count after a drop. */
export const FLASH_MS = 2000;
/** How long the toast after a move stays. */
export const TOAST_MS = 5000;

/** The payload: the dragged cards' keys ('<project>/<id>'). Pure. */
export function dragPayload(keys: readonly string[]): string {
  return JSON.stringify(keys);
}
export function dragKeys(data: string): string[] {
  try {
    const v: unknown = JSON.parse(data);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** What a drag from this card carries: the picked ones when it is one of them, else itself. Pure. */
export function draggedKeys(key: string, picked: ReadonlySet<string>): string[] {
  return picked.has(key) ? [...picked] : [key];
}

/** Is this drag one of bise's cards. */
export function isCardDrag(e: DragEvent): boolean {
  return Array.from(e.dataTransfer.types).includes(DRAG_TYPE);
}

/**
 * The card's drag props (the grid spreads them on the card's root, art-grid's dragOf): its keys go
 * in the payload, the ghost is its thumbnail ([data-thumb] inside it), tilted, with the count.
 */
export function cardDrag(key: string, picked: ReadonlySet<string>): { draggable: true; onDragStart: (e: DragEvent<HTMLElement>) => void } {
  return {
    draggable: true,
    onDragStart: (e) => {
      const keys = draggedKeys(key, picked);
      e.dataTransfer.setData(DRAG_TYPE, dragPayload(keys));
      e.dataTransfer.effectAllowed = 'move';
      const ghost = ghostOf(e.currentTarget, keys.length);
      if (ghost !== null) {
        e.dataTransfer.setDragImage(ghost, 24, 24);
        // the browser took its picture: the element can go
        requestAnimationFrame(() => { ghost.remove(); });
      }
    },
  };
}

/** The ghost: a copy of the card's thumbnail, tilted, with the count when several move; off screen. */
function ghostOf(card: HTMLElement, n: number): HTMLElement | null {
  const thumb = card.querySelector<HTMLElement>('[data-thumb]') ?? card;
  const box = thumb.getBoundingClientRect();
  const ghost = document.createElement('div');
  ghost.className = 'art-ghost';
  const copy = thumb.cloneNode(true) as HTMLElement;
  const width = Math.min(160, box.width > 0 ? box.width : 160);
  ghost.style.width = `${String(width)}px`;
  ghost.appendChild(copy);
  if (n > 1) {
    const count = document.createElement('span');
    count.className = 'art-ghost-n';
    count.textContent = String(n);
    ghost.appendChild(count);
  }
  document.body.appendChild(ghost);
  return ghost;
}

/**
 * The column's and the tiles' drop side: which row a drag is over, a closed theme opened after
 * 600 ms of holding, and the drop handed to `onDrop` with the keys it carried.
 */
export function useDrop(opts: { isClosedTheme: (id: string) => boolean; onOpen: (id: string) => void; onDrop: (keys: string[], id: string) => void }): DropTarget {
  const [over, setOver] = useState<string | null>(null);
  const hold = useRef<{ id: string; t: ReturnType<typeof setTimeout> } | null>(null);
  const live = useRef(opts);
  useEffect(() => {
    live.current = opts;
  });
  const clear = () => {
    if (hold.current !== null) clearTimeout(hold.current.t);
    hold.current = null;
  };
  useEffect(() => clear, []);
  return {
    over,
    onDragOver: (id, e) => {
      if (!isCardDrag(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (over !== id) setOver(id);
      if (hold.current?.id === id) return;
      clear();
      if (live.current.isClosedTheme(id)) {
        hold.current = { id, t: setTimeout(() => { live.current.onOpen(id); hold.current = null; }, HOLD_OPEN_MS) };
      }
    },
    onDragLeave: (id) => {
      if (over === id) setOver(null);
      if (hold.current?.id === id) clear();
    },
    onDrop: (id, e) => {
      if (!isCardDrag(e)) return;
      e.preventDefault();
      clear();
      setOver(null);
      const keys = dragKeys(e.dataTransfer.getData(DRAG_TYPE));
      if (keys.length > 0) live.current.onDrop(keys, id);
    },
  };
}

/** A value that goes back to null after `ms` (the 2 s count after a drop, the 5 s toast). */
export function useBrief<T>(ms: number): [T | null, (v: T | null) => void] {
  const [v, setV] = useState<T | null>(null);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (t.current !== null) clearTimeout(t.current); }, []);
  return [
    v,
    (next) => {
      if (t.current !== null) clearTimeout(t.current);
      setV(next);
      if (next !== null) t.current = setTimeout(() => { setV(null); }, ms);
    },
  ];
}
