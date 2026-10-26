// A coin's card words (page folded-side v9, the spec's words per coin): what waits in the accent,
// a failure in red, the quiet forms; from typed rows only.
import { describe, expect, it } from 'vitest';
import type { Agent, Proc, ScheduledTask } from '@/proto';
import { side } from '@/proto/words_side.gen';
import { asksYou, cardWords, coinCard, type CardFacts } from './coincard';
import type { Counts } from './model';

const NOW = new Date(2026, 9, 26, 7, 18).getTime();
const MIN = 60_000;
const agent = (name: string, over: Partial<Agent> = {}): Agent => ({
  name, dir: name, main: false, status: 'idle', archived: false, title: '', purpose: '', since_ms: 0, waits: 0, watching: [], ...over,
});
const counts = (over: Partial<Counts> = {}): Counts => ({
  working: 0, asks: 0, busy: 0, active: 0, inbox: 0, artifacts: 0, newArtifacts: 0, timers: 0, watches: 0, running: 0, listening: 0, ...over,
});
const facts = (over: Partial<CardFacts> = {}): CardFacts => ({ live: [], counts: counts(), artifacts: [], tasks: [], procs: [], watching: [], now: NOW, ...over });
const task = (name: string, next: number): { t: ScheduledTask } => ({ t: { id: 1, agent: 'main', by: 'you', words: name, name, every: 'day 07:30', done: 0, next_ms: next } });
const proc = (cmd: string, ports: number[]): { p: Proc } => ({ p: { id: 1, agent: 'perf', cmd, cwd: '/x', started_ms: 0, state: { is: 'running' }, ports } as unknown as Proc });

describe('the coins\' cards', () => {
  it('agents: who asks him in the accent, then working and who failed in red (the spec\'s busy card)', () => {
    const c = coinCard('agents', facts({
      live: [agent('main', { main: true }), agent('perf', { waits: 1, status: 'working' }), agent('docs', { status: 'working' }), agent('search-ui', { status: 'failed' })],
      counts: counts({ working: 2 }),
    }));
    expect(c.name).toBe(side.agents);
    expect(c.l1).toEqual([{ text: 'perf asks you', tone: 'acc' }]);
    expect(c.l2).toEqual([{ text: '2 working' }, { text: 'search-ui failed', tone: 'err' }]);
    expect(cardWords(c)).toBe('Agents · perf asks you · 2 working · search-ui failed');
  });

  it('agents: askers named up to three, then a count; failures counted past one', () => {
    expect(asksYou(['perf', 'docs'])).toBe('perf and docs ask you');
    expect(asksYou(['perf', 'api-auth', 'i18n'])).toBe('perf, api-auth and i18n ask you');
    expect(asksYou(['a', 'b', 'c', 'd', 'e'])).toBe('a, b and 3 more ask you');
    const c = coinCard('agents', facts({ live: [agent('x', { status: 'failed' }), agent('y', { status: 'failed' })], counts: counts({ working: 6 }) }));
    expect(c.l1).toEqual([{ text: '2 failed', tone: 'err' }]);
    expect(c.l2).toEqual([{ text: '6 working' }]);
  });

  it('agents, quiet: all quiet, and who finished last', () => {
    const c = coinCard('agents', facts({ live: [agent('main', { main: true }), agent('billing', { status: 'done', since_ms: NOW - 60 * MIN }), agent('old', { status: 'done', since_ms: NOW - 300 * MIN })] }));
    expect(cardWords(c)).toBe('Agents · all quiet · billing finished 1 h ago');
  });

  it('artifacts: the newest\'s name as its chip; the new today and all; else its age', () => {
    const a = (title: string, at: number, isNew: boolean) => ({ a: { title, at_ms: at, new: isNew } });
    const busy = coinCard('artifacts', facts({ artifacts: [a('old', NOW - 900 * MIN, false), a('landing page v3', NOW - 5 * MIN, true), a('notes', NOW - 30 * MIN, true)] }));
    expect(busy.l1).toEqual([{ text: 'landing page v3', tone: 'chip' }]);
    expect(busy.l2).toEqual([{ text: '2 new today · 3 in all' }]);
    const quiet = coinCard('artifacts', facts({ artifacts: [a('onboarding flow', NOW - 120 * MIN, false)] }));
    expect(cardWords(quiet)).toBe('Artifacts · onboarding flow · 1 in all · last 2 h ago');
    expect(cardWords(coinCard('artifacts', facts()))).toBe(`Artifacts · ${side.no_artifacts}`);
  });

  it('scheduled: the next timer in minutes within the hour, at its time after; timers, watches and the one watcher', () => {
    const soon = coinCard('scheduled', facts({ tasks: [task('nightly gate', NOW + 12 * MIN)], counts: counts({ watches: 1 }), watching: ['docs'] }));
    expect(cardWords(soon)).toBe('Scheduled · nightly gate in 12 min · 1 watch · docs');
    const later = coinCard('scheduled', facts({ tasks: [task('nightly gate', NOW + 23 * 60 * MIN + 12 * MIN), task('digest', NOW + 26 * 60 * MIN)], counts: counts({ timers: 2 }) }));
    expect(later.l1[0]?.text).toMatch(/^nightly gate at /u);
    expect(later.l2).toEqual([{ text: '2 timers' }]);
    expect(cardWords(coinCard('scheduled', facts()))).toBe('Scheduled · nothing scheduled');
  });

  it('processes: the first listening command in mono with its port, then running · listening; quiet: nothing running', () => {
    const c = coinCard('processes', facts({ procs: [proc('node build.js', []), proc('pnpm dev', [5173])], counts: counts({ running: 2, listening: 1 }) }));
    expect(c.l1).toEqual([{ text: 'pnpm dev', tone: 'mono' }, { text: ':5173 ↗', tone: 'link' }]);
    expect(c.l2).toEqual([{ text: '2 running · 1 listening' }]);
    expect(cardWords(coinCard('processes', facts()))).toBe('Processes · nothing running');
  });
});
