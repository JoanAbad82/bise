import { describe, expect, it } from 'vitest';
import { bims as w } from '@/proto/words_bims.gen';
import { agent, frame, mainAgent, watch } from './fixtures';
import { EVENT_S, EVENT_SLOTS, eventWords, isEvent, labelsOf, stateWords } from './labels';
import type { Activity, BimFrame } from './model';

const work: Activity = { k: 'work', at: 'desk' };
const asks: Activity = { k: 'asks', at: 'desk' };
const failed: Activity = { k: 'failed', at: 'desk' };
const agents = [mainAgent({ status: 'working' }), agent('perf', { status: 'working', title: 'signup 4.1 s to 0.9 s' }), agent('docs')];
const at = (bims: BimFrame[], t: number, o: { hover?: string; held?: boolean } = {}) =>
  labelsOf(bims, { t, hover: o.hover ?? null, held: o.held ?? false, agents });

describe('the labels (spec §2)', () => {
  it('none at rest: a bim at its desk, main at the big desk', () => {
    const bims = [frame('perf', work, { t: 0, from: 'nap' }), frame('main', { k: 'main', at: 'main' }, { main: true })];
    expect(at(bims, 10).size).toBe(0);
  });
  it('hover: the card, its state and its title apart (the card lays them on lines), no title for an empty one', () => {
    const l = at([frame('perf', work, { t: 0 })], 10, { hover: 'perf' }).get('perf');
    expect(l).toEqual({ name: 'perf', mode: 'hover', words: w.working, title: 'signup 4.1 s to 0.9 s', pill: null });
    expect(at([frame('docs', { k: 'nap', at: 'lounge' })], 10, { hover: 'docs' }).get('docs')).toMatchObject({ words: w.idle, title: '' });
    const sleeper = { ...agent('nightly', { title: '', watching: [watch('cargo test')] }) };
    const l2 = labelsOf([frame('nightly', { k: 'sleep', at: 'desk' })], { t: 1, hover: 'nightly', held: false, agents: [sleeper] });
    expect(l2.get('nightly')?.words).toBe(w.state_waiting_for({ what: 'cargo test' }));
  });
  it('walking: its name alone, main excepted (nothing at rest, and its walks are its own)', () => {
    expect(at([frame('perf', work, { t: 0, moving: true })], 10).get('perf')).toEqual({ name: 'perf', mode: 'name', words: '', title: '', pill: null });
    expect(at([frame('main', { k: 'main', at: 'main' }, { main: true, moving: true })], 10).size).toBe(0);
  });
  it('an event: name + its words for 3 s, then nothing', () => {
    const b = [frame('perf', { k: 'done', at: 'terrace' }, { t: 5, from: 'work' })];
    expect(at(b, 5)).toEqual(new Map([['perf', { name: 'perf', mode: 'event', words: w.done, title: '', pill: null }]]));
    expect(at(b, 5 + EVENT_S - 0.01).get('perf')?.mode).toBe('event');
    expect(at(b, 5 + EVENT_S).size).toBe(0);
  });
  it('the event wins over the walk for its 3 s, then the walk shows the name', () => {
    const b = [frame('perf', { k: 'done', at: 'terrace' }, { t: 0, from: 'landing', moving: true })];
    expect(at(b, 1).get('perf')).toMatchObject({ mode: 'event', words: w.ev_landed });
    expect(at(b, 4).get('perf')).toMatchObject({ mode: 'name', words: '' });
  });
  it('at most 3 events at once, newest first, the others in turn: 5 in 1 s, all shown by ~6 s', () => {
    const names = ['a', 'b', 'c', 'd', 'e'];
    const b = names.map((n, i) => frame(n, { k: 'blocked', at: 'desk' }, { t: i * 0.25, from: 'work' }));
    const ev = (t: number) => [...at(b, t)].filter(([, l]) => l.mode === 'event').map(([n]) => n).sort();
    expect(ev(1)).toEqual(['c', 'd', 'e']);
    for (let t = 0; t < 8; t += 0.05) expect(ev(t).length).toBeLessThanOrEqual(EVENT_SLOTS);
    expect(ev(1 + EVENT_S + 0.1)).toEqual(['a', 'b']);
    const seen = new Set<string>();
    for (let t = 0; t < 8; t += 0.05) for (const n of ev(t)) seen.add(n);
    expect([...seen].sort()).toEqual(names);
    expect(ev(7)).toEqual([]);
  });
  it('a waiting event whose segment was replaced is dropped', () => {
    const b = ['a', 'b', 'c', 'd'].map((n, i) => frame(n, { k: 'failed', at: 'desk' }, { t: i * 0.1, from: 'work' }));
    expect(at(b, 0.5).has('a')).toBe(true); // its pill
    expect(at(b, 0.5).get('a')?.mode).toBe('pill');
    b[0] = frame('a', work, { t: 0.4, from: 'failed' });
    expect(at(b, 0.5).get('a')?.mode).toBe('event');
  });
  it("the '?' pill: pink, no name, always, with any other label", () => {
    expect(at([frame('perf', asks, { t: 0, from: 'work' })], 10).get('perf')).toEqual({ name: 'perf', mode: 'pill', words: '', title: '', pill: 'asks' });
    expect(at([frame('perf', asks, { t: 0, from: 'work' })], 1).get('perf')).toMatchObject({ mode: 'event', words: w.asks_you, pill: 'asks' });
    expect(at([frame('perf', asks)], 10, { hover: 'perf' }).get('perf')?.pill).toBe('asks');
  });
  it("the '✗' pill: red, no name, until the next state", () => {
    expect(at([frame('perf', failed, { t: 0, from: 'work' })], 60).get('perf')).toEqual({ name: 'perf', mode: 'pill', words: '', title: '', pill: 'failed' });
    expect(at([frame('perf', work, { t: 60, from: 'failed' })], 64).size).toBe(0);
  });
  it('main: nothing at rest, its plain work <-> idle is no event', () => {
    const b = [frame('main', { k: 'mainidle', at: 'main' }, { t: 0, from: 'main', main: true })];
    expect(at(b, 1).size).toBe(0);
    expect(at([frame('main', { k: 'mainidle', at: 'main' }, { t: 0, from: 'asks', main: true })], 1).get('main')?.words).toBe(w.idle);
  });
  it('ctrl held: every label at once, the name alone unless an event or the hover says more', () => {
    const b = [frame('perf', work), frame('docs', { k: 'nap', at: 'lounge' }), frame('main', { k: 'main', at: 'main' }, { main: true })];
    const l = at(b, 10, { held: true });
    expect([...l.keys()]).toEqual(['perf', 'docs', 'main']);
    for (const x of l.values()) expect(x).toMatchObject({ mode: 'name', words: '' });
  });
  it('his planes and office life make no event; the first segment only when it comes in', () => {
    expect(isEvent(frame('a', { k: 'snack', at: 'island' }, { from: 'nap' }).pose.seg)).toBe(false);
    expect(isEvent(frame('a', { k: 'nap', at: 'lounge' }, { from: 'work' }).pose.seg)).toBe(false);
    expect(isEvent(frame('a', work).pose.seg)).toBe(false);
    expect(isEvent(frame('a', { k: 'starting', at: 'door' }).pose.seg)).toBe(true);
    expect(isEvent(frame('a', work, { from: 'nap' }).pose.seg)).toBe(true);
    expect(isEvent(frame('a', { k: 'landing', at: 'queue', rank: 2 }, { from: 'landing' }).pose.seg)).toBe(false);
    expect(isEvent(frame('a', { k: 'landing', at: 'queue', rank: 1 }, { from: 'landing' }).pose.seg)).toBe(true);
  });
  it('every activity has its event words (office life none) and its state words', () => {
    expect(eventWords({ k: 'starting', at: 'door' }, null)).toBe(w.ev_started);
    expect(eventWords(work, 'nap')).toBe(w.working);
    expect(eventWords({ k: 'hot', at: 'desk' }, 'work')).toBe(w.ev_running_hot);
    expect(eventWords({ k: 'sleep', at: 'desk' }, 'work')).toBe(w.waiting);
    expect(eventWords({ k: 'waitagent', at: 'desk', on: 'perf' }, 'work')).toBe(w.ev_waits_on({ agent: 'perf' }));
    expect(eventWords({ k: 'landing', at: 'queue', rank: 1 }, 'work')).toBe(w.landing);
    expect(eventWords({ k: 'landing', at: 'queue', rank: 3 }, 'work')).toBe(w.ev_in_line);
    expect(eventWords({ k: 'done', at: 'terrace' }, 'landing')).toBe(w.ev_landed);
    expect(eventWords({ k: 'stopped', at: 'desk' }, 'work')).toBe(w.ev_stopped);
    expect(eventWords({ k: 'blocked', at: 'desk' }, 'work')).toBe(w.blocked);
    expect(eventWords({ k: 'nap', at: 'lounge' }, 'work')).toBe('');
    expect(stateWords({ k: 'hot', at: 'desk' })).toBe(w.state_hot);
    expect(stateWords({ k: 'sleep', at: 'desk' })).toBe(w.waiting);
    expect(stateWords({ k: 'sleep', at: 'desk' }, 'gate.rc')).toBe(w.state_waiting_for({ what: 'gate.rc' }));
    expect(stateWords({ k: 'waitagent', at: 'desk', on: 'perf' })).toBe(w.state_waits_on({ agent: 'perf' }));
    expect(stateWords({ k: 'snack', at: 'island' })).toBe(w.idle);
    expect(stateWords({ k: 'nap', at: 'lounge' })).toBe(w.idle);
    expect(stateWords({ k: 'asks', at: 'desk', urgent: true })).toBe(w.state_urgent);
    expect(stateWords({ k: 'landing', at: 'queue', rank: 2 })).toBe(w.state_in_line({ nth: '2nd' }));
    expect(stateWords({ k: 'done', at: 'terrace' })).toBe(w.done);
    expect(stateWords({ k: 'stopped', at: 'desk' })).toBe(w.state_stopped);
    expect(stateWords({ k: 'starting', at: 'door' })).toBe(w.state_starting);
    expect(stateWords({ k: 'mainidle', at: 'main' })).toBe(w.idle);
    expect(stateWords({ k: 'main', at: 'main' })).toBe(w.working);
  });
});
