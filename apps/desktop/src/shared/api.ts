// What the preload puts on `window.bise`: the renderer's only door to Electron's
// main process (contextIsolation on, sandboxed renderer, no Node in the page).
// Shared by the preload (which builds it) and the renderer (which reads it), so
// the two can't drift. Owner: amb-core (the core channel lands here next);
// other chunks ask amb-core to add a member.

import type { AppCmd, DraftHubCmd, HelperCmd, HelperEv, HubCmd } from '../proto';

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
   * Opens a file or folder named in an answer (an absolute path) in his
   * editor, at `line` when given; with no editor bise knows, Finder shows it
   * (src/main/openpath.ts). Resolves false when refused (not absolute) or
   * missing. In test mode nothing opens: main prints
   * `OPEN_PATH_LINE <{path, line?, how, url?} as JSON>` on stdout instead.
   */
  readonly openPath: (path: string, opts?: { line?: number }) => Promise<boolean>;
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
  /** Which window this page is: the main window or the capsule. */
  readonly surface: Surface;
  /** The capsule's window (src/main/capsule.ts): where it shows, its size. */
  readonly capsule: CapsuleApi;
  /** Opens the main window, on `route` when given (the capsule's ⏎, a card's 'open'). */
  readonly openWindow: (route?: string) => void;
  /** Quits bise (the tray dropdown's last row, ⌘Q's twin). */
  readonly quit: () => void;
  /** Main asks this window to go to a route (openWindow while it was open); returns the unsubscribe. */
  readonly onRoute: (listener: (route: string) => void) => () => void;
  /** `bise ambient-core`, run by main (src/main/core): its events in, typed commands out. */
  readonly core: CorePort;
}

/** The core child as main sees it: starting, up (writes go through), down (restarting, or no bise). */
export type CoreState = 'starting' | 'up' | 'down';

/** What the window sends the core: bise-proto's typed commands only (a HubCmd carries its project). */
export type CoreCmd = AppCmd | HubCmd | DraftHubCmd;

/**
 * The core channel (owner: amb-core; main's side src/main/core/ipc.ts, the
 * preload's src/main/core/bridge.ts). Events come as the core wrote them,
 * any JSON object with a string `ev`: the store (src/store) narrows them to
 * bise-proto's HubEv | CoreEv and ignores unknown tags.
 */
export interface CorePort {
  /** One command to the core; dropped (with a log line in main) when the core is down. */
  readonly send: (cmd: CoreCmd) => void;
  readonly onEvent: (listener: (ev: Record<string, unknown>) => void) => () => void;
  readonly onState: (listener: (state: CoreState) => void) => () => void;
  /** The state now (a window that loads late asks once, then follows onState). */
  readonly state: () => Promise<CoreState>;
  /**
   * The core's last state events (projects, prefs, accounts, agents, cards...),
   * kept by main: a window that loads late replays them once, after it
   * listens to onEvent (IPC keeps order, so nothing is lost or older).
   * Optional so a test's fake port may leave it out (the preload always has it).
   */
  readonly snapshot?: () => Promise<Record<string, unknown>[]>;
}

/** The core channel's IPC names (amb-core). */
export const CORE_IPC = {
  cmd: 'bise:core-cmd',
  ev: 'bise:core-ev',
  state: 'bise:core-state',
  stateNow: 'bise:core-state-now',
  snapshot: 'bise:core-snapshot',
} as const;

export type Surface = 'window' | 'capsule';

/**
 * Where the capsule shows: 'top' (the spotlight he opened), 'bottom' (what
 * bise brings: a card, the talk, an answer), 'menu' (under the tray's pearl).
 */
export type CapsuleAt = 'top' | 'bottom' | 'menu';

export interface CapsuleState {
  readonly shown: boolean;
  readonly at: CapsuleAt;
  /** it has the keys (he types in it) */
  readonly keys: boolean;
  /** why it changed: asked by a page, the tray's click, it lost the keys (blur) */
  readonly why: 'asked' | 'tray' | 'blur';
}

export interface CapsuleApi {
  /** Shows it at `at`; `keys`: he types in it (the spotlight), else it never takes them (a card). */
  readonly show: (at: CapsuleAt, keys: boolean) => void;
  readonly hide: () => void;
  /** Its content's size, and the glass inside a transparent margin when there is one. */
  readonly size: (width: number, height: number, glass?: { x: number; y: number; width: number; height: number }) => void;
  /** Every change (shown, hidden, the tray's click, a blur); returns the unsubscribe. */
  readonly onState: (listener: (s: CapsuleState) => void) => () => void;
}

/** What a bise item of the application menu asks the focused window (src/main/menu.ts). */
export type MenuAction = 'settings' | 'inbox' | 'find';

/** The IPC channels between the preload and main (owner: amb-mac). */
export const IPC = {
  openExternal: 'bise:open-external',
  openPath: 'bise:open-path',
  copy: 'bise:copy',
  menu: 'bise:menu',
  /** test mode: a clipboard item of the menu, played on the window's private buffer */
  clip: 'bise:clip',
  helperEv: 'bise:helper-ev',
  helperState: 'bise:helper-state',
  helperCmd: 'bise:helper-cmd',
  capsuleShow: 'bise:capsule-show',
  capsuleHide: 'bise:capsule-hide',
  capsuleSize: 'bise:capsule-size',
  capsuleState: 'bise:capsule-state',
  openWindow: 'bise:open-window',
  route: 'bise:route',
  quit: 'bise:quit',
  /** test mode: the preload asks main for the clipboard's seed (the env's files) */
  clipSeed: 'bise:clip-seed',
} as const;

/** The preload's argument naming its window: `--bise-surface=window|capsule`. */
export const SURFACE_ARG = '--bise-surface=';

/** Test mode: the main window's first screen (amb-tools' 'show me', the checks). */
export const ROUTE_ENV = 'BISE_DESKTOP_ROUTE';

/** Test mode: the private clipboard starts with this text file's content (qa-type m_9600). */
export const TEST_CLIP_TEXT_ENV = 'BISE_DESKTOP_TEST_CLIPBOARD';
/** Test mode: the private clipboard starts with this file as a file item (a Finder copy, a screenshot). */
export const TEST_CLIP_FILE_ENV = 'BISE_DESKTOP_TEST_CLIPBOARD_FILE';

/** Test mode: the capsule's changes as stdout lines: `CAPSULE_LINE show top keys` / `CAPSULE_LINE hide`. */
export const CAPSULE_LINE = 'bise-desktop: capsule';

/** Test mode's stdout lines for effects that would leave the app. */
export const EXTERNAL_LINE = 'bise-desktop: external';
export const OPEN_PATH_LINE = 'bise-desktop: open-path';
/** Test mode (no Dock icon): the Dock's badge as `BADGE_LINE "2"` ("" = none); the window's title is main's getTitle(). */
export const BADGE_LINE = 'bise-desktop: badge';
export const COPY_LINE = 'bise-desktop: copy';

/** The environment variable that turns test mode on. */
export const TEST_ENV = 'BISE_DESKTOP_TEST';

/** In test mode: Electron's userData folder (else a fresh temp folder). */
export const TEST_USER_DATA_ENV = 'BISE_DESKTOP_USER_DATA';

/** The line main prints on stdout, in test mode, once the renderer has loaded. */
export const READY_LINE = 'bise-desktop: ready';
