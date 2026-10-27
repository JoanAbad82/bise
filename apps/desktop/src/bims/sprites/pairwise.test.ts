// The review's covering arrays (pairwise.ts): every valid pair shows up in some row, no row breaks
// the predicate, the same seed gives the same rows, and the set is far smaller than the product.
import { describe, expect, it } from 'vitest';
import { type Dim, type Row, missingPairs, pairwise, product } from './pairwise';

const DIMS: readonly Dim[] = [
  { name: 'who', values: ['agent', 'main'] },
  { name: 'head', values: ['cap', 'beanie', 'long', 'short', 'afro'] },
  { name: 'kind', values: ['hoodie', 'tee', 'sweater', 'puffer'] },
  { name: 'pose', values: ['type', 'nap', 'walk', 'eat', 'stand'] },
  { name: 'cam', values: ['office', 'coin', 'back'] },
  { name: 'skin', values: ['0', '1', '2', '3', '4', '5'] },
];

/** main wears the hoodie only, the short hair is main's, the coin shows a standing bim */
const valid = (r: Row): boolean => {
  if (r.who === 'main' && r.kind !== undefined && r.kind !== 'hoodie') return false;
  if (r.who === 'agent' && r.head === 'short') return false;
  if (r.cam === 'coin' && r.pose !== undefined && r.pose !== 'stand') return false;
  return true;
};

describe('pairwise', () => {
  it('covers every valid pair, breaks no constraint, in far fewer rows than the product', () => {
    const p = pairwise(DIMS, valid, 7);
    expect(missingPairs(DIMS, valid, p.rows, p.unreachable)).toEqual([]);
    for (const r of p.rows) expect(valid(r)).toBe(true);
    for (const r of p.rows) expect(Object.keys(r).sort()).toEqual(DIMS.map((d) => d.name).sort());
    const all = [...product(DIMS, valid)].length;
    expect(p.rows.length).toBeLessThan(all / 10);
    // the widest pair (head x pose, skin x head) bounds it from below
    expect(p.rows.length).toBeGreaterThanOrEqual(30);
  });

  it('names a pair no valid row can hold (main x short x puffer would be fine; main x tee never)', () => {
    const p = pairwise(DIMS, valid, 7);
    expect(p.rows.some((r) => r.who === 'main' && r.kind === 'tee')).toBe(false);
  });

  it('is the same for the same seed', () => {
    expect(pairwise(DIMS, valid, 3).rows).toEqual(pairwise(DIMS, valid, 3).rows);
  });

  it('walks the full product of valid rows', () => {
    const rows = [...product(DIMS.slice(0, 3), valid)];
    // agent: 4 heads x 4 kinds; main: 5 heads x 1 kind
    expect(rows.length).toBe(16 + 5);
  });
});
