// The office's camera moves (Gabriel after trying it: pinch to zoom, two fingers or one to move):
// a Cam is how far the view is zoomed into the fitted office and where its centre is, as fractions
// of the fit (render/camera.ts fitSite), so a resize or a new agent keeps the same part in view.
// At 1x the view is the fit: the whole office, never cropped. Zoom stays in [1, MAX_ZOOM] and the
// view never leaves the fit's rectangle. Office.tsx turns the wheel and the drags into these; the
// renderer applies one with render/camera.ts viewFit. Pure, no three. Owner: bims-follow.

/** The view: zoom (1 = the fit) and its centre, fractions of the fit's width and height (0.5, 0.5 at the fit). */
export interface Cam {
  readonly zoom: number;
  readonly u: number;
  readonly v: number;
}

export const FIT: Cam = { zoom: 1, u: 0.5, v: 0.5 };
/** his pinch's closest, past the follow camera's (focus.ts FOLLOW_ZOOM) */
export const MAX_ZOOM = 6;
/** a drag shorter than this (css px) is still a click */
export const DRAG_PX = 4;
/** how much one wheel pixel of a pinch zooms (Chromium sends a trackpad pinch as a ctrl wheel) */
const PINCH_RATE = 0.01;

/** Whether the view is the fit (nothing to go back to). */
export function atFit(c: Cam): boolean {
  return c.zoom <= 1 + 1e-6;
}

const within = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));

/** A view held inside the fit: zoom in [1, MAX_ZOOM], its rectangle inside the fit's. */
export function clampCam(c: Cam): Cam {
  const zoom = within(Number.isFinite(c.zoom) ? c.zoom : 1, 1, MAX_ZOOM);
  const half = 0.5 / zoom;
  return { zoom, u: within(c.u, half, 1 - half), v: within(c.v, half, 1 - half) };
}

/** Zoom by `factor` keeping the point under (x, y) (css px in a w × h office) where it is. */
export function zoomAt(c: Cam, factor: number, x: number, y: number, w: number, h: number): Cam {
  if (w <= 0 || h <= 0) return c;
  const zoom = within(c.zoom * factor, 1, MAX_ZOOM);
  const fx = x / w - 0.5;
  const fy = y / h - 0.5;
  // the fit's point under the pointer, before and after: the same
  const pu = c.u + fx / c.zoom;
  const pv = c.v + fy / c.zoom;
  return clampCam({ zoom, u: pu - fx / zoom, v: pv - fy / zoom });
}

/** A pinch's wheel delta as a zoom factor: fingers apart (deltaY < 0) zoom in. */
export function pinchFactor(deltaY: number): number {
  return Math.exp(-deltaY * PINCH_RATE);
}

/** Move the view so the office follows the fingers by (dx, dy) css px. */
export function panBy(c: Cam, dx: number, dy: number, w: number, h: number): Cam {
  if (w <= 0 || h <= 0) return c;
  return clampCam({ zoom: c.zoom, u: c.u - dx / (w * c.zoom), v: c.v - dy / (h * c.zoom) });
}

/** A wheel as Chromium sends it: a trackpad pinch is a wheel with ctrl, two fingers a plain one. */
export interface Wheel {
  readonly dx: number;
  readonly dy: number;
  /** WheelEvent.deltaMode: 0 px, 1 lines, 2 pages */
  readonly mode: number;
  readonly ctrl: boolean;
}

/**
 * What a wheel does to the view at (x, y) of a w × h box (css px; `page`: a page's height): a pinch
 * zooms around the pointer, two fingers move the view while zoomed; null at the fit (nothing to
 * move: the bar scrolls). The office and the town move their cameras with it. Pure.
 */
export function wheelCam(c: Cam, e: Wheel, x: number, y: number, w: number, h: number, page: number): Cam | null {
  const k = e.mode === 1 ? 16 : e.mode === 2 ? page : 1;
  if (e.ctrl) return zoomAt(c, pinchFactor(e.dy * k), x, y, w, h);
  if (atFit(c)) return null;
  return panBy(c, -e.dx * k, -e.dy * k, w, h);
}

export function sameCam(a: Cam, b: Cam): boolean {
  return Math.abs(a.zoom - b.zoom) < 1e-9 && Math.abs(a.u - b.u) < 1e-9 && Math.abs(a.v - b.v) < 1e-9;
}
