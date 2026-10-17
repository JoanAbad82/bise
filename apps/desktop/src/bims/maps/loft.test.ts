import { describe, expect, it } from 'vitest';
import { agent, crowd } from '../fixtures';
import type { Spot } from '../model';
import { path } from '../paths';
import { type LoftOffice, loftLayout as layoutOf, WIDE_PAST } from './loft';

const furniture = (o: LoftOffice) => o.furniture;
const exitOf = (o: LoftOffice) => o.exit;

/** every place a bim can stand, the exit aside */
function spotsOf(o: LoftOffice): Spot[] {
  return [...o.desks.values(), o.mainDesk, ...o.islandSpots, ...o.lounge, ...o.boardSpots, ...o.queue, o.door, ...o.terrace];
}

const SIZES = [1, 5, 14, 17, 31];

/** a value the test knows is there */
function must<T>(x: T | undefined): T {
  if (x === undefined) throw new Error('missing');
  return x;
}

describe('layoutOf', () => {
  for (const n of SIZES) {
    describe(`${String(n)} agents`, () => {
      const o = layoutOf(crowd(n - 1).agents);

      it('gives each agent but main a desk, 3 columns past 16', () => {
        expect(o.desks.size).toBe(n - 1);
        expect(o.side).toBe(n - 1 > WIDE_PAST ? 3 : 2);
        expect(o.rows).toBe(Math.max(3, Math.ceil((n - 1) / (o.side * 2))));
      });

      it('puts no piece of furniture on another', () => {
        const boxes = furniture(o);
        for (let i = 0; i < boxes.length; i++) {
          for (let j = i + 1; j < boxes.length; j++) {
            const a = must(boxes[i]);
            const b = must(boxes[j]);
            const overlap = a.x0 < b.x1 && b.x0 < a.x1 && a.z0 < b.z1 && b.z0 < a.z1;
            expect(overlap, `${JSON.stringify(a)} on ${JSON.stringify(b)}`).toBe(false);
          }
        }
      });

      it('puts no two places on each other, and none in a piece of furniture but its own', () => {
        const spots = spotsOf(o);
        for (let i = 0; i < spots.length; i++) {
          for (let j = i + 1; j < spots.length; j++) {
            const a = must(spots[i]);
            const b = must(spots[j]);
            expect(Math.hypot(a.x - b.x, a.z - b.z)).toBeGreaterThan(0.449);
          }
        }
        for (const s of spots) {
          for (const b of furniture(o)) {
            const inside = s.x > b.x0 && s.x < b.x1 && s.z > b.z0 && s.z < b.z1;
            if (inside) expect(b.of).toBe(s);
          }
        }
      });

      it('keeps the inside places on the floor and the terrace past it', () => {
        for (const s of [...o.desks.values(), o.mainDesk, ...o.islandSpots, ...o.lounge, ...o.boardSpots, ...o.queue]) {
          expect(s.x).toBeGreaterThan(o.x0);
          expect(s.x).toBeLessThan(o.x0 + o.W);
          expect(s.z).toBeGreaterThan(0);
          expect(s.z).toBeLessThan(o.crossFront);
        }
        for (const s of o.terrace) expect(s.z).toBeGreaterThan(o.D);
      });

      it('reaches every place from the door and from main', () => {
        for (const s of spotsOf(o)) {
          for (const from of [o.door, o.mainDesk]) {
            const p = path(o, from, s);
            expect(p.pts[0]).toEqual({ x: from.x, z: from.z });
            expect(p.pts[p.pts.length - 1]).toEqual({ x: s.x, z: s.z });
            expect(Number.isFinite(p.len)).toBe(true);
          }
        }
        expect(path(o, o.door, exitOf(o)).len).toBeGreaterThan(0);
      });
    });
  }

  it('puts the desks in start order: the first by the aisles, row by row', () => {
    const o = layoutOf(crowd(5).agents);
    const d = [1, 2, 3, 4, 5].map((i) => o.desks.get(`agent-${String(i)}`));
    expect(d.map((s) => s?.z)).toEqual([d[0]?.z, d[0]?.z, d[0]?.z, d[0]?.z, (d[0]?.z ?? 0) + 2.3]);
    expect(new Set(d.map((s) => `${String(s?.x)},${String(s?.z)}`)).size).toBe(5);
  });

  it('never moves a desk while its agent lives: a newcomer takes the free one', () => {
    const agents = crowd(6).agents;
    const o1 = layoutOf(agents);
    const without3 = agents.filter((a) => a.name !== 'agent-3');
    const o2 = layoutOf(without3, o1);
    for (const a of without3) if (!a.main) expect(o2.desks.get(a.name)).toEqual(o1.desks.get(a.name));
    const o3 = layoutOf([...without3, agent('newcomer')], o2);
    expect(o3.desks.get('newcomer')).toEqual(o1.desks.get('agent-3'));
    // archived rows have no desk
    const o4 = layoutOf(agents.map((a) => (a.name === 'agent-1' ? { ...a, archived: true } : a)), o1);
    expect(o4.desks.has('agent-1')).toBe(false);
    expect(o4.desks.get('agent-2')).toEqual(o1.desks.get('agent-2'));
  });

  it('never shrinks the room under the bims', () => {
    const big = layoutOf(crowd(20).agents);
    expect(big.side).toBe(3);
    const smaller = layoutOf(crowd(4).agents, big);
    expect(smaller.side).toBe(3);
    expect(smaller.rows).toBe(big.rows);
    expect(layoutOf(crowd(4).agents).side).toBe(2);
  });

  it('is the same office for the same agents', () => {
    expect(layoutOf(crowd(9).agents)).toEqual(layoutOf(crowd(9).agents));
  });
});
