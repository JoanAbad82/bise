// The preload: builds `window.bise` (src/shared/api.ts) with contextBridge.
// Sandboxed, so it is bundled as CommonJS and may only use the sandbox's
// modules (electron's contextBridge and ipcRenderer). Owner: amb-mac.
import { contextBridge } from 'electron';
import { TEST_ENV, type BiseApi } from '../shared/api';

const api: BiseApi = {
  platform: process.platform,
  test: process.env[TEST_ENV] === '1',
};

contextBridge.exposeInMainWorld('bise', api);
