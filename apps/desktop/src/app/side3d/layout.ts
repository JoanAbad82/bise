// src/app/side3d · sideLayout: where the thread's column, the world and the bubbles go across the
// window's width (plan native-mac-plan v4 §2, decision d3). The column is centred when both sides
// leave the world's band (148 + 12 + 12 = 172); else it slides left (24 from the sidebar at
// least); else the world folds into a 5th bubble and the band drops to 92 (68 + 12 + 12); last,
// the column narrows. The tabbed panel open, or a route that is no project's (sideShows: the inbox,
// scheduled, processes, plugins, settings, every artifacts screen...): the right side hides, the
// column is centred in what is left. Recomputed at the end of a resize or a fold only (place.ts).
// Pure: widths in, places out; nm-thread and nm-composer read it through place.ts. Owner: nm-side.

import type { Route } from '../route';

/**
 * The folded side (the world and its bubbles) shows inside a project only (r2-side item 7,
 * Gabriel m_44266, designer m_44292): a thread (bise's own too), its agents, archived, changes,
 * PRs, a review, a feature, a commit, a branch, environments, debug. Hidden on the app-wide pages:
 * the inbox, scheduled, processes, plugins, settings, report, onboarding, lab, not found and every
 * artifacts screen (the library, a project's own too). Pure.
 */
export function sideShows(r: Route): boolean {
  switch (r.screen) {
    case 'bise':
    case 'thread':
    case 'agents':
    case 'changes':
    case 'prs':
    case 'review':
    case 'feature':
    case 'commit':
    case 'branch':
    case 'environments':
    case 'debug':
      return true;
    case 'artifacts':
    case 'scheduled':
    case 'running':
    case 'plugins':
    case 'inbox':
    case 'report':
    case 'settings':
    case 'onboarding':
    case 'lab':
    case 'notfound':
      return false;
  }
}

/** How the bims' world shows: 'big' (384, hovered), 'small' (148, folded), 'bubble' (a 5th bubble, no room). */
export type WorldSize = 'big' | 'small' | 'bubble';

/** Where things go, in px from the window's left edge. */
export interface SideLayout {
  /** the column's left edge */
  readonly colLeft: number;
  /** the column's width (--w-col 720 at most) */
  readonly colW: number;
  /** how the world shows (never 'big' here: the hover grows it over the page, the layout stays) */
  readonly world: WorldSize;
  /** the band the right side keeps free at the window's right edge (172, or 92 with the world as a bubble; 0 when the panel is open) */
  readonly gutter: number;
  /** the world and the bubbles show (false while the tabbed panel is open) */
  readonly side: boolean;
}

/** --w-col: the column at most */
export const COL_W = 720;
/** the least room left of the column once it slid */
export const MIN_LEFT = 24;
/** the world's band: 148 + 12 + 12 */
export const WORLD_BAND = 172;
/** the band with the world as a 5th bubble: its 68 object + 12 + 12 */
export const BUBBLE_BAND = 92;
/** the panel's width when its owner says none (--w-panel) */
export const PANEL_W = 384;

/** The column in `room` px with `band` kept on the right, or null when it needs to narrow. Pure. */
function fit(room: number, band: number): { left: number; w: number } | null {
  const w = Math.min(COL_W, room);
  const centred = (room - w) / 2;
  if (centred >= band) return { left: centred, w };
  const slid = room - w - band;
  if (slid >= MIN_LEFT) return { left: slid, w };
  return null;
}

/**
 * The layout for a window `winW` wide, a sidebar (with the rail) `sideW` wide, the tabbed panel
 * open or not (`panelW` its width, --w-panel when its owner did not say), the route showing the
 * side or not (`shows`, sideShows: off, the column is centred in the whole room, no band). Pure.
 */
export const sideLayout = (winW: number, sideW: number, panelOpen: boolean, panelW: number = PANEL_W, shows = true): SideLayout => {
  const room = Math.max(0, winW - sideW - (panelOpen ? panelW : 0));
  if (panelOpen || !shows) {
    const w = Math.min(COL_W, Math.max(0, room - 2 * MIN_LEFT));
    return { colLeft: sideW + (room - w) / 2, colW: w, world: 'small', gutter: 0, side: false };
  }
  const small = fit(room, WORLD_BAND);
  if (small !== null) return { colLeft: sideW + small.left, colW: small.w, world: 'small', gutter: WORLD_BAND, side: true };
  const bubble = fit(room, BUBBLE_BAND);
  if (bubble !== null) return { colLeft: sideW + bubble.left, colW: bubble.w, world: 'bubble', gutter: BUBBLE_BAND, side: true };
  const w = Math.max(0, room - BUBBLE_BAND - MIN_LEFT);
  return { colLeft: sideW + MIN_LEFT, colW: w, world: 'bubble', gutter: BUBBLE_BAND, side: true };
};

/** the room a card keeps above the window's bottom (designer m_44499) */
export const CARD_ROOM = 16;
/** a card's height at most, however tall the window */
export const CARD_MAX = 560;

/**
 * A card's height at most: its top is always its bubble's (`bubbleTop`, side px, the side
 * `sideTop` under the window's top); it ends 16 above the window's bottom at the lowest, 560 at
 * most; its rows scroll inside, its head and foot stay whole (designer m_44499, which replaces the
 * lift of r2-side item 3). Nothing measured: a card can never run past the window, nor move. Pure.
 */
export const cardMaxH = (sideTop: number, bubbleTop: number, winH: number): number =>
  Math.max(0, Math.min(CARD_MAX, winH - CARD_ROOM - sideTop - bubbleTop));
