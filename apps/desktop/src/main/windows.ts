// bise's windows, both on the same renderer bundle: the main window (the
// sidebar and the screens) and the capsule (capsule.ts). The preload learns
// which one it is from `--bise-surface=<surface>` (window.bise.surface), the
// renderer its first screen from the URL's hash `route=<route>`; the URL's
// query `surface=` names the window too (for tests and the guard).
//
// Test mode (BISE_DESKTOP_TEST=1), for the harness: nothing ever in his face.
// Every window renders offscreen (webPreferences.offscreen) and is never shown
// (a shown window at -30000 is clamped back onto his display: qa-type m_9500,
// measured with CGWindowList), also placed at -30000 and not focusable;
// BISE_DESKTOP_ROUTE opens the main window on that screen (amb-tools m_9576:
// 'show me' and the checks open any screen without clicks); main prints
// READY_LINE once the main window's page has loaded.
import { homedir } from 'node:os';
import { join } from 'node:path';
import { app, BrowserWindow, nativeTheme, screen, systemPreferences, type BrowserWindowConstructorOptions } from 'electron';
import { HOME_ARG, IPC, OFFSCREEN_ARG, READY_LINE, ROUTE_ENV, SURFACE_ARG, type A11y, type Surface, type WindowOpen } from '../shared/api';
import { a11yNow } from './a11y';
import { glassOf, OPAQUE, type GlassLook } from './glass';
import { readKeep, writeKeep } from './keep';
import { doubleClickOf, framesText, keepFrame, MAIN_SIZE, openFrame, parseFrames, type Screen } from './mainsize';
import { isOffscreen } from './offscreen';
import { OFF, OFF_DISPLAY, type Rect } from './place';

// -30000: off every display (place.ts, read by offscreen.ts too without Electron)
export { OFF };

/**
 * macOS's window buttons in the window's bar (bise fait mac, page native-mac §6): x 20, and 12 px
 * lights from y 20, so centred at 26 in the 52 px bar (--h-bar). Full screen hides them; the page
 * keeps their room (nothing moves).
 */
export const LIGHTS = { x: 20, y: 20 } as const;

/** The webPreferences every bise window shares. */
export function webPreferences(surface: Surface, testMode: boolean): BrowserWindowConstructorOptions['webPreferences'] {
  return {
    preload: join(__dirname, '../preload/index.js'),
    contextIsolation: true,
    sandbox: true,
    nodeIntegration: false,
    // the knob's argument only under BISE_DESKTOP_OFFSCREEN: his run's two arguments are unchanged
    additionalArguments: [`${SURFACE_ARG}${surface}`, `${HOME_ARG}${homedir()}`, ...(isOffscreen(process.env, testMode) ? [OFFSCREEN_ARG] : [])],
    ...(testMode ? { offscreen: true } : {}),
  };
}

/**
 * Loads the renderer for `surface` (its URL says which: '?surface=window' or
 * '?surface=capsule', so tests and the guard tell the two pages apart:
 * qa-type m_9675), on `route` when given ('#route=<route>'). `own`: a window of its own
 * (openWindowOf: '?own=settings'), which never keeps its route as the main window's.
 */
export function loadRenderer(win: BrowserWindow, surface: Surface, route: string | undefined, own?: WindowOpen['kind']): void {
  const hash = route === undefined || route === '' ? '' : `route=${encodeURIComponent(route)}`;
  const query: Record<string, string> = { surface, ...(own === undefined ? {} : { own }) };
  const devUrl = process.env['ELECTRON_RENDERER_URL'];
  if (!app.isPackaged && devUrl !== undefined && devUrl !== '') {
    const u = new URL(devUrl);
    for (const [k, v] of Object.entries(query)) u.searchParams.set(k, v);
    u.hash = hash;
    void win.loadURL(u.toString());
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'), { query, ...(hash === '' ? {} : { hash }) });
  }
}

/** The glass's look now: reduce transparency (a11y.ts) and the theme of its opaque ground. */
export function glassLook(a: A11y = a11yNow()): GlassLook {
  return { reduceTransparency: a.reduceTransparency, dark: nativeTheme.shouldUseDarkColors };
}

/** A bise window's glass after a change of macOS's settings (a11y.ts): vibrancy off and an opaque ground, or back. */
export function applyGlass(win: BrowserWindow, a: A11y, testMode: boolean): void {
  if (win.isDestroyed()) return;
  const g = glassOf('window', process.platform, testMode, glassLook(a));
  if (process.platform !== 'darwin' || testMode) return;
  // GlassOptions' vibrancy is the constructor's, wider than setVibrancy's (no 'appearance-based' here)
  win.setVibrancy((g.vibrancy ?? null) as Parameters<BrowserWindow['setVibrancy']>[0]);
  win.setBackgroundColor(g.backgroundColor ?? (nativeTheme.shouldUseDarkColors ? OPAQUE.dark : OPAQUE.light));
}

