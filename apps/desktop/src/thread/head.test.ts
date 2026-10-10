import { describe, expect, it } from 'vitest';
import { biseChip, branchLine, composerWords, dropsFor, dividerEnd, emptyEnter, emptyEnterAct, roleOf, stateChip, STARTING_MS, usageLine } from './head';

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
  it("as the TUI's divider, leaving out what it doesn't know", () => {
    expect(dividerEnd({ model: 'mistral/mistral-medium-latest', modelLabel: 'Mistral Medium', effort: 'high', mode: 'auto', status: 'idle', context: '42k · 17%' })).toBe('Mistral Medium · high · auto · idle · 42k · 17%');
    expect(dividerEnd({ model: 'anthropic/claude-opus-5-5', status: 'working', turnMs: 4 * 60_000 + 3000 })).toBe('claude-opus-5-5 · working · 4 min');
    expect(dividerEnd({ status: 'working', turnMs: 12_400, mode: 'yolo' })).toBe('yolo · working · 12 s');
    expect(dividerEnd({ status: 'done', mode: 'unknown', effort: '' })).toBe('done');
    expect(dividerEnd({})).toBe('');
  });
});

describe('D7: the context gauge in the head is named, an empty one goes', () => {
  it("'context 42k · 17%'; '15 · 0%' and none: nothing", () => {
    expect(usageLine('42k · 17%')).toBe('context 42k · 17%');
    expect(usageLine('15 · 0%')).toBe('');
    expect(usageLine('')).toBe('');
    expect(usageLine(null)).toBe('');
  });
});

describe('R9/S3: whom it waits on, in the state chip', () => {
  const NOW2 = 1_791_100_000_000;
  it("'waiting on bise' dim for another agent (main is bise), '? waiting for you' in accent for him", () => {
    expect(stateChip({ status: 'working', since_ms: NOW2 - 600_000, waits: 0, waiting_on: { who: 'agent', name: 'main' } }, NOW2)).toEqual({ text: '⋯ waiting on bise', needs: false, live: false });
    expect(stateChip({ status: 'waiting', since_ms: NOW2, waits: 0, waiting_on: { who: 'agent', name: 'docs' } }, NOW2).text).toBe('⋯ waiting on docs');
    expect(stateChip({ status: 'working', since_ms: NOW2, waits: 0, waiting_on: { who: 'you' } }, NOW2)).toEqual({ text: '? waiting for you', needs: true, live: false });
  });
  it('a kind this window does not know changes nothing', () => {
    expect(stateChip({ status: 'done', since_ms: NOW2, waits: 0, waiting_on: { who: 'unknown' } }, NOW2).text).toBe('✓ done');
  });
});

describe("the head's fit (designer m_17194: a meta item whole or not at all)", () => {
  it('drops the context note first, then the branch; never cuts them', () => {
    const base = { who: 150, chip: 108, notes: [] as number[], usage: 100, branch: 57, end: 129 };
    // 150+108 + 2 gaps + 129 = 407; + usage 110 + branch 63 = 580
    expect(dropsFor({ ...base, avail: 600 })).toBe(0);
    expect(dropsFor({ ...base, avail: 500 })).toBe(1);
    expect(dropsFor({ ...base, avail: 420 })).toBe(2);
    expect(dropsFor({ ...base, avail: 300 })).toBe(2);
    // no context note or branch: nothing to drop
    expect(dropsFor({ ...base, usage: 0, branch: 0, avail: 300 })).toBe(2);
    expect(dropsFor({ ...base, usage: 0, avail: 480 })).toBe(0);
  });
});
