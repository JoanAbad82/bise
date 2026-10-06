// The harness's own Electron main for TODAY's old web UI (apps/ambient/web), so the red checks
// fail on the app he tried before the new one exists. It opens one page from file:// in one
// window that is never shown: offscreen rendering (webPreferences.offscreen) + show:false, so the
// window server never puts it on a display (a shown window at -30000 is clamped back onto his
// screen: qa-type m_9499). No Dock icon, never focusable, never throttled, 60 frames a second.
// In a plain browser the old pages run on their own fake cores (window/winfake.js, fakecore.js):
// no webkit message handler here, so they pick the fake.
//
// env: BISE_HARNESS_PAGE       the HTML file to open (absolute)
//      BISE_HARNESS_SIZE       "<w>x<h>" (default 1100x760)
//      BISE_HARNESS_USER_DATA  Electron's userData (a throwaway folder; never his Library)
'use strict';
const { app, BrowserWindow } = require('electron');

const page = process.env.BISE_HARNESS_PAGE;
const [width, height] = (process.env.BISE_HARNESS_SIZE || '1100x760').split('x').map(Number);
if (process.env.BISE_HARNESS_USER_DATA) app.setPath('userData', process.env.BISE_HARNESS_USER_DATA);
if (process.platform === 'darwin') {
  app.setActivationPolicy('accessory');
  app.dock?.hide();
}
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-renderer-backgrounding');

app.whenReady().then(() => {
  const win = new BrowserWindow({
    x: -30000, y: -30000, width, height, show: false, frame: false, focusable: false,
    skipTaskbar: true, paintWhenInitiallyHidden: true,
    webPreferences: { offscreen: true, backgroundThrottling: false, contextIsolation: true, sandbox: true },
  });
  win.webContents.setFrameRate(60);
  win.loadFile(page);
});
app.on('window-all-closed', () => app.quit());
