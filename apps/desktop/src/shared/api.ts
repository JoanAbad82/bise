// What the preload puts on `window.bise`: the renderer's only door to Electron's
// main process (contextIsolation on, sandboxed renderer, no Node in the page).
// Shared by the preload (which builds it) and the renderer (which reads it), so
// the two can't drift. Owner: amb-core (the core channel lands here next);
// other chunks ask amb-core to add a member.

import type { HelperCmd, HelperEv } from '../proto';

export interface BiseApi {
  /** process.platform of the main process ('darwin', 'win32', 'linux'). */
  readonly platform: string;
  /** True when the app runs in test mode (BISE_DESKTOP_TEST=1): off-display window, no Dock icon. */
  readonly test: boolean;
  /**
   * Opens a link in his browser or mail app: http, https and mailto only
   * (src/main/external.ts). Resolves false when refused. In test mode nothing
   * opens: main prints `EXTERNAL_LINE <url>` on stdout instead.
   */
  readonly openExternal: (url: string) => Promise<boolean>;
  /**
   * Puts text on the clipboard. In test mode: the window's private buffer
   * (⌘V pastes it) and `COPY_LINE <text as JSON>` on stdout, never his clipboard.
   */
  readonly copy: (text: string) => Promise<void>;
  /** The menu's own keys (⌘, ⌘I ⌘F) for this window; returns the unsubscribe. */
  readonly onMenu: (listener: (action: MenuAction) => void) => () => void;
  /**
   * bise-mac-helper's events (fn, context, front, perms, quiet, shot...;
   * bise_proto::helper), to every window; returns the unsubscribe. No helper
   * in this run (not macOS, a test run without the stub): never called.
   */
  readonly onHelper: (listener: (ev: HelperEv) => void) => () => void;
  /** The helper's last state events (hello, front, perms, quiet), for a window that just opened. */
  readonly helperState: () => Promise<HelperEv[]>;
  /** A command to the helper (read_context, perm, shot, route, own_mic, config; never quit). */
  readonly helper: (cmd: HelperCmd) => void;
}

/** What a bise item of the application menu asks the focused window (src/main/menu.ts). */
export type MenuAction = 'settings' | 'inbox' | 'find';

/** The IPC channels between the preload and main (owner: amb-mac). */
export const IPC = {
  openExternal: 'bise:open-external',
  copy: 'bise:copy',
  menu: 'bise:menu',
  /** test mode: a clipboard item of the menu, played on the window's private buffer */
  clip: 'bise:clip',
  helperEv: 'bise:helper-ev',
  helperState: 'bise:helper-state',
  helperCmd: 'bise:helper-cmd',
} as const;

/** Test mode's stdout lines for effects that would leave the app. */
export const EXTERNAL_LINE = 'bise-desktop: external';
export const COPY_LINE = 'bise-desktop: copy';

/** The environment variable that turns test mode on. */
export const TEST_ENV = 'BISE_DESKTOP_TEST';

/** In test mode: Electron's userData folder (else a fresh temp folder). */
export const TEST_USER_DATA_ENV = 'BISE_DESKTOP_USER_DATA';

/** The line main prints on stdout, in test mode, once the renderer has loaded. */
export const READY_LINE = 'bise-desktop: ready';