/** A double-click on a bise window's bar (window.bise.barDoubleClick): zoom or minimise, as his Mac says. */
export function barDoubleClick(win: BrowserWindow | null): void {
  if (win === null || win.isDestroyed()) return;
  const pref = process.platform === 'darwin' ? systemPreferences.getUserDefault('AppleActionOnDoubleClick', 'string') : '';
  const act = doubleClickOf(pref);
  if (act === 'minimize') win.minimize();
  else if (act === 'zoom') {
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  }
}

/** The main window's kept frames, in userData (mainsize.ts Frames). Owner: amb-mac. */
export const FRAMES_FILE = 'window-frame.json';

/** The off-screen runs' only screen (test mode, BISE_DESKTOP_OFFSCREEN): place.ts's OFF_DISPLAY, never a real one. */
const OFF_SCREEN: Screen = { id: 'off', ...OFF_DISPLAY };

export class MainWindow {
  private win: BrowserWindow | null = null;
  private keepTimer: NodeJS.Timeout | null = null;

  /**
   * `offscreen`: BISE_DESKTOP_OFFSCREEN (offscreen.ts): placed off every display, never shown or focused.
   * `dir`: userData, where its frame is kept (FRAMES_FILE); null keeps none.
   */
  constructor(
    private readonly testMode: boolean,
    private readonly offscreen = false,
    private readonly dir: string | null = null,
  ) {}

  /** The screens, and the one the pointer is on; an off-screen run has only OFF_SCREEN. */
  private screens(): { all: Screen[]; pointer: Screen } {
    if (this.testMode || this.offscreen) return { all: [OFF_SCREEN], pointer: OFF_SCREEN };
    const all = screen.getAllDisplays().map((d) => ({ id: String(d.id), bounds: d.bounds, workArea: d.workArea }));
    const at = String(screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).id);
    return { all, pointer: all.find((s) => s.id === at) ?? all[0] ?? OFF_SCREEN };
  }

  /** Where it opens (mainsize.ts openFrame): his kept frame, else 1280 x 720 centred on the pointer's screen. */
  private openAt(): Rect {
    const { all, pointer } = this.screens();
    const kept = this.dir === null ? parseFrames(null) : parseFrames(readKeep(join(this.dir, FRAMES_FILE)));
    return openFrame(kept, all, pointer);
  }

  /** Keeps its frame as his last one on the display it is on (not while full screen: its normal frame then). */
  private keepFrame(win: BrowserWindow): void {
    if (this.dir === null || win.isDestroyed()) return;
    const f = win.getNormalBounds();
    const id = this.testMode || this.offscreen ? OFF_SCREEN.id : String(screen.getDisplayMatching(f).id);
    const file = join(this.dir, FRAMES_FILE);
    writeKeep(file, framesText(keepFrame(parseFrames(readKeep(file)), id, f)));
  }

  /** A move or a resize, kept once it settles (a drag sends many). */
  private keepSoon(win: BrowserWindow): void {
    if (this.keepTimer !== null) clearTimeout(this.keepTimer);
    this.keepTimer = setTimeout(() => {
      this.keepTimer = null;
      if (!win.isDestroyed() && !win.isFullScreen()) this.keepFrame(win);
    }, 300);
  }

  get window(): BrowserWindow | null {
    return this.win;
  }

  /**
   * `how`: 'front' as always; after a quiet moment's update (update/run.ts) 'inactive' (on screen,
   * never taking focus from what he is in) or 'hidden' (its window wasn't shown: the Dock's click shows it).
   */
  create(route?: string, how: 'front' | 'inactive' | 'hidden' = 'front'): BrowserWindow {
    const test = this.testMode;
    const win = new BrowserWindow({
      // his kept frame, else 1280 x 720 centred on the pointer's screen; an off-screen
      // run's on OFF_DISPLAY only; its narrowest fits the sidebar and one column (mainsize.ts)
      ...this.openAt(),
      minWidth: MAIN_SIZE.minWidth,
      show: false,
      // focusable false: a stray focus() can never activate the app over his;
      // the harness draws the caret with CDP focus emulation.
      ...(test ? { focusable: false } : {}),
      // its title is the page's (what he looks at: 'perf', 'inbox'; app/title.ts), never 'bise' alone
      title: 'bise',
      // one set of controls (his try round 3): macOS's lights over the
      // sidebar's top room, no title bar and no title text; the page's
      // sidebar top and heads are its drag regions (app.css)
      ...(process.platform === 'darwin' ? { titleBarStyle: 'hiddenInset' as const, trafficLightPosition: LIGHTS } : {}),
      ...glassOf('window', process.platform, test, glassLook()),
      webPreferences: webPreferences('window', test),
    });
    this.win = win;
    win.on('closed', () => {
      if (this.win === win) this.win = null;
    });
    // where he leaves it, kept for the next launch (per display: mainsize.ts)
    win.on('move', () => {
      this.keepSoon(win);
    });
    win.on('resize', () => {
      this.keepSoon(win);
    });
    win.on('close', () => {
      if (this.keepTimer !== null) clearTimeout(this.keepTimer);
      this.keepTimer = null;
      this.keepFrame(win);
    });
    // macOS full screen hides the lights; the page keeps their room: nothing moves (bise fait mac)
    if (test) {
      win.webContents.once('did-finish-load', () => {
        process.stdout.write(`${READY_LINE}\n`);
      });
    } else {
      win.once('ready-to-show', () => {
        if (this.offscreen || how === 'hidden') return;
        if (how === 'inactive') win.showInactive();
        else win.show();
      });
    }
    loadRenderer(win, 'window', route ?? (test ? process.env[ROUTE_ENV] : undefined));
    return win;
  }

  /** In front on `route` (the capsule's ⏎, the tray's 'open bise'); never shown in test mode. */
  open(route?: string): void {
    const win = this.win;
    if (win === null) {
      this.create(route);
      return;
    }
    if (route !== undefined && route !== '') win.webContents.send(IPC.route, route);
    if (this.testMode || this.offscreen) return;
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
  }
}

