// The application menu (bar ⛔2: a real Edit menu and the mac keys). Pure: it
// builds Electron's template; index.ts installs it. The standard actions are
// Electron roles, so each does exactly what the OS does (undo, redo, cut,
// copy, paste, select all in the focused field; hide, quit, close, minimize)
// and shows in the menu bar with its key. bise's own items (settings ⌘,,
// inbox ⌘I, find ⌘F) only send a MenuAction to the focused window's
// renderer, which decides what it means (src/shared/api.ts onMenu).
import type { MenuItemConstructorOptions } from 'electron';
import type { MenuAction } from '../shared/api';
import type { ClipOp } from './clipfence';

export interface MenuOptions {
  readonly platform: NodeJS.Platform;
  readonly appName: string;
  /** dev builds and tests: reload and the devtools in a View menu */
  readonly dev: boolean;
  readonly send: (action: MenuAction) => void;
  /**
   * Test mode: copy, cut and paste never use the system pasteboard (his
   * clipboard): their items play the op on the window's private buffer
   * (src/main/clipfence.ts) instead of being Electron roles.
   */
  readonly clip?: (op: ClipOp) => void;
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
  const clipItem = (label: string, accelerator: string, op: ClipOp): MenuItemConstructorOptions => ({
    label,
    accelerator,
    click: () => {
      o.clip?.(op);
    },
  });
  const clipboardItems: MenuItemConstructorOptions[] =
    o.clip === undefined
      ? [{ role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'pasteAndMatchStyle' }]
      : [
          clipItem('Cut', 'CmdOrCtrl+X', 'cut'),
          clipItem('Copy', 'CmdOrCtrl+C', 'copy'),
          clipItem('Paste', 'CmdOrCtrl+V', 'paste'),
          clipItem('Paste and Match Style', 'Shift+CmdOrCtrl+V', 'paste'),
        ];
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
      ...clipboardItems,
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

export type MenuTarget = { readonly send: 'focused' } | { readonly open: string };

/**
 * Pure: where a bise item of the menu goes (qa-native m_9724). Settings and
 * the inbox are screens of the main window: to it when it has the keys, else
 * it opens on that route (closed with ⌘W, the capsule or another app has the
 * keys, a test run). Find is the focused page's (the capsule's own search
 * included), else the main window's (qa-flows m_9739: never dropped).
 */
export function menuTarget(action: MenuAction, mainFocused: boolean): MenuTarget {
  if (action === 'find' || mainFocused) return { send: 'focused' };
  return { open: action };
}
