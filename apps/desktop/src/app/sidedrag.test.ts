import { describe, expect, it } from 'vitest';
import { DRAG_PX, dragStep, dropMark, edgeScroll, EDGE_PX, EDGE_STEP, shownOrder, slideOf, type RowDrag } from './sidedrag';

// three rows 56 tall, 4 apart: middles 28, 88, 148, a pitch of 60
const MIDS = [28, 88, 148];
const press = (from: number, y0: number): RowDrag => ({ from, y0, scroll0: 0, mids: MIDS, dy: 0, to: from, on: false });

describe('a press on a project row', () => {
  it('lifts past DRAG_PX only, then lands where the pointer is', () => {
    const d = dragStep(press(2, 148), 148 - DRAG_PX, 0);
    expect([d.on, d.to]).toEqual([false, 2]);
    const up = dragStep(d, 10, 0);
    expect([up.on, up.to, up.dy]).toEqual([true, 0, -138]);
    // once lifted it stays lifted, even back near where it started
    expect(dragStep(up, 147, 0).on).toBe(true);
  });

  it('follows the list it scrolls: the slot is read on the list as it was at the press', () => {
    const d = dragStep({ ...press(0, 28), on: true }, 28, 40);
    expect(d.dy).toBe(40);
    expect(d.to).toBe(1);
  });

  // designer m_49316. Mutation: dropping the `(j - i) * pitch` term leaves the dragged row's slot open.
  it("slides the rows open where it lands, the dragged row's own slot closed", () => {
    const slides = (from: number, to: number) => [0, 1, 2].map((i) => slideOf({ ...press(from, 0), on: true, to }, i));
    // the last one dragged to the top: the two others go down one row
    expect(slides(2, 0)).toEqual([60, 60, 0]);
    // the first one dragged to the end: the two others close its slot
    expect(slides(0, 3)).toEqual([0, -60, -60]);
    // the first one between the second and the third: the second one closes its slot, the third stays
    expect(slides(0, 2)).toEqual([0, -60, 0]);
    // where it already is: nothing moves
    expect(slides(1, 1)).toEqual([0, 0, 0]);
    expect(slideOf(press(2, 0), 0)).toBe(0);
    expect(slideOf(null, 0)).toBe(0);
  });

  it('under reduced motion draws one line: before the slot, after the last row for the end, none where it already is', () => {
    const at = (to: number, from = 2): (string | undefined)[] => [0, 1, 2].map((i) => dropMark({ ...press(from, 0), on: true, to }, i, 3));
    expect(at(0)).toEqual(['before', undefined, undefined]);
    expect(at(2)).toEqual([undefined, undefined, undefined]);
    expect(at(3)).toEqual([undefined, undefined, undefined]);
    expect(at(3, 0)).toEqual([undefined, undefined, 'after']);
    expect(dropMark(press(2, 0), 0, 3)).toBeUndefined();
    expect(dropMark(null, 0, 3)).toBeUndefined();
  });

  it('scrolls the list near its edges only', () => {
    expect(edgeScroll(100 + EDGE_PX - 1, 100, 500)).toBe(-EDGE_STEP);
    expect(edgeScroll(300, 100, 500)).toBe(0);
    expect(edgeScroll(500 - EDGE_PX + 1, 100, 500)).toBe(EDGE_STEP);
  });
});

describe('the order shown after a drop', () => {
  const a = { project: 'a' }, b = { project: 'b' }, c = { project: 'c' };
  const list = [a, b, c];
  it('is the dropped one while the core has not answered, the core’s once it does', () => {
    expect(shownOrder(list, { of: list, ids: ['c', 'a', 'b'] })).toEqual([c, a, b]);
    expect(shownOrder([a, b, c], { of: list, ids: ['c', 'a', 'b'] })).toEqual([a, b, c]);
    expect(shownOrder(list, null)).toBe(list);
  });
  it('a project added or gone meanwhile: the core’s list', () => {
    expect(shownOrder(list, { of: list, ids: ['c', 'a'] })).toBe(list);
  });
});