/** The settings window's size (page native-mac §6: its own window, ⌘,). */
export const SETTINGS_SIZE = { width: 780, height: 600 } as const;
/** An artifact's or an agent's own window, first open. */
export const OWN_SIZE = { width: 1100, height: 760 } as const;

/** Which open own window a WindowOpen goes to: settings has one, the others one per route. Pure. */
export const ownKey = (to: WindowOpen): string => (to.kind === 'settings' ? 'settings' : `${to.kind}:${to.route}`);

/**
 * The windows of their own (window.bise.openWindow with a WindowOpen; bise fait mac): settings
 * (780 × 600, one at a time: opening it again brings it to the front on the asked page; the page
 * reopens on its last page itself, app/title.ts ownStart), an artifact, an agent's thread (one
 * window per route). The same renderer bundle as the main window, on that route, '?own=<kind>'.
 */
export class OwnWindows {
  private readonly open_ = new Map<string, BrowserWindow>();

  constructor(
    private readonly testMode: boolean,
    private readonly offscreen = false,
  ) {}

  /** Every own window open now (a11y's glass change reaches them too). */
  all(): BrowserWindow[] {
    return [...this.open_.values()].filter((w) => !w.isDestroyed());
  }

  open(to: WindowOpen): void {
    const key = ownKey(to);
    const had = this.open_.get(key);
    if (had !== undefined && !had.isDestroyed()) {
      if (to.route !== '') had.webContents.send(IPC.route, to.route);
      if (!this.testMode && !this.offscreen) {
        if (had.isMinimized()) had.restore();
        had.show();
        had.focus();
      }
      return;
    }
    const test = this.testMode;
    const size = to.kind === 'settings' ? SETTINGS_SIZE : OWN_SIZE;
    const win = new BrowserWindow({
      ...size,
      ...(to.kind === 'settings' ? { minWidth: SETTINGS_SIZE.width, minHeight: SETTINGS_SIZE.height, fullscreenable: false } : { minWidth: MAIN_SIZE.minWidth }),
      ...(test || this.offscreen ? { x: OFF, y: OFF } : {}),
      show: false,
      ...(test ? { focusable: false } : {}),
      title: 'bise',
      ...(process.platform === 'darwin' ? { titleBarStyle: 'hiddenInset' as const, trafficLightPosition: LIGHTS } : {}),
      ...glassOf('window', process.platform, test, glassLook()),
      webPreferences: webPreferences('window', test),
    });
    this.open_.set(key, win);
    win.on('closed', () => {
      if (this.open_.get(key) === win) this.open_.delete(key);
    });
    if (!test) {
      win.once('ready-to-show', () => {
        if (this.offscreen) return;
        win.show();
      });
    }
    loadRenderer(win, 'window', to.route, to.kind);
  }
}

/** What the renderer sent to openWindow: a route (or nothing) for the main window, or a WindowOpen. Pure. */
export function windowTarget(raw: unknown): { readonly main: string | undefined } | { readonly own: WindowOpen } {
  if (typeof raw === 'object' && raw !== null) {
    const r = raw as Record<string, unknown>;
    const kind = r['kind'];
    if ((kind === 'settings' || kind === 'artifact' || kind === 'agent') && typeof r['route'] === 'string') return { own: { kind, route: r['route'] } };
  }
  // settings is a window of its own (nm-settings): the capsule's 'settings' (on its last page) or a 'settings/<page>'
  if (typeof raw === 'string' && /^settings(\/|$)/u.test(raw)) return { own: { kind: 'settings', route: raw === 'settings' ? '' : raw } };
  return { main: typeof raw === 'string' ? raw : undefined };
}
