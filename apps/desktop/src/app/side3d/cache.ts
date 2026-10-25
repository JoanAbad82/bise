// src/app/side3d · the right side's pictures, three-free: each object's and each bim head's PNG
// (render.ts, behind import('./render'): nothing of bims/render/ in the entry chunk, the build's
// bims-budget checks it), drawn once per thing, size and theme and kept for the window's life;
// asked a few per frame so opening a card never stalls. A head's key carries its outfit (render
// outfitSig, read once the renderer is loaded): when the outfits are redone (bims-clay-2,
// bims-outfit-review; plan d6) the key changes and the heads draw again. No WebGL (a test, a lost
// GPU): null for good, the caller keeps its plain tile. Owner: nm-side.
import { useEffect, useState, useSyncExternalStore } from 'react';
import type { Thing } from './objects';

type Render = typeof import('./render');

/** One thing's key: what it is, its size, the theme it is lit for; a head with its outfit's signature. Pure. */
export function thingKey(t: Thing, px: number, night: boolean, outfit: string): string {
  const lit = night ? 'night' : 'day';
  if ('obj' in t) return `obj:${t.obj}:${String(px)}:${lit}`;
  return `head:${t.main ? 'main' : t.head}:${outfit}:${String(px)}:${lit}`;
}

const drawn = new Map<string, string>();
let dead = false;
let loading: Promise<Render> | null = null;
/** the renderer once loaded: the heads' outfit signatures come from it */
let loaded: Render | null = null;
const queue: { t: Thing; px: number; night: boolean; done: () => void }[] = [];
let pumping = false;
/** how long a frame may spend drawing, ms */
const BUDGET_MS = 8;

const outfitOf = (r: Render | null, t: Thing): string => (r === null || 'obj' in t ? '' : r.outfitSig(t.head, t.main));

function pump(r: Render): void {
  pumping = true;
  requestAnimationFrame(() => {
    const t0 = performance.now();
    while (queue.length > 0 && performance.now() - t0 < BUDGET_MS) {
      const job = queue.shift();
      if (job === undefined) break;
      const key = thingKey(job.t, job.px, job.night, outfitOf(r, job.t));
      if (!drawn.has(key) && !dead) {
        try {
          drawn.set(key, 'obj' in job.t ? r.objectPng(job.t.obj, job.px) : r.headPng(job.t.head, job.t.main, job.px, job.night));
        } catch {
          dead = true;
        }
      }
      job.done();
    }
    if (queue.length > 0) pump(r);
    else pumping = false;
  });
}

function ask(t: Thing, px: number, night: boolean, done: () => void): void {
  queue.push({ t, px, night, done });
  loading ??= import('./render');
  loading.then(
    (r) => {
      loaded = r;
      if (!pumping) pump(r);
    },
    () => {
      dead = true;
      for (const j of queue.splice(0)) j.done();
    },
  );
}

/** The thing's picture as a data URL once drawn; null: not yet, or never (the plain tile). */
export function useThingPng(t: Thing | null, px: number): string | null {
  const night = useNight();
  const key = t === null ? null : thingKey(t, px, night, outfitOf(loaded, t));
  // bumped when an asked picture comes back (drawn or never): the render reads `drawn` again
  const [, setTick] = useState(0);
  useEffect(() => {
    if (t === null || key === null || dead || drawn.has(key)) return;
    let live = true;
    ask(t, px, night, () => {
      if (live) setTick((n) => n + 1);
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the key says all of t, px and the theme
  }, [key]);
  return key === null ? null : (drawn.get(key) ?? null);
}

/** Whether the page shows dark now: his theme on <html data-theme>, else the system's. */
export function nightNow(): boolean {
  if (typeof document === 'undefined') return true;
  const t = document.documentElement.dataset.theme;
  if (t === 'dark' || t === 'light') return t === 'dark';
  return typeof matchMedia !== 'function' || !matchMedia('(prefers-color-scheme: light)').matches;
}

function onTheme(cb: () => void): () => void {
  if (typeof document === 'undefined') return () => undefined;
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: light)') : null;
  mq?.addEventListener('change', cb);
  return () => {
    mo.disconnect();
    mq?.removeEventListener('change', cb);
  };
}

/** nightNow, live: a theme change draws the pictures for it. */
export function useNight(): boolean {
  return useSyncExternalStore(onTheme, nightNow, () => true);
}
