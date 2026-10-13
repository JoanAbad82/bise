// What the preload puts on `window.bise`: the renderer's only door to Electron's
// main process (contextIsolation on, sandboxed renderer, no Node in the page).
// Shared by the preload (which builds it) and the renderer (which reads it), so
// the two can't drift. Owner: amb-core (the core channel lands here next);
// other chunks ask amb-core to add a member.

import type { AppCmd, DraftHubCmd, HelperCmd, HelperEv, HubCmd } from '../proto';

export interface BiseApi {
  /** process.platform of the main process ('darwin', 'win32', 'linux'). */
  readonly platform: string;
  /**
   * His home folder, a constant read once (main's os.homedir(); the test home
   * in a test run), for showing paths as ~/… (amb-win's shortPath).
   */
  readonly home: string;
  /** Only in an off-screen run (OFFSCREEN_ARG): what a page must not do there (offscreen.ts). Absent in his run. */
  readonly offscreen?: true;
  /** True when the app runs in test mode (BISE_DESKTOP_TEST=1): off-display window, no Dock icon. */
  readonly test: boolean;
  /**
   * The app's own update (bar S.6, src/main/update): its state now and on
   * every change. 'ready': the window shows 'bise <version> is ready ·
   * restart'; 'went_bad': the new app didn't start right last time, 'go
   * back'. Nothing installs without his click.
   */
  readonly update: {
    readonly now: () => Promise<UpdateState>;
    readonly onState: (listener: (s: UpdateState) => void) => () => void;
    /** his click on 'restart': swap and start again, reopening `route` (the window's screen); false when nothing is ready */
    readonly install: (route?: string) => Promise<boolean>;
    /** his click on 'go back' (went_bad): the previous app again */
    readonly revert: () => Promise<boolean>;
  };
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
   * His folder pick (macOS's open panel: folders only, 'New Folder' allowed,
   * starting in his home, attached to the asking window); null when he
   * cancels. Test mode never opens a panel: BISE_DESKTOP_TEST_PICK_FOLDER
   * (an absolute path) is the answer at once, else null.
   */
  readonly pickFolder: () => Promise<string | null>;
  /**
   * macOS's Quick Look on a file, from the asking window (its own panel);
   * true when shown. Only a path under his home or a project folder; test
   * mode prints QUICKLOOK_LINE <path> instead.
   */
  readonly quickLook: (path: string) => Promise<boolean>;
  /** The file selected in a Finder window; same fence; test mode prints REVEAL_LINE <path>. */
  readonly showInFinder: (path: string) => Promise<boolean>;
  /**
   * A file's 16 px system icon as a data URL (a file chip, designer m_21765); same fence; null
   * when there is none, and always in test mode (the chip's ▯ glyph instead).
   */
  readonly fileIcon: (path: string) => Promise<string | null>;
  /**
   * An image he pasted or dropped (its bytes) put in bise's image store, the
   * TUI's (src/main/images.ts): its absolute path for a send's files, so the
   * model sees it (R41). null: not a PNG, JPEG, GIF or WebP, too big, or unwritable.
   */
  readonly saveImage: (bytes: Uint8Array) => Promise<string | null>;
  /** A dropped or Finder-copied file's absolute path (Electron's webUtils); '' for one made in the page (a screenshot paste). */
  readonly filePath: (file: File) => string;
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
  /**
   * fn fn while this window is in front (lead m_16973): main sends it here instead of the
   * capsule's hands-free talk; the page turns voice mode on for its agent in view, as ctrl+r
   * twice does. Returns the unsubscribe.
   */
  readonly onFnVoice: (listener: () => void) => () => void;
  /** The helper's last state events (hello, front, perms, quiet), for a window that just opened. */
  readonly helperState: () => Promise<HelperEv[]>;
  /** A command to the helper (read_context, perm, shot, route, own_mic, config; never quit). */
  readonly helper: (cmd: HelperCmd) => void;
  /** Which window this page is: the main window or the capsule. */
  readonly surface: Surface;
  /**
   * This surface's keep on disk (amb-win, src/app/keep.ts + src/main/keep.ts): what he typed or
   * opened, read once at start (sync), written whole at each change. Optional: a page outside
   * Electron (a lab) keeps it in memory.
   */
  readonly keep?: { readonly read: () => string | null; readonly write: (text: string) => void };
  /** The capsule's window (src/main/capsule.ts): where it shows, its size. */
  readonly capsule: CapsuleApi;
  /**
   * The macOS notifications' permission (the inbox's permission row, designer m_14211): its state
   * now and on every change, ask() (macOS's own alert follows), and System Settings › Notifications.
   */
  readonly notify: {
    readonly state: () => Promise<NotifyAuth>;
    readonly onState: (listener: (s: NotifyAuth) => void) => () => void;
    readonly ask: () => Promise<NotifyAuth>;
    readonly openSettings: () => void;
  };
  /** Voice mode's failed line (designer's voice-window (1)): 'open settings' opens System Settings ›
   *  Privacy › Microphone (test mode: EXTERNAL_LINE with its URL on stdout, nothing opens). */
  readonly voice: {
    readonly openMicSettings: () => void;
  };
  /** Opens the main window, on `route` when given (the capsule's ⏎, a card's 'open'). */
  readonly openWindow: (route?: string) => void;
  /** Quits bise (the tray dropdown's last row, ⌘Q's twin). */
  readonly quit: () => void;
  /** Main asks this window to go to a route (openWindow while it was open); returns the unsubscribe. */
  readonly onRoute: (listener: (route: string) => void) => () => void;
  /**
   * This window in macOS full screen or not: called at once with the state now, then on every
   * enter / leave (lead m_15020: macOS hides the lights in full screen, so the sidebar's 40 px
   * room for them goes). Returns the unsubscribe.
   */
  readonly onFullScreen: (listener: (full: boolean) => void) => () => void;
  /** `bise ambient-core`, run by main (src/main/core): its events in, typed commands out. */
  readonly core: CorePort;
  /** The terminal panel's shells (src/main/term): one `bise pty` per project, kept while hidden. */
  readonly term: TermApi;
}

