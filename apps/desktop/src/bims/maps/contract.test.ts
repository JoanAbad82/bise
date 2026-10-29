// Every map's plan keeps the Office contract (model.ts): every place a bim walks to is on its walk
// graph, the graph is connected, no leg goes through furniture but the box of a place at its end,
// every agent has a desk, and walks from the door reach every place. A new map passes this file
// before it is ready (maps-b, maps-c, maps-d: nothing to add here, PLANS lists yours).
import { describe, expect, it } from 'vitest';
import { crowd } from '../fixtures';
import type { Box, Leg, Office, Pt } from '../model';
import { along, network, path } from '../paths';
import { MAP_IDS, mapOf } from './ids';
import { PLANS, layoutOf, planOf, readyMaps } from './index';
import { placesOf } from './plan';

const SIZES = [1, 2, 5, 9, 14, 17, 31];
const near = (a: Pt, b: Pt): boolean => Math.hypot(a.x - b.x, a.z - b.z) < 1e-4;

/** a straight leg's inside through a box's inside (touching an edge is fine): sampled every 0.02 */
function crosses([a, b]: Leg, box: Box): boolean {
  const n = Math.max(2, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.02));
  const e = 1e-6;
  for (let i = 1; i < n; i++) {
    const x = a.x + ((b.x - a.x) * i) / n;
    const z = a.z + ((b.z - a.z) * i) / n;
    if (x > box.x0 + e && x < box.x1 - e && z > box.z0 + e && z < box.z1 - e) return true;
  }
  return false;
}

/** a box a leg may cross: the bed or deck chair of a place at its end */
const own = (box: Box, ends: readonly Pt[]): boolean => box.of !== undefined && ends.some((p) => near(p, box.of as Pt));

function onGraph(o: Office, p: Pt): boolean {
  return network(o).some(([a, b]) => {
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const l2 = dx * dx + dz * dz;
    const f = l2 > 0 ? ((p.x - a.x) * dx + (p.z - a.z) * dz) / l2 : 0;
    if (f < -1e-4 || f > 1 + 1e-4) return false;
    return near({ x: a.x + dx * f, z: a.z + dz * f }, p);
  });
}

function connected(o: Office): boolean {
  const legs = network(o);
  const key = (p: Pt): string => `${p.x.toFixed(4)},${p.z.toFixed(4)}`;
  const adj = new Map<string, string[]>();
  for (const [a, b] of legs) {
    adj.set(key(a), [...(adj.get(key(a)) ?? []), key(b)]);
    adj.set(key(b), [...(adj.get(key(b)) ?? []), key(a)]);
  }
  const first = legs[0];
  if (first === undefined) return false;
  const seen = new Set([key(first[0])]);
  const todo = [key(first[0])];
  for (let k = todo.pop(); k !== undefined; k = todo.pop()) {
    for (const n of adj.get(k) ?? []) if (!seen.has(n)) { seen.add(n); todo.push(n); }
  }
  return seen.size === adj.size;
}

describe('the maps', () => {
  it('reads an unknown or missing pick as the loft', () => {
    expect(mapOf('kyoto')).toBe('kyoto');
    expect(mapOf('ryokan')).toBe('loft');
    expect(mapOf(undefined)).toBe('loft');
    expect(mapOf(3)).toBe('loft');
  });

  it('has a plan per map under its own id, the loft ready', () => {
    for (const id of MAP_IDS) expect(PLANS[id].id).toBe(id);
    expect(readyMaps()[0]).toBe('loft');
  });

  it('draws the loft for a map not ready yet', () => {
    for (const id of MAP_IDS) {
      const o = layoutOf(crowd(3).agents, id);
      expect(o.map).toBe(PLANS[id].ready ? id : 'loft');
      expect(planOf(id).ready).toBe(true);
    }
  });
});

for (const id of MAP_IDS) {
  describe(`${id}'s plan keeps the office contract`, () => {
    for (const n of SIZES) {
      const o = PLANS[id].layout(crowd(n - 1).agents);

      it(`${String(n)} agents: a desk each, every place on a connected walk graph`, () => {
        expect(o.desks.size).toBe(n - 1);
        expect(o.queue.length).toBeGreaterThan(0);
        expect(connected(o)).toBe(true);
        const off = placesOf(o).filter((p) => !onGraph(o, p));
        expect(off).toEqual([]);
        expect(onGraph(o, o.queueMore[0]) && onGraph(o, o.queueMore[1])).toBe(true);
      });

      it(`${String(n)} agents: no leg through furniture`, () => {
        const bad: string[] = [];
        for (const leg of network(o)) {
          for (const box of o.furniture) if (!own(box, leg) && crosses(leg, box)) bad.push(JSON.stringify({ leg, box }));
        }
        expect(bad).toEqual([]);
      });

      it(`${String(n)} agents: the door reaches every place`, () => {
        for (const p of placesOf(o)) {
          const w = path(o, o.door, p);
          expect(near(along(w, w.len), p)).toBe(true);
        }
      });
    }
  });
}
