// A secret he types in the plugins place's add sheet (plugin_add_confirm {token, secrets}) passes
// Electron main's command handler (ipc.ts) on its way to the core and stays nowhere: not in the
// dictation or subscription routes, not in a log line, not in the events a reload replays
// (plugins merge checklist, plugins-plan m_40252). The core gets it as the window sent it.
import { inspect } from 'node:util';
import { afterEach, describe, expect, it, vi } from 'vitest';

const handlers = new Map<string, (...a: unknown[]) => unknown>();
vi.mock('electron', () => ({
  app: { getPath: () => '/tmp/bise-ipc-secrets', isPackaged: false, getAppPath: () => '/nowhere', emit: () => true },
  BrowserWindow: { getAllWindows: () => [] },
  ipcMain: {
    on: (ch: string, f: (...a: unknown[]) => unknown) => handlers.set(ch, f),
    handle: (ch: string, f: (...a: unknown[]) => unknown) => handlers.set(ch, f),
  },
  Notification: vi.fn(),
  shell: { showItemInFolder: () => undefined },
}));
// no bise to start: the handler runs, nothing is spawned
vi.mock('../paths', () => ({ binPath: () => null }));

const PLANTED = 'sk-PLANTED-9f3a';
const confirm = { cmd: 'plugin_add_confirm', token: 'a1b2c3d4e5f60718', secrets: [{ name: 'LINEAR_TOKEN', value: PLANTED }] };

afterEach(() => {
  vi.restoreAllMocks();
});

describe("a confirm's secret values", () => {
  it('pass the command handler and are kept nowhere', async () => {
    const out: string[] = [];
    vi.spyOn(process.stderr, 'write').mockImplementation((s) => { out.push(String(s)); return true; });
    vi.spyOn(process.stdout, 'write').mockImplementation((s) => { out.push(String(s)); return true; });
    const { startCore } = await import('./ipc');
    const { CORE_IPC } = await import('../../shared/api');
    startCore({});
    const cmd = handlers.get(CORE_IPC.cmd);
    expect(cmd).toBeDefined();
    cmd?.({ sender: { id: 7 } }, confirm);
    cmd?.({ sender: { id: 7 } }, { cmd: 'plugin_add_cancel', token: 'x' });
    const snapshot = handlers.get(CORE_IPC.snapshot)?.();
    expect(JSON.stringify(snapshot ?? [])).not.toContain(PLANTED);
    expect(out.join('')).not.toContain(PLANTED);
  });

  it("the routes that remember a window's commands keep none of it", async () => {
    const { DictationRoutes } = await import('./dictation');
    const { SubRoutes } = await import('./subs');
    const d = new DictationRoutes();
    const s = new SubRoutes();
    d.sent(7, confirm);
    // a subscription route passes it on as is (to the core), holding nothing
    expect(s.sent(7, confirm)).toEqual([confirm]);
    expect(inspect(d, { depth: 8, showHidden: true })).not.toContain(PLANTED);
    expect(inspect(s, { depth: 8, showHidden: true })).not.toContain(PLANTED);
  });
});