/** What open answers: the shell's id and, for a shell that was already running, its screen now. */
export type TermOpened = { readonly id: string; readonly screen: Uint8Array | null } | { readonly error: string };

/**
 * The terminal panel (bar T W25/V13/K26/M16). A shell runs in its project's
 * folder (main finds it in the core's projects rows), kept while the panel is
 * hidden or the window closed. Open again: `screen` holds escape sequences
 * that redraw it as it is (reset the terminal, write them), then `onData`
 * goes on from there. Its id is the project's.
 */
export interface TermApi {
  readonly open: (project: string, cols: number, rows: number) => Promise<TermOpened>;
  /** keys, a paste (UTF-8; ≤ 64 kB a call) */
  readonly write: (id: string, data: string) => void;
  /** the panel's size in cells (clamped 2..500 × 1..200) */
  readonly resize: (id: string, cols: number, rows: number) => void;
  /** ends the shell (onExit follows) */
  readonly kill: (id: string) => void;
  /** the shells' output, every 16 ms at most; returns the unsubscribe */
  readonly onData: (listener: (id: string, bytes: Uint8Array) => void) => () => void;
  /** a shell ended (its code; null for a signal); the next open starts a new one */
  readonly onExit: (listener: (id: string, code: number | null) => void) => () => void;
}

/** The core child as main sees it: starting, up (writes go through), down (restarting, or no bise). */
export type CoreState = 'starting' | 'up' | 'down';

/**
 * How the core's last run ended (bar S.5 'its last log line', O.4 crash;
 * src/main/core/exit.ts), sent with every core state after its first end.
 * - how: 'clean' (exit 0), 'code' (exit `code`), 'signal' (killed by
 *   `signal`), 'failed' (it could not start: `last` says why);
 * - crash: a fatal signal (SIGSEGV, SIGABRT, SIGBUS...) or a Rust panic;
 * - last: its last stderr line of that run (a panic's message), trimmed,
 *   at most 300 characters, never a key or a token; '' when it said nothing;
 * - log: for a crash, the core's log (the report): CorePort.revealLog shows
 *   it in Finder, window.bise.copy copies its path.
 */
