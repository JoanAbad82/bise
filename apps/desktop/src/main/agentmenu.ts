// src/main · the application menu with its Agent menu (bise fait mac, d4): each window tells main
// the items of the agent it shows (window.bise.agentMenu, app/menus/use.ts useAgentMenuBar; null:
// none), and the menu bar shows the focused window's, its keys live; a pick goes back to that
// window (IPC.agentMenu). No agent in view: the menu stays, every item dimmed (designer m_42681).
// No window focused (another app in front, an off-screen test window that
// never took the keys): the last focused one's, ui-review m_42540. Rebuilt when a window's items or
// the focus change, never on the same items. index.ts installs it once; ipc.ts hands it each window's items. Owner: nm-menus.
import { app, BrowserWindow, Menu, type WebContents } from 'electron';
import { IPC, type PopupItem } from '../shared/api';
import { menuTemplate, type MenuOptions } from './menu';
import { nativeItems, sfSymbol } from './menu-popup';
import { AGENT_MENU_IDLE } from '../app/menus/registry';

/** Each window's items, by its webContents id. */
const byWin = new Map<number, readonly PopupItem[]>();
let base: Omit<MenuOptions, 'agent'> | null = null;
/** what the menu bar shows now: its window and its items' JSON (no rebuild on the same) */
let shown = '';

/** The window that had the keys last (a blur to another app keeps it: macOS shows bise's menu bar only when bise is in front). */
let lastFocused: BrowserWindow | null = null;

/** The window the menu bar speaks for: the focused one, else the last one that was. Pure. */
export function menuWindow<W>(focused: W | null, last: W | null, gone: (w: W) => boolean): W | null {
  if (focused !== null) return focused;
  return last !== null && !gone(last) ? last : null;
}

/** That window's items, if it has an agent in view. */
function focusedItems(): { readonly to: WebContents; readonly items: readonly PopupItem[] } | undefined {
  const w = menuWindow(BrowserWindow.getFocusedWindow(), lastFocused, (x) => x.isDestroyed());
  if (w === null) return undefined;
  const items = byWin.get(w.webContents.id);
  return items === undefined ? undefined : { to: w.webContents, items };
}

function build(): void {
  if (base === null) return;
  const f = focusedItems();
  const key = f === undefined ? '' : `${String(f.to.id)}:${JSON.stringify(f.items)}`;
  if (key === shown) return;
  shown = key;
  const agent =
    f === undefined
      ? nativeItems(AGENT_MENU_IDLE, () => undefined, sfSymbol, true, true)
      : nativeItems(
          f.items,
          (id) => {
            if (!f.to.isDestroyed()) f.to.send(IPC.agentMenu, id);
          },
          sfSymbol,
          true,
        );
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate({ ...base, agent })));
}

/** Installs the application menu (index.ts, once); it follows the focus from then on. */
export function installAppMenu(o: Omit<MenuOptions, 'agent'>): void {
  base = o;
  shown = '\u0000';
  build();
  app.on('browser-window-focus', (_e, w) => {
    lastFocused = w;
    build();
  });
}

/** A window's Agent menu items (ipc.ts, IPC.agentMenu); null or not a list: none. */
export function setAgentMenu(from: WebContents, raw: unknown): void {
  const id = from.id;
  if (Array.isArray(raw) && raw.length > 0) {
    if (!byWin.has(id)) from.once('destroyed', () => {
      byWin.delete(id);
      build();
    });
    byWin.set(id, raw as PopupItem[]);
  } else byWin.delete(id);
  build();
}
