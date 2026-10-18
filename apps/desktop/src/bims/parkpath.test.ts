// parkpath.ts and the skaters on it (Gabriel: « les bims ont tendance à passer à travers des
// modules »): every line of every stage of the California park ridden at 60 frames a second, its
// board never under a piece's surface nor in a piece's side (clearAt's margin), its ends never in a
// slope; the ports clear of every piece; the walks to the rest spots clear too; the routes kept per
// park and stage (architect m_28929: 1,000 skateAt calls build one router).
import { describe, expect, it } from 'vitest';
import { crowd } from './fixtures';
import { californiaLayout } from './maps/california';
import type { Pastime, Pose, Pt, Segment } from './model';
import { FEATURE_STAGE, type Feature, clearAt, has, portIn, portOut, route, routerBuilds, stairsEntry, surfaceAt } from './parkpath';
import { makePath } from './paths';
import { skateRig } from './render/skate';

/** one event-loop turn: vitest's worker reads its RPC replies only between macrotasks, and a
 *  file that runs 60 s without one fails with 'Timeout calling onTaskUpdate' (a loaded machine) */
const turn = (): Promise<void> => new Promise((done) => { setTimeout(done, 0); });
import { LINE_MAX, LINE_MIN, SESSION_S, lineOf, skateAt } from './skate';

/** the board's half width: its middle stays this far from a piece's side unless over its top */
const MARGIN = 0.12;
const EPS = 0.03;
const FEATURES = Object.keys(FEATURE_STAGE) as Feature[];

const offices = [californiaLayout(crowd(8).agents), californiaLayout(crowd(24).agents)];

function poseFor(o: (typeof offices)[number], p: Pastime) {
  const spot = o.park.spots[p.slot] ?? o.door;
  const seg: Segment = { t: 0, act: { k: 'nap', at: 'lounge' }, sig: 'skate', spot, path: makePath([spot]), speed: 2.4, from: 'nap', pastime: p };
  return (since: number): Pose => ({ x: spot.x, z: spot.z, dir: 0, moving: false, since, seg });
}

/** every frame of a line where its board is in a piece: what, where, when */
function ride(o: (typeof offices)[number], name: string, n: number, p: Pastime): string[] {
  const park = o.park;
  const pose = poseFor(o, p);
  const l = lineOf(name, n, p, park);
  const bad: string[] = [];
  for (let t = 0; t <= l.len; t += 1 / 60) {
    const u = n * SESSION_S + t;
    const rig = skateRig(name, pose(u), park, 0);
    if (!rig) continue;
    const lift = rig.lift ?? 0;
    const need = clearAt(park, p.stage, rig.x, rig.z, MARGIN);
    // the board's ends, along its way and tilt, never in a slope (a board on a transition: its sag)
    const pitch = rig.tilt?.[0] ?? 0;
    const ends = [-0.4, 0.4].map((d) => {
      const x = rig.x + Math.sin(rig.dir) * Math.cos(pitch) * d;
      const z = rig.z + Math.cos(rig.dir) * Math.cos(pitch) * d;
      return lift - Math.sin(pitch) * d - surfaceAt(park, p.stage, x, z);
    });
    const m = skateAt(name, p, u, park).move;
    if (lift < need - EPS || Math.min(...ends) < -0.12) {
      bad.push(`${name}#${String(n)} stage ${String(p.stage)} slot ${String(p.slot)} t ${t.toFixed(2)} ${m?.trick ?? '-'}/${m?.on ?? '-'}: (${rig.x.toFixed(2)}, ${rig.z.toFixed(2)}) lift ${lift.toFixed(2)} needs ${need.toFixed(2)}, ends ${ends.map((e) => e.toFixed(2)).join('/')}`);
      t += 0.5;
    }
  }
  return bad;
}