export interface CoreExit {
  readonly how: 'clean' | 'code' | 'signal' | 'failed';
  readonly code: number | null;
  readonly signal: string | null;
  readonly crash: boolean;
  readonly last: string;
  readonly log: string | null;
  readonly at_ms: number;
  /** why, in designer's words ('core exited with signal 11'): main's reasonOf */
  readonly reason?: string;
  /** crashes in the last 10 min, this one included (designer's 'keeps crashing: 3 times in 10 min') */
  readonly crashes?: number;
  /** main stopped restarting it (3 crashes in 10 min); 'start bise' (core.start) tries once more */
  readonly stopped?: boolean;
  /** the crash report bise wrote for this crash (~/.bise/reports/crash-HH-MM.md), never sent anywhere */
  readonly report?: string | null;
}

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
  /** The core's state, with how its last run ended (null until it ended once). */
  readonly onState: (listener: (state: CoreState, exit: CoreExit | null) => void) => () => void;
  /** The state now (a window that loads late asks once, then follows onState). */
  readonly state: () => Promise<CoreState>;
  /** How its last run ended, now (null: it never ended). Optional for a test's fake port. */
  readonly lastExit?: () => Promise<CoreExit | null>;
  /** Shows the core's log in Finder (a crash's report); in test mode a CORE_REVEAL_LINE on stdout. */
  readonly revealLog?: () => void;
  /** 'start bise': starts the core again after main stopped restarting it; a no-op while it is up or starting. */
  readonly start?: () => void;
  /** The last crash report bise wrote (designer's 'show the report'), or null. */
  readonly report?: () => Promise<CrashReport | null>;
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
  exitNow: 'bise:core-exit-now',
  revealLog: 'bise:core-reveal-log',
  /** 'start bise' after main stopped restarting it (a no-op while it is up or starting) */
  start: 'bise:core-start',
  /** the last crash report: {path, text} or null */
  report: 'bise:core-report',
} as const;

/** A crash report bise wrote (src/main/core/report.ts): never sent anywhere, his to read or share. */
export interface CrashReport {
  readonly path: string;
  readonly text: string;
}

/** Test mode: revealLog prints `CORE_REVEAL_LINE <log path>` instead of opening Finder. */
export const CORE_REVEAL_LINE = 'bise-desktop: reveal';

/** Test mode: the one 'bise crashed · open bise' notification when no window shows (never posted). */
export const CORE_CRASH_NOTE_LINE = 'bise-desktop: crash-note';

export type Surface = 'window' | 'capsule';

/**
 * Where the capsule shows: 'top' (the spotlight he opened), 'bottom' (what
 * bise brings: a card, the talk, an answer), 'menu' (under the tray's pearl).
 */
export type CapsuleAt = 'top' | 'bottom' | 'menu';

/** How a shown capsule grows (CapsuleApi.show): 'down' from a pinned top-left, its glass at most `maxHeight` px. */
export interface CapsuleFit {
  readonly grow: 'down';
  readonly maxHeight: number;
}

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
  /**
   * `fit`: a view that grows while shown and must not move (the voice view,
   * lead m_11532): at 'bottom' it is placed once so that `maxHeight` of glass
   * would still end above the Dock, then its top-left stays and it grows down.
   */
  readonly show: (at: CapsuleAt, keys: boolean, fit?: CapsuleFit) => void;
  readonly hide: () => void;
  /** Its content's size, and the glass inside a transparent margin when there is one. */
  readonly size: (width: number, height: number, glass?: { x: number; y: number; width: number; height: number }) => void;
  /** Every change (shown, hidden, the tray's click, a blur); returns the unsubscribe. */
  readonly onState: (listener: (s: CapsuleState) => void) => () => void;
}

