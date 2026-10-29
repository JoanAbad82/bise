// src/app/side3d · an agents list that moves calmly (calm.ts, designer m_47454): it holds the order
// he sees while the pointer is over it or one of its rows has keyboard focus, and slides each row
// that changed place (Web Animations, 160 ms ease-out; none under reduced motion). The rows carry
// `data-calm="<key>"`; `box` is the list's element (the caller's ref), `bind` its handlers. Owner: nm-side.
import { useLayoutEffect, useRef, useState, type FocusEvent, type RefObject } from 'react';
// the rows' tops are measured on the DOM after each order: offsetTop, which a running slide's transform leaves alone
import { reducedMotion } from '@/ds/hooks';
import { heldOrder, slideOf, SLIDE_MS } from './calm';

export interface Calm<T> {
  /** the rows in the order to draw */
  readonly rows: T[];
  readonly bind: {
    readonly onPointerEnter: () => void;
    readonly onPointerLeave: () => void;
    readonly onFocus: (e: FocusEvent<HTMLElement>) => void;
    readonly onBlur: (e: FocusEvent<HTMLElement>) => void;
  };
}

/** a focus he moved with the keyboard (a click's focus does not hold the list) */
const keyboardFocus = (el: Element): boolean => {
  try {
    return el.matches(':focus-visible');
  } catch {
    return false;
  }
};

/** `rows` as the list draws them, held and slid (module header). */
export function useCalm<T>(rows: readonly T[], keyOf: (r: T) => string, box: RefObject<HTMLDivElement | null>): Calm<T> {
  // what holds it: the pointer over it, a row's keyboard focus; `held` the order he saw when it began
  const [over, setOver] = useState(false);
  const [focused, setFocused] = useState(false);
  const [held, setHeld] = useState<readonly string[] | null>(null);
  /** the order last drawn, and its rows' tops (read in effects and handlers only) */
  const shown = useRef<string[]>([]);
  const tops = useRef<Map<string, number>>(new Map());
  const out = held === null ? rows.slice() : heldOrder(held, rows, keyOf);
  const sig = out.map(keyOf).join('\n');
  // called from the handlers only: the order he sees now becomes the one held
  const hold = (on: boolean) => {
    const seen = shown.current;
    setHeld((h) => (on ? (h ?? seen) : null));
  };
  useLayoutEffect(() => {
    const el = box.current;
    const was = shown.current;
    const now = sig === '' ? [] : sig.split('\n');
    shown.current = now;
    if (el === null) return;
    const rowsEl = new Map<string, HTMLElement>();
    for (const r of el.querySelectorAll<HTMLElement>('[data-calm]')) rowsEl.set(r.dataset.calm ?? '', r);
    const nowTop = new Map([...rowsEl].map(([k, r]) => [k, r.offsetTop]));
    const moves = slideOf(was, now, tops.current, nowTop);
    tops.current = nowTop;
    if (moves.size === 0 || reducedMotion()) return;
    for (const [k, dy] of moves) {
      const r = rowsEl.get(k);
      if (r === undefined || typeof r.animate !== 'function') continue;
      r.animate([{ transform: `translateY(${String(dy)}px)` }, { transform: 'translateY(0)' }], { duration: SLIDE_MS, easing: 'ease-out' });
    }
  }, [sig, box]);
  return {
    rows: out,
    bind: {
      onPointerEnter: () => {
        setOver(true);
        hold(true);
      },
      onPointerLeave: () => {
        setOver(false);
        hold(focused);
      },
      onFocus: (e) => {
        const on = keyboardFocus(e.target);
        setFocused(on);
        hold(on || over);
      },
      onBlur: (e) => {
        const next = e.relatedTarget;
        if (next instanceof Node && e.currentTarget.contains(next)) return;
        setFocused(false);
        hold(over);
      },
    },
  };
}
