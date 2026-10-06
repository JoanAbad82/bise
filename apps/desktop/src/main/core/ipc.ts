// Main's side of the core channel (window.bise.core, src/shared/api.ts):
// starts the one core child for the app, sends every event and state change
// to every window, writes the windows' commands to it. Owner: amb-core.
// src/main/index.ts calls startCore() once at ready and stopCore() at quit.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { app, BrowserWindow, ipcMain } from 'electron';
import { CORE_IPC, type CoreState } from '../../shared/api';
import { binPath } from '../paths';
import { configOf } from './env';
import { CoreProcess } from './process';

let core: CoreProcess | null = null;

function broadcast(channel: string, payload: unknown): void {
  for (const w of BrowserWindow.getAllWindows()) {
    if (!w.isDestroyed()) w.webContents.send(channel, payload);
  }
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
  ipcMain.on(CORE_IPC.cmd, (_e, cmd: unknown) => {
    core?.send(cmd);
  });
  ipcMain.handle(CORE_IPC.stateNow, (): CoreState => state);
  const bise = binPath({ env, packaged: app.isPackaged, resourcesPath: process.resourcesPath, appPath: app.getAppPath(), exists: existsSync });
  const config = configOf(bise, env);
  if (config === null) {
    log("core: no bise: none shipped in the app, no BISE_DESKTOP_BISE path, no repo build (never PATH's bise)");
    return;
  }
  core = new CoreProcess(
    { config, logFile: join(app.getPath('userData'), 'core.log'), env },
    {
      onEvent: (ev) => {
        broadcast(CORE_IPC.ev, ev);
      },
      onState: (s) => {
        state = s;
        broadcast(CORE_IPC.state, s);
      },
      log,
    },
  );
  core.start();
}

export function stopCore(): void {
  core?.stop();
  core = null;
}