/** What a bise item of the application menu asks the focused window (src/main/menu.ts). */
export type MenuAction = 'settings' | 'inbox' | 'find' | 'terminal';

/** The IPC channels between the preload and main (owner: amb-mac). */
export const IPC = {
  openExternal: 'bise:open-external',
  openPath: 'bise:open-path',
  pickFolder: 'bise:pick-folder',
  quickLook: 'bise:quick-look',
  showInFinder: 'bise:show-in-finder',
  fileIcon: 'bise:file-icon',
  saveImage: 'bise:save-image',
  copy: 'bise:copy',
  menu: 'bise:menu',
  /** test mode: a clipboard item of the menu, played on the window's private buffer */
  clip: 'bise:clip',
  helperEv: 'bise:helper-ev',
  helperState: 'bise:helper-state',
  helperCmd: 'bise:helper-cmd',
  /** main -> the window in front: fn fn there is voice mode (src/main/helper/fnroute.ts) */
  fnVoice: 'bise:fn-voice',
  capsuleShow: 'bise:capsule-show',
  capsuleHide: 'bise:capsule-hide',
  capsuleSize: 'bise:capsule-size',
  capsuleState: 'bise:capsule-state',
  notifyState: 'bise:notify-state',
  notifyAsk: 'bise:notify-ask',
  notifySettings: 'bise:notify-settings',
  /** a window -> main: open System Settings › Privacy › Microphone (voice mode's failed line) */
  micSettings: 'bise:mic-settings',
  /** main -> a window: it entered (true) or left (false) full screen; invoke: the state now */
  fullScreen: 'bise:full-screen',
  openWindow: 'bise:open-window',
  route: 'bise:route',
  quit: 'bise:quit',
  termOpen: 'bise:term-open',
  termWrite: 'bise:term-write',
  termResize: 'bise:term-resize',
  termKill: 'bise:term-kill',
  termData: 'bise:term-data',
  termExit: 'bise:term-exit',
  /** test mode: the preload asks main for the clipboard's seed (the env's files) */
  clipSeed: 'bise:clip-seed',
  /** test mode: main puts a new seed on every window's private clipboard (TEST_CLIP_HOOK) */
  clipSet: 'bise:clip-set',
  /** test mode: a window says it took that seed (its nonce), so the hook answers after it */
  clipSetDone: 'bise:clip-set-done',
  updateState: 'bise:update-state',
  updateNow: 'bise:update-now',
  updateInstall: 'bise:update-install',
  updateRevert: 'bise:update-revert',
  /** the renderer's keep on disk (amb-win, src/main/keep.ts): read (sync) at start, write each change */
  keepRead: 'bise:keep-read',
  keepWrite: 'bise:keep-write',
} as const;

/**
 * The app's own update (bar S.6): none; downloading the newer app the core
 * named; ready for his click; failed (why, for the log line); went_bad: the
 * swapped-in app was started and never said it ran fine, so 'go back'.
 */
export type UpdateState =
  | { readonly state: 'none' }
  | { readonly state: 'downloading'; readonly version: string }
  | { readonly state: 'ready'; readonly version: string }
  | { readonly state: 'failed'; readonly version: string; readonly why: string }
  | { readonly state: 'went_bad'; readonly version: string };

/** Test mode: the folder window.bise.pickFolder answers (an absolute path), never a panel. */
export const TEST_PICK_FOLDER_ENV = 'BISE_DESKTOP_TEST_PICK_FOLDER';

/** Test mode: the fake .app (inside the test HOME) the updater swaps; never his bundle. */
export const UPDATE_TARGET_ENV = 'BISE_DESKTOP_UPDATE_TARGET';

/** The preload's argument naming its window: `--bise-surface=window|capsule`. */
export const SURFACE_ARG = '--bise-surface=';

/** The preload's argument with his home folder (main's os.homedir(): the test home under test): `--bise-home=<path>`. */
export const HOME_ARG = '--bise-home=';

