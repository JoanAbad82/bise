// Electron's main process, minimal: one window on the renderer, the preload as
// its only bridge. Owner: amb-mac (windows, panel, tray, menus, helper);
// src/main/core (spawning `bise ambient-core`) is amb-core's.
//
// Test mode (BISE_DESKTOP_TEST=1), for the harness: nothing ever in his face.
// The page renders offscreen (webPreferences.offscreen) in a window that is
// never shown (also placed at -30000 and not focusable: a shown window there
// is clamped back onto his display), the app is an accessory with no
// Dock icon, userData is BISE_DESKTOP_USER_DATA or a temp folder (never his
// Application Support), and main prints READY_LINE on stdout once the page
// has loaded.
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { app, BrowserWindow, Menu } from 'electron';
import { READY_LINE, TEST_ENV, TEST_USER_DATA_ENV } from '../shared/api';
import { installGuard } from './guard';
import { startHelper } from './helper/run';
import { installIpc, sendClip, sendMenu } from './ipc';
import { menuTemplate } from './menu';

const testMode = process.env[TEST_ENV] === '1';
const OFF_DISPLAY = -30000;

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1100,
    height: 720,
    show: false,
    // focusable false: a stray focus() can never activate the app over his;
    // the harness draws the caret with CDP focus emulation.
    ...(testMode ? { x: OFF_DISPLAY, y: OFF_DISPLAY, focusable: false } : {}),
    title: 'bise',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      // test mode renders offscreen and the window is never shown: macOS
      // clamps a shown window at -30000 back to a strip on his display
      // (qa-type m_9500, measured with CGWindowList), offscreen never is.
      ...(testMode ? { offscreen: true } : {}),
    },
  });

  if (!testMode) win.once('ready-to-show', () => { win.show(); });

  if (testMode) {
    win.webContents.once('did-finish-load', () => {
      process.stdout.write(`${READY_LINE}\n`);
    });
  }

  const devUrl = process.env['ELECTRON_RENDERER_URL'];
  if (!app.isPackaged && devUrl) {
    void win.loadURL(devUrl);
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'));
  }
  return win;
}

if (testMode) {
  // never his ~/Library/Application Support: the harness's folder, else a fresh temp one
  const userData = process.env[TEST_USER_DATA_ENV] ?? mkdtempSync(join(tmpdir(), 'bise-desktop-test-'));
  app.setPath('userData', userData);
  if (process.platform === 'darwin') {
    app.setActivationPolicy('accessory');
    app.dock?.hide();
  }
}

// every page guarded from birth: no new window, no navigation away (guard.ts)
installGuard(
  {
    file: pathToFileURL(join(__dirname, '../renderer/index.html')).href,
    ...(!app.isPackaged && process.env['ELECTRON_RENDERER_URL'] ? { dev: process.env['ELECTRON_RENDERER_URL'] } : {}),
  },
  testMode,
);

void app.whenReady().then(() => {
  installIpc(testMode);
  startHelper(testMode);
  Menu.setApplicationMenu(
    Menu.buildFromTemplate(
      menuTemplate({
        platform: process.platform,
        appName: app.name,
        dev: !app.isPackaged,
        send: (action) => {
          sendMenu(action);
        },
        ...(testMode ? { clip: sendClip } : {}),
      }),
    ),
  );
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' || testMode) app.quit();
});
