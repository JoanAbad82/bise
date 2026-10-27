// src/app/side3d · how many rows each section of the outer card shows (his m_46685, m_46687; designer
// m_46693, m_46694): Agents its first 10, Artifacts, Scheduled and Processes their first 5, then one
// '+ N more' row that adds 50 at a time, N the next step or what is left, and at its right once
// unfolded 'show less' that folds 50 back down to the first ones (his m_47005, designer m_47011). One rule for the four
// sections; the card scrolls as a whole past its height (OuterCard). The count is the section's own
// state: back to its first when the card remounts (a panel opens) or the scope changes. Pure but
// the hook. Owner: nm-side.
import { useCallback, useState } from 'react';

/** the agents' lines before '+ N more' */
export const FIRST_AGENTS = 10;
/** the other sections' rows before '+ N more' */
export const FIRST_ROWS = 5;
/** what a click on '+ N more' adds */
export const MORE_STEP = 50;

/** What '+ N more' says after `shown` of `total`: the next step, never past what is left; 0: no row. Pure. */
export function moreOf(shown: number, total: number): number {
  return Math.max(0, Math.min(MORE_STEP, total - shown));
}

/** What 'show less' leaves: 50 rows fewer, never under the section's first. Pure. */
export function lessOf(shown: number, first: number): number {
  return Math.max(first, shown - MORE_STEP);
}

/** Whether 'show less' shows: more than its first rows show now (of `total`). Pure. */
export function canLess(shown: number, total: number, first: number): boolean {
  return Math.min(shown, total) > first;
}

/** How far the card scrolls back after a fold: how far above the card's top the section's head went (0: still in view). Pure. */
export function headLift(headTop: number, cardTop: number): number {
  return Math.max(0, cardTop - headTop);
}

/** A section's count: its first rows, then MORE_STEP more per click, and MORE_STEP fewer per 'show less' back to its first. */
export function useShown(first: number): { readonly shown: number; readonly more: () => void; readonly less: () => void } {
  const [shown, setShown] = useState(first);
  const more = useCallback(() => {
    setShown((n) => n + MORE_STEP);
  }, []);
  const less = useCallback(() => {
    setShown((n) => lessOf(n, first));
  }, [first]);
  return { shown, more, less };
}
