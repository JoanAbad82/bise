// The room (three): the floating grass block, the floor, the back and left walls (the near ones are
// cut away so the camera sees in), main's desk and its neon, the kitchen island (a coffee counter
// first), one desk per agent from the Office, the door. What the project's growth adds (the lounge,
// the whiteboard, the terrace's things, the garden, the late pieces, the frames, the cones) is
// stages.ts's. Built once per office, theme and growth; what changes per frame (a desk's screen
// and lamp) is handed back as handles. No text, no texture but the floor tile, never the accent
// pink or the error red (palette.ts).
import {
  type BufferGeometry,
  Group,
  HemisphereLight,
  DirectionalLight,
  type Material,
  Mesh,
  type MeshLambertMaterial,
  type Object3D,
  PointLight,
} from 'three';
import { type Box, furniture } from '../layout';
import type { Office, Pt, Spot } from '../model';
import { NO_GROW, type Grow } from '../growth';
import { groundOf } from './camera';
import { decorOf } from './decor';
import { type Kit, boxOf, glyph, kitOf, onFloor } from './kit';
import { type Palette, WORLD, hash, HOODIE } from './palette';
import { type Pieces, buildStages, islandLen } from './stages';
import type { Style } from './style';

/** a desk's parts the frame drives */
export interface DeskHandles {
  readonly screen: MeshLambertMaterial;
  readonly lamp: MeshLambertMaterial;
  /** the desk's centre at its top (pick, the overlay) */
  readonly top: { readonly x: number; readonly y: number; readonly z: number };
}

export interface World {
  readonly root: Group;
  /** by agent name, main's under its own name */
  readonly desks: ReadonlyMap<string, DeskHandles>;
  readonly mainDesk: DeskHandles;
  readonly pal: Palette;
  /** each stage's pieces (stages.ts): the unlock moment hides the newest until it is brought in */
  readonly pieces: Pieces;
  dispose(): void;
}

const LAMP_ON_EI = (pal: Palette): number => (pal.pendants ? 1.1 : 0.55);

/** a laptop, its lid towards the one who sits at it (towards -z), its screen a material of its own */
function laptop(k: Kit, parent: Object3D, x: number, z: number): MeshLambertMaterial {
  const { style, pal } = k;
  k.add(style.box(0.5, 0.03, 0.34), k.mat(WORLD.metal), parent, x, 0.56, z);
  const lid = new Group();
  lid.position.set(x, 0.57, z + 0.16);
  lid.rotation.x = 0.2;
  parent.add(lid);
  k.add(style.box(0.5, 0.34, 0.025), k.mat(WORLD.metal), lid, 0, 0.17, 0);
  const screen = style.material(pal.screenOff, { emissive: pal.screenOn, ei: 0 }) as MeshLambertMaterial;
  k.add(style.box(0.44, 0.28, 0.01), screen, lid, 0, 0.17, -0.016);
  return screen;
}

// a small cream lamp on a short stem, day and night (bims m_27836, m_28080: dark ones read as ink
// glyphs, a 'T' on each desk, at 640), its bulb lit at night only (lightDesk)
function deskLamp(k: Kit, parent: Object3D, x: number, z: number): MeshLambertMaterial {
  const { style, pal } = k;
  k.add(style.box(0.11, 0.025, 0.11), k.mat(pal.lamp), parent, x, 0.56, z);
  k.add(style.box(0.025, 0.13, 0.025), k.mat(pal.lamp), parent, x, 0.635, z);
  k.add(style.box(0.12, 0.06, 0.1), k.mat(pal.lamp), parent, x - 0.03, 0.725, z);
  const bulb = style.material(pal.lamp, { emissive: pal.lampOn, ei: 0 }) as MeshLambertMaterial;
  k.add(style.box(0.08, 0.02, 0.06), bulb, parent, x - 0.03, 0.69, z);
  return bulb;
}

function chair(k: Kit, parent: Object3D, x: number, z: number, color: string, face: number): void {
  const g = new Group();
  g.position.set(x, 0, z);
  g.rotation.y = face;
  parent.add(g);
  k.add(k.style.box(0.42, 0.08, 0.42), k.mat(color), g, 0, 0.32, 0);
  k.add(k.style.box(0.42, 0.42, 0.07), k.mat(color), g, 0, 0.55, -0.2);
  k.add(k.style.cylinder(0.03, 0.3), k.mat(k.pal.ink), g, 0, 0.15, 0);
}

/** the furniture box in front of a chair (layout.ts furniture(): a desk is ahead of its spot, +z) */
function boxAhead(boxes: readonly Box[], p: Pt): Box | null {
  let best: Box | null = null;
  for (const b of boxes) {
    if (b.of || p.x < b.x0 || p.x > b.x1 || b.z0 < p.z) continue;
    if (!best || b.z0 < best.z0) best = b;
  }
  return best;
}

