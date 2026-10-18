import { describe, expect, it } from 'vitest';
import { agent, mainAgent } from './fixtures';
import { loftLayout } from './maps/loft';
import type { Activity, Pt, Segment } from './model';
import { makePath, path } from './paths';
import { type Budget, plan, progress, SEP, type Track, trackOf, UPDATE_BUDGET, walkTime } from './avoid';
import { newTimeline } from './timeline';

const office = loftLayout([mainAgent(), ...Array.from({ length: 4 }, (_, i) => agent(`a${String(i + 1)}`))]);
const budget = (): Budget => ({ left: UPDATE_BUDGET });
/** the back corridor's two points, on the network */
const L = { x: -1.2, z: office.crossBack };
const R = { x: 3.6, z: office.crossBack };
const still = (p: Pt, t = 0): Track => ({ keys: [{ t, x: p.x, z: p.z }], end: Infinity });
const walking = (from: Pt, to: Pt, t: number, speed = 2.4): Track => trackOf({ t, path: path(office, from, to), speed });

/** where a walk planned at t is at time s */
function at(p: { t: number; pts: readonly Pt[]; waits: Segment['waits'] }, speed: number, s: number): Pt {
  const seg = { path: makePath(p.pts), speed, waits: p.waits };
  const { d } = progress(seg, Math.max(0, s - p.t));
  let rest = d;
  const pts = seg.path.pts;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1] as Pt;
    const b = pts[i] as Pt;
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    if (rest <= len) return { x: a.x + ((b.x - a.x) * rest) / (len || 1), z: a.z + ((b.z - a.z) * rest) / (len || 1) };
    rest -= len;
  }
  return pts[pts.length - 1] as Pt;
}

/** where a track is at s */
function on(k: Track, s: number): Pt {
  const keys = k.keys;
  if (s <= (keys[0]?.t ?? 0)) return keys[0] as Pt;
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1] as Track['keys'][number];
    const b = keys[i] as Track['keys'][number];
    if (s <= b.t) {
      const f = b.t > a.t ? (s - a.t) / (b.t - a.t) : 1;
      return { x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f };
    }
  }
  return keys[keys.length - 1] as Pt;
}

/** the closest a planned walk comes to a track, sampled every 10 ms for 20 s */
function closest(p: { t: number; pts: readonly Pt[]; waits: Segment['waits'] }, speed: number, k: Track): number {
  let best = Infinity;
  for (let s = p.t; s < p.t + 20; s += 0.01) {
    const a = at(p, speed, s);
    const b = on(k, s);
    best = Math.min(best, Math.hypot(a.x - b.x, a.z - b.z));
  }
  return best;
}

describe('avoid: walks that keep clear of the other bims', () => {
  it('a walk is its legs and its waits: track, progress and time agree', () => {
    const seg = { t: 10, path: makePath([{ x: 0, z: 0 }, { x: 2, z: 0 }, { x: 2, z: 1 }]), speed: 2, waits: [{ d: 1, s: 0.5 }, { d: 2, s: 0.25 }] };
    expect(walkTime(seg)).toBeCloseTo(1.5 + 0.75);
    expect(progress(seg, 0.4)).toEqual({ d: 0.8, waiting: false });
    expect(progress(seg, 0.7)).toEqual({ d: 1, waiting: true });
    expect(progress(seg, 1.1).d).toBeCloseTo(1.2);
    expect(progress(seg, 10)).toEqual({ d: 3, waiting: false });
    const k = trackOf(seg);
    expect(on(k, 10.7)).toMatchObject({ x: 1, z: 0 });
    expect(on(k, 11.6)).toMatchObject({ x: 2, z: 0 });
    expect(on(k, 99)).toMatchObject({ x: 2, z: 1 });
  });

  it('nothing in the way: the shortest walk, no wait', () => {
    const p = plan(office, L, R, 2.4, 0, [], false, budget());
    expect(p?.pts.length).toBe(2);
    expect(makePath(p?.pts ?? []).len).toBeCloseTo(path(office, L, R).len);
    expect(p?.waits).toEqual([]);
  });

  it('head on in the back corridor: it waits or steps aside, never through the other', () => {
    const other = walking(R, L, 0);
    const p = plan(office, L, R, 2.4, 0, [other], false, budget());
    expect(p).not.toBeNull();
    if (!p) return;
    expect(closest(p, 2.4, other)).toBeGreaterThanOrEqual(SEP - 1e-6);
    expect(p.pts.at(-1)).toEqual(R);
  });

  it('a bim standing in the corridor: it goes round it', () => {
    const mid = { x: 1.2, z: office.crossBack };
    const other = still(mid);
    const p = plan(office, L, R, 2.4, 0, [other], false, budget());
    expect(p).not.toBeNull();
    if (!p) return;
    expect(closest(p, 2.4, other)).toBeGreaterThanOrEqual(SEP - 1e-6);
    expect(p.pts.at(-1)).toEqual(R);
  });

  it('its spot taken: it stands beside it, on the network, clear of the one there', () => {
    const p = plan(office, L, R, 2.4, 0, [still(R)], false, budget());
    const end = p?.pts.at(-1);
    expect(end).toBeDefined();
    if (!end) return;
    const d = Math.hypot(end.x - R.x, end.z - R.z);
    expect(d).toBeGreaterThanOrEqual(SEP);
    expect(d).toBeLessThan(1.2);
  });

  it('coming in by a door someone walks through: it comes in once the way is clear', () => {
    const door = office.door;
    const other = walking({ x: door.x, z: office.crossFront }, door, 0);
    const p = plan(office, door, L, 2.4, 0, [other], true, budget());
    expect(p).not.toBeNull();
    if (!p) return;
    expect(p.t).toBeGreaterThanOrEqual(0);
    expect(closest(p, 2.4, other)).toBeGreaterThanOrEqual(SEP - 1e-6);
  });

  it('the same tracks give the same walk (replayable)', () => {
    const others = [walking(R, L, 0), still({ x: 0, z: office.crossBack + 2 })];
    expect(plan(office, L, R, 2.4, 0, others, false, budget())).toEqual(plan(office, L, R, 2.4, 0, others, false, budget()));
  });

  it('an update past its budget: walks with no clear way wait for the next update, never through anyone', () => {
    const p = plan(office, L, R, 2.4, 0, [], false, { left: 0 });
    expect(p).toBeNull();
  });
});

describe('avoid in the timeline', () => {
  const WORK: Activity = { k: 'work', at: 'desk' };
  const acts = (o: Record<string, Activity>) => new Map(Object.entries(o));

  it('two bims sent past each other keep apart all the way', () => {
    const tl = newTimeline();
    tl.update(acts({ main: { k: 'main', at: 'main' }, a1: WORK, a2: { k: 'nap', at: 'lounge' } }), office, 0, []);
    tl.update(acts({ main: { k: 'main', at: 'main' }, a1: { k: 'nap', at: 'lounge' }, a2: WORK }), office, 1, []);
    for (let s = 1; s < 12; s += 0.02) {
      const a = tl.poseAt('a1', s);
      const b = tl.poseAt('a2', s);
      if (!a || !b) continue;
      expect(Math.hypot(a.x - b.x, a.z - b.z)).toBeGreaterThanOrEqual(SEP - 1e-6);
    }
    expect(tl.moving(30)).toBe(false);
  });
});
