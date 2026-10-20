// The loft's look (render/maps/look.ts; its plan: maps/loft.ts): the floor and its tile, the back
// and left walls (the near ones cut away so the camera sees in), the left windows, the door mat;
// the kitchen island (a coffee counter first, as long as the stage makes it) and its pendants at
// night; one desk per agent, main's bigger one and its neon :*; the bean bags and everything the
// project's growth adds (stages.ts). Ported unchanged from world.ts when the maps came. No text, no
// texture but the floor tile, never the accent pink or the error red (palette.ts). Owner: maps-a.
import { Group, Mesh, PointLight } from 'three';
import type { Spot } from '../../model';
import { decorOf } from '../decor';
import { boxAhead, chair, deskLamp, laptop } from '../furniture';
import { boxOf, glyph, onFloor } from '../kit';
import { LAPTOP } from '../laptop';
import { HOODIE, WORLD, hash, paletteOf } from '../palette';
import { buildStages, islandLen, loftLounge, loftTree, pieceAt } from '../stages';
import type { Build, DeskHandles, MapLook } from './look';

/** the floor, the island's rug, the walls and windows, the door mat */
function shell({ k, root, o, grow }: Build): void {
  const { style, pal } = k;
  const { x0, W, D } = o;
  const cx = x0 + W / 2;
  const floor = new Mesh(style.box(W, 0.14, D), style.floor(pal.floor, W, D));
  floor.position.set(cx, -0.05, D / 2);
  root.add(floor);
  // the rug under the island
  const isl = o.island;
  const il = islandLen(o, grow.stage);
  k.add(style.box(isl.x1 - isl.x0 + 1.6, 0.02, il + 1.2), k.mat(pal.islandRug), root, (isl.x0 + isl.x1) / 2, 0.03, isl.z0 + il / 2);

  // walls: back (tall: the mural, the whiteboard, the neon) and left (low, windows); the near ones cut away
  const wallH = 1.7;
  k.add(style.box(W + 0.2, wallH, 0.2), k.mat(pal.wall), root, cx, wallH / 2, -0.1);
  k.add(style.box(0.2, 1.0, D + 0.2), k.mat(pal.wall), root, x0 - 0.1, 0.5, D / 2);
  const glass = k.glow(pal.window, { night: 0.4 });
  for (let z = (o.desks.size > 0 ? Math.min(...[...o.desks.values()].map((d) => d.z)) : 4.3) + 0.1; z < D - 1; z += 2.3) {
    k.add(style.box(0.05, 0.45, 1.2), glass, root, x0, 0.62, z + 0.6);
  }
  // the door mat
  onFloor(k, root, boxOf(decorOf(o).doorMat), 0.04, 0.03, WORLD.mat);
}

/** main's desk: bigger, a tray, the neon :* behind it */
function mainDesk({ k, root, o }: Build): DeskHandles {
  const { style, pal } = k;
  const md = o.mainDesk;
  const mb = boxAhead(o.furniture, md) ?? { x0: md.x - 1.15, x1: md.x + 1.15, z0: md.z + 0.1, z1: md.z + 1.1 };
  const mcx = (mb.x0 + mb.x1) / 2;
  const mcz = (mb.z0 + mb.z1) / 2;
  const mg = new Group();
  mg.position.set(mcx, 0, mcz);
  root.add(mg);
  const mw = mb.x1 - mb.x0;
  const mdd = mb.z1 - mb.z0;
  k.add(style.box(mw - 0.1, 0.5, mdd - 0.1), k.mat(pal.desk), mg, 0, 0.25, 0);
  k.add(style.box(mw, 0.06, mdd), k.mat(pal.deskTop), mg, 0, 0.52, 0);
  const screen = laptop(k, mg, md.x - mcx + 0.2, LAPTOP.dz);
  const lamp = deskLamp(k, mg, mw / 2 - 0.2, mdd / 2 - 0.2);
  k.add(style.box(0.7, 0.06, 0.5), k.mat(pal.wallTop), mg, -mw / 2 + 0.5, 0.58, 0);
  k.add(style.box(0.34, 0.24, 0.26), k.mat(WORLD.crate), mg, -mw / 2 + 0.5, 0.73, 0);
  const seat = chair(k, root, md.x, md.z - 0.05, WORLD.dark, md.face);
  const neon = style.material(pal.neon, { flat: true });
  glyph(k, root, md.x, 1.25, 0.02 + style.pictureZ, pal.neon, 0.06, neon);
  return { screen, lamp, top: { x: mcx, y: 0.55, z: mcz }, chair: seat };
}

