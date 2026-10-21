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
// - a hammock: its back on the cloth, within TOUCH;
// - at the office's camera (camera.ts: 320 and 640 docked), nothing taller than its head's middle
//   and nearer the camera than its head covers that head on the screen (bims m_36521: a round
//   bush hid greenhouse's nap-f, sahel's shelter beam crossed a row of nappers), as shade.test.ts
//   does for desk heads and lamp shades.
import { describe, expect, it } from 'vitest';
import { Box3, Group, Mesh, type Object3D, Vector3 } from 'three';
import { crowd } from '../fixtures';
import { layoutOf, readyMaps } from '../maps';
import { bedStage, bedsAt, LAST_STAGE, NO_GROW } from '../growth';
import type { Activity, Office, Pose, Spot } from '../model';
import { buildWorld } from './world';
import { lookOf } from './maps';
import { makeBim } from './bim';
import { rigOf } from './pose';
import { restAt, surfaceAt, type NapRest } from './nap';
import { meshBoxes } from './cozy';
import { HEAD_Y } from './laptop';
import { BACK, type Fit, fitSite, siteOf, toScreen, wideSiteOf } from './camera';
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
function napper(name: string, spot: Spot, bedAt: (p: { x: number; z: number }) => NapRest | undefined): { back: Vector3; heels: Vector3[]; all: { m: Mesh; low: Vector3 }[]; head: Box3 } {
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
  const top = body.children.find((c) => c instanceof Group && Math.abs(c.position.y - HEAD_Y) < 1e-6);
  const head = top ? new Box3().setFromObject(top, true) : new Box3();
  const out = { back: lowest(hoodie), heels: feet.map(lowest), all, head };
  bim.dispose();
  return out;
}

const f2 = (n: number): string => n.toFixed(3);
const fmt = (b: Box3): string => `${b.min.toArray().map((v) => v.toFixed(2)).join(',')}..${b.max.toArray().map((v) => v.toFixed(2)).join(',')}`;

interface Rect { readonly x0: number; readonly x1: number; readonly y0: number; readonly y1: number }
/** a box's 8 corners on the screen: their bounds, css px (shade.test.ts) */
function onScreen(fit: Fit, b: Box3): Rect {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) {
    const p = toScreen(fit, { x, y, z });
    x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y);
  }
  return { x0, x1, y0, y1 };
}
/** two screen boxes overlap by more than a few px each way (an edge grazed reads as in view) */
const covers = (a: Rect, b: Rect): boolean => Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) > 3 && Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0) > 3;
/** how near the camera a box's middle is */
const depth = (b: Box3): number => ((b.min.x + b.max.x) / 2) * BACK.x + ((b.min.y + b.max.y) / 2) * BACK.y + ((b.min.z + b.max.z) / 2) * BACK.z;
/** a box cut in pieces 0.1 long along its longest side (clip.test.ts: a long beam's box is a wide rectangle its line only crosses) */
function pieces(b: Box3): Box3[] {
  const size = b.getSize(new Vector3());
  const axis = size.x >= size.y && size.x >= size.z ? 'x' : size.y >= size.z ? 'y' : 'z';
  const n = Math.max(1, Math.ceil(size[axis] / 0.1));
  return Array.from({ length: n }, (_, i) => {
    const p = b.clone();
    p.min[axis] = b.min[axis] + (size[axis] * i) / n;
    p.max[axis] = b.min[axis] + (size[axis] * (i + 1)) / n;
    return p;
  });
}

/** the reds of one world: each built bed's napper off its top */
function napReds(o: Office, stage: number, heads = false): string[] {
  const look = lookOf(o.map);
  const w = buildWorld(o, 'main', STYLE, look, false, { ...NO_GROW, stage });
  w.root.updateMatrixWorld(true);
  const meshes: Object3D[] = [];
  w.root.traverse((m) => { if (m instanceof Mesh) meshes.push(m); });
  const out: string[] = [];
  const bedAt = (p: { x: number; z: number }): NapRest | undefined => restAt(o, w.naps, p);
  const boxes = meshBoxes(w.root).filter((b) => !b.isEmpty()).flatMap(pieces);
  const fits: readonly [string, Fit][] = [['320', fitSite(siteOf(o), 320, 0)], ['640', fitSite(wideSiteOf(o), 640, 0)]];
  o.lounge.slice(0, bedsAt(stage)).forEach((s, i) => {
    const rest = w.naps[i];
    if (!rest) { out.push(`bed ${String(i)}: no rest measured`); return; }
    const n = napper(`agent-${String(i + 1)}`, s, bedAt);
    // its head on the screen: nothing taller than its middle, nearer the camera, over it
    if (heads) {
    const mid = (n.head.min.y + n.head.max.y) / 2;
    const near = boxes.filter((b) => b.max.y > mid && depth(b) > depth(n.head));
    for (const [px, fit] of fits) {
      const r = onScreen(fit, n.head);
      const over = near.find((b) => covers(r, onScreen(fit, b)));
      if (over) out.push(`bed ${String(i)}: at ${px}, its napper's head ${fmt(n.head)} under ${fmt(over)}`);
    }
    return;
    }
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

describe('nap: every napper\'s head in view at the office camera', () => {
  for (const id of readyMaps()) {
    it(`${id}: every bed at stage ${String(LAST_STAGE)}, 320 and 640, 0..31 agents (each room size once)`, async () => {
      const out: string[] = [];
      const seen = new Set<string>();
      for (let n = 0; n <= 31; n++) {
        const o = layoutOf(crowd(n).agents, id);
        if (seen.has(o.size)) continue;
        seen.add(o.size);
        out.push(...napReds(o, LAST_STAGE, true).map((r) => `${String(n)} agents, ${r}`));
        await turn();
      }
      expect([...new Set(out)].join('\n')).toBe('');
    }, 180_000);
  }
});

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
