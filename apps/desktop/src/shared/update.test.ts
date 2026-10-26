// update-dot (architect m_46059): one update card for the machine, grouped by its typed place only.
import { describe, expect, it } from 'vitest';
import { countOnce, isUpdate, knockOnce, oneUpdate, releaseKey } from './update';

const up = (project: string, id: number, rel = 'release:6') => ({ project, id, kind: 'update', place: rel });
const q = (project: string, id: number) => ({ project, id, kind: 'question', place: undefined });

describe('one update card for the machine', () => {
  it('an update card is kind update about a release place, nothing else', () => {
    expect(isUpdate(up('a', 1))).toBe(true);
    expect(isUpdate({ kind: 'update', place: 'wt:x' })).toBe(false);
    expect(isUpdate({ kind: 'merge', place: 'release:6' })).toBe(false);
    expect(releaseKey(up('a', 1))).toBe('release:6');
    expect(releaseKey(q('a', 1))).toBe('');
  });
  it("lists one card of each release, bise's own when the home has one, every other card in place", () => {
    const cards = [up('acme', 4), q('acme', 5), up('home', 9), up('web', 2, 'release:7'), up('shop', 3, 'release:7')];
    expect(oneUpdate(cards, 'home').map((c) => `${c.project}-${String(c.id)}`)).toEqual(['acme-5', 'home-9', 'web-2']);
    // no home card: the first of it in the given order
    expect(oneUpdate([up('acme', 4), up('web', 2)], 'home').map((c) => c.project)).toEqual(['acme']);
    expect(oneUpdate([q('a', 1)], 'home')).toEqual([q('a', 1)]);
  });
  it('counts a release once between every hub, every other card once each', () => {
    expect(countOnce([[up('a', 1), q('a', 2)], [up('b', 1)], [up('c', 1, 'release:7')]])).toBe(3);
    expect(countOnce([[], [null, 3]])).toBe(2);
  });
  it('a release knocks once: the first of it in a batch, never again once it knocked', () => {
    const { post, keys } = knockOnce([up('a', 1), q('a', 2), up('b', 1)], new Set());
    expect(post.map((c) => `${c.project}-${String(c.id)}`)).toEqual(['a-1', 'a-2']);
    expect(keys).toEqual(['release:6']);
    expect(knockOnce([up('c', 1)], new Set(['release:6'])).post).toEqual([]);
  });
});
