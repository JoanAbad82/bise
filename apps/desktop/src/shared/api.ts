// What the preload puts on `window.bise`: the renderer's only door to Electron's
// main process (contextIsolation on, sandboxed renderer, no Node in the page).
// Shared by the preload (which builds it) and the renderer (which reads it), so
// the two can't drift. Owner: amb-core (the core channel lands here next);
// other chunks ask amb-core to add a member.

export interface BiseApi {
  /** process.platform of the main process ('darwin', 'win32', 'linux'). */
  readonly platform: string;
  /** True when the app runs in test mode (BISE_DESKTOP_TEST=1): off-display window, no Dock icon. */
  readonly test: boolean;
}

/** The environment variable that turns test mode on. */
export const TEST_ENV = 'BISE_DESKTOP_TEST';

/** In test mode: Electron's userData folder (else a fresh temp folder). */
export const TEST_USER_DATA_ENV = 'BISE_DESKTOP_USER_DATA';

/** The line main prints on stdout, in test mode, once the renderer has loaded. */
export const READY_LINE = 'bise-desktop: ready';
