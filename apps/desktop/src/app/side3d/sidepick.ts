// src/app/side3d · the right side's form by his hand (side-mini, his m_46698; designer m_46706): the
// outer card, or the compact coins at the window's edge even with room for the card. One toggle,
// the title bar's button (left of the panel's) and View › Compact Side / Show Side Card, no key.
// Kept per window (keep.ts), like the tile's height; a window too narrow for the card shows the
// coins whatever the pick (the button dims), and his pick wins again when it grows. The swap
// moves (sidepick.css, the root's data-side-swap): the card fades out sliding 8 toward the edge
// (160 ms), then the coins fade in from the top, 30 ms apart; back, the reverse. Owner: nm-side.
import { useSyncExternalStore } from 'react';
import { keep } from '../keep';
import { sideLayout, type PanelIn } from './layout';
import './sidepick.css';

const KEY = 'outer.compact';
/** the swap's out: the store flips when the card (or the coins) is gone, ms (reduced motion: its crossfade's half) */
export const SWAP_OUT_MS = { full: 160, reduced: 60 } as const;
/** the whole swap, the coins' stagger included: the root's data-side-swap goes after it, ms */
export const SWAP_MS = { full: 160 + 160 + 120, reduced: 120 } as const;

let compact: boolean | null = null;
const listeners = new Set<() => void>();

function read(): boolean {
  if (compact === null) compact = keep.view(KEY) === true;
  return compact;
}

function set(next: boolean): void {
  if (next === read()) return;
  keep.setView(KEY, next ? true : undefined);
  compact = next;
  for (const l of listeners) l();
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** He picked the compact coins (kept), re-rendered on each change. */
export function useSideCompact(): boolean {
  return useSyncExternalStore(subscribe, read);
}

const reduced = (): boolean => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let swapTimers: ReturnType<typeof setTimeout>[] = [];

/** what leaves: the card and its tile, or the coins at the edge */
const CARD_SEL = '.s3-outer, .s3-otile';
const COINS_SEL = ".s3-side[data-at='edge'] > *";
/** ease-in: what leaves speeds up as it goes */
const EASE_IN = 'cubic-bezier(.4, 0, 1, 1)';

/**
 * The leaving form's move, played on the elements still there (Web Animations: a CSS rule keyed on
 * the root never played on the mounted card, ui-review m_46834): the card slides 8 toward the edge,
 * the coins 8 up, both fading, 160 ms; reduced motion the crossfade's half, no slide. They unmount
 * when the pick flips, at its end. The coming form's move is sidepick.css's, on its mount.
 */
function leave(sel: string, what: 'card' | 'coins', how: 'full' | 'reduced'): void {
  const slide = what === 'card' ? 'translateX(8px)' : 'translateY(-8px)';
  const frames: Keyframe[] = how === 'full' ? [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: slide }] : [{ opacity: 1 }, { opacity: 0 }];
  for (const el of document.querySelectorAll<HTMLElement>(sel)) {
    if (typeof el.animate !== 'function') continue;
    el.animate(frames, { duration: SWAP_OUT_MS[how], easing: how === 'full' ? EASE_IN : 'linear', fill: 'forwards' });
  }
}

export const sideCompact = {
  get: read,
  set,
  /** The button's and the menu's toggle: the swap's motion on the root, the pick flips once the old form is gone. */
  toggle: (): void => {
    const next = !read();
    const root = typeof document === 'undefined' ? null : document.documentElement;
    for (const t of swapTimers) clearTimeout(t);
    swapTimers = [];
    if (root === null) {
      set(next);
      return;
    }
    const how = reduced() ? 'reduced' : 'full';
    const to = next ? 'to-coins' : 'to-card';
    root.dataset['sideSwap'] = to;
    if (how === 'reduced') root.dataset['sideSwapReduced'] = to;
    leave(next ? CARD_SEL : COINS_SEL, next ? 'card' : 'coins', how);
    swapTimers.push(
      setTimeout(() => {
        set(next);
      }, SWAP_OUT_MS[how]),
      setTimeout(() => {
        delete root.dataset['sideSwap'];
        delete root.dataset['sideSwapReduced'];
      }, SWAP_MS[how]),
    );
  },
  /** tests: forget what this run read (keep.ts holds what is kept) */
  reset: (): void => {
    compact = null;
  },
};

/**
 * Whether the window holds the card at all (the panel folded, a route that shows the side): the
 * button lit, else dimmed with its 'no room' tip and the coins whatever the pick. Pure.
 */
export function cardFits(winW: number, leftW: number, shows: boolean, beside?: Omit<PanelIn, 'open' | 'width'>): boolean {
  return sideLayout(winW, leftW, false, undefined, shows, beside).coins === 'card';
}
