// His theme pref on the page's root (ambient-lead m_10785): prefs.theme 'dark' | 'light' | 'system'
// ('auto', the old app's word, is 'system'). The DS's tokens (src/ds/tokens.css) switch on
// <html data-theme="light"|"dark">, and with no attribute follow the system appearance (dark by
// default, light under prefers-color-scheme: light). So 'light' and 'dark' set the attribute and
// the root's color-scheme (scrollbars, native controls), 'system' (or no pref yet) removes both.
// Mounted once per surface: the window's shell and the capsule's root. Owner: amb-web.
import { useEffect } from 'react';
import type { JsonValue } from '@/proto';
import { usePrefs } from '@/store';
import { str } from '@/settings/prefs';

export type Theme = 'light' | 'dark';

/** The attribute his pref asks for: 'light' or 'dark', or null to follow the system. Pure. */
export function themeOf(prefs: JsonValue | null): Theme | null {
  const p = prefs !== null && typeof prefs === 'object' && !Array.isArray(prefs) ? prefs : null;
  const v = str(p, 'theme', 'system');
  return v === 'light' || v === 'dark' ? v : null;
}

/** Puts the theme on a root element (the page's <html>); null clears it. */
export function applyTheme(root: HTMLElement, theme: Theme | null): void {
  if (theme === null) {
    delete root.dataset.theme;
    root.style.removeProperty('color-scheme');
  } else {
    root.dataset.theme = theme;
    root.style.setProperty('color-scheme', theme);
  }
}

/** Keeps <html> on his theme pref, live: a change in settings applies at once. */
export function useTheme(): void {
  const theme = themeOf(usePrefs());
  useEffect(() => {
    applyTheme(document.documentElement, theme);
  }, [theme]);
}
