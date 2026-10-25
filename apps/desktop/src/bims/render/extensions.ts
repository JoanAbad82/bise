// His sketch's extensions as drawn (extensions.ts, bims-plugins p5): the wing is the office going on,
// open to it (its floor, its back wall at the square's height, a window), the garden a lawn in front
// of the terrace (a hedge along its front, a tree in its far corner, stepping stones on its path from
// the door). The generic look, every growing map's until its own (a map's style comes as data in its
// look later). Owner: bims-life.
import type { Object3D } from 'three';
import type { Build } from './maps/look';
import type { MapId } from '../maps/ids';
import { WORLD } from './palette';
import { wingLamp, wingWindow } from '../wing';
import { gardenPath } from '../extensions';

/** the wing's back wall: its square's, as each map's look draws it (height, thickness) */
const WALLS: Partial<Record<MapId, { readonly h: number; readonly d: number }>> = {
  loft: { h: 1.7, d: 0.2 }, campus: { h: 1.7, d: 0.2 }, workshop: { h: 2.1, d: 0.2 }, kyoto: { h: 1.8, d: 0.14 }, riad: { h: 2.1, d: 0.2 },
  nordic: { h: 1.9, d: 0.2 }, patio: { h: 1.7, d: 0.2 }, haveli: { h: 1.8, d: 0.22 }, tropical: { h: 1.7, d: 0.2 }, cyclades: { h: 0.8, d: 0.25 },
  sahel: { h: 1.5, d: 0.4 }, california: { h: 1.9, d: 0.2 },
};
const WALL = { h: 1.7, d: 0.2 };
const HEDGE = '#4f9e45';
const TRUNK = '#8a5a3a';
const LEAF = '#5fb35a';
const STONE = '#e9dcc4';

/** a stepping stone every this far along a path, and its size */
const STONE_STEP = 0.7;

/** The wing and the garden of a grown office (nothing on a square one). */
export function buildExtensions(b: Build, into: (of: 'wing' | 'garden') => Object3D): void {
  const { k, o } = b;
  const { style, pal } = k;
  if (o.wing !== undefined) {
    const root = into('wing');
    const w = o.wing;
    const ww = w.x1 - w.x0;
    const wd = w.z1 - w.z0;
    // the floor goes on from the square's (a hair under it where they meet: no seam to fight)
    const floor = k.add(style.box(ww, 0.14, wd), style.floor(pal.floor, ww, wd), root, (w.x0 + w.x1) / 2, -0.051, (w.z0 + w.z1) / 2);
    floor.receiveShadow = true;
    const wall = WALLS[o.map] ?? WALL;
    k.add(style.box(ww + 0.1, wall.h, wall.d), k.mat(pal.wall), root, (w.x0 + w.x1) / 2 + 0.05, wall.h / 2, -wall.d / 2);
    // a window in the middle of its back wall, the floor under it kept clear (wing.ts), a frame round it (a low wall has none)
    const win = wingWindow(w);
    if (wall.h >= 1.4) {
      const wwin = win.x1 - win.x0;
      const cx = (win.x0 + win.x1) / 2;
      k.add(style.box(wwin + 0.12, 0.92, 0.05), k.mat(pal.desk), root, cx, 1.0, 0.025);
      k.add(style.box(wwin, 0.8, 0.06), k.glow(pal.window, { night: 0.4 }), root, cx, 1.0, 0.04);
      k.add(style.box(0.04, 0.8, 0.07), k.mat(pal.desk), root, cx, 1.0, 0.045);
    }
    // a floor lamp in its far back corner (wing.ts), lit at night like the cozy ones
    const lamp = wingLamp(w, w.x1 <= o.x0 + 1e-9);
    const lx = (lamp.x0 + lamp.x1) / 2;
    const lz = (lamp.z0 + lamp.z1) / 2;
    k.add(style.cylinder(0.16, 0.04), k.mat(WORLD.dark), root, lx, 0.02, lz);
    k.add(style.cylinder(0.025, 1.4), k.mat(WORLD.dark), root, lx, 0.72, lz);
    k.add(style.cylinder(0.2, 0.28), k.glow(pal.lamp, { night: 1, emissive: pal.lampOn }), root, lx, 1.5, lz);
  }
  if (o.garden !== undefined) {
    const root = into('garden');
    const g = o.garden;
    const gw = g.x1 - g.x0;
    // a low hedge along its front, a tree in its far corner
    k.add(style.box(gw - 0.6, 0.45, 0.4, 0.15), k.mat(HEDGE), root, (g.x0 + g.x1) / 2, 0.22, g.z1 - 0.4);
    k.add(style.box(0.2, 1.0, 0.2, 0.05), k.mat(TRUNK), root, g.x0 + 0.7, 0.5, g.z1 - 1.1);
    k.add(style.ball(0.6), k.mat(LEAF), root, g.x0 + 0.7, 1.45, g.z1 - 1.1);
    // the stone path: from the door, the walks the office added for it (extensions.ts gardenLegs)
    for (const s of pathStones(gardenPath(o, g))) k.add(style.box(0.46, 0.05, 0.36, 0.06), k.mat(STONE), root, s.x, 0.0, s.z);
  }
}

/** where the path's stones lie: along the garden's path from the door (extensions.ts gardenPath), every STONE_STEP. Pure. */
export function pathStones(pts: readonly { readonly x: number; readonly z: number }[]): { x: number; z: number }[] {
  const out: { x: number; z: number }[] = [];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1] as { x: number; z: number };
    const b = pts[i] as { x: number; z: number };
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    // the first stones past the door's step
    for (let at = i === 1 ? 0.9 : STONE_STEP / 2; at <= len; at += STONE_STEP) {
      const t = at / len;
      const side = out.length % 2 ? 0.08 : -0.08;
      out.push({ x: a.x + (b.x - a.x) * t + (a.z === b.z ? 0 : side), z: a.z + (b.z - a.z) * t + (a.z === b.z ? side : 0) });
    }
  }
  return out;
}
