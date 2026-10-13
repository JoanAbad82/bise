// The guard on every page (lead m_9585, qa-type m_9583: a dropped file
// opened a new normal window on his screen). For the shipped app (security)
// and for test runs (nothing in his face):
//   - no page ever opens a window: setWindowOpenHandler denies all; an http,
//     https or mailto link goes through openLink (his browser; a stdout line
//     in test mode), anything else is dropped;
//   - no page ever leaves the app's own page: will-navigate and
//     will-frame-navigate away from it are prevented (a dropped file's file://,
//     a link without a handler), web links again through openLink; the one
//     exception is a subframe on the pages server (http://127.0.0.1:<port>,
//     amb-kit m_11871: one artifact open in the window, in a sandboxed
//     iframe), never the main frame; a link that leaves it goes to openLink;
//   - no <webview>.
// In test mode also: a window that isn't offscreen is destroyed at birth, and
// every window's show/showInactive/focus are no-ops, with a 'show' that still
// happens destroying the window (the last fence).
import { app, webFrameMain, type BrowserWindow, type WebContents } from 'electron';
import { openLink } from './ipc';

export interface OwnPage {
  /** the renderer's index.html as a file:// URL (the built app) */
  readonly file: string;
  /** the dev server's origin (electron-vite dev), when it runs */
  readonly dev?: string;
}

/** Pure: is `url` the app's own page (any hash or query on it)? */
export function isOwnPage(url: string, own: OwnPage): boolean {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  if (u.protocol === 'file:') {
    const f = new URL(own.file);
    return u.pathname === f.pathname;
  }
  if (own.dev !== undefined) {
    try {
      return u.origin === new URL(own.dev).origin;
    } catch {
      return false;
    }
  }
  return false;
}

/** Pure: may a subframe show `url`? Only the local pages server: http on 127.0.0.1, any port. */
export function isPagesFrame(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' && u.hostname === '127.0.0.1' && u.username === '' && u.password === '';
  } catch {
    return false;
  }
}

/**
 * Put in an artifact's frame (his ask, main m_21531; designer m_21535): an esc the page didn't use
 * (its own field or menu prevents it) tells the window, which closes the artifact (ArtifactView's
 * useEscClosesArtifact). Read after the page's own handlers ran; once per document.
 */
export const ESC_FORWARD = `(() => {
  if (window.__biseEsc) return; window.__biseEsc = true;
  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || e.repeat || e.isComposing) return;
    setTimeout(() => { if (!e.defaultPrevented) parent.postMessage({ bise: 'esc' }, '*'); }, 0);
  }, true);
})();`;

function guardContents(wc: WebContents, own: OwnPage, testMode: boolean): void {
  wc.setWindowOpenHandler(({ url }) => {
    void openLink(url, testMode);
    return { action: 'deny' };
  });
  const stay = (e: { preventDefault: () => void; isMainFrame?: boolean }, url: string): void => {
    if (isOwnPage(url, own)) return;
    if (e.isMainFrame === false && isPagesFrame(url)) return;
    e.preventDefault();
    void openLink(url, testMode);
  };
  wc.on('will-navigate', (e) => {
    stay(e, e.url);
  });
  wc.on('will-frame-navigate', (e) => {
    stay(e, e.url);
  });
  wc.on('will-redirect', (e) => {
    stay(e, e.url);
  });
  wc.on('will-attach-webview', (e) => {
    e.preventDefault();
  });
  // an artifact's page (a pages-server subframe): its esc reaches the window (ESC_FORWARD)
  wc.on('did-frame-finish-load', (_e, isMainFrame, pid, rid) => {
    if (isMainFrame) return;
    const f = webFrameMain.fromId(pid, rid);
    if (f === undefined || !isPagesFrame(f.url)) return;
    f.executeJavaScript(ESC_FORWARD).catch(() => undefined);
  });
}

function fenceWindow(win: BrowserWindow): void {
  if (!win.webContents.isOffscreen()) {
    process.stderr.write('guard: a window that is not offscreen in a test run: destroyed\n');
    win.destroy();
    return;
  }
  const no = (): void => undefined;
  win.show = no;
  win.showInactive = no;
  win.focus = no;
  win.on('show', () => {
    process.stderr.write('guard: a window showed in a test run: destroyed\n');
    win.destroy();
  });
}

/** Before any window: every page of the app is guarded from birth. */
export function installGuard(own: OwnPage, testMode: boolean): void {
  app.on('web-contents-created', (_e, wc) => {
    guardContents(wc, own, testMode);
  });
  if (testMode) {
    app.on('browser-window-created', (_e, win) => {
      fenceWindow(win);
    });
  }
}
