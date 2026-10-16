// When the office draws (architect m_27495: render on demand, battery): the pure rules Office.tsx's
// loop follows. A frame runs on a kick (a snapshot, a hover, ctrl held, a size or theme change, his
// message) and asks for the next one only while something moves: the renderer's Motion ('walk' at
// the display's rate, 'loop' at LOOP_FPS for the ambient loops, 'still' none), the timeline's walks,
// an event label's 3 s. Never while the window is away (hidden, or not in front outside the test
// harness, as App.tsx's useStill) or the WebGL context is lost. No three, no DOM. Owner: bims-wire.
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

/** The next frame: at the display's rate, after a LOOP_FPS tick, or none until a kick. */
export type Next = 'raf' | 'tick' | 'stop';

export interface After {
  /** what the renderer said of the frame it drew */
  readonly motion: Motion;
  /** timeline.moving(t) */
  readonly moving: boolean;
  /** the labels shown at that frame */
  readonly labels: ReadonlyMap<string, Label>;
  readonly away: boolean;
  readonly lost: boolean;
}

/** What follows a frame. An event label lives 3 s: a tick keeps its clock until it goes. Pure. */
export function nextAfter(a: After): Next {
  if (a.away || a.lost) return 'stop';
  if (a.motion === 'walk' || a.moving) return 'raf';
  if (a.motion === 'loop') return 'tick';
  for (const l of a.labels.values()) if (l.mode === 'event') return 'tick';
  return 'stop';
}

/** A tick's wait, ms. */
export const TICK_MS = Math.round(1000 / LOOP_FPS);

/** How long the pointer rests on a bim before its hover line shows: the app's tip delay. */
export const HOVER_MS = 400;

/** How often a still office looks again at its rows' clock (a long turn going 'hot', office life). */
export const CHECK_MS = 5000;
