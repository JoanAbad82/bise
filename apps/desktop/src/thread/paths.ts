// File paths in answers (tui-parity M4, B14; the TUI's file_links.rs): a
// path an agent writes in `code` is a link that opens the file in his
// editor (amb-mac's window.bise.openPath, a0b3ebce). Owner: amb-win. Pure.

export interface FilePath {
  readonly path: string;
  readonly line?: number;
}

// a relative path with a folder or an extension, or an absolute one; an
// optional :line(:col) after it; no spaces, no scheme (urls are links already)
const REL = /^(?:\.{1,2}\/)?[\w@+-][\w.@+-]*(?:\/[\w.@+-]+)*$/;
const ABS = /^\/[^\s:]+$/;

/** The file a piece of inline code names, if it names one. */
export function pathOf(text: string): FilePath | undefined {
  const t = text.trim();
  if (t === '' || /\s/.test(t) || t.includes('://')) return undefined;
  const m = /^(.*?)(?::(\d+))?(?::\d+)?$/.exec(t);
  const p = m?.[1] ?? t;
  const line = m?.[2] === undefined ? undefined : Number(m[2]);
  const named = ABS.test(p) || (REL.test(p) && (p.includes('/') || /\.[A-Za-z0-9]{1,8}$/.test(p)));
  // a version or a number is not a file (1.2.3, v2.0)
  if (!named || /^v?\d+(\.\d+)+$/.test(p)) return undefined;
  return line === undefined ? { path: p } : { path: p, line };
}

/** The absolute path: as is when absolute, else under `base` (the agent's folder). */
export function absolute(path: string, base: string): string {
  if (path.startsWith('/')) return path;
  const parts = base.replace(/\/+$/, '').split('/');
  for (const seg of path.split('/')) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') parts.pop();
    else parts.push(seg);
  }
  return parts.join('/') || '/';
}
