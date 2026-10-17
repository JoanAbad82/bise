// skate.ts on a fake clock (architect m_28726): who skates (idle only, 2 at most, the 10-min hash
// window, the Sunday pool session, none under reduced motion or without a park), lines of 8-12 s with
// a rest at least as long, the 900 at the 900th job, the trick label's 1.5 s.
import { describe, expect, it } from 'vitest';
import { crowd } from './fixtures';
import { californiaLayout } from './maps/california';
import { loftLayout } from './maps/loft';
import type { Activity, FunIn, Pastime, Pose, Segment } from './model';
import {
  BAIL_S, LINE_MAX, LINE_MIN, MAX_SKATERS, SESSION_S, TRICK_LABEL_S, WINDOW_S, built, dayOf, lineOf, pastimes, poolDay, skateAt, trickNow, wakeIn,
} from './skate';
import { makePath } from './paths';

const office = californiaLayout(crowd(8).agents);
const park = office.park;
const nap: Activity = { k: 'nap', at: 'lounge' };
const work: Activity = { k: 'work', at: 'desk' };
// a Monday, stage 9, no 900
const MON = dayOf(2026, 10, 12);
const fun = (o: Partial<FunIn> = {}): FunIn => ({ stage: 9, jobs: 120, dow: 1, day: MON, reduced: false, ...o });
const acts = (kinds: Record<string, Activity>): ReadonlyMap<string, Activity> => new Map(Object.entries(kinds));
const idle6 = acts({ a: nap, b: nap, c: { k: 'snack', at: 'island', key: 1, fruit: 0 }, d: nap, e: nap, f: nap, g: work, h: { k: 'asks', at: 'desk' } });

describe('who skates', () => {
  it('idle bims only, 2 at most, each in its own spot', () => {
    const p = pastimes(idle6, office, 1000, fun());
    expect(p.size).toBe(MAX_SKATERS);
    for (const name of p.keys()) expect(['a', 'b', 'c', 'd', 'e', 'f']).toContain(name);
    expect(new Set([...p.values()].map((x) => x.slot)).size).toBe(p.size);
  });

  it('a bim asking, busy or failed never skates', () => {
    const p = pastimes(acts({ g: work, h: { k: 'asks', at: 'desk' }, i: { k: 'failed', at: 'desk' }, j: { k: 'landing', at: 'queue', rank: 1 } }), office, 0, fun());
    expect(p.size).toBe(0);
  });

  it('the same skaters through a 10-min window; others in another one', () => {
    const at = (t: number): string => [...pastimes(idle6, office, t, fun()).keys()].join(',');
    expect(at(WINDOW_S * 3 + 1)).toBe(at(WINDOW_S * 4 - 1));
    const seen = new Set(Array.from({ length: 12 }, (_, i) => at(WINDOW_S * i + 5)));
    expect(seen.size).toBeGreaterThan(1);
  });

  it('nobody under reduced motion, without a park, or with no clock', () => {
    expect(pastimes(idle6, office, 0, fun({ reduced: true })).size).toBe(0);
    expect(pastimes(idle6, loftLayout(crowd(8).agents), 0, fun()).size).toBe(0);
    expect(pastimes(idle6, office, 0, undefined).size).toBe(0);
  });

  it('the Sunday pool session: one Sunday in four once the bowl is built, every idle bim, the bowl only', () => {
    const sundays = Array.from({ length: 8 }, (_, w) => dayOf(2026, 10, 4) + w * 7);
    const on = sundays.filter((day) => poolDay({ dow: 0, day, stage: 11 }));
    expect(on).toHaveLength(2);
    expect(poolDay({ dow: 0, day: on[0] ?? 0, stage: 10 })).toBe(false);
    expect(poolDay({ dow: 1, day: (on[0] ?? 0) + 1, stage: 11 })).toBe(false);
    const p = pastimes(idle6, office, 0, fun({ stage: 11, dow: 0, day: on[0] ?? 0 }));
    expect(p.size).toBe(6);
    for (const x of p.values()) {
      expect(x.pool).toBe(true);
      expect(lineOf('a', 0, x, park).moves.every((m) => m.on === 'bowl' || m.on === null)).toBe(true);
    }
  });

  it('the 900: at the 900th job (the high-water mark), once the vert is built, one skater', () => {
    const p = pastimes(idle6, office, 0, fun({ stage: 13, jobs: 900 }));
    expect([...p.values()].filter((x) => x.nine)).toHaveLength(1);
    expect([...pastimes(idle6, office, 0, fun({ stage: 13, jobs: 901 })).values()].some((x) => x.nine)).toBe(false);
    expect([...pastimes(idle6, office, 0, fun({ stage: 12, jobs: 900 })).values()].some((x) => x.nine)).toBe(false);
    const nine: Pastime = { kind: 'skate', slot: 0, pool: false, nine: true, stage: 13 };
    expect(lineOf('a', 0, nine, park).moves.some((m) => m.trick === 'nine')).toBe(true);
  });
});

