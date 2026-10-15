// window.bise.saveCopy (art-save, his words: « faire une copy là où ça m'arrange avec le finder
// natif »): an artifact's file or folder, copied where he says in macOS's save panel. The panel
// opens named after the artifact's file, in the folder he last saved to this run (else
// Downloads); macOS's own panel asks before it replaces a file. Test mode never opens a panel:
// SAVE_COPY_LINE on stdout and TEST_SAVE_TO_ENV is his answer (the copy is real, in the test
// home). The fence (the path must be his home's or a project's) is the caller's (ipc.ts).
// The pure part (cleanName, startPath, savedTo) has its tests in savecopy.test.ts.
import { cp } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join } from 'node:path';
import type { BrowserWindow, SaveDialogOptions } from 'electron';
import type { SaveResult } from '../shared/api';

/** The name the panel opens with: `raw` as a plain file name, else the source's own. Pure. */
export function cleanName(raw: unknown, src: string): string {
  const own = basename(src.replace(/\/+$/u, ''));
  if (typeof raw !== 'string') return own;
  const name = basename(raw.replace(/\/+$/u, '').replace(/\0/gu, '')).trim();
  return name === '' || name === '.' || name === '..' ? own : name;
}

/** Where the panel opens: the folder he last saved to, else Downloads, with the name in it. Pure. */
export function startPath(last: string | null, downloads: string, name: string): string {
  return join(last ?? downloads, name);
}

/** Test mode's answer: the env's absolute path, else a cancel (null). Pure. */
export function savedTo(env: string | undefined): string | null {
  return env !== undefined && env !== '' && isAbsolute(env) ? env : null;
}

/** The folder of his last save this run: the next panel opens there. */
let lastFolder: string | null = null;

export interface SaveDeps {
  readonly testMode: boolean;
  /** test mode: TEST_SAVE_TO_ENV's value */
  readonly testTo: string | undefined;
  /** his Downloads folder (app.getPath('downloads')) */
  readonly downloads: () => string;
  /** the save panel, attached to the window (dialog.showSaveDialog) */
  readonly panel: (win: BrowserWindow | null, opts: SaveDialogOptions) => Promise<{ canceled: boolean; filePath?: string }>;
  /** test mode's record of the panel he would have seen */
  readonly line: (rec: { from: string; name: string; to: string | null }) => void;
}

/** `src` (already fenced) copied where he picks; see window.bise.saveCopy. */
export async function saveCopy(win: BrowserWindow | null, src: string, rawName: unknown, d: SaveDeps): Promise<SaveResult> {
  const name = cleanName(rawName, src);
  let to: string | null;
  if (d.testMode) {
    to = savedTo(d.testTo);
    d.line({ from: src, name, to });
  } else {
    const r = await d.panel(win, { defaultPath: startPath(lastFolder, d.downloads(), name), properties: ['createDirectory', 'showOverwriteConfirmation'] });
    to = r.canceled || r.filePath === undefined || r.filePath === '' ? null : r.filePath;
  }
  if (to === null) return null;
  try {
    await cp(src, to, { recursive: true, force: true });
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
  lastFolder = dirname(to);
  return { to };
}
