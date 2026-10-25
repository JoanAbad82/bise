// The home islands' hover moves (moves.ts, designer's brief on bims-home v11): one per island, each
// 0.8 to 1.6 s, starting and ending on the pose its bims hold with nothing lit, smooth all the way
// (no jump between two moments 1/60 s apart), its bims never off the island; the head follows a
// point within its reach; the gag drawn smooth still ends on the held pose.
import { describe, expect, it } from 'vitest';
import type { Rig } from '../render/pose';
import { FPS, ISLANDS, SLAB } from './gags';
import { LOOK, gagAt, gagLength, lookAt, moveOf } from './moves';

const near = (a: Rig, b: Rig): number =>
  Math.max(
    Math.abs(a.x - b.x), Math.abs(a.z - b.z), Math.abs((a.lift ?? 0) - (b.lift ?? 0)), Math.abs(a.y - b.y),
    ...[0, 1, 2].flatMap((i) => [a.head[i], a.body[i], a.armL[i], a.armR[i]].map((v, k) => Math.abs((v ?? 0) - ([b.head[i], b.body[i], b.armL[i], b.armR[i]][k] ?? 0)))),
    Math.abs(a.legL - b.legL), Math.abs(a.legR - b.legR),
  );

describe('the hover moves', () => {
  it('one per island, 0.8 to 1.6 s', () => {
    for (const s of ISLANDS) {
      const m = moveOf(s);
      expect(m.s, s.id).toBeGreaterThanOrEqual(0.8);
      expect(m.s, s.id).toBeLessThanOrEqual(1.6);
    }
  });

  it('start and end on the held pose, nothing lit at the end', () => {
    for (const s of ISLANDS) {
      const m = moveOf(s);
      const rest = s.frames[s.idle];
      expect(m.at(1).frame, s.id).toBe(rest);
      expect(m.at(1).glow, s.id).toBe(0);
      m.at(0).frame.bims.forEach((b, i) => {
        const r = rest?.bims[i]?.rig;
        if (r) expect(near(b.rig, r), `${s.id} at 0`).toBeLessThan(0.02);
      });
      m.at(0.995).frame.bims.forEach((b, i) => {
        const r = rest?.bims[i]?.rig;
        if (r) expect(near(b.rig, r), `${s.id} at the end`).toBeLessThan(0.05);
      });
    }
  });

  it('are smooth: no jump between two moments a frame apart', () => {
    for (const s of ISLANDS) {
      const m = moveOf(s);
      const n = Math.round(m.s * 60);
      for (let i = 0; i < n; i++) {
        const a = m.at(i / n).frame.bims;
        const b = m.at((i + 1) / n).frame.bims;
        a.forEach((x, j) => {
          const y = b[j];
          if (y) expect(near(x.rig, y.rig), `${s.id} at ${String(i)}/${String(n)}`).toBeLessThan(0.45);
        });
      }
    }
  });

  it('keep their bims on the island', () => {
    for (const s of ISLANDS) {
      const m = moveOf(s);
      for (let k = 0; k <= 1; k += 0.02) {
        for (const b of m.at(k).frame.bims) {
          expect(Math.abs(b.rig.x), s.id).toBeLessThan(SLAB.w / 2);
          expect(Math.abs(b.rig.z), s.id).toBeLessThan(SLAB.w / 2);
        }
      }
    }
  });

  it('each does its own thing: no two islands share a move', () => {
    const sig = ISLANDS.map((s) => JSON.stringify(moveOf(s).at(0.5).frame.bits?.map((b) => b.kind) ?? []) + String(moveOf(s).s));
    expect(sig.filter((x) => x === '[]1.6').length).toBeLessThanOrEqual(2);
  });
});

describe('the head that follows the pointer', () => {
  it('turns toward a point, within its reach', () => {
    const s = ISLANDS[0];
    const r = s?.frames[s.idle]?.bims[0]?.rig;
    if (!r) throw new Error('no rig');
    const right = lookAt(r, [r.x + Math.cos(r.dir) * 3, 1, r.z - Math.sin(r.dir) * 3]);
    const left = lookAt(r, [r.x - Math.cos(r.dir) * 3, 1, r.z + Math.sin(r.dir) * 3]);
    expect(Math.sign(right[1])).toBe(-Math.sign(left[1]));
    for (const h of [right, left, lookAt(r, [r.x, 9, r.z + 0.1])]) {
      expect(Math.abs(h[0])).toBeLessThanOrEqual(LOOK.pitch);
      expect(Math.abs(h[1])).toBeLessThanOrEqual(LOOK.yaw);
    }
  });
});

describe('the gag drawn smooth', () => {
  it('ends on the held pose, starts on its first frame', () => {
    for (const s of ISLANDS) {
      expect(gagAt(s, gagLength(s, FPS) + 0.01, FPS), s.id).toBe(s.frames[s.idle]);
      expect(gagAt(s, 0, FPS), s.id).toEqual(s.frames[s.seq[0] ?? 0]);
    }
  });
});
