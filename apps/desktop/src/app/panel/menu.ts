// src/app/panel · a small native menu of the panel's own (an Overview section's '…': Show all,
// Add a file…), shown by macOS (window.bise.popupMenu, nm-menus' main/menu-popup.ts), in the ds's
// EntityMenu shape so a ds MoreButton opens it. A thing's menu (an agent, an artifact) is nm-menus'
// useEntityMenu, never this. Owner: nm-panel.
import { useEffect, useMemo, useRef } from 'react';
import type { MouseEvent } from 'react';
import type { EntityMenu } from '@/ds';

export interface MenuItem {
  readonly id: string;
  /** its words, from the catalog */
  readonly label: string;
  readonly run: () => void;
}

/** The items as a native menu at the pointer or under its button; null with no item. */
export function useMenuOf(items: readonly MenuItem[]): EntityMenu | null {
  const key = items.map((x) => `${x.id}\u0000${x.label}`).join('\u0001');
  // the items' functions change every render; the menu reads the latest at its pick
  const latest = useRef(items);
  useEffect(() => {
    latest.current = items;
  });
  return useMemo(() => {
    if (key === '') return null;
    const show = (at?: { x: number; y: number; width: number; height: number }) => {
      const bise = (window as Partial<Window>).bise;
      if (bise?.popupMenu === undefined) return;
      void bise.popupMenu(latest.current.map((x) => ({ id: x.id, label: x.label })), at).then((id) => {
        latest.current.find((x) => x.id === id)?.run();
      });
    };
    return {
      onContextMenu: (e: MouseEvent<HTMLElement>) => {
        e.preventDefault();
        show();
      },
      open: () => {
        const el = document.activeElement;
        const box = el instanceof HTMLElement ? el.getBoundingClientRect() : undefined;
        show(box === undefined ? undefined : { x: box.left, y: box.top, width: box.width, height: box.height });
      },
    };
  }, [key]);
}
