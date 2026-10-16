// The office's own easter eggs in three (eggs.ts OfficeEggs says which show): t3's little ghost
// crossing at midnight (night theme), s2's christmas tree in the lounge, s4's cake on the island,
// o4's game on the whiteboard (a noughts and crosses grid over the equations). Built once per
// office, hidden until an egg shows them; nothing here decides. The eclipse is index.ts's sky.
// Colours: the palette's (never the app's pink or red). Owner: bims-follow.
import { Group, Mesh, type BufferGeometry, type Material, type Object3D } from 'three';
import type { Office } from '../model';
import type { OfficeEggs } from '../eggs';
import { WORLD } from './palette';
import type { Style } from './style';

export interface EggDecor {
  readonly root: Group;
  /** show what the eggs say now; the ghost walks its way 0..1. True while something moves (the ghost) */
  update(e: OfficeEggs | undefined): boolean;
  dispose(): void;
}

export function makeEggDecor(o: Office, style: Style): EggDecor {
  const root = new Group();
  const mats: Material[] = [];
  const mat = (c: string, glow = 0): Material => {
    const m = style.material(c, glow > 0 ? { emissive: c, ei: glow } : {});
    mats.push(m);
    return m;
  };
  const add = (geo: BufferGeometry, m: Material, parent: Object3D, x: number, y: number, z: number): Mesh => {
    const mesh = new Mesh(geo, m);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };

  // t3: a small white ghost, a smile, crossing the office from left to right at head height
  const ghost = new Group();
  const sheet = mat(WORLD.paper, 0.35);
  add(style.capsule(0.22, 0.3), sheet, ghost, 0, 0, 0);
  add(style.ball(0.035), mat(WORLD.ink), ghost, -0.08, 0.12, 0.2);
  add(style.ball(0.035), mat(WORLD.ink), ghost, 0.08, 0.12, 0.2);
  ghost.visible = false;
  root.add(ghost);

  // s2: the tree in the lounge's middle, three cones of leaves and a gold star
  const lounge = o.lounge.length ? o.lounge : [o.mainDesk];
  const lx = lounge.reduce((s, p) => s + p.x, 0) / lounge.length;
  const lz = lounge.reduce((s, p) => s + p.z, 0) / lounge.length;
  const tree = new Group();
  const leaf = mat(WORLD.pineLeaf);
  add(style.cylinder(0.06, 0.25), mat(WORLD.crate), tree, 0, 0.12, 0);
  for (const [i, r] of [0.42, 0.32, 0.22].entries()) add(style.cylinder(r, 0.3), leaf, tree, 0, 0.35 + i * 0.25, 0).scale.set(1, 1, 1);
  add(style.ball(0.07), mat(WORLD.gold, 0.6), tree, 0, 1.2, 0);
  tree.position.set(lx, 0, lz - 0.6);
  tree.visible = false;
  root.add(tree);

  // s4: the cake on the island's top, near its back end
  const cake = new Group();
  add(style.cylinder(0.26, 0.18), mat(WORLD.paper), cake, 0, 0.09, 0);
  add(style.cylinder(0.27, 0.04), mat(WORLD.pineapple), cake, 0, 0.2, 0);
  add(style.cylinder(0.015, 0.1), mat(WORLD.paper), cake, 0, 0.27, 0);
  add(style.ball(0.025), mat(WORLD.gold, 0.8), cake, 0, 0.34, 0);
  cake.position.set(0, 0.66, o.island.z1 - 0.5);
  cake.visible = false;
  root.add(cake);

  // o4: a noughts and crosses grid on the whiteboard, over its equations
  const board = new Group();
  const bx = o.boardSpots.length ? o.boardSpots.reduce((s, p) => s + p.x, 0) / o.boardSpots.length : 0;
  const z = 0.08 + style.pictureZ;
  add(style.box(1.7, 0.85, 0.01), mat(WORLD.paper), board, bx, 1.05, z - 0.005);
  const ink = mat(WORLD.marker);
  for (const dx of [-0.13, 0.13]) add(style.box(0.025, 0.7, 0.01), ink, board, bx + dx, 1.05, z);
  for (const dy of [-0.12, 0.12]) add(style.box(0.75, 0.025, 0.01), ink, board, bx, 1.05 + dy, z);
  const cross = mat(WORLD.board[0]);
  for (const [cx, cy] of [[-0.26, 0.24], [0, 0], [0.26, -0.24]] as const) {
    add(style.box(0.16, 0.025, 0.01), cross, board, bx + cx, 1.05 + cy, z + 0.003).rotation.z = Math.PI / 4;
    add(style.box(0.16, 0.025, 0.01), cross, board, bx + cx, 1.05 + cy, z + 0.003).rotation.z = -Math.PI / 4;
  }
  board.visible = false;
  root.add(board);

  const x0 = o.x0 - 0.5;
  const x1 = o.x0 + o.W + 0.5;
  const gz = (o.island.z0 + o.island.z1) / 2;
  return {
    root,
    update(e) {
      const g = e?.ghost ?? null;
      ghost.visible = g !== null;
      if (g !== null) ghost.position.set(x0 + (x1 - x0) * g, 1.7 + Math.sin(g * Math.PI * 6) * 0.08, gz);
      tree.visible = e?.tree === true;
      cake.visible = e?.cake === true;
      board.visible = e?.doodle === true;
      return g !== null;
    },
    dispose() {
      root.traverse((x) => {
        if (x instanceof Mesh) (x.geometry as BufferGeometry).dispose();
      });
      for (const m of mats) m.dispose();
    },
  };
}
