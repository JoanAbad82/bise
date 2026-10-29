import { describe, expect, it } from 'vitest';
import { liveFate, liveNext, type LiveState } from './live';

const p = (call: string, text: string) => ({ call, text, at_ms: 1000 });

describe("the thread's live row (a reply while it is written)", () => {
  it('shows from the first partial, the whole text so far each time; a new call starts again', () => {
    const a = liveNext(null, p('48.1', 'The cold'), 40);
    expect(a).toEqual({ call: '48.1', text: 'The cold', at_ms: 1000, since: 40, ending: false });
    const b = liveNext(a, p('48.1', 'The cold bench'), 40);
    expect(b?.text).toBe('The cold bench');
    expect(b?.since).toBe(40);
    expect(liveNext(b, p('48.2', 'Retry'), 41)).toMatchObject({ call: '48.2', text: 'Retry', since: 41 });
  });
  it("'' keeps the row with its last words until the next entry (ending)", () => {
    const a = liveNext(null, p('48.1', 'done.'), 40) as LiveState;
    const e = liveNext(a, null, 40);
    expect(e).toMatchObject({ text: 'done.', ending: true });
    expect(liveFate(e, 40, 'you')).toBe('live');
  });
  it("the agent's entry after it takes its place (before or after the clear); another entry doesn't", () => {
    const a = liveNext(null, p('48.1', 'done.'), 40) as LiveState;
    expect(liveFate(a, 41, 'agent')).toBe('handed');
    expect(liveFate(liveNext(a, null, 40), 41, 'agent')).toBe('handed');
    // a tool entry while it still comes: it stays
    expect(liveFate(a, 41, 'tools')).toBe('live');
    // cleared, then a stop: gone
    expect(liveFate(liveNext(a, null, 40), 41, 'stopped')).toBe('gone');
    expect(liveFate(null, 41, 'agent')).toBe('gone');
  });
});
