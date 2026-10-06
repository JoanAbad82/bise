// Main's side of window.bise (src/shared/api.ts, built by preload.ts): the
// links he opens, the clipboard, the menu's own keys. In test mode nothing
// leaves the app: a link and a copy become stdout lines the harness reads
// (EXTERNAL_LINE, COPY_LINE), never his browser or his clipboard.
import { readFileSync } from 'node:fs';
import { basename, extname } from 'node:path';
import { BrowserWindow, clipboard, ipcMain, session, shell } from 'electron';
import { COPY_LINE, EXTERNAL_LINE, IPC, TEST_CLIP_FILE_ENV, TEST_CLIP_TEXT_ENV, type MenuAction } from '../shared/api';
import type { ClipFile, ClipOp, ClipSeed } from './clipfence';
import { menuTarget } from './menu';
import { externalUrl } from './external';

// the page's async clipboard API (navigator.clipboard): its permissions
const CLIPBOARD_PERMS = new Set(['clipboard-read', 'clipboard-sanitized-write']);

const MAX_COPY = 1_000_000;

const MIME: Readonly<Record<string, string>> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
};

/** Test mode: the clipboard's seed from the env's files (unreadable: left out, said on stderr). */
function clipSeed(): ClipSeed {
  const read = (env: string): Buffer | null => {
    const p = process.env[env];
    if (p === undefined || p === '') return null;
    try {
      return readFileSync(p);
    } catch (e) {
      process.stderr.write(`clip seed: can't read ${env}=${p}: ${String(e)}\n`);
      return null;
    }
  };
  const text = read(TEST_CLIP_TEXT_ENV)?.toString('utf8');
  const bytes = read(TEST_CLIP_FILE_ENV);
  const path = process.env[TEST_CLIP_FILE_ENV] ?? '';
  const files: ClipFile[] =
    bytes === null ? [] : [{ name: basename(path), type: MIME[extname(path).toLowerCase()] ?? 'application/octet-stream', bytes: new Uint8Array(bytes) }];
  return { ...(text === undefined ? {} : { text }), files };
}

export function installIpc(testMode: boolean): void {
  if (testMode) {
    ipcMain.handle(IPC.clipSeed, () => clipSeed());
    // test mode: navigator.clipboard can never read or write his clipboard
    const s = session.defaultSession;
    s.setPermissionCheckHandler((_wc, permission) => !CLIPBOARD_PERMS.has(permission));
    s.setPermissionRequestHandler((_wc, permission, done) => {
      done(!CLIPBOARD_PERMS.has(permission));
    });
  }
  ipcMain.handle(IPC.openExternal, (_e, raw: unknown): Promise<boolean> => openLink(raw, testMode));
  ipcMain.handle(IPC.copy, async (_e, text: unknown): Promise<void> => {
    if (typeof text !== 'string' || text.length > MAX_COPY) return;
    if (testMode) {
      process.stdout.write(`${COPY_LINE} ${JSON.stringify(text)}\n`);
      return;
    }
    await clipboard.writeText(text);
  });
}

/**
 * A link out of the app: http, https or mailto in his browser or mail app
 * (externalUrl), refused otherwise; in test mode only EXTERNAL_LINE on stdout.
 * The one path for window.bise.openExternal and the guard's links.
 */
export async function openLink(raw: unknown, testMode: boolean): Promise<boolean> {
  const url = externalUrl(raw);
  if (url === null) return false;
  if (testMode) {
    process.stdout.write(`${EXTERNAL_LINE} ${url}\n`);
    return true;
  }
  await shell.openExternal(url);
  return true;
}

/** Test mode: a clipboard item of the menu, played in the focused window's fence. */
export function sendClip(op: ClipOp): void {
  BrowserWindow.getFocusedWindow()?.webContents.send(IPC.clip, op);
}

/** A bise item of the menu, sent where menuTarget says. */
export function sendMenu(action: MenuAction, main: { readonly window: BrowserWindow | null; open: (route?: string) => void }): void {
  const focused = BrowserWindow.getFocusedWindow();
  const t = menuTarget(action, focused !== null && focused === main.window);
  if ('open' in t) main.open(t.open);
  // nothing of bise's has the keys (his app does, or a test run): the main window's
  else (focused ?? main.window)?.webContents.send(IPC.menu, action);
}
