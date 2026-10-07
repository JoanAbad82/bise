// His theme pref for the native side (lead m_10834): amb-web's src/theme puts
// prefs.theme on the pages' <html data-theme>, but the glass (glass.ts's
// vibrancy), the window's frame and menus follow Electron's nativeTheme, which
// follows the system unless told. So 'light' on a dark Mac drew the light
// tokens over a dark glass. Pure: index.ts sets nativeTheme.themeSource to
// this at start ('system' until his prefs come) and on every prefs event.
// The same reading as the page's themeOf: 'light' and 'dark' pick it;
// 'system', the old app's 'auto', junk or no prefs follow the system.

export type ThemeSource = 'light' | 'dark' | 'system';

export function themeSourceOf(prefs: unknown): ThemeSource {
  if (typeof prefs !== 'object' || prefs === null || Array.isArray(prefs)) return 'system';
  const t = (prefs as Record<string, unknown>)['theme'];
  return t === 'light' || t === 'dark' ? t : 'system';
}
