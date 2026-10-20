// @vitest-environment happy-dom
// The nap law (Gabriel, bims-nap: « dans la serre les bims dorment en lévitation dans la salle de
// sieste »; the nap pose was one fixed rig, 20 cm over a mat, its back hanging at 52° over a
// cushion). On every ready map, the smallest and the biggest office, at each stage a bed comes: each
// napper on each built bed, posed by the real rig (pose.ts rigOf with the world's rests, as
// office-scene.ts does) and built by bim.ts, rests on what the world built under it (a ray down at
// each of its points, render/nap.ts surfaceAt):
// - a flat bed (a mat, a cushion, a cot, a bench): its back's lowest point and both heels on the
//   top, within TOUCH; no part of it lower than the top under it (nothing in the bed);
// - a bean bag or a pouf: its back sunk in it, at most SUNK, never over it;
// - a hammock: its back on the cloth, within TOUCH.
import { describe, expect, it } from 'vitest';
import { Group, Mesh, type Object3D, Vector3 } from 'three';
import { crowd } from '../fixtures';
import { layoutOf, readyMaps } from '../maps';
import { bedStage, bedsAt, LAST_STAGE, NO_GROW } from '../growth';
import type { Activity, Office, Pose, Spot } from '../model';
import { buildWorld } from './world';
import { lookOf } from './maps';
import { makeBim } from './bim';
import { rigOf } from './pose';
import { restAt, surfaceAt, type NapRest } from './nap';
import { STYLE } from './style';

/** how near the top a point that rests on it is */
const TOUCH = 0.03;
/** how deep a napper sinks in a bean bag at most */
const SUNK = 0.25;
const WORLDS = [3, 31] as const;
/** stage 0 and each stage a bed comes with, and the last */
const STAGES = [...new Set([0, ...Array.from({ length: 8 }, (_, i) => bedStage(i)).filter((s) => s <= LAST_STAGE), LAST_STAGE])];
const NAP: Activity = { k: 'nap', at: 'lounge' };

/** one event-loop turn: vitest's worker reads its RPC replies only between macrotasks (clip.test.ts) */
const turn = (): Promise<void> => new Promise((done) => { setTimeout(done, 0); });

function shown(m: Object3D): boolean {
  for (let p: Object3D | null = m; p; p = p.parent) if (!p.visible) return false;
  return true;
}

/** a mesh's lowest vertex, world units */
function lowest(m: Mesh): Vector3 {
  const pos = m.geometry.getAttribute('position');
  const v = new Vector3();
  let low = new Vector3(0, Infinity, 0);
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
    if (v.y < low.y) low = v.clone();
  }
  return low;
}

/** the napper's parts: its hoodie (the back), its feet, every shown mesh */
function napper(name: string, spot: Spot, bedAt: (p: { x: number; z: number }) => NapRest | undefined): { back: Vector3; heels: Vector3[]; all: { m: Mesh; low: Vector3 }[] } {
  const bim = makeBim(name, false, STYLE);
  const pose: Pose = {
    x: spot.x, z: spot.z, dir: spot.face, moving: false, since: 30,
    seg: { t: 0, act: NAP, sig: 'nap', spot, path: { pts: [spot], seg: [], len: 0 }, speed: 2.4, from: null },
  };
  bim.apply(rigOf({ pose, t: 30, main: false, phase: 1.3, reduced: false, bedAt }));
  bim.group.updateMatrixWorld(true);
  const body = bim.group.children[0] as Group;
  const hoodie = body.children.find((c) => c instanceof Mesh) as Mesh;
  // the legs: the groups at the hips (bim.ts: x ±0.1, y 0.3), each its capsule then its foot
  const feet = body.children.filter((c) => c instanceof Group && Math.abs(c.position.y - 0.3) < 1e-6 && Math.abs(Math.abs(c.position.x) - 0.1) < 1e-6).map((g) => g.children[1] as Mesh);
  const all: { m: Mesh; low: Vector3 }[] = [];
  bim.group.traverse((o) => {
    if (!(o instanceof Mesh) || !shown(o)) return;
    const m = o as Mesh;
    all.push({ m, low: lowest(m) });
  });
  const out = { back: lowest(hoodie), heels: feet.map(lowest), all };
  bim.dispose();
  return out;
}

const f2 = (n: number): string => n.toFixed(3);

/** the reds of one world: each built bed's napper off its top */
function napReds(o: Office, stage: number): string[] {
  const look = lookOf(o.map);
  const w = buildWorld(o, 'main', STYLE, look, false, { ...NO_GROW, stage });
  w.root.updateMatrixWorld(true);
  const meshes: Object3D[] = [];
  w.root.traverse((m) => { if (m instanceof Mesh) meshes.push(m); });
  const out: string[] = [];
  const bedAt = (p: { x: number; z: number }): NapRest | undefined => restAt(o, w.naps, p);
  o.lounge.slice(0, bedsAt(stage)).forEach((s, i) => {
    const rest = w.naps[i];
    if (!rest) { out.push(`bed ${String(i)}: no rest measured`); return; }
    const n = napper(`agent-${String(i + 1)}`, s, bedAt);
    const under = (p: Vector3): number => surfaceAt(meshes, p.x, p.z);
    const back = under(n.back);
    const tag = `bed ${String(i)} (${rest.shape})`;
    if (rest.shape === 'flat') {
      if (Math.abs(n.back.y - back) > TOUCH) out.push(`${tag}: its back at ${f2(n.back.y)}, the top under it ${f2(back)}`);
      n.heels.forEach((h, j) => {
        const top = under(h);
        if (Math.abs(h.y - top) > TOUCH) out.push(`${tag}: heel ${String(j)} at ${f2(h.y)}, the top under it ${f2(top)}`);
      });
      for (const { m, low } of n.all) {
        const top = under(low);
        if (low.y < top - TOUCH) out.push(`${tag}: a part (${m.geometry.type}) at ${f2(low.y)} in the bed (top ${f2(top)})`);
      }
    } else if (rest.shape === 'sink') {
      if (n.back.y > back + TOUCH) out.push(`${tag}: its back at ${f2(n.back.y)} over the bag (${f2(back)})`);
      if (n.back.y < back - SUNK) out.push(`${tag}: its back at ${f2(n.back.y)} sunk past ${String(SUNK)} in the bag (${f2(back)})`);
    } else if (Math.abs(n.back.y - back) > TOUCH) out.push(`${tag}: its back at ${f2(n.back.y)}, the cloth under it ${f2(back)}`);
  });
  w.dispose();
  return out;
}

describe('nap: every napper rests on its bed', () => {
  for (const id of readyMaps()) {
    it(`${id}: back and heels on the top, never in the air; stages ${STAGES.join(', ')}; ${WORLDS.join(' and ')} agents`, async () => {
      const out: string[] = [];
      for (const n of WORLDS) {
        const o = layoutOf(crowd(n).agents, id);
        for (const stage of STAGES) {
          out.push(...napReds(o, stage).map((r) => `${String(n)} agents, stage ${String(stage)}, ${r}`));
          await turn();
        }
      }
      // each red on its line: the list reads whole in the failure
      expect([...new Set(out)].join('\n')).toBe('');
    }, 180_000);
  }
});
