// The greenhouse's look (render/maps/look.ts; its plan: maps/greenhouse.ts): terracotta tiles, glass
// walls on dark steel posts with plants hanging along the back, white desks turned to the tree, the
// tall tree growing through the round table (the eating place), the loft's bean bags; its growth is
// the loft's (blook.ts loftGrower), each piece where the ring leaves room. Owner: maps-b.
import type { Object3D } from 'three';
import type { GreenhouseOffice } from '../../maps/greenhouse';
import { decorOf } from '../decor';
import { boxOf, onFloor } from '../kit';
import { WORLD } from '../palette';
import { loftLounge, loftTree } from '../stages';
import { bigDesk, boxHolding, grow, loftGrower, palettes, pastBoard, pieceAtOf, turnedDesk } from './blook';
import type { Build, MapLook } from './look';

const STEEL = '#3d405b';
const LEAF = ['#5fb35a', '#7cc26b', '#4e9a48'] as const;

const gh = (b: Build): GreenhouseOffice => b.o as GreenhouseOffice;

const grower = loftGrower({
  fruit: (o) => ({ x: (o.island.x0 + o.island.x1) / 2 + 0.75, z: (o.island.z0 + o.island.z1) / 2 + 0.3 }),
  fruit2: (o) => ({ x: (o.island.x0 + o.island.x1) / 2 - 0.7, z: (o.island.z0 + o.island.z1) / 2 - 0.5 }),
  boombox: (o) => ({ x: (o.island.x0 + o.island.x1) / 2 - 0.75, z: (o.island.z0 + o.island.z1) / 2 + 0.55 }),
  mural: (o) => {
    const xs = o.lounge.map((s) => s.x);
    return [Math.min(...xs) - 0.4, Math.max(...xs) + 0.4];
  },
  arcade: pastBoard,
  nap: (o) => ({ x: (o.lounge[0]?.x ?? o.x0) + 1.0, z: 1.5 }),
});

/** the tiles, the glass walls on their posts, the hanging plants, the door mat */
function shell(b: Build): void {
  const { k, root, o } = b;
  const { style, pal } = k;
  const { x0, W, D } = o;
  const floor = k.add(style.box(W, 0.14, D), style.floor(pal.floor, W, D), root, x0 + W / 2, -0.05, D / 2);
  floor.receiveShadow = true;
  const glass = style.material(pal.window, { opacity: 0.35 });
  const H = 1.9;
  // a low sill under the glass, the glass, its posts
  k.add(style.box(W, 0.3, 0.12), k.mat(pal.wallTop), root, x0 + W / 2, 0.15, -0.06);
  k.add(style.box(0.12, 0.3, D), k.mat(pal.wallTop), root, x0 - 0.06, 0.15, D / 2);
  k.add(style.box(W, H - 0.3, 0.05), glass, root, x0 + W / 2, 0.3 + (H - 0.3) / 2, -0.05);
  k.add(style.box(0.05, H - 0.3, D), glass, root, x0 - 0.05, 0.3 + (H - 0.3) / 2, D / 2);
  const steel = k.mat(STEEL);
  for (let i = 0; i <= 6; i++) k.add(style.box(0.07, H, 0.07), steel, root, x0 + (i * W) / 6, H / 2, -0.05);
  for (let i = 0; i <= 6; i++) k.add(style.box(0.07, H, 0.07), steel, root, x0 - 0.05, H / 2, (i * D) / 6);
  k.add(style.box(W, 0.06, 0.08), steel, root, x0 + W / 2, H, -0.05);
  k.add(style.box(0.08, 0.06, D), steel, root, x0 - 0.05, H, D / 2);
  // plants hanging along the back, in the glass's bays
  for (let i = 0; i < 6; i++) {
    const x = x0 + ((i + 0.5) * W) / 6;
    k.add(style.cylinder(0.005, 0.3), steel, root, x, H - 0.15, 0.25);
    k.add(style.cylinder(0.14, 0.14), k.mat(WORLD.pot), root, x, H - 0.35, 0.25);
    k.add(style.ball(0.2), k.mat(LEAF[i % 3] ?? WORLD.leaf[0]), root, x, H - 0.48, 0.25).scale.y = 1.3;
  }
  onFloor(k, root, boxOf(decorOf(o).doorMat), 0.04, 0.03, WORLD.mat);
}

/** the round table and the tall tree through it, the coffee machine on it */
function island(b: Build): void {
  const { k, root } = b;
  const { style, pal } = k;
  const o = gh(b);
  const { cx, cz, tableR: r } = o;
  k.add(style.cylinder(r, 0.62), k.mat(pal.island), root, cx, 0.31, cz);
  k.add(style.cylinder(r + 0.08, 0.07), k.mat(pal.islandTop), root, cx, 0.66, cz);
  k.add(style.cylinder(0.2, 2.4), k.mat('#a0673f'), root, cx, 1.4, cz);
  const crown: readonly [number, number, number, number, string][] = [
    [0, 2.9, 0, 1.0, '#5fb35a'], [0.6, 2.5, 0.3, 0.7, '#7cc26b'], [-0.6, 2.6, -0.2, 0.7, '#4e9a48'], [0.1, 3.4, -0.3, 0.6, '#7cc26b'],
  ];
  for (const [dx, y, dz, rr, c] of crown) k.add(style.ball(rr), k.mat(c), root, cx + dx, y, cz + dz);
  k.add(style.box(0.45, 0.45, 0.4), k.mat(WORLD.coffee), root, cx - 0.2, 0.92, cz + 0.85);
  k.add(style.box(0.16, 0.05, 0.04), style.material(WORLD.coffeeLed, { emissive: WORLD.coffeeLed, ei: 0.5 }), root, cx - 0.2, 1.04, cz + 1.06);
}

export const greenhouse: MapLook = {
  id: 'greenhouse',
  // its cozy pieces (render/cozy.ts; page bims-cozy v2 « la base, carte par carte »)
  cozy: { plant: 'pothos', small: 'succulent', hang: 'fern', coffee: 'kettle', bed: 'cushion', shelf: 'jars', poster: 'botanic', wood: '#a0704a', cloth: ['#7cc26b', '#e9c46a', '#f3efe4'], art: ['#5fb35a', '#e9c46a', '#6cb4ee'], pot: '#c98a3e' },
  pal: palettes(
    { floor: '#e3b48f', wall: '#cfe8ee', wallTop: '#9cc7d1', desk: '#f3efe6', deskTop: '#ffffff', island: '#c49a6c', islandTop: '#e9d4b4', window: '#cfe8ee', rug: '#7cc26b' },
    { window: '#3b5f7a', desk: '#c9c2b4', deskTop: '#ddd6c8' },
  ),
  shell,
  island,
  lounge: loftLounge,
  desk: (b, d, name) => turnedDesk(b, d, name, { w: 1.1, d: 0.55, at: 0.5 }),
  mainDesk: (b) => {
    const md = b.o.mainDesk;
    const box = boxHolding(b.o, { x: md.x, z: md.z + 0.6 }) ?? { x0: md.x - 1.15, x1: md.x + 1.15, z0: md.z + 0.1, z1: md.z + 1.1 };
    return bigDesk(b, box, md);
  },
  tree: ({ k }, parent: Object3D, x, z, size) => { loftTree(k, parent, x, z, size); },
  growth: (b) => { grow(b, grower); },
  pieceAt: pieceAtOf(grower),
};
