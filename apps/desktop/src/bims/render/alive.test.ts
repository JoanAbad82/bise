import { describe, expect, it } from 'vitest';
import type { Activity, BimFrame, Path, Pose, Spot } from '../model';
import { AMP, BREATH_MAX, BREATH_MIN, FADE_IN_S, GAP_S, SHIFT_S, STANCE_MAX, aliveOf, aliveSeed, breathAt, clockOf, newCrowd, stanceAt, stands, type Crowd, type Life } from './alive';
import { BURST_PX, MIN_PX } from './idle';
import { rigOf, type Rig } from './pose';

const spot: Spot = { x: 3, z: 6, wz: 5.35, ax: 1.2, face: 0 };
const still: Path = { pts: [{ x: spot.x, z: spot.z }], seg: [], len: 0 };

/** a bim at rest since `t0` (its segment started then, no walk, no transition) */
function frame(name: string, act: Activity, t0: number, t: number, more: Partial<Pose> = {}): BimFrame {
  const pose: Pose = { x: spot.x, z: spot.z, dir: 0, moving: false, since: t - t0, seg: { t: t0, act, sig: name, spot, path: still, speed: 2.4, from: null }, ...more };
  return { name, main: false, pose };
}

const T0 = 1_761_550_000;
/** at the map's size: 40 css px a unit */
const MAP = { reduced: false, scale: 1 / 40, skater: false };
/** pinched in: 300 css px a unit */
const PINCHED = { ...MAP, scale: 1 / 300 };
const NAMES = Array.from({ length: 20 }, (_, i) => `agent-${String(i)}`);
const DONE: Activity = { k: 'done', at: 'terrace', standing: true };
const rigAt = (f: BimFrame, t: number, reduced = false): Rig => rigOf({ pose: f.pose, t, main: false, phase: 0, reduced });

/** one office frame, as office-scene draws it: each bim's rig with its life, and whether a stance change ran */
function draw(c: Crowd, fs: readonly BimFrame[], t: number, o = MAP): { rigs: Rig[]; shifting: boolean } {
  c.begin(t);
  const rigs = fs.map((f) => aliveOf(c, f, rigAt(f, t, o.reduced), t, o));
  return { rigs, shifting: c.end() };
}

/** a crowd's lives over [a, b) at a frame step, each frame's by name */
function run(names: readonly string[], a: number, b: number, dt: number): Map<string, Life>[] {
  const c = newCrowd();
  const out: Map<string, Life>[] = [];
  for (let t = a; t < b; t += dt) {
    c.begin(t);
    out.push(new Map(names.map((n) => [n, c.life(n, t)])));
    c.end();
  }
  return out;
}

/** the i-th of a list, there */
function nth<T>(xs: readonly T[], i: number): T {
  const v = xs[i];
  if (v === undefined) throw new Error(`no item ${String(i)}`);
  return v;
}
/** a bim's life in a frame of run(), there */
function lifeIn(lives: readonly Map<string, Life>[], i: number, name: string): Life {
  const l = nth(lives, i).get(name);
  if (l === undefined) throw new Error(`no life for ${name}`);
  return l;
}

/** how far two rigs differ (the parts the layer moves) */
function diff(a: Rig, b: Rig): number {
  const r = (x: readonly number[], y: readonly number[]): number => x.reduce((s, v, i) => s + Math.abs(v - (y[i] ?? 0)), 0);
  return Math.abs(a.x - b.x) + Math.abs(a.z - b.z) + Math.abs(a.dir - b.dir) + Math.abs(a.y - b.y) + r(a.body, b.body) + r(a.head, b.head) + r(a.armL, b.armL) + r(a.armR, b.armR) + Math.abs(a.legL - b.legL) + Math.abs(a.legR - b.legR);
}

