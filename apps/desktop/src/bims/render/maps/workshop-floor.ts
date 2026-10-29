// The workshop's free floor drawn (its plan: maps/workshop-floor.ts, page bims-workshop, Gabriel's
// pick C): each pod's lamp beam (two posts, a beam along the pod, three workshop shades that glow at
// night through kit.glow; its light is a pool of world.ts poolsOf, Office.lamps), its plant at its left
// end; each corner, every piece inside its floor box (render/clip.test.ts): the lounge, the band,
// the maker bench, the lift with the old yellow car up, the pallet racks, the motorbike. The bims'
// kit only (style shapes, kit.mat, WORLD colours), details under ~6 cm their own raised meshes, no
// two faces in one plane (coplanar.test.ts), never pink or red. Owner: maps-b.
import { Group, type Object3D } from 'three';
import type { Corner, CornerKind, Pod } from '../../maps/workshop-floor';
import { POD_BEAM_Z, POD_PLANT, POD_POST } from '../../maps/workshop-floor';
import type { Kit } from '../kit';
import { WORLD } from '../palette';

const METAL = '#9aa3ab';
const STEEL = '#5c677d';
const WOOD = '#c49a6c';
const LEATHER = '#8a5a3b';
const LEATHER_DARK = '#7a4a2a';
const BLUE = '#2b6cb0';
const TEAL = '#2a9d8f';
const VIOLET = '#9b8fe0';
const ORANGE = '#f39a4c';

/**
 * a shade's place along the pod (over each desk pair), its height; 4 cm to the right of the pairs'
 * middles: the clay bims' bigger heads (page bims-look D) standing at a desk's right side met the
 * shade nearer the camera by 0.2 px at 320 (shade.test.ts)
 */
const SHADES = [-1.76, 0.04, 1.84] as const;
const SHADE_Y = 2.06;

const tag = <T extends Object3D>(o: T, i: number): T => {
  o.userData.corner = i;
  return o;
};

/** a potted plant whose leaves stay within `r` of its middle */
function plant(k: Kit, g: Object3D, x: number, z: number, r: number): void {
  const { style } = k;
  k.add(style.cylinder(r * 0.6, r * 1.2), k.mat(WORLD.pot), g, x, r * 0.6, z);
  k.add(style.ball(r), k.mat(WORLD.leaf[0]), g, x, r * 2.1, z).scale.y = 1.15;
  k.add(style.ball(r * 0.7), k.mat(WORLD.leaf[1]), g, x + r * 0.2, r * 3.0, z - r * 0.15);
}

/** a stool: a base, a post, a round seat at `top` */
function stool(k: Kit, g: Object3D, x: number, z: number, top: number, color: string): void {
  const { style } = k;
  k.add(style.cylinder(0.14, 0.04), k.mat(STEEL), g, x, 0.04, z);
  k.add(style.cylinder(0.03, top - 0.06), k.mat(METAL), g, x, top / 2 + 0.01, z);
  k.add(style.cylinder(0.17, 0.06), k.mat(color), g, x, top - 0.03, z);
}

/** one pod's lamp beam, its three shades and its plant (its light: world.ts poolsOf) */
export function podBeam(k: Kit, root: Object3D, p: Pod): void {
  const { style } = k;
  const g = new Group();
  g.name = 'pod';
  g.position.set(p.x, 0, p.z + POD_BEAM_Z);
  root.add(g);
  const steel = k.mat(STEEL);
  for (const sx of [-POD_POST, POD_POST]) {
    k.add(style.box(0.12, 2.3, 0.12), steel, g, sx, 1.15, 0);
    k.add(style.box(0.3, 0.04, 0.3), steel, g, sx, 0.03, 0);
  }
  k.add(style.box(POD_POST * 2 + 0.12, 0.1, 0.12), steel, g, 0, 2.34, 0);
  const shade = k.glow('#e9c46a', { night: 1.0, emissive: '#ffcf7a' });
  const bulb = k.glow(WORLD.paper, { night: 1.4, emissive: '#ffe7a8' });
  for (const lx of SHADES) {
    k.add(style.cylinder(0.01, 0.34), k.mat(WORLD.dark), g, lx, SHADE_Y + 0.21, 0);
    k.add(style.cap(0.22, 0.45), shade, g, lx, SHADE_Y, 0).userData.shade = true;
    k.add(style.ball(0.05), bulb, g, lx, SHADE_Y - 0.02, 0).userData.shade = true;
  }
  plant(k, g, -POD_PLANT, -POD_BEAM_Z, 0.26);
}

