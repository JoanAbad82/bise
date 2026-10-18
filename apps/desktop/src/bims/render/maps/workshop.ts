// The workshop's look (render/maps/look.ts; its plan: maps/workshop.ts): a garage, concrete floor
// with an oil stain, tall grey walls, a pegboard of tools, wooden desks against the walls, the
// workbench (the eating place) with its vise and toolbox, the ping-pong table, the roller door
// rolled up on the right by the nap place, a scooter inside it, a mint Vespa in the front middle, the neon :* over the board; its growth is the loft's (blook.ts
// loftGrower), the mural in the back left corner. Owner: maps-b.
import { Group, type Mesh, type Object3D } from 'three';
import type { WorkshopOffice } from '../../maps/workshop';
import { decorOf } from '../decor';
import { boxOf, onFloor } from '../kit';
import { WORLD } from '../palette';
import { loftLounge, loftTree } from '../stages';
import { bigDesk, boxHolding, grow, loftGrower, palettes, pieceAtOf, turnedDesk } from './blook';
import type { Build, MapLook } from './look';

const WALL_H = 2.1;
const TOOLS = ['#f39a4c', '#6cb4ee', '#2b2d42', '#ffd166'] as const;

const ws = (b: Build): WorkshopOffice => b.o as WorkshopOffice;
const benchOf = (o: { island: { x0: number; x1: number; z0: number; z1: number } }) => ({ x: (o.island.x0 + o.island.x1) / 2, z: (o.island.z0 + o.island.z1) / 2 });
const boardX = (o: { boardSpots: readonly { x: number }[] }): number => o.boardSpots.reduce((s, p) => s + p.x, 0) / Math.max(1, o.boardSpots.length);

const grower = loftGrower({
  fruit: (o) => ({ x: benchOf(o).x + 0.1, z: benchOf(o).z }),
  fruit2: (o) => ({ x: benchOf(o).x - 0.75, z: benchOf(o).z }),
  boombox: (o) => ({ x: benchOf(o).x + 0.85, z: benchOf(o).z }),
  mural: (o) => [o.x0 + 0.15, o.x0 + 2.3],
  arcade: (o) => ({ x: o.x0 + 0.5, z: 1.2 }),
  nap: (o) => ({ x: o.x0 + o.W - 2.5, z: o.D - 2.5 }),
  frameSpan: (o) => ({ xa: o.x0 + 2.4, xb: boardX(o) - 1.1, y: 1.9, z: 0.02 }),
});

/** the concrete, the tall walls, the pegboard, the roller door, the oil stain, the door mat */
function shell(b: Build): void {
  const { k, root } = b;
  const { style, pal } = k;
  const o = ws(b);
  const { x0, W, D } = o;
  const x1 = x0 + W;
  k.add(style.box(W, 0.14, D), style.floor(pal.floor, W, D), root, x0 + W / 2, -0.05, D / 2);
  k.add(style.box(W + 0.2, WALL_H, 0.2), k.mat(pal.wall), root, x0 + W / 2, WALL_H / 2, -0.1);
  k.add(style.box(0.2, 1.2, D + 0.2), k.mat(pal.wall), root, x0 - 0.1, 0.6, D / 2);
  k.add(style.box(W + 0.2, 0.08, 0.24), k.mat(pal.wallTop), root, x0 + W / 2, WALL_H, -0.1);
  // the pegboard with its tools, over the board's left
  const px = boardX(o) - 1.0;
  k.add(style.box(1.2, 0.5, 0.04), k.mat('#c49a6c'), root, px, 1.75, 0.03 + style.pictureZ);
  for (let i = 0; i < 6; i++) k.add(style.box(0.06, 0.3, 0.04), k.mat(TOOLS[i % TOOLS.length] ?? WORLD.dark), root, px - 0.45 + i * 0.18, 1.75 + (i % 2) * 0.06, 0.07 + style.pictureZ);
  // the roller door on the right edge, most of the way up: its two posts, the drum's housing, the
  // bottom of its slats under it; a scooter parked inside it, along the wall (across the room it
  // stood where the nap place's last napper lays its head on a small office: Gabriel, bims-life)
  const rz0 = 4.3;
  const rz1 = D - 0.4;
  // the door's frame stands between the camera and main's desk: tagged, a film drops it (TownOpts.clearView, Gabriel via main m_31852)
  const front = (m: Mesh): void => {
    m.userData.occludes = true;
  };
  for (const z of [rz0, rz1]) front(k.add(style.box(0.16, WALL_H, 0.16), k.mat(pal.wallTop), root, x1 + 0.05, WALL_H / 2, z));
  front(k.add(style.box(0.36, 0.34, rz1 - rz0 + 0.2), k.mat(pal.wallTop), root, x1 + 0.05, WALL_H - 0.05, (rz0 + rz1) / 2));
  front(k.add(style.box(0.06, 0.4, rz1 - rz0 - 0.16), k.mat('#9aa3ab'), root, x1 + 0.05, WALL_H - 0.42, (rz0 + rz1) / 2));
  for (let i = 0; i < 3; i++) front(k.add(style.box(0.07, 0.02, rz1 - rz0 - 0.16), k.mat('#77838c'), root, x1 + 0.05, WALL_H - 0.3 - i * 0.12, (rz0 + rz1) / 2));
  const sc = new Group();
  sc.position.set(x1 - 0.35, 0, rz0 + 0.65);
  sc.rotation.y = -Math.PI / 2;
  root.add(sc);
  scooter(k, sc, 0, 0);
  // a Vespa in the front middle, on its side stand, its nose to the roller door (where the old car
  // stood: its wheels z-fought, bims-vespa)
  const bench = benchOf(o);
  const free0 = bench.x + 1.6;
  const free1 = x1 - 4.6;
  const cz = (bench.z + 0.75 + o.crossFront) / 2;
  if (free1 - free0 > 2.6) vespa(k, root, (free0 + free1) / 2 + 0.3, cz);
  // an oil stain, a tyre against the left wall
  const oil = k.add(style.cylinder(0.5, 0.01), k.mat('#9a978f'), root, x0 + W * 0.62, 0.025, D * 0.72);
  oil.scale.z = 0.6;
  const tyre = k.add(style.cylinder(0.3, 0.16), k.mat(WORLD.dark), root, x0 + 0.25, 0.3, D - 1.0);
  tyre.rotation.z = Math.PI / 2;
  onFloor(k, root, boxOf(decorOf(o).doorMat), 0.04, 0.03, WORLD.mat);
}

