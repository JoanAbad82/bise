// The outer card's '+ N more' (his m_46685, m_46687; designer m_46693): N is the next step of 50 or
// what is left, never past it, and no row once all show. Mutation: moreOf without its Math.min on
// MORE_STEP (or without the floor at 0) turns this red.
import { describe, expect, it } from 'vitest';
import { canLess, FIRST_AGENTS, FIRST_ROWS, headLift, lessOf, MORE_STEP, moreOf } from './outerrows';

describe('\'show less\' (his m_47005, designer m_47011)', () => {
  it('folds 50 back, never under the first rows', () => {
    expect(lessOf(105, FIRST_ROWS)).toBe(55);
    expect(lessOf(55, FIRST_ROWS)).toBe(5);
    expect(lessOf(60, FIRST_AGENTS)).toBe(10);
    expect(lessOf(5, FIRST_ROWS)).toBe(5);
  });

  it('shows while more than the first rows show', () => {
    expect(canLess(55, 62, FIRST_ROWS)).toBe(true);
    expect(canLess(55, 5, FIRST_ROWS)).toBe(false);
    expect(canLess(5, 62, FIRST_ROWS)).toBe(false);
    expect(canLess(60, 13, FIRST_AGENTS)).toBe(true);
  });

  it('a fold that left the head above the card\'s top scrolls back by that much, else not', () => {
    expect(headLift(-340, 212)).toBe(552);
    expect(headLift(400, 212)).toBe(0);
  });
});

describe('\'+ N more\' in the outer card', () => {
  it('Agents shows 10 first, the other sections 5, and a click adds 50', () => {
    expect([FIRST_AGENTS, FIRST_ROWS, MORE_STEP]).toEqual([10, 5, 50]);
  });

  it('N is 50 while more than 50 are left, then what is left, then no row', () => {
    expect(moreOf(5, 1145)).toBe(50);
    expect(moreOf(55, 60)).toBe(5);
    expect(moreOf(5, 5)).toBe(0);
    expect(moreOf(5, 3)).toBe(0);
    expect(moreOf(10, 0)).toBe(0);
  });

  it('after k clicks every row up to 5 + 50k shows: the steps add up to the total, never past it', () => {
    for (const total of [0, 3, 5, 6, 55, 56, 1145]) {
      let shown = FIRST_ROWS;
      for (let n = moreOf(shown, total); n > 0; n = moreOf(shown, total)) {
        expect(n).toBeLessThanOrEqual(MORE_STEP);
        shown += MORE_STEP;
      }
      expect(Math.min(shown, total)).toBe(total);
    }
  });
});
