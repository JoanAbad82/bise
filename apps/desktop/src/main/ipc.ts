// Main's side of window.bise (src/shared/api.ts, built by preload.ts): the
// links he opens, the clipboard, the menu's own keys. In test mode nothing
// leaves the app: a link and a copy become stdout lines the harness reads
// (EXTERNAL_LINE, COPY_LINE), never his browser or his clipboard.
import { BrowserWindow, clipboard, ipcMain, session, shell } from 'electron';
import { COPY_LINE, EXTERNAL_LINE, IPC, type MenuAction } from '../shared/api';
import type { ClipOp } from './clipfence';
import { externalUrl } from './external';

// the page's async clipboard API (navigator.clipboard): its permissions
const CLIPBOARD_PERMS = new Set(['clipboard-read', 'clipboard-sanitized-write']);

const MAX_COPY = 1_000_000;

export function installIpc(testMode: boolean): void {
  if (testMode) {
    // test mode: navigator.clipboard can never read or write his clipboard
    const s = session.defaultSession;
    s.setPermissionCheckHandler((_wc, permission) => !CLIPBOARD_PERMS.has(permission));
    s.setPermissionRequestHandler((_wc, permission, done) => {
      done(!CLIPBOARD_PERMS.has(permission));
    });
  }
  ipcMain.handle(IPC.openExternal, async (_e, raw: unknown): Promise<boolean> => {
    const url = externalUrl(raw);
    if (url === null) return false;
    if (testMode) {
      process.stdout.write(`${EXTERNAL_LINE} ${url}\n`);
      return true;
    }
    await shell.openExternal(url);
    return true;
  });
  ipcMain.handle(IPC.copy, async (_e, text: unknown): Promise<void> => {
    if (typeof text !== 'string' || text.length > MAX_COPY) return;
    if (testMode) {
      process.stdout.write(`${COPY_LINE} ${JSON.stringify(text)}\n`);
      return;
    }
    await clipboard.writeText(text);
  });
}

/** Test mode: a clipboard item of the menu, played in the focused window's fence. */
export function sendClip(op: ClipOp): void {
  BrowserWindow.getFocusedWindow()?.webContents.send(IPC.clip, op);
}

/** A bise item of the menu: to the focused window's renderer (none focused: nobody). */
export function sendMenu(action: MenuAction): void {
  BrowserWindow.getFocusedWindow()?.webContents.send(IPC.menu, action);
}
