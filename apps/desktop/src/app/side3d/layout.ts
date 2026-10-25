// src/app/side3d · sideLayout: where the thread's column, the world and the bubbles go across the
// window's width (plan native-mac-plan v4 §2, decision d3). The column is centred when both sides
// leave the world's band (148 + 12 + 12 = 172); else it slides left (24 from the sidebar at
// least); else the world folds into a 5th bubble and the band drops to 92 (68 + 12 + 12); last,
// the column narrows. Recomputed at the end of a resize or a fold only. Pure: widths in, places
// out. The contract nm-ds set for the wave (the types); nm-side writes the function and its tests
// at 1000, 1100, 1280, 1440, 1728 and 1920; nm-thread and nm-composer read it. Owner: nm-side.

/** How the bims' world shows: 'big' (384, hovered), 'small' (148, folded), 'bubble' (a 5th bubble, no room). */
export type WorldSize = 'big' | 'small' | 'bubble';

/** Where things go, in px from the window's left edge. */
export interface SideLayout {
  /** the column's left edge */
  readonly colLeft: number;
  /** the column's width (--w-col 720 at most) */
  readonly colW: number;
  /** how the world shows */
  readonly world: WorldSize;
  /** the band the right side keeps free at the window's right edge (172, or 92 with the world as a bubble) */
  readonly gutter: number;
}

/** The layout for a window `winW` wide, a sidebar (with the rail) `sideW` wide, the tabbed panel open or not. */
export const sideLayout: (winW: number, sideW: number, panelOpen: boolean) => SideLayout = (winW, sideW) => {
  // STUB(native-mac): nm-side
  const colW = Math.max(0, Math.min(720, winW - sideW - 48));
  return { colLeft: sideW + Math.max(24, (winW - sideW - colW) / 2), colW, world: 'small', gutter: 172 };
};
