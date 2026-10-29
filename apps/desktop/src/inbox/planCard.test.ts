import { describe, expect, it } from 'vitest';
import { kindTitle, planParts, typeWords } from './InboxCard';

describe("a plan's card (plan-ok, Gabriel's pick A)", () => {
  it("is its agent's: '<agent> proposes a plan', and typing goes to that agent", () => {
    expect(kindTitle('plan', 'lean-install')).toBe('lean-install proposes a plan');
    expect(typeWords({ kind: 'plan', agent: 'lean-install' }, 3)).toBe('or type what to change: lean-install reads it');
    expect(typeWords({ kind: 'plan', agent: 'main' }, 3)).toBe('or type what to change: bise reads it');
    // a question keeps its words
    expect(typeWords({ kind: 'question', agent: 'perf' }, 2)).toBe('or type your answer below');
    expect(typeWords({ kind: 'question', agent: 'perf' }, 0)).toBe('type your answer below');
  });

  it('reads its question first, the plan as its detail', () => {
    expect(planParts('lean installs: start the plan lean-install recommends?\nShips 1 and 2 now.')).toEqual(['lean installs: start the plan lean-install recommends?', 'Ships 1 and 2 now.']);
    expect(planParts('no plan line')).toEqual(['no plan line', '']);
  });
});