/** one agent's desk: its furniture box (layout.ts), the chair at its spot */
function desk(k: Kit, parent: Object3D, b: Box, d: Spot, name: string): DeskHandles {
  const { style, pal } = k;
  const h = hash(name);
  const w = b.x1 - b.x0;
  const dd = b.z1 - b.z0;
  const cx = (b.x0 + b.x1) / 2;
  const cz = (b.z0 + b.z1) / 2;
  const g = new Group();
  g.position.set(cx, 0, cz);
  parent.add(g);
  // clay: rounder desks than the default bevel, so the look reads at 640 (bims m_27836)
  k.add(style.box(w - 0.1, 0.5, dd - 0.08, 0.12), k.mat(pal.desk), g, 0, 0.25, 0);
  k.add(style.box(w, 0.06, dd, 0.03), k.mat(pal.deskTop), g, 0, 0.52, 0);
  // a small plate without text, in the colour of its bim's hoodie (spec §2)
  k.add(style.box(0.22, 0.08, 0.02), k.mat(HOODIE[h % HOODIE.length] ?? pal.desk), g, -w / 3, 0.4, dd / 2 - 0.03);
  const screen = laptop(k, g, d.x - cx, -0.03);
  const lamp = deskLamp(k, g, w / 2 - 0.18, dd / 2 - 0.17);
  chair(k, parent, d.x, d.z - 0.05, HOODIE[(h >> 5) % HOODIE.length] ?? pal.desk, d.face);
  if (h % 3 === 0) k.add(style.cylinder(0.06, 0.12), k.mat(WORLD.paper), g, 0.42, 0.61, -0.2);
  if (h % 4 === 1) {
    k.add(style.cylinder(0.08, 0.12), k.mat(WORLD.pot), g, -0.55, 0.61, -0.1);
    k.add(style.ball(0.12), k.mat(pal.plant), g, -0.55, 0.76, -0.1);
  }
  if (h % 5 === 2) k.add(style.ball(0.07), k.mat(WORLD.orange), g, 0.4, 0.62, 0.12);
  return { screen, lamp, top: { x: cx, y: 0.55, z: cz } };
}

