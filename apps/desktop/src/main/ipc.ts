// Main's side of window.bise (src/shared/api.ts, built by preload.ts): the
// links he opens, the clipboard, the menu's own keys. In test mode nothing
// leaves the app: a link and a copy become stdout lines the harness reads
// (EXTERNAL_LINE, COPY_LINE), never his browser or his clipboard.
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, extname, isAbsolute } from 'node:path';
import { app, BrowserWindow, clipboard, dialog, ipcMain, session, shell, type OpenDialogOptions } from 'electron';
import { COPY_LINE, EXTERNAL_LINE, IPC, MIC_SETTINGS_URL, OPEN_PATH_LINE, QUICKLOOK_LINE, REVEAL_LINE, TEST_CLIP_FILE_ENV, TEST_CLIP_HOOK, TEST_CLIP_TEXT_ENV, TEST_PICK_FOLDER_ENV, type MenuAction } from '../shared/api';
import { cleanLine, cleanPath, openPlan } from './openpath';
import type { ClipFile, ClipOp, ClipSeed } from './clipfence';
import { menuTarget } from './menu';
import { externalUrl } from './external';
import { noAsks, offscreenGrants } from './offscreen';
import { imageDir, saveImage } from './images';
import { pickedInTest } from './pick';
import { allowedPath } from './reveal';

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

/** Test mode: a file's bytes for a seed (unreadable: null, said on stderr). */
function readSeedFile(what: string, p: string | undefined): Buffer | null {
  if (p === undefined || p === '') return null;
  try {
    return readFileSync(p);
  } catch (e) {
    process.stderr.write(`clip seed: can't read ${what}=${p}: ${String(e)}\n`);
    return null;
  }
}

/** A seed's file item from its path and bytes: its name and its type from the extension (an image is image/png...). */
export function clipFileOf(path: string, bytes: Uint8Array): ClipFile {
  return { name: basename(path), type: MIME[extname(path).toLowerCase()] ?? 'application/octet-stream', bytes };
}

/** Test mode: the clipboard's seed from the env's files (unreadable: left out, said on stderr). */
function clipSeed(): ClipSeed {
  const text = readSeedFile(TEST_CLIP_TEXT_ENV, process.env[TEST_CLIP_TEXT_ENV])?.toString('utf8');
  const path = process.env[TEST_CLIP_FILE_ENV] ?? '';
  const bytes = readSeedFile(TEST_CLIP_FILE_ENV, path);
  const files: ClipFile[] = bytes === null ? [] : [clipFileOf(path, new Uint8Array(bytes))];
  return { ...(text === undefined ? {} : { text }), files };
}

let clipNonce = 0;

/**
 * Test mode: TEST_CLIP_HOOK's seed ({file?: absolute path, text?}) put on every window's private
 * clipboard at once (lead m_12801: a check stages an image for a real ⌘V while the app runs).
 * False when nothing usable was given or the file can't be read.
 */
async function setClip(raw: unknown): Promise<boolean> {
  const o = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const text = typeof o['text'] === 'string' ? o['text'] : undefined;
  const path = typeof o['file'] === 'string' && isAbsolute(o['file']) ? o['file'] : undefined;
  const bytes = path === undefined ? null : readSeedFile('file', path);
  if (path !== undefined && bytes === null) return false;
  const files = path === undefined || bytes === null ? [] : [clipFileOf(path, new Uint8Array(bytes))];
  if (text === undefined && files.length === 0) return false;
  const seed: ClipSeed = { ...(text === undefined ? {} : { text }), files };
  const wins = BrowserWindow.getAllWindows().filter((w) => !w.isDestroyed());
  const nonce = ++clipNonce;
  // every window answers after its fence has the seed (the IPC is async: a ⌘V right after
  // the hook would otherwise paste the old buffer)
  const done = new Promise<boolean>((resolve) => {
    let left = wins.length;
    const on = (_e: unknown, n: unknown): void => {
      if (n !== nonce) return;
      left -= 1;
      if (left <= 0) finish(true);
    };
    const timer = setTimeout(() => {
      finish(false);
    }, 2000);
    const finish = (ok: boolean): void => {
      clearTimeout(timer);
      ipcMain.removeListener(IPC.clipSetDone, on);
      resolve(ok);
    };
    ipcMain.on(IPC.clipSetDone, on);
    if (left === 0) finish(true);
  });
  for (const w of wins) w.webContents.send(IPC.clipSet, seed, nonce);
  return done;
}

