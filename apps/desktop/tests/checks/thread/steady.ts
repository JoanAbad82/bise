// thread/scroll-steady's measure (pure, unit-tested in steady.test.ts): how far the lines he reads
// moved on screen between two drawn frames, other than by his own wheel. Owner: scroll-steady.

/** A drawn row: its top's px from the list's top edge, and its height. */
export interface RowBox {
  readonly y: number;
  readonly h: number;
}

/** One drawn frame: each drawn row by its data-item-index, and the list's visible height. */
export interface Frame {
  readonly t: number;
  readonly rows: Readonly<Record<string, RowBox>>;
  readonly ch: number;
}

export interface Drift {
  /** the farthest a frame moved what he reads other than by his notches (px) */
  readonly worst: number;
  /** every such px, added up */
  readonly sum: number;
  /** how far his rows moved down in all: his notches up and nothing else make notch x their count */
  readonly moved: number;
  /** the frames that moved wrong: their index, the shifts of their rows, the px of drift */
  readonly bad: readonly { readonly i: number; readonly shifts: readonly number[]; readonly err: number }[];
}

/** The bottom of the view: the fade over it, rows half out. */
const BOTTOM = 40;

/**
 * Between two frames, the rows on screen in both must all move by the same px, and that px is his
 * wheel: a whole number of notches down (he scrolls up), 0 when he didn't scroll. A row that grew
 * (the live reply, a running tool) pushes the rows under it: those are not counted, its own top
 * is. Anything else is drift: a row moved by a re-measure above it, a pull back to the end, lines
 * that reflowed. Pure.
 */
export function drift(frames: readonly Frame[], notch: number): Drift {
  const bad: { i: number; shifts: number[]; err: number }[] = [];
  let worst = 0;
  let sum = 0;
  let moved = 0;
  for (let i = 1; i < frames.length; i++) {
    const a = frames[i - 1];
    const b = frames[i];
    if (a === undefined || b === undefined) continue;
    const both = Object.keys(b.rows).filter((k) => a.rows[k] !== undefined);
    const grew = both.filter((k) => Math.abs((b.rows[k]?.h ?? 0) - (a.rows[k]?.h ?? 0)) >= 1).map(Number);
    const below = grew.length === 0 ? Infinity : Math.min(...grew);
    const seen = (f: Frame, k: string): boolean => {
      const y = f.rows[k]?.y;
      return y !== undefined && y >= 0 && y < f.ch - BOTTOM;
    };
    const shifts = [...new Set(both.filter((k) => Number(k) <= below && seen(a, k) && seen(b, k)).map((k) => Math.round((b.rows[k]?.y ?? 0) - (a.rows[k]?.y ?? 0))))].sort((x, y) => x - y);
    const first = shifts[0];
    if (first === undefined) continue;
    moved += first;
    const off = Math.max(...shifts.map((v) => Math.abs(v - Math.max(0, Math.round(v / notch)) * notch)));
    const err = Math.max(off, (shifts.at(-1) ?? first) - first);
    if (err === 0) continue;
    bad.push({ i, shifts, err });
    worst = Math.max(worst, err);
    sum += err;
  }
  return { worst, sum, moved, bad };
}
