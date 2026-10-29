import { describe, expect, it } from 'vitest';
import { drift, type Frame, type RowBox } from './steady';

const f = (t: number, rows: Record<string, RowBox>): Frame => ({ t, rows, ch: 600 });
// three rows he reads, 100 px each, the first at y
const at = (t: number, y: number, h3 = 100): Frame => f(t, { 1: { y, h: 100 }, 2: { y: y + 100, h: 100 }, 3: { y: y + 200, h: h3 } });

describe('drift', () => {
  it('a still list and his notches are no drift', () => {
    const d = drift([at(0, 10), at(16, 10), at(32, 70), at(48, 70), at(64, 190)], 60);
    expect(d).toEqual({ worst: 0, sum: 0, moved: 180, bad: [] });
  });
  it('a row moved by something else than his wheel is drift', () => {
    const d = drift([at(0, 10), at(16, 40), at(32, 100)], 60);
    expect(d.worst).toBe(30);
    expect(d.bad.map((b) => b.i)).toEqual([1]);
    // a jump close to a notch hides in one frame: it shows in the total (his one notch moved 116)
    expect(drift([at(0, 10), at(16, 126)], 60).moved).toBe(116);
  });
  it('pulled back toward the end (rows go up) is drift, even by a whole notch', () => {
    expect(drift([at(0, 200), at(16, 140)], 60).worst).toBe(60);
  });
  it('rows that move apart (a reflow on screen) are drift', () => {
    const d = drift([f(0, { 1: { y: 10, h: 100 }, 2: { y: 110, h: 100 } }), f(16, { 1: { y: 10, h: 100 }, 2: { y: 117, h: 100 } })], 60);
    expect(d.worst).toBe(7);
  });
  it('a row that grows pushes the rows under it: they never count, its top does', () => {
    const grow = f(16, { 1: { y: 10, h: 100 }, 2: { y: 110, h: 160 }, 3: { y: 270, h: 100 } });
    expect(drift([at(0, 10), grow], 60).worst).toBe(0);
    const pushed = f(16, { 1: { y: 10, h: 100 }, 2: { y: 125, h: 160 }, 3: { y: 285, h: 100 } });
    expect(drift([at(0, 10), pushed], 60).worst).toBe(15);
  });
  it('rows off screen never count', () => {
    const d = drift([f(0, { 1: { y: -50, h: 40 }, 2: { y: 10, h: 100 } }), f(16, { 1: { y: -90, h: 40 }, 2: { y: 10, h: 100 } })], 60);
    expect(d.worst).toBe(0);
  });
});
