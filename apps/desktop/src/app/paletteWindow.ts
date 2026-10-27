// ⌘K draws only the rows in view (cmdk-perf, his m_46804): a one-letter query can match a
// thousand rows, and drawing them all made each keystroke slow. Pure: given the list's shape, the
// box's measures and its scroll, which rows of each group are drawn; the others are gaps of the
// same height, so the scroll bar and every row's place stay as if all were drawn. The selected
// row is always drawn (its scrollIntoView needs it). Owner: cmdk-perf, in amb-web's palette.

/** The box's measures in px (read from the DOM: the rows' height is fixed by palette.css). */
export interface Measures {
  /** one row (--h-row) */
  readonly row: number;
  /** a group's head */
  readonly head: number;
  /** the list's top padding */
  readonly pad: number;
}

/** What it draws before it measured (happy-dom, the first frame): 32 px rows, about one screen. */
export const UNMEASURED: Measures = { row: 32, head: 28, pad: 4 };

/** Rows drawn above and below the view, at least: a whole view's height is drawn each side, and
 * one more on the side it scrolls to (ui-review m_46875: a fast wheel jumps 900 px a step, and
 * the browser can paint the new place before the window follows). */
export const OVERSCAN = 8;

/** A group's rows, in order: drawn ones (`from`..`to`, excluded) and gaps of `rows` rows. */
export type Part = { readonly draw: readonly [number, number] } | { readonly gap: number };

export interface WindowIn {
  /** each group's row count, in order */
  readonly sizes: readonly number[];
  /** the 'ask bise' row first (always drawn) */
  readonly askRow: boolean;
  readonly m: Measures;
  readonly scrollTop: number;
  /** the box's visible height; 0: not laid out yet (one screen of 720 px is drawn) */
  readonly view: number;
  /** the selected row's flat index (the ask row counts as 0 when there is one) */
  readonly cur: number;
  /** where it last scrolled: -1 up, 1 down, 0 not yet */
  readonly dir?: -1 | 0 | 1;
}

/** Each group's parts, in order. */
export function windowOf(w: WindowIn): Part[][] {
  const view = w.view > 0 ? w.view : 720;
  const over = Math.max(OVERSCAN * w.m.row, w.view);
  const top = w.scrollTop - over - (w.dir === -1 ? view : 0);
  const bottom = w.scrollTop + view + over + (w.dir === 1 ? view : 0);
  let y = w.m.pad + (w.askRow ? w.m.row : 0);
  let flat = w.askRow ? 1 : 0;
  return w.sizes.map((n) => {
    y += w.m.head;
    // the rows whose box meets [top, bottom)
    const lo = Math.max(0, Math.min(n, Math.floor((top - y) / w.m.row)));
    const hi = Math.max(lo, Math.min(n, Math.ceil((bottom - y) / w.m.row)));
    const sel = w.cur - flat;
    y += n * w.m.row;
    flat += n;
    const runs: Array<readonly [number, number]> = [[lo, hi]];
    if (sel >= 0 && sel < n && (sel < lo || sel >= hi)) runs.push([sel, sel + 1]);
    runs.sort((a, b) => a[0] - b[0]);
    const parts: Part[] = [];
    let at = 0;
    for (const [a, b] of runs) {
      if (a === b) continue;
      if (a > at) parts.push({ gap: a - at });
      parts.push({ draw: [a, b] });
      at = b;
    }
    if (n > at) parts.push({ gap: n - at });
    return parts;
  });
}
