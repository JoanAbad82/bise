import { describe, expect, it, vi } from 'vitest';

// guard.ts imports electron (app) and ipc.ts at load; only isOwnPage runs here
vi.mock('electron', () => ({ app: {}, BrowserWindow: {}, clipboard: {}, ipcMain: {}, session: {}, shell: {} }));

const { isOwnPage } = await import('./guard');

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
