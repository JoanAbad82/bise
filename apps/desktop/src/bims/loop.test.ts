// loop.ts: the office draws only while something moves, never while the window is away.
import { describe, expect, it } from 'vitest';
import type { Label } from './model';
import { FRAME_MS, TICK_MS, away, nextAfter } from './loop';

const none = new Map<string, Label>();
const label = (mode: Label['mode'], pill: Label['pill'] = null): ReadonlyMap<string, Label> => new Map([['perf', { name: 'perf', mode, words: '', title: '', pill }]]);
const still = { motion: 'still', moving: false, labels: none, away: false, lost: false } as const;

describe('the window away', () => {
  it('hidden is away, in the harness too', () => {
    expect(away({ hidden: true, focused: true, test: false })).toBe(true);
    expect(away({ hidden: true, focused: false, test: true })).toBe(true);
  });
  it('not in front is away, but not in the harness (it never focuses its window)', () => {
    expect(away({ hidden: false, focused: false, test: false })).toBe(true);
    expect(away({ hidden: false, focused: false, test: true })).toBe(false);
    expect(away({ hidden: false, focused: true, test: false })).toBe(false);
  });
});

describe('the next frame', () => {
  it('stops when all is still', () => {
    expect(nextAfter(still)).toBe(null);
    // a pill, a hover line, ctrl's names: they don't move
    expect(nextAfter({ ...still, labels: label('name', 'asks') })).toBe(null);
    expect(nextAfter({ ...still, labels: label('hover') })).toBe(null);
  });
  it('a walk, a transition, a plane: at the display rate', () => {
    expect(nextAfter({ ...still, motion: 'walk' })).toBe(0);
    expect(nextAfter({ ...still, moving: true })).toBe(0);
    expect(nextAfter({ ...still, motion: 'loop', moving: true })).toBe(0);
    expect(nextAfter({ ...still, motion: 'skate', moving: true })).toBe(0);
  });
  it('the ambient loops (typing, the ? jumps): a tick', () => {
    expect(nextAfter({ ...still, motion: 'loop' })).toBe(TICK_MS);
  });
  it('a skater on its line: 30 fps, never the display rate', () => {
    expect(nextAfter({ ...still, motion: 'skate' })).toBe(FRAME_MS.skate);
    expect(FRAME_MS.skate).toBe(Math.round(1000 / 30));
  });
  it('a skater at rest: no frame, one timer for its next line', () => {
    expect(nextAfter({ ...still, wake: 12.3 })).toBe(12300);
    expect(nextAfter({ ...still, wake: null })).toBe(null);
  });
  it("an event label's 3 s keep a tick until it goes", () => {
    expect(nextAfter({ ...still, labels: label('event') })).toBe(TICK_MS);
  });
  it('nothing while away or lost, whatever moves', () => {
    expect(nextAfter({ ...still, motion: 'walk', moving: true, away: true })).toBe(null);
    expect(nextAfter({ ...still, motion: 'loop', lost: true })).toBe(null);
    expect(nextAfter({ ...still, labels: label('event'), away: true })).toBe(null);
    expect(nextAfter({ ...still, motion: 'skate', away: true })).toBe(null);
    expect(nextAfter({ ...still, wake: 3, away: true })).toBe(null);
  });
});