/** the lounge: a rug, an old leather sofa, two armchairs, a cable-reel table with mugs, a floor lamp, a plant */
function lounge(k: Kit, g: Object3D): void {
  const { style } = k;
  k.add(style.box(4.3, 0.02, 2.5, 0.01), k.mat('#6cb4ee'), g, 0, 0.02, -0.25);
  // the sofa: its base, two seat cushions, its back, its arms
  k.add(style.box(2.4, 0.26, 0.8, 0.08), k.mat(LEATHER), g, 0, 0.15, -0.87);
  for (const sx of [-0.57, 0.57]) k.add(style.box(1.06, 0.1, 0.6, 0.05), k.mat(LEATHER), g, sx, 0.3, -0.79);
  k.add(style.box(2.4, 0.5, 0.2, 0.08), k.mat(LEATHER_DARK), g, 0, 0.48, -1.18);
  for (const sx of [-1.13, 1.13]) k.add(style.box(0.2, 0.42, 0.84, 0.08), k.mat(LEATHER_DARK), g, sx, 0.38, -0.87);
  // the armchairs, facing the table: a seat, a back on the outer side, two arms
  for (const s of [-1, 1]) {
    const x = s * 1.55;
    k.add(style.box(0.7, 0.3, 0.7, 0.08), k.mat(WORLD.gold), g, x, 0.22, 0.35);
    k.add(style.box(0.2, 0.42, 0.74, 0.06), k.mat(WORLD.gold), g, x + s * 0.27, 0.45, 0.35);
    for (const dz of [-0.3, 0.3]) k.add(style.box(0.66, 0.16, 0.12, 0.04), k.mat(WORLD.gold), g, x, 0.4, 0.35 + dz);
  }
  // the cable-reel table: two discs on a core, two mugs on top
  k.add(style.cylinder(0.38, 0.05), k.mat(WOOD), g, 0, 0.045, 0.35);
  k.add(style.cylinder(0.16, 0.41), k.mat('#a0673f'), g, 0, 0.285, 0.35);
  k.add(style.cylinder(0.38, 0.05), k.mat(WOOD), g, 0, 0.5, 0.35);
  k.add(style.box(0.1, 0.1, 0.1, 0.02), k.mat(WORLD.paper), g, 0.12, 0.57, 0.3);
  k.add(style.box(0.1, 0.1, 0.1, 0.02), k.mat(WORLD.paper), g, -0.1, 0.57, 0.45);
  // the floor lamp, its shade lit at night
  k.add(style.cylinder(0.15, 0.04), k.mat(WORLD.dark), g, 1.75, 0.04, -1.1);
  k.add(style.cylinder(0.025, 1.45), k.mat(WORLD.dark), g, 1.75, 0.77, -1.1);
  k.add(style.box(0.34, 0.28, 0.34, 0.06), k.glow('#ffe7a8', { night: 1.0, emissive: k.pal.lampOn }), g, 1.75, 1.52, -1.1);
  plant(k, g, -1.9, -0.95, 0.3);
}

