// src/app/side3d · the right side's three side, loaded only by import('./render') from cache.ts
// (the entry chunk never holds three): an office object through the plugins place's iconOf (the
// same offscreen view, the office's day sun, its contact shadow; read, never changed), and a bim's
// head and shoulders through makeBim (the same bim as the world's: its outfit from its name, the
// clay of the day), standing, turned to the camera, in the office's iso view under the same sun,
// on a transparent ground; and a bubble's own object (bubble3d.ts) in the same view, light, sun
// and contact shadow, fitted to one visual weight. Each a PNG data URL `px` css px square drawn at
// 2x; cache.ts keeps them. Throws when there is no WebGL (the caller draws the plain tile).
// Owner: nm-side; bubblePng: r2-objects.
import { Box3, type BufferGeometry, type Material, Mesh, type Object3D, PlaneGeometry, ShadowMaterial } from 'three';
import { bubbleModel, fitOf } from './bubble3d';
import type { BubbleId } from './objects';
import { iconOf } from '@/plugins/render';
import type { ObjId } from '@/bims/render/objects/ids';
import { makeBim } from '@/bims/render/bim';
import { RIGHT, UP, type Fit } from '@/bims/render/camera';
import { HEAD_Y } from '@/bims/render/laptop';
import { DAY, NIGHT, outfitOf } from '@/bims/render/palette';
import { rigOf } from '@/bims/render/pose';
import { STYLE } from '@/bims/render/style';
import { makeView, type View } from '@/bims/render/view';
import { lightOffice } from '@/bims/render/world';
import type { Pose } from '@/bims/model';

/** An office object's PNG (plugins/render iconOf: its own cache by object and size). */
export function objectPng(obj: ObjId, px: number): string {
  return iconOf({ obj, glass: false }, px);
}

/** A bim's outfit as a signature: the heads' cache key (cache.ts), so redone outfits draw again (plan d6). */
export function outfitSig(name: string, main: boolean): string {
  return JSON.stringify(outfitOf(name, main));
}

/** the office's sun, from the room's front left (plugins/render.ts's) */
const SUN = { x: -5, y: 14, z: 3 } as const;
/** the bim turned to the camera (the iso view's azimuth) */
const FACE = Math.PI / 4;
/** how far under the head the bust goes, in head heights */
const BUST = 0.55;
/** air around the bust, a share of its size */
const AIR = 0.06;

let view: View | null = null;

function theView(): View {
  if (view !== null && !view.lost()) return view;
  view?.dispose();
  const v = makeView(document.createElement('canvas'), { shadowAuto: true, transparent: true });
  v.sky('#000000');
  v.renderer.setPixelRatio(1);
  view = v;
  return v;
}

type LightBox = Parameters<typeof lightOffice>[3];

/** a standing visitor's pose at the origin, turned to the camera */
function standing(): Pose {
  const spot = { x: 0, z: 0, wz: 0, ax: 0, face: FACE };
  const act = { k: 'visit', at: 'desk' } as const;
  return { x: 0, z: 0, dir: FACE, moving: false, since: 30, seg: { t: 0, act, sig: act.k, spot, path: { pts: [spot], seg: [], len: 0 }, speed: 2.4, from: null } };
}

/** the camera's fit on a box, square, `size` px */
function squareFit(b: Box3, size: number): Fit {
  const target = { x: (b.min.x + b.max.x) / 2, y: (b.min.y + b.max.y) / 2, z: (b.min.z + b.max.z) / 2 };
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) {
    const p = { x: x - target.x, y: y - target.y, z: z - target.z };
    const u = p.x * RIGHT.x + p.y * RIGHT.y + p.z * RIGHT.z;
    const v = p.x * UP.x + p.y * UP.y + p.z * UP.z;
    x0 = Math.min(x0, u); x1 = Math.max(x1, u); y0 = Math.min(y0, v); y1 = Math.max(y1, v);
  }
  const half = (Math.max(x1 - x0, y1 - y0) * (1 + 2 * AIR)) / 2;
  const cx = (x0 + x1) / 2;
  // the bust sits on the square's bottom: its head rises out of a bubble, its cut edge low
  const cy = y0 + half;
  return { target, left: cx - half, right: cx + half, top: cy + half, bottom: cy - half, scale: (2 * half) / size, widthPx: size, heightPx: size };
}

/** A bim's head and shoulders: `name`'s outfit (main: bise's), by day or by night. */
export function headPng(name: string, main: boolean, px: number, night: boolean): string {
  const v = theView();
  lightOffice(v.hemi, v.sun, night ? NIGHT : DAY, { x0: -1, W: 2, D: 2 } as unknown as LightBox, STYLE);
  v.sun.position.set(SUN.x, SUN.y, SUN.z);
  v.sun.target.position.set(0, 0, 0);
  const bim = makeBim(name, main, STYLE);
  bim.detail(true);
  bim.daylight(night ? 0 : 1);
  bim.apply(rigOf({ pose: standing(), t: 30, main, phase: 0, reduced: true }));
  bim.group.updateMatrixWorld(true);
  let head: Object3D | undefined;
  bim.group.traverse((o) => {
    if (head === undefined && o.children.length > 0 && Math.abs(o.position.y - HEAD_Y) < 1e-6) head = o;
  });
  const box = new Box3().setFromObject(head ?? bim.group, true);
  box.min.y -= (box.max.y - box.min.y) * BUST;
  v.scene.add(bim.group);
  const fit = squareFit(box, px * 2);
  v.renderer.setSize(fit.widthPx, fit.heightPx, false);
  v.look(fit);
  v.render();
  const url = v.renderer.domElement.toDataURL('image/png');
  v.scene.remove(bim.group);
  bim.dispose();
  return url;
}

/** how dark the bubble objects' contact shadow is on the transparent floor (plugins/render's) */
const SHADOW = 0.22;

/** A bubble's own object (bubble3d.ts), by day or by night: one visual weight in the square, its contact shadow under it. */
export function bubblePng(b: BubbleId, px: number, night: boolean): string {
  const v = theView();
  lightOffice(v.hemi, v.sun, night ? NIGHT : DAY, { x0: -1, W: 2, D: 2 } as unknown as LightBox, STYLE);
  v.sun.position.set(SUN.x, SUN.y, SUN.z);
  v.sun.target.position.set(0, 0, 0);
  const g = bubbleModel(b, night);
  g.updateMatrixWorld(true);
  const box = new Box3().setFromObject(g, true);
  const floor = new Mesh(new PlaneGeometry(4, 4), new ShadowMaterial({ opacity: SHADOW }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.001;
  floor.receiveShadow = true;
  v.scene.add(g, floor);
  const fit = fitOf(box, px * 2);
  v.renderer.setSize(fit.widthPx, fit.heightPx, false);
  v.look(fit);
  v.render();
  const url = v.renderer.domElement.toDataURL('image/png');
  v.scene.remove(g, floor);
  disposeAll(g);
  disposeAll(floor);
  return url;
}

/** frees a drawn object's geometries and materials (made once per picture) */
function disposeAll(o: Object3D): void {
  o.traverse((n) => {
    if (!(n instanceof Mesh)) return;
    (n.geometry as BufferGeometry).dispose();
    for (const m of Array.isArray(n.material) ? n.material : [n.material]) (m as Material).dispose();
  });
}
