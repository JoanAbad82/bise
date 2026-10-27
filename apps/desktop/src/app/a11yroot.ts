// macOS's accessibility settings on the page's root (bise fait mac, plan native-mac-plan §2): main
// reads them (main/a11y.ts) and tells every change (window.bise.a11y / onA11y); the shell puts them
// on <html> as data-reduce-transparency, data-reduce-motion and data-increase-contrast, which
// ds/tokens.css's fallbacks read (no glass, no animation, stronger rules). And data-no-vibrancy
// where no NSVisualEffectView sits under the page (the test harness's offscreen windows, a non-Mac):
// there the frame paints its own opaque ground (app.css), never Electron's white. The last reading
// is kept for what acts on it (useA11y: the sidebar's spring-loading). Owner: nm-frame.
import { useEffect, useSyncExternalStore } from 'react';
import type { A11y } from '@/shared/api';
import { SPRING_DEFAULT_MS } from '@/shared/springing';

/** The <html> attributes for a reading: each one set ('') or absent (null). Pure. */
export function a11yAttrs(a: A11y): Record<'data-reduce-transparency' | 'data-reduce-motion' | 'data-increase-contrast', '' | null> {
  return {
    'data-reduce-transparency': a.reduceTransparency ? '' : null,
    'data-reduce-motion': a.reduceMotion ? '' : null,
    'data-increase-contrast': a.increaseContrast ? '' : null,
  };
}

function put(root: HTMLElement, a: A11y): void {
  for (const [k, v] of Object.entries(a11yAttrs(a))) {
    if (v === null) root.removeAttribute(k);
    else root.setAttribute(k, v);
  }
}

// the last reading, for what acts on it (the sidebar's spring-loading, app/spring.ts); macOS's own
// defaults until main answers, and outside Electron
let reading: A11y = { reduceTransparency: false, reduceMotion: false, increaseContrast: false, springing: { on: true, delayMs: SPRING_DEFAULT_MS } };
const readers = new Set<() => void>();
function keep(a: A11y): void {
  reading = a;
  for (const l of [...readers]) l();
}

/** macOS's settings now (the shell's last reading). */
export function useA11y(): A11y {
  return useSyncExternalStore(
    (l) => {
      readers.add(l);
      return () => readers.delete(l);
    },
    () => reading,
  );
}

/** Keeps <html>'s flags on macOS's settings, now and on each change (nothing outside Electron). */
export function useA11yRoot(): void {
  useEffect(() => {
    const api = (window as Partial<Window>).bise;
    if (api?.a11y === undefined) return undefined;
    const root = document.documentElement;
    let live = true;
    void api.a11y().then((a) => {
      if (!live) return;
      put(root, a);
      keep(a);
    });
    const off = api.onA11y((a) => {
      put(root, a);
      keep(a);
    });
    return () => {
      live = false;
      off();
    };
  }, []);
}

/** No vibrancy under the page: the harness's offscreen window (glass.ts gives it none) or a non-Mac. Pure. */
export const noVibrancy = (test: boolean, userAgent: string): boolean => test || !/Macintosh/.test(userAgent);

/** Marks <html data-no-vibrancy> where nothing native shows through the frame. */
export function useGroundRoot(): void {
  useEffect(() => {
    const api = (window as Partial<Window>).bise;
    const root = document.documentElement;
    if (noVibrancy(api?.test === true, navigator.userAgent)) root.setAttribute('data-no-vibrancy', '');
    else root.removeAttribute('data-no-vibrancy');
  }, []);
}