/** the band corner: a rug, a drum kit and its stool, an amp, a guitar on its stand, a mic */
function band(k: Kit, g: Object3D): void {
  const { style } = k;
  const shell = k.mat(WORLD.paper);
  k.add(style.box(2.9, 0.02, 2.2, 0.01), k.mat(VIOLET), g, 0, 0.02, -0.1);
  // the bass drum on its side, its front head, the snare on its stand, a tom, the floor tom
  const bass = k.add(style.cylinder(0.3, 0.36), shell, g, -0.3, 0.32, -0.45);
  bass.rotation.x = Math.PI / 2;
  const head = k.add(style.cylinder(0.27, 0.02), k.mat(BLUE), g, -0.3, 0.32, -0.265);
  head.rotation.x = Math.PI / 2;
  k.add(style.cylinder(0.02, 0.58), k.mat(METAL), g, -0.65, 0.29, -0.1);
  k.add(style.cylinder(0.17, 0.14), shell, g, -0.65, 0.62, -0.1);
  k.add(style.cylinder(0.15, 0.18), shell, g, 0.05, 0.78, -0.5);
  k.add(style.cylinder(0.18, 0.4), shell, g, 0.35, 0.22, -0.2);
  // two cymbals on their stands
  for (const [x, z, h] of [[-1.0, -0.6, 1.1], [0.35, -0.72, 1.2]] as const) {
    k.add(style.cylinder(0.02, h), k.mat(METAL), g, x, h / 2, z);
    k.add(style.cylinder(0.26, 0.015), k.mat(WORLD.gold), g, x, h + 0.02, z);
  }
  stool(k, g, -0.3, 0.5, 0.37, WORLD.dark);
  // the amp: its grille and three knobs stand out of its front
  k.add(style.box(0.55, 0.65, 0.35, 0.05), k.mat(WORLD.dark), g, 1.0, 0.335, -0.55);
  k.add(style.box(0.45, 0.4, 0.03, 0.01), k.mat(STEEL), g, 1.0, 0.3, -0.365);
  for (let i = 0; i < 3; i++) k.add(style.ball(0.025), k.mat(WORLD.paper), g, 0.88 + i * 0.12, 0.6, -0.37);
  // the guitar on its stand, leaning a little
  k.add(style.box(0.3, 0.04, 0.3, 0.01), k.mat(WORLD.dark), g, 0.95, 0.06, 0.4);
  const gt = new Group();
  gt.position.set(0.95, 0, 0.4);
  gt.rotation.z = -0.12;
  g.add(gt);
  k.add(style.ball(0.17), k.mat(ORANGE), gt, 0, 0.4, 0).scale.set(1, 1.25, 0.45);
  k.add(style.cylinder(0.03, 0.6), k.mat(LEATHER_DARK), gt, 0, 0.82, 0);
  k.add(style.box(0.07, 0.12, 0.04, 0.01), k.mat(WORLD.dark), gt, 0, 1.17, 0);
  // the mic on its stand
  k.add(style.cylinder(0.1, 0.04), k.mat(WORLD.dark), g, 0.25, 0.04, 0.85);
  k.add(style.cylinder(0.012, 1.34), k.mat(METAL), g, 0.25, 0.72, 0.85);
  k.add(style.ball(0.045), k.mat(WORLD.dark), g, 0.25, 1.4, 0.85);
}

