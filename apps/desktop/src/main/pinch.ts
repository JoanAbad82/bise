// The pinch forwarder put in an artifact's frame (web-pinch, his m_45441; architect m_45447): a web
// page in the app pinches as in Safari, but every page is a pages-server frame in the window's own
// webContents, so the window zooms the frame (artifacts/pagezoom.ts, useFrameNote.ts) and this
// tells it what the fingers do. guard.ts puts it in pages-server subframes only, next to its
// ESC_FORWARD; a frame off the pages server never shows in a window (guard.ts fenceFrames).
//   - a ctrl wheel (Chromium's trackpad pinch) the page didn't use: {bise: pinch, dy, x, y, w};
//     a page that pinches itself (the image viewer, a map) prevents it first and keeps it;
//   - while the window says the page is zoomed ({bise: room} from the parent, how far it can
//     still pan each way): a plain wheel that way is {bise: pan, dx, dy, w}; at an edge, or at fit,
//     the page scrolls as before.
// w is the frame's innerWidth: the window reads the frame's px against its own. Read after the
// page's own handlers ran (window, bubble); once per document. Owner: art-desktop.
import { FRAME_KINDS } from '../shared/frame';

export const PINCH_FORWARD = `(() => {
  if (window.__bisePinch) return; window.__bisePinch = true;
  const K = ${JSON.stringify({ pinch: FRAME_KINDS.pinch, pan: FRAME_KINDS.pan, room: FRAME_KINDS.room })};
  let room = null;
  addEventListener('message', (e) => {
    if (e.source !== parent || e.data === null || typeof e.data !== 'object' || e.data.bise !== K.room) return;
    const r = e.data.room;
    room = r !== null && typeof r === 'object' ? r : null;
  });
  const px = (v, mode) => (mode === 1 ? v * 16 : mode === 2 ? v * innerHeight : v);
  addEventListener('wheel', (e) => {
    if (e.defaultPrevented) return;
    let dx = px(e.deltaX, e.deltaMode), dy = px(e.deltaY, e.deltaMode);
    if (e.ctrlKey) {
      e.preventDefault();
      parent.postMessage({ bise: K.pinch, dy, x: e.clientX, y: e.clientY, w: innerWidth }, '*');
      return;
    }
    if (room === null) return;
    if (e.shiftKey && dx === 0) { dx = dy; dy = 0; }
    const way = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? room.l : room.r) : (dy < 0 ? room.u : room.d);
    if (!(way > 0.5)) return;
    e.preventDefault();
    parent.postMessage({ bise: K.pan, dx, dy, w: innerWidth }, '*');
  }, { passive: false });
})();`;
