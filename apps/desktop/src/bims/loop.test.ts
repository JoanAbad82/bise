// loop.ts: the office draws only while something moves, never while the window is away.
import { describe, expect, it } from 'vitest';
import type { Label } from './model';
import { away, nextAfter } from './loop';

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
    expect(nextAfter(still)).toBe('stop');
    // a pill, a hover line, ctrl's names: they don't move
    expect(nextAfter({ ...still, labels: label('name', 'asks') })).toBe('stop');
    expect(nextAfter({ ...still, labels: label('hover') })).toBe('stop');
  });
  it('a walk, a transition, a plane: at the display rate', () => {
    expect(nextAfter({ ...still, motion: 'walk' })).toBe('raf');
    expect(nextAfter({ ...still, moving: true })).toBe('raf');
    expect(nextAfter({ ...still, motion: 'loop', moving: true })).toBe('raf');
  });
  it('the ambient loops (typing, the ? jumps): a tick', () => {
    expect(nextAfter({ ...still, motion: 'loop' })).toBe('tick');
  });
  it("an event label's 3 s keep a tick until it goes", () => {
    expect(nextAfter({ ...still, labels: label('event') })).toBe('tick');
  });
  it('nothing while away or lost, whatever moves', () => {
    expect(nextAfter({ ...still, motion: 'walk', moving: true, away: true })).toBe('stop');
    expect(nextAfter({ ...still, motion: 'loop', lost: true })).toBe('stop');
    expect(nextAfter({ ...still, labels: label('event'), away: true })).toBe('stop');
  });
});
