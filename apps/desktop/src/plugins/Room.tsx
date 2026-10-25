// The plugins place's hero: the room, his plugins' objects on a slab with two low walls (spots.ts
// plans it, render.ts draws it behind import('./render')). A 2.2:1 banner as wide as the head; a
// new plugin's object drops in, cut under reduced motion; no frame while nothing changes. No WebGL
// (a test, a lost GPU): `fallback` (the plain icons on a floor). Owner: plug-desktop.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { officeObjects } from '@/bims/plugin-objects';
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

export function Room({ rows, project, fallback }: { rows: readonly Plugin[]; project: string | undefined; fallback: ReactNode }) {
  const picks = usePicks(project);
  const ref = useRef<HTMLCanvasElement>(null);
  const view = useRef<RoomView | null>(null);
  const [failed, setFailed] = useState(!canDraw());
  const [ready, setReady] = useState(false);
  const [drawn, setDrawn] = useState(false);
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
          off = () => { window.removeEventListener('resize', again); };
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

  if (failed) return <>{fallback}</>;
  // the canvas is always visible (a hidden one may lose the frame it draws); over it, the fallback
  // until the room's first frame is on screen: the hero never shows an empty box (designer m_41583)
  return (
    <>
      <canvas ref={ref} className="plg-room-canvas" aria-hidden="true" data-testid="plugins.room.canvas" data-n={objs.length} data-drawn={drawn || undefined} />
      {!drawn && <div className="plg-room-wait" data-testid="plugins.room.wait">{fallback}</div>}
    </>
  );
}