/** every standing state the office draws (his shot: a crowd of them) */
const STANDING: readonly [string, Activity][] = [
  ['done on the terrace', DONE],
  ['done, sipping', { ...DONE, sip: true }],
  ['a coffee', { k: 'coffee', at: 'island' }],
  ['a visit', { k: 'visit', at: 'desk' }],
  ['a report', { k: 'report', at: 'desk' }],
  ['in line with its box', { k: 'landing', at: 'door' }],
  ['at the door', { k: 'starting', at: 'door' }],
  ['a poster', { k: 'work', at: 'desk', doing: 'publish' }],
  ['the big screen', { k: 'work', at: 'desk', doing: 'computer' }],
  ['a build', { k: 'work', at: 'desk', doing: 'build' }],
  ['asks', { k: 'asks', at: 'desk' }],
  ['eating at the island', { k: 'snack', at: 'island' }],
];

/** seated or lying: not this layer's */
const SEATED: readonly [string, Activity][] = [
  ['typing', { k: 'work', at: 'desk' }],
  ['asleep', { k: 'sleep', at: 'desk' }],
  ['on a deck chair', { k: 'done', at: 'terrace' }],
  ['blocked', { k: 'blocked', at: 'desk' }],
  ['stopped', { k: 'stopped', at: 'desk' }],
];

