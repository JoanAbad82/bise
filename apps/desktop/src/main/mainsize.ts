// The main window's size and place (ambient m_11427, lead m_11455; his try's item 1:
// ambient-lead m_21496, the designer's values m_21506). Pure; windows.ts reads the
// screens and the frames file and writes it back.
// Narrowest: 680 px = the sidebar (264) + one 380 px column + margins, the
// sidebar never folds, so a narrow window never leaves a column where nothing
// fits. Electron keeps every frame at or above it (a drag, setBounds).
// First open: 1280 x 720, centred in the work area of the screen the pointer is
// on, clamped to that work area minus MARGIN each side. Then the window opens
// where he left it: its last frame on each screen is kept (Frames, per display
// id); it opens on the pointer's screen's frame, else his last one. A frame off
// every screen now (its display gone) is centred again at its saved size,
// clamped like the first one: never a window off-screen.

import type { DisplayBox, Rect } from './place';

export const MAIN_SIZE = { width: 1280, height: 720, minWidth: 680 } as const;

/** The room kept free around a centred window, each side of the work area. */
export const MARGIN = 24;

/** How much of a kept frame's top must be on a work area to open there (enough to grab and drag). */
export const GRIP = { width: 120, height: 20 } as const;

/** A display, as windows.ts reads it from Electron's screen (its id as a string). */
export interface Screen extends DisplayBox {
  readonly id: string;
}

/** The kept frames: his last one per display id, and the display of the last one he left. */
export interface Frames {
  readonly last: string | null;
  readonly frames: Readonly<Record<string, Rect>>;
}

export const NO_FRAMES: Frames = { last: null, frames: {} };

const MAX_SCREENS = 16;

/** A size inside the work area minus MARGIN each side; never under the narrowest the work area allows. */
function fitSize(size: { width: number; height: number }, wa: Rect): { width: number; height: number } {
  const width = Math.max(Math.min(size.width, wa.width - 2 * MARGIN), Math.min(MAIN_SIZE.minWidth, wa.width));
  const height = Math.max(Math.min(size.height, wa.height - 2 * MARGIN), Math.min(200, wa.height));
  return { width: Math.round(width), height: Math.round(height) };
}

/** `size` centred in the screen's work area, clamped to it minus MARGIN each side. */
export function centred(size: { width: number; height: number }, d: DisplayBox): Rect {
  const wa = d.workArea;
  const s = fitSize(size, wa);
  return { x: Math.round(wa.x + (wa.width - s.width) / 2), y: Math.round(wa.y + (wa.height - s.height) / 2), ...s };
}

/** The overlap of two rects, as width x height (0 when apart). */
function overlap(a: Rect, b: Rect): { width: number; height: number } {
  const width = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const height = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return { width: Math.max(0, width), height: Math.max(0, height) };
}

/** The screen that holds a GRIP of the frame's top (its title room), or null: off every screen. */
export function screenOf(f: Rect, screens: readonly Screen[]): Screen | null {
  const top = { x: f.x, y: f.y, width: f.width, height: Math.min(GRIP.height, f.height) };
  for (const s of screens) {
    const o = overlap(top, s.workArea);
    if (o.width >= Math.min(GRIP.width, f.width) && o.height >= top.height) return s;
  }
  return null;
}

/**
 * Where the main window opens: the pointer's screen's kept frame, else his last
 * one, where he left it (never larger than its screen's work area); a kept frame
 * off every screen, centred on the pointer's screen at its size; none kept,
 * MAIN_SIZE centred there.
 */
export function openFrame(kept: Frames, screens: readonly Screen[], pointer: Screen): Rect {
  const f = kept.frames[pointer.id] ?? (kept.last === null ? undefined : kept.frames[kept.last]);
  if (f === undefined) return centred(MAIN_SIZE, pointer);
  const on = screenOf(f, screens);
  if (on === null) return centred(f, pointer);
  const wa = on.workArea;
  return { x: f.x, y: f.y, width: Math.min(f.width, wa.width), height: Math.min(f.height, wa.height) };
}

/** The frames with `f` kept as his last one, on the display `screenId`. */
export function keepFrame(kept: Frames, screenId: string, f: Rect): Frames {
  const rest = Object.entries(kept.frames).filter(([id]) => id !== screenId);
  const frames = Object.fromEntries([...rest.slice(-(MAX_SCREENS - 1)), [screenId, rectOf(f)]]) as Record<string, Rect>;
  return { last: screenId, frames };
}

function rectOf(r: Rect): Rect {
  return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
}

function isRect(v: unknown): v is Rect {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  const fin = (k: string): boolean => typeof r[k] === 'number' && Number.isFinite(r[k]);
  return fin('x') && fin('y') && fin('width') && fin('height') && (r['width'] as number) > 0 && (r['height'] as number) > 0;
}

/** The frames file's text, read: anything unreadable or malformed is no frame (the first-open size). */
export function parseFrames(text: string | null): Frames {
  if (text === null) return NO_FRAMES;
  let v: unknown;
  try {
    v = JSON.parse(text);
  } catch {
    return NO_FRAMES;
  }
  if (typeof v !== 'object' || v === null) return NO_FRAMES;
  const o = v as Record<string, unknown>;
  const raw = typeof o['frames'] === 'object' && o['frames'] !== null ? (o['frames'] as Record<string, unknown>) : {};
  const frames = Object.fromEntries(Object.entries(raw).filter(([, r]) => isRect(r)).map(([id, r]) => [id, rectOf(r as Rect)]));
  const last = typeof o['last'] === 'string' && o['last'] in frames ? o['last'] : null;
  return { last, frames };
}

/** The frames file's text. */
export function framesText(kept: Frames): string {
  return JSON.stringify({ v: 1, last: kept.last, frames: kept.frames });
}
