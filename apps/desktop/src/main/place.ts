// Where the capsule goes (pure; Electron's screen coordinates: y grows down).
// Ported from apps/ambient/mac's Placement (desktop v9, S8):
//   top     what he opens by hand (fn space, the spotlight): the glass's top
//           170 px under the display's top, centred; it grows downward
//   bottom  what bise brings (a card, the talk, an answer): the glass's bottom
//           96 px above the work area's bottom (the Dock), centred; it grows upward
//   menu    the tray's dropdown: the glass's top 6 px under the tray icon,
//           centred on it
// Never outside the work area (no menu bar, no Dock).

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface DisplayBox {
  /** the whole display */
  readonly bounds: Rect;
  /** without the menu bar and the Dock */
  readonly workArea: Rect;
}

export type Anchor = { readonly at: 'top' } | { readonly at: 'bottom' } | { readonly at: 'menu'; readonly icon: Rect };

export const TOP = 170;
export const BOTTOM = 96;
export const MENU_GAP = 6;

/** A test run's display, far from every real one (never shown anyway: test mode is offscreen). */
export const OFF_DISPLAY: DisplayBox = {
  bounds: { x: -30000, y: -30000, width: 1920, height: 1200 },
  workArea: { x: -30000, y: -30000, width: 1920, height: 1200 },
};

/**
 * The window's bounds for a content of `size`, whose glass (the visible part,
 * inside the window's transparent margin) is `glass` (default: all of it).
 */
export function capsuleBounds(size: { width: number; height: number }, d: DisplayBox, anchor: Anchor, glass?: Rect): Rect {
  const g = glass ?? { x: 0, y: 0, width: size.width, height: size.height };
  const wa = d.workArea;
  const w = Math.min(size.width, wa.width);
  const h = Math.min(size.height, wa.height);
  const gMidX = g.x + g.width / 2;
  let x = d.bounds.x + d.bounds.width / 2 - gMidX;
  let y: number;
  switch (anchor.at) {
    case 'top':
      y = d.bounds.y + TOP - g.y;
      break;
    case 'bottom':
      y = wa.y + wa.height - BOTTOM - (g.y + g.height);
      break;
    case 'menu':
      x = anchor.icon.x + anchor.icon.width / 2 - gMidX;
      y = Math.max(anchor.icon.y + anchor.icon.height, wa.y) + MENU_GAP - g.y;
      break;
  }
  x = Math.min(Math.max(x, wa.x), wa.x + wa.width - w);
  y = Math.min(Math.max(y, wa.y), wa.y + wa.height - h);
  return { x: Math.round(x), y: Math.round(y), width: Math.round(w), height: Math.round(h) };
}
