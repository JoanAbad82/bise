// Sentence case for the words a settings row shows as chrome (a row title, a button) when they come
// lowercase from elsewhere: the core's role names and computer use's steps (shared with the
// terminal, which keeps them lowercase), the key list's actions (designer m_43052, m_43882). The
// brand stays as it is written: 'bise' never takes a capital. Pure. Owner: nm-settings.

/** `s` with its first letter up, unless it starts with the brand ('bise'). Pure. */
export function chromeCase(s: string): string {
  if (/^bise\b/u.test(s)) return s;
  const first = s.charAt(0);
  return first === '' ? s : first.toUpperCase() + s.slice(1);
}

/**
 * His home folder as the projects' paths say it: the shell's when his projects live under it, else
 * the folder that holds bise's home project (a world whose shell runs on another home: a test's
 * fixtures). None: paths stay whole. Pure.
 */
export function homeOf(given: string | undefined, paths: readonly string[], homeProject: string | undefined): string | undefined {
  if (given !== undefined && given !== '' && paths.some((p) => p.startsWith(`${given}/`))) return given;
  if (homeProject === undefined) return given;
  const cut = homeProject.lastIndexOf('/');
  return cut > 0 ? homeProject.slice(0, cut) : given;
}
