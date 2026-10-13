// An image artifact, zoomable (his m_22822 via ambient-lead m_22823): a trackpad pinch (Chromium's
// wheel + ctrlKey) zooms the image itself around the pointer, never the window; two fingers or a
// drag pan it while zoomed; a double-click toggles fit and 100%; esc or ⌘0 back to fit
// (zoomKeys.ts); fit..8×. A small chip says the zoom while it isn't fit. The math is zoom.ts's.
// Reduced motion: no easing. Owner: amb-win.
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react';
import { claimZoomKeys } from './zoomKeys';
import { fitted, isFit, panBy, pinchFactor, place, toggled, zoomAt, zoomWords, type Dims, type Zoom } from './zoom';

export function ImageView({ src, alt }: { src: string; alt: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState<Dims>({ bw: 0, bh: 0, nw: 0, nh: 0 });
  const [z, setZ] = useState<Zoom>({ k: 1, x: 0, y: 0 });
  // eased only for a jump (double-click, back to fit), never under the fingers
  const [ease, setEase] = useState(false);
  const fit = isFit(dims, z);
  // the listeners read the latest of both, set after each render
  const live = useRef({ dims, z });
  useLayoutEffect(() => {
    live.current = { dims, z };
  });

  // the box's size: a fitted image refits, a zoomed one keeps its place, held at the edges
  useLayoutEffect(() => {
    const el = box.current;
    if (el === null) return;
    const ro = new ResizeObserver(() => {
      const d = { ...live.current.dims, bw: el.clientWidth, bh: el.clientHeight };
      const was = isFit(live.current.dims, live.current.z);
      setDims(d);
      setZ(was ? fitted(d) : place(d, live.current.z));
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, []);

  // a pinch zooms here, never the window; two fingers pan while zoomed, else scroll on
  useEffect(() => {
    const el = box.current;
    if (el === null) return;
    const onWheel = (e: WheelEvent) => {
      const { dims: d, z: cur } = live.current;
      const r = el.getBoundingClientRect();
      if (e.ctrlKey) {
        e.preventDefault();
        setEase(false);
        setZ(zoomAt(d, cur, cur.k * pinchFactor(e.deltaY, e.deltaMode), e.clientX - r.left, e.clientY - r.top));
        return;
      }
      if (isFit(d, cur)) return;
      e.preventDefault();
      setEase(false);
      setZ(panBy(d, cur, -e.deltaX, -e.deltaY));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
    };
  }, []);

  // esc and ⌘0 are the zoom's while it isn't fit
  useEffect(() => {
    if (fit) return;
    return claimZoomKeys(() => {
      setEase(true);
      setZ(fitted(live.current.dims));
    });
  }, [fit]);

  const drag = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (fit || e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const from = drag.current;
    if (from === null) return;
    drag.current = { x: e.clientX, y: e.clientY };
    setEase(false);
    setZ((cur) => panBy(dims, cur, e.clientX - from.x, e.clientY - from.y));
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  return (
    <div
      ref={box}
      className="art-image"
      data-testid="artifact.image"
      data-fit={fit}
      data-zoomed={!fit}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setEase(true);
        setZ(toggled(dims, z, e.clientX - r.left, e.clientY - r.top));
      }}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        className={ease ? 'art-image-img eased' : 'art-image-img'}
        data-testid="artifact.image.img"
        style={{ width: dims.nw || undefined, height: dims.nh || undefined, transform: `translate(${String(z.x)}px, ${String(z.y)}px) scale(${String(z.k)})` }}
        onLoad={(e) => {
          const img = e.currentTarget;
          const el = box.current;
          const d = { bw: el?.clientWidth ?? 0, bh: el?.clientHeight ?? 0, nw: img.naturalWidth, nh: img.naturalHeight };
          setDims(d);
          setZ(fitted(d));
        }}
      />
      {!fit && (
        <span className="art-image-zoom" data-testid="artifact.zoom" aria-live="polite">
          {zoomWords(z)}
        </span>
      )}
    </div>
  );
}
