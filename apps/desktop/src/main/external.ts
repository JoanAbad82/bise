// What window.bise.openExternal may open in his browser or mail app: http,
// https and mailto only (a page link must never run a file:, javascript: or
// an app's custom scheme). Pure; index.ts calls shell.openExternal with it.

const ALLOWED = new Set(['http:', 'https:', 'mailto:']);

/** The URL to open, normalized, or null when it isn't allowed. */
export function externalUrl(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.length > 8192) return null;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (!ALLOWED.has(u.protocol)) return null;
  if (u.protocol !== 'mailto:' && u.hostname === '') return null;
  return u.toString();
}
