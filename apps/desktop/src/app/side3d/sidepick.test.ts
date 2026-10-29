// @vitest-environment happy-dom
// The right side's form by his hand (side-mini, his m_46698; designer m_46706): the pick is kept per
// window across a restart, the toggle flips it once the old form is gone, and the button dims only
// when the window holds no card.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { keep } from '../keep';
import { cardFits, sideCompact, SWAP_MS, SWAP_OUT_MS } from './sidepick';

/** rail 56 + sidebar 240 */
const SIDE = 296;

afterEach(() => {
  vi.useRealTimers();
  sideCompact.set(false);
});

describe('the compact pick', () => {
  it('is kept (keep.ts, per window) and read back after a restart; the card is the default, nothing kept', () => {
    expect(sideCompact.get()).toBe(false);
    sideCompact.set(true);
    expect(keep.view('outer.compact')).toBe(true);
    sideCompact.reset();
    expect(sideCompact.get()).toBe(true);
    sideCompact.set(false);
    expect(keep.view('outer.compact')).toBeUndefined();
  });

  it('the toggle flips it once the card is gone, and the swap leaves the root after the coins came in', () => {
    vi.useFakeTimers();
    const root = document.documentElement;
    sideCompact.toggle();
    expect(root.dataset['sideSwap']).toBe('to-coins');
    expect(sideCompact.get()).toBe(false);
    vi.advanceTimersByTime(SWAP_OUT_MS.full);
    expect(sideCompact.get()).toBe(true);
    vi.advanceTimersByTime(SWAP_MS.full - SWAP_OUT_MS.full);
    expect(root.dataset['sideSwap']).toBeUndefined();
    sideCompact.toggle();
    expect(root.dataset['sideSwap']).toBe('to-card');
    vi.advanceTimersByTime(SWAP_MS.full);
    expect(sideCompact.get()).toBe(false);
  });
});

describe('cardFits (the button lit or dimmed)', () => {
  it('a wide window holds the card; 1100 with the sidebar shown does not; a page with no side never', () => {
    expect(cardFits(1440, SIDE, true)).toBe(true);
    expect(cardFits(1100, SIDE, true)).toBe(false);
    expect(cardFits(1100, 56, true)).toBe(true);
    expect(cardFits(1920, SIDE, false)).toBe(false);
  });
});
