// The caret across a composer swap (panel-full): kept only while the swap is armed, taken once.
import { beforeEach, describe, expect, it } from 'vitest';
import { armHandoff, HANDOFF_MS, leaveCaret, resetHandoff, takeCaret } from './handoff';

const C = { from: 5, to: 5, focused: true };

beforeEach(resetHandoff);

describe('the caret handoff', () => {
  it('a swap armed: the composer that goes leaves its caret, the next one of the same key takes it once', () => {
    armHandoff(1000);
    leaveCaret('acme/perf', C, 1010);
    expect(takeCaret('other/main', 1020)).toBeUndefined();
    expect(takeCaret('acme/perf', 1020)).toEqual(C);
    expect(takeCaret('acme/perf', 1030), 'once').toBeUndefined();
  });
  it('nothing armed, or the swap past: nothing kept (a thread opened later starts at its end)', () => {
    leaveCaret('acme/perf', C, 1000);
    expect(takeCaret('acme/perf', 1001)).toBeUndefined();
    armHandoff(1000);
    leaveCaret('acme/perf', C, 1000 + HANDOFF_MS);
    expect(takeCaret('acme/perf', 1000 + HANDOFF_MS)).toBeUndefined();
    armHandoff(2000);
    leaveCaret('acme/perf', C, 2001);
    expect(takeCaret('acme/perf', 2000 + HANDOFF_MS)).toBeUndefined();
  });
});
