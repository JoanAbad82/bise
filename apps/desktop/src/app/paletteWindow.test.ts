// ⌘K draws only the rows in view (paletteWindow.ts). Mutations: the selected row's run dropped,
// the head's height left out of the group's top, the view-high overscan or the scroll side's two steps
// view dropped: each turns this red.
import { describe, expect, it } from 'vitest';
import { windowOf, type Measures, type Part } from './paletteWindow';

const M: Measures = { row: 32, head: 28, pad: 4 };
/** the box: 320 px, ten rows */
const VIEW = 320;
const ROWS = VIEW / M.row;
const drawn = (ps: readonly Part[]): number[] => ps.flatMap((p) => ('draw' in p ? Array.from({ length: p.draw[1] - p.draw[0] }, (_, i) => p.draw[0] + i) : []));
const total = (ps: readonly Part[]): number => ps.reduce((n, p) => n + ('gap' in p ? p.gap : p.draw[1] - p.draw[0]), 0);

describe('⌘K draws the rows in view, gaps keep the rest in place', () => {
  it('at the top: the rows in view and a view more below, one gap for the rest', () => {
    const [g] = windowOf({ sizes: [1000], askRow: false, m: M, scrollTop: 0, view: VIEW, cur: 0 });
    if (g === undefined) throw new Error('no group');
    expect(total(g)).toBe(1000);
    const d = drawn(g);
    expect(d[0]).toBe(0);
    // the box shows rows 0..8 (row 9 starts at 4 + 28 + 9 × 32 = 320), then a view's height more
    expect(d.length).toBe(9 + ROWS);
    expect(g.at(-1)).toEqual({ gap: 1000 - d.length });
  });

  it('scrolled: a gap above holds the rows passed, the rows in view and a view each side are drawn', () => {
    const top = 4 + 28 + 500 * 32;
    const [g] = windowOf({ sizes: [1000], askRow: false, m: M, scrollTop: top, view: VIEW, cur: 500 });
    if (g === undefined) throw new Error('no group');
    expect(total(g)).toBe(1000);
    expect(g[0]).toEqual({ gap: 500 - ROWS });
    expect(drawn(g)).toContain(500);
    expect(drawn(g)).toContain(509 + ROWS);
    expect(drawn(g)).not.toContain(509 + ROWS + 2);
  });

  it('a fast scroll finds rows ready: two steps (a view at least) more on the side it scrolls to', () => {
    const top = 4 + 28 + 500 * 32;
    const at = (dir: -1 | 0 | 1, step = 0) => {
      const [g] = windowOf({ sizes: [1000], askRow: false, m: M, scrollTop: top, view: VIEW, cur: 500, dir, step });
      if (g === undefined) throw new Error('no group');
      return drawn(g);
    };
    expect(at(1)).toContain(509 + 3 * ROWS);
    expect(at(1)).not.toContain(500 - ROWS - 1);
    expect(at(-1)).toContain(500 - 3 * ROWS);
    expect(at(-1)).not.toContain(509 + ROWS + 2);
    // a wheel step of 900 px, more than the view: two of them ahead
    expect(at(1, 900)).toContain(509 + ROWS + Math.floor((2 * 900) / M.row));
    expect(at(-1, 900)).toContain(500 - ROWS - Math.floor((2 * 900) / M.row));
  });

  it('the selected row is drawn even far from the view (its scrollIntoView finds it)', () => {
    const [g] = windowOf({ sizes: [1000], askRow: true, m: M, scrollTop: 0, view: VIEW, cur: 701 });
    if (g === undefined) throw new Error('no group');
    expect(total(g)).toBe(1000);
    // the ask row is flat 0: the group's row 700 is flat 701
    expect(drawn(g)).toContain(700);
    expect(drawn(g)).not.toContain(699);
    expect(drawn(g)).not.toContain(701);
  });

  it('a later group starts under the earlier one and its head', () => {
    // the first group's 100 rows fill 3200 px: scrolled to the second group's first row
    const top = 4 + 28 + 100 * 32 + 28;
    const [a, b] = windowOf({ sizes: [100, 100], askRow: false, m: M, scrollTop: top, view: VIEW, cur: 0 });
    if (a === undefined || b === undefined) throw new Error('no groups');
    expect(drawn(a)).toContain(0);
    expect(drawn(a)).toContain(99);
    expect(drawn(a)).not.toContain(99 - ROWS - 1);
    expect(drawn(b)[0]).toBe(0);
    expect(drawn(b)).toContain(9 + ROWS);
  });

  it('a short list is drawn whole', () => {
    const gs = windowOf({ sizes: [3, 12], askRow: true, m: M, scrollTop: 0, view: 0, cur: 0 });
    expect(gs).toEqual([[{ draw: [0, 3] }], [{ draw: [0, 12] }]]);
  });
});
