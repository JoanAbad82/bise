// windowTarget (main/windows.ts): what the renderer sent to openWindow goes to the main window or a
// window of its own; settings is always its own (nm-settings: the capsule's 'settings', a
// 'settings/<page>' link).
import { describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({ app: {}, BrowserWindow: {}, nativeTheme: {}, screen: {}, systemPreferences: {} }));

const { windowTarget } = await import('./windows');

describe('windowTarget', () => {
  it('a route string goes to the main window, settings to its own window', () => {
    expect(windowTarget('acme/perf')).toEqual({ main: 'acme/perf' });
    expect(windowTarget(undefined)).toEqual({ main: undefined });
    expect(windowTarget('settings')).toEqual({ own: { kind: 'settings', route: '' } });
    expect(windowTarget('settings/models')).toEqual({ own: { kind: 'settings', route: 'settings/models' } });
    expect(windowTarget('settingsx')).toEqual({ main: 'settingsx' });
  });

  it('a WindowOpen keeps its kind and route', () => {
    expect(windowTarget({ kind: 'settings', route: 'settings/keys' })).toEqual({ own: { kind: 'settings', route: 'settings/keys' } });
    expect(windowTarget({ kind: 'artifact', route: 'artifacts/acme/a1' })).toEqual({ own: { kind: 'artifact', route: 'artifacts/acme/a1' } });
  });
});