describe('a line', () => {
  const p: Pastime = { kind: 'skate', slot: 0, pool: false, nine: false, stage: 14 };

  it('8 to 12 s, chained tricks between rolls, home at the end; a rest at least as long', () => {
    for (let n = 0; n < 60; n++) {
      const l = lineOf(`bim${String(n % 7)}`, n, p, park);
      expect(l.len).toBeGreaterThanOrEqual(LINE_MIN - 1e-9);
      expect(l.len).toBeLessThanOrEqual(LINE_MAX + 1e-9);
      expect(SESSION_S - l.len).toBeGreaterThanOrEqual(l.len);
      expect(l.moves.at(-1)?.on).toBe(null);
      expect(l.moves.filter((m) => m.trick !== 'roll').length).toBeGreaterThan(0);
    }
  });

  it('the same name and n give the same line', () => {
    expect(lineOf('perf', 4, p, park)).toEqual(lineOf('perf', 4, p, park));
  });

  it('only the pieces the stage has built; the ramp opens with a drop in', () => {
    const p0: Pastime = { ...p, stage: 0 };
    for (let n = 0; n < 40; n++) {
      for (const m of lineOf('x', n, p0, park).moves) if (m.on) expect(built(0)).toContain(m.on);
      const ms = lineOf('y', n, p, park).moves;
      ms.forEach((m, i) => {
        if (m.on === 'ramp' && m.trick !== 'roll' && ms[i - 1]?.trick === 'roll') expect(m.trick).toBe('drop_in');
      });
    }
    expect(built(13)).toContain('vert');
    expect(built(13)).not.toContain('qp');
  });

  it('a bail about 1 trick in 10, its fall in its length', () => {
    let tricks = 0;
    let bails = 0;
    for (let n = 0; n < 400; n++) {
      for (const m of lineOf('z', n, p, park).moves) {
        if (m.trick === 'roll') continue;
        tricks++;
        if (m.bail) {
          bails++;
          expect(m.dur).toBeGreaterThan(BAIL_S);
        }
      }
    }
    expect(bails / tricks).toBeGreaterThan(0.03);
    expect(bails / tricks).toBeLessThan(0.15);
  });

  it('in a line, then at rest until the next session', () => {
    const l = lineOf('q', 0, p, park);
    expect(skateAt('q', p, 0.5, park).move).not.toBe(null);
    const r = skateAt('q', p, l.len + 0.5, park);
    expect(r.move).toBe(null);
    expect(r.restLeft).toBeCloseTo(SESSION_S - l.len - 0.5, 6);
    expect(skateAt('q', p, SESSION_S + 0.1, park).n).toBe(1);
  });
});

describe('the loop and the label', () => {
  const p: Pastime = { kind: 'skate', slot: 0, pool: false, nine: false, stage: 14 };
  const spot = office.park.spots[0] ?? office.door;
  const seg: Segment = { t: 0, act: { k: 'nap', at: 'lounge' }, sig: 'skate|0||', spot, path: makePath([spot]), speed: 2.4, from: 'nap', pastime: p };
  const pose = (since: number): Pose => ({ x: spot.x, z: spot.z, dir: 0, moving: false, since, seg });

  it('a resting skater wakes the loop for its next line; a riding one does not ask', () => {
    const l = lineOf('q', 0, p, park);
    expect(wakeIn([{ name: 'q', main: false, pose: pose(1) }], park)).toBe(null);
    expect(wakeIn([{ name: 'q', main: false, pose: pose(l.len + 1) }], park)).toBeCloseTo(SESSION_S - l.len - 1, 6);
  });

  it("a trick's name for its first 1.5 s, never during a roll or a rest", () => {
    const l = lineOf('q', 0, p, park);
    const trick = l.moves.find((m) => m.trick !== 'roll');
    expect(trick).toBeDefined();
    if (!trick) return;
    expect(trickNow('q', pose(trick.t0 + 0.1), park)).toBe(trick.trick);
    if (trick.dur > TRICK_LABEL_S + 0.1) expect(trickNow('q', pose(trick.t0 + TRICK_LABEL_S + 0.05), park)).toBe(null);
    expect(trickNow('q', pose(0.05), park)).toBe(null);
    expect(trickNow('q', pose(l.len + 1), park)).toBe(null);
  });
});
