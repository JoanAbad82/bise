// Main's side of the core channel (window.bise.core, src/shared/api.ts):
// starts the one core child for the app, sends every event and state change
// to every window, writes the windows' commands to it. Owner: amb-core.
// src/main/index.ts calls startCore() once at ready and stopCore() at quit.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { CORE_IPC, CORE_REVEAL_LINE, TEST_ENV, type CoreExit, type CoreState } from '../../shared/api';
import { binPath } from '../paths';
import { configOf } from './env';
import { Latest } from '../../shared/latest';
import { CoreProcess } from './process';
import { DictationRoutes, type Route } from './dictation';

let core: CoreProcess | null = null;
// the last state events, for a window or a main-side listener that comes after they went out
const latest = new Latest();
const listeners = new Set<(ev: Record<string, unknown>) => void>();
// a dictation's words go only to the window that started it (dictation.ts)
const dictations = new DictationRoutes();
const watched = new Set<number>();
// how its last run ended (exit.ts), sent with every state: null until it ended once
let lastExit: CoreExit | null = null;

/**
 * Main's own listener on the core's events (amb-mac m_9733: the helper's
 * config follows the core's prefs). The kept state events are replayed to it
 * first, so a listener added late misses nothing. Returns the unsubscribe.
 */
export function onCoreEvent(listener: (ev: Record<string, unknown>) => void): () => void {
  for (const ev of latest.snapshot()) listener(ev);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function broadcast(channel: string, payload: unknown): void {
  for (const w of BrowserWindow.getAllWindows()) {
    if (!w.isDestroyed()) w.webContents.send(channel, payload);
  }
}

/** The state with how the last run ended: one event, so the window reads both at once. */
function sendState(s: CoreState): void {
  for (const w of BrowserWindow.getAllWindows()) {
    if (!w.isDestroyed()) w.webContents.send(CORE_IPC.state, s, lastExit);
  }
}

function toWindow(r: Route): void {
  if (r.to !== 'window') return;
  const w = BrowserWindow.getAllWindows().find((x) => !x.isDestroyed() && x.webContents.id === r.window);
  w?.webContents.send(CORE_IPC.ev, r.ev);
}

/** A window that dictates or talks in voice mode: when it's gone (closed, crashed, reloaded), its mic stops. */
function watch(contents: Electron.WebContents): void {
  if (watched.has(contents.id)) return;
  const id = contents.id;
  watched.add(id);
  const gone = (): void => {
    for (const c of dictations.gone(id)) core?.send(c);
  };
  contents.once('destroyed', () => {
    watched.delete(id);
    gone();
  });
  contents.on('render-process-gone', gone);
  contents.on('did-start-navigation', (d) => {
    if (d.isMainFrame && !d.isSameDocument) gone();
  });
}

function log(line: string): void {
  process.stderr.write(`bise-desktop: ${line}${String.fromCharCode(10)}`);
}

/**
 * Starts `bise ambient-core` (the bise of src/main/paths.ts binPath: the one
 * shipped in the app, else BISE_DESKTOP_BISE, else the repo's build, never
 * PATH's; BISE_DESKTOP_WORKSPACE: the workspace, '' = home) and the IPC
 * handlers. No bise: the state stays 'down' and the reason is logged once.
 */
export function startCore(env: Readonly<Record<string, string | undefined>> = process.env): void {
  let state: CoreState = 'down';
  ipcMain.on(CORE_IPC.cmd, (e, cmd: unknown) => {
    dictations.sent(e.sender.id, cmd);
    const name = (cmd as { cmd?: unknown } | null)?.cmd;
    // a window whose mic, voice mode or held /model (R8) must end with it
    if (name === 'dictate_start' || name === 'voice_mode' || name === 'slash') watch(e.sender);
    core?.send(cmd);
  });
  ipcMain.handle(CORE_IPC.stateNow, (): CoreState => state);
  ipcMain.handle(CORE_IPC.snapshot, (): Record<string, unknown>[] => latest.snapshot());
  ipcMain.handle(CORE_IPC.exitNow, (): CoreExit | null => lastExit);
  const logFile = join(app.getPath('userData'), 'core.log');
  // a crash's report in Finder (test mode: a line, never Finder)
  ipcMain.on(CORE_IPC.revealLog, () => {
    if (env[TEST_ENV] === '1') process.stdout.write(`${CORE_REVEAL_LINE} ${logFile}${String.fromCharCode(10)}`);
    else shell.showItemInFolder(logFile);
  });
  const bise = binPath({ env, packaged: app.isPackaged, resourcesPath: process.resourcesPath, appPath: app.getAppPath(), exists: existsSync });
  const config = configOf(bise, env);
  if (config === null) {
    log("core: no bise: none shipped in the app, no BISE_DESKTOP_BISE path, no repo build (never PATH's bise)");
    return;
  }
  core = new CoreProcess(
    { config, logFile, env },
    {
      onEvent: (ev) => {
        // a dictation's words: its window only, never kept, never main's listeners
        const r = dictations.route(ev);
        if (r.to !== 'all') {
          toWindow(r);
          return;
        }
        latest.keep(ev);
        for (const l of [...listeners]) l(ev);
        broadcast(CORE_IPC.ev, ev);
      },
      onState: (s) => {
        // a new core starts from nothing: it says its state again
        if (s === 'starting') latest.clear();
        // a core gone took its mic with it: its dictations end
        if (s !== 'up') for (const r of dictations.coreGone()) toWindow(r);
        state = s;
        sendState(s);
      },
      onExit: (e) => {
        lastExit = e;
        log(`core: ended ${e.how}${e.code === null ? '' : ` ${String(e.code)}`}${e.signal === null ? '' : ` ${e.signal}`}${e.crash ? ' (crash)' : ''}`);
      },
      log,
    },
  );
  core.start();
}

/** Main's own command to the core (amb-mac, S.6: app_version); false when no core runs. */
export function sendToCore(cmd: unknown): boolean {
  return core?.send(cmd) ?? false;
}

export function stopCore(): void {
  core?.stop();
  core = null;
}
