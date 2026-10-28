// The sidebar's projects, reordered by hand (his m_49107: the ones he finds most important on top).
// A press on a project row that travels past DRAG_PX lifts it: it follows the pointer, a 2 px line
// marks where it lands (as settings › projects, designer m_41841), the list scrolls when the pointer
// nears its top or bottom edge, esc puts it back. ⌥⌘↑ ⌥⌘↓ on a focused row move it by one. A drop
// tells the core (project_move: bise_home::projects is the order's one writer, so ⌘1-9, ⌘K, the
// capsule and Settings follow), and the list shows the new order at once, until the core's
// projects say it (or HELD_MS pass: a refused move goes back). The index is settings' movedTo,
// the one way to say where a row goes (architect m_49117). The step is pure (dragStep); the hook
// wires it to the list. Owner: project-order.
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent, type RefObject } from 'react';
import { dropIndex, movedList, movedTo } from '@/settings/projectRows';

/** the pointer travel before a press on a row becomes a drag (settings' own) */
export const DRAG_PX = 4;
/** how near the list's edge the pointer scrolls it, and by how much per move */
export const EDGE_PX = 28;
export const EDGE_STEP = 8;
/** how long the dropped order shows without the core's word (a refused move goes back) */
export const HELD_MS = 3000;

/** The attribute a draggable row carries: its index in the list. */
export const DRAG_ATTR = 'data-drag-i';

/** A press on a row: `on` once it travelled past DRAG_PX; `to` the slot it would land in. */
export type RowDrag = {
  readonly from: number;
  readonly y0: number;
  readonly scroll0: number;
  readonly dy: number;
  readonly to: number;
  readonly on: boolean;
};

/** The press at `y` (the list scrolled to `scroll`), the rows' middles (top to bottom, viewport y). Pure. */
export function dragStep(d: RowDrag, y: number, scroll: number, middles: readonly number[]): RowDrag {
  const dy = y - d.y0 + (scroll - d.scroll0);
  const on = d.on || Math.abs(y - d.y0) > DRAG_PX;
  return { ...d, dy, on, to: on ? dropIndex(middles, y) : d.from };
}

/** Where a row shows the drop line: before it, after it (the last row, the end slot), or none. Pure. */
export function dropMark(d: RowDrag | null, i: number, n: number): 'before' | 'after' | undefined {
  if (d === null || !d.on) return undefined;
  if (d.to === i && movedTo(d.from, i) !== null) return 'before';
  if (i === n - 1 && d.to === n && movedTo(d.from, n) !== null) return 'after';
  return undefined;
}

/** How far the list scrolls for a pointer at `y` in a list from `top` to `bottom`. Pure. */
export function edgeScroll(y: number, top: number, bottom: number): number {
  if (y < top + EDGE_PX) return -EDGE_STEP;
  if (y > bottom - EDGE_PX) return EDGE_STEP;
  return 0;
}

/** The order shown: the dropped one while the core hasn't answered (`held.of` is still the list it was dropped on). Pure. */
export function shownOrder<T extends { readonly project: string }>(list: readonly T[], held: { readonly of: readonly T[]; readonly ids: readonly string[] } | null): readonly T[] {
  if (held === null || held.of !== list) return list;
  const by = new Map(list.map((p) => [p.project, p]));
  const out = held.ids.flatMap((id) => {
    const p = by.get(id);
    return p === undefined ? [] : [p];
  });
  return out.length === list.length ? out : list;
}

type Held<T> = { readonly of: readonly T[]; readonly ids: readonly string[] };

/**
 * The list's drag: the rows to draw in their order, the press in flight, and the list's handlers.
 * `move(project, index)` tells the core. `list` must keep its identity until the core's projects
 * change (projectsOf memoised on the store's rows).
 */