/** every mesh under `root` casts and takes the sun's shadow (a style with shadows: clay) */
export function castShadows(root: Object3D): void {
  root.traverse((obj) => {
    if (obj instanceof Mesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
}

export function buildWorld(o: Office, mainName: string, style: Style, pal: Palette, grow: Grow = NO_GROW): World {
  const k = kitOf(style, pal);
  const root = new Group();
  const { x0, W, D } = o;
  const cx = x0 + W / 2;

  root.add(new HemisphereLight(pal.hemi[0], pal.hemi[1], pal.hemi[2]));
  const sun = new DirectionalLight(pal.sun[0], pal.sun[1]);
  sun.position.set(cx - 5, 14, 3);
  sun.target.position.set(cx, 0, D / 2);
  if (style.shadows) {
    // one soft shadow (clay, bims m_27814); a still office draws no frame, so it costs only when it moves
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.radius = 8;
    sun.shadow.bias = -0.0008;
    const cam = sun.shadow.camera;
    const half = Math.max(W, D + 4) * 0.75 + 2;
    cam.left = -half;
    cam.right = half;
    cam.top = half;
    cam.bottom = -half;
    cam.near = 1;
    cam.far = 40;
    cam.updateProjectionMatrix();
  }
  root.add(sun, sun.target);

  // the floating grass block, as wide as the garden has grown (camera.ts groundOf); its trees and
  // everything else the project's growth brings: stages.ts
  const site = groundOf(o, grow);
  const gw = site.x1 - site.x0;
  const gd = site.z1 - site.z0;
  const gx = (site.x0 + site.x1) / 2;
  const gz = (site.z0 + site.z1) / 2;
  k.add(style.box(gw, 1.2, gd, 0.45), k.mat(pal.dirt), root, gx, -0.75, gz);
  k.add(style.box(gw, 0.16, gd), k.mat(pal.grass), root, gx, -0.1, gz);
  const decor = decorOf(o);
  const boxes = furniture(o);
  const pieces = buildStages(k, root, o, grow, boxes);

  const floor = new Mesh(style.box(W, 0.14, D), style.floor(pal.floor, W, D));
  floor.position.set(cx, -0.05, D / 2);
  root.add(floor);
  // the rug under the island
  const isl = o.island;
  const il = islandLen(o, grow.stage);
  k.add(style.box(isl.w + 1.6, 0.02, il + 1.2), k.mat(pal.islandRug), root, 0, 0.03, isl.z0 + il / 2);

  // walls: back (tall: the mural, the whiteboard, the neon) and left (low, windows); the near ones cut away
  const wallH = 1.7;
  k.add(style.box(W + 0.2, wallH, 0.2), k.mat(pal.wall), root, cx, wallH / 2, -0.1);
  k.add(style.box(0.2, 1.0, D + 0.2), k.mat(pal.wall), root, x0 - 0.1, 0.5, D / 2);
  const glass = style.material(pal.window, { emissive: pal.window, ei: pal.pendants ? 0.4 : 0 });
  for (let z = (o.desks.size > 0 ? Math.min(...[...o.desks.values()].map((d) => d.z)) : 4.3) + 0.1; z < D - 1; z += 2.3) {
    k.add(style.box(0.05, 0.45, 1.2), glass, root, x0, 0.62, z + 0.6);
  }

  // main's desk: bigger, a tray, the neon :* behind it
  const md = o.mainDesk;
  const mb = boxAhead(boxes, md) ?? { x0: md.x - 1.15, x1: md.x + 1.15, z0: md.z + 0.1, z1: md.z + 1.1 };
  const mcx = (mb.x0 + mb.x1) / 2;
  const mcz = (mb.z0 + mb.z1) / 2;
  const mg = new Group();
  mg.position.set(mcx, 0, mcz);
  root.add(mg);
  const mw = mb.x1 - mb.x0;
  const mdd = mb.z1 - mb.z0;
  k.add(style.box(mw - 0.1, 0.5, mdd - 0.1), k.mat(pal.desk), mg, 0, 0.25, 0);
  k.add(style.box(mw, 0.06, mdd), k.mat(pal.deskTop), mg, 0, 0.52, 0);
  const mainScreen = laptop(k, mg, md.x - mcx + 0.2, -0.03);
  const mainLamp = deskLamp(k, mg, mw / 2 - 0.2, mdd / 2 - 0.2);
  k.add(style.box(0.7, 0.06, 0.5), k.mat(pal.wallTop), mg, -mw / 2 + 0.5, 0.58, 0);
  k.add(style.box(0.34, 0.24, 0.26), k.mat(WORLD.crate), mg, -mw / 2 + 0.5, 0.73, 0);
  chair(k, root, md.x, md.z - 0.05, WORLD.dark, md.face);
  const neon = style.material(pal.neon, { flat: true });
  glyph(k, root, md.x, 1.25, 0.02 + style.pictureZ, pal.neon, 0.06, neon);

  // the kitchen island: a small coffee counter in a new office, as long as the stage makes it
  // (stages.ts islandLen); its base, its top, the coffee machine. Its fruit and boombox: stages.ts
  const iz = (isl.z0 + isl.z1) / 2;
  const full = boxes.find((b) => !b.of && b.x0 < 0 && b.x1 > 0 && b.z0 < iz && b.z1 > iz) ?? { x0: -isl.w / 2, x1: isl.w / 2, z0: isl.z0, z1: isl.z1 };
  const top = { ...full, z1: Math.min(full.z1, full.z0 + islandLen(o, grow.stage) + 0.15) };
  k.add(style.box(top.x1 - top.x0 - 0.2, 0.62, top.z1 - top.z0 - 0.15, 0.2), k.mat(pal.island), root, 0, 0.31, (top.z0 + top.z1) / 2);
  onFloor(k, root, top, 0.07, 0.66, pal.islandTop);
  k.add(style.box(0.5, 0.5, 0.42), k.mat(WORLD.coffee), root, 0, 0.95, isl.z0 + 0.35);
  k.add(style.box(0.18, 0.06, 0.04), style.material(WORLD.coffeeLed, { emissive: WORLD.coffeeLed, ei: 0.5 }), root, 0, 1.07, isl.z0 + 0.57);
  if (pal.pendants) {
    for (let z = isl.z0 + 0.9; z < top.z1; z += 1.8) {
      const l = new PointLight('#ffcf8a', 3.2, 4.5, 1.6);
      l.position.set(0, 1.5, z);
      root.add(l);
    }
  }

  // the desks
  const desks = new Map<string, DeskHandles>();
  for (const [name, d] of o.desks) {
    const b = boxAhead(boxes, d) ?? { x0: d.x - 0.8, x1: d.x + 0.8, z0: d.z + 0.11, z1: d.z + 0.89 };
    desks.set(name, desk(k, root, b, d, name));
  }
  const mainDesk: DeskHandles = { screen: mainScreen, lamp: mainLamp, top: { x: mcx, y: 0.55, z: mcz } };
  desks.set(mainName, mainDesk);

  // the door mat
  onFloor(k, root, boxOf(decor.doorMat), 0.04, 0.03, WORLD.mat);
  if (style.shadows) castShadows(root);

  return {
    root,
    desks,
    mainDesk,
    pal,
    pieces,
    dispose() {
      root.traverse((obj) => {
        if (obj instanceof Mesh) {
          (obj.geometry as BufferGeometry).dispose();
          const m = obj.material as Material | Material[];
          for (const x of Array.isArray(m) ? m : [m]) {
            const map = (x as MeshLambertMaterial).map;
            if (map) map.dispose();
            x.dispose();
          }
        }
      });
    },
  };
}

/** a desk's screen and lamp for this frame */
export function lightDesk(h: DeskHandles, pal: Palette, screen: number, lamp: boolean): void {
  h.screen.emissiveIntensity = screen;
  h.screen.color.set(screen > 0.05 ? pal.screenOn : pal.screenOff);
  // a desk lamp lights at night only (bims m_27836); by day it is a cream shade
  const lit = lamp && pal.pendants;
  h.lamp.emissiveIntensity = lit ? LAMP_ON_EI(pal) : 0;
  h.lamp.color.set(lit ? pal.lampOn : pal.lamp);
}
