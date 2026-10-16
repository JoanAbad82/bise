// The room (three): the floating grass block, the floor, the back and left walls (the near ones are
// cut away so the camera sees in), the lounge, the whiteboard, main's desk and its neon, the kitchen
// island, one desk per agent from the Office, the door and the terrace. Built once per office and
// theme; what changes per frame (a desk's screen and lamp) is handed back as handles. No text, no
// texture but the floor tile, never the accent pink or the error red (palette.ts).
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
import type { Office, Spot } from '../model';
import { siteOf } from './camera';
import { type Palette, WORLD, hash, rng, HOODIE } from './palette';
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
  dispose(): void;
}

interface Kit {
  readonly style: Style;
  readonly pal: Palette;
  /** a shared material per colour (bims have their own: they fade and go grey) */
  mat(color: string): Material;
  add(geo: BufferGeometry, mat: Material, parent: Object3D, x: number, y: number, z: number): Mesh;
}

function kitOf(style: Style, pal: Palette): Kit {
  const cache = new Map<string, Material>();
  return {
    style,
    pal,
    mat(color) {
      let m = cache.get(color);
      if (!m) { m = style.material(color); cache.set(color, m); }
      return m;
    },
    add(geo, mat, parent, x, y, z) {
      const m = new Mesh(geo, mat);
      m.position.set(x, y, z);
      parent.add(m);
      return m;
    },
  };
}

/** main's desk sits this far ahead of its chair (layout.ts furniture: main can walk behind the chair) */
const MAIN_DZ = 0.6;

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

