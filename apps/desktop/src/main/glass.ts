// The glass of bise's windows (desktop-ds 'glass'; qa-native's VM pass
// 442f748a: the capsule showed nothing of what is under it). CSS can't do it:
// backdrop-filter only blurs the page's own content, and a transparent
// window's page has nothing under it. macOS can: an NSVisualEffectView under
// the page (Electron's `vibrancy`), with a clear window background so the
// page's transparent parts show it.
//
// The vibrancy fills the whole window, so the capsule window is the glass
// itself: its page has no margin around the glass (amb-web), macOS draws its
// shadow and its rounded corners (a frameless window's). 'active': the panel
// never makes bise the active app, and a vibrancy that follows the window
// would stay grey there. 'menu' (NSVisualEffectMaterialMenu), what macOS's own
// menu-bar panels use (menubar-contrast): his Sound panel and ours on the same
// pink wallpaper read ~0.55 x the wallpaper there, ~0.45 x + grey with
// 'popover', a lighter, greyer glass the words washed into.
//
// Pure: windows.ts and capsule.ts spread it into their options. Test mode
// renders offscreen and is never shown: no glass there (nothing to see, and
// nothing native that could reach his screen).
import type { BrowserWindowConstructorOptions } from 'electron';
import type { Surface } from '../shared/api';

export type GlassOptions = Pick<
  BrowserWindowConstructorOptions,
  'vibrancy' | 'visualEffectState' | 'backgroundColor' | 'transparent' | 'hasShadow' | 'roundedCorners'
>;

const CLEAR = '#00000000';

export function glassOf(surface: Surface, platform: string, testMode: boolean): GlassOptions {
  if (platform !== 'darwin' || testMode) return {};
  if (surface === 'capsule') {
    return { vibrancy: 'menu', visualEffectState: 'active', backgroundColor: CLEAR, transparent: false, hasShadow: true, roundedCorners: true };
  }
  return { vibrancy: 'under-window', visualEffectState: 'followWindow', backgroundColor: CLEAR };
}