/** the Vespa's tilt on its side stand, towards its +z (the stand's side) */
const LEAN = 0.1;
/** its turn: the nose (+x before it) to the camera's right-front, so its shield and headlight face it (bims) */
const YAW = -Math.PI / 3;
/** the top of the workshop's concrete (style.box(W, 0.14, D) at -0.05): the wheels stand on it */
const FLOOR_TOP = 0.012;

/**
 * a mint Vespa on its side stand, its nose turned to the camera: round body, front shield, a round
 * headlight, a two-tone seat a bim can ride (~0.45 up, ~1.1 long), a soft contact shadow under each
 * wheel (designer). Every part stands off the others (no two faces in one plane: the old car's
 * z-fight, coplanar.test.ts).
 */
export function vespa(k: Build['k'], root: Object3D, x: number, z: number): Group {
  const { style } = k;
  const g = new Group();
  g.name = 'vespa';
  g.position.set(x, FLOOR_TOP, z);
  g.rotation.y = YAW;
  root.add(g);
  const lean = new Group();
  lean.rotation.x = LEAN;
  g.add(lean);
  const shade = style.material('#000000', { opacity: 0.28 });
  for (const wx of [-0.36, 0.38]) {
    const s = k.add(style.cylinder(0.11, 0.002), shade, g, wx, 0.006, 0.01);
    s.name = 'wheel shadow';
    s.scale.z = 0.5;
  }
  const put = (name: string, geo: Parameters<typeof k.add>[0], color: string, px: number, py: number, pz: number) => {
    const m = k.add(geo, k.mat(color), lean, px, py, pz);
    m.name = name;
    return m;
  };
  const mint = '#9ed8c4';
  const cream = '#f3ead8';
  // two small solid wheels, each one mesh, and a hub cap through it that stands 0.02 out each side
  for (const [name, wx] of [['back', -0.36], ['front', 0.38]] as const) {
    put(`${name} wheel`, style.cylinder(0.13, 0.09), WORLD.dark, wx, 0.13, 0).rotation.x = Math.PI / 2;
    put(`${name} hub`, style.cylinder(0.06, 0.13), cream, wx, 0.13, 0).rotation.x = Math.PI / 2;
  }
  // the round back over the engine, the floorboard, the front shield leaning back, the mudguard
  put('body', style.ball(0.2), mint, -0.3, 0.3, 0).scale.set(1.55, 0.85, 1);
  put('floorboard', style.box(0.42, 0.05, 0.26), mint, 0.02, 0.2, 0);
  put('shield', style.box(0.05, 0.44, 0.3), mint, 0.25, 0.42, 0).rotation.z = 0.18;
  put('mudguard', style.cap(0.15, 0.5), mint, 0.38, 0.15, 0).scale.z = 0.55;
  // the two-tone seat: a cream band under a brown top
  put('seat band', style.capsule(0.07, 0.34), cream, -0.3, 0.455, 0).rotation.z = Math.PI / 2;
  put('seat', style.capsule(0.064, 0.3), '#8a6248', -0.3, 0.495, 0).rotation.z = Math.PI / 2;
  // the steering column, the headset with its round headlight, the handlebar
  put('column', style.cylinder(0.03, 0.34), cream, 0.3, 0.62, 0).rotation.z = 0.18;
  put('headset', style.box(0.12, 0.08, 0.14), mint, 0.26, 0.8, 0);
  put('handlebar', style.capsule(0.022, 0.42), WORLD.dark, 0.25, 0.83, 0).rotation.x = Math.PI / 2;
  put('headlight rim', style.cylinder(0.05, 0.04), cream, 0.34, 0.8, 0).rotation.z = Math.PI / 2;
  put('headlight', style.ball(0.042), WORLD.paper, 0.355, 0.8, 0);
  put('taillight', style.ball(0.03), '#f39a4c', -0.61, 0.36, 0);
  // the side stand, from under the floorboard down to the floor on the side it leans to
  const [ty, tz, fy, fz] = [0.22, 0.06, 0.2 * Math.tan(LEAN), 0.2];
  const stand = put('stand', style.cylinder(0.014, Math.hypot(ty - fy, tz - fz)), WORLD.dark, -0.08, (ty + fy) / 2, (tz + fz) / 2);
  stand.rotation.x = Math.atan2(tz - fz, ty - fy);
  return g;
}

