// The trackpad's two-finger swipe back and forward (designer's desktop-history: the macOS « page
// précédente » gesture does what ‹ and › do). Owner: amb-web.
//
// Read from the wheel events the renderer already gets, no native hook: a horizontal two-finger
// swipe comes as a stream of wheel events with deltaX (fingers to the right: deltaX < 0, back).
// One stream is one gesture: a pause longer than GAP_MS starts the next. The first move with
// some length picks the gesture's axis: mostly vertical, it is a scroll and never a swipe; over
// something that scrolls sideways that way (a diff, a wide table, a code block), it is that
// scroll. A horizontal gesture walks once past THRESHOLD_PX, then swallows the rest of its stream
// (the inertia after the fingers lift). A pinch (ctrl) or a shift+wheel never walks. Pure.

export type Walk = 'back' | 'forward';

export interface SwipeState {
  /** this gesture's sideways distance so far */
  readonly dx: number;
  /** its last event's time (ms) */
  readonly last: number;
  /** what it turned out to be: undefined until it moved enough to tell */
  readonly axis: 'x' | 'y' | 'inner' | undefined;
  /** it walked already: the rest of its stream is swallowed */
  readonly fired: boolean;
}

export interface WheelIn {
  readonly dx: number;
  readonly dy: number;
  /** event time, ms */
  readonly t: number;
  readonly ctrl: boolean;
  readonly shift: boolean;
  /** what is under the pointer scrolls sideways in this event's direction */
  readonly innerX: boolean;
}

/** A pause longer than this ends a gesture. */
export const GAP_MS = 220;
/** The sideways distance that walks. */
export const THRESHOLD_PX = 140;
/** The length a first move needs before it picks the axis. */
const AXIS_PX = 4;

export const START: SwipeState = { dx: 0, last: Number.NEGATIVE_INFINITY, axis: undefined, fired: false };

/** One wheel event into the gesture: the next state and a walk when it crosses the line. */
export function swipeStep(s: SwipeState, e: WheelIn): { state: SwipeState; walk: Walk | null } {
  const fresh = e.t - s.last > GAP_MS;
  const cur: SwipeState = fresh ? { ...START, last: e.t } : { ...s, last: e.t };
  if (cur.fired) return { state: cur, walk: null };
  let axis = cur.axis;
  if (axis === undefined) {
    if (e.ctrl || e.shift) axis = 'y';
    else if (Math.abs(e.dx) + Math.abs(e.dy) >= AXIS_PX) axis = Math.abs(e.dx) > Math.abs(e.dy) ? (e.innerX ? 'inner' : 'x') : 'y';
  }
  if (axis !== 'x') return { state: { ...cur, axis }, walk: null };
  const dx = cur.dx + e.dx;
  if (Math.abs(dx) < THRESHOLD_PX) return { state: { ...cur, axis, dx }, walk: null };
  return { state: { ...cur, axis, dx, fired: true }, walk: dx < 0 ? 'back' : 'forward' };
}

/** `el` or one of its parents scrolls sideways towards `dx` (left for dx < 0). */
export function scrollsX(el: Element | null, dx: number): boolean {
  for (let n = el; n !== null && n !== document.documentElement; n = n.parentElement) {
    if (!(n instanceof HTMLElement) || n.scrollWidth <= n.clientWidth + 1) continue;
    const o = getComputedStyle(n).overflowX;
    if (o !== 'auto' && o !== 'scroll') continue;
    if (dx < 0 ? n.scrollLeft > 0 : n.scrollLeft < n.scrollWidth - n.clientWidth - 1) return true;
  }
  return false;
}
