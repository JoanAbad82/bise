import { describe, expect, it } from 'vitest';
import { landedEchoes, type TierEntry } from './tiers';

describe('landedEchoes (designer m_19387: one land per sha)', () => {
  const E: Record<number, TierEntry> = {
    1: { kind: 'agent', text: 'done' },
    2: { kind: 'notice', text: '✓ flake-roots landed 1 commit on main (2c24ce15) · pushed' },
    3: { kind: 'landed', text: '1 file +12 −2', landed: { sha: '2c24ce15aa9f' } },
    4: { kind: 'from_agent', text: 'perf landed 2 commits on main (abcdef12) · pushed' },
  };
  it('the hub line that says again a typed land goes; a land with no typed row stays', () => {
    expect([...landedEchoes([1, 2, 3, 4], (p) => E[p])]).toEqual([2]);
  });
  it('no typed land: nothing goes', () => {
    expect(landedEchoes([1, 2, 4], (p) => E[p]).size).toBe(0);
  });
});
