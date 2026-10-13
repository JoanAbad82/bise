import { describe, expect, it } from 'vitest';
import { BARS, flat, push, step, wave } from './meter';

describe('the dictation meter (the TUI voice chip)', () => {
  it('a level is one of 8 steps, silence the lowest, full scale the highest', () => {
    expect([0, 0.1, 0.125, 0.5, 0.99, 1, 2].map(step)).toEqual([0, 0, 1, 4, 7, 7, 7]);
    expect([-1, Number.NaN].map(step)).toEqual([0, 0]);
  });

  it('silence: 6 bars at the lowest step, never fewer', () => {
    expect(flat()).toEqual([0, 0, 0, 0, 0, 0]);
    expect(BARS).toBe(6);
  });

  it('each level comes in on the right, the oldest goes left', () => {
    let b = flat();
    b = push(b, 0.7);
    b = push(b, 0.4);
    expect(b).toEqual([0, 0, 0, 0, 5, 3]);
    for (const v of [0.1, 0.9, 0.3, 0.6, 0.2]) b = push(b, v);
    expect(b).toEqual([3, 0, 7, 2, 4, 1]);
  });

  it('transcribing: the wave ▂▃▅▆▅▃ rolls one bar each frame, back at its start after 6', () => {
    expect(wave(0)).toEqual([1, 2, 4, 5, 4, 2]);
    expect(wave(1)).toEqual([2, 4, 5, 4, 2, 1]);
    expect(wave(6)).toEqual(wave(0));
  });
});
