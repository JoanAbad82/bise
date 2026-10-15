import { describe, expect, it } from 'vitest';
import { counter, currentMatch, EMPTY, found, hitsIn, newer, older, refresh, search } from './find';

const page = [
  { pos: 10, text: 'the bench is Cold' },
  { pos: 12, text: 'cold again, then cold' },
  { pos: 15, text: 'nothing' },
];

describe('find', () => {
  it('starts on the newest match; ⏎ goes older, shift+⏎ newer, both stop at the ends', () => {
    let s = search(page, 'COLD', 1);
    s = found(s, { rid: 1, hits: hitsIn(page, 'cold'), upto: 15 }, page);
    expect(s.hits).toEqual([
      { pos: 10, n: 1 },
      { pos: 12, n: 2 },
    ]);
    expect(currentMatch(s)).toEqual({ pos: 12, k: 1 });
    expect(counter(s)).toBe('1/3');
    s = older(older(older(s)));
    expect(currentMatch(s)).toEqual({ pos: 10, k: 0 });
    expect(counter(s)).toBe('3/3');
    s = newer(newer(newer(s)));
    expect(currentMatch(s)).toEqual({ pos: 12, k: 1 });
  });

  it("the hub's answer counts the whole thread; the loaded ones meanwhile say '+'", () => {
    let s = search(page, 'cold', 7);
    expect(counter(s)).toBe('1/3+');
    // a stale answer (an older needle's) changes nothing
    expect(found(s, { rid: 6, hits: [{ pos: 1, n: 9 }], upto: 15 }, page)).toBe(s);
    s = found(s, { rid: 7, hits: [{ pos: 2, n: 1 }, ...hitsIn(page, 'cold')], upto: 15 }, page);
    expect(counter(s)).toBe('1/4');
    expect(currentMatch(s), 'he stays on the match he was on').toEqual({ pos: 12, k: 1 });
  });

  it('new lines after the answer are matched here and never move the current match', () => {
    let s = older(found(search(page, 'cold', 1), { rid: 1, hits: hitsIn(page, 'cold'), upto: 15 }, page));
    const at = currentMatch(s);
    const moved = s.moved;
    const more = [...page, { pos: 16, text: 'cold' }, { pos: 18, text: 'warm' }];
    s = refresh(s, more);
    expect(counter(s)).toBe('3/4');
    expect(currentMatch(s)).toEqual(at);
    expect(s.moved, 'the list is not sent back to it').toBe(moved);
    // the same entries again: the same state
    expect(refresh(s, more)).toBe(s);
    // a far page dropped from the store: the hub's hits stay
    expect(refresh(s, more.slice(2))).toBe(s);
  });

  it('moved counts his moves and new needles only', () => {
    const s = search(page, 'cold', 1);
    expect(older(s).moved).toBe(s.moved + 1);
    expect(older(older(older(older(s)))).moved).toBe(s.moved + 2);
    expect(search(page, 'x', 2, s.moved).moved).toBe(s.moved + 1);
  });

  it('no needle, no count; no match says 0', () => {
    expect(counter(EMPTY)).toBe('');
    expect(counter(search(page, 'x', 0))).toBe('0+');
    expect(counter(found(search(page, 'x', 3), { rid: 3, hits: [], upto: 15 }, page))).toBe('0');
  });
});