/** the maker bench: three 3D printers with their prints, a drill press, a stool */
function maker(k: Kit, g: Object3D): void {
  const { style } = k;
  const bx = -0.4;
  const bz = -0.4;
  k.add(style.box(3.0, 0.07, 0.9, 0.02), k.mat(WOOD), g, bx, 0.78, bz);
  k.add(style.box(2.8, 0.04, 0.7, 0.01), k.mat(WOOD), g, bx, 0.2, bz);
  for (const dx of [-1.4, 1.4]) for (const dz of [-0.37, 0.37]) k.add(style.box(0.08, 0.76, 0.08, 0.02), k.mat(WORLD.dark), g, bx + dx, 0.38, bz + dz);
  ([[-0.9, ORANGE], [0, TEAL], [0.9, VIOLET]] as const).forEach(([dx, c], i) => {
    const x = bx + dx;
    k.add(style.box(0.5, 0.04, 0.45, 0.01), k.mat(WORLD.dark), g, x, 0.825, bz);
    for (const sx of [-0.21, 0.21]) k.add(style.box(0.04, 0.5, 0.04, 0.01), k.mat(WORLD.dark), g, x + sx, 1.08, bz - 0.18);
    k.add(style.box(0.5, 0.04, 0.06, 0.01), k.mat(WORLD.dark), g, x, 1.33, bz - 0.18);
    k.add(style.box(0.1, 0.08, 0.08, 0.02), k.mat(METAL), g, x + 0.08 * (i - 1), 1.2, bz - 0.12);
    const h = 0.12 + 0.06 * i;
    k.add(style.box(0.16, h, 0.16, 0.03), k.mat(c), g, x, 0.835 + h / 2, bz);
  });
  // the drill press
  k.add(style.box(0.4, 0.06, 0.4, 0.02), k.mat(STEEL), g, 1.7, 0.04, -0.4);
  k.add(style.cylinder(0.04, 1.3), k.mat(METAL), g, 1.7, 0.68, -0.5);
  k.add(style.box(0.24, 0.04, 0.24, 0.01), k.mat(METAL), g, 1.7, 0.75, -0.35);
  k.add(style.box(0.26, 0.28, 0.4, 0.05), k.mat(TEAL), g, 1.7, 1.3, -0.38);
  stool(k, g, -1.2, 0.45, 0.63, WORLD.gold);
}

/** the two-post lift with the old yellow car up on it, the tool chest beside it */
function lift(k: Kit, g: Object3D): void {
  const { style } = k;
  const l = new Group();
  l.position.set(-0.5, 0, 0);
  g.add(l);
  const steel = k.mat(STEEL);
  for (const pz of [-0.75, 0.75]) {
    k.add(style.box(0.12, 2.2, 0.12), steel, l, 0, 1.1, pz);
    k.add(style.box(0.3, 0.05, 0.3), steel, l, 0, 0.035, pz);
    for (const ax of [-0.5, 0.5]) k.add(style.box(0.1, 0.06, 0.7), k.mat(METAL), l, ax, 1.02, pz * 0.53);
  }
  k.add(style.box(0.12, 0.1, 1.62), steel, l, 0, 2.24, 0);
  const yellow = k.mat(WORLD.gold);
  k.add(style.box(2.9, 0.38, 1.2, 0.14), yellow, l, 0, 1.25, 0);
  k.add(style.box(1.5, 0.36, 1.1, 0.12), yellow, l, -0.2, 1.6, 0);
  k.add(style.box(1.3, 0.22, 1.13, 0.05), k.mat(WORLD.glass), l, -0.2, 1.62, 0);
  for (const wx of [-0.95, 0.95]) {
    for (const wz of [-0.56, 0.56]) k.add(style.cylinder(0.24, 0.16), k.mat(WORLD.wheel), l, wx, 1.06, wz).rotation.x = Math.PI / 2;
  }
  for (const hz of [-0.4, 0.4]) k.add(style.ball(0.05), k.mat(WORLD.paper), l, 1.45, 1.3, hz);
  // the tool chest: its drawers' handles stand out of its front
  k.add(style.box(0.55, 0.95, 0.45, 0.04), k.mat(BLUE), g, 1.8, 0.475, -0.1);
  k.add(style.box(0.58, 0.04, 0.48, 0.01), steel, g, 1.8, 0.97, -0.1);
  for (let i = 0; i < 4; i++) k.add(style.box(0.45, 0.02, 0.04, 0.005), k.mat(WORLD.metal), g, 1.8, 0.2 + i * 0.2, 0.135);
}

