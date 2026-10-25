// src/main · a native menu at the pointer (window.bise.popupMenu; bise fait mac, decision d4): the
// '…' and the right click on an agent, a project, a tab, an artifact, a process, a scheduled task,
// drawn by macOS (Electron's Menu.popup) from the items the renderer's registry built (app/menus/,
// nm-menus). Resolves the picked item's id, null when he closes it. The contract nm-ds set for the
// wave; nm-menus fills it. Owner: nm-menus.
import type { BrowserWindow } from 'electron';
import type { PopupAt, PopupItem } from '../shared/api';

/** Shows `items` as a native menu over `win` (under `at`, else at the pointer); the picked id, or null. */
export const popupMenu: (win: BrowserWindow | null, items: readonly PopupItem[], at: PopupAt | undefined) => Promise<string | null> = () => {
  // STUB(native-mac): nm-menus
  return Promise.resolve(null);
};
