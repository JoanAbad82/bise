// Spring-loaded projects (his m_47378, designer m_47386): a file or an image dragged over a project's
// row in the left sidebar lights the row (the selection tint), and held there for macOS's
// spring-loading delay (Pointer Control's setting, main/a11y.ts; 0.5 s by default) the row blinks
// twice (tint off 100 ms / on 100 ms) and the project opens, so he drops in it: the drop is then
// the window's, its composer's (composer/pm/paste.ts useDropAnywhere), as anywhere else. Space
// springs at once, as in the Finder. Leaving the row, the drop, the drag's end and Esc cancel; after
// Esc the tint goes and the row never springs again until he leaves it (designer m_47585). The
// project in view never springs;
// spring-loading off in macOS: the row lights, never opens; reduce motion: no blink, it opens at
// the delay's end. The timeline is pure (springStep, time an input); the hook wires it to the row.
// Owner: drag-spring.
import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react';
import type { Springing } from '@/shared/springing';
import { useA11y } from './a11yroot';

/** The two blinks: tint off 100 ms, on 100 ms, twice (designer m_47386; app.css's app-s-spring). */
export const BLINK_MS = 400;

/** lit: a drop target that will not spring (spring-loading off); hold: the delay runs; blink: the
 *  two blinks, then it opens; stop: Esc cancelled it, no tint, no spring until he leaves the row. */
export type SpringPhase = 'lit' | 'hold' | 'blink' | 'stop';

/** A row's spring: its phase and when that phase ends (ms; lit and stop never end). null: no drag over it. */
export type Spring = { readonly phase: SpringPhase; readonly due: number } | null;

export type SpringEv =
  | { readonly e: 'enter'; readonly now: number }
  | { readonly e: 'tick'; readonly now: number }
  | { readonly e: 'space'; readonly now: number }
  | { readonly e: 'esc' }
  | { readonly e: 'leave' };

export interface SpringCfg {
  /** this row's project is the one in view: it is open already */
  readonly here: boolean;
  readonly springing: Springing;
  readonly reduceMotion: boolean;
}

/** The delay ran out (or space): the blinks, or the open at once under reduce motion. */
const blinkOrOpen = (now: number, cfg: SpringCfg): { s: Spring; open: boolean } =>
  cfg.reduceMotion ? { s: null, open: true } : { s: { phase: 'blink', due: now + BLINK_MS }, open: false };

/** One step of a row's spring: its next state, and whether its project opens now. Pure. */
export function springStep(s: Spring, ev: SpringEv, cfg: SpringCfg): { s: Spring; open: boolean } {
  const stay = { s, open: false };
  switch (ev.e) {
    case 'enter':
      if (s !== null || cfg.here) return stay;
      if (!cfg.springing.on) return { s: { phase: 'lit', due: Infinity }, open: false };
      return { s: { phase: 'hold', due: ev.now + cfg.springing.delayMs }, open: false };
    case 'tick':
      if (s === null || ev.now < s.due) return stay;
      if (s.phase === 'hold') return blinkOrOpen(ev.now, cfg);
      if (s.phase === 'blink') return { s: null, open: true };
      return stay;
    case 'space':
      return s?.phase === 'hold' ? blinkOrOpen(ev.now, cfg) : stay;
    case 'esc':
      return s === null ? stay : { s: { phase: 'stop', due: Infinity }, open: false };
    case 'leave':
      return { s: null, open: false };
  }
}

/** A drag of files (the Finder's, an image's): never a drag of text or of bise's own cards. */
export const isFileDrag = (types: readonly string[]): boolean => types.includes('Files');

export interface SpringRow {
  /** the row's phase now, for its data-spring (null: no drag over it) */
  readonly spring: SpringPhase | null;
  readonly drag: {
    readonly onDragEnter: (e: DragEvent<HTMLElement>) => void;
    readonly onDragOver: (e: DragEvent<HTMLElement>) => void;
    readonly onDragLeave: (e: DragEvent<HTMLElement>) => void;
    readonly onDrop: () => void;
  };
}

/** A project row's spring-loading: its drag handlers and its phase; `open` opens its project. */
export function useSpring(here: boolean, open: () => void): SpringRow {
  const a11y = useA11y();
  const cfg: SpringCfg = { here, springing: a11y.springing, reduceMotion: a11y.reduceMotion };
  const [s, setS] = useState<Spring>(null);
  // the step reads the live state and settings (a drag fires dragover every ~50 ms): the state is
  // the step's own ref, the settings and `open` this render's
  const cur = useRef<Spring>(null);
  const live = useRef({ cfg, open });
  useEffect(() => {
    live.current = { cfg, open };
  });
  const step = useCallback((ev: SpringEv): void => {
    const r = springStep(cur.current, ev, live.current.cfg);
    if (r.s !== cur.current) {
      cur.current = r.s;
      setS(r.s);
    }
    if (r.open) live.current.open();
  }, []);

  // the phase's end, on the clock
  const due = s?.due ?? Infinity;
  useEffect(() => {
    if (!Number.isFinite(due)) return undefined;
    const t = setTimeout(() => {
      step({ e: 'tick', now: Date.now() });
    }, Math.max(0, due - Date.now()));
    return () => {
      clearTimeout(t);
    };
  }, [due, step]);

  // while a drag is over the row: its drop or end anywhere, Esc and space
  const armed = s !== null;
  useEffect(() => {
    if (!armed) return undefined;
    const end = (): void => {
      step({ e: 'leave' });
    };
    const key = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') step({ e: 'esc' });
      else if (e.key === ' ') step({ e: 'space', now: Date.now() });
    };
    window.addEventListener('drop', end, true);
    window.addEventListener('dragend', end, true);
    window.addEventListener('keydown', key, true);
    return () => {
      window.removeEventListener('drop', end, true);
      window.removeEventListener('dragend', end, true);
      window.removeEventListener('keydown', key, true);
    };
  }, [armed, step]);

  // a project that came into view (he clicked it, or it sprang) stops its spring
  useEffect(() => {
    if (here) step({ e: 'leave' });
  }, [here, step]);

  const over = (e: DragEvent<HTMLElement>): void => {
    if (!isFileDrag(Array.from(e.dataTransfer.types))) return;
    // taken, so the drag stays alive over the row while the view under it changes
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    step({ e: 'enter', now: Date.now() });
  };
  return {
    // stopped by Esc: drawn as no drag at all
    spring: s === null || s.phase === 'stop' ? null : s.phase,
    drag: {
      onDragEnter: over,
      onDragOver: over,
      onDragLeave: (e) => {
        // into one of the row's own children: still over the row
        if (e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) return;
        step({ e: 'leave' });
      },
      // the drop is the window's (the composer's); the row only stops
      onDrop: () => {
        step({ e: 'leave' });
      },
    },
  };
}
