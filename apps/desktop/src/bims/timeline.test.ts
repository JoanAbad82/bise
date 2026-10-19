import { describe, expect, it } from 'vitest';
import { activities } from './activity';
import { agent, crowd, mainAgent, office as officeSnap } from './fixtures';
import { loftLayout as layoutOf } from './maps/loft';
import type { Activity, BimEvent, Office, Pose } from './model';
import { bedsAt, LAST_STAGE } from './growth';
import { COFFEE_S, MAX_WALK_S, PLANE_S, SETTLE_S, SPEED, VISIT_S, newTimeline } from './timeline';

/** a value the test knows is there */
function must<T>(x: T | undefined): T {
  if (x === undefined) throw new Error('missing');
  return x;
}

const WORK: Activity = { k: 'work', at: 'desk' };
const NAP: Activity = { k: 'nap', at: 'lounge' };
const MAIN: Activity = { k: 'main', at: 'main' };

const acts = (o: Record<string, Activity>) => new Map(Object.entries(o));
const office = (n = 4): Office => layoutOf([mainAgent(), ...Array.from({ length: n }, (_, i) => agent(`a${String(i + 1)}`))]);
const at = (p: Pose | null) => (p ? { x: p.x, z: p.z } : null);

describe('timeline', () => {
  it('places everyone at their spot on the first look, nothing moving', () => {
    const o = office();
    const tl = newTimeline();
    tl.update(acts({ main: MAIN, a1: WORK, a2: NAP }), o, 10, []);
    expect(at(tl.poseAt('a1', 10))).toEqual({ x: o.desks.get('a1')?.x, z: o.desks.get('a1')?.z });
    expect(at(tl.poseAt('a2', 10))).toEqual({ x: must(o.lounge[0]).x, z: must(o.lounge[0]).z });
    expect(tl.poseAt('a1', 10)?.seg.from).toBeNull();
    expect(tl.moving(10)).toBe(false);
    expect(tl.names(10)).toEqual(['main', 'a1', 'a2']);
    expect(tl.poseAt('nobody', 10)).toBeNull();
  });

  it('walks a bim to its new spot when its activity changes, then the loop stops', () => {
    const o = office();
    const tl = newTimeline();
    tl.update(acts({ main: MAIN, a1: WORK }), o, 0, []);
    tl.update(acts({ main: MAIN, a1: NAP }), o, 5, []);
    const seg = tl.poseAt('a1', 5)?.seg;
    expect(seg?.from).toBe('work');
    expect(seg?.speed).toBeGreaterThanOrEqual(SPEED.walk);
    const dur = (seg?.path.len ?? 0) / (seg?.speed ?? 1);
    expect(dur).toBeGreaterThan(0);
    expect(dur).toBeLessThanOrEqual(MAX_WALK_S + 1e-9);
    expect(tl.poseAt('a1', 5 + dur / 2)?.moving).toBe(true);
    expect(tl.moving(5 + dur / 2)).toBe(true);
    const end = tl.poseAt('a1', 5 + dur + 0.01);
    expect(at(end)).toEqual({ x: must(o.lounge[0]).x, z: must(o.lounge[0]).z });
    expect(end?.moving).toBe(false);
    expect(end?.dir).toBe(must(o.lounge[0]).face);
    expect(tl.moving(5 + dur + SETTLE_S / 2)).toBe(true);
    expect(tl.moving(5 + dur + SETTLE_S + 0.01)).toBe(false);
  });

  it('never teleports: a state change mid-walk starts the next walk where the bim is', () => {
    const o = office(8);
    const tl = newTimeline();
    tl.update(acts({ main: MAIN, a5: WORK }), o, 0, []);
    tl.update(acts({ main: MAIN, a5: NAP }), o, 1, []);
    const t = 2.1;
    const before = tl.poseAt('a5', t);
    expect(before?.moving).toBe(true);
    tl.update(acts({ main: MAIN, a5: { k: 'landing', at: 'queue', rank: 2 } }), o, t, []);
    const after = tl.poseAt('a5', t);
    expect(after?.x).toBeCloseTo(before?.x ?? NaN, 9);
    expect(after?.z).toBeCloseTo(before?.z ?? NaN, 9);
    expect(after?.seg.speed).toBeGreaterThanOrEqual(SPEED.carry);
    // and a third change on that walk too
    const t2 = t + 0.7;
    const mid = tl.poseAt('a5', t2);
    tl.update(acts({ main: MAIN, a5: WORK }), o, t2, []);
    expect(at(tl.poseAt('a5', t2))?.x).toBeCloseTo(mid?.x ?? NaN, 9);
    expect(at(tl.poseAt('a5', t2))?.z).toBeCloseTo(mid?.z ?? NaN, 9);
    // a smooth walk: no jump between two frames
    let prev = tl.poseAt('a5', t2);
    for (let tt = t2; tt < t2 + MAX_WALK_S; tt += 1 / 60) {
      const p = tl.poseAt('a5', tt);
      expect(Math.hypot((p?.x ?? 0) - (prev?.x ?? 0), (p?.z ?? 0) - (prev?.z ?? 0))).toBeLessThan(0.2);
      prev = p;
    }
    expect(at(prev)).toEqual({ x: o.desks.get('a5')?.x, z: o.desks.get('a5')?.z });
  });

  it('gives the same poses for the same input', () => {
    const run = () => {
      const tl = newTimeline();
      const o = layoutOf(officeSnap.agents);
      const out: unknown[] = [];
      for (let t = 0; t <= 120; t += 1) {
        tl.update(activities(officeSnap, t), o, t, []);
        for (const n of tl.names(t + 0.5)) out.push([n, tl.poseAt(n, t + 0.5)]);
      }
      return out;
    };
    expect(run()).toEqual(run());
  });

  it('lets an archived bim skate off the terrace, then forgets it', () => {
    const o = office();
    const tl = newTimeline();
    tl.update(acts({ main: MAIN, a1: { k: 'done', at: 'terrace' }, a2: WORK }), o, 0, []);
    tl.update(acts({ main: MAIN, a2: WORK }), o, 3, []);
    const seg = tl.poseAt('a1', 3)?.seg;
    expect(seg?.sig).toBe('gone');
    expect(seg?.speed).toBeGreaterThanOrEqual(SPEED.skate);
    const out = 3 + (seg?.path.len ?? 0) / (seg?.speed ?? 1);
    expect(seg?.spot).toEqual(o.exit);
    expect(tl.names(3.1)).toContain('a1');
    expect(tl.moving(3.1)).toBe(true);
    expect(tl.poseAt('a1', out + 0.01)).toBeNull();
    expect(tl.names(out + 0.01)).toEqual(['main', 'a2']);
    tl.update(acts({ main: MAIN, a2: WORK }), o, out + 1, []);
    expect(tl.poseAt('a1', 3.1)).toBeNull();
  });

  it('brings a new agent in by the door', () => {
    const o = office();
    const tl = newTimeline();
    tl.update(acts({ main: MAIN }), o, 0, []);
    tl.update(acts({ main: MAIN, a3: { k: 'starting', at: 'door' } }), o, 4, []);
    expect(at(tl.poseAt('a3', 4))).toEqual({ x: o.door.x, z: o.door.z });
    tl.update(acts({ main: MAIN, a3: WORK }), o, 5, []);
    const p = tl.poseAt('a3', 5);
    expect(at(p)).toEqual({ x: o.door.x, z: o.door.z });
    expect(p?.seg.from).toBe('starting');
    // one that shows up already working walks in from the door too
    tl.update(acts({ main: MAIN, a3: WORK, a4: WORK }), o, 6, []);
    expect(at(tl.poseAt('a4', 6))).toEqual({ x: o.door.x, z: o.door.z });
    expect(tl.poseAt('a4', 6)?.moving).toBe(true);
  });

  it('caps a far walk near 6 s by walking faster', () => {
    const o = layoutOf(crowd(30).agents);
    const tl = newTimeline();
    tl.update(acts({ 'agent-30': WORK }), o, 0, []);
    tl.update(acts({ 'agent-30': { k: 'done', at: 'terrace' } }), o, 1, []);
    const seg = tl.poseAt('agent-30', 1)?.seg;
    expect((seg?.path.len ?? 0) / (seg?.speed ?? 1)).toBeLessThanOrEqual(MAX_WALK_S + 1e-9);
  });

  it('hurries for an urgent ask', () => {
    const o = office();
    const tl = newTimeline();
    tl.update(acts({ a1: NAP }), o, 0, []);
    tl.update(acts({ a1: { k: 'asks', at: 'desk', urgent: true } }), o, 1, []);
    expect(tl.poseAt('a1', 1)?.seg.speed).toBeGreaterThanOrEqual(SPEED.hurry);
  });

  it('gives each napper its own bean bag, back to it after a snack; past the last, at its desk (never lying beside one in the air)', () => {
    const o = office(12);
    const tl = newTimeline();
    const nappers = Array.from({ length: 11 }, (_, i) => `a${String(i + 1)}`);
    tl.update(new Map(nappers.map((n) => [n, NAP])), o, 0, []);
    const spots = nappers.map((n) => `${String(tl.poseAt(n, 0)?.x)},${String(tl.poseAt(n, 0)?.z)}`);
    expect(new Set(spots).size).toBe(11);
    expect(o.lounge).toHaveLength(10);
    expect(at(tl.poseAt('a11', 0))).toEqual({ x: o.desks.get('a11')?.x, z: o.desks.get('a11')?.z });
    // a3 off for a snack: a11, at its desk, takes the bean bag it left; a3 back naps at its own desk
    const home = at(tl.poseAt('a3', 0));
    tl.update(new Map(nappers.map((n) => [n, n === 'a3' ? { k: 'snack', at: 'island', key: 1, fruit: 0 } : NAP])), o, 10, []);
    tl.update(new Map(nappers.map((n) => [n, NAP])), o, 20, []);
    expect(at(tl.poseAt('a11', 30))).toEqual(home);
    expect(at(tl.poseAt('a3', 30))).toEqual({ x: o.desks.get('a3')?.x, z: o.desks.get('a3')?.z });
    // with nobody waiting for one, a napper back from its snack gets its own bean bag again
    const few = nappers.slice(0, 10);
    const tl2 = newTimeline();
    tl2.update(new Map(few.map((n) => [n, NAP])), o, 0, []);
    const home2 = at(tl2.poseAt('a3', 0));
    tl2.update(new Map(few.map((n) => [n, n === 'a3' ? { k: 'snack', at: 'island', key: 1, fruit: 0 } : NAP])), o, 10, []);
    tl2.update(new Map(few.map((n) => [n, NAP])), o, 20, []);
    expect(at(tl2.poseAt('a3', 30))).toEqual(home2);
  });

  it('flies his paper plane to the agent he writes to', () => {
    const o = office();
    const tl = newTimeline();
    const ev: BimEvent = { kind: 'message', from: { who: 'you' }, to: { who: 'agent', name: 'a1' }, mode: 'queued', expectsReply: false, t: 4 };
    tl.update(acts({ main: MAIN, a1: { k: 'sleep', at: 'desk' } }), o, 0, []);
    tl.update(acts({ main: MAIN, a1: { k: 'sleep', at: 'desk' } }), o, 4, [ev]);
    tl.update(acts({ main: MAIN, a1: { k: 'sleep', at: 'desk' } }), o, 4.5, [ev]);
    expect(tl.poseAt('a1', 4.5)?.plane).toEqual({ since: 0.5 });
    expect(tl.poseAt('main', 4.5)?.plane).toBeUndefined();
    expect(tl.moving(5)).toBe(true);
    expect(tl.poseAt('a1', 4 + PLANE_S + 1e-6)?.plane).toBeUndefined();
    expect(tl.moving(4 + PLANE_S + 1e-6)).toBe(false);
    // its sheet stays with it (on its desk) while it keeps that state
    expect(tl.poseAt('a1', 4 + PLANE_S + 30)?.letter).toBeCloseTo(PLANE_S + 30, 6);
  });

  it('keeps an earlier plane on its way when a newer one leaves for the same agent (designer m_32877)', () => {
    const o = office();
    const tl = newTimeline();
    const sent = (t: number): BimEvent => ({ kind: 'message', from: { who: 'you' }, to: { who: 'agent', name: 'a1' }, mode: 'queued', expectsReply: false, t });
    const a = acts({ main: MAIN, a1: { k: 'sleep', at: 'desk' } });
    tl.update(a, o, 0, []);
    tl.update(a, o, 4, [sent(4)]);
    tl.update(a, o, 5, [sent(5)]);
    tl.update(a, o, 5.5, [sent(5.5)]);
    expect(tl.poseAt('a1', 5.6)?.plane).toEqual({ since: expect.closeTo(0.1, 6) as number });
    expect(tl.poseAt('a1', 5.6)?.aloft?.map((p) => p.since.toFixed(1))).toEqual(['1.6', '0.6']);
    expect(tl.poseAt('a1', 4 + PLANE_S + 0.1)?.aloft?.map((p) => p.since.toFixed(1))).toEqual([(PLANE_S - 0.9).toFixed(1)]);
  });

  it('rebuilds the room when it grows: every bim at its spot in the new one', () => {
    const small = layoutOf(crowd(12).agents);
    const tl = newTimeline();
    tl.update(acts({ 'agent-1': WORK, 'agent-2': { k: 'done', at: 'terrace' } }), small, 0, []);
    const big = layoutOf(crowd(13).agents, small);
    expect(big.rows).toBeGreaterThan(small.rows);
    tl.update(acts({ 'agent-1': WORK, 'agent-2': { k: 'done', at: 'terrace' } }), big, 1, []);
    expect(tl.poseAt('agent-2', 1)?.z).toBeGreaterThan(big.D);
    expect(tl.poseAt('agent-2', 1)?.moving).toBe(false);
    expect(at(tl.poseAt('agent-1', 1))).toEqual({ x: big.desks.get('agent-1')?.x, z: big.desks.get('agent-1')?.z });
  });

  it('runs the fixture office for two minutes: every bim somewhere on the floor, always', () => {
    const o = layoutOf(officeSnap.agents);
    const tl = newTimeline();
    for (let t = 0; t <= 120; t += 0.5) {
      tl.update(activities(officeSnap, Math.floor(t)), o, t, []);
      for (const n of tl.names(t)) {
        const p = tl.poseAt(n, t);
        expect(Number.isFinite(p?.x) && Number.isFinite(p?.z)).toBe(true);
      }
    }
    expect(tl.names(120)).toHaveLength(officeSnap.agents.length);
  });

  describe("the hub's events (spec §6)", () => {
    const msg = (from: string, to: string, t: number, mode: 'steer' | 'queued' = 'queued'): BimEvent => ({
      kind: 'message', from: { who: 'agent', name: from }, to: { who: 'agent', name: to }, mode, expectsReply: false, t,
    });
    const run = (tl: ReturnType<typeof newTimeline>, a: Record<string, Activity>, o: Office, from: number, to: number, ev: BimEvent[] = []) => {
      for (let t = from; t <= to; t += 0.5) tl.update(acts(a), o, t, t === from ? ev : []);
    };

    it('a message to an idle bim: both go to the island for a coffee, then back', () => {
      const o = office();
      const tl = newTimeline();
      const rows = { main: MAIN, a1: WORK, a2: NAP };
      tl.update(acts(rows), o, 0, []);
      run(tl, rows, o, 1, 9, [msg('a1', 'a2', 1)]);
      expect(tl.poseAt('a1', 9)?.seg.act).toMatchObject({ k: 'coffee', at: 'island', with: 'a2' });
      expect(tl.poseAt('a2', 9)?.seg.act).toMatchObject({ k: 'coffee', with: 'a1' });
      expect(tl.moving(9)).toBe(true);
      run(tl, rows, o, 9.5, 9 + COFFEE_S + 2 * MAX_WALK_S);
      const end = 9 + COFFEE_S + 2 * MAX_WALK_S;
      expect(tl.poseAt('a1', end)?.seg.act.k).toBe('work');
      expect(at(tl.poseAt('a1', end))).toEqual({ x: o.desks.get('a1')?.x, z: o.desks.get('a1')?.z });
      expect(tl.poseAt('a2', end)?.seg.act.k).toBe('nap');
      expect(tl.moving(end + SETTLE_S + 1)).toBe(false);
    });

    it('a message to a busy bim: the sender goes to its desk (post-it or tap) and comes back; the busy one stays', () => {
      const o = office();
      const tl = newTimeline();
      const rows = { main: MAIN, a1: WORK, a2: WORK };
      tl.update(acts(rows), o, 0, []);
      run(tl, rows, o, 1, 2, [msg('a1', 'a2', 1, 'steer')]);
      const seg = tl.poseAt('a1', 2)?.seg;
      expect(seg?.act).toMatchObject({ k: 'visit', with: 'a2', mode: 'steer' });
      expect(seg?.spot.x).toBe(o.desks.get('a2')?.x);
      expect(tl.poseAt('a2', 2)?.seg.act.k).toBe('work');
      const end = 2 + VISIT_S + 2 * MAX_WALK_S;
      run(tl, rows, o, 2.5, end);
      expect(tl.poseAt('a1', end)?.seg.act.k).toBe('work');
      expect(at(tl.poseAt('a1', end))).toEqual({ x: o.desks.get('a1')?.x, z: o.desks.get('a1')?.z });
    });

    it('a report: the sender takes a sheet to main; one asking you or failed stays put; an event plays once', () => {
      const o = office();
      const tl = newTimeline();
      const rows: Record<string, Activity> = { main: MAIN, a1: WORK, a2: { k: 'asks', at: 'desk' }, a3: { k: 'failed', at: 'desk' } };
      tl.update(acts(rows), o, 0, []);
      const ev: BimEvent[] = [
        { kind: 'report', agent: 'a1', report: 'done', t: 1 },
        { kind: 'report', agent: 'a2', report: 'progress', t: 1 },
        msg('a3', 'a1', 1),
      ];
      tl.update(acts(rows), o, 1, ev);
      expect(tl.poseAt('a1', 1)?.seg.act.k).toBe('report');
      expect(tl.poseAt('a2', 1)?.seg.act.k).toBe('asks');
      expect(tl.poseAt('a3', 1)?.seg.act.k).toBe('failed');
      run(tl, rows, o, 1.5, 30);
      expect(tl.poseAt('a1', 30)?.seg.act.k).toBe('work');
      tl.update(acts(rows), o, 30.5, ev);
      expect(tl.poseAt('a1', 30.5)?.seg.act.k).toBe('work');
    });

    it('a stale event (older than 10 s when it comes) is not played', () => {
      const o = office();
      const tl = newTimeline();
      const rows = { main: MAIN, a1: WORK, a2: NAP };
      tl.update(acts(rows), o, 0, []);
      tl.update(acts(rows), o, 20, [msg('a1', 'a2', 5)]);
      expect(tl.poseAt('a1', 20)?.seg.act.k).toBe('work');
    });
  });
});

