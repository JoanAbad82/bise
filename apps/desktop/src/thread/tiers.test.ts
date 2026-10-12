import { describe, expect, it } from 'vitest';
import { BODY_KINDS, landedEchoes, NAMELESS_KINDS, ROW_KINDS, sameRoute, type TierEntry } from './tiers';

describe('sameRoute (designer m_19784 (2): one chip for a run of the same sender → receiver)', () => {
  it('two messages bise → perf share it; a reply or another receiver does not', () => {
    const to = (t: string) => ({ kind: 'to_agent', to: t });
    expect(sameRoute(to('perf'), to('perf'), 'main')).toBe(true);
    expect(sameRoute(to('perf'), to('docs'), 'main')).toBe(false);
    expect(sameRoute(to('perf'), { kind: 'from_agent', from: 'perf' }, 'main')).toBe(false);
    expect(sameRoute({ kind: 'from_agent', from: 'perf' }, { kind: 'from_agent', from: 'perf', to: 'main' }, 'main')).toBe(true);
    expect(sameRoute({ kind: 'agent' }, to('perf'), 'main')).toBe(false);
    expect(sameRoute(undefined, to('perf'), 'main')).toBe(false);
  });
});

describe('the tiers (designer m_19387)', () => {
  it('a nameless row is a dim row, never body text', () => {
    for (const k of NAMELESS_KINDS) {
      expect(ROW_KINDS.has(k), k).toBe(true);
      expect(BODY_KINDS.has(k), k).toBe(false);
    }
  });
});

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