/**
 * The preload's argument under BISE_DESKTOP_OFFSCREEN only (amb-tools' as-he-does runs): the pages
 * then see window.bise.offscreen = true. His own run never gets it, so his window.bise has no
 * 'offscreen' at all.
 */
export const OFFSCREEN_ARG = '--bise-offscreen';

/** Test mode: the main window's first screen (amb-tools' 'show me', the checks). */
export const ROUTE_ENV = 'BISE_DESKTOP_ROUTE';

/** Test mode: the private clipboard starts with this text file's content (qa-type m_9600). */
export const TEST_CLIP_TEXT_ENV = 'BISE_DESKTOP_TEST_CLIPBOARD';
/** Test mode: the private clipboard starts with this file as a file item (a Finder copy, a screenshot). */
export const TEST_CLIP_FILE_ENV = 'BISE_DESKTOP_TEST_CLIPBOARD_FILE';
/**
 * Test mode only: a function on main's globalThis that puts a new seed on every window's private
 * clipboard while the app runs, so a check stages an image (or text) for a real ⌘V at any time:
 * `app.evaluate(({}) => globalThis.__biseTestClip({ file: '/abs/shot.png' }))` (or `{ text }`).
 * Resolves true once every window has it (so a ⌘V right after pastes it), false when the seed
 * can't be read or a window doesn't answer within 2 s. Never defined outside test mode.
 */
export const TEST_CLIP_HOOK = '__biseTestClip';

/** Test mode: the capsule's changes as stdout lines: `CAPSULE_LINE show top keys` / `CAPSULE_LINE hide`. */
export const CAPSULE_LINE = 'bise-desktop: capsule';

/** Test mode's stdout lines for effects that would leave the app. */
export const EXTERNAL_LINE = 'bise-desktop: external';
/** System Settings › Privacy › Microphone (window.bise.voice.openMicSettings). */
export const MIC_SETTINGS_URL = 'x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone';
export const OPEN_PATH_LINE = 'bise-desktop: open-path';

/** Test mode: window.bise.quickLook's line on stdout, `QUICKLOOK_LINE <path>`. */
export const QUICKLOOK_LINE = 'bise-desktop: quicklook';
/** Test mode: window.bise.showInFinder's line on stdout, `REVEAL_LINE <path>`. */
export const REVEAL_LINE = 'bise-desktop: reveal';
/** Test mode (no Dock icon): the Dock's badge as `BADGE_LINE "2"` ("" = none); the window's title is main's getTitle(). */
export const BADGE_LINE = 'bise-desktop: badge';
export const COPY_LINE = 'bise-desktop: copy';
/** Test mode: a shell's life as `TERM_LINE "<id>" open` / `TERM_LINE "<id>" exit <code|null>`. */
export const TERM_LINE = 'bise-desktop: term';

/** The environment variable that turns test mode on. */
export const TEST_ENV = 'BISE_DESKTOP_TEST';

/** In test mode: Electron's userData folder (else a fresh temp folder). */
export const TEST_USER_DATA_ENV = 'BISE_DESKTOP_USER_DATA';

/** The line main prints on stdout, in test mode, once the renderer has loaded. */
export const READY_LINE = 'bise-desktop: ready';
/** Test mode: the update's state on each change (`<line> <json>`). */
export const UPDATE_LINE = 'bise-desktop: update';

/**
 * Whether his questions may reach him as macOS notifications: 'never' asked yet, 'asked' (macOS
 * answers at the first notification; the app can't read it yet), 'on', 'off' (System Settings).
 */
export type NotifyAuth = 'never' | 'asked' | 'on' | 'off';

/** Test mode: the macOS notifications are never posted, each step is this line + JSON (src/main/notify). */
export const NOTIFY_LINE = 'bise-desktop: notify';
/** Test mode: the app would start again from this bundle now (never done in a test). */
export const RELAUNCH_LINE = 'bise-desktop: relaunch';