describe('the park', () => {
  it('every port stands clear of every piece, at every stage', () => {
    for (const o of offices) {
      for (let stage = 0; stage <= 14; stage++) {
        for (const f of FEATURES.filter((x) => has(stage, x))) {
          for (const side of [1, -1] as const) {
            for (const slot of [0, 1]) {
              for (const pt of [portIn(o.park, stage, f, side, slot), portOut(o.park, stage, f, side, slot)]) {
                expect(clearAt(o.park, stage, pt.x, pt.z, 0.3), `${f} ${String(side)} slot ${String(slot)} stage ${String(stage)}`).toBeLessThanOrEqual(0.001);
              }
            }
          }
        }
        for (const s of o.park.spots) expect(clearAt(o.park, stage, s.x, s.z, 0.3), `spot (${String(s.x)}, ${String(s.z)})`).toBeLessThanOrEqual(0.001);
      }
    }
  });

  it('the walks in the park (to the rest spots and the pool line-up) cross no piece', () => {
    for (const o of offices) {
      const a = o.park.area;
      for (const [p, q] of o.walks) {
        const n = Math.ceil(Math.hypot(q.x - p.x, q.z - p.z) / 0.05);
        for (let i = 0; i <= n; i++) {
          const x = p.x + ((q.x - p.x) * i) / Math.max(1, n);
          const z = p.z + ((q.z - p.z) * i) / Math.max(1, n);
          if (x < a.x0 || x > a.x1 || z < a.z0 || z > a.z1) continue;
          expect(clearAt(o.park, 14, x, z, 0.2), `walk at (${x.toFixed(2)}, ${z.toFixed(2)})`).toBeLessThanOrEqual(0.001);
        }
      }
    }
  });

  it('the stairs\' bank leads up to the deck: its way climbs, never through a step', () => {
    const park = offices[0]?.park;
    if (!park) throw new Error('no park');
    const e = stairsEntry(park);
    expect(surfaceAt(park, 9, e[0]?.x ?? 0, e[0]?.z ?? 0)).toBe(0);
    const end = e[e.length - 1] as Pt;
    expect(surfaceAt(park, 9, end.x, end.z)).toBeCloseTo(park.stairs.h, 6);
  });

  it("no board in a piece: every stage's lines, both skaters, the 900 and the pool session", { timeout: 120_000 }, async () => {
    const bad: string[] = [];
    for (const o of offices) {
      for (let stage = 0; stage <= 14; stage++) {
        for (const slot of [0, 1]) {
          const p: Pastime = { kind: 'skate', slot, pool: false, nine: false, stage };
          for (let n = 0; n < 6; n++) bad.push(...ride(o, `bim${String(slot)}${String(stage)}`, n, p));
        }
        await turn();
      }
      for (let n = 0; n < 6; n++) bad.push(...ride(o, 'nine', n * 3, { kind: 'skate', slot: 0, pool: false, nine: true, stage: 14 }));
      for (let slot = 0; slot < o.park.spots.length; slot++) bad.push(...ride(o, `pool${String(slot)}`, 0, { kind: 'skate', slot, pool: true, nine: false, stage: 11 }));
    }
    expect(bad.slice(0, 20), `${String(bad.length)} frames in a piece`).toEqual([]);
  });

  it('a line stays 8 to 12 s with its rolls timed by their routes', () => {
    for (const o of offices) {
      for (let stage = 0; stage <= 14; stage++) {
        for (let n = 0; n < 20; n++) {
          const l = lineOf(`len${String(n)}`, n, { kind: 'skate', slot: n % 2, pool: false, nine: false, stage }, o.park);
          expect(l.len).toBeGreaterThanOrEqual(LINE_MIN - 1e-9);
          expect(l.len).toBeLessThanOrEqual(LINE_MAX + 1e-9);
        }
      }
    }
  });

  it('the bowl is used outside the Sunday session: some lines ride it once it is built', () => {
    const o = offices[0];
    if (!o) throw new Error('no office');
    let bowl = 0;
    for (let n = 0; n < 40; n++) if (lineOf(`b${String(n)}`, n, { kind: 'skate', slot: n % 2, pool: false, nine: false, stage: 11 }, o.park).moves.some((m) => m.on === 'bowl')) bowl++;
    expect(bowl).toBeGreaterThan(4);
  });

  it('the router is built once per park and stage, its routes kept', () => {
    const o = californiaLayout(crowd(13).agents);
    const p: Pastime = { kind: 'skate', slot: 0, pool: false, nine: false, stage: 12 };
    const before = routerBuilds();
    for (let i = 0; i < 1000; i++) skateAt('memo', p, (i * 0.37) % SESSION_S, o.park);
    expect(routerBuilds() - before).toBe(1);
    const a = route(o.park, 12, o.park.spots[0] as Pt, portIn(o.park, 12, 'funbox', 1, 0));
    expect(route(o.park, 12, o.park.spots[0] as Pt, portIn(o.park, 12, 'funbox', 1, 0))).toBe(a);
  });
});
