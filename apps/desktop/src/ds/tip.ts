// src/ds · the hover tip's rules (designer m_24359, his 'every compact mark explains itself'): where
// it goes and when it shows. Pure: TipLayer.tsx reads the pointer and the DOM, these decide.
//
// Where: 8 px from its mark, above it, below when there is no room above, clamped to the window
// (8 px from its edges); centred on the mark. It never covers the mark's row: above or below, never
// over.
// When: 400 ms after the pointer rests on a mark; at once on keyboard focus; warm: for 1 s after a
// tip closes (or while one shows), the next one shows at once, so moving along a row of marks
// never blinks.

/** a box on the screen, in CSS px */
export interface Box {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

/** the gap between the tip and its mark, and between the tip and the window's edges */
export const TIP_GAP = 8;
/** how long the pointer rests on a mark before its tip shows */
export const TIP_DELAY_MS = 400;
/** after a tip closes, how long the next one shows at once */
export const TIP_WARM_MS = 1000;

/** Where the tip goes: its left and top, and the side of the mark it is on. Pure. */
export function placeTip(mark: Box, tip: { width: number; height: number }, view: { width: number; height: number }): { left: number; top: number; side: 'above' | 'below' } {
  const above = mark.top - TIP_GAP - tip.height;
  const below = mark.top + mark.height + TIP_GAP;
  // above when it fits; else below when that fits; else the side with more room
  const roomAbove = mark.top;
  const roomBelow = view.height - mark.top - mark.height;
  const side = above >= TIP_GAP ? 'above' : below + tip.height <= view.height - TIP_GAP ? 'below' : roomAbove > roomBelow ? 'above' : 'below';
  const top = side === 'above' ? Math.max(TIP_GAP, above) : below;
  const centred = mark.left + mark.width / 2 - tip.width / 2;
  const left = Math.max(TIP_GAP, Math.min(centred, view.width - TIP_GAP - tip.width));
  return { left: Math.round(left), top: Math.round(top), side };
}

/**
 * A mark's tip: spread on the element (`<span {...tipAttrs("17% of perf's context used")}>`), a key
 * at its right when it has one; '' or none: no tip. The app's TipLayer reads them. Pure.
 */
export function tipAttrs(words: string | undefined, keys?: string): { 'data-tip'?: string; 'data-tip-keys'?: string } {
  if (words === undefined || words === '') return {};
  return keys === undefined || keys === '' ? { 'data-tip': words } : { 'data-tip': words, 'data-tip-keys': keys };
}

/** How long before a mark's tip shows: at once while warm or on keyboard focus, else the delay. Pure. */
export function tipWait(now: number, warmUntil: number, focus: boolean): number {
  return focus || now < warmUntil ? 0 : TIP_DELAY_MS;
}
