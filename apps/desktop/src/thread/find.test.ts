import { describe, expect, it } from 'vitest';
import { counter, currentMatch, EMPTY, newer, older, refresh, search, wantsOlder } from './find';

const page = [
  { pos: 10, text: 'the bench is Cold' },
  { pos: 12, text: 'cold again, then cold' },
  { pos: 15, text: 'nothing' },
];

describe('find', () => {
  it('starts on the newest match; ⏎ goes older, shift+⏎ newer, both stop at the ends', () => {
    let s = search(page, 'COLD');
    expect(s.matches.map((m) => [m.pos, m.at])).toEqual([
      [10, 13],
      [12, 0],
      [12, 17],
    ]);
    expect(currentMatch(s)).toEqual({ pos: 12, at: 17 });
    expect(counter(s, false)).toBe('1/3');
    s = older(older(older(s)));
    expect(currentMatch(s)).toEqual({ pos: 10, at: 13 });
    expect(counter(s, false)).toBe('3/3');
    s = newer(newer(newer(s)));
    expect(currentMatch(s)).toEqual({ pos: 12, at: 17 });
  });

  it('an older page in front keeps the current match and the counter says +', () => {
    let s = older(search(page, 'cold'));
    expect(counter(s, true)).toBe('2/3+');
    s = refresh(s, [{ pos: 2, text: 'cold start' }, ...page]);
    expect(currentMatch(s)).toEqual({ pos: 12, at: 0 });
    expect(counter(s, false)).toBe('2/4');
  });

  it('asks older pages only with a needle and more before', () => {
    expect(wantsOlder(EMPTY, true)).toBe(false);
    expect(wantsOlder(search(page, 'x'), true)).toBe(true);
    expect(wantsOlder(search(page, 'x'), false)).toBe(false);
    expect(counter(search(page, 'x'), true)).toBe('0+');
    expect(counter(EMPTY, false)).toBe('');
  });
});
