// windowTarget (main/windows.ts): what the renderer sent to openWindow goes to the main window or a
// window of its own. Settings is a route of the main window (r2-settings, his m_44293): the tray's
// and the capsule's 'settings', a 'settings/<page>' link, never open a second window.
import { describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({ app: {}, BrowserWindow: {}, nativeTheme: {}, screen: {}, systemPreferences: {} }));

const { windowTarget } = await import('./windows');

describe('windowTarget', () => {
  it('a route string goes to the main window, settings too', () => {
    expect(windowTarget('acme/perf')).toEqual({ main: 'acme/perf' });
    expect(windowTarget(undefined)).toEqual({ main: undefined });
    expect(windowTarget('settings')).toEqual({ main: 'settings' });
    expect(windowTarget('settings/models')).toEqual({ main: 'settings/models' });
  });

  it('a WindowOpen keeps its kind and route; settings is no window kind', () => {
    expect(windowTarget({ kind: 'artifact', route: 'artifacts/acme/a1' })).toEqual({ own: { kind: 'artifact', route: 'artifacts/acme/a1' } });
    expect(windowTarget({ kind: 'agent', route: 'acme/perf' })).toEqual({ own: { kind: 'agent', route: 'acme/perf' } });
    // an old caller's settings WindowOpen still lands in the main window
    expect(windowTarget({ kind: 'settings', route: 'settings/keys' })).toEqual({ main: undefined });
  });
});
