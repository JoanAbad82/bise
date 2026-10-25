// The hover moves (hover.ts): every object has its own, no two the same; each starts and ends at
// rest (the room draws no frame once it is done) and stays small (it shows, it never leaves its spot).
import { describe, expect, it } from 'vitest';
import { FEET } from './feet';
import { MIN_TRAVEL, MOVES, REST, hoverAt, travelOf } from './hover';
import { OBJ_IDS } from './ids';

const TAU = 2 * Math.PI;
const ang = (r: number): number => Math.min(((r % TAU) + TAU) % TAU, TAU - (((r % TAU) + TAU) % TAU));

describe('hover moves', () => {
  it('every object has one, and no two are the same', () => {
    const seen = new Map<string, string>();
    const twins: string[] = [];
    for (const id of OBJ_IDS) {
      const mv = MOVES[id];
      expect(mv, id).toBeDefined();
      const sig = `${mv.kind} ${String(mv.a)} ${String(mv.n)}`;
      const had = seen.get(sig);
      if (had !== undefined) twins.push(`${had} = ${id} (${sig})`);
      seen.set(sig, id);
    }
    expect(twins).toEqual([]);
  });

  it('starts and ends at rest, a whole turn round at most', () => {
    const out: string[] = [];
    for (const id of OBJ_IDS) {
      for (const t of [0, 1, 1.2]) expect(hoverAt(MOVES[id], t), `${id} at ${String(t)}`).toEqual(REST);
      // just before its end it is all but back
      const p = hoverAt(MOVES[id], 0.999);
      const off = Math.max(Math.abs(p.lift), Math.abs(p.dx), ang(p.yaw), Math.abs(p.pitch), Math.abs(p.roll), Math.abs(p.sx - 1), Math.abs(p.sy - 1));
      if (off > 0.02) out.push(`${id}: ${off.toFixed(3)} off rest at its end`);
    }
    expect(out).toEqual([]);
  });

  it('reads at the banner\'s size: each carries its farthest corner MIN_TRAVEL at least (~3 px at its 1x fit, designer m_41950)', () => {
    const out = OBJ_IDS.filter((id) => travelOf(MOVES[id], FEET[id]) < MIN_TRAVEL - 1e-3).map((id) => `${id}: ${travelOf(MOVES[id], FEET[id]).toFixed(3)}`);
    expect(out).toEqual([]);
  });

  it('stays small: under a third of a bim up, a tilt under 0.3 rad, a fifth bigger at most, never under the floor', () => {
    const out: string[] = [];
    for (const id of OBJ_IDS) {
      for (let i = 1; i < 100; i++) {
        const p = hoverAt(MOVES[id], i / 100);
        if (p.lift < 0 || p.lift > 0.32) out.push(`${id}: lift ${p.lift.toFixed(2)}`);
        if (Math.abs(p.pitch) > 0.3 || Math.abs(p.roll) > 0.3) out.push(`${id}: tilt`);
        if (Math.abs(p.dx) > 0.09) out.push(`${id}: dx ${p.dx.toFixed(3)}`);
        if (Math.max(p.sx, p.sy, p.sz) > 1.2 || Math.min(p.sx, p.sy, p.sz) < 0.8) out.push(`${id}: scale`);
      }
    }
    expect([...new Set(out)]).toEqual([]);
  });
});
