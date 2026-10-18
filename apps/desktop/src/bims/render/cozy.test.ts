// @vitest-environment happy-dom
// The cozy law (page bims-cozy v2, bims m_32090): on all 13 maps, at every stage 0..14, a small and
// a big office as world.ts builds them. The base is there at stage 0 (two beds, the coffee corner,
// the shelf, a plant, the lamp, two posters, an object on each desk); nothing cozy stands on a walk,
// on the furniture or where a stage's piece goes (the look's pieceAt); no cozy piece goes through
// another mesh of the world, and none has a face coplanar with one (z-fighting); the base never uses
// a piece a stage of its map promises (its words); what it adds costs <= 25 draw calls at stage 0 and
// <= 60 at 14 (its pieces merged per stage, render/cozy.ts).
import { describe, expect, it } from 'vitest';
import { Box3, Mesh } from 'three';
import { crowd } from '../fixtures';
import { readyMaps, layoutOf, planOf } from '../maps';
import { BASE_BEDS, LAST_STAGE, NO_GROW, thingOf } from '../growth';
import { WALK_CLEAR, legToBox, type Cozy } from '../cozy';
import type { Box, Office } from '../model';
import { buildWorld } from './world';
import { lookOf } from './maps';
import { STYLE } from './style';

const SIZES = [1, 3, 9, 20, 31];
const STAGES = Array.from({ length: LAST_STAGE + 1 }, (_, s) => s);

const floorItems = (c: Cozy): Box[] => [c.coffee, c.shelf, ...c.lamps, ...c.plants].map((i) => i.box);

/** the world's meshes split: the cozy kit's pieces (merged, render/cozy.ts) and the rest; its draw calls */
function worldAt(o: Office, stage: number, night = false): { cozy: Box3[]; rest: Box3[]; calls: number } {
  const w = buildWorld(o, 'main', STYLE, lookOf(o.map), night, { ...NO_GROW, stage });
  w.root.updateMatrixWorld(true);
  const cozy: Box3[] = [];
  const rest: Box3[] = [];
  const seen = new Set<unknown>();
  let calls = 0;
  w.root.traverse((m) => {
    if (!(m instanceof Mesh)) return;
    calls++;
    const parts = m.userData.parts as Box3[] | undefined;
    if (!parts) rest.push(new Box3().setFromObject(m, true));
    else if (!seen.has(parts)) {
      seen.add(parts);
      cozy.push(...parts);
    }
  });
  w.dispose();
  return { cozy, rest, calls };
}

const fmt = (b: Box3): string => `${b.min.toArray().map((v) => v.toFixed(2)).join(',')}..${b.max.toArray().map((v) => v.toFixed(2)).join(',')}`;

/** two boxes go through each other (more than resting on or against each other); a flat one (the floor, a rug) is stood on */
function through(a: Box3, b: Box3): boolean {
  const e = 0.015;
  if (a.max.y < 0.045) return false;
  if (b.max.y < 0.03 || (b.max.y - b.min.y < 0.06 && b.max.y < 0.08)) return false;
  return a.min.x < b.max.x - e && a.max.x > b.min.x + e && a.min.y < b.max.y - e && a.max.y > b.min.y + e && a.min.z < b.max.z - e && a.max.z > b.min.z + e;
}

/**
 * a face of a and a face of b on the same plane, facing the same way, over a shared area above the
 * floor, one of them a thin sheet that way (a rug, a poster, a top): what z-fights. A box's side
 * that only bounds a round thing (a pot, a ball) is no plane.
 */
function coplanar(a: Box3, b: Box3): boolean {
  const ax = ['x', 'y', 'z'] as const;
  for (const k of ax) {
    if (Math.min(a.max[k] - a.min[k], b.max[k] - b.min[k]) > 0.05) continue;
    const others = ax.filter((o) => o !== k);
    const shared = others.every((o) => Math.min(a.max[o], b.max[o]) - Math.max(a.min[o], b.min[o]) > 0.005);
    if (!shared) continue;
    for (const side of ['min', 'max'] as const) {
      const v = a[side][k];
      if (Math.abs(v - b[side][k]) > 1e-4) continue;
      // under the floor's top nothing shows
      if (k === 'y' && v < 0.025) continue;
      if (k !== 'y' && Math.max(a.max.y, b.max.y) < 0.025) continue;
      return true;
    }
  }
  return false;
}

/** the words of a base kind: a stage promising one of these may not see it at stage 0 */
const WORDS: Readonly<Record<string, RegExp>> = {
  pouf: /\bpoufs?\b/i, cushion: /\bcushions?\b/i, zabuton: /\bzabutons?\b/i, sofa: /\bsofas?\b/i, cot: /\bcots?\b/i,
  bench: /\bbench(es)?\b/i, hammock: /\bhammocks?\b/i, charpai: /\bcharpai/i, mat: /\b(mats?|futons?)\b/i,
  monstera: /monstera/i, cactus: /cact/i, fern: /\bferns?\b/i, pothos: /pothos/i, ficus: /ficus/i, succulent: /succulent/i,
  sansevieria: /sansevieria/i, bonsai: /bonsai/i, bamboo: /bamboo/i, palm: /\bpalms?\b/i, geranium: /geranium/i, tulsi: /tulsi/i, aloe: /\baloe/i,
  vinyl: /vinyl|record/i, jars: /\bjars?\b/i, globe: /globe/i, radio: /radio/i, vase: /\bvase/i, lantern: /lantern/i, candles: /candle/i,
  pottery: /pottery|tajine/i, brasslamp: /\blamp\b/i, boat: /\bboat/i, calabash: /calabash/i, surf: /surf/i,
};