function deskLamp(k: Kit, parent: Object3D, x: number, z: number): MeshLambertMaterial {
  const { style, pal } = k;
  k.add(style.box(0.16, 0.03, 0.16), k.mat(pal.ink), parent, x, 0.565, z);
  k.add(style.box(0.03, 0.3, 0.03), k.mat(pal.ink), parent, x, 0.72, z);
  k.add(style.box(0.16, 0.07, 0.12), k.mat(WORLD.dark), parent, x - 0.05, 0.88, z);
  const bulb = style.material(pal.lampOn, { emissive: pal.lampOn, ei: LAMP_ON_EI(pal) }) as MeshLambertMaterial;
  k.add(style.box(0.1, 0.025, 0.07), bulb, parent, x - 0.05, 0.84, z);
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

/** one agent's desk: the spot is where it sits, the desk in front of it (its way, +z when face is 0) */
function desk(k: Kit, parent: Object3D, d: Spot, name: string): DeskHandles {
  const { style, pal } = k;
  const h = hash(name);
  const g = new Group();
  g.position.set(d.x, 0, d.z);
  g.rotation.y = d.face;
  parent.add(g);
  k.add(style.box(1.5, 0.5, 0.7), k.mat(pal.desk), g, 0, 0.25, 0.5);
  k.add(style.box(1.6, 0.06, 0.78), k.mat(pal.deskTop), g, 0, 0.52, 0.5);
  // a small plate without text, in the colour of its bim's hoodie (spec §2)
  k.add(style.box(0.22, 0.08, 0.02), k.mat(HOODIE[h % HOODIE.length] ?? pal.desk), g, -0.5, 0.4, 0.86);
  const screen = laptop(k, g, 0, 0.47);
  const lamp = deskLamp(k, g, 0.62, 0.72);
  chair(k, g, 0, -0.05, HOODIE[(h >> 5) % HOODIE.length] ?? pal.desk, 0);
  if (h % 3 === 0) k.add(style.cylinder(0.06, 0.12), k.mat(WORLD.paper), g, 0.42, 0.61, 0.3);
  if (h % 4 === 1) {
    k.add(style.cylinder(0.08, 0.12), k.mat(WORLD.pot), g, -0.55, 0.61, 0.4);
    k.add(style.ball(0.12), k.mat(pal.plant), g, -0.55, 0.76, 0.4);
  }
  if (h % 5 === 2) k.add(style.ball(0.07), k.mat(WORLD.orange), g, 0.4, 0.62, 0.62);
  const c = Math.cos(d.face);
  const s = Math.sin(d.face);
  return { screen, lamp, top: { x: d.x + 0.5 * s, y: 0.55, z: d.z + 0.5 * c } };
}

function tree(k: Kit, parent: Object3D, x: number, z: number): void {
  const { style } = k;
  k.add(style.box(0.36, 1.4, 0.36), k.mat(WORLD.trunk), parent, x, 0.7, z);
  const leaves: readonly [number, number, number][] = [[0, 1.6, 0], [0.45, 1.5, 0], [-0.45, 1.5, 0], [0, 2.05, 0], [0, 1.6, 0.45]];
  leaves.forEach(([dx, y, dz], i) => k.add(style.box(0.75, 0.75, 0.75), k.mat(WORLD.leaf[i % 2] ?? WORLD.trunk), parent, x + dx, y, z + dz));
}

function bigPlant(k: Kit, parent: Object3D, x: number, z: number): void {
  k.add(k.style.cylinder(0.2, 0.36), k.mat(WORLD.pot), parent, x, 0.18, z);
  for (let i = 0; i < 3; i++) {
    const l = k.add(k.style.ball(0.26 - i * 0.04), k.mat(i % 2 ? WORLD.leaf[0] : k.pal.plant), parent, x + (i - 1) * 0.12, 0.55 + i * 0.22, z + (i % 2) * 0.08);
    l.scale.y = 1.2;
  }
}

function pineapple(k: Kit, parent: Object3D, x: number, y: number, z: number): void {
  const b = k.add(k.style.ball(0.11), k.mat(WORLD.pineapple), parent, x, y + 0.1, z);
  b.scale.y = 1.45;
  k.add(k.style.box(0.08, 0.16, 0.08), k.mat(WORLD.pineLeaf), parent, x, y + 0.3, z);
}

function fruitBowl(k: Kit, parent: Object3D, x: number, z: number): void {
  k.add(k.style.box(0.5, 0.12, 0.5), k.mat(WORLD.paper), parent, x, 0.76, z);
  const fr = [WORLD.orange, WORLD.orange, WORLD.banana, WORLD.leaf[0]];
  fr.forEach((c, i) => k.add(k.style.ball(0.09), k.mat(c), parent, x + Math.cos(i * 1.7) * 0.13, 0.86, z + Math.sin(i * 1.7) * 0.12));
  pineapple(k, parent, x + 0.05, 0.84, z - 0.02);
}

/** the whiteboard: coloured strokes for the equations (no text) */
function whiteboard(k: Kit, parent: Object3D, x: number): void {
  const { style } = k;
  k.add(style.box(1.8, 0.95, 0.05), k.mat('#d8d2c6'), parent, x, 1.05, 0.02);
  k.add(style.box(1.7, 0.85, 0.02), k.mat(WORLD.paper), parent, x, 1.05, 0.05);
  const r = rng(hash('board'));
  for (let i = 0; i < 5; i++) {
    const w = 0.5 + r() * 0.7;
    const c = WORLD.board[i % WORLD.board.length] ?? WORLD.marker;
    k.add(style.box(w, 0.045, 0.01), k.mat(c), parent, x - 0.78 + w / 2 + (i % 2) * 0.08, 1.37 - i * 0.15, 0.065);
  }
  // a little rising chart in the corner
  const pts = [[0.45, 0.72], [0.55, 0.88], [0.65, 0.8], [0.75, 1.02]];
  for (const [px, py] of pts) k.add(style.box(0.06, 0.06, 0.01), k.mat(WORLD.mat), parent, x + (px ?? 0), py ?? 0, 0.065);
}

/** the mural over the lounge: colour blobs and an ink :* in blocks */
function mural(k: Kit, parent: Object3D, x0: number, x1: number): void {
  const { style } = k;
  const w = x1 - x0;
  WORLD.mural.forEach((c, i) => {
    const bw = w / 4;
    k.add(style.box(bw, 0.45 + (i % 2) * 0.12, 0.02), k.mat(c), parent, x0 + bw / 2 + (i * (w - bw)) / 4, 1.15 + (i % 2 ? -0.06 : 0.08), 0.01);
  });
  glyph(k, parent, (x0 + x1) / 2, 1.18, 0.035, k.pal.ink, 0.07);
}

/** the :* in blocks: two dots and a three-bar star */
function glyph(k: Kit, parent: Object3D, x: number, y: number, z: number, color: string, u: number, m?: Material): void {
  const mat = m ?? k.mat(color);
  k.add(k.style.box(u, u, 0.02), mat, parent, x - 2.2 * u, y + 1.1 * u, z);
  k.add(k.style.box(u, u, 0.02), mat, parent, x - 2.2 * u, y - 1.1 * u, z);
  for (let i = 0; i < 3; i++) {
    const bar = k.add(k.style.box(3.4 * u, 0.8 * u, 0.02), mat, parent, x + 1.2 * u, y, z);
    bar.rotation.z = (i * Math.PI) / 3 + Math.PI / 2;
  }
}

function terrace(k: Kit, parent: Object3D, o: Office): void {
  const { style, pal } = k;
  const { x0, W, D } = o;
  k.add(style.box(W - 0.4, 0.08, 3.6), k.mat(pal.terrace), parent, 0 + x0 + W / 2, 0, D + 2.0);
  const px = x0 + W - 1.1;
  const pz = D + 1.6;
  k.add(style.cylinder(0.03, 1.8), k.mat(pal.ink), parent, px, 0.9, pz);
  k.add(style.box(1.4, 0.3, 1.4), k.mat(WORLD.parasol), parent, px, 1.85, pz);
  o.terrace.forEach((t, i) => {
    k.add(style.box(0.5, 0.08, 0.95), k.mat(WORLD.chair[i % 2] ?? WORLD.paper), parent, t.x, 0.2, t.z + 0.05);
  });
  // the palm and the mini ramp
  const palmX = x0 + W - 0.45;
  const palmZ = D + 3.2;
  k.add(style.box(0.16, 1.6, 0.16), k.mat(WORLD.palmTrunk), parent, palmX, 0.8, palmZ);
  for (let i = 0; i < 4; i++) {
    const f = k.add(style.box(0.9, 0.04, 0.22), k.mat(WORLD.leaf[0]), parent, palmX, 1.62, palmZ);
    f.rotation.y = (i * Math.PI) / 2 + 0.4;
  }
  k.add(style.box(1.2, 0.3, 0.7), k.mat(WORLD.ramp), parent, x0 + W - 1.6, 0.15, D + 3.1);
}

export function buildWorld(o: Office, mainName: string, style: Style, pal: Palette): World {
  const k = kitOf(style, pal);
  const root = new Group();
  const { x0, W, D } = o;
  const cx = x0 + W / 2;

  root.add(new HemisphereLight(pal.hemi[0], pal.hemi[1], pal.hemi[2]));
  const sun = new DirectionalLight(pal.sun[0], pal.sun[1]);
  sun.position.set(cx - 5, 14, 3);
  sun.target.position.set(cx, 0, D / 2);
  root.add(sun, sun.target);

  // the floating grass block, its trees on the far sides (left and back) so nothing hides the office
  const site = siteOf(o);
  const gw = site.x1 - site.x0;
  const gd = site.z1 - site.z0;
  const gz = (site.z0 + site.z1) / 2;
  k.add(style.box(gw, 1.2, gd), k.mat(pal.dirt), root, cx, -0.75, gz);
  k.add(style.box(gw, 0.16, gd), k.mat(pal.grass), root, cx, -0.1, gz);
  const r = rng(hash(`trees${W}`));
  for (const [tx, tz] of [[x0 - 0.7, 1.0], [x0 - 0.7, D * 0.45], [x0 - 0.7, D * 0.85], [x0 + W * 0.3, -0.85], [x0 + W * 0.75, -0.85]] as const) tree(k, root, tx, tz);
  for (let i = 0; i < 10; i++) {
    const fx = r() < 0.5 ? x0 - 0.35 - r() * 0.6 : x0 + W + 0.35 + r() * 0.6;
    k.add(style.box(0.16, 0.16, 0.16), k.mat(WORLD.flowers[i % 4] ?? WORLD.paper), root, fx, 0.06, r() * (D + 3));
  }

  terrace(k, root, o);
  const floor = new Mesh(style.box(W, 0.14, D), style.floor(pal.floor, W, D));
  floor.position.set(cx, -0.05, D / 2);
  root.add(floor);
  // the rug under the island
  const isl = o.island;
  k.add(style.box(isl.w + 1.6, 0.02, isl.z1 - isl.z0 + 1.2), k.mat(pal.islandRug), root, 0, 0.03, (isl.z0 + isl.z1) / 2);

  // walls: back (tall: the mural, the whiteboard, the neon) and left (low, windows); the near ones cut away
  const wallH = 1.7;
  k.add(style.box(W + 0.2, wallH, 0.2), k.mat(pal.wall), root, cx, wallH / 2, -0.1);
  k.add(style.box(0.2, 1.0, D + 0.2), k.mat(pal.wall), root, x0 - 0.1, 0.5, D / 2);
  const glass = style.material(pal.window, { emissive: pal.window, ei: pal.pendants ? 0.4 : 0 });
  for (let z = (o.desks.size > 0 ? Math.min(...[...o.desks.values()].map((d) => d.z)) : 4.3) + 0.1; z < D - 1; z += 2.3) {
    k.add(style.box(0.05, 0.45, 1.2), glass, root, x0, 0.62, z + 0.6);
  }

  // the lounge: its rug, the bean bags, a plant at each end of the back wall
  const lx = o.lounge.map((s) => s.x);
  const lz = o.lounge.map((s) => s.z);
  const l0 = lx.length ? Math.min(...lx) - 0.55 : x0 + 0.1;
  const l1 = lx.length ? Math.max(...lx) + 0.55 : x0 + W * 0.4;
  if (lx.length) {
    k.add(style.box(l1 - l0, 0.02, Math.max(...lz) - Math.min(...lz) + 1.1), k.mat(pal.rug), root, (l0 + l1) / 2, 0.035, (Math.min(...lz) + Math.max(...lz)) / 2);
  }
  o.lounge.slice(0, 8).forEach((p, i) => {
    const b = k.add(style.ball(0.34), k.mat(WORLD.bean[i % WORLD.bean.length] ?? pal.rug), root, p.x, 0.2, p.z - 0.05);
    b.scale.set(1.05, 0.62, 1.05);
  });
  mural(k, root, l0 + 0.15, l1 - 0.15);
  bigPlant(k, root, x0 + 0.35, 3.5);
  bigPlant(k, root, x0 + W - 0.35, 3.5);

  // the whiteboard, centred on its spots
  const bx = o.boardSpots.length ? o.boardSpots.reduce((s, p) => s + p.x, 0) / o.boardSpots.length : cx;
  whiteboard(k, root, bx);

  // main's desk: bigger, a tray, the neon :* behind it
  const md = o.mainDesk;
  const mg = new Group();
  mg.position.set(md.x, 0, md.z);
  mg.rotation.y = md.face;
  root.add(mg);
  k.add(style.box(2.2, 0.5, 0.9), k.mat(pal.desk), mg, 0, 0.25, MAIN_DZ);
  k.add(style.box(2.3, 0.06, 1.0), k.mat(pal.deskTop), mg, 0, 0.52, MAIN_DZ);
  const mainScreen = laptop(k, mg, 0.2, MAIN_DZ - 0.03);
  const mainLamp = deskLamp(k, mg, 0.95, MAIN_DZ + 0.3);
  k.add(style.box(0.7, 0.06, 0.5), k.mat(pal.wallTop), mg, -0.65, 0.58, MAIN_DZ);
  k.add(style.box(0.34, 0.24, 0.26), k.mat(WORLD.crate), mg, -0.65, 0.73, MAIN_DZ);
  chair(k, mg, 0, -0.15, WORLD.dark, 0);
  const neon = style.material(pal.neon, { flat: true });
  glyph(k, root, md.x, 1.25, 0.02, pal.neon, 0.06, neon);

  // the kitchen island: its base, its top, a coffee machine, fruit, a boombox
  const iz = (isl.z0 + isl.z1) / 2;
  const il = isl.z1 - isl.z0;
  k.add(style.box(isl.w - 0.1, 0.62, il), k.mat(pal.island), root, 0, 0.31, iz);
  k.add(style.box(isl.w + 0.1, 0.07, il + 0.15), k.mat(pal.islandTop), root, 0, 0.66, iz);
  k.add(style.box(0.5, 0.5, 0.42), k.mat(WORLD.coffee), root, 0, 0.95, isl.z0 + 0.35);
  k.add(style.box(0.18, 0.06, 0.04), style.material(WORLD.coffeeLed, { emissive: WORLD.coffeeLed, ei: 0.5 }), root, 0, 1.07, isl.z0 + 0.57);
  fruitBowl(k, root, 0, isl.z0 + 1.3);
  if (il > 3) fruitBowl(k, root, 0, isl.z0 + 2.9);
  if (il > 4.5) {
    k.add(style.box(0.55, 0.28, 0.2), k.mat(WORLD.dark), root, 0, 0.84, isl.z1 - 0.6);
    for (const dx of [-0.15, 0.15]) k.add(style.box(0.14, 0.14, 0.02), k.mat(WORLD.wheel), root, dx, 0.84, isl.z1 - 0.49);
  }
  if (pal.pendants) {
    for (let z = isl.z0 + 0.9; z < isl.z1; z += 1.8) {
      const l = new PointLight('#ffcf8a', 3.2, 4.5, 1.6);
      l.position.set(0, 1.5, z);
      root.add(l);
    }
  }

  // the desks
  const desks = new Map<string, DeskHandles>();
  for (const [name, d] of o.desks) desks.set(name, desk(k, root, d, name));
  const mainDesk: DeskHandles = { screen: mainScreen, lamp: mainLamp, top: { x: md.x, y: 0.55, z: md.z + MAIN_DZ } };
  desks.set(mainName, mainDesk);

  // the door mat
  k.add(style.box(1.1, 0.04, 0.5), k.mat(WORLD.mat), root, o.door.x, 0.03, D - 0.15);

  return {
    root,
    desks,
    mainDesk,
    pal,
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
  h.lamp.emissiveIntensity = lamp ? LAMP_ON_EI(pal) : 0;
  h.lamp.color.set(lamp ? pal.lampOn : WORLD.dark);
}
