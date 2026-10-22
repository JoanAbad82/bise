// changedOutsideStill (still.ts), pure: the recorder's intended-motion boxes hide what moves on its
// own, and only up to MOVING_CAP of the window (review-gates m_37859).
import { describe, expect, it } from 'vitest';
import type { Box, Frame } from '../../harness';
import { changedOutsideStill, movingShare } from './still';

const W = 100, H = 100;

/** A white frame with the given pixels black, and its intended-motion boxes. */
function frame(black: [number, number][], masks: Box[] = []): Frame {
  const data = Buffer.alloc(W * H * 4, 255);
  for (const [x, y] of black) data.fill(0, (y * W + x) * 4, (y * W + x) * 4 + 3);
  return { t: 0, scale: 1, png: { width: W, height: H, data }, masks } as unknown as Frame;
}

const field: Box = { x: 0, y: 0, width: 10, height: 10 };
const pill: Box = { x: 80, y: 0, width: 10, height: 10 };
const spot: [number, number][] = [[84, 4], [85, 4], [84, 5], [85, 5], [86, 5]];
const away: [number, number][] = spot.map(([x, y]) => [x, y + 50]);

describe('changedOutsideStill', () => {
  it("a change inside a frame's intended-motion box is not counted", () => {
    expect(changedOutsideStill([frame([], [pill]), frame(spot, [pill])], field, null)).toEqual([0]);
  });

  it('the same change outside the box is counted', () => {
    expect(changedOutsideStill([frame([], [pill]), frame(away, [pill])], field, null)).toEqual([5]);
  });

  it('boxes over 5% of the window fail the check: too wide to judge', () => {
    const wide: Box = { x: 0, y: 50, width: 100, height: 6 };
    expect(movingShare([frame([], [wide])])).toBeCloseTo(0.06);
    expect(() => changedOutsideStill([frame([], [wide]), frame(away, [wide])], field, null)).toThrow(/intended-motion boxes cover 6\.0%: too wide to judge/);
  });
});
