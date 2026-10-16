// The builders' kit (three): a shared material per colour and a mesh placed in its parent, plus the
// small shapes the room and its stages share (a box on the floor, the :* glyph). world.ts builds the
// room with it, stages.ts what the project's growth adds. Split out of world.ts (bims-grow).
import { type BufferGeometry, type Material, Mesh, type Object3D } from 'three';
import type { Box } from '../layout';
import type { Foot } from './decor';
import type { Palette } from './palette';
import type { Style } from './style';

export interface Kit {
  readonly style: Style;
  readonly pal: Palette;
  /** a shared material per colour (bims have their own: they fade and go grey) */
  mat(color: string): Material;
  add(geo: BufferGeometry, mat: Material, parent: Object3D, x: number, y: number, z: number): Mesh;
}

export function kitOf(style: Style, pal: Palette): Kit {
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

/** the :* in blocks: two dots and a three-bar star */
export function glyph(k: Kit, parent: Object3D, x: number, y: number, z: number, color: string, u: number, m?: Material): void {
  const mat = m ?? k.mat(color);
  k.add(k.style.box(u, u, 0.02), mat, parent, x - 2.2 * u, y + 1.1 * u, z);
  k.add(k.style.box(u, u, 0.02), mat, parent, x - 2.2 * u, y - 1.1 * u, z);
  for (let i = 0; i < 3; i++) {
    const bar = k.add(k.style.box(3.4 * u, 0.8 * u, 0.02), mat, parent, x + 1.2 * u, y, z);
    bar.rotation.z = (i * Math.PI) / 3 + Math.PI / 2;
  }
}

/** a box on the floor from a footprint or a furniture box */
export function onFloor(k: Kit, parent: Object3D, b: Box, h: number, y: number, color: string): Mesh {
  return k.add(k.style.box(b.x1 - b.x0, h, b.z1 - b.z0), k.mat(color), parent, (b.x0 + b.x1) / 2, y, (b.z0 + b.z1) / 2);
}

export const boxOf = (f: Foot): Box => ({ x0: f.x - f.hw, x1: f.x + f.hw, z0: f.z - f.hd, z1: f.z + f.hd });
