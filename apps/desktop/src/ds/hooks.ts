// src/ds · the only state and effects a ds component may hold: measuring its own box and following
// its own row's hover (architect m_26213). What they never do: reach the store, the IPC or the app;
// they read the DOM of the component that calls them, nothing else. purity.mjs checks that every
// useState/useEffect/useLayoutEffect/ResizeObserver of src/ds is here. Owner: amb-kit.
import { useCallback, useEffect, useLayoutEffect, useState, type DependencyList, type Ref, type RefObject } from "react";

/** Whether the system asks for reduced motion (none: no matchMedia, as in unit tests). */
export function reducedMotion(): boolean {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** How many px `inner` overflows `box` by, kept fresh as either resizes; 0 when it fits. */
export function useOverflow(box: RefObject<HTMLElement | null>, inner: RefObject<HTMLElement | null>, deps: DependencyList): number {
  const [over, setOver] = useState(0);
  useLayoutEffect(() => {
    const el = box.current;
    const words = inner.current;
    if (el === null || words === null) return;
    const measure = () => {
      const n = Math.max(0, Math.ceil(words.scrollWidth - el.clientWidth));
      setOver((was) => (was === n ? was : n));
    };
    measure();
    if (typeof ResizeObserver !== "function") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    ro.observe(words);
    return () => {
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the caller's deps say when its content changed
  }, deps);
  return over;
}

/**
 * A slide's way back (Slide, Vibe Work's text-hover-scroll): true from when its row (the nearest
 * `[data-slide-row]`, else `box`) loses the hover or the focus after `moving` slid, until the
 * transform's transition ends at home. While true the line stays whole, so it never shows its '…'
 * mid-way. `active`: there is something to slide.
 */
export function useSlideBack(box: RefObject<HTMLElement | null>, moving: RefObject<HTMLElement | null>, active: boolean): boolean {
  const [back, setBack] = useState(false);
  useEffect(() => {
    const el = box.current;
    const words = moving.current;
    if (el === null || words === null || !active) return;
    const row = el.closest("[data-slide-row]") ?? el;
    let moved = false;
    let held = row.matches(":hover");
    const leave = () => {
      held = false;
      if (moved) setBack(true);
    };
    const enter = () => {
      held = true;
      setBack(false);
    };
    const start = (e: TransitionEvent) => {
      if (e.propertyName === "transform") moved = true;
    };
    const end = (e: TransitionEvent) => {
      if (e.propertyName !== "transform" || held || row.matches(":focus-visible, :has(:focus-visible)")) return;
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
  return active && back;
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
