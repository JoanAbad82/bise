// The two side columns' widths (his try a43609b2, main m_19371; designer m_19374): the sidebar and
// the right panel resize by dragging their border. Limits: the sidebar 200-320 px (240 by default;
// bise fait mac, page native-mac §6, ui-review m_43503),
// dragged under 160 it folds like ⌘\ and dragged out of the fold it opens at 200; the panel 320 px
// to 55% of the window (320 by default); the main column never under 520 px. Owner: amb-win. Pure.

export const SIDE = { def: 240, min: 200, max: 320, fold: 160, reopen: 200 } as const;
export const PANEL = { def: 320, min: 320, frac: 0.55 } as const;
export const MAIN_MIN = 520;
/** how far he must drag out of a folded sidebar before it opens */
export const UNFOLD_PX = 40;

const clamp = (v: number, lo: number, hi: number): number => Math.round(Math.min(Math.max(v, lo), Math.max(lo, hi)));

/** The sidebar's width for a drag that wants `want` px; 'fold' under 160. Pure. */
export function sideWidthOf(want: number, win: number, panel: number): number | 'fold' {
  if (want < SIDE.fold) return 'fold';
  return clamp(want, SIDE.min, Math.min(SIDE.max, win - panel - MAIN_MIN));
}

/** The right panel's width for a drag that wants `want` px. Pure. */
export function panelWidthOf(want: number, win: number, side: number): number {
  return clamp(want, PANEL.min, Math.min(win * PANEL.frac, win - side - MAIN_MIN));
}

/** A kept width read back: a number in its limits, else the default. Pure. */
export function keptWidth(v: unknown, lo: number, hi: number, def: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? clamp(v, lo, hi) : def;
}
