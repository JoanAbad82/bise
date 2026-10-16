import { describe, expect, it } from 'vitest';
import type { Growth } from '@/proto';
import { growOf, growSig, growthOfKept, NO_GROW, raise, stageOf, STAGE_AT, tipOf, UNLOCK_LABEL, UNLOCK_WALK, unlockLabel, unlockOf } from './growth';

const g = (jobs_done: number, days_used = 0, artifacts_made = 0, since_ms?: number): Growth => ({ jobs_done, days_used, artifacts_made, ...(since_ms === undefined ? {} : { since_ms }) });

describe('growth: the drawing table over the hub counters', () => {
  it('a stage per threshold of jobs done, 0 to 14', () => {
    expect([0, 1, 2, 3, 5, 6, 10, 14, 15, 99, 100, 999, 1000, 5000].map(stageOf)).toEqual([0, 1, 1, 2, 2, 3, 4, 4, 5, 8, 9, 13, 14, 14]);
    STAGE_AT.forEach((at, i) => { expect(stageOf(at)).toBe(i); });
  });

  it('the garden by days used, the frames by artifacts (30 at most, golden from 500)', () => {
    expect([0, 1, 2, 3, 7, 14, 30, 60, 100, 365, 900].map((d) => growOf(g(0, d)).garden)).toEqual([0, 1, 1, 2, 3, 4, 5, 6, 7, 8, 8]);
    expect([0, 9, 10, 99, 300, 499, 500, 733].map((a) => [growOf(g(0, 0, a)).frames, growOf(g(0, 0, a)).golden])).toEqual([
      [0, false], [0, false], [1, false], [9, false], [30, false], [30, false], [30, true], [30, true],
    ]);
  });

  it('cones from 70% of the way to the next stage, none at the last', () => {
    // stage 8 is 60..99: 60 + 0.7 * 40 = 88
    expect(growOf(g(87)).building).toBe(false);
    expect(growOf(g(88)).building).toBe(true);
    // stage 0 to 1: 0.7 of one job is never a whole job before the stage itself
    expect(growOf(g(0)).building).toBe(false);
    expect(growOf(g(5000)).building).toBe(false);
    expect(growOf(null)).toEqual(NO_GROW);
  });

  it('the high-water mark never goes down, field by field (a resumed done agent takes nothing away)', () => {
    const a = g(702, 19, 733, 50);
    const b = g(701, 20, 700, 40);
    expect(raise(a, b)).toEqual(g(702, 20, 733, 40));
    expect(raise(null, b)).toEqual(b);
    expect(raise(a, null)).toEqual(a);
    expect(raise(undefined, undefined)).toBeNull();
    // law: raising by anything never lowers a counter
    for (const x of [g(0), g(1000, 1, 1), g(5, 400, 2)]) {
      const r = raise(a, x);
      expect(r && r.jobs_done >= a.jobs_done && r.days_used >= a.days_used && r.artifacts_made >= a.artifacts_made).toBe(true);
    }
  });

  it('a kept mark reads back, or nothing', () => {
    expect(growthOfKept({ jobs_done: 4.6, days_used: -2, artifacts_made: 'x' })).toEqual(g(4, 0, 0));
    expect(growthOfKept({ jobs_done: 3, days_used: 1, artifacts_made: 2, since_ms: 9 })).toEqual(g(3, 1, 2, 9));
    expect(growthOfKept(null)).toBeNull();
    expect(growthOfKept('7')).toBeNull();
  });

  it('an unlock is a stage past the last drawn, never the first sight', () => {
    expect(unlockOf(null, growOf(g(700)))).toBeNull();
    expect(unlockOf(growOf(g(59)), growOf(g(60)))).toBe(8);
    expect(unlockOf(growOf(g(60)), growOf(g(61)))).toBeNull();
    expect(unlockOf(growOf(g(61)), growOf(g(60)))).toBeNull();
  });

  it('the unlock label shows after the walk, for its 3 s; at once with reduced motion', () => {
    const u = { stage: 8, at: 100 };
    expect(unlockLabel(u, 100 + UNLOCK_WALK - 0.1, false)).toBeNull();
    expect(unlockLabel(u, 100 + UNLOCK_WALK, false)).toBe('new: trees all round');
    expect(unlockLabel(u, 100 + UNLOCK_WALK + UNLOCK_LABEL, false)).toBeNull();
    expect(unlockLabel(u, 100, true)).toBe('new: trees all round');
    expect(unlockLabel(undefined, 100, false)).toBeNull();
  });

  it('the corner tip: level, jobs done, the next piece and when', () => {
    expect(tipOf(growOf(g(702)))).toBe('level 13 · 702 jobs done · next: main\'s golden statue at 1000');
    expect(tipOf(growOf(g(1)))).toBe('level 1 · 1 job done · next: the kitchen island at 3');
    expect(tipOf(growOf(g(1200)))).toBe('level 14 · 1200 jobs done');
  });

  it('the world rebuilds only when what it draws moved', () => {
    expect(growSig(growOf(g(61, 3, 12)))).toBe(growSig(growOf(g(62, 3, 19))));
    expect(growSig(growOf(g(61)))).not.toBe(growSig(growOf(g(88))));
  });
});
