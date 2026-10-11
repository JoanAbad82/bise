// BISE_DESKTOP_OFFSCREEN=1 (ambient-lead m_18341): amb-tools' "as he does"
// runs, the real app on a real-shaped home, with every window kept off his
// screen. Placement only: every BrowserWindow is placed at -30000 (OFF) and
// never ordered in (show, showInactive and focus do nothing; a window that
// shows anyway is hidden at once), so no frame lands on any NSScreen and the
// app never activates; no Dock bounce (the app never asks for attention).
// Nothing else changes: not test mode (no offscreen rendering, no test hooks,
// his own paths and core), and the core's child env drops it with every
// BISE_DESKTOP_* variable (core/env.ts), so the core never sees it.
// Why never shown: a shown window at -30000 is clamped back onto a display
// (qa-type m_9500, measured with CGWindowList). Test mode has its own fence
// (guard.ts) and wins over this one.
import type { BrowserWindow } from 'electron';
import { OFF } from './place';

export const OFFSCREEN_ENV = 'BISE_DESKTOP_OFFSCREEN';

/** The knob is on: exactly '1', and never in test mode (its own fence, guard.ts). Pure. */
export function isOffscreen(env: Readonly<Record<string, string | undefined>>, testMode: boolean): boolean {
  return !testMode && env[OFFSCREEN_ENV] === '1';
}

/** A window's place at creation: off every display with the knob, else unchanged (the window's own). Pure. */
export function offscreenPlace(on: boolean): { x: number; y: number } | Record<string, never> {
  return on ? { x: OFF, y: OFF } : {};
}

/** The fence on one window: placed off every display, never ordered in, never focused. */
export function fenceOffscreen(win: BrowserWindow): void {
  win.setPosition(OFF, OFF);
  const no = (): void => undefined;
  win.show = no;
  win.showInactive = no;
  win.focus = no;
  win.on('show', () => {
    process.stderr.write('bise-desktop: offscreen: a window showed: hidden again\n');
    win.hide();
    win.setPosition(OFF, OFF);
  });
}

/**
 * The activation policy under the knob (amb-tools m_18713: a plain 'open' made the app the front one
 * for ~4 s): 'accessory' from the first line, so LaunchServices' launch never brings it in front and
 * it has no Dock icon; null otherwise (his app: a regular app). Pure.
 */
export function offscreenActivation(on: boolean, platform: string): 'accessory' | null {
  return on && platform === 'darwin' ? 'accessory' : null;
}
