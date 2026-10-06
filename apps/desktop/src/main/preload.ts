// The preload: builds `window.bise` (src/shared/api.ts) with contextBridge.
// Sandboxed, so it is bundled as CommonJS and may only use the sandbox's
// modules (electron's contextBridge and ipcRenderer). Owner: amb-mac.
import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import { IPC, TEST_ENV, type BiseApi, type MenuAction } from '../shared/api';

const api: BiseApi = {
  platform: process.platform,
  test: process.env[TEST_ENV] === '1',
  openExternal: async (url) => (await ipcRenderer.invoke(IPC.openExternal, url)) === true,
  copy: async (text) => {
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
};

contextBridge.exposeInMainWorld('bise', api);
