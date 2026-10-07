// The capsule: one panel window over every app, full-screen ones included,
// that never activates bise (the reset's settle-early question, lead m_9434).
// On macOS it is a 'panel' BrowserWindow (Electron adds
// NSWindowStyleMaskNonactivatingPanel): it can take the keys for the
// spotlight without bringing bise in front of his app, and floats on every
// Space and over full-screen apps (setVisibleOnAllWorkspaces with
// visibleOnFullScreen, the screen-saver level). A card shows with
// showInactive (never the keys); the spotlight with show (the keys, still not
// activating the app); it hides when it loses the keys. Its page is the same
// renderer, surface 'capsule' (window.bise.capsule drives it). Whether macOS
// really keeps his app active is qa-native's VM check: it can't be proven on
// his screen.
//
// Test mode: offscreen, never shown, on a display far from his; show/hide
// only change its state and print CAPSULE_LINE on stdout.
import { BrowserWindow, ipcMain, screen, type Tray } from 'electron';
import { CAPSULE_LINE, IPC, type CapsuleAt, type CapsuleFit, type CapsuleState } from '../shared/api';
import { glassOf } from './glass';
import { capsuleBounds, fitBounds, OFF_DISPLAY, pinnedBounds, pinOf, type Anchor, type DisplayBox, type Pin, type Rect } from './place';
import { loadRenderer, OFF, webPreferences } from './windows';

const START = { width: 640, height: 120 };

export class Capsule {
  private readonly win: BrowserWindow;
  private size: { width: number; height: number } = START;
  private glass: Rect | undefined;
  /** where the glass was put at show: it stays there while shown (place.ts) */
  private pin: Pin | null = null;
  /** this show grows down from a pinned top-left (the voice view) */
  private fit: CapsuleFit | null = null;
  private state: CapsuleState = { shown: false, at: 'bottom', keys: false, why: 'asked' };
  tray: Tray | null = null;

  constructor(private readonly testMode: boolean) {
    const mac = process.platform === 'darwin';
    const win = new BrowserWindow({
      ...START,
      ...(testMode ? { x: OFF, y: OFF, focusable: false } : {}),
      show: false,
      frame: false,
      transparent: true,
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      skipTaskbar: true,
      hasShadow: false,
      alwaysOnTop: true,
      ...(mac ? { type: 'panel' } : { type: 'toolbar' }),
      // macOS: the vibrancy is the glass (glass.ts), the window is the glass
      ...glassOf('capsule', process.platform, testMode),
      title: 'bise capsule',
      webPreferences: webPreferences('capsule', testMode),
    });
    if (!testMode) {
      win.setAlwaysOnTop(true, 'screen-saver');
      win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true, skipTransformProcessType: true });
    }
    win.on('blur', () => {
      if (this.state.shown && this.state.keys) this.hide('blur');
    });
    this.win = win;
    loadRenderer(win, 'capsule', undefined);
  }

  get window(): BrowserWindow {
    return this.win;
  }

  show(at: CapsuleAt, keys: boolean, why: CapsuleState['why'] = 'asked', fit: CapsuleFit | null = null): void {
    this.state = { shown: true, at, keys, why };
    // placed (and kept inside the screen) once, here; then pinned
    this.pin = null;
    this.fit = at === 'bottom' ? fit : null;
    this.place();
    if (this.testMode) {
      process.stdout.write(`${CAPSULE_LINE} show ${at}${keys ? ' keys' : ''}\n`);
    } else if (keys) {
      this.win.show();
    } else {
      this.win.showInactive();
    }
    this.tell();
  }

  hide(why: CapsuleState['why'] = 'asked'): void {
    if (!this.state.shown) return;
    this.state = { ...this.state, shown: false, keys: false, why };
    this.pin = null;
    if (this.testMode) process.stdout.write(`${CAPSULE_LINE} hide\n`);
    else this.win.hide();
    this.tell();
  }

  resize(width: number, height: number, glass?: Rect): void {
    if (!(width > 0 && height > 0 && width < 10_000 && height < 10_000)) return;
    this.size = { width, height };
    this.glass = glass;
    this.place();
  }

  /** the tray's click: its dropdown under the pearl, again: gone */
  toggleMenu(): void {
    if (this.state.shown && this.state.at === 'menu') this.hide('tray');
    else this.show('menu', true, 'tray');
  }

  private display(): DisplayBox {
    if (this.testMode) return OFF_DISPLAY;
    const d = this.state.at === 'menu' && this.tray !== null ? screen.getDisplayMatching(this.tray.getBounds()) : screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
    return { bounds: d.bounds, workArea: d.workArea };
  }

  private anchor(): Anchor {
    const at = this.state.at;
    if (at === 'menu') {
      const icon = this.tray?.getBounds();
      // no tray (a test run, or none on this OS): the top of the display
      return icon === undefined || this.testMode ? { at: 'top' } : { at: 'menu', icon };
    }
    return { at };
  }

  /** At show: centred on its anchor, inside the screen, and pinned. Shown: a new size keeps the glass's left and anchored edge. */
  private place(): void {
    if (this.pin !== null) {
      this.win.setBounds(pinnedBounds(this.size, this.pin, this.glass));
      return;
    }
    const anchor = this.anchor();
    const fit = this.fit;
    const b = fit !== null ? fitBounds(this.size, this.display(), this.glass, fit.maxHeight) : capsuleBounds(this.size, this.display(), anchor, this.glass);
    this.win.setBounds(b);
    // a fit view keeps its top-left (it grows down), the others their anchored edge
    if (this.state.shown) this.pin = pinOf(b, this.size, fit !== null ? { at: 'top' } : anchor, this.glass);
  }

  private tell(): void {
    this.win.webContents.send(IPC.capsuleState, this.state);
  }
}

/** The capsule's IPC: any window may show, hide or size it. */
export function installCapsuleIpc(c: Capsule): void {
  const ats: ReadonlySet<string> = new Set(['top', 'bottom', 'menu']);
  ipcMain.on(IPC.capsuleShow, (_e, at: unknown, keys: unknown, fit: unknown) => {
    if (typeof at === 'string' && ats.has(at)) c.show(at as CapsuleAt, keys === true, 'asked', isFit(fit) ? fit : null);
  });
  ipcMain.on(IPC.capsuleHide, () => {
    c.hide();
  });
  ipcMain.on(IPC.capsuleSize, (_e, width: unknown, height: unknown, glass: unknown) => {
    if (typeof width !== 'number' || typeof height !== 'number') return;
    c.resize(width, height, isRect(glass) ? glass : undefined);
  });
}

function isFit(v: unknown): v is CapsuleFit {
  if (typeof v !== 'object' || v === null) return false;
  const f = v as Record<string, unknown>;
  return f['grow'] === 'down' && typeof f['maxHeight'] === 'number' && f['maxHeight'] > 0 && f['maxHeight'] < 10_000;
}

function isRect(v: unknown): v is Rect {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  return ['x', 'y', 'width', 'height'].every((k) => typeof r[k] === 'number');
}