export function useProjectDrag<T extends { readonly project: string }>(list: readonly T[], root: RefObject<HTMLElement | null>, move: (project: string, at: number) => void) {
  const [drag, setDrag] = useState<RowDrag | null>(null);
  const [held, setHeld] = useState<Held<T> | null>(null);
  const shown = shownOrder(list, held);
  const press = useRef<{ id: number; d: RowDrag } | null>(null);
  // a drop's (or esc's) click on the row it started on never opens the project
  const swallow = useRef(false);

  const drop = useCallback(
    (from: number, at: number) => {
      const p = shown[from];
      if (p === undefined) return;
      setHeld({ of: list, ids: movedList(shown, from, at).map((r) => r.project) });
      move(p.project, at);
    },
    [list, shown, move],
  );

  // the held order goes when the core's projects come (shownOrder drops it), or after HELD_MS (a refused move)
  useEffect(() => {
    if (held?.of !== list) return undefined;
    const t = window.setTimeout(() => {
      setHeld(null);
    }, HELD_MS);
    return () => {
      window.clearTimeout(t);
    };
  }, [held, list]);

  // the window's listeners live while a press does (not re-made at each move)
  const pressing = drag !== null;
  useEffect(() => {
    if (!pressing) return undefined;
    const el = root.current;
    const middles = (): number[] =>
      [...(el?.querySelectorAll<HTMLElement>(`[${DRAG_ATTR}]`) ?? [])].map((r) => {
        const b = r.getBoundingClientRect();
        return b.top + b.height / 2;
      });
    const moving = (e: globalThis.PointerEvent) => {
      const p = press.current;
      if (p === null || e.pointerId !== p.id || el === null) return;
      const b = el.getBoundingClientRect();
      if (p.d.on) el.scrollTop += edgeScroll(e.clientY, b.top, b.bottom);
      const d = dragStep(p.d, e.clientY, el.scrollTop, middles());
      // once it lifts, the list holds the pointer: the click goes to it, never to the row
      if (d.on && !p.d.on && typeof el.setPointerCapture === 'function') {
        try {
          el.setPointerCapture(e.pointerId);
        } catch {
          // the pointer already left: the window's listeners still see it
        }
      }
      press.current = { id: p.id, d };
      setDrag(d);
    };
    const up = (e: globalThis.PointerEvent) => {
      const p = press.current;
      if (p === null || e.pointerId !== p.id) return;
      press.current = null;
      setDrag(null);
      if (!p.d.on) return;
      swallow.current = true;
      const at = movedTo(p.d.from, p.d.to);
      if (at !== null) drop(p.d.from, at);
    };
    const cancel = () => {
      press.current = null;
      setDrag(null);
    };
    const esc = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape' || press.current?.d.on !== true) return;
      e.preventDefault();
      e.stopPropagation();
      swallow.current = true;
      cancel();
    };
    window.addEventListener('pointermove', moving);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('keydown', esc, true);
    return () => {
      window.removeEventListener('pointermove', moving);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('keydown', esc, true);
    };
  }, [pressing, root, drop]);

  const rowOf = (t: EventTarget): number | null => {
    const r = (t as HTMLElement).closest(`[${DRAG_ATTR}]`);
    const i = Number(r?.getAttribute(DRAG_ATTR) ?? NaN);
    return Number.isInteger(i) ? i : null;
  };

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    swallow.current = false;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
    if ((e.target as HTMLElement).closest('input') !== null) return;
    const i = rowOf(e.target);
    if (i === null) return;
    const d: RowDrag = { from: i, y0: e.clientY, scroll0: root.current?.scrollTop ?? 0, dy: 0, to: i, on: false };
    press.current = { id: e.pointerId, d };
    setDrag(d);
  };
  const onClickCapture = (e: MouseEvent<HTMLElement>) => {
    if (!swallow.current) return;
    swallow.current = false;
    e.preventDefault();
    e.stopPropagation();
  };
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (!(e.metaKey && e.altKey && !e.ctrlKey && !e.shiftKey) || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
    const i = rowOf(e.target);
    if (i === null) return;
    const at = i + (e.key === 'ArrowUp' ? -1 : 1);
    if (at < 0 || at >= shown.length) return;
    e.preventDefault();
    drop(i, at);
  };
  return { shown, drag: drag?.on === true ? drag : null, handlers: { onPointerDown, onClickCapture, onKeyDown } };
}
