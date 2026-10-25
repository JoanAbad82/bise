// The plugins place's hero: the room, his plugins' objects on a slab with two low walls (spots.ts
// plans it, render.ts draws it behind import('./render')). A 2.2:1 banner as wide as the head; a
// new plugin's object drops in, cut under reduced motion; no frame while nothing changes. No WebGL
// (a test, a lost GPU): `fallback` (the plain icons on a floor). Owner: plug-desktop.
import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { FitChip } from '@/bims/chips';
import { atFit, DRAG_PX, FIT, panBy, wheelCam, type Cam } from '@/bims/zoom';
import { officeObjects, pluginKey } from '@/bims/plugin-objects';
import { tipAttrs } from '@/ds';
import { settings } from '@/proto/words.gen';
import { failedPart, needsLogin, titleOf } from './model';
import { themeOf } from '@/theme';
import { usePrefs } from '@/store';
import type { Plugin } from '@/proto';
import { canDraw, usePicks } from './icons';

type RoomView = import('./render').RoomView;

/** how long after a resize or the mount the room draws its frame once more, ms */
const SETTLE_MS = 250;

/** his theme, or the system's (the tokens' rule: dark unless the system says light) */
const darkOf = (theme: 'light' | 'dark' | null): boolean => theme !== null ? theme === 'dark' : !(typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: light)').matches);
const reducedNow = (): boolean => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * `onOpen`: a click on an object opens its plugin (its key). Each object plays its own small move
 * under the pointer (render/objects/hover.ts, none under reduced motion); a pinch zooms around the
 * pointer, a drag or two fingers move the view while zoomed, '⤢ fit', esc or a double-click go back:
 * the office's camera (zoom.ts), so the banner and the right bar behave the same.
 */
