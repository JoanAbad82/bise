// The preload: builds `window.bise` (src/shared/api.ts) with contextBridge.
// Sandboxed, so it is bundled as CommonJS and may only use the sandbox's
// modules (electron's contextBridge and ipcRenderer). Owner: amb-mac.
// In test mode it also fences the clipboard (src/main/clipfence.ts): ⌘C ⌘X
// ⌘V and the menu's clipboard items play on a private buffer, never his.
import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import type { HelperEv } from '../proto';
import { IPC, TEST_ENV, type BiseApi, type MenuAction } from '../shared/api';
import { installClipFence, type ClipOp, type WinLike } from './clipfence';

const test = process.env[TEST_ENV] === '1';
// the page's window (src/main has no DOM types: the fence names what it uses)
const fence = test ? installClipFence(globalThis as unknown as WinLike, process.platform === 'darwin') : null;
if (fence !== null) {
  ipcRenderer.on(IPC.clip, (_e: IpcRendererEvent, op: ClipOp) => {
    fence.run(op);
  });
}

const api: BiseApi = {
  platform: process.platform,
  test,
  openExternal: async (url) => (await ipcRenderer.invoke(IPC.openExternal, url)) === true,
  copy: async (text) => {
    fence?.put(text);
    await ipcRenderer.invoke(IPC.copy, text);
  },
  onMenu: (listener) => {
    const on = (_e: IpcRendererEvent, action: MenuAction): void => {
      listener(action);
    };
    ipcRenderer.on(IPC.menu, on);
    return () => {
      ipcRenderer.removeListener(IPC.menu, on);
    };
  },
  onHelper: (listener) => {
    const on = (_e: IpcRendererEvent, ev: HelperEv): void => {
      listener(ev);
    };
    ipcRenderer.on(IPC.helperEv, on);
    return () => {
      ipcRenderer.removeListener(IPC.helperEv, on);
    };
  },
  helperState: async () => (await ipcRenderer.invoke(IPC.helperState)) as HelperEv[],
  helper: (cmd) => {
    ipcRenderer.send(IPC.helperCmd, cmd);
  },
};

contextBridge.exposeInMainWorld('bise', api);
