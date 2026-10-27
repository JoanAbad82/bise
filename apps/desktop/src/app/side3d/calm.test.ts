import { describe, expect, it } from 'vitest';
import { heldOrder, slideOf } from './calm';

const id = (s: string) => s;

describe('the agents lists move calmly (designer m_47454)', () => {
  it('holds the order he sees: a gone row leaves, a newcomer goes after the row before it', () => {
    expect(heldOrder(['a', 'b', 'c'], ['c', 'a', 'b'], id)).toEqual(['a', 'b', 'c']);
    expect(heldOrder(['a', 'b', 'c'], ['c', 'a'], id)).toEqual(['a', 'c']);
    // a worktree's new member stays under its head
    expect(heldOrder(['ψ', 'x', 'y'], ['y', 'ψ', 'x', 'n'], id)).toEqual(['ψ', 'x', 'n', 'y']);
    expect(heldOrder(['a', 'b'], ['n', 'b', 'a'], id)).toEqual(['n', 'a', 'b']);
    expect(heldOrder(null, ['b', 'a'], id)).toEqual(['b', 'a']);
  });

  it('slides the rows that changed place, from their old top; none when only a height changed', () => {
    const was = new Map([['a', 0], ['b', 48], ['c', 96]]);
    const now = new Map([['c', 0], ['a', 48], ['b', 96]]);
    expect([...slideOf(['a', 'b', 'c'], ['c', 'a', 'b'], was, now)]).toEqual([['c', 96], ['a', -48], ['b', -48]]);
    // an ask opened in place grows its row: the order is the same, no slide
    expect(slideOf(['a', 'b'], ['a', 'b'], new Map([['a', 0], ['b', 48]]), new Map([['a', 0], ['b', 120]])).size).toBe(0);
    // a newcomer at the top pushes the others, the order of the kept is the same: no slide
    expect(slideOf(['a', 'b'], ['n', 'a', 'b'], new Map([['a', 0], ['b', 48]]), new Map([['n', 0], ['a', 48], ['b', 96]])).size).toBe(0);
  });
});
