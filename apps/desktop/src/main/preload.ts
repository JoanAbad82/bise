// The preload: builds `window.bise` (src/shared/api.ts) with contextBridge.
// Sandboxed, so it is bundled as CommonJS and may only use the sandbox's
// modules (electron's contextBridge and ipcRenderer). Owner: amb-mac.
// In test mode it also fences the clipboard (src/main/clipfence.ts): ⌘C ⌘X
// ⌘V and the menu's clipboard items play on a private buffer, never his.
import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import type { HelperEv } from '../proto';
import { HOME_ARG, IPC, SURFACE_ARG, TEST_ENV, type BiseApi, type CapsuleState, type MenuAction, type Surface, type TermOpened } from '../shared/api';
import { argValue } from './args';
import { installClipFence, type ClipOp, type ClipSeed, type WinLike } from './clipfence';
import { coreBridge } from './core/bridge';

const test = process.env[TEST_ENV] === '1';
const surface: Surface = argValue(process.argv, SURFACE_ARG) === 'capsule' ? 'capsule' : 'window';
// his home folder from main (windows.ts), read once
const home = argValue(process.argv, HOME_ARG) ?? '';

// what main sends on each channel a page listens to
interface Pushed {
  [IPC.menu]: MenuAction;
  [IPC.helperEv]: HelperEv;
  [IPC.capsuleState]: CapsuleState;
  [IPC.route]: string;
  [IPC.termData]: { id: string; bytes: Uint8Array };
  [IPC.termExit]: { id: string; code: number | null };
}

// one listener on a channel, its unsubscribe
function listen<K extends keyof Pushed>(channel: K, listener: (v: Pushed[K]) => void): () => void {
  const on = (_e: IpcRendererEvent, v: Pushed[K]): void => {
    listener(v);
  };
  ipcRenderer.on(channel, on);
  return () => {
    ipcRenderer.removeListener(channel, on);
  };
}
// the page's window (src/main has no DOM types: the fence names what it uses)
const fence = test ? installClipFence(globalThis as unknown as WinLike, process.platform === 'darwin') : null;
if (fence !== null) {
  ipcRenderer.on(IPC.clip, (_e: IpcRendererEvent, op: ClipOp) => {
    fence.run(op);
  });
  // the env's seed (BISE_DESKTOP_TEST_CLIPBOARD[_FILE]): main reads the files
  void ipcRenderer.invoke(IPC.clipSeed).then((seed: ClipSeed) => {
    if (seed.text !== undefined || (seed.files ?? []).length > 0) fence.seed(seed);
  });
}

const api: BiseApi = {
  platform: process.platform,
  home,
  test,
  openExternal: async (url) => (await ipcRenderer.invoke(IPC.openExternal, url)) === true,
  openPath: async (path, opts) => (await ipcRenderer.invoke(IPC.openPath, path, opts)) === true,
  copy: async (text) => {
    fence?.put(text);
    await ipcRenderer.invoke(IPC.copy, text);
  },
  onMenu: (listener) => listen(IPC.menu, listener),
  onHelper: (listener) => listen(IPC.helperEv, listener),
  helperState: async () => (await ipcRenderer.invoke(IPC.helperState)) as HelperEv[],
  helper: (cmd) => {
    ipcRenderer.send(IPC.helperCmd, cmd);
  },
  surface,
  capsule: {
    show: (at, keys) => {
      ipcRenderer.send(IPC.capsuleShow, at, keys);
    },
    hide: () => {
      ipcRenderer.send(IPC.capsuleHide);
    },
    size: (width, height, glass) => {
      ipcRenderer.send(IPC.capsuleSize, width, height, glass);
    },
    onState: (listener) => listen(IPC.capsuleState, listener),
  },
  quit: () => {
    ipcRenderer.send(IPC.quit);
  },
  openWindow: (route) => {
    ipcRenderer.send(IPC.openWindow, route);
  },
  onRoute: (listener) => listen(IPC.route, listener),
  core: coreBridge(ipcRenderer),
  term: {
    open: async (project, cols, rows) => (await ipcRenderer.invoke(IPC.termOpen, project, cols, rows)) as TermOpened,
    write: (id, data) => {
      ipcRenderer.send(IPC.termWrite, id, data);
    },
    resize: (id, cols, rows) => {
      ipcRenderer.send(IPC.termResize, id, cols, rows);
    },
    kill: (id) => {
      ipcRenderer.send(IPC.termKill, id);
    },
    onData: (listener) =>
      listen(IPC.termData, (v) => {
        listener(v.id, v.bytes);
      }),
    onExit: (listener) =>
      listen(IPC.termExit, (v) => {
        listener(v.id, v.code);
      }),
  },
};

contextBridge.exposeInMainWorld('bise', api);
