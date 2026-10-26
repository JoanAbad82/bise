// src/artifacts/hero · a page banner's live vignette (Gabriel m_45889: « de vrais models 3d
// interactifs, comme pour la page plugins »): the page's scene (scene.ts, behind import('./scene'))
// drawn on a canvas the banner's visual box's size, as the plugins room draws its own. Each part
// plays its hover move under the pointer, then the scene is still: no frame while nothing moves.
// No zoom, no pan, the wheel scrolls the page (designer m_45900). The signed still shows until the
// first frame is on screen, and stays alone under reduced motion or with no WebGL (a test, a lost
// GPU). Owner: banner-3d.
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { reducedMotion } from '@/ds/hooks';
import { usePrefs } from '@/store';
import { themeOf } from '@/theme';
import { PageVignette } from './vignettes';
import type { ScenePage } from './scene';
import './live.css';

type SceneView = import('./scene').SceneView;

/** how long after a resize or the mount the scene draws its frame once more, ms (Room.tsx's) */
const SETTLE_MS = 250;

/** his theme, or the system's (the tokens' rule: dark unless the system says light) */
const darkOf = (theme: 'light' | 'dark' | null): boolean => theme !== null ? theme === 'dark' : !(typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: light)').matches);

/** whether this window can draw WebGL at all (none in jsdom: the still) */
const hasWebGL = (): boolean => typeof WebGLRenderingContext !== 'undefined' && typeof document !== 'undefined';

/** A page banner's vignette, live: PageBanner's `visual` on inbox, scheduled and artifacts. */
export function LiveVignette({ page }: { page: ScenePage }) {
  const [still] = useState(() => reducedMotion() || !hasWebGL());
  const [failed, setFailed] = useState(false);
  if (still || failed) return <PageVignette page={page} />;
  return <Live page={page} onFail={() => { setFailed(true); }} />;
}

function Live({ page, onFail }: { page: ScenePage; onFail: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const view = useRef<SceneView | null>(null);
  const [ready, setReady] = useState(false);
  const [drawn, setDrawn] = useState(false);
  const [over, setOver] = useState(false);
  const dark = darkOf(themeOf(usePrefs()));

  useEffect(() => {
    const canvas = ref.current;
    if (canvas === null) return;
    let live = true;
    let ro: ResizeObserver | null = null;
    let io: IntersectionObserver | null = null;
    let late = 0;
    const box = canvas.parentElement;
    const now = (): void => { view.current?.resize(box?.clientWidth ?? 0, box?.clientHeight ?? 0); };
    // drawn at once, and once more when the window has settled: a frame drawn while the window's
    // surface is being remade (a resize, the first mount) can be lost on screen
    const again = (): void => {
      now();
      window.clearTimeout(late);
      late = window.setTimeout(now, SETTLE_MS);
    };
    import('./scene').then(
      (s) => {
        if (!live) return;
        try {
          view.current = s.mountScene(canvas, page);
          again();
          ro = new ResizeObserver(again);
          if (box !== null) ro.observe(box);
          io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) again(); });
          io.observe(canvas);
          setReady(true);
        } catch {
          onFail();
        }
      },
      () => { if (live) onFail(); },
    );
    return () => {
      live = false;
      ro?.disconnect();
      io?.disconnect();
      window.clearTimeout(late);
      view.current?.dispose();
      view.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onFail is the parent's setter, page fixed for its banner
  }, [page]);

  useEffect(() => {
    const v = view.current;
    if (v === null) return;
    try {
      v.show({ night: dark });
    } catch {
      onFail();
      return;
    }
    // its first frame is drawn on the next animation frame and on screen the one after
    let live = true;
    requestAnimationFrame(() => { requestAnimationFrame(() => { if (live) setDrawn(true); }); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onFail is the parent's setter
  }, [dark, ready]);

  const pickAt = (e: ReactPointerEvent<HTMLElement>): string | null => {
    const r = ref.current?.getBoundingClientRect();
    if (r === undefined) return null;
    return view.current?.pick(e.clientX - r.left, e.clientY - r.top) ?? null;
  };
  const hoverOn = (key: string | null): void => {
    setOver(key !== null);
    view.current?.hover(key, reducedMotion());
  };

  // the canvas is always visible (a hidden one may lose the frame it draws); over it, the still
  // until the scene's first frame is on screen: the banner never shows an empty box
  return (
    <div className="b-live" data-testid={`banner.live.${page}`} data-drawn={drawn || undefined}>
      <canvas
        ref={ref}
        className="b-live-canvas"
        aria-hidden="true"
        data-over={over || undefined}
        onPointerMove={(e) => { hoverOn(pickAt(e)); }}
        onPointerLeave={() => { hoverOn(null); }}
      />
      {!drawn && <div className="b-live-wait"><PageVignette page={page} /></div>}
    </div>
  );
}
