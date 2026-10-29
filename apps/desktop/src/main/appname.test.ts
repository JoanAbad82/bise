import { describe, expect, it } from 'vitest';
import { appName } from './appname';

describe('appName (Quit bise, never bise-desktop: lead m_12625)', () => {
  it("unpacked (dev, test runs): 'bise'", () => {
    expect(appName(false, 'darwin', '/x/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron')).toBe('bise');
  });
  it("packed: the bundle's own name, his app's or a try's", () => {
    expect(appName(true, 'darwin', '/b/desktop/bise.app/Contents/MacOS/bise')).toBe('bise');
    expect(appName(true, 'darwin', '/d/mac-arm64/bise try.app/Contents/MacOS/bise try')).toBe('bise try');
  });
  it("elsewhere: 'bise'", () => {
    expect(appName(true, 'linux', '/opt/bise/bise-desktop')).toBe('bise');
  });
});
