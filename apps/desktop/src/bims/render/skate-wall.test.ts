// The wall rides (render/skate.ts wallRide, designer m_49888: on the vert and in the bowl the rider
// read as lying on the ramp): on a steep wall the bim crouches hard and stands ~30° back towards
// upright, its board kept on the wall; flat ground, the air and a bail as they were.
import { describe, expect, it } from 'vitest';
import { WALL_BACK, wallRide, type Stance } from './skate';

const RIDE: Stance = { knees: 0.5, arms: 1, up: 0, lean: 0, spin: 0, board: [0, 0, 0], boardUp: 0, mouth: 'smile', eyes: 1, sit: false };

describe('wall rides', () => {
  it('on a near-vertical wall: crouched, ~30° back towards upright, the board still on the wall', () => {
    for (const [tilt, axis] of [[[1.4, 0], 0], [[-1.4, 0], 0], [[0, 1.3], 1], [[0, -1.3], 1]] as const) {
      const w = wallRide([tilt[0], tilt[1]], 0, RIDE);
      const a = tilt[axis];
      // the bim: back towards upright by WALL_BACK, never past it
      expect(Math.abs(w.tilt[axis])).toBeCloseTo(Math.abs(a) - WALL_BACK, 6);
      expect(Math.sign(w.tilt[axis])).toBe(Math.sign(a));
      // the board: the same angle as the wall in the world (the group's tilt + its own)
      const own = axis === 0 ? w.body.board[0] : w.body.board[2];
      expect(w.tilt[axis] + own).toBeCloseTo(a, 6);
      expect(w.body.knees).toBeGreaterThan(1.2);
    }
  });

  it('flat ground, a gentle slope, the air and a bail: as they were', () => {
    for (const t of [[0, 0], [0.2, 0.1]] as const) expect(wallRide([t[0], t[1]], 0, RIDE)).toEqual({ tilt: [t[0], t[1]], body: RIDE });
    expect(wallRide([1.4, 0], 0.4, RIDE).tilt).toEqual([1.4, 0]);
    const sat = { ...RIDE, sit: true };
    expect(wallRide([1.4, 0], 0, sat)).toEqual({ tilt: [1.4, 0], body: sat });
  });
});