export function Room({ rows, project, fallback, onOpen }: { rows: readonly Plugin[]; project: string | undefined; fallback: ReactNode; onOpen?: (key: string) => void }) {
  const picks = usePicks(project);
  const ref = useRef<HTMLCanvasElement>(null);
  const view = useRef<RoomView | null>(null);
  const [failed, setFailed] = useState(!canDraw());
  const [ready, setReady] = useState(false);
  const [drawn, setDrawn] = useState(false);
  const cam = useRef<Cam>(FIT);
  const [fitted, setFitted] = useState(true);
  const [over, setOver] = useState(false);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ id: number; x: number; y: number; moved: boolean } | null>(null);
  // the object under the pointer and its box on the canvas: its tip's mark
  const [tipped, setTipped] = useState<{ key: string; rect: { left: number; top: number; width: number; height: number } } | null>(null);
  const dragged = useRef(false);
  const objs = officeObjects(rows, picks);
  const sig = JSON.stringify(objs);
  const dark = darkOf(themeOf(usePrefs()));

  useEffect(() => {
    const canvas = ref.current;
    if (canvas === null || failed) return;
    let live = true;
    let ro: ResizeObserver | null = null;
    let io: IntersectionObserver | null = null;
    let off = (): void => undefined;
    let late = 0;
    import('./render').then(
      (r) => {
        if (!live) return;
        try {
          const v = r.mountRoom(canvas);
          view.current = v;
          const now = (): void => { v.resize(canvas.parentElement?.clientWidth ?? 0); };
          // drawn at once, and once more when the window has settled: a frame drawn while the
          // window's surface is being remade (a resize, the first mount) can be lost on screen
          const again = (): void => {
            now();
            window.clearTimeout(late);
            late = window.setTimeout(now, SETTLE_MS);
          };
          again();
          ro = new ResizeObserver(again);
          if (canvas.parentElement !== null) ro.observe(canvas.parentElement);
          // the room is capped (240 high), so a window resize may leave its width as it was: its
          // frame is drawn again then, and when it scrolls back into view
          window.addEventListener('resize', again);
          io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) again(); });
          io.observe(canvas);
          // a pinch (Chromium: a wheel with ctrlKey) zooms around the pointer; two fingers move the view while zoomed
          const onWheel = (e: WheelEvent): void => {
            const at = canvas.getBoundingClientRect();
            const c = wheelCam(cam.current, { dx: e.deltaX, dy: e.deltaY, mode: e.deltaMode, ctrl: e.ctrlKey }, e.clientX - at.left, e.clientY - at.top, at.width, at.height, at.height);
            if (c === null) return;
            e.preventDefault();
            cam.current = c;
            setFitted(atFit(c));
            setTipped(null);
            v.setCam(c);
          };
          const box = canvas.parentElement ?? canvas;
          box.addEventListener('wheel', onWheel, { passive: false });
          off = () => { window.removeEventListener('resize', again); box.removeEventListener('wheel', onWheel); };
          setReady(true);
        } catch {
          setFailed(true);
        }
      },
      () => { if (live) setFailed(true); },
    );
    return () => {
      live = false;
      ro?.disconnect();
      io?.disconnect();
      off();
      window.clearTimeout(late);
      view.current?.dispose();
      view.current = null;
    };
  }, [failed]);

  useEffect(() => {
    const v = view.current;
    if (v === null) return;
    v.show(objs, { night: dark, reduced: reducedNow() });
    // its first frame is drawn on the next animation frame and on screen the one after
    let live = true;
    requestAnimationFrame(() => { requestAnimationFrame(() => { if (live) setDrawn(true); }); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sig says all of objs
  }, [sig, dark, ready]);

  const moveCam = (c: Cam): void => {
    cam.current = c;
    setFitted(atFit(c));
    setTipped(null);
    view.current?.setCam(c);
  };
  // the pointer on the canvas, css px from its top left (the events come from it or the tip's mark over it)
  const at = (e: { clientX: number; clientY: number }): { x: number; y: number } => {
    const r = ref.current?.getBoundingClientRect();
    return r === undefined ? { x: -1, y: -1 } : { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const pickAt = (e: { clientX: number; clientY: number }): string | null => {
    const p = at(e);
    return view.current?.pick(p.x, p.y) ?? null;
  };
  const hoverOn = (key: string | null): void => {
    setOver(key !== null && onOpen !== undefined);
    view.current?.hover(key, key === null || reducedNow());
    if (key === tipped?.key) return;
    const rect = key === null ? null : view.current?.rectOf(key) ?? null;
    setTipped(key === null || rect === null ? null : { key, rect });
  };
  const handlers = {
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
      if (e.button !== 0) return;
      drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
      dragged.current = false;
    },
    onPointerUp: () => {
      if (drag.current?.moved === true) dragged.current = true;
      drag.current = null;
      setDragging(false);
    },
    onPointerCancel: () => {
      drag.current = null;
      setDragging(false);
    },
    onPointerMove: (e: ReactPointerEvent<HTMLElement>) => {
      const d = drag.current;
      // a drag moves the view while zoomed; at the fit there is nothing to move
      if (d !== null && d.id === e.pointerId && !fitted) {
        const dx = e.clientX - d.x;
        const dy = e.clientY - d.y;
        if (!d.moved && Math.hypot(dx, dy) < DRAG_PX) return;
        if (!d.moved) {
          d.moved = true;
          ref.current?.setPointerCapture(e.pointerId);
          setDragging(true);
          hoverOn(null);
        }
        d.x = e.clientX;
        d.y = e.clientY;
        const r = ref.current?.getBoundingClientRect();
        if (r !== undefined) moveCam(panBy(cam.current, dx, dy, r.width, r.height));
        return;
      }
      hoverOn(pickAt(e));
    },
    onClick: (e: ReactMouseEvent<HTMLElement>) => {
      if (dragged.current) {
        dragged.current = false;
        return;
      }
      const key = pickAt(e);
      if (key !== null) onOpen?.(key);
    },
    onDoubleClick: (e: ReactMouseEvent<HTMLElement>) => {
      // on the floor only: a double-click on an object opened it already
      if (pickAt(e) === null) moveCam(FIT);
    },
  };
  const tipRow = tipped === null ? undefined : rows.find((r) => pluginKey(r) === tipped.key);

  if (failed) return <>{fallback}</>;
  // the canvas is always visible (a hidden one may lose the frame it draws); over it, the fallback
  // until the room's first frame is on screen: the hero never shows an empty box (designer m_41583)
  return (
    <>
      <canvas
        ref={ref}
        className="plg-room-canvas"
        aria-hidden="true"
        data-testid="plugins.room.canvas"
        data-n={objs.length}
        data-drawn={drawn || undefined}
        data-over={over || undefined}
        data-drag={dragging || undefined}
        data-zoomed={!fitted || undefined}
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key !== 'Escape' || fitted) return;
          e.stopPropagation();
          moveCam(FIT);
        }}
        {...handlers}
        onPointerLeave={(e) => {
          // onto the hovered object's tip mark: still over the room
          if (e.relatedTarget instanceof Element && e.relatedTarget.closest('.plg-room-mark') !== null) return;
          hoverOn(null);
        }}
      />
      {/* the hovered object's mark: its box on the canvas, the ds tip with its name and state over it (designer m_41950) */}
      {tipped !== null && tipRow !== undefined && !dragging && (
        <span
          className="plg-room-mark"
          role="button"
          tabIndex={-1}
          aria-label={tipOf(tipRow)}
          data-testid={`plugins.room.mark.${tipped.key}`}
          style={{ left: tipped.rect.left, top: tipped.rect.top, width: tipped.rect.width, height: tipped.rect.height }}
          {...tipAttrs(tipOf(tipRow))}
          {...handlers}
          onPointerLeave={(e) => {
            if (e.relatedTarget === ref.current) return;
            hoverOn(null);
          }}
        />
      )}
      {!fitted && drawn && <FitChip onFit={() => { moveCam(FIT); }} />}
      {!drawn && <div className="plg-room-wait" data-testid="plugins.room.wait">{fallback}</div>}
    </>
  );
}

/** an object's tip: its plugin's name and state ('Gmail · on', 'postgres-dev failed to start') */
export function tipOf(p: Plugin): string {
  const name = titleOf(p);
  if (p.on && failedPart(p) !== null) return settings.plugins_waits_error({ name });
  if (p.on && needsLogin(p)) return settings.plugins_waits_login({ name });
  return `${name} · ${p.on ? settings.plugins_mark_on : settings.plugins_mark_off}`;
}
