// @vitest-environment happy-dom
// The town's dirt path reaches its office (Gabriel, town-paths: « les allées qui vont de la route
// jusqu'aux bureaux ne vont pas jusqu'au bout »; bims m_32735). For every ready map, a small and a
// big office, every growth stage, a bare and a full garden: the world as the town builds it (no grass
// block of its own), and the path's office end (render/decor.ts pathEnd, what town/ground.ts gives the
// plan). Its end touches a slab across the apron's whole width (the terrace's or the floor's front
// edge: no grass between), the path never runs under that slab (nothing of it past the end), and
// nothing the office draws stands on the path from its end to the ground's front edge, nor carves it.
import { describe, expect, it } from 'vitest';
import type { Box3 } from 'three';
import { crowd } from '../fixtures';
import { readyMaps, layoutOf } from '../maps';
import { LAST_STAGE, NO_GROW, type Grow } from '../growth';
import type { Office } from '../model';
import { buildWorld } from './world';
import { meshBoxes } from './cozy';
import { lookOf } from './maps';
import { STYLE } from './style';
import { groundOf } from './camera';
import { APRON_D, APRON_HALF, PATH_HALF, pathEnd } from './decor';
import { PATH_TOP } from './townscape';

/** float noise on a slab's edge */
const EPS = 0.02;
/** how far a thing on the office's slab may lean over its edge (a door mat, a door post): it covers the path's start */
const OVERHANG = 0.15;

const turn = (): Promise<void> => new Promise((done) => { setTimeout(done, 0); });

const fmt = (b: Box3): string => `${b.min.toArray().map((v) => v.toFixed(2)).join(',')}..${b.max.toArray().map((v) => v.toFixed(2)).join(',')}`;

/** what is wrong with the path of this office at this growth */
function faults(o: Office, g: Grow): string[] {
  const w = buildWorld(o, 'main', STYLE, lookOf(o.map), false, g, false);
  const boxes = meshBoxes(w.root, false);
  w.dispose();
  const end = pathEnd(o, g.stage);
  const front = groundOf(o, g).z1;
  const out: string[] = [];
  // a slab under (x, z): a mesh standing on the ground there, its top over the path's
  const slabAt = (x: number, z: number): Box3 | undefined =>
    boxes.find((b) => b.min.x <= x && b.max.x >= x && b.min.z <= z && b.max.z >= z && b.max.y > PATH_TOP && b.min.y < PATH_TOP + 0.1);
  for (let i = 0; i <= 6; i++) {
    const x = end.x - APRON_HALF + (i / 6) * APRON_HALF * 2;
    const s = slabAt(x, end.z - EPS);
    if (s === undefined) out.push(`no slab behind the end at x ${x.toFixed(2)}, z ${end.z.toFixed(2)}`);
    else if (s.max.z > end.z + EPS) out.push(`the path runs under ${fmt(s)} at x ${x.toFixed(2)} (end z ${end.z.toFixed(2)})`);
  }
  // the path's corridor: the apron, then the path, to the ground's front edge, from its top up
  const lanes = [
    { hw: APRON_HALF, z0: end.z + EPS, z1: end.z + APRON_D },
    { hw: PATH_HALF, z0: end.z + EPS, z1: front },
  ];
  for (const b of boxes) {
    // under the path's top, or standing on the office's slab and over its edge a little (a door mat, a door post): over the path's start
    if (b.max.y <= PATH_TOP || (b.min.z < end.z - EPS && b.max.z <= end.z + OVERHANG)) continue;
    for (const l of lanes) {
      if (b.max.x > end.x - l.hw && b.min.x < end.x + l.hw && b.max.z > l.z0 && b.min.z < l.z1) {
        out.push(`${fmt(b)} on the path (lane ±${l.hw.toFixed(2)}, z ${l.z0.toFixed(2)}..${l.z1.toFixed(2)})`);
        break;
      }
    }
  }
  for (const p of lookOf(o.map).pits?.(o, g.stage) ?? []) {
    if (p.x1 > end.x - APRON_HALF && p.x0 < end.x + APRON_HALF && p.z1 > end.z && p.z0 < front) out.push(`a pit ${JSON.stringify(p)} under the path`);
  }
  return out;
}

describe('the town path reaches its office: it touches the terrace or the floor across its apron, never under it, nothing on it, every stage (a small office with a bare garden, a big one with a full garden)', () => {
  it.each(readyMaps())('%s', { timeout: 120_000 }, async (map) => {
    const all: string[] = [];
    for (const [n, garden] of [[2, 0], [14, 8]] as const) {
      const o = layoutOf(crowd(n).agents, map);
      for (let stage = 0; stage <= LAST_STAGE; stage++) {
        for (const f of faults(o, { ...NO_GROW, stage, garden })) all.push(`${map} ${String(n)} agents, stage ${String(stage)}, garden ${String(garden)}: ${f}`);
        await turn();
      }
    }
    // one line per kind of fault: the map and the message without its numbers, its first case
    const kinds = new Map<string, string>();
    for (const f of all) {
      const key = f.replace(/-?\d+(\.\d+)?/g, '#');
      if (!kinds.has(key)) kinds.set(key, f);
    }
    expect([...kinds.values()], `${String(all.length)} faults`).toEqual([]);
  });
});
