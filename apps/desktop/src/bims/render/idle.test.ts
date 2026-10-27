import { describe, expect, it } from 'vitest';
import type { Activity, BimFrame, Path, Pose, Spot } from '../model';
import { DUR, MAX_AT_ONCE, MIN_PX, SETTLE_S, idleFrame, idleKindOf, idlePlan, idleRig, idleWake, moveIn, seedOf, type IdleMove, type Rester } from './idle';
import { rigOf, type Rig } from './pose';

const spot: Spot = { x: 3, z: 6, wz: 5.35, ax: 1.2, face: 0 };
const still: Path = { pts: [{ x: spot.x, z: spot.z }], seg: [], len: 0 };

/** a bim at rest since `t0` (its segment started then, no walk, no transition) */
function frame(name: string, act: Activity, t0 = 0, t = 0): BimFrame {
  const pose: Pose = { x: spot.x, z: spot.z, dir: 0, moving: false, since: t - t0, seg: { t: t0, act, sig: name, spot, path: still, speed: 2.4, from: null } };
  return { name, main: false, pose };
}

const DONE: Activity = { k: 'done', at: 'terrace', standing: true };
const NAMES = Array.from({ length: 30 }, (_, i) => `agent-${String(i)}`);
const T0 = 1_761_550_000; // a wall-clock t, as the app's (s)
/** a fine enough step to see every move (the shortest, a twitch, is 0.5 s) */
const STEP = 0.1;

/** every move a bim plays over [a, b): its starts */
function starts(rs: readonly Rester[], name: string, a: number, b: number): number[] {
  const out: number[] = [];
  let was = false;
  for (let t = a; t < b; t += STEP) {
    const on = idlePlan(rs, t).get(name)?.move ?? null;
    if (on && !was) out.push(on.start);
    was = on !== null;
  }
  return out;
}

