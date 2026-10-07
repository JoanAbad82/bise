// The renderer's keep on disk (src/app/keep.ts; ambient-lead m_11756): one JSON file per surface
// in userData, read once at the page's start (sync, so the first frame already has his words) and
// written whole at each of the keep's writes (tmp + rename: a crash mid-write leaves the old one).
// Chromium's localStorage writes lazily and was lost by a quit right after a change (the update
// swap's relaunch), so the keep never relies on it. Owner: amb-win.
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ipcMain } from 'electron';
import { IPC } from '../shared/api';

/** The keep file of a surface ('window' | 'capsule'; anything else is 'window'). Pure. */
export function keepFile(dir: string, surface: unknown): string {
  return join(dir, `keep-${surface === 'capsule' ? 'capsule' : 'window'}.json`);
}

/** Its words, or null (none yet, unreadable). */
export function readKeep(file: string): string | null {
  try {
    return readFileSync(file, 'utf8');
  } catch {
    return null;
  }
}

/** Written whole, atomically; a write that fails keeps the old file. */
export function writeKeep(file: string, text: string): void {
  try {
    mkdirSync(join(file, '..'), { recursive: true });
    const tmp = `${file}.tmp`;
    writeFileSync(tmp, text, { mode: 0o600 });
    renameSync(tmp, file);
  } catch {
    // a full or read-only disk: the renderer still holds his words for this run
  }
}

/** Answers the preload's keep.read (sync) and keep.write, in `dir` (userData). */
export function installKeepIpc(dir: string): void {
  ipcMain.on(IPC.keepRead, (e, surface: unknown) => {
    e.returnValue = readKeep(keepFile(dir, surface));
  });
  ipcMain.on(IPC.keepWrite, (_e, surface: unknown, text: unknown) => {
    if (typeof text === 'string') writeKeep(keepFile(dir, surface), text);
  });
}
