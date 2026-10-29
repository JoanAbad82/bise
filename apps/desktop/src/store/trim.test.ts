import { describe, expect, it } from "vitest";
import { KEEP_ABOVE, KEEP_BELOW, MAX_ABOVE, TAIL_KEEP, trim } from "./trim";
import type { ThreadOrder } from "./types";

const run = (a: number, b: number): number[] => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const tail = (order: number[]): ThreadOrder => ({ order, before: order[0] ?? null, more: true, loaded: true });

describe("trim", () => {
  it("a short view stays whole", () => {
    const v = tail(run(1, 400));
    expect(trim(v, 1).view).toBe(v);
  });

  it("scrolled far up: the newest go into a gap but the tail's last lines, the read one kept", () => {
    const v = tail(run(1, 3000));
    const { view, dropped } = trim(v, 100);
    expect(view.order).toContain(100);
    expect(view.order.slice(0, 2)).toEqual([1, 2]);
    expect(view.gap).toEqual({ lo: 100 + KEEP_BELOW, hi: 3001 - TAIL_KEEP, from: 101 + KEEP_BELOW });
    expect(view.order.slice(-TAIL_KEEP)).toEqual(run(3001 - TAIL_KEEP, 3000));
    expect(view.order.length).toBe(100 + KEEP_BELOW + TAIL_KEEP);
    expect(dropped.length + view.order.length).toBe(3000);
  });

  it("far below the oldest held: the oldest go, before is the new oldest", () => {
    const v = tail(run(1, 1200));
    const { view } = trim(v, 1000);
    expect(view.order[0]).toBe(1000 - KEEP_ABOVE);
    expect(view.before).toBe(1000 - KEEP_ABOVE);
    expect(view.more).toBe(true);
    expect(view.gap).toBeUndefined();
  });

  it("in a window: the window's newer part joins its gap, the tail stays", () => {
    const order = [...run(100, 1000), ...run(5000, 5050)];
    const v: ThreadOrder = { ...tail(order), gap: { lo: 1000, hi: 5000, from: 1001 } };
    const { view } = trim(v, 200);
    expect(view.gap).toEqual({ lo: 200 + KEEP_BELOW, hi: 5000, from: 201 + KEEP_BELOW });
    expect(view.order.at(-1)).toBe(5050);
    expect(view.order).not.toContain(900);
  });

  it("reading in the tail below a window: the window goes with the older cut", () => {
    const order = [...run(100, 400), ...run(5000, 5800)];
    const v: ThreadOrder = { ...tail(order), gap: { lo: 400, hi: 5000, from: 401 } };
    const { view } = trim(v, 5700);
    expect(view.gap).toBeUndefined();
    expect(view.order[0]).toBe(5700 - KEEP_ABOVE);
    expect(view.before).toBe(5700 - KEEP_ABOVE);
  });

  it("an unknown pos changes nothing; just under the limits nothing goes", () => {
    const v = tail(run(1, 2000));
    expect(trim(v, 99999).view).toBe(v);
    const w = tail(run(1, MAX_ABOVE + 1 + 500 + TAIL_KEEP));
    expect(trim(w, MAX_ABOVE + 1).view).toBe(w);
  });
});
