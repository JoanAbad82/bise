// Esc goes up the hierarchy, and the window's other ways back (designer's
// desktop-history; amb-win's seam m_19808). Owner: amb-web.
//
// Esc keeps every meaning it has first: a menu, a sheet, ⌘K, the find bar,
// a dictation, a composer with words, an inbox card open in place, the right
// bar over the window, an open artifact. Each of those takes the esc
// (preventDefault, or stops it). Only an esc NOBODY took goes up: an agent
// → its project's main → bise; a list or a tool screen → the place before.
// Going up is a go(): ‹ brings him back.
//
// Two moments: a capture listener installed when this module loads (so it
// runs before any other window listener, while a closing menu is still in
// the DOM) notes whether a popup was open or a field held words; after the
// whole dispatch, the hook reads whether anyone took it (composer/escape.ts:
// the composer's field prevents every esc and marks the ones it left free).
// ⌘[ ⌘] and the mouse's side buttons go back and forward; none of them acts
// while a sheet is open.
import { useEffect } from "react";
import { escapeIsFree } from "@/composer/escape";
import { homeOf, upOf } from "./route";
import type { Router } from "./router";

/** Open, these keep esc and the history keys to themselves (a menu, a sheet, ⌘K, the keys sheet, a model list). */
const POPUP =
  '[role="dialog"],[role="alertdialog"],[role="menu"],[aria-modal="true"],.app-menu,.b-composer-pick';
/** Open, these stop ‹ › ⌘[ ⌘] and the side buttons (designer: none acts while a sheet is open). */
const SHEET = '[role="dialog"],[role="alertdialog"],[aria-modal="true"]';

/** A field that holds his words, focused: its esc, never a move. Pure on the element. */
export function holdsWords(el: Element | null): boolean {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)
    return el.value.trim() !== "";
  if (el instanceof HTMLElement && el.isContentEditable)
    return el.textContent.trim() !== "";
  return false;
}

/** A sheet is open: the history keys and buttons do nothing. */
export function sheetOpen(doc: Document = document): boolean {
  return doc.querySelector(SHEET) !== null;
}

const held = new WeakSet<Event>();

function note(e: KeyboardEvent): void {
  if (e.key !== "Escape") return;
  if (
    e.repeat ||
    e.isComposing ||
    e.metaKey ||
    e.ctrlKey ||
    e.altKey ||
    e.shiftKey ||
    document.querySelector(POPUP) !== null ||
    holdsWords(document.activeElement)
  )
    held.add(e);
}

let installed = false;
/** The capture half, once per window, before React adds its own (called at module load). */
function install(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("keydown", note, true);
}
install();

/** Where an esc nobody took goes from here (null: nowhere). Pure. */
export function escTarget(
  router: Pick<Router, "get" | "canBack">,
): "back" | ReturnType<typeof homeOf> | null {
  const now = router.get();
  const up = upOf(now);
  if (up !== "back") return up;
  return router.canBack() ? "back" : homeOf(now);
}

/** Esc up, ⌘[ ⌘] and the mouse's side buttons (3 back, 4 forward), mounted once in the shell. */
export function useHistoryWays(router: Router): void {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || held.has(e)) return;
      // after the whole dispatch: a handler below the window may still take it
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!escapeIsFree(e)) return;
        const to = escTarget(router);
        if (to === "back") router.back();
        else if (to !== null) router.go(to);
      }, 0);
    };
    const onKey = (e: KeyboardEvent) => {
      if (
        !e.metaKey ||
        e.altKey ||
        e.ctrlKey ||
        e.shiftKey ||
        (e.key !== "[" && e.key !== "]")
      )
        return;
      e.preventDefault();
      if (sheetOpen()) return;
      if (e.key === "[") router.back();
      else router.forward();
    };
    // the side buttons: Chromium gives them as buttons 3 and 4; mousedown's default would select or scroll
    const side = (e: MouseEvent) => e.button === 3 || e.button === 4;
    const onDown = (e: MouseEvent) => {
      if (side(e)) e.preventDefault();
    };
    const onUp = (e: MouseEvent) => {
      if (!side(e)) return;
      e.preventDefault();
      if (sheetOpen()) return;
      if (e.button === 3) router.back();
      else router.forward();
    };
    window.addEventListener("keydown", onEsc);
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", onEsc);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
    };
  }, [router]);
}
