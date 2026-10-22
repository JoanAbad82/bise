// The terminal panel opened before the core's first projects rows (ambient-lead m_21602,
// min-tests for terminal/early): the open waits for the rows, never answers 'no folder' from rows
// not there yet; once they came, an open answers at once. No shell is started here: the rows
// never hold the project, so every open ends on its 'no folder' line.
import { describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({ app: {}, BrowserWindow: { getAllWindows: () => [] }, ipcMain: {} }));
vi.mock('../core/ipc', () => ({ onCoreEvent: () => undefined }));

const { TermHost } = await import('./host');

const settle = async (): Promise<void> => {
  for (let i = 0; i < 5; i++) await Promise.resolve();
};

describe('an early open of the terminal', () => {
  it("waits for the core's rows, then reads them; a later open reads them at once", async () => {
    const host = new TermHost(true, new Promise<void>(() => undefined));
    let got: unknown;
    void host.open('acme', 80, 24).then((r) => (got = r));
    await settle();
    expect(got).toBeUndefined();
    host.setRows([{ project: 'shop', path: '/w/shop' }]);
    await settle();
    expect(got).toEqual({ error: 'no folder for this project' });
    let again: unknown;
    void host.open('acme', 80, 24).then((r) => (again = r));
    await settle();
    expect(again).toEqual({ error: 'no folder for this project' });
  });
});