/** a scooter, its nose towards the roller door */
function scooter(k: Build['k'], root: Object3D, x: number, z: number): void {
  const { style } = k;
  const body = k.mat('#6cb4ee');
  for (const dx of [-0.42, 0.42]) {
    const w = k.add(style.cylinder(0.16, 0.08), k.mat(WORLD.dark), root, x + dx, 0.16, z);
    w.rotation.x = Math.PI / 2;
  }
  k.add(style.box(0.7, 0.14, 0.26), body, root, x - 0.05, 0.3, z);
  k.add(style.box(0.3, 0.3, 0.3, 0.1), body, root, x - 0.3, 0.45, z);
  k.add(style.box(0.34, 0.07, 0.24), k.mat(WORLD.dark), root, x - 0.28, 0.63, z);
  k.add(style.box(0.08, 0.5, 0.2), body, root, x + 0.38, 0.45, z);
  k.add(style.box(0.04, 0.04, 0.5), k.mat(WORLD.dark), root, x + 0.4, 0.72, z);
  k.add(style.ball(0.05), k.mat(WORLD.paper), root, x + 0.44, 0.62, z);
}

/** the workbench (its vise, its toolbox, a radio) and the ping-pong table in front of it */
function island(b: Build): void {
  const { k, root } = b;
  const { style, pal } = k;
  const o = ws(b);
  const { x, z } = benchOf(o);
  k.add(style.box(2.5, 0.62, 0.8, 0.08), k.mat(pal.island), root, x, 0.31, z);
  k.add(style.box(2.6, 0.07, 0.9), k.mat(pal.islandTop), root, x, 0.66, z);
  k.add(style.box(0.2, 0.16, 0.16), k.mat(WORLD.dark), root, x - 1.1, 0.78, z + 0.32);
  k.add(style.box(0.5, 0.26, 0.28), k.mat(WORLD.pot), root, x - 0.3, 0.83, z - 0.22);
  const p = o.pingpong;
  const px = (p.x0 + p.x1) / 2;
  const pz = (p.z0 + p.z1) / 2;
  k.add(style.box(p.x1 - p.x0, 0.06, p.z1 - p.z0), k.mat('#2a9d8f'), root, px, 0.72, pz);
  k.add(style.box(0.02, 0.01, p.z1 - p.z0 - 0.04), k.mat(WORLD.paper), root, px - (p.x1 - p.x0) / 2 + 0.03, 0.755, pz);
  k.add(style.box(0.04, 0.16, p.z1 - p.z0), k.mat(WORLD.paper), root, px, 0.83, pz);
  for (const [dx, dz] of [[-1.1, -0.6], [1.1, -0.6], [-1.1, 0.6], [1.1, 0.6]] as const) k.add(style.box(0.06, 0.7, 0.06), k.mat(WORLD.dark), root, px + dx, 0.35, pz + dz);
  k.add(style.ball(0.05), k.mat(WORLD.paper), root, px + 0.6, 0.9, pz + 0.2);
}

export const workshop: MapLook = {
  id: 'workshop',
  pal: palettes(
    { floor: '#c4c1bb', wall: '#8e9aa3', wallTop: '#77838c', desk: '#c49a6c', deskTop: '#d8b483', island: '#5c677d', islandTop: '#c49a6c', rug: '#6cb4ee' },
    { floor: '#7d7a75', wall: '#4f585f' },
  ),
  shell,
  island,
  lounge: loftLounge,
  desk: (b, d, name) => turnedDesk(b, d, name, { w: 1.6, d: 0.78, at: 0.5 }),
  mainDesk: (b) => {
    const md = b.o.mainDesk;
    const box = boxHolding(b.o, { x: md.x, z: md.z + 0.6 }) ?? { x0: md.x - 1.15, x1: md.x + 1.15, z0: md.z + 0.1, z1: md.z + 1.1 };
    return bigDesk(b, box, md, { x: boardX(b.o), y: 1.82 });
  },
  tree: ({ k }, parent, x, z, size) => { loftTree(k, parent, x, z, size); },
  growth: (b) => { grow(b, grower); },
  pieceAt: pieceAtOf(grower),
};
