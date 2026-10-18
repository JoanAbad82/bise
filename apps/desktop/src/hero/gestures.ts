// The visitor's hands on the hero's town (bims-film v4 « quand le visiteur prend la main », designer
// m_30837): a mouse drag pans (the cursor a grab hand), two fingers pan and pinch, a trackpad's pinch
// (a ctrl / ⌘ wheel) zooms around the pointer, a click or a tap on a bim follows it, a double click
// or esc goes back to the whole town, the page's + and − zoom round the frame's middle. Never the
// page's scroll: a plain wheel and one finger scroll the page. The film owns the camera; this turns
// events into cams.
// Owner: hero-town.
import type { Cam } from '../bims/zoom';
import { holdCam } from './director';

/** a drag shorter than this (css px) is still a click */
const DRAG_PX = 4;
/** a pinch's wheel pixel as a zoom (Chromium sends a trackpad pinch as a ctrl wheel) */
const PINCH_RATE = 0.01;

type Bim = { readonly id: string; readonly name: string };

export interface Hands {
  cam(): Cam;
  /** he moved the camera there (a pan, a zoom): it is his now */
  take(cam: Cam, follow?: { office: string; name: string } | null): void;
  pick(x: number, y: number): Bim | null;
  hover(b: Bim | null): void;
  follow(b: { office: string; name: string }): void;
  wide(): void;
  /** his pointer came onto the town or left it (the film waits while it is on) */
  inside(on: boolean): void;
}

export interface Gestures {
  zoomBy(factor: number): void;
  dispose(): void;
}

/** The cam zoomed by `factor` keeping the frame's point (fx, fy) (fractions) where it is. Pure. */
export function zoomAround(c: Cam, factor: number, fx: number, fy: number): Cam {
  const zoom = c.zoom * factor;
  const pu = c.u + (fx - 0.5) / c.zoom;
  const pv = c.v + (fy - 0.5) / c.zoom;
  const next = holdCam({ zoom, u: pu - (fx - 0.5) / zoom, v: pv - (fy - 0.5) / zoom });
  return holdCam({ zoom: next.zoom, u: pu - (fx - 0.5) / next.zoom, v: pv - (fy - 0.5) / next.zoom });
}

/** The cam moved so the town follows the fingers by (dx, dy) of the frame's size (fractions). Pure. */
export function panAround(c: Cam, dx: number, dy: number): Cam {
  return holdCam({ zoom: c.zoom, u: c.u - dx / c.zoom, v: c.v - dy / c.zoom });
}

export function makeGestures(box: HTMLElement, h: Hands): Gestures {
  let down: { id: number; x: number; y: number; lx: number; ly: number; moved: boolean } | null = null;
  let two: { mx: number; my: number; d: number } | null = null;
  const rect = () => box.getBoundingClientRect();
  const local = (e: { clientX: number; clientY: number }) => {
    const r = rect();
    return { x: e.clientX - r.left, y: e.clientY - r.top, w: Math.max(1, r.width), h: Math.max(1, r.height) };
  };
  const cursor = (c: string): void => {
    box.style.cursor = c;
  };
  cursor('grab');

  // the mouse (and a pen): a drag pans; a click on a bim follows it; no button: what is under it
  const onDown = (e: PointerEvent): void => {
    if (e.pointerType === 'touch' || e.button !== 0) return;
    if ((e.target as Element | null)?.closest('button, a') != null) return;
    box.setPointerCapture(e.pointerId);
    down = { id: e.pointerId, x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, moved: false };
  };
  const onMove = (e: PointerEvent): void => {
    if (e.pointerType === 'touch') return;
    const l = local(e);
    if (down === null || down.id !== e.pointerId) {
      const b = h.pick(l.x, l.y);
      cursor(b === null ? 'grab' : 'pointer');
      h.hover(b);
      return;
    }
    if (!down.moved && Math.hypot(e.clientX - down.x, e.clientY - down.y) < DRAG_PX) return;
    if (!down.moved) cursor('grabbing');
    down.moved = true;
    h.take(panAround(h.cam(), (e.clientX - down.lx) / l.w, (e.clientY - down.ly) / l.h));
    down.lx = e.clientX;
    down.ly = e.clientY;
  };
  const onUp = (e: PointerEvent): void => {
    if (down === null || down.id !== e.pointerId) return;
    const d = down;
    down = null;
    cursor('grab');
    if (d.moved || e.type === 'pointercancel') return;
    const l = local(e);
    const b = h.pick(l.x, l.y);
    if (b !== null) h.follow({ office: b.id, name: b.name });
  };

  // touch: one finger is the page's (it scrolls; a tap on a bim follows it), two fingers are the town's (pan and pinch)
  const mid = (t: TouchList) => {
    const a = t[0];
    const b = t[1];
    if (!a || !b) return null;
    return { mx: (a.clientX + b.clientX) / 2, my: (a.clientY + b.clientY) / 2, d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) };
  };
  const onTouch = (e: TouchEvent): void => {
    if (e.touches.length !== 2) {
      two = null;
      return;
    }
    e.preventDefault();
    const m = mid(e.touches);
    if (m === null) return;
    if (two !== null && e.type === 'touchmove') {
      const r = rect();
      const w = Math.max(1, r.width);
      const hh = Math.max(1, r.height);
      let c = panAround(h.cam(), (m.mx - two.mx) / w, (m.my - two.my) / hh);
      if (two.d > 0 && m.d > 0) c = zoomAround(c, m.d / two.d, (m.mx - r.left) / w, (m.my - r.top) / hh);
      h.take(c);
    }
    two = m;
  };
  const onTap = (e: MouseEvent): void => {
    if ((e as PointerEvent).pointerType !== 'touch') return;
    const l = local(e);
    const b = h.pick(l.x, l.y);
    if (b !== null) h.follow({ office: b.id, name: b.name });
  };

  // a plain wheel scrolls the page: never caught; ctrl / ⌘ (a trackpad's pinch) zooms
  const onWheel = (e: WheelEvent): void => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const l = local(e);
    const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    h.take(zoomAround(h.cam(), Math.exp(-dy * PINCH_RATE), l.x / l.w, l.y / l.h));
  };
  const onDbl = (e: MouseEvent): void => {
    e.preventDefault();
    h.wide();
  };
  let inside = false;
  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && inside) h.wide();
  };
  const onEnter = (): void => {
    inside = true;
    h.inside(true);
  };
  const onLeave = (): void => {
    inside = false;
    h.inside(false);
    h.hover(null);
  };
  const on: [EventTarget, string, EventListener, AddEventListenerOptions?][] = [
    [box, 'pointerdown', onDown as EventListener],
    [box, 'pointermove', onMove as EventListener],
    [box, 'pointerup', onUp as EventListener],
    [box, 'pointercancel', onUp as EventListener],
    [box, 'touchstart', onTouch as EventListener, { passive: false }],
    [box, 'touchmove', onTouch as EventListener, { passive: false }],
    [box, 'touchend', onTouch as EventListener],
    [box, 'click', onTap as EventListener],
    [box, 'wheel', onWheel as EventListener, { passive: false }],
    [box, 'dblclick', onDbl as EventListener],
    [box, 'pointerenter', onEnter],
    [box, 'pointerleave', onLeave],
    [window, 'keydown', onKey as EventListener],
  ];
  for (const [t, k, f, o] of on) t.addEventListener(k, f, o);

  return {
    zoomBy(factor) {
      h.take(zoomAround(h.cam(), factor, 0.575, 0.5));
    },
    dispose() {
      for (const [t, k, f] of on) t.removeEventListener(k, f);
      box.style.cursor = '';
    },
  };
}
