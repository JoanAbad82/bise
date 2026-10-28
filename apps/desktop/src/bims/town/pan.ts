// The town's pan (his m_49446: the map looks endless, panning stops at a bound with iOS's
// rubber-band): the view moves over the town and ROOM past its fit on each side, at the fit too; past
// that bound a drag or two fingers meet a resistance (iOS's curve: the further, the harder) and the
// view springs back to the bound when he lets go (a critically damped spring, SPRING_S). Reduced
// motion: a plain line at the bound. Stateless: the view's own overshoot is the rubber's state, so a
// pan that starts mid-spring goes on from what is drawn. Pure, no three. Owner: bim-3d.
import { MAX_ZOOM, pinchFactor, type Cam, type Wheel } from '../zoom';

/** how far past its fit the view may go, a fraction of the fit's width (u) and height (v) */
export const ROOM = 0.25;
/** iOS's rubber-band constant (UIScrollView: x' = (1 - 1 / (x c / d + 1)) d) */
const RUBBER_C = 0.55;
/** the spring back: its rate (1/s) and its length (s), then it lands on the bound */
const SPRING_W = 14;
export const SPRING_S = 0.55;
/** two fingers lifted: no wheel for this long (ms) and the view springs back */
export const WHEEL_REST_MS = 120;

const within = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));

/** The bound of the view's centre at this zoom: the fit's rectangle and ROOM past it. Pure. */
export function boundOf(zoom: number): { readonly lo: number; readonly hi: number } {
  const half = 0.5 / zoom;
  return { lo: half - ROOM, hi: 1 - half + ROOM };
}

/** The view inside its bound (where the spring lands; reduced motion's every view). Pure. */
export function settle(c: Cam): Cam {
  const zoom = within(Number.isFinite(c.zoom) ? c.zoom : 1, 1, MAX_ZOOM);
  const { lo, hi } = boundOf(zoom);
  return { zoom, u: within(c.u, lo, hi), v: within(c.v, lo, hi) };
}

/** Whether the view is past its bound (a spring back to come). Pure. */
export function overshot(c: Cam): boolean {
  const s = settle(c);
  return Math.abs(s.u - c.u) > 1e-9 || Math.abs(s.v - c.v) > 1e-9;
}

/** iOS's rubber: `x` px pulled past the edge show as this many, never `d` (the view's size). Pure. */
export function rubber(x: number, d: number): number {
  return x <= 0 || d <= 0 ? 0 : (1 - 1 / ((x * RUBBER_C) / d + 1)) * d;
}

/** The pull that shows as `s` px past the edge (rubber's inverse). Pure. */
export function unrubber(s: number, d: number): number {
  if (s <= 0 || d <= 0) return 0;
  const k = Math.min(s, d * 0.999);
  return ((d / RUBBER_C) * k) / (d - k);
}

/** one axis of a pan: the centre `p` (fit fractions) moved by `dpx` css px in a view `size` px wide at `zoom` */
function axis(p: number, dpx: number, size: number, zoom: number, soft: boolean): number {
  const { lo, hi } = boundOf(zoom);
  const k = size * zoom;
  if (!soft) return within(p - dpx / k, lo, hi);
  // where his pull is, px: the bound and the pull that shows as the overshoot
  const raw = p > hi ? hi * k + unrubber((p - hi) * k, size) : p < lo ? lo * k - unrubber((lo - p) * k, size) : p * k;
  const next = raw - dpx;
  if (next > hi * k) return hi + rubber(next - hi * k, size) / k;
  if (next < lo * k) return lo - rubber(lo * k - next, size) / k;
  return next / k;
}

/** The view dragged by (dx, dy) css px in a w × h box: inside its bound as is, past it the rubber; `soft` false: a plain line. Pure. */
export function panTown(c: Cam, dx: number, dy: number, w: number, h: number, soft = true): Cam {
  if (w <= 0 || h <= 0) return c;
  return { zoom: c.zoom, u: axis(c.u, dx, w, c.zoom, soft), v: axis(c.v, dy, h, c.zoom, soft) };
}

/** A pinch around (x, y): the point under it stays, the zoom in [1, MAX_ZOOM], the view inside its bound. Pure. */
export function zoomTown(c: Cam, factor: number, x: number, y: number, w: number, h: number): Cam {
  if (w <= 0 || h <= 0) return c;
  const zoom = within(c.zoom * factor, 1, MAX_ZOOM);
  const fx = x / w - 0.5;
  const fy = y / h - 0.5;
  return settle({ zoom, u: c.u + fx / c.zoom - fx / zoom, v: c.v + fy / c.zoom - fy / zoom });
}

/** A wheel over the town: a pinch zooms, two fingers move it (at the fit too: the map goes on). Pure. */
export function townWheel(c: Cam, e: Wheel, x: number, y: number, w: number, h: number, page: number, soft = true): Cam {
  const k = e.mode === 1 ? 16 : e.mode === 2 ? page : 1;
  if (e.ctrl) return zoomTown(c, pinchFactor(e.dy * k), x, y, w, h);
  return panTown(c, -e.dx * k, -e.dy * k, w, h, soft);
}

/** The spring back `s` seconds after he let go, from `from` to its bound; null: landed. Pure. */
export function springAt(from: Cam, s: number): Cam | null {
  const to = settle(from);
  if (s >= SPRING_S) return null;
  const t = Math.max(0, s);
  const k = 1 - (1 + SPRING_W * t) * Math.exp(-SPRING_W * t);
  return { zoom: to.zoom, u: from.u + (to.u - from.u) * k, v: from.v + (to.v - from.v) * k };
}
