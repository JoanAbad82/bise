// bise's windows, both on the same renderer bundle: the main window (the
// sidebar and the screens) and the capsule (capsule.ts). The preload learns
// which one it is from `--bise-surface=<surface>` (window.bise.surface), the
// renderer its first screen from the URL's hash `route=<route>`; the URL's
// query `surface=` names the window too (for tests and the guard).
//
// Test mode (BISE_DESKTOP_TEST=1), for the harness: nothing ever in his face.
// Every window renders offscreen (webPreferences.offscreen) and is never shown
// (a shown window at -30000 is clamped back onto his display: qa-type m_9500,
// measured with CGWindowList), also placed at -30000 and not focusable;
// BISE_DESKTOP_ROUTE opens the main window on that screen (amb-tools m_9576:
// 'show me' and the checks open any screen without clicks); main prints
// READY_LINE once the main window's page has loaded.
import { join } from 'node:path';
import { app, BrowserWindow, type BrowserWindowConstructorOptions } from 'electron';
import { IPC, READY_LINE, ROUTE_ENV, SURFACE_ARG, type Surface } from '../shared/api';

export const OFF = -30000;

/** The webPreferences every bise window shares. */
export function webPreferences(surface: Surface, testMode: boolean): BrowserWindowConstructorOptions['webPreferences'] {
  return {
    preload: join(__dirname, '../preload/index.js'),
    contextIsolation: true,
    sandbox: true,
    nodeIntegration: false,
    additionalArguments: [`${SURFACE_ARG}${surface}`],
    ...(testMode ? { offscreen: true } : {}),
  };
}

/**
 * Loads the renderer for `surface` (its URL says which: '?surface=window' or
 * '?surface=capsule', so tests and the guard tell the two pages apart:
 * qa-type m_9675), on `route` when given ('#route=<route>').
 */
export function loadRenderer(win: BrowserWindow, surface: Surface, route: string | undefined): void {
  const hash = route === undefined || route === '' ? '' : `route=${encodeURIComponent(route)}`;
  const devUrl = process.env['ELECTRON_RENDERER_URL'];
  if (!app.isPackaged && devUrl !== undefined && devUrl !== '') {
    const u = new URL(devUrl);
    u.searchParams.set('surface', surface);
    u.hash = hash;
    void win.loadURL(u.toString());
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'), { query: { surface }, ...(hash === '' ? {} : { hash }) });
  }
}

export class MainWindow {
  private win: BrowserWindow | null = null;

  constructor(private readonly testMode: boolean) {}

  get window(): BrowserWindow | null {
    return this.win;
  }

  create(route?: string): BrowserWindow {
    const test = this.testMode;
    const win = new BrowserWindow({
      width: 1100,
      height: 720,
      show: false,
      // focusable false: a stray focus() can never activate the app over his;
      // the harness draws the caret with CDP focus emulation.
      ...(test ? { x: OFF, y: OFF, focusable: false } : {}),
      title: 'bise',
      webPreferences: webPreferences('window', test),
    });
    this.win = win;
    win.on('closed', () => {
      if (this.win === win) this.win = null;
    });
    if (test) {
      win.webContents.once('did-finish-load', () => {
        process.stdout.write(`${READY_LINE}\n`);
      });
    } else {
      win.once('ready-to-show', () => {
        win.show();
      });
    }
    loadRenderer(win, 'window', route ?? (test ? process.env[ROUTE_ENV] : undefined));
    return win;
  }

  /** In front on `route` (the capsule's ⏎, the tray's 'open bise'); never shown in test mode. */
  open(route?: string): void {
    const win = this.win;
    if (win === null) {
      this.create(route);
      return;
    }
    if (route !== undefined && route !== '') win.webContents.send(IPC.route, route);
    if (this.testMode) return;
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
  }
}
