import { describe, expect, it } from 'vitest';
import { composerWords, emptyEnter, emptyEnterAct, escTail, nothingOwnYet, usageLine } from './head';

describe("the agent view's head (designer's desktop-screens v6)", () => {
  it("the composer: 'to perf', 'write to perf, then ⏎'", () => {
    expect(composerWords('perf')).toEqual({ label: 'to perf', placeholder: 'write to perf, then ⏎' });
  });
});

describe('K2: ⏎ on an empty composer', () => {
  it('signs in again when an expired sign-in stopped this agent, else does nothing', () => {
    expect(emptyEnter([{ kind: 'signin', waiting: ['perf', 'main'] }], 'perf')).toEqual({ cmd: 'sign_in', id: 'chatgpt' });
    expect(emptyEnter([{ kind: 'signin', waiting: ['main'] }], 'perf')).toBeNull();
    expect(emptyEnter([{ kind: 'question', waiting: ['perf'] }], 'perf')).toBeNull();
    expect(emptyEnter([], 'perf')).toBeNull();
  });
  it("first his undelivered message (the TUI's order, BISE-86): ⏎ sends it again; then the sign-in; else nothing", () => {
    const signin = [{ kind: 'signin', waiting: ['perf'] }];
    expect(emptyEnterAct(signin, 'perf', { kind: 'not_delivered', pos: 26 })).toEqual({ act: 'again', pos: 26 });
    expect(emptyEnterAct(signin, 'perf', { kind: 'agent', pos: 27 })).toEqual({ act: 'sign_in', cmd: { cmd: 'sign_in', id: 'chatgpt' } });
    expect(emptyEnterAct([], 'perf', { kind: 'agent', pos: 27 })).toBeNull();
    expect(emptyEnterAct([], 'perf', undefined)).toBeNull();
  });
});

describe('S40/W3: the divider says model · effort · approvals mode · state · context', () => {
});

describe('D7: the context gauge in the head is named, an empty one goes', () => {
  it("'context 42k · 17%'; '15 · 0%' and none: nothing", () => {
    expect(usageLine('42k · 17%')).toBe('context 42k · 17%');
    expect(usageLine('15 · 0%')).toBe('');
    expect(usageLine('')).toBe('');
    expect(usageLine(null)).toBe('');
  });
});

describe("'starting' = nothing of its own yet (designer m_18624, amb-home m_18628)", () => {
  it('no entry, or only his message or the brief that started it, is starting', () => {
    expect(nothingOwnYet([])).toBe(true);
    expect(nothingOwnYet(['you'])).toBe(true);
    expect(nothingOwnYet(['from_agent'])).toBe(true);
  });
  it("one entry of the agent's own (perf in sidebar-v6, 14 min in) is working, not starting", () => {
    expect(nothingOwnYet(['agent'])).toBe(false);
    expect(nothingOwnYet(['tools'])).toBe(false);
    expect(nothingOwnYet([undefined])).toBe(false);
    expect(nothingOwnYet(['you', 'agent'])).toBe(false);
    expect(nothingOwnYet(['from_agent', 'you'])).toBe(false);
  });
});

describe("the composer's placeholder per state (his ask via main m_41677, designer m_41726)", () => {
  it("a sub-agent's says esc goes back to bise; main's, an answer's, an artifact's or voice typing's never", () => {
    expect([composerWords('perf').placeholder, escTail('perf', false)]).toEqual(['write to perf, then ⏎', 'esc back to bise']);
    expect(escTail('main', false)).toBeUndefined();
    expect(escTail('perf', true)).toBeUndefined();
  });
});
