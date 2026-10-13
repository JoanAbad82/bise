// One list's keys, the same on every list screen (his words, main m_22146 and m_22164; ambient-lead
// m_22147, m_22165): the TUI's list keys. ↑/k ↓/j move the selection one row, pgup/pgdn ten,
// home/end to the ends; it clamps, never wraps (the TUI's step). ⏎ opens the selected row. The
// first row is selected when the list opens (the TUI's), the selection is kept across a reload when
// the screen names a keep key, and a row moved to by a key is scrolled into view. The mouse
// never moves it: a click picks (the screen's), a hover does nothing. The list takes the keys when
// nothing else has the focus (the screen is focused at mount); a field, a text area or a focused
// button keeps its own keys. Each screen's own keys (space, letters, esc) go to its `onKey`, with
// the selected row. Rows carry data-row={key} so the scroll finds them. Owner: amb-mac.
import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import { keep } from './keep';

/** pgup / pgdn: ten rows (the TUI's) */
export const PAGE = 10;

/** How far a key moves the selection; 0: not a move key. Pure. */
export function stepOf(key: string): number {
  switch (key) {
    case 'ArrowDown':
    case 'j':
      return 1;
    case 'ArrowUp':
    case 'k':
      return -1;
    case 'PageDown':
      return PAGE;
    case 'PageUp':
      return -PAGE;
    case 'End':
      return Number.MAX_SAFE_INTEGER;
    case 'Home':
      return -Number.MAX_SAFE_INTEGER;
    default:
      return 0;
  }
}

/** The row `d` rows from `sel` in `order`, clamped at the ends; from no selection, the first row. Pure. */
export function moved(order: readonly string[], sel: string | null, d: number): string | null {
  if (order.length === 0) return null;
  const i = sel === null ? -1 : order.indexOf(sel);
  if (i < 0) return order[0] ?? null;
  return order[Math.max(0, Math.min(order.length - 1, i + d))] ?? null;
}

/** The selection shown: the chosen row while it is in the list, else the first row. Pure. */
export function shownSel(order: readonly string[], chosen: string | null): string | null {
  return chosen !== null && order.includes(chosen) ? chosen : (order[0] ?? null);
}

/** Whether the key belongs to what has the focus (a field, a text area, a button other than the list). */
function ownKeys(target: EventTarget, list: HTMLElement | null): boolean {
  const t = target as HTMLElement;
  if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t.isContentEditable) return true;
  return t !== list && t.closest('button, a[href], select') !== null;
}

export interface ListKeysOpts {
  /** the rows' keys in the order they show */
  readonly order: readonly string[];
  /** ⏎ on the selected row */
  readonly onOpen?: (key: string) => void;
  /** the screen's other keys, with the selected row: true when it took the key */
  readonly onKey?: (e: KeyboardEvent, sel: string | null) => boolean;
  /** a keep.view key: the selection comes back after a reload (10 minutes) */
  readonly keepAs?: string;
}

export interface ListKeys<E extends HTMLElement> {
  /** the selected row's key (the first row when none was chosen) */
  readonly sel: string | null;
  /** a click's pick */
  readonly setSel: (key: string | null) => void;
  /** the element that takes the keys (tabIndex -1): the screen or the list */
  readonly ref: RefObject<E | null>;
  readonly onKeyDown: (e: KeyboardEvent) => void;
  /** moves the selection as a move key does (a search field's ↑↓ hand the keys back and move) */
  readonly move: (d: number) => void;
}

/** The list keys of one screen (the header says which). */
export function useListKeys<E extends HTMLElement = HTMLElement>({ order, onOpen, onKey, keepAs }: ListKeysOpts): ListKeys<E> {
  const [chosen, setChosen] = useState<string | null>(() => {
    const k = keepAs === undefined ? undefined : keep.view(keepAs);
    return typeof k === 'string' ? k : null;
  });
  const ref = useRef<E>(null);
  const scrollTo = useRef<string | null>(null);
  const sel = shownSel(order, chosen);
  const setSel = (key: string | null) => {
    if (keepAs !== undefined) keep.setView(keepAs, key ?? undefined, true);
    setChosen(key);
  };
  useEffect(() => {
    // the list takes the keys when nothing else has the focus
    const a = document.activeElement;
    if (a === null || a === document.body) ref.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    const want = scrollTo.current;
    if (want === null || want !== sel) return;
    scrollTo.current = null;
    const row = [...(ref.current?.querySelectorAll<HTMLElement>('[data-row]') ?? [])].find((r) => r.dataset['row'] === want);
    // jsdom has no scrollIntoView
    (row as Partial<HTMLElement> | undefined)?.scrollIntoView?.({ block: 'nearest' });
  }, [sel]);
  const move = (d: number) => {
    const next = moved(order, sel, d);
    scrollTo.current = next;
    setSel(next);
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.defaultPrevented || ownKeys(e.target, ref.current)) return;
    const plain = !e.metaKey && !e.ctrlKey && !e.altKey;
    const d = plain ? stepOf(e.key) : 0;
    if (d !== 0) {
      e.preventDefault();
      move(d);
      return;
    }
    if (plain && e.key === 'Enter' && sel !== null && onOpen !== undefined) {
      e.preventDefault();
      onOpen(sel);
      return;
    }
    if (onKey?.(e, sel) === true) e.preventDefault();
  };
  return { sel, setSel, ref, onKeyDown, move };
}
