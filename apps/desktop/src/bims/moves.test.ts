import { describe, expect, it } from 'vitest';
import { BLINK_EVERY, HOP_EVERY, nextIn } from './moves';

describe("the cube's moves at rest (Cube.tsx)", () => {
  it('a blink every 8-20 s, a hop every 2-3 min (bims m_29026, his « toutes les 2-3 minutes »)', () => {
    expect(BLINK_EVERY).toEqual([8_000, 20_000]);
    expect(HOP_EVERY).toEqual([120_000, 180_000]);
    expect([nextIn('blink', 0), nextIn('blink', 0.5), nextIn('blink', 1)]).toEqual([8_000, 14_000, 20_000]);
    expect([nextIn('hop', 0), nextIn('hop', 1)]).toEqual([120_000, 180_000]);
  });
  it('a draw out of [0, 1] stays in the range; a check’s pace wins', () => {
    expect(nextIn('blink', -3)).toBe(8_000);
    expect(nextIn('hop', 7)).toBe(180_000);
    expect(nextIn('blink', 0.5, { blink: 600 })).toBe(600);
    expect(nextIn('hop', 0.5, { blink: 600 })).toBe(150_000);
  });
});
