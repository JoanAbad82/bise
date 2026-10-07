// tui-parity R13: more than 3 agent-to-agent messages in a row fold as the TUI's '▸ 4 messages between 2 agents'.
import { describe, expect, it } from 'vitest';
import { foldedRuns, runKey, runWords, withRuns, type RunEntry } from './runs';

const E: Record<number, RunEntry> = {
  1: { kind: 'you' },
  2: { kind: 'to_agent', to: 'perf' },
  3: { kind: 'from_agent', from: 'perf' },
  4: { kind: 'to_agent', to: 'perf' },
  5: { kind: 'from_agent', from: 'search' },
  6: { kind: 'agent' },
  7: { kind: 'to_agent', to: 'perf' },
  8: { kind: 'from_agent', from: 'perf' },
};
const order = [1, 2, 3, 4, 5, 6, 7, 8];

describe('agent-to-agent runs', () => {
  it('a run of more than 3 folds, with how many agents speak in it; a short run stays', () => {
    const runs = foldedRuns(order, (p) => E[p], 'main');
    expect(runs).toEqual([{ start: 2, members: [2, 3, 4, 5], agents: 3 }]);
    expect(runWords(runs[0] ?? { members: [], agents: 0 }, false)).toBe('▸ 4 messages between 3 agents');
    expect(runWords({ members: [1, 2, 3, 4], agents: 2 }, true)).toBe('▾ 4 messages between 2 agents');
  });
  it('the list: the fold in place of the run, its messages only when open', () => {
    const runs = foldedRuns(order, (p) => E[p], 'main');
    const key = (p: number) => `e:${String(p)}`;
    expect(withRuns(order, runs, new Set(), key)).toEqual(['e:1', runKey(2), 'e:6', 'e:7', 'e:8']);
    expect(withRuns(order, runs, new Set([2]), key)).toEqual(['e:1', runKey(2), 'e:2', 'e:3', 'e:4', 'e:5', 'e:6', 'e:7', 'e:8']);
  });
});
