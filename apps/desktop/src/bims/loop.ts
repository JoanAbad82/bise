// When the office draws (architect m_27495: render on demand, battery): the pure rules Office.tsx's
// loop follows. A frame runs on a kick (a snapshot, a hover, ctrl held, a size or theme change, his
// message) and asks for the next one only while something moves: the renderer's Motion, its frame
// wait in one table (FRAME_MS: 'walk' at the display's rate, 'skate' at 30 fps while a skater rides
// its line, 'loop' at LOOP_FPS for the ambient loops, 'still' none), the timeline's walks, an event
// label's 3 s, and one timer for a resting skater's next line (skate.ts wakeIn). Never while the
// window is away (hidden, or not in front outside the test harness, as App.tsx's useStill) or the
// WebGL context is lost. No three, no DOM. Owner: bims-wire.
import { LOOP_FPS, type Label, type Motion } from './model';

export interface Window_ {
  readonly hidden: boolean;
  readonly focused: boolean;
  /** the test harness never focuses its offscreen window: only hidden counts there */
  readonly test: boolean;
}

/** The window away: no frame at all until it comes back. Pure. */
export function away(w: Window_): boolean {
  return w.hidden || (!w.test && !w.focused);
}

/** A tick's wait, ms. */
export const TICK_MS = Math.round(1000 / LOOP_FPS);
/** a skater's line (skate.ts): 30 fps, never the display's rate (architect m_28726) */
export const SKATE_FPS = 30;

/**
 * Each motion's frame wait, the one table of the office's rates (architect m_28726): 0 the
 * display's rate (requestAnimationFrame), a wait in ms, null no next frame. The sleepers' z's are a
 * CSS loop (zzz.ts, 7.5 fps), never a WebGL frame.
 */
export const FRAME_MS: Readonly<Record<Motion, number | null>> = {
  walk: 0,
  skate: Math.round(1000 / SKATE_FPS),
  loop: TICK_MS,
  still: null,
};

/** The next frame: 0 at the display's rate, a wait in ms, or null: none until a kick. */
export type Next = number | null;

export interface After {
  /** what the renderer said of the frame it drew */
  readonly motion: Motion;
  /** timeline.moving(t) */
  readonly moving: boolean;
  /** the labels shown at that frame */
  readonly labels: ReadonlyMap<string, Label>;
  readonly away: boolean;
  readonly lost: boolean;
  /** s until a resting skater's next line (skate.ts wakeIn); null: none rests. Its rest draws nothing */
  readonly wake?: number | null;
}

/** What follows a frame. An event label lives 3 s: a tick keeps its clock until it goes. Pure. */
export function nextAfter(a: After): Next {
  if (a.away || a.lost) return null;
  if (a.moving) return FRAME_MS.walk;
  const ms = FRAME_MS[a.motion];
  if (ms !== null) return ms;
  for (const l of a.labels.values()) if (l.mode === 'event') return TICK_MS;
  if (a.wake != null) return Math.max(FRAME_MS.skate ?? 0, Math.ceil(a.wake * 1000));
  return null;
}

/** How long the pointer rests on a bim before its hover line shows: the app's tip delay. */
export const HOVER_MS = 400;

/** How often a still office looks again at its rows' clock (a long turn going 'hot', office life). */
export const CHECK_MS = 5000;
