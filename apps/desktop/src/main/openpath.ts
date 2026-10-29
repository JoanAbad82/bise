// window.bise.openPath(path, {line?}): a file or folder named in an answer,
// opened in his editor at that line, else shown in Finder (amb-win's M4/B14;
// the old shell's open_in app:'editor', OpenIn.swift). Pure: the plan only;
// ipc.ts runs it with Electron's shell, never a shell string or a spawn.
//
// His editor: BISE_EDITOR, VISUAL, EDITOR (the TUI's order, file_links.rs)
// when it names a GUI editor that opens by URL; else the first of the known
// editors whose URL scheme macOS knows (it is installed); else none: Finder
// shows the item. A terminal editor (vim, hx...) has no window to open in:
// it is skipped, as an unknown one.

export interface OpenPathOpts {
  readonly line?: number;
}

/** An editor that opens `<scheme>://file<abs path>:<line>`. */
interface UrlEditor {
  readonly scheme: string;
  /** the command names that stand for it in $EDITOR */
  readonly names: readonly string[];
}

// most likely first (OpenIn.swift's order: Cursor, VS Code, Zed)
const EDITORS: readonly UrlEditor[] = [
  { scheme: 'cursor', names: ['cursor'] },
  { scheme: 'vscode', names: ['code'] },
  { scheme: 'zed', names: ['zed', 'zeditor'] },
  { scheme: 'windsurf', names: ['windsurf'] },
  { scheme: 'vscode-insiders', names: ['code-insiders'] },
  { scheme: 'vscodium', names: ['codium', 'vscodium'] },
];

export type OpenPlan =
  | { readonly how: 'editor'; readonly url: string; readonly path: string; readonly line?: number }
  | { readonly how: 'finder'; readonly path: string };

/** The absolute, normalized path, or null (relative, empty, a NUL, too long, not a string). */
export function cleanPath(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw === '' || raw.length > 4096 || raw.includes('\0') || !raw.startsWith('/')) return null;
  const out: string[] = [];
  for (const part of raw.split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') out.pop();
    else out.push(part);
  }
  return '/' + out.join('/');
}

/** A line ≥ 1, or undefined. */
export function cleanLine(opts: unknown): number | undefined {
  if (typeof opts !== 'object' || opts === null) return undefined;
  const l = (opts as Record<string, unknown>)['line'];
  return typeof l === 'number' && Number.isInteger(l) && l >= 1 && l < 10_000_000 ? l : undefined;
}

/** The editor $EDITOR names (its first word's base name), if bise opens it by URL. */
function fromEnv(env: Readonly<Record<string, string | undefined>>): UrlEditor | undefined {
  for (const k of ['BISE_EDITOR', 'VISUAL', 'EDITOR']) {
    const v = env[k]?.trim();
    if (v === undefined || v === '') continue;
    const first = v.split(/\s+/)[0] ?? '';
    const name = (first.split('/').pop() ?? '').toLowerCase();
    // the first one set is his choice: a terminal editor or an unknown one stops the search
    return EDITORS.find((e) => e.names.includes(name));
  }
  return undefined;
}

/**
 * How to open `path` (already clean): in his editor at `line` when there is
 * one (`installed(scheme)`: macOS has an app for that URL scheme), else Finder.
 * A folder opens in the editor too (a workspace), without a line.
 */
export function openPlan(path: string, line: number | undefined, env: Readonly<Record<string, string | undefined>>, installed: (scheme: string) => boolean): OpenPlan {
  const chosen = fromEnv(env);
  const ed = chosen !== undefined && installed(chosen.scheme) ? chosen : EDITORS.find((e) => installed(e.scheme));
  if (ed === undefined) return { how: 'finder', path };
  const enc = path.split('/').map(encodeURIComponent).join('/');
  return line === undefined ? { how: 'editor', url: `${ed.scheme}://file${enc}`, path } : { how: 'editor', url: `${ed.scheme}://file${enc}:${line}`, path, line };
}
