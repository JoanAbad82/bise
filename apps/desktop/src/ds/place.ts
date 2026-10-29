// src/ds · where a picker floats (pure): the Picker (picker.tsx) caps its height with PICKER_CAP and
// hooks.ts's usePop places PickerPop with pickerPlace. A module of its own so hooks.ts reads it
// without importing a component.
import type { CSSProperties } from "react";

/** The tallest a picker gets, as a part of the window's height (his m_26194: about 50vh). */
export const PICKER_CAP = 0.5;
/** The widest a picker gets (⌘K's 640 aside): picker.css's max-width. */
const PICKER_W = 420;

/** A picker's place: fixed coordinates and its whole height at most. */
export interface PickerPlace {
  style: CSSProperties;
  maxHeight: number;
}

/**
 * A picker's place (designer m_24793, his m_25470): 8 px from its anchor (the composer's box, else
 * its trigger), aligned to its trigger's left edge, or its right edge when the trigger sits right
 * ("auto": the left edge unless a 420 px picker would pass the window's right), 8 px inside the
 * window. On its `side` (above: the composer's; below: a menu's) when the room there takes 240 px
 * or is the larger; else the other side. Its whole height fits that room (8 px from the anchor, 8
 * from the window's edge) and half the window: the list scrolls inside, the footer stays. Fixed
 * coordinates. Pure.
 */
export function pickerPlace(
  anchor: { top: number; bottom: number },
  trigger: { left: number; right: number },
  align: "start" | "end" | "auto",
  win: { width: number; height: number },
  side: "above" | "below" = "above",
): PickerPlace {
  const above = anchor.top - 16;
  const below = win.height - anchor.bottom - 16;
  const up = side === "above" ? above >= 240 || above >= below : !(below >= 240 || below >= above);
  const a = align === "auto" ? (trigger.left + PICKER_W + 8 <= win.width ? "start" : "end") : align;
  const x: CSSProperties = a === "start" ? { left: Math.max(8, trigger.left) } : { right: Math.max(8, win.width - trigger.right) };
  const y: CSSProperties = up ? { bottom: win.height - anchor.top + 8 } : { top: anchor.bottom + 8 };
  return { style: { position: "fixed", ...x, ...y }, maxHeight: Math.min(Math.floor(win.height * PICKER_CAP), Math.max(96, up ? above : below)) };
}
