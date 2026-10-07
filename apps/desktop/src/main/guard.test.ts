import { describe, expect, it, vi } from 'vitest';

// guard.ts imports electron (app) and ipc.ts at load; only isOwnPage runs here
vi.mock('electron', () => ({ app: {}, BrowserWindow: {}, clipboard: {}, ipcMain: {}, session: {}, shell: {} }));

const { isOwnPage, isPagesFrame } = await import('./guard');

const built = { file: 'file:///Applications/bise.app/Contents/Resources/app.asar/out/renderer/index.html' };
const dev = { ...built, dev: 'http://localhost:5173/' };

describe('isOwnPage', () => {
  it("the app's own page, with any route in its hash", () => {
    expect(isOwnPage(built.file, built)).toBe(true);
    expect(isOwnPage(`${built.file}#route=inbox`, built)).toBe(true);
    expect(isOwnPage(`${built.file}?surface=capsule`, built)).toBe(true);
    expect(isOwnPage('http://localhost:5173/?surface=window#route=inbox', dev)).toBe(true);
    expect(isOwnPage('http://localhost:5173/#route=settings', dev)).toBe(true);
  });

  it('a dropped file, another file, the web, junk: not ours', () => {
    expect(isOwnPage('file:///Users/camille/Desktop/notes.pdf', built)).toBe(false);
    expect(isOwnPage('file:///Applications/bise.app/Contents/Resources/app.asar/out/renderer/other.html', built)).toBe(false);
    expect(isOwnPage('https://github.com/acme', dev)).toBe(false);
    expect(isOwnPage('http://localhost:5174/', dev)).toBe(false);
    expect(isOwnPage('http://localhost:5173/', built)).toBe(false);
    expect(isOwnPage('not a url', dev)).toBe(false);
    expect(isOwnPage('javascript:alert(1)', dev)).toBe(false);
  });
});

describe('isPagesFrame (an artifact in the window, amb-kit m_11871)', () => {
  it('the local pages server, any port and path', () => {
    expect(isPagesFrame('http://127.0.0.1:47438/p/desktop-app')).toBe(true);
    expect(isPagesFrame('http://127.0.0.1:9/p/x#item')).toBe(true);
  });
  it('anything else stays out: https, another host, localhost, credentials, file, junk', () => {
    expect(isPagesFrame('https://127.0.0.1:47438/p/x')).toBe(false);
    expect(isPagesFrame('http://example.com/p/x')).toBe(false);
    expect(isPagesFrame('http://localhost:47438/p/x')).toBe(false);
    expect(isPagesFrame('http://127.0.0.1.evil.com/p/x')).toBe(false);
    expect(isPagesFrame('http://u:p@127.0.0.1:47438/p/x')).toBe(false);
    expect(isPagesFrame('file:///etc/passwd')).toBe(false);
    expect(isPagesFrame('not a url')).toBe(false);
  });
});
