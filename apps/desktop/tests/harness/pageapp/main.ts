// The harness's own Electron main for any local HTML page (launchPage: the harness's self-tests
// run its detectors on fixtures/). It opens one page from file:// in one window that is never
// shown: offscreen rendering (webPreferences.offscreen) + show:false, so the
// window server never puts it on a display (a shown window at -30000 is clamped back onto his
// screen: qa-type m_9499). No Dock icon, never focusable, never throttled, 60 frames a second.
//
// env: BISE_HARNESS_PAGE       the HTML file to open (absolute)
//      BISE_HARNESS_SIZE       "<w>x<h>" (default 1100x760)
//      BISE_HARNESS_USER_DATA  Electron's userData (a throwaway folder; never his Library)
'use strict';
// a CommonJS script Electron loads as its main: require is its import, typed by its annotation
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
const { app, BrowserWindow }: typeof import('electron') = require('electron');
type WebContents = import('electron').WebContents;
type BrowserWindowT = import('electron').BrowserWindow;

const page = process.env.BISE_HARNESS_PAGE as string; // launch.ts's launchPage always sets it
const [width, height] = (process.env.BISE_HARNESS_SIZE || '1100x760').split('x').map(Number);
if (process.env.BISE_HARNESS_USER_DATA) app.setPath('userData', process.env.BISE_HARNESS_USER_DATA);
if (process.platform === 'darwin') {
  app.setActivationPolicy('accessory');
  app.dock?.hide();
}
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-renderer-backgrounding');

// Nothing may open a window or leave the page: a file dropped on a page that doesn't handle drops
// made Chromium open it in a NEW, shown window on his screen (qa-type m_9582). Every new window is
// denied, every navigation the page starts is cancelled, and a window that isn't offscreen is
// destroyed as it is created. launch.ts installs the same guards in the new app.
app.on('web-contents-created', (_e: unknown, wc: WebContents) => {
  wc.setWindowOpenHandler(() => ({ action: 'deny' }));
  wc.on('will-navigate', (e) => { e.preventDefault(); });
  wc.on('will-frame-navigate', (e) => { if (e.isMainFrame) e.preventDefault(); });
});
app.on('browser-window-created', (_e: unknown, w: BrowserWindowT) => { if (!w.webContents.isOffscreen()) w.destroy(); });

void app.whenReady().then(() => {
  const win = new BrowserWindow({
    x: -30000, y: -30000, width, height, show: false, frame: false, focusable: false,
    skipTaskbar: true, paintWhenInitiallyHidden: true,
    webPreferences: { offscreen: true, backgroundThrottling: false, contextIsolation: true, sandbox: true },
  });
  win.webContents.setFrameRate(60);
  void win.loadFile(page);
});
app.on('window-all-closed', () => { app.quit(); });
