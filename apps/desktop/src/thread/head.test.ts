import { describe, expect, it } from 'vitest';
import { biseChip, branchLine, composerWords, roleOf, stateChip, STARTING_MS } from './head';

const NOW = 1_791_100_000_000;
const MIN = 60_000;

describe("the agent view's head (designer's desktop-screens v6)", () => {
  it("the state chip: working with its time, starting, waiting for you in accent, done, failed, idle", () => {
    expect(stateChip({ status: 'working', since_ms: NOW - 14 * MIN, waits: 0 }, NOW)).toEqual({ text: '∿ working · 14 min', needs: false, live: true });
    expect(stateChip({ status: 'working', since_ms: NOW - STARTING_MS + 1, waits: 0 }, NOW).text).toBe('starting');
    expect(stateChip({ status: 'working', since_ms: NOW - 2 * MIN, waits: 1 }, NOW)).toEqual({ text: '? waiting for you', needs: true, live: false });
    expect(stateChip({ status: 'blocked', since_ms: NOW, waits: 0 }, NOW).needs).toBe(true);
    expect(stateChip({ status: 'done', since_ms: NOW, waits: 0 }, NOW).text).toBe('✓ done');
    expect(stateChip({ status: 'failed', since_ms: NOW, waits: 0 }, NOW).text).toBe('✗ failed');
    expect(stateChip({ status: 'idle', since_ms: NOW, waits: 0 }, NOW).text).toBe('idle');
  });

  it('the role line is its objective, else what it says it does', () => {
    expect(roleOf({ purpose: 'product page speed', title: 'benching' })).toBe('product page speed');
    expect(roleOf({ purpose: '', title: 'benching' })).toBe('benching');
  });

  it("the branch line: 'sb/perf · ± 2 files', the branch alone before its diff, none in the shared checkout", () => {
    expect(branchLine('sb/perf', 2)).toBe('sb/perf · ± 2 files');
    expect(branchLine('sb/perf', 1)).toBe('sb/perf · ± 1 file');
    expect(branchLine('sb/perf', undefined)).toBe('sb/perf');
    expect(branchLine(null, 3)).toBe('');
  });

  it("a project's bise: what waits on him first, else who works, else all quiet", () => {
    const a = (status: 'working' | 'idle', waits = 0, main = false) => ({ main, archived: false, status, waits });
    expect(biseChip([a('idle', 0, true), a('working'), a('working')]).text).toBe('2 agents at work');
    expect(biseChip([a('working'), a('idle', 1)])).toEqual({ text: '1 waiting for you', needs: true, live: false });
    expect(biseChip([a('idle', 0, true)]).text).toBe('all quiet');
  });

  it("the composer: 'to perf', 'write to perf, then ⏎'", () => {
    expect(composerWords('perf')).toEqual({ label: 'to perf', placeholder: 'write to perf, then ⏎' });
  });
});
