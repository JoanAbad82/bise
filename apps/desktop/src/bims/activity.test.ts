import { describe, expect, it } from 'vitest';
import { activities, activity, HOT_MS, idleLife, SNACK_EVERY, SNACK_S, SNACK_SPREAD } from './activity';
import { agent, card, EXPECT, landing, mainAgent, mainIdle, office, snap, watch } from './fixtures';
import type { Activity } from './model';

const one = (a: ReturnType<typeof agent>, t = 0, cards = [] as ReturnType<typeof card>[], places = [] as ReturnType<typeof landing>[]): Activity =>
  activity(a, snap([a], cards, places), t);

describe("the rows -> bims mapping (spec §4, [a] lines)", () => {
  it('the office fixture: every agent takes its expected activity, every kind shows', () => {
    const acts = activities(office, 0);
    for (const a of office.agents) {
      const want = EXPECT[a.name];
      const k = acts.get(a.name)?.k;
      if (want === 'nap|snack') expect(['nap', 'snack']).toContain(k);
      else expect(k, a.name).toBe(want);
    }
    expect(activities(mainIdle, 0).get('main')?.k).toBe('mainidle');
  });
  it('working: at its desk, typing', () => {
    expect(one(agent('a', { status: 'working', turn_ms: 60_000 }))).toEqual({ k: 'work', at: 'desk' });
  });
  it("what the turn does (the hub's Agent.doing): a working bim's pose; think goes to the whiteboard", () => {
    const d = (kind: 'think' | 'search' | 'build', status: 'working' | 'waiting' = 'working') =>
      agent('a', { status, turn_ms: 60_000, doing: { kind, since_ms: 0 } });
    expect(one(d('search'))).toEqual({ k: 'work', at: 'desk', doing: 'search' });
    expect(one(d('think'))).toEqual({ k: 'work', at: 'board', doing: 'think' });
    expect(one(agent('a', { status: 'working', turn_ms: HOT_MS + 1, doing: { kind: 'search', since_ms: 0 } }))).toEqual({ k: 'hot', at: 'desk', doing: 'search' });
    expect(one(mainAgent({ status: 'working', doing: { kind: 'think', since_ms: 0 } }))).toEqual({ k: 'main', at: 'main', doing: 'think' });
    // paused on a backgrounded build: arms crossed under a progress bar, not asleep
    expect(one(d('build', 'waiting'))).toEqual({ k: 'work', at: 'desk', doing: 'build' });
    // a bim that asks you or failed shows that, whatever its turn does
    expect(one(agent('a', { status: 'failed', doing: { kind: 'tool', since_ms: 0 } })).k).toBe('failed');
  });
  it('working, a long turn: hot past HOT_MS, not at it', () => {
    expect(one(agent('a', { status: 'working', turn_ms: HOT_MS + 1 })).k).toBe('hot');
    expect(one(agent('a', { status: 'working', turn_ms: HOT_MS })).k).toBe('work');
  });
  it('waiting on a watch: asleep at its desk; an idle one with an alarm too', () => {
    expect(one(agent('a', { status: 'waiting', watching: [watch('cargo test')] }))).toEqual({ k: 'sleep', at: 'desk' });
    expect(one(agent('a', { status: 'idle', watching: [watch('gate.rc', 'file')] }))).toEqual({ k: 'sleep', at: 'desk' });
  });
  it('waiting on an agent: asleep at its desk, says on whom', () => {
    expect(one(agent('a', { status: 'waiting', waiting_on: { who: 'agent', name: 'b' } }))).toEqual({ k: 'waitagent', at: 'desk', on: 'b' });
  });
  it('idle: in the lounge, a snack trip now and then (30-60 s apart, under 6 s), replayable', () => {
    const a = agent('empty-state');
    const ks = Array.from({ length: 240 }, (_, i) => one(a, i / 2).k);
    expect(new Set(ks)).toEqual(new Set(['nap', 'snack']));
    expect(ks.filter((k) => k === 'snack').length).toBeLessThanOrEqual(Math.ceil(120 / SNACK_EVERY) * SNACK_S * 2);
    expect(Array.from({ length: 240 }, (_, i) => one(a, i / 2).k)).toEqual(ks);
    // every bim has a cycle in [SNACK_EVERY, SNACK_EVERY + SNACK_SPREAD)
    const trips = (name: string) => {
      const starts: number[] = [];
      for (let t = 0; t < 200; t += 0.25) if (idleLife(name, t).k === 'snack' && idleLife(name, t - 0.25).k !== 'snack') starts.push(t);
      return starts.slice(1).map((s, i) => s - (starts[i] ?? 0));
    };
    for (const n of ['x', 'release', 'search-index']) for (const gap of trips(n)) expect(gap >= SNACK_EVERY && gap < SNACK_EVERY + SNACK_SPREAD).toBe(true);
  });
  it('a snack trip: at the island, its trip number and a fruit, the same for the same t', () => {
    let t = 0;
    while (idleLife('release', t).k !== 'snack') t += 0.5;
    const s = idleLife('release', t);
    expect(s).toMatchObject({ k: 'snack', at: 'island' });
    expect(s.fruit).toBeGreaterThanOrEqual(0);
    expect(s.fruit).toBeLessThan(3);
    expect(idleLife('release', t)).toEqual(s);
  });
  it('a busy bim never goes for fun (rule 1): working, waiting, blocked never nap or snack', () => {
    for (const a of [agent('a', { status: 'working' }), agent('a', { status: 'waiting' }), agent('a', { status: 'blocked' })])
      for (let t = 0; t < 120; t += 0.5) expect(['nap', 'snack']).not.toContain(one(a, t).k);
  });
  it('asks you: its waits, waiting_on you, or a card from it; urgent from the card', () => {
    expect(one(agent('a', { status: 'waiting', waits: 1 }))).toEqual({ k: 'asks', at: 'desk' });
    expect(one(agent('a', { status: 'waiting', waiting_on: { who: 'you' } })).k).toBe('asks');
    expect(one(agent('a', { status: 'working' }), 0, [card(1, 'a')])).toEqual({ k: 'asks', at: 'desk' });
    expect(one(agent('a', { status: 'working' }), 0, [card(1, 'a', { urgent: true })])).toEqual({ k: 'asks', at: 'desk', urgent: true });
    expect(one(agent('a', { status: 'working' }), 0, [card(1, 'b')]).k).toBe('work');
  });
  it('blocked with no card: arms crossed at its desk; with a card it asks', () => {
    expect(one(agent('a', { status: 'blocked' }))).toEqual({ k: 'blocked', at: 'desk' });
    expect(one(agent('a', { status: 'blocked' }), 0, [card(1, 'a')]).k).toBe('asks');
  });
  it('failed: slumped at its desk, over asks', () => {
    expect(one(agent('a', { status: 'failed', waits: 1 }))).toEqual({ k: 'failed', at: 'desk' });
  });
  it("waits to land: in main's queue at its place's rank, over working", () => {
    expect(one(agent('a', { status: 'working' }), 0, [], [landing('a', 2)])).toEqual({ k: 'landing', at: 'queue', rank: 2 });
    expect(one(agent('a', { status: 'working' }), 0, [], [landing('b', 1)]).k).toBe('work');
  });
  it('done: on the terrace', () => {
    expect(one(agent('a', { status: 'done' }))).toEqual({ k: 'done', at: 'terrace' });
  });
  it('stopped by you: at its desk, lamp off (status done, phase stopped)', () => {
    expect(one(agent('a', { status: 'done', phase: 'stopped' }))).toEqual({ k: 'stopped', at: 'desk' });
  });
  it('starting: by the door', () => {
    expect(one(agent('a', { status: 'working', phase: 'starting' }))).toEqual({ k: 'starting', at: 'door' });
  });
  it("main: at the big desk, working or reading the paper; asks at its own desk; never in the queue", () => {
    expect(one(mainAgent({ status: 'working' }))).toEqual({ k: 'main', at: 'main' });
    expect(one(mainAgent({ status: 'idle' }))).toEqual({ k: 'mainidle', at: 'main' });
    expect(one(mainAgent({ status: 'waiting', watching: [watch('x')] })).k).toBe('mainidle');
    expect(one(mainAgent({ status: 'waiting', waits: 1 }))).toEqual({ k: 'asks', at: 'main' });
    expect(one(mainAgent({ status: 'working', place_id: 'wt:main' }), 0, [], [landing('main', 1)]).k).toBe('main');
  });
  it('archived agents have no bim; v1 never sets doing', () => {
    const acts = activities(snap([agent('a', { archived: true }), agent('b', { status: 'working' })]), 0);
    expect([...acts.keys()]).toEqual(['b']);
    for (const act of activities(office, 0).values()) expect(act.doing).toBeUndefined();
  });
});
