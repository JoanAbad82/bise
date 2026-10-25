// The application menu (bar ⛔2: a real Edit menu and the mac keys). Pure: it
// builds Electron's template; index.ts installs it. The standard actions are
// Electron roles, so each does exactly what the OS does (undo, redo, cut,
// copy, paste, select all in the focused field; hide, quit, close, minimize)
// and shows in the menu bar with its key. bise's own items (settings ⌘,,
// inbox ⌘I, find ⌘F, terminal ⌃`, File › save a copy ⌘S) only send a MenuAction to the focused window's
// renderer, which decides what it means (src/shared/api.ts onMenu). The Agent menu (bise fait mac,
// d4) is the agent in view's '…' with its keys live, every item dimmed when no agent is (main/agentmenu.ts).
// Owner: nm-menus.
import type { MenuItemConstructorOptions } from 'electron';
import { menus } from '../proto/words_menus.gen';
import type { MenuAction } from '../shared/api';
import type { ClipOp } from './clipfence';

export interface MenuOptions {
  readonly platform: NodeJS.Platform;
  readonly appName: string;
  /** dev builds and tests: reload and the devtools in the View menu */
  readonly dev: boolean;
  readonly send: (action: MenuAction) => void;
  /**
   * Test mode: copy, cut and paste never use the system pasteboard (his
   * clipboard): their items play the op on the window's private buffer
   * (src/main/clipfence.ts) instead of being Electron roles.
   */
  readonly clip?: (op: ClipOp) => void;
  /**
   * Try and check builds, and tests, never his release app: Help › 'send a test notification'
   * posts one notification like a real card and records what comes back (a0, lead m_14515).
   */
  readonly testNotify?: () => void;
  /**
   * The Agent menu (bise fait mac, d4): the focused window's agent in view, its items as its '…'
   * gives them (app/menus/registry.ts, converted by menu-popup.ts nativeItems with their keys
   * live); with no agent in view agentmenu.ts gives every item dimmed (designer m_42681: the bar
   * stays stable). None: no Agent menu (a test's template).
   */
  readonly agent?: readonly MenuItemConstructorOptions[];
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
    // art-save: the open artifact's 'save a copy…' (no artifact open: the window does nothing)
    submenu: mac
      ? [item('Save a Copy…', 'CmdOrCtrl+S', 'save'), { type: 'separator' }, { role: 'close' }]
      : [item('Save a Copy…', 'CmdOrCtrl+S', 'save'), { type: 'separator' }, settings, { type: 'separator' }, { role: 'close' }, { role: 'quit' }],
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

  // the terminal panel (bar T W25): ctrl+` as in the TUI; reload and the devtools in dev builds
  const view: MenuItemConstructorOptions[] = [
    {
      label: 'View',
      submenu: [
        item('Terminal', 'Ctrl+`', 'terminal'),
        ...(o.dev ? ([{ type: 'separator' }, { role: 'reload' }, { role: 'forceReload' }, { role: 'toggleDevTools' }] satisfies MenuItemConstructorOptions[]) : []),
      ],
    },
  ];

  const agent: MenuItemConstructorOptions[] = o.agent === undefined || o.agent.length === 0 ? [] : [{ label: menus.agent_menu, submenu: [...o.agent] }];

  const window: MenuItemConstructorOptions = mac
    ? { role: 'windowMenu' }
    : { label: 'Window', submenu: [{ role: 'minimize' }, { role: 'close' }] };

  const help: MenuItemConstructorOptions[] =
    o.testNotify === undefined
      ? []
      : [{ role: 'help', submenu: [{ label: 'send a test notification', click: o.testNotify }] }];

  return [...appMenu, file, edit, go, ...view, ...agent, window, ...help];
}

/** Whether Help › 'send a test notification' shows: a try or check build (its own name) or a test run, never 'bise'. */
export const hasTestNotify = (appName: string, testMode: boolean): boolean => testMode || appName !== 'bise';

export type MenuTarget = { readonly send: 'focused' } | { readonly open: string };

/**
 * Pure: where a bise item of the menu goes (qa-native m_9724). Settings,
 * the inbox and the terminal panel are the main window's: to it when it has the keys, else
 * it opens on that route (closed with ⌘W, the capsule or another app has the
 * keys, a test run). Find is the focused page's (the capsule's own search
 * included), else the main window's (qa-flows m_9739: never dropped).
 */
export function menuTarget(action: MenuAction, mainFocused: boolean): MenuTarget {
  if (action === 'find' || action === 'save' || mainFocused) return { send: 'focused' };
  return { open: action };
}