/**
 * the kitchen island: a small coffee counter in a new office, as long as the stage makes it
 * (stages.ts islandLen); its base, its top, the pendants at night. Its coffee machine: the cozy kit's
 * at stage 2 (render/cozy.ts, the corner's before); its fruit and boombox: stages.ts
 */
function island({ k, root, o, grow }: Build): void {
  const { style, pal } = k;
  const isl = o.island;
  const ix = (isl.x0 + isl.x1) / 2;
  const iz = (isl.z0 + isl.z1) / 2;
  const full = o.furniture.find((b) => !b.of && b.x0 < ix && b.x1 > ix && b.z0 < iz && b.z1 > iz) ?? isl;
  const top = { ...full, z1: Math.min(full.z1, full.z0 + islandLen(o, grow.stage) + 0.15) };
  k.add(style.box(top.x1 - top.x0 - 0.2, 0.62, top.z1 - top.z0 - 0.15, 0.2), k.mat(pal.island), root, ix, 0.31, (top.z0 + top.z1) / 2);
  onFloor(k, root, top, 0.07, 0.66, pal.islandTop);
  // the pendants' light, at night in either theme as the sky says (kit.ts light)
  for (let z = isl.z0 + 0.9; z < top.z1; z += 1.8) {
    const l = k.light(new PointLight('#ffcf8a', 3.2, 4.5, 1.6));
    l.position.set(ix, 1.5, z);
    root.add(l);
  }
}

/** one agent's desk: its furniture box (Office.furniture), the chair at its spot */
function desk({ k, root: parent, o }: Build, d: Spot, name: string): DeskHandles {
  const b = boxAhead(o.furniture, d) ?? { x0: d.x - 0.8, x1: d.x + 0.8, z0: d.z + 0.11, z1: d.z + 0.89 };
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
  const screen = laptop(k, g, d.x - cx, LAPTOP.dz);
  const lamp = deskLamp(k, g, w / 2 - 0.18, dd / 2 - 0.17);
  const seat = chair(k, parent, d.x, d.z - 0.05, HOODIE[(h >> 5) % HOODIE.length] ?? pal.desk, d.face);
  // what stands on it past the laptop and the lamp: the cozy kit's desk objects (render/cozy.ts)
  return { screen, lamp, top: { x: cx, y: 0.55, z: cz }, chair: seat };
}

export const loft: MapLook = {
  id: 'loft',
  // its cozy pieces (render/cozy.ts; page bims-cozy v2 « la base, carte par carte »)
  cozy: { plant: 'monstera', small: 'cactus', coffee: 'espresso', bed: 'pouf', shelf: 'vinyl', poster: 'flat', wood: '#c49a6c', cloth: ['#f39a4c', '#6cb4ee', '#e9e2d4'], art: ['#e9a23b', '#2a9d8f', '#ffd166'], pot: '#f39a4c', rug: '#ffd166' },
  pal: paletteOf,
  shell,
  island,
  bedShape: 'sink',
  lounge: loftLounge,
  desk,
  mainDesk: (b) => mainDesk(b),
  tree: ({ k }, parent, x, z, size) => {
    loftTree(k, parent, x, z, size);
  },
  growth: buildStages,
  pieceAt,
};
