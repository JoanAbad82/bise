// src/ds · Dropdown, PickerPop, PickerTrigger, Caret: every menu that opens from something (his
// m_26194: « les menus ... de manière systémique »). The list is always the ds Picker (picker.tsx);
// here are the one trigger and the one way to float it, so no screen places or draws a menu itself:
//   - PickerTrigger: the words then the 8x5 caret, centered on the trigger's height (inline-flex,
//     align-items center; never a '⌄' glyph that sits on the baseline). "chip": the composer's
//     28 px tool chip (text-2, the 6% tint on hover and while open); "field": the settings' Field.
//   - PickerPop: the Picker in a portal on <body>, placed by pickerPlace from its anchor (below by
//     default, above the composer's box for its chips), at most half the window, never past its
//     edges, again on a resize. It takes the keys (ownKeys: ↑↓ home end pgup pgdn ⏎ esc, a letter's
//     typeahead); a press outside it and its anchor, or esc, closes it; the focus goes back to the
//     anchor when the picker had it. Keys typed in it never reach the screen under it.
//   - Dropdown: a PickerTrigger and its PickerPop, the open state its own; a pick closes it.
// Their state (open, place) and effects (the outside press, esc, a resize, the focus back) are
// hooks.ts's useOpen and usePop (purity.mjs): the floating is the ds's, written once. The lint
// (ds/lint.ts menuDrawn) refuses a menu built anywhere else. css/dropdown.css.
import { useRef, type KeyboardEvent, type MouseEventHandler, type ReactNode, type Ref, type RefObject } from "react";
import { createPortal } from "react-dom";
import { cx } from "./cx";
import { useOpen, usePop } from "./hooks";
import { Picker, type PickerProps } from "./picker";
import { tipAttrs } from "./tip";

/** The trigger's caret: an 8x5 chevron, stroke 1.5, text-3 (designer m_24786). */
export function Caret() {
  return (
    <svg className="v" width="8" height="5" viewBox="0 0 8 5" aria-hidden="true">
      <path d="M.75.75 4 4.25 7.25.75" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export interface PickerTriggerProps {
  /** its words (the current value) */
  children: ReactNode;
  /** chip (default): the 28 px tool chip; field: the settings' Field, full width */
  look?: "chip" | "field";
  /** a screen's own signed addition (a class with its rule in the screen's css: the ds lint checks it) */
  extra?: string;
  /** its menu shows (aria-expanded, the chip's tint) */
  open?: boolean;
  /** its name in words (aria-label), when the words don't say it */
  label?: string;
  /** its tip words */
  tip?: string;
  /** the words are a placeholder: text-3 */
  placeholder?: boolean;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  testId?: string;
  ref?: Ref<HTMLButtonElement>;
}
/** The one trigger of a menu: its words, then the caret, centered. */
export function PickerTrigger({ children, look = "chip", extra, open, label, tip, placeholder, disabled, onClick, testId, ref }: PickerTriggerProps) {
  return (
    <button ref={ref} type="button" className={cx("b-ptrig", look, look === "field" && "b-field b-select", extra, placeholder && "ph")} aria-haspopup="menu" aria-expanded={open ?? false} aria-label={label}
      disabled={disabled} {...tipAttrs(tip)} onClick={onClick} data-testid={testId}>
      <span className="w">{children}</span>
      <Caret />
    </button>
  );
}

export interface PickerPopProps extends Omit<PickerProps, "style" | "maxHeight" | "ownKeys" | "onClose"> {
  /** what it opens from: its trigger (the place's x, and its y unless `box`) */
  anchor: RefObject<HTMLElement | null>;
  /** the box it opens 8 px from, when not the anchor: the anchor's closest ancestor matching this
   *  selector ('.box': the composer's box for its chips) */
  box?: string;
  /** on the anchor's left edge, its right edge, or auto (left unless it would pass the window) */
  align?: "start" | "end" | "auto";
  /** where it goes when the room there is enough: below (a menu) or above (the composer's chips) */
  side?: "above" | "below";
  /** at least the anchor's width (a Field's menu) */
  match?: boolean;
  /** a press outside, esc, or a resize that hid the anchor: the caller closes it */
  onClose: () => void;
}

/** The Picker floating from its anchor; rendered while open. Its floating is hooks.ts's usePop. */
export function PickerPop({ anchor, box, align = "auto", side = "below", match = false, onClose, ...picker }: PickerPopProps) {
  const { place, mount, focus, layer } = usePop(anchor, { box, align, side, match }, onClose);
  return createPortal(
    <div ref={mount} className="b-picker-pop" onFocus={focus.onFocus} onBlur={focus.onBlur}
      // its keys are its own: never the screen's under it (React bubbles through the portal)
      onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => { e.stopPropagation(); }}>
      {place !== null && <Picker {...picker} ownKeys onClose={onClose} style={place.style} maxHeight={place.maxHeight} />}
    </div>,
    layer,
  );
}

export interface DropdownProps extends Omit<PickerPopProps, "anchor" | "onClose" | "testId"> {
  /** the trigger's words */
  label: ReactNode;
  look?: "chip" | "field";
  extra?: string;
  /** the trigger's name in words (aria-label) */
  name?: string;
  tip?: string;
  placeholder?: boolean;
  disabled?: boolean;
  /** the trigger's; the picker's is `<testId>.menu` unless `menuTestId` */
  testId?: string;
  menuTestId?: string;
}
/** A trigger and its menu: a click opens it under the trigger, a pick or a press away closes it. */
export function Dropdown({ label, look, extra, name, tip, placeholder, disabled, testId, menuTestId, onPick, match, ...pop }: DropdownProps) {
  const trigger = useRef<HTMLButtonElement>(null);
  const { open, toggle, close } = useOpen();
  return (
    <>
      <PickerTrigger ref={trigger} look={look} extra={extra} open={open} label={name} tip={tip} placeholder={placeholder} disabled={disabled}
        onClick={toggle} testId={testId}>
        {label}
      </PickerTrigger>
      {open && (
        <PickerPop {...pop} anchor={trigger} match={match ?? look === "field"} onClose={close}
          onPick={(id) => { close(); onPick(id); }}
          testId={menuTestId ?? (testId === undefined ? undefined : `${testId}.menu`)} />
      )}
    </>
  );
}
