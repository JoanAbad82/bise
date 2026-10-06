// The application menu (bar ⛔2: a real Edit menu and the mac keys). Pure: it
// builds Electron's template; index.ts installs it. The standard actions are
// Electron roles, so each does exactly what the OS does (undo, redo, cut,
// copy, paste, select all in the focused field; hide, quit, close, minimize)
// and shows in the menu bar with its key. bise's own items (settings ⌘,,
// inbox ⌘I, find ⌘F) only send a MenuAction to the focused window's
// renderer, which decides what it means (src/shared/api.ts onMenu).
import type { MenuItemConstructorOptions } from 'electron';
import type { MenuAction } from '../shared/api';

export interface MenuOptions {
  readonly platform: NodeJS.Platform;
  readonly appName: string;
  /** dev builds and tests: reload and the devtools in a View menu */
  readonly dev: boolean;
  readonly send: (action: MenuAction) => void;
}

export function menuTemplate(o: MenuOptions): MenuItemConstructorOptions[] {
  const mac = o.platform === 'darwin';
  const item = (label: string, accelerator: string, action: MenuAction): MenuItemConstructorOptions => ({
    label,
    accelerator,
    click: () => {
      o.send(action);
    },
  });
  const settings = item(mac ? 'Settings…' : 'Settings', 'CmdOrCtrl+,', 'settings');

  const appMenu: MenuItemConstructorOptions[] = mac
    ? [
        {
          label: o.appName,
          submenu: [
            { role: 'about' },
            { type: 'separator' },
            settings,
            { type: 'separator' },
            { role: 'services' },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'hideOthers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' },
          ],
        },
      ]
    : [];

  const file: MenuItemConstructorOptions = {
    label: 'File',
    submenu: mac ? [{ role: 'close' }] : [settings, { type: 'separator' }, { role: 'close' }, { role: 'quit' }],
  };

  const edit: MenuItemConstructorOptions = {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'pasteAndMatchStyle' },
      { role: 'delete' },
      { role: 'selectAll' },
      { type: 'separator' },
      item('Find', 'CmdOrCtrl+F', 'find'),
      ...(mac
        ? ([
            { type: 'separator' },
            { label: 'Speech', submenu: [{ role: 'startSpeaking' }, { role: 'stopSpeaking' }] },
          ] satisfies MenuItemConstructorOptions[])
        : []),
    ],
  };

  const go: MenuItemConstructorOptions = {
    label: 'Go',
    submenu: [item('Inbox', 'CmdOrCtrl+I', 'inbox')],
  };

  const view: MenuItemConstructorOptions[] = o.dev
    ? [{ label: 'View', submenu: [{ role: 'reload' }, { role: 'forceReload' }, { role: 'toggleDevTools' }] }]
    : [];

  const window: MenuItemConstructorOptions = mac
    ? { role: 'windowMenu' }
    : { label: 'Window', submenu: [{ role: 'minimize' }, { role: 'close' }] };

  return [...appMenu, file, edit, go, ...view, window];
}
