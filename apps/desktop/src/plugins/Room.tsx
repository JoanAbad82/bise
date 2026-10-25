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

/** his theme, or the system's (the tokens' rule: dark unless the system says light) */
const darkOf = (theme: 'light' | 'dark' | null): boolean => theme !== null ? theme === 'dark' : !(typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: light)').matches);
const reducedNow = (): boolean => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function Room({ rows, project, fallback }: { rows: readonly Plugin[]; project: string | undefined; fallback: ReactNode }) {
  const picks = usePicks(project);
  const ref = useRef<HTMLCanvasElement>(null);
  const view = useRef<RoomView | null>(null);
  const [failed, setFailed] = useState(!canDraw());
  const [ready, setReady] = useState(false);
  const objs = officeObjects(rows, picks);
  const sig = JSON.stringify(objs);
  const dark = darkOf(themeOf(usePrefs()));

  useEffect(() => {
    const canvas = ref.current;
    if (canvas === null || failed) return;
    let live = true;
    let ro: ResizeObserver | null = null;
    import('./render').then(
      (r) => {
        if (!live) return;
        try {
          const v = r.mountRoom(canvas);
          view.current = v;
          v.resize(canvas.parentElement?.clientWidth ?? 0);
          ro = new ResizeObserver(() => { v.resize(canvas.parentElement?.clientWidth ?? 0); });
          if (canvas.parentElement !== null) ro.observe(canvas.parentElement);
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
      view.current?.dispose();
      view.current = null;
    };
  }, [failed]);

  useEffect(() => {
    view.current?.show(objs, { night: dark, reduced: reducedNow() });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sig says all of objs
  }, [sig, dark, ready]);

  if (failed) return <>{fallback}</>;
  return <canvas ref={ref} className="plg-room-canvas" aria-hidden="true" data-testid="plugins.room.canvas" data-n={objs.length} />;
}
