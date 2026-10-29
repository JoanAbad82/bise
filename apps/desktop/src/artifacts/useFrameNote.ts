// The side panel's frame and the maker's composer (plan §9b, designer's pick 2, art-notes
// 8b85fec14): the viewer draws its own pill 'type to ask about it · ⌘C copy' over his selection and,
// on his click or his first typed key, posts the selection to the window (frameNote.ts reads it).
// The window then makes it a numbered attachment in the maker's composer and gives that composer the
// focus, so his next keys go there. The composer listens to ANCHOR_EVENT (thread/ThreadComposer.tsx),
// the one with `about` this artifact. The same listener hears an image's zoom (kit/office/image.js)
// and lends it the window's esc and ⌘0 while zoomed. A web page's pinch (web-pinch, his m_45441):
// the frame's forwarder (main/pinch.ts) sends {bise: pinch} and {bise: pan}, and the window zooms
// the frame element itself (pagezoom.ts: a transform and a clip, the page never reflows, its text
// zoom untouched), tells the frame its pan room, and claims esc and ⌘0 (back to fit) while
// zoomed. The view lives in this effect: one per frame, never shared with another tab; a new
// document, a resize or a new src goes back to fit. Owner: art-desktop.
import { useEffect, useState, type RefObject } from 'react';
import { FIT_MESSAGE, FRAME_KINDS, originOf, readFrame, type FrameNote } from './frameNote';
import { FIT, clampView, lookOf, panBy, pinchFactor, roomOf, zoomAt, type View } from './pagezoom';
import { claimZoomKeys } from './zoomKeys';

/** The window event between the open artifact and its maker's composer. */
export const ANCHOR_EVENT = 'bise:artifact-anchor';

/** The selection to attach in the composer about artifact `id`, with the file's name for its row. */
export interface AnchorAct {
  readonly project: string;
  readonly id: string;
  readonly note: FrameNote;
  readonly file: string;
}

export function sendAnchorAct(a: AnchorAct): void {
  window.dispatchEvent(new CustomEvent<AnchorAct>(ANCHOR_EVENT, { detail: a }));
}

/**
 * Listens to the frame `frame` (its src's origin, its contentWindow), the one reader of what it
 * says (frameNote.ts readFrame): his selections, and an image's zoom (image-pinch, architect
 * m_30628): while the viewer says fit:false, esc and ⌘0 in the window are the zoom's (zoomKeys.ts)
 * and go back to the frame as {bise: fit}; at fit they keep their own job. `file` is the
 * artifact's title for the attachment's row ('q3-forecast.xlsx · v4'). Returns the height a
 * video's player asked for ({bise: size}, kit/office/video.js): the card hugs it (designer
 * m_32762); null until one asks, and again for a new src.
 */
export function useFrameNote(frame: RefObject<HTMLIFrameElement | null>, src: string | null, project: string, id: string, file: string): number | null {
  const [hug, setHug] = useState<{ src: string | null; h: number } | null>(null);
  useEffect(() => {
    const origin = originOf(src);
    let letGo: (() => void) | null = null;
    const release = () => {
      letGo?.();
      letGo = null;
    };
    // a web page's pinch (web-pinch): the window zooms the frame itself, its view kept here, per frame
    let view: View = FIT;
    let zoomed: HTMLIFrameElement | null = null;
    const draw = (el: HTMLIFrameElement, next: View) => {
      const b = { w: el.clientWidth, h: el.clientHeight };
      view = clampView(next, b);
      const look = lookOf(view, b, parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0);
      el.style.transform = look?.transform ?? '';
      el.style.transformOrigin = look?.transformOrigin ?? '';
      el.style.clipPath = look?.clipPath ?? '';
      zoomed = look === null ? null : el;
      if (origin !== null) el.contentWindow?.postMessage({ bise: FRAME_KINDS.room, room: roomOf(view, b) }, origin);
      release();
      if (look !== null) letGo = claimZoomKeys(() => { draw(el, FIT); });
    };
    // a new document in the frame (a link to its own files) or a resized box: back to fit, as a browser
    const unzoom = () => {
      if (zoomed !== null) draw(zoomed, FIT);
    };
    const el0 = frame.current;
    el0?.addEventListener('load', unzoom);
    const sized = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(unzoom);
    if (el0 !== null) sized?.observe(el0);
    const onMessage = (e: MessageEvent) => {
      const el = frame.current;
      const win = el?.contentWindow ?? null;
      const m = readFrame(e.data, { origin: e.origin, source: e.source }, { origin, window: win });
      if (m === null) return;
      if (m.kind === 'anchor') {
        sendAnchorAct({ project, id, note: m.note, file });
        return;
      }
      if (m.kind === 'size') {
        setHug({ src, h: m.h });
        return;
      }
      if (m.kind === 'pinch' || m.kind === 'pan') {
        if (el === null) return;
        if (zoomed !== null && zoomed !== el) view = FIT;
        const b = { w: el.clientWidth, h: el.clientHeight };
        // the frame's px against the window's (they match unless a zoom factor differs)
        const k = b.w / m.w;
        draw(el, m.kind === 'pinch' ? zoomAt(view, pinchFactor(m.dy), m.x * k, m.y * k, b) : panBy(view, m.dx * k, m.dy * k, b));
        return;
      }
      release();
      if (m.fit || win === null || origin === null) return;
      letGo = claimZoomKeys(() => {
        win.postMessage(FIT_MESSAGE, origin);
      });
    };
    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
      el0?.removeEventListener('load', unzoom);
      sized?.disconnect();
      unzoom();
      release();
    };
  }, [frame, src, project, id, file]);
  return hug !== null && hug.src === src ? hug.h : null;
}
