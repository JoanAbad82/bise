// The hover tips' words for the bars' marks (tipwords.ts): one string per mark and state.
import { describe, expect, it } from 'vitest';
import type { Agent } from '@/proto';
import { archivedAgeTip, goneTip, madeTip, markTip, newTip, pctTip, scheduledTip, signTip, timeTip, waitsTip, workingTip } from './tipwords';

const NOW = 1_791_100_600_000;
const agent = (over: Partial<Agent>): Agent =>
  ({ name: 'perf', archived: false, main: false, status: 'idle', since_ms: NOW - 6 * 60_000, title: '', purpose: '', waits: 0, watching: [], ...over }) as Agent;

describe('the sidebar marks', () => {
  it("the working count, the pink count, 'folder gone' (a project's state is its mark's tip: markstates.test.ts)", () => {
    expect(workingTip(3)).toBe('3 agents working');
    expect(workingTip(1)).toBe('1 agent working');
    expect(waitsTip(2)).toBe('2 waiting for you');
    expect(waitsTip(3, true)).toBe('3 waiting for you, in all your projects');
    expect(goneTip('/Users/me/acme')).toBe('folder gone: /Users/me/acme is no longer on disk');
  });

  it("'3 new · designer', 'scheduled 4'", () => {
    expect(newTip(3, ['designer'])).toBe("3 artifacts you haven't opened yet, from designer");
    expect(newTip(1, [])).toBe("1 artifact you haven't opened yet");
    expect(scheduledTip(4)).toBe('4 scheduled tasks, in all your projects');
  });
});

describe('the right bar marks', () => {
  it('each sign says its state with the agent’s name', () => {
    expect(signTip('∿', agent({ status: 'working' }), NOW)).toBe('∿ perf is working');
    expect(signTip('?', agent({ waits: 1 }), NOW)).toBe('? perf waits for you');
    expect(signTip('…', agent({ status: 'working', waiting_on: { who: 'agent', name: 'docs' } }), NOW)).toBe('… perf continues when docs answers');
    expect(signTip('…', agent({ status: 'working', waiting_on: { who: 'agent', name: 'main' } }), NOW)).toBe('… perf continues when bise answers');
    expect(signTip('✗', agent({ status: 'failed' }), NOW)).toBe('✗ perf failed');
    expect(signTip('✓', agent({ status: 'done' }), NOW)).toBe('✓ perf is done');
    expect(signTip('○', agent({}), NOW)).toBe('○ perf is idle');
    expect(signTip('○', agent({}), NOW, '14:20')).toBe('○ perf is idle: wakes at 14:20');
  });

  it('the time column: how long it has worked or waited', () => {
    expect(timeTip(agent({ status: 'working', turn_ms: 6 * 60_000 }), NOW)).toBe('working for 6 min on this turn');
    expect(timeTip(agent({ status: 'working', waiting_on: { who: 'agent', name: 'docs' } }), NOW)).toBe('waiting for 6 min');
    expect(timeTip(agent({}), NOW)).toBe('');
  });

  it('the % column: the context used of the model’s window', () => {
    expect(pctTip(agent({ usage: { context: 42_310, window: 256_000, model: 'm', short: '17%', words: '' } }), '17%')).toBe("17% of perf's context used: 42k of 256k");
    expect(pctTip(agent({}), '')).toBe('');
  });

  it('a worktree’s mark: its words, then where its click goes', () => {
    const m = (g: string, ...parts: { t: string; mono?: boolean }[]) => ({ g, tone: 'mid' as const, tip: parts.map((x) => x.t).join(''), parts });
    expect(markTip(m('↑', { t: '#412 · checks fail' }))).toBe('#412 · checks fail · click opens the PR');
    expect(markTip(m('ψ', { t: 'ψ worktree on ' }, { t: 'sb/x', mono: true }, { t: ' · ' }, { t: '/Users/me/wt/x', mono: true }), false, '/Users/me')).toBe(
      'ψ worktree on `sb/x` · `~/wt/x` · click opens its changes',
    );
    expect(markTip(m('↑', { t: 'sb/old' }), true)).toBe('sb/old · click opens its branch');
  });

  it('archived ages, artifact ends', () => {
    expect(archivedAgeTip('done', 2 * 3_600_000)).toBe('done 2 h ago');
    expect(archivedAgeTip('stopped', 10_000)).toBe('stopped just now');
    expect(madeTip('14:20')).toBe('made at 14:20');
    expect(madeTip('3 d')).toBe('made 3 d ago');
  });
});