describe('standing bims are never still (bim-alive)', () => {
  it('every standing state moves in every second at rest, and asks the loop (8 fps) at the map\'s size', () => {
    const fs = STANDING.map(([what, act]) => frame(what, act, T0, T0));
    for (const f of fs) expect(stands(rigAt(f, T0 + 30)), `${f.name} stands`).toBe(true);
    const c = newCrowd();
    const at = (t: number): Rig[] => draw(c, fs.map((f) => ({ ...f, pose: { ...f.pose, since: t - T0 } })), t).rigs;
    for (let s = T0 + 30; s < T0 + 90; s += 1) {
      const first = at(s);
      const most = first.map(() => 0);
      for (let t = s + 0.125; t <= s + 1 + 1e-9; t += 0.125) {
        at(t).forEach((r, i) => {
          expect(r.motion, nth(fs, i).name).toBe('loop');
          most[i] = Math.max(most[i] ?? 0, diff(r, nth(first, i)));
        });
      }
      most.forEach((m, i) => {
        expect(m, `${nth(fs, i).name} in the second at ${String(s - T0)} s`).toBeGreaterThan(1e-3);
      });
    }
  });

  it('a bim waiting on its walk for another to pass breathes too', () => {
    const c = newCrowd();
    const f = frame('perf', { k: 'work', at: 'desk' }, T0, T0, { waiting: true });
    draw(c, [f], T0);
    const a = nth(draw(c, [{ ...f, pose: { ...f.pose, since: 3 } }], T0 + 3).rigs, 0);
    const b = nth(draw(c, [{ ...f, pose: { ...f.pose, since: 4 } }], T0 + 4).rigs, 0);
    expect(a.motion).toBe('loop');
    expect(diff(a, b)).toBeGreaterThan(1e-4);
  });

  it('leaves seated and lying bims, main, a skater, an egg and a walk as posed', () => {
    const c = newCrowd();
    for (const [what, act] of SEATED) {
      const f = frame('perf', act, T0, T0 + 30);
      expect(draw(c, [f], T0 + 30).rigs[0], what).toEqual(rigAt(f, T0 + 30));
    }
    const f = frame('perf', DONE, T0, T0 + 30);
    const r = rigAt(f, T0 + 30);
    expect(aliveOf(c, { ...f, main: true }, r, T0 + 30, MAP)).toEqual(r);
    expect(aliveOf(c, f, r, T0 + 30, { ...MAP, skater: true })).toEqual(r);
    expect(aliveOf(c, { ...f, egg: { id: 'h1' } as unknown as NonNullable<BimFrame['egg']> }, r, T0 + 30, MAP)).toEqual(r);
    const walking = frame('perf', DONE, T0, T0 + 30, { moving: true });
    expect(draw(c, [walking], T0 + 30).rigs[0]).toEqual(rigAt(walking, T0 + 30));
  });

  it('reduced motion: no life at all, the office stays still', () => {
    const c = newCrowd();
    for (let t = T0 + 5; t < T0 + 60; t += 0.7) {
      const fs = STANDING.map(([what, act]) => frame(what, act, T0, t));
      const { rigs, shifting } = draw(c, fs, t, { ...MAP, reduced: true });
      rigs.forEach((r, i) => {
        expect(r, nth(fs, i).name).toEqual(rigAt(nth(fs, i), t, true));
      });
      expect(shifting).toBe(false);
    }
  });

  it('none drawn under MIN_PX a unit (the town from afar)', () => {
    const f = frame('perf', DONE, T0, T0 + 30);
    const r = rigAt(f, T0 + 30);
    expect(aliveOf(newCrowd(), f, r, T0 + 30, { ...MAP, scale: 1 / (MIN_PX - 1) })).toEqual(r);
    const c = newCrowd();
    aliveOf(c, f, r, T0 + 30, { ...MAP, scale: 1 / MIN_PX });
    expect(aliveOf(c, f, r, T0 + 32, { ...MAP, scale: 1 / MIN_PX })).not.toEqual(r);
  });

  it('fades in from its pose when it joins: no pop', () => {
    const c = newCrowd();
    const f = frame('perf', DONE, T0, T0 + 30);
    expect(diff(nth(draw(c, [f], T0 + 30).rigs, 0), rigAt(f, T0 + 30))).toBeLessThan(1e-9);
    const g = { ...f, pose: { ...f.pose, since: 30 + FADE_IN_S * 2 } };
    expect(diff(nth(draw(c, [g], T0 + 30 + FADE_IN_S * 2).rigs, 0), rigAt(g, T0 + 30 + FADE_IN_S * 2))).toBeGreaterThan(0);
  });

  it('breathes 3.4-4.8 s a breath, the same for the same name and t', () => {
    for (const name of NAMES) {
      const c = clockOf(aliveSeed(name));
      expect(c.breath).toBeGreaterThanOrEqual(BREATH_MIN);
      expect(c.breath).toBeLessThanOrEqual(BREATH_MAX);
      for (let t = T0; t < T0 + 60; t += 0.7) {
        expect(breathAt(name, t)).toBe(breathAt(name, t));
        expect(breathAt(name, t)).toBeGreaterThanOrEqual(0);
        expect(breathAt(name, t)).toBeLessThanOrEqual(1);
      }
    }
  });

  it('its weight on one foot then the other, both now and then; head and turn small', () => {
    for (const name of NAMES) {
      const ws = Array.from({ length: 40 }, (_, n) => stanceAt(aliveSeed(name), n).weight);
      for (let i = 1; i < ws.length; i++) if (ws[i] !== 0 && ws[i - 1] !== 0) expect(ws[i], `${name} stance ${String(i)}`).not.toBe(ws[i - 1]);
      expect(new Set(ws).size, `${name}: left, right and both`).toBe(3);
      for (let n = 0; n < 40; n++) {
        const s = stanceAt(aliveSeed(name), n);
        expect(Math.abs(s.head)).toBeLessThanOrEqual(AMP.headTurn);
        expect(Math.abs(s.turn)).toBeLessThanOrEqual(AMP.bodyTurn);
      }
    }
  });

  it('changes stance every few seconds, smoothly: never a jump between two 8 fps frames', () => {
    const lives = run(NAMES, T0, T0 + 180, 0.125);
    for (const name of NAMES) {
      let changes = 0;
      for (let i = 1; i < lives.length; i++) {
        const a = lifeIn(lives, i - 1, name);
        const b = lifeIn(lives, i, name);
        if (b.shifting && !a.shifting) changes++;
        // the steepest ease: pi/2 per SHIFT_S over a full swing of 2 (left to right)
        expect(Math.abs(b.weight - a.weight)).toBeLessThan(((2 * Math.PI) / 2 / SHIFT_S) * 0.125 + 1e-9);
        expect(Math.abs(b.head - a.head)).toBeLessThan(((2 * AMP.headTurn * Math.PI) / 2 / SHIFT_S) * 0.125 + 1e-9);
      }
      // 20 bims, a change each ~8 s, one start per GAP_S at most: every bim still changes
      expect(changes, name).toBeGreaterThanOrEqual(180 / (STANCE_MAX + SHIFT_S + 20 * GAP_S));
    }
  });

  it('never in step: no two bims start a stance change within 0.5 s, whatever the frame rate', () => {
    for (const dt of [1 / 30, 0.125, 0.4]) {
      const lives = run(NAMES, T0, T0 + 240, dt);
      const starts: number[] = [];
      for (let i = 1; i < lives.length; i++) {
        for (const name of NAMES) if (lifeIn(lives, i, name).shifting && !lifeIn(lives, i - 1, name).shifting) starts.push(T0 + i * dt);
      }
      starts.sort((a, b) => a - b);
      for (let i = 1; i < starts.length; i++) expect(nth(starts, i) - nth(starts, i - 1), `dt ${String(dt)}`).toBeGreaterThanOrEqual(GAP_S - 1e-6);
      expect(starts.length).toBeGreaterThan(40);
    }
  });

  it('never in step: no two bims of a crowd breathe or stand together', () => {
    const DT = 0.25;
    const lives = run(NAMES, T0, T0 + 300, DT);
    const corr = (x: readonly number[], y: readonly number[]): number => {
      const mx = x.reduce((s, v) => s + v, 0) / x.length;
      const my = y.reduce((s, v) => s + v, 0) / y.length;
      let sxy = 0;
      let sxx = 0;
      let syy = 0;
      for (let i = 0; i < x.length; i++) {
        const dx = (x[i] ?? 0) - mx;
        const dy = (y[i] ?? 0) - my;
        sxy += dx * dy;
        sxx += dx * dx;
        syy += dy * dy;
      }
      return sxx === 0 || syy === 0 ? 0 : sxy / Math.sqrt(sxx * syy);
    };
    const of = (name: string, k: 'breath' | 'weight'): number[] => lives.map((_, i) => lifeIn(lives, i, name)[k]);
    // over 5 min: no pair breathes in step; the stances (slow, ±1) may match by chance a while, never most of it, and the crowd as a whole never
    const ws: number[] = [];
    for (let i = 0; i < NAMES.length; i++) {
      for (let j = i + 1; j < NAMES.length; j++) {
        const a = nth(NAMES, i);
        const b = nth(NAMES, j);
        expect(Math.abs(corr(of(a, 'breath'), of(b, 'breath'))), `${a} and ${b} breathe in step`).toBeLessThan(0.5);
        const w = Math.abs(corr(of(a, 'weight'), of(b, 'weight')));
        expect(w, `${a} and ${b} shift in step`).toBeLessThan(0.75);
        ws.push(w);
      }
    }
    expect(ws.reduce((s, w) => s + w, 0) / ws.length, 'the crowd shifts in step').toBeLessThan(0.25);
  });

  it('a stance change draws at 30 fps only pinched in (BURST_PX); the breath alone at 8 fps', () => {
    const fs = NAMES.slice(0, 6).map((n) => frame(n, DONE, T0, T0));
    // the office's fit on a big window (120 px a unit) keeps the loop: a crowd at 30 fps was the display's rate (bims/idle)
    for (const [o, burst] of [[MAP, false], [{ ...MAP, scale: 1 / 120 }, false], [PINCHED, true]] as const) {
      expect(1 / o.scale >= BURST_PX).toBe(burst);
      const c = newCrowd();
      const motions = new Set<string>();
      for (let t = T0 + 10; t < T0 + 60; t += 0.125) {
        const { rigs, shifting } = draw(c, fs.map((f) => ({ ...f, pose: { ...f.pose, since: t - T0 } })), t, o);
        for (const r of rigs) motions.add(r.motion);
        if (!shifting) expect(rigs.every((r) => r.motion === 'loop')).toBe(true);
      }
      expect([...motions].sort()).toEqual(burst ? ['idle', 'loop'] : ['loop']);
    }
  });

  it('a bim that leaves (walks off) joins again from a fade', () => {
    const c = newCrowd();
    const f = frame('perf', DONE, T0, T0 + 30);
    draw(c, [f], T0 + 30);
    draw(c, [{ ...f, pose: { ...f.pose, since: 40 } }], T0 + 40);
    // a frame without it: it left the crowd
    draw(c, [], T0 + 41);
    const back = { ...f, pose: { ...f.pose, since: 42 } };
    expect(diff(nth(draw(c, [back], T0 + 42).rigs, 0), rigAt(back, T0 + 42))).toBeLessThan(1e-9);
  });
});
