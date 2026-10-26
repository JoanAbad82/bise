// src/app/side3d · sideLayout: where the thread's column, the world and the bubbles go across the
// window's width (plan native-mac-plan v4 §2, decision d3). The column is centred when both sides
// leave the world's band (148 + 12 + 12 = 172); else it slides left (24 from the sidebar at
// least); else the world folds into a 5th bubble and the band drops to 92 (68 + 12 + 12); last,
// the column narrows. The tabbed panel open (folded-side v9, the width rule): the coins stay
// between the thread and the panel (a 68 band, the world a 5th coin) while the window holds them,
// else they go in the thread's header as minis, and over a sheet or a full-width panel in its tab
// row (CoinsAt); the column is then centred in what is left. A route that is no project's
// (sideShows: the inbox, scheduled, processes, plugins, settings, every artifacts screen...): no
// coins anywhere. Recomputed at the end of a resize or a fold only (place.ts).
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
  /** the world and the bubbles show at the right of the thread (at the window's edge, or between the thread and the panel) */
  readonly side: boolean;
  /** where the coins are (folded-side v9): at the window's edge, between the thread and the panel,
   *  in the thread's header (no room beside it), in the sheet's tab row (the panel over the thread), or nowhere */
  readonly coins: CoinsAt;
  /** the coins' column from the window's right edge, px: 0 at the edge, the panel's width between */
  readonly right: number;
}

/** Where the coins are (folded-side v9, Gabriel's pick). */
export type CoinsAt = 'edge' | 'between' | 'header' | 'tabs' | 'none';

/** The coins' band between the thread and the panel: 12 + the 44 coin + 12 (the world a 5th coin there) */
export const BETWEEN_BAND = 68;
/** What the thread keeps beside the panel, from panel/model.ts: THREAD_MIN beside rows or a shell, ART_THREAD_MIN beside an artifact */
export const THREAD_KEEPS = { rows: 560, artifact: 400 } as const;

/** The tabbed panel as the layout reads it: open beside the thread at `width`, over it as a sheet, or full width; `threadMin` what the thread keeps beside it. */
export interface PanelIn {
  readonly open: boolean;
  readonly width: number;
  readonly over: boolean;
  readonly full: boolean;
  readonly threadMin: number;
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
 * side or not (`shows`, sideShows: off, the column is centred in the whole room, no band), and how
 * the open panel stands (`beside`: a sheet over the thread, full width, what the thread keeps).
 * The panel open (folded-side v9, the width rule): the coins stay between the thread and the panel
 * (the world a 5th coin, the panel's left edge their right) while the window holds the left, the
 * thread's least, their 68 band and the panel; under that they go in the thread's header in place
 * of its status line; a sheet or a full-width panel covers the thread: the coins go in its tab row.
 * Pure.
 */
export const sideLayout = (winW: number, sideW: number, panelOpen: boolean, panelW: number = PANEL_W, shows = true, beside: Omit<PanelIn, 'open' | 'width'> = { over: false, full: false, threadMin: THREAD_KEEPS.rows }): SideLayout => {
  const room = Math.max(0, winW - sideW - (panelOpen ? panelW : 0));
  const centred = (coins: CoinsAt): SideLayout => {
    const w = Math.min(COL_W, Math.max(0, room - 2 * MIN_LEFT));
    return { colLeft: sideW + (room - w) / 2, colW: w, world: 'small', gutter: 0, side: false, coins, right: 0 };
  };
  if (!shows) return centred('none');
  if (panelOpen) {
    if (beside.over || beside.full) return centred('tabs');
    if (winW < sideW + beside.threadMin + BETWEEN_BAND + panelW) return centred('header');
    const at = fit(room, BETWEEN_BAND) ?? { left: MIN_LEFT, w: Math.max(0, room - BETWEEN_BAND - MIN_LEFT) };
    return { colLeft: sideW + at.left, colW: at.w, world: 'bubble', gutter: BETWEEN_BAND, side: true, coins: 'between', right: panelW };
  }
  const edge = (l: { left: number; w: number }, world: WorldSize, gutter: number): SideLayout =>
    ({ colLeft: sideW + l.left, colW: l.w, world, gutter, side: true, coins: 'edge', right: 0 });
  const small = fit(room, WORLD_BAND);
  if (small !== null) return edge(small, 'small', WORLD_BAND);
  const bubble = fit(room, BUBBLE_BAND);
  if (bubble !== null) return edge(bubble, 'bubble', BUBBLE_BAND);
  return edge({ left: MIN_LEFT, w: Math.max(0, room - BUBBLE_BAND - MIN_LEFT) }, 'bubble', BUBBLE_BAND);
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
