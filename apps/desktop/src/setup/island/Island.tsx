// The first launch's island on screen (plan.ts what, scene.ts how): a transparent canvas the left
// column's size, his model's first words in a bubble over his bim, each little island's project name
// in a pin under it; the bubble and the pins follow the scene's frames. The scene loads behind
// import('./scene'): the setup's chunk never holds three. No WebGL (a test, a lost GPU): no island,
// the steps alone. Owner: onboarding.
import { useEffect, useRef, useState } from 'react';
import { reducedMotion } from '@/ds/hooks';
import type { IslandPlan } from './plan';
import './island.css';

type IslandView = import('./scene').IslandView;
interface Marks { head: { x: number; y: number } | null; pods: readonly { name: string; x: number; y: number }[] }

/** whether this window can draw WebGL at all (none in happy-dom) */
const hasWebGL = (): boolean => typeof WebGLRenderingContext !== 'undefined' && typeof document !== 'undefined';

export function IslandStage({ plan }: { plan: IslandPlan }) {
  const [ok, setOk] = useState(hasWebGL);
  if (!ok) return null;
  return <Live plan={plan} onFail={() => { setOk(false); }} />;
}

function Live({ plan, onFail }: { plan: IslandPlan; onFail: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const view = useRef<IslandView | null>(null);
  const [ready, setReady] = useState(false);
  const [marks, setMarks] = useState<Marks>({ head: null, pods: [] });

  useEffect(() => {
    const canvas = ref.current;
    if (canvas === null) return;
    let live = true;
    let ro: ResizeObserver | null = null;
    const box = canvas.parentElement;
    const size = (): void => { view.current?.resize(box?.clientWidth ?? 0, box?.clientHeight ?? 0); };
    import('./scene').then(
      (s) => {
        if (!live) return;
        try {
          const v = s.mountIsland(canvas, { enter: true, reduced: reducedMotion() });
          view.current = v;
          v.onFrame(() => {
            const m = v.marks();
            setMarks((old) => (same(old, m) ? old : m));
          });
          size();
          ro = new ResizeObserver(size);
          if (box !== null) ro.observe(box);
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
      view.current?.dispose();
      view.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onFail is the parent's setter; the scene is made once
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      view.current?.set(plan);
    } catch {
      onFail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onFail is the parent's setter
  }, [plan, ready]);

  return (
    <div className="setup-island" data-testid="setup.island">
      <canvas ref={ref} className="setup-island-canvas" aria-hidden="true" />
      {plan.bubble !== null && marks.head !== null && (
        <div className="setup-island-bubble" data-testid="setup.island.bubble" style={{ left: marks.head.x, top: marks.head.y }}>
          {plan.bubble}
        </div>
      )}
      {marks.pods.map((p) => (
        <span key={p.name} className="setup-island-pin" style={{ left: p.x, top: p.y }}>
          {p.name}
        </span>
      ))}
    </div>
  );
}

/** the same marks to the pixel: no re-render for a frame that moved nothing they show */
function same(a: Marks, b: Marks): boolean {
  const near = (p: { x: number; y: number } | null, q: { x: number; y: number } | null): boolean =>
    p === q || (p !== null && q !== null && Math.round(p.x) === Math.round(q.x) && Math.round(p.y) === Math.round(q.y));
  return near(a.head, b.head) && a.pods.length === b.pods.length && a.pods.every((p, i) => { const q = b.pods[i]; return q !== undefined && p.name === q.name && near(p, q); });
}
