import { describe, expect, it } from 'vitest';
import { activities } from './activity';
import { agent, crowd, mainAgent, office as officeSnap } from './fixtures';
import { exitOf, layoutOf } from './layout';
import type { Activity, BimEvent, Office, Pose } from './model';
import { MAX_WALK_S, PLANE_S, SETTLE_S, SPEED, newTimeline } from './timeline';

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
    expect(seg?.spot).toEqual(exitOf(o));
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

  it('gives each napper its own bean bag, back to it after a snack; the 11th stands beside', () => {
    const o = office(12);
    const tl = newTimeline();
    const nappers = Array.from({ length: 11 }, (_, i) => `a${String(i + 1)}`);
    tl.update(new Map(nappers.map((n) => [n, NAP])), o, 0, []);
    const spots = nappers.map((n) => `${String(tl.poseAt(n, 0)?.x)},${String(tl.poseAt(n, 0)?.z)}`);
    expect(new Set(spots).size).toBe(11);
    const beside = tl.poseAt('a11', 0);
    expect(o.lounge.some((l) => l.x === beside?.x && l.z === beside.z)).toBe(false);
    const home = at(tl.poseAt('a3', 0));
    tl.update(new Map(nappers.map((n) => [n, n === 'a3' ? { k: 'snack', at: 'island', key: 1, fruit: 0 } : NAP])), o, 10, []);
    tl.update(new Map(nappers.map((n) => [n, NAP])), o, 20, []);
    expect(at(tl.poseAt('a3', 30))).toEqual(home);
  });

  it('flies his paper plane to the agent he writes to', () => {
    const o = office();
    const tl = newTimeline();
    const ev: BimEvent = { kind: 'his', to: 'a1', t: 4 };
    tl.update(acts({ main: MAIN, a1: { k: 'sleep', at: 'desk' } }), o, 0, []);
    tl.update(acts({ main: MAIN, a1: { k: 'sleep', at: 'desk' } }), o, 4, [ev]);
    tl.update(acts({ main: MAIN, a1: { k: 'sleep', at: 'desk' } }), o, 4.5, [ev]);
    expect(tl.poseAt('a1', 4.5)?.plane).toEqual({ since: 0.5 });
    expect(tl.poseAt('main', 4.5)?.plane).toBeUndefined();
    expect(tl.moving(5)).toBe(true);
    expect(tl.poseAt('a1', 4 + PLANE_S)?.plane).toBeUndefined();
    expect(tl.moving(4 + PLANE_S)).toBe(false);
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
});