describe('idle moves (bim-idle)', () => {
  it('rests in the states that idle, never working, asking, failed, stopped or main', () => {
    expect(idleKindOf(DONE)).toBe('stand');
    expect(idleKindOf({ k: 'done', at: 'terrace' })).toBe('deck');
    expect(idleKindOf({ k: 'nap', at: 'lounge' })).toBe('bed');
    expect(idleKindOf({ k: 'nap', at: 'desk' })).toBe('desk');
    expect(idleKindOf({ k: 'sleep', at: 'desk' })).toBe('desk');
    for (const k of ['work', 'hot', 'asks', 'failed', 'stopped', 'main', 'mainidle', 'blocked'] as const) expect(idleKindOf({ k, at: 'desk' })).toBeNull();
  });

  it('is the same move for the same name and t', () => {
    const rs: Rester[] = [{ name: 'perf', kind: 'stand', from: T0 }];
    for (let t = T0 + 5; t < T0 + 300; t += 0.7) expect(idlePlan(rs, t)).toEqual(idlePlan(rs, t));
    expect(starts(rs, 'perf', T0, T0 + 200)).toEqual(starts([...rs], 'perf', T0, T0 + 200));
  });

  it('starts its moves 12-35 s apart, each 0.5-3 s long, never before it settled', () => {
    for (const kind of ['stand', 'deck', 'bed', 'desk'] as const) {
      for (const name of NAMES.slice(0, 8)) {
        const seed = seedOf(name);
        const ps = Array.from({ length: 200 }, (_, n) => moveIn(seed, kind, T0, Math.floor(T0 / 23.5) + n)).filter((p) => p !== null);
        for (const p of ps) {
          expect(p.start).toBeGreaterThanOrEqual(T0 + SETTLE_S);
          expect(p.dur).toBeGreaterThanOrEqual(0.5);
          expect(p.dur).toBeLessThanOrEqual(3);
        }
        for (let i = 1; i < ps.length; i++) {
          const gap = (ps[i]?.start ?? 0) - (ps[i - 1]?.start ?? 0);
          expect(gap).toBeGreaterThan(12);
          expect(gap).toBeLessThan(35);
        }
      }
    }
  });

  it('never moves two bims in step: 30 bims at rest since the same t start their moves at their own times', () => {
    // each bim's starts over 20 minutes, from its own clock
    const n0 = Math.floor(T0 / 23.5);
    const of = (name: string) => Array.from({ length: 52 }, (_, n) => moveIn(seedOf(name), 'stand', T0, n0 + n)).filter((p) => p !== null);
    const all = NAMES.map(of);
    // no pair in step: under 1 in 5 of a bim's moves starts within 0.3 s of the other's
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        const b = all[j] ?? [];
        const a = all[i] ?? [];
        const together = a.filter((p) => b.some((q) => Math.abs(q.start - p.start) < 0.3)).length;
        expect(together / a.length).toBeLessThan(0.2);
      }
    }
    // and not one move for all at a time: the picks differ
    expect(new Set(all.map((ps) => ps[0]?.move)).size).toBeGreaterThan(1);
  });

  it('moves at most MAX_AT_ONCE bims at once, a turn in its sleep and its way back aside', () => {
    const rs: Rester[] = NAMES.map((name, i) => ({ name, kind: (['stand', 'deck', 'bed', 'desk'] as const)[i % 4] ?? 'stand', from: T0 }));
    let most = 0;
    for (let t = T0 + 5; t < T0 + 600; t += STEP) {
      const on = [...idlePlan(rs, t).values()].filter((n) => n.move !== null && n.move.move !== 'turn' && n.move.move !== 'back').length;
      most = Math.max(most, on);
    }
    expect(most).toBeLessThanOrEqual(MAX_AT_ONCE);
    expect(most).toBe(MAX_AT_ONCE);
  });

  it('wakes the loop exactly at the next move: no move runs between t and t + wake, one starts then', () => {
    const rs: Rester[] = NAMES.slice(0, 3).map((name) => ({ name, kind: 'stand', from: T0 }));
    let t = T0 + 4;
    for (let i = 0; i < 20; i++) {
      // past any move running now
      while ([...idlePlan(rs, t).values()].some((n) => n.move !== null)) t += 0.05;
      const w = idleWake(rs, t);
      expect(w).not.toBeNull();
      if (w === null) return;
      for (let s = t; s < t + w - 1e-6; s += Math.min(STEP, w / 4)) expect([...idlePlan(rs, s).values()].every((n) => n.move === null)).toBe(true);
      const at = [...idlePlan(rs, t + w).values()].find((n) => n.move !== null);
      expect(at?.u).toBeCloseTo(0, 6);
      t = t + w;
    }
  });

  it('plays nothing and wakes for nothing under reduced motion, or drawn too small', () => {
    const frames = NAMES.slice(0, 5).map((n) => frame(n, DONE, T0, T0 + 100));
    const moving = (o: { reduced: boolean; scale: number }) => {
      let any = false;
      for (let t = T0 + 100; t < T0 + 200; t += STEP) {
        const f = idleFrame(frames.map((x) => frame(x.name, DONE, T0, t)), t, o);
        if ([...f.plan.values()].some((n) => n.move !== null || n.hold !== 0) || f.wake !== null) any = true;
      }
      return any;
    };
    expect(moving({ reduced: false, scale: 1 / 40 })).toBe(true);
    expect(moving({ reduced: true, scale: 1 / 40 })).toBe(false);
    expect(moving({ reduced: false, scale: 1 / (MIN_PX - 1) })).toBe(false);
  });

  it('never idles while it walks, nor under an egg, nor main', () => {
    const t = T0 + 100;
    const walking: BimFrame = { ...frame('a', DONE, T0, t), pose: { ...frame('a', DONE, T0, t).pose, moving: true } };
    const egged: BimFrame = { ...frame('b', DONE, T0, t), egg: { kind: 'shades', since: 1, dur: Infinity } as unknown as NonNullable<BimFrame['egg']> };
    const main: BimFrame = { ...frame('c', DONE, T0, t), main: true };
    const f = idleFrame([walking, egged, main], t, { reduced: false, scale: 1 / 40 });
    expect(f.plan.size).toBe(0);
    expect(f.wake).toBeNull();
  });

  it('starts and ends every move on the rest pose, and says idle while it plays', () => {
    const base: Rig = rigOf({ pose: frame('x', DONE, T0, T0 + 50).pose, t: T0 + 50, main: false, phase: 0, reduced: false });
    const moves: IdleMove[] = ['sway', 'look', 'sip', 'stretch', 'wiggle', 'yawn', 'breath', 'sigh', 'twitch'];
    for (const kind of ['stand', 'deck', 'bed', 'desk'] as const) {
      for (const move of moves) {
        const p = { move, start: 0, dur: DUR[move], side: 1 as const };
        for (const u of [0, 1]) {
          const r = idleRig(base, { kind, move: p, u, hold: 0 });
          for (const k of ['body', 'head', 'armL', 'armR'] as const) for (let i = 0; i < 3; i++) expect(r[k][i]).toBeCloseTo(base[k][i] ?? 0, 6);
          expect(r.y).toBeCloseTo(base.y, 6);
          expect(r.legL).toBeCloseTo(base.legL, 6);
        }
        const mid = idleRig(base, { kind, move: p, u: 0.5, hold: 0 });
        expect(mid.motion).toBe('idle');
      }
    }
    // a turn in its sleep ends where its hold is, its way back on the rest pose
    const turn = idleRig(base, { kind: 'bed', move: { move: 'turn', start: 0, dur: DUR.turn, side: -1 }, u: 1, hold: 0 });
    expect(turn.head).toEqual(idleRig(base, { kind: 'bed', move: null, u: 0, hold: -1 }).head);
    const back = idleRig(base, { kind: 'bed', move: { move: 'back', start: 0, dur: DUR.back, side: -1 }, u: 1, hold: 0 });
    expect(back.head[1]).toBeCloseTo(base.head[1], 6);
    // between moves: the rig as is, still
    expect(idleRig(base, { kind: 'stand', move: null, u: 0, hold: 0 })).toBe(base);
  });

  it('holds a turn in its sleep until its way back, never jumping', () => {
    const rs: Rester[] = [{ name: 'sleepy', kind: 'bed', from: T0 }];
    const base: Rig = rigOf({ pose: frame('sleepy', { k: 'nap', at: 'lounge' }, T0, T0 + 50).pose, t: T0 + 50, main: false, phase: 0, reduced: false });
    const rest = { kind: 'bed' as const, move: null, u: 0, hold: 0 as const };
    let last = idleRig(base, idlePlan(rs, T0).get('sleepy') ?? rest).head[1];
    let turns = 0;
    for (let t = T0; t < T0 + 1200; t += 0.05) {
      const n = idlePlan(rs, t).get('sleepy') ?? rest;
      if (n.move?.move === 'turn' && n.u < 0.05) turns++;
      const yaw = idleRig(base, n).head[1];
      expect(Math.abs(yaw - last)).toBeLessThan(0.05);
      last = yaw;
    }
    expect(turns).toBeGreaterThan(0);
  });
});
