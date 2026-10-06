// The menu-bar pearl (Electron's Tray). A click opens the capsule's dropdown
// under it (the page draws it: window.bise.capsule.onState says at 'menu',
// why 'tray'); a right click is the native fallback menu, which works with no
// page at all: open bise ⌘0, settings ⌘,, quit ⌘Q. Never in a test run (a
// tray icon would sit in his menu bar). The pearl's moods and count come with
// the store; for now its still frame (resources/pearl, rendered by amb-web).
import { join } from 'node:path';
import { app, Menu, nativeImage, Tray, type MenuItemConstructorOptions } from 'electron';
import type { Capsule } from './capsule';
import type { MainWindow } from './windows';

export function pearlDir(): string {
  return app.isPackaged ? join(process.resourcesPath, 'pearl') : join(app.getAppPath(), 'resources', 'pearl');
}

export function fallbackMenu(open: (route?: string) => void): MenuItemConstructorOptions[] {
  return [
    { label: 'open bise', accelerator: 'CmdOrCtrl+0', click: () => { open(); } },
    { label: 'settings…', accelerator: 'CmdOrCtrl+,', click: () => { open('settings'); } },
    { type: 'separator' },
    { label: 'quit bise', accelerator: 'CmdOrCtrl+Q', click: () => { app.quit(); } },
  ];
}

export function startTray(capsule: Capsule, main: MainWindow): Tray {
  const icon = nativeImage.createFromPath(join(pearlDir(), 'still-00.png'));
  const tray = new Tray(icon);
  tray.setToolTip('bise');
  const menu = Menu.buildFromTemplate(fallbackMenu((route) => { main.open(route); }));
  tray.on('click', () => {
    capsule.toggleMenu();
  });
  tray.on('right-click', () => {
    tray.popUpContextMenu(menu);
  });
  capsule.tray = tray;
  return tray;
}
