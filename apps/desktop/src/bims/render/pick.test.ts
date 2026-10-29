import { describe, expect, it } from 'vitest';
import { pickAt, type Target } from './pick';

const bim = (name: string, x: number, y: number, desk?: { x: number; y: number }): Target => ({
  name,
  head: { x, y },
  feet: { x, y: y + 30 },
  desk: desk ? { ...desk, r: 20 } : null,
});

describe('pick', () => {
  it('picks the bim whose body is under the point', () => {
    const ts = [bim('a', 50, 50), bim('b', 120, 50)];
    expect(pickAt(ts, 52, 65)).toBe('a');
    expect(pickAt(ts, 118, 79)).toBe('b');
  });

  it('picks the nearest of two close bims', () => {
    expect(pickAt([bim('a', 50, 50), bim('b', 62, 50)], 59, 60)).toBe('b');
  });

  it('falls back to the desk under the point when no body is near', () => {
    const ts: Target[] = [{ name: 'away', head: null, feet: null, desk: { x: 200, y: 100, r: 20 } }, bim('a', 50, 50)];
    expect(pickAt(ts, 205, 110)).toBe('away');
  });

  it('answers null on nothing', () => {
    expect(pickAt([bim('a', 50, 50, { x: 50, y: 90 })], 250, 250)).toBeNull();
  });
});
