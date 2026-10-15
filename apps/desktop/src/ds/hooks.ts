// src/ds · the only state and effects a ds component may hold: measuring its own box and following
// its own row's hover (architect m_26213). What they never do: reach the store, the IPC or the app;
// they read the DOM of the component that calls them, nothing else. purity.mjs checks that every
// useState/useEffect/useLayoutEffect/ResizeObserver of src/ds is here. Owner: amb-kit.
import { useCallback, useEffect, useLayoutEffect, useState, type DependencyList, type Ref, type RefObject } from "react";

/** Whether the system asks for reduced motion (none: no matchMedia, as in unit tests). */
export function reducedMotion(): boolean {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

let canvas: CanvasRenderingContext2D | null | undefined;
/** A text's width in px in `font` (a CSS font shorthand), by a canvas; none (unit tests): 7 px a character. */
export function textWidth(font: string): (s: string) => number {
  canvas ??= typeof document === "undefined" ? null : document.createElement("canvas").getContext("2d");
  const ctx = canvas;
  if (ctx == null) return (s) => s.length * 7;
  ctx.font = font;
  return (s) => ctx.measureText(s).width;
}

/** The room inside `box` (its client width) and its font, kept fresh as it resizes; Infinity and ''
 *  until measured. */
export function useRoom(box: RefObject<HTMLElement | null>): { readonly avail: number; readonly font: string } {
  const [room, setRoom] = useState<{ avail: number; font: string }>({ avail: Infinity, font: "" });
  useLayoutEffect(() => {
    const el = box.current;
    if (el === null) return;
    const measure = () => {
      const avail = el.clientWidth;
      const font = getComputedStyle(el).font;
      setRoom((r) => (r.avail === avail && r.font === font ? r : { avail, font }));
    };
    measure();
    if (typeof ResizeObserver !== "function") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, [box]);
  return room;
}

/**
 * A slide's hold (Slide, Vibe Work's text-hover-scroll): `held` while its row (the nearest
 * `[data-slide-row]`, else `box`) has the pointer or the focus; `back` from when it loses them after
 * `moving` slid, until the transform's transition ends at home. While either is true the line shows
 * its whole words, so it never shows its '…' mid-way. `active`: there is something to slide.
 */
export function useSlideHold(box: RefObject<HTMLElement | null>, moving: RefObject<HTMLElement | null>, active: boolean): { readonly held: boolean; readonly back: boolean } {
  const [back, setBack] = useState(false);
  const [held, setHeld] = useState(false);
  useEffect(() => {
    const el = box.current;
    const words = moving.current;
    if (el === null || words === null || !active) return;
    const row = el.closest("[data-slide-row]") ?? el;
    let moved = false;
    let on = false;
    const leave = () => {
      on = false;
      setHeld(false);
      if (moved) setBack(true);
    };
    const enter = () => {
      on = true;
      setHeld(true);
      setBack(false);
    };
    const start = (e: TransitionEvent) => {
      if (e.propertyName === "transform") moved = true;
    };
    const end = (e: TransitionEvent) => {
      if (e.propertyName !== "transform" || on || row.matches(":focus-visible, :has(:focus-visible)")) return;
      moved = false;
      setBack(false);
    };
    row.addEventListener("mouseenter", enter);
    row.addEventListener("mouseleave", leave);
    row.addEventListener("focusin", enter);
    row.addEventListener("focusout", leave);
    words.addEventListener("transitionstart", start);
    words.addEventListener("transitionend", end);
    return () => {
      row.removeEventListener("mouseenter", enter);
      row.removeEventListener("mouseleave", leave);
      row.removeEventListener("focusin", enter);
      row.removeEventListener("focusout", leave);
      words.removeEventListener("transitionstart", start);
      words.removeEventListener("transitionend", end);
    };
  }, [box, moving, active]);
  return { held: active && held, back: active && back };
}

/** Whether `el`'s parent row has `gap` px between the end of its words before `el` and `el`'s
 *  left edge (a fold's held key, thread.tsx FoldHint); measured again when `deps` change. */
export function useFitsAfterWords(ref: RefObject<HTMLElement | null>, gap: number, deps: DependencyList): boolean {
  const [fits, setFits] = useState(true);
  useLayoutEffect(() => {
    const el = ref.current;
    const row = el?.parentElement;
    if (el == null || row == null) return;
    // the words' end: a range over the row's own content before the hint
    const r = new Range();
    r.setStartBefore(row.firstChild ?? el);
    r.setEndBefore(el);
    const words = r.getBoundingClientRect().right;
    setFits(words + gap <= el.getBoundingClientRect().left);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the caller's deps say when its words changed
  }, deps);
  return fits;
}

/**
 * Whether `text` overflows an <input>'s room (a '/' search's placeholder, prim.tsx Field), measured
 * in its font each time it changes size; and the callback ref that measures it, passing the node on
 * to `ref`. `active` false: never measured, never short.
 */
export function useInputTextShort(text: string | undefined, active: boolean, ref: Ref<HTMLInputElement> | undefined): readonly [boolean, (el: HTMLInputElement | null) => (() => void) | undefined] {
  const [short, setShort] = useState(false);
  const fit = useCallback(
    (el: HTMLInputElement | null) => {
      pass(ref, el);
      if (el === null || !active || text === undefined) return undefined;
      const measure = (): void => {
        const ctx = document.createElement("canvas").getContext("2d");
        if (!ctx) return;
        const cs = getComputedStyle(el);
        ctx.font = cs.font;
        const room = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        setShort(room > 0 && ctx.measureText(text).width > room);
      };
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => {
        ro.disconnect();
        pass(ref, null);
      };
    },
    [ref, active, text],
  );
  return [short, fit];
}

/** Hand `el` on to the caller's ref, a function or an object. */
function pass(ref: Ref<HTMLInputElement> | undefined, el: HTMLInputElement | null): void {
  if (typeof ref === "function") ref(el);
  else if (ref) ref.current = el;
}