/** pallet racking with boxes and crates, a pallet of boxes, a hand truck */
function racks(k: Kit, g: Object3D): void {
  const { style } = k;
  const z = -0.65;
  for (const x of [-1.6, 0, 1.6]) for (const dz of [-0.28, 0.28]) k.add(style.box(0.07, 1.8, 0.07, 0.01), k.mat(BLUE), g, x, 0.9, z + dz);
  [0.15, 0.8, 1.45].forEach((y, row) => {
    for (const dz of [-0.28, 0.28]) k.add(style.box(3.3, 0.06, 0.05, 0.01), k.mat(WORLD.orange), g, 0, y, z + dz);
    k.add(style.box(3.2, 0.03, 0.58, 0.005), k.mat(WORLD.metal), g, 0, y + 0.035, z);
    [-1.2, -0.4, 0.45, 1.2].forEach((x, i) => {
      if ((row * 4 + i) % 3 === 1) return;
      const h = 0.28 + ((row + i) % 3) * 0.07;
      k.add(style.box(0.55, h, 0.45, 0.03), k.mat((row + i) % 4 === 0 ? TEAL : WORLD.crate), g, x, y + 0.04 + h / 2, z);
    });
  });
  k.add(style.box(1.1, 0.12, 0.9, 0.02), k.mat(WOOD), g, 0.5, 0.07, 0.5);
  k.add(style.box(0.5, 0.42, 0.42, 0.03), k.mat(WORLD.crate), g, 0.25, 0.33, 0.3);
  k.add(style.box(0.45, 0.38, 0.4, 0.03), k.mat(WORLD.crate), g, 0.75, 0.31, 0.7);
  k.add(style.box(0.42, 0.32, 0.38, 0.03), k.mat(WORLD.tape), g, 0.27, 0.69, 0.32);
  // the hand truck
  for (const x of [-1.32, -1.08]) k.add(style.box(0.05, 1.1, 0.05, 0.01), k.mat(WORLD.orange), g, x, 0.6, 0.6);
  k.add(style.box(0.4, 0.04, 0.25, 0.01), k.mat(METAL), g, -1.2, 0.04, 0.45);
  for (const x of [-1.38, -1.02]) k.add(style.cylinder(0.1, 0.05), k.mat(WORLD.wheel), g, x, 0.1, 0.66).rotation.z = Math.PI / 2;
}

/** a motorbike on its stand, a stack of tyres, a plant */
function moto(k: Kit, g: Object3D): void {
  const { style } = k;
  for (const wx of [-0.66, 0.66]) k.add(style.cylinder(0.32, 0.1), k.mat(WORLD.wheel), g, wx, 0.33, 0).rotation.x = Math.PI / 2;
  k.add(style.box(0.4, 0.3, 0.25, 0.05), k.mat(STEEL), g, 0, 0.45, 0);
  k.add(style.box(0.9, 0.28, 0.28, 0.1), k.mat(TEAL), g, 0, 0.72, 0);
  k.add(style.box(0.5, 0.1, 0.3, 0.04), k.mat(WORLD.dark), g, -0.3, 0.88, 0);
  k.add(style.box(0.06, 0.56, 0.06, 0.01), k.mat(METAL), g, 0.6, 0.62, 0);
  k.add(style.box(0.06, 0.06, 0.7, 0.01), k.mat(WORLD.dark), g, 0.58, 0.9, 0);
  k.add(style.ball(0.06), k.mat(WORLD.paper), g, 0.68, 0.8, 0);
  k.add(style.ball(0.04), k.mat(ORANGE), g, -0.62, 0.78, 0);
  k.add(style.box(0.05, 0.3, 0.6, 0.01), k.mat(WORLD.dark), g, -0.66, 0.15, 0);
  for (let i = 0; i < 4; i++) k.add(style.cylinder(0.34, 0.19), k.mat(WORLD.wheel), g, 1.6, 0.105 + i * 0.2, 0);
  plant(k, g, -1.6, 0, 0.3);
}

const DRAW: Readonly<Record<CornerKind, (k: Kit, g: Object3D) => void>> = { lounge, band, maker, lift, racks, moto };

/** corner i, its meshes tagged with it (userData.corner: the clip law reads them) */
export function corner(k: Kit, root: Object3D, c: Corner, i: number): Group {
  const g = new Group();
  g.name = `corner ${c.kind}`;
  g.position.set(c.x, 0, c.z);
  root.add(g);
  DRAW[c.kind](k, g);
  g.traverse((m) => tag(m, i));
  return g;
}
