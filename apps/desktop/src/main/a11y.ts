// src/main · macOS's accessibility settings that change how bise draws (window.bise.a11y; bise fait
// mac, plan native-mac-plan v4 §2): reduce transparency (no glass, no vibrancy, opaque grounds),
// reduce motion (no animation, the world doesn't grow), increase contrast (stronger rules and
// rings). Main reads them (systemPreferences) and sends each change to every window; the shell
// sets them on <html> for ds/tokens.css's fallbacks. The contract nm-ds set for the wave; nm-frame
// fills it. Owner: nm-frame.
import type { A11y } from '../shared/api';

/** The settings now. */
export function a11yNow(): A11y {
  // STUB(native-mac): nm-frame
  return { reduceTransparency: false, reduceMotion: false, increaseContrast: false };
}

/** Calls `listener` on every change of the settings; returns the unsubscribe. */
export const onA11yChange: (listener: (a: A11y) => void) => () => void = () => {
  // STUB(native-mac): nm-frame
  return () => undefined;
};
