// The preload's side of the core channel: window.bise.core (CorePort) over
// ipcRenderer. Sandbox-safe (electron's ipcRenderer only). Owner: amb-core;
// src/main/preload.ts puts it on window.bise.
import type { IpcRenderer, IpcRendererEvent } from 'electron';
import { CORE_IPC, type CoreExit, type CorePort, type CoreState, type CrashReport } from '../../shared/api';

export function coreBridge(ipc: IpcRenderer): CorePort {
  return {
    send: (cmd) => {
      ipc.send(CORE_IPC.cmd, cmd);
    },
    onEvent: (listener) => {
      const on = (_e: IpcRendererEvent, ev: Record<string, unknown>): void => {
        listener(ev);
      };
      ipc.on(CORE_IPC.ev, on);
      return () => {
        ipc.removeListener(CORE_IPC.ev, on);
      };
    },
    onState: (listener) => {
      const on = (_e: IpcRendererEvent, s: CoreState, exit?: CoreExit | null): void => {
        listener(s, exit ?? null);
      };
      ipc.on(CORE_IPC.state, on);
      return () => {
        ipc.removeListener(CORE_IPC.state, on);
      };
    },
    state: async () => (await ipc.invoke(CORE_IPC.stateNow)) as CoreState,
    snapshot: async () => (await ipc.invoke(CORE_IPC.snapshot)) as Record<string, unknown>[],
    lastExit: async () => (await ipc.invoke(CORE_IPC.exitNow)) as CoreExit | null,
    start: () => {
      ipc.send(CORE_IPC.start);
    },
    report: async () => (await ipc.invoke(CORE_IPC.report)) as CrashReport | null,
    revealLog: () => {
      ipc.send(CORE_IPC.revealLog);
    },
  };
}
