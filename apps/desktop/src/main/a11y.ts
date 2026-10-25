// src/main · macOS's accessibility settings that change how bise draws (window.bise.a11y; bise fait
// mac, plan native-mac-plan v4 §2): reduce transparency (no glass, no vibrancy, opaque grounds),
// reduce motion (no animation, the world doesn't grow), increase contrast (stronger rules and
// rings). Main reads them (nativeTheme, systemPreferences) and sends each change to every window
// (index.ts); the shell sets them on <html> for ds/tokens.css's fallbacks, and the main window
// drops its vibrancy for an opaque ground under reduce transparency (windows.ts, glass.ts).
// macOS tells nativeTheme's 'updated' for transparency and contrast; reduce motion has no event,
// so the settings are read again each time a bise window comes to the front (he changed them in
// System Settings, then came back). Test mode reads nothing: the defaults, never his Mac's.
// Owner: nm-frame.
import { app, nativeTheme, systemPreferences } from 'electron';
import type { A11y } from '../shared/api';

/** Nothing reduced: what a test run and a non-Mac see. */
export const A11Y_NONE: A11y = { reduceTransparency: false, reduceMotion: false, increaseContrast: false };

/** Two readings say the same. Pure. */
export const sameA11y = (a: A11y, b: A11y): boolean =>
  a.reduceTransparency === b.reduceTransparency && a.reduceMotion === b.reduceMotion && a.increaseContrast === b.increaseContrast;

let testMode = false;

/** Test mode: the defaults only (index.ts, at start). */
export function a11yTestMode(on: boolean): void {
  testMode = on;
}

/** The settings now. */
export function a11yNow(): A11y {
  if (testMode || process.platform !== 'darwin') return A11Y_NONE;
  return {
    reduceTransparency: nativeTheme.prefersReducedTransparency,
    reduceMotion: systemPreferences.getAnimationSettings().prefersReducedMotion,
    increaseContrast: nativeTheme.shouldUseHighContrastColors,
  };
}

/** Calls `listener` on every change of the settings; returns the unsubscribe. */
export const onA11yChange = (listener: (a: A11y) => void): (() => void) => {
  let last = a11yNow();
  const check = () => {
    const now = a11yNow();
    if (sameA11y(now, last)) return;
    last = now;
    listener(now);
  };
  nativeTheme.on('updated', check);
  app.on('browser-window-focus', check);
  return () => {
    nativeTheme.off('updated', check);
    app.off('browser-window-focus', check);
  };
};
