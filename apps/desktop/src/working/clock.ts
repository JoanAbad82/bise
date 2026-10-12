// The window's one clock for the working signs (designer's desktop-working page: every gust in
// phase, frame = elapsed / 110 on time, never per draw). One timer for the whole window, armed only
// while a sign is shown and the window moves; it wakes at the next moment a cell can change and
// tells the signs, which write their cells' text and tone themselves (nothing else re-renders).
//
// Still (no timer): prefers-reduced-motion, the window hidden or not in front (the test harness
// never focuses its offscreen window: there only hidden counts, as App.tsx's useStill), or a
// frame that came over 60 ms late (the TUI's slow draw: still for a second). He types: the
// composer calls `typed()` on a key; for 1.5 s the signs go calm or hush.
// Owner: amb-web.
import { type Motion, TYPING_MS, nextChange } from "./gust";

type Listener = (m: Motion) => void;

/** a frame this late holds the signs still for SLOW_HOLD_MS */
const SLOW_MS = 60;
const SLOW_HOLD_MS = 1000;

const listeners = new Set<Listener>();
const t0 = Date.now();
let typedAt = -Infinity;
let slowUntil = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
let wired = false;

const testMode = (): boolean => (window as Partial<Window>).bise?.test === true;
const reduced = (): boolean =>
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const away = (): boolean =>
  document.hidden || (!testMode() && !document.hasFocus());

/** The motion now. */
export function motionNow(): Motion {
  const now = Date.now();
  return {
    elapsed: now - t0,
    still: reduced() || away() || now < slowUntil,
    typing: now - typedAt < TYPING_MS,
  };
}

function tell(): void {
  const m = motionNow();
  const start = performance.now();
  for (const l of listeners) l(m);
  // the TUI's slow draw: writing the cells took over 60 ms, hold still for a second
  if (performance.now() - start > SLOW_MS) slowUntil = Date.now() + SLOW_HOLD_MS;
  arm(m);
}

function arm(m: Motion): void {
  if (timer !== undefined) clearTimeout(timer);
  timer = undefined;
  if (listeners.size === 0 || document.hidden || reduced() || away()) return;
  const now = Date.now();
  // still for a slow frame: wake when it ends; he types: wake when the calm ends too
  let wait = now < slowUntil ? slowUntil - now : nextChange(m.elapsed);
  if (m.typing) wait = Math.min(wait, Math.max(1, typedAt + TYPING_MS - now));
  // a late timer is a busy or throttled window, not a slow draw: the frame is read from the time
  timer = setTimeout(() => {
    timer = undefined;
    tell();
  }, wait);
}

function wire(): void {
  if (wired) return;
  wired = true;
  window.addEventListener("focus", tell);
  window.addEventListener("blur", tell);
  document.addEventListener("visibilitychange", tell);
  if (typeof window.matchMedia === "function")
    window
      .matchMedia("(prefers-reduced-motion: reduce)")
      .addEventListener("change", tell);
}

/** A sign shown: `l` gets the motion now and at every change; the result stops it. */
export function watchMotion(l: Listener): () => void {
  wire();
  listeners.add(l);
  const m = motionNow();
  l(m);
  arm(m);
  return () => {
    listeners.delete(l);
    if (listeners.size === 0 && timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  };
}

/** He pressed a key in the composer: the signs go calm (this agent) or hush (the others) for 1.5 s. */
export function typed(): void {
  const was = Date.now() - typedAt < TYPING_MS;
  typedAt = Date.now();
  if (!was && listeners.size > 0) tell();
}
