import { describe, expect, it } from 'vitest';
import { BODY_KINDS, landedEchoes, NAMELESS_KINDS, retryOf, retryRuns, retryWords, ROW_KINDS, sameRoute, type TierEntry } from './tiers';

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

describe('retries (tui-parity H9, designer m_19832)', () => {
  const r = (n: number, next?: number) => `model call failed (attempt ${String(n)}/10): provider 529 (transient)${next === undefined ? '' : ` · retry ${String(next)}/10 in 4s`}`;
  it('reads the hub words and says them as one row', () => {
    const a = retryOf(r(2, 3));
    expect(a).toEqual({ attempt: 2, of: 10, why: 'provider 529 (transient)', next: { attempt: 3, wait: '4s' } });
    expect(a === null ? '' : retryWords(a)).toBe('model call failed · retry 3 of 10 in 4 s');
    const last = retryOf(r(10));
    expect(last?.next).toBeUndefined();
    expect(last === null ? '' : retryWords(last)).toBe('model call failed · try 10 of 10 failed');
    expect(retryOf('model call failed: odd')).toBeNull();
  });
  it('a run of consecutive tries keeps its last, with every try under it; anything between breaks it', () => {
    const list: Record<number, { kind: string; text: string }> = {
      1: { kind: 'notice', text: r(1, 2) },
      2: { kind: 'notice', text: r(2, 3) },
      3: { kind: 'notice', text: r(3, 4) },
      4: { kind: 'agent', text: 'done' },
      5: { kind: 'notice', text: r(1, 2) },
    };
    const { hidden, runs } = retryRuns([1, 2, 3, 4, 5], (p) => list[p]);
    expect([...hidden]).toEqual([1, 2]);
    expect(runs.get(3)).toEqual([r(1, 2), r(2, 3), r(3, 4)]);
    expect(runs.get(5)).toEqual([r(1, 2)]);
  });
});
