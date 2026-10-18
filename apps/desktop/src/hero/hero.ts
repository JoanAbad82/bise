// bise.dev/desktop's hero town, the entry the static site loads (site/desktop/hero/hero.js, an ES
// module): mount(el, opts) fills the element with the live town (film.ts) once it nears the screen
// and the page is idle, over the page's own poster (three-a's still): the first paint never waits
// for three, which comes in the film's chunk on demand. The handle (designer m_30837): setTheme,
// zoom(+1 | -1) for the page's + and −, resumeFilm for its 'back to the film', on('control' |
// 'film' | 'ready' | 'lost', fn), destroy. No WebGL: nothing mounts, 'lost' fires, the poster stays.
// ?herotest in the page's URL exposes window.__bimsHero (frames, frame ms, film time) to the checks;
// ?herot=<s> starts the film there (a check's frame of a shot).
// Owner: hero-town.
import css from './hero.css?inline';
import type { Film, Theme } from './film';

export type HeroEvent = 'control' | 'film' | 'ready' | 'lost';

export interface MountOpts {
  readonly theme?: Theme;
  /** the page's paper by theme (default bise.dev's: #f2ede2, #171513) */
  readonly ground?: { readonly light: string; readonly dark: string } | string;
  /** default: the system's prefers-reduced-motion */
  readonly reducedMotion?: boolean;
}

export interface HeroTown {
  setTheme(t: Theme): void;
  /** one step of the page's + (1) or − (-1) */
  zoom(dir: number): void;
  resumeFilm(): void;
  on(e: HeroEvent, fn: () => void): () => void;
  destroy(): void;
}

/** one + or − step */
const ZOOM_STEP = 1.4;

const reducedNow = (): boolean => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

function webgl(): boolean {
  try {
    const c = document.createElement('canvas');
    return c.getContext('webgl2') !== null || c.getContext('webgl') !== null;
  } catch {
    return false;
  }
}

function style(): void {
  if (document.getElementById('bims-hero-css') !== null) return;
  const s = document.createElement('style');
  s.id = 'bims-hero-css';
  s.textContent = css;
  document.head.append(s);
}

const idle = (cb: () => void): void => {
  // Safari has no requestIdleCallback
  if ('requestIdleCallback' in window) window.requestIdleCallback(cb, { timeout: 1500 });
  else setTimeout(cb, 200);
};

export function mount(el: HTMLElement, opts: MountOpts = {}): HeroTown {
  const fns = new Map<HeroEvent, Set<() => void>>();
  const emit = (e: HeroEvent): void => {
    for (const fn of fns.get(e) ?? []) fn();
  };
  let film: Film | null = null;
  let gone = false;
  let theme: Theme = opts.theme ?? 'light';
  const later: ((f: Film) => void)[] = [];
  const act = (f: (x: Film) => void): void => {
    if (film) f(film);
    else later.push(f);
  };
  const handle: HeroTown = {
    setTheme(t) {
      theme = t;
      film?.setTheme(t);
    },
    zoom: (dir) => { act((f) => { f.zoomBy(dir >= 0 ? ZOOM_STEP : 1 / ZOOM_STEP); }); },
    resumeFilm: () => { act((f) => { f.resumeFilm(); }); },
    on(e, fn) {
      const set = fns.get(e) ?? new Set();
      set.add(fn);
      fns.set(e, set);
      return () => set.delete(fn);
    },
    destroy() {
      gone = true;
      near.disconnect();
      film?.dispose();
      film = null;
      el.classList.remove('bims-hero');
    },
  };
  if (!webgl()) {
    queueMicrotask(() => { emit('lost'); });
    const near = { disconnect: (): void => undefined };
    return { ...handle, destroy: () => { near.disconnect(); } };
  }
  style();
  el.classList.add('bims-hero');
  const ground = typeof opts.ground === 'string' ? { light: opts.ground, dark: opts.ground } : opts.ground;
  const q = new URLSearchParams(location.search);
  const go = (): void => {
    void import('./film')
      .then(({ playFilm }) => {
        if (gone) return;
        film = playFilm(el, {
          theme,
          ...(ground ? { ground } : {}),
          reduced: opts.reducedMotion ?? reducedNow(),
          probe: q.has('herotest'),
          ...(q.has('herot') ? { startT: Number(q.get('herot')) } : {}),
          ...(q.has('herobuild') ? { entryAt: Number(q.get('herobuild')) } : {}),
          manual: q.has('herostep'),
          kiln: () => import('./kiln/kiln'),
          on: emit,
        });
        for (const f of later.splice(0)) f(film);
      })
      .catch(() => { emit('lost'); });
  };
  // in view at load (the hero): the film's chunk at once (design's hero-entry §1, the page preloads
  // it); else when it nears the screen, once the page is idle
  const r0 = el.getBoundingClientRect();
  const inView = r0.bottom > 0 && r0.top < innerHeight && r0.right > 0 && r0.left < innerWidth;
  const near = new IntersectionObserver(
    (es) => {
      if (!es.some((e) => e.isIntersecting)) return;
      near.disconnect();
      idle(go);
    },
    { rootMargin: '200px' },
  );
  if (inView) go();
  else near.observe(el);
  return handle;
}