describe('the cozy law: every map, every stage', () => {
  for (const id of readyMaps()) {
    it(`${id}: the base and its places, 1..31 agents`, () => {
      const out: string[] = [];
      const look = lookOf(id);
      for (const n of SIZES) {
        const o = layoutOf(crowd(n).agents, id);
        const c = o.cozy;
        if (!c) {
          out.push(`${String(n)} agents: no cozy places`);
          continue;
        }
        if (c.lamps.length < 2) out.push(`${String(n)} agents: ${String(c.lamps.length)} floor lamps`);
        if (c.plants.length < 3) out.push(`${String(n)} agents: ${String(c.plants.length)} floor plants`);
        if (c.posters.length < 2) out.push(`${String(n)} agents: ${String(c.posters.length)} posters`);
        if (!c.rug) out.push(`${String(n)} agents: no rug`);
        const coffeeLeg = c.coffeeSpots.map((s) => `${String(s.x)},${String(s.z)}`);
        for (const b of floorItems(c)) {
          const at = `${String(n)} agents: a piece at ${b.x0.toFixed(2)},${b.z0.toFixed(2)}`;
          for (const f of o.furniture) if (b.x0 < f.x1 && b.x1 > f.x0 && b.z0 < f.z1 && b.z1 > f.z0) out.push(`${at} on furniture`);
          for (const l of o.walks) {
            const own = b === c.coffee.box && coffeeLeg.includes(`${String(l[0].x)},${String(l[0].z)}`);
            if (!own && legToBox(l, b) < WALK_CLEAR - 1e-6) out.push(`${at} on a walk`);
          }
          for (let s = 1; s <= LAST_STAGE; s++) {
            const p = look.pieceAt(o, s);
            if (p.x > b.x0 - 0.45 && p.x < b.x1 + 0.45 && p.z > b.z0 - 0.45 && p.z < b.z1 + 0.45) out.push(`${at} where stage ${String(s)}'s goes`);
          }
        }
      }
      expect(out).toEqual([]);
    });

    it(`${id}: nothing through the world, nothing coplanar, the base at 0, stages 0..14, 3 and 20 agents`, () => {
      // each fault once, at the first office and stage it shows
      const faults = new Map<string, string>();
      const fault = (at: string, what: string): void => { if (!faults.has(what)) faults.set(what, at); };
      for (const n of [3, 20]) {
        const o = layoutOf(crowd(n).agents, id);
        for (const stage of STAGES) {
          const at = `${id}, ${String(n)} agents, stage ${String(stage)}`;
          const { cozy, rest } = worldAt(o, stage);
          if (stage === 0 && cozy.length < 40) fault(at, `only ${String(cozy.length)} cozy pieces`);
          for (const a of cozy) {
            for (const b of rest) {
              if (through(a, b)) fault(at, `${fmt(a)} through ${fmt(b)}`);
              else if (coplanar(a, b)) fault(at, `${fmt(a)} coplanar with ${fmt(b)}`);
            }
          }
        }
      }
      expect([...faults].map(([what, at]) => `${at}: ${what}`).slice(0, 40)).toEqual([]);
    }, 120_000);
  }

  it("never puts a stage's promised piece in the base: its kinds are not in the map's stage words", () => {
    const out: string[] = [];
    for (const id of readyMaps()) {
      const c = lookOf(id).cozy;
      for (const kind of [c.bed, c.plant, c.small, c.shelf]) {
        const re = WORDS[kind];
        for (let s = 1; s <= LAST_STAGE; s++) if (re?.test(thingOf(s, planOf(id).things))) out.push(`${id}: base ${kind}, stage ${String(s)} « ${thingOf(s, planOf(id).things)} »`);
      }
    }
    expect(out).toEqual([]);
  });

  it('costs <= 25 draw calls at stage 0, <= 60 at 14 (merged per stage)', () => {
    const out: string[] = [];
    for (const id of readyMaps()) {
      const o = layoutOf(crowd(20).agents, id);
      const bare: Office = { ...o, cozy: undefined };
      for (const [stage, max] of [[0, 25], [14, 60]] as const) {
        for (const night of [false, true]) {
          const more = worldAt(o, stage, night).calls - worldAt(bare, stage, night).calls;
          if (more > max) out.push(`${id} stage ${String(stage)}${night ? ' night' : ''}: +${String(more)} draw calls`);
        }
      }
    }
    expect(out).toEqual([]);
  }, 120_000);

  it(`draws the ${String(BASE_BEDS)} base beds from stage 0`, () => {
    const o = layoutOf(crowd(3).agents, 'loft');
    const { cozy } = worldAt(o, 0);
    for (const s of o.lounge.slice(0, BASE_BEDS)) {
      const bed = o.furniture.find((f) => f.of?.x === s.x && f.of.z === s.z);
      expect(bed).toBeDefined();
      if (bed) expect(cozy.some((b) => b.min.x >= bed.x0 - 0.01 && b.max.x <= bed.x1 + 0.01 && b.min.z >= bed.z0 - 0.01 && b.max.z <= bed.z1 + 0.01 && b.max.y > 0.1)).toBe(true);
    }
  });
});