describe('timeline: a napper lies only on a bean bag that is built (his bug, bims-fix)', () => {
  it('no bed built: every napper naps at its desk', () => {
    const o = office();
    const tl = newTimeline();
    tl.update(acts({ main: MAIN, a1: NAP, a2: NAP }), o, 10, [], 0);
    for (const n of ['a1', 'a2']) {
      expect(at(tl.poseAt(n, 10))).toEqual({ x: o.desks.get(n)?.x, z: o.desks.get(n)?.z });
      expect(tl.poseAt(n, 10)?.seg.act).toEqual({ k: 'nap', at: 'desk' });
    }
  });
  it('two beds from day one (page bims-cozy v2): the first two nappers on them, the third at its desk; staying put on the next update', () => {
    const o = office();
    const tl = newTimeline();
    const beds = bedsAt(0);
    expect(beds).toBe(2);
    tl.update(acts({ main: MAIN, a1: NAP, a2: NAP, a3: NAP }), o, 10, [], beds);
    expect(at(tl.poseAt('a1', 10))).toEqual({ x: must(o.lounge[0]).x, z: must(o.lounge[0]).z });
    expect(at(tl.poseAt('a2', 10))).toEqual({ x: must(o.lounge[1]).x, z: must(o.lounge[1]).z });
    expect(at(tl.poseAt('a3', 10))).toEqual({ x: o.desks.get('a3')?.x, z: o.desks.get('a3')?.z });
    const before = tl.poseAt('a1', 10)?.seg;
    tl.update(acts({ main: MAIN, a1: NAP, a2: NAP, a3: NAP }), o, 20, [], beds);
    expect(tl.poseAt('a1', 20)?.seg).toBe(before);
    expect(tl.moving(20)).toBe(false);
  });
  it('the stage grows (or its growth comes after the rows): a napper at its desk goes to the new bean bag', () => {
    const o = office();
    const tl = newTimeline();
    tl.update(acts({ main: MAIN, a1: NAP, a2: NAP, a3: NAP }), o, 10, [], 0);
    expect(at(tl.poseAt('a1', 10))).toEqual({ x: o.desks.get('a1')?.x, z: o.desks.get('a1')?.z });
    tl.update(acts({ main: MAIN, a1: NAP, a2: NAP, a3: NAP }), o, 11, [], 2);
    const end = 11 + MAX_WALK_S + 1;
    expect(at(tl.poseAt('a1', end))).toEqual({ x: must(o.lounge[0]).x, z: must(o.lounge[0]).z });
    expect(at(tl.poseAt('a2', end))).toEqual({ x: must(o.lounge[1]).x, z: must(o.lounge[1]).z });
    expect(at(tl.poseAt('a3', end))).toEqual({ x: o.desks.get('a3')?.x, z: o.desks.get('a3')?.z });
    tl.update(acts({ main: MAIN, a1: NAP, a2: NAP, a3: NAP }), o, end, [], 2);
    expect(tl.moving(end)).toBe(false);
  });
  it('every stage: a napper in the lounge stands on a spot whose bean bag the stage built', () => {
    const o = office(12);
    for (let stage = 0; stage <= LAST_STAGE; stage++) {
      const tl = newTimeline();
      const all = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`a${String(i + 1)}`, NAP]));
      tl.update(acts({ main: MAIN, ...all }), o, 10, [], bedsAt(stage));
      for (const n of Object.keys(all)) {
        const p = must(tl.poseAt(n, 10) ?? undefined);
        const i = o.lounge.findIndex((l) => l.x === p.x && l.z === p.z);
        if (p.seg.act.at === 'lounge') expect(i, `${n} at stage ${String(stage)}`).toBeGreaterThanOrEqual(0);
        if (i >= 0) expect(i, `${n}'s bean bag at stage ${String(stage)}`).toBeLessThan(bedsAt(stage));
        else expect(at(p), `${n} at its desk at stage ${String(stage)}`).toEqual({ x: o.desks.get(n)?.x, z: o.desks.get(n)?.z });
      }
    }
  });
});