export function installIpc(testMode: boolean): void {
  if (testMode) {
    ipcMain.handle(IPC.clipSeed, () => clipSeed());
    (globalThis as unknown as Record<string, unknown>)[TEST_CLIP_HOOK] = setClip;
    // test mode: navigator.clipboard can never read or write his clipboard
    const s = session.defaultSession;
    s.setPermissionCheckHandler((_wc, permission) => !CLIPBOARD_PERMS.has(permission));
    s.setPermissionRequestHandler((_wc, permission, done) => {
      done(!CLIPBOARD_PERMS.has(permission));
    });
  }
  // an off-screen run: a page's permission (mic, camera, screen, notifications...) is denied before
  // macOS can ask him; only the clipboard passes (offscreen.ts)
  if (noAsks(process.env, testMode)) {
    const s = session.defaultSession;
    s.setPermissionCheckHandler((_wc, permission) => offscreenGrants(permission));
    s.setPermissionRequestHandler((_wc, permission, done) => {
      done(offscreenGrants(permission));
    });
  }
  ipcMain.handle(IPC.openExternal, (_e, raw: unknown): Promise<boolean> => openLink(raw, testMode));
  // voice mode's failed line: System Settings › Privacy › Microphone, the one settings URL a window may open
  ipcMain.on(IPC.micSettings, () => {
    if (testMode) {
      process.stdout.write(`${EXTERNAL_LINE} ${MIC_SETTINGS_URL}
`);
      return;
    }
    void shell.openExternal(MIC_SETTINGS_URL);
  });
  ipcMain.handle(IPC.openPath, (_e, raw: unknown, opts: unknown): Promise<boolean> => openFile(raw, opts, testMode));
  ipcMain.handle(IPC.quickLook, (e, raw: unknown): boolean => quickLook(BrowserWindow.fromWebContents(e.sender), raw, testMode));
  ipcMain.handle(IPC.showInFinder, (_e, raw: unknown): boolean => showInFinder(raw, testMode));
  // a window's full screen now (window.bise.onFullScreen's first call)
  ipcMain.handle(IPC.fullScreen, (e): boolean => BrowserWindow.fromWebContents(e.sender)?.isFullScreen() ?? false);
  ipcMain.handle(IPC.pickFolder, (e): Promise<string | null> => pickFolder(BrowserWindow.fromWebContents(e.sender), testMode));
  // R41: a pasted or dropped image into the TUI's image store (the test home's under test)
  ipcMain.handle(IPC.saveImage, (_e, bytes: unknown): string | null => saveImage(imageDir(process.env), bytes));
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

/**
 * A file or folder of an answer in his editor at its line, else in Finder
 * (openpath.ts); refused when not absolute or missing. In test mode only
 * OPEN_PATH_LINE on stdout (the plan as if his machine had no editor
 * installed: the harness's machine says nothing about his).
 */
export async function openFile(raw: unknown, opts: unknown, testMode: boolean): Promise<boolean> {
  const path = cleanPath(raw);
  if (path === null || !existsSync(path)) return false;
  const line = cleanLine(opts);
  if (testMode) {
    const plan = openPlan(path, line, process.env, () => false);
    process.stdout.write(`${OPEN_PATH_LINE} ${JSON.stringify({ ...plan, ...(line === undefined ? {} : { line }) })}
`);
    return true;
  }
  const plan = openPlan(path, line, process.env, (scheme) => app.getApplicationNameForProtocol(`${scheme}://`) !== '');
  if (plan.how === 'editor') await shell.openExternal(plan.url);
  else shell.showItemInFolder(plan.path);
  return true;
}

/** His home and project folders: where quickLook and showInFinder may look (reveal.ts). */
let roots: readonly string[] = [];
/** The core's projects rows changed (index.ts). */
export function setProjectRoots(paths: readonly string[]): void {
  roots = paths;
}
const lookable = (raw: unknown): string | null => {
  const p = allowedPath(raw, [homedir(), ...roots]);
  return p !== null && existsSync(p) ? p : null;
};

/** window.bise.quickLook: macOS's Quick Look panel of `win` on the file; test mode a stdout line. */
export function quickLook(win: BrowserWindow | null, raw: unknown, testMode: boolean): boolean {
  const p = lookable(raw);
  if (p === null) return false;
  if (testMode) {
    process.stdout.write(`${QUICKLOOK_LINE} ${p}\n`);
    return true;
  }
  if (win === null || process.platform !== 'darwin') return false;
  win.previewFile(p);
  return true;
}

/** window.bise.showInFinder: the file selected in a Finder window; test mode a stdout line. */
export function showInFinder(raw: unknown, testMode: boolean): boolean {
  const p = lookable(raw);
  if (p === null) return false;
  if (testMode) {
    process.stdout.write(`${REVEAL_LINE} ${p}\n`);
    return true;
  }
  shell.showItemInFolder(p);
  return true;
}

/**
 * His folder pick (window.bise.pickFolder): macOS's open panel for folders,
 * attached to `win`, starting in his home; null on cancel. Test mode: the
 * env's absolute TEST_PICK_FOLDER_ENV at once, else null, never a panel.
 */
export async function pickFolder(win: BrowserWindow | null, testMode: boolean): Promise<string | null> {
  if (testMode) return pickedInTest(process.env[TEST_PICK_FOLDER_ENV]);
  const opts: OpenDialogOptions = { properties: ['openDirectory', 'createDirectory'], defaultPath: homedir() };
  const r = win === null ? await dialog.showOpenDialog(opts) : await dialog.showOpenDialog(win, opts);
  return r.canceled ? null : (r.filePaths[0] ?? null);
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
