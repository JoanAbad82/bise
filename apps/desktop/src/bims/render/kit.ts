// The builders' kit (three): a shared material per colour and a mesh placed in its parent, plus the
// small shapes the room and its stages share (a box on the floor, the :* glyph). world.ts builds the
// room with it, stages.ts what the project's growth adds. Split out of world.ts (bims-grow). Its night
// glows (glow, light: a lantern, a pendant's light) are registered, so the sky can fade them in and
// out in either theme (bims-sky, bims m_33351: lit(level)).
import { type BufferGeometry, type Material, Mesh, type MeshStandardMaterial, type Object3D, type PointLight } from 'three';
import type { Box } from '../model';
import type { Foot } from './decor';
import type { Palette } from './palette';
import type { Style } from './style';

export interface Kit {
  readonly style: Style;
  readonly pal: Palette;
  /** a shared material per colour (bims have their own: they fade and go grey) */
  mat(color: string): Material;
  add(geo: BufferGeometry, mat: Material, parent: Object3D, x: number, y: number, z: number): Mesh;
  /**
   * A material that glows at night (a lantern, a lamp's shade, coals): `emissive` its glow (the
   * colour's own when absent), `night` its strength lit, `day` by day (0: none). Built at the theme's
   * level (the dark one lit); lit() sets it later.
   */
  glow(color: string, o: { readonly night: number; readonly day?: number; readonly emissive?: string }): Material;
  /** a light that shines at night only (a pendant, a street lamp): its strength lit; built at the theme's level */
  light(l: PointLight): PointLight;
  /** every glow and night light at this level, 0 day .. 1 night (they fade, never pop) */
  lit(level: number): void;
}

export function kitOf(style: Style, pal: Palette): Kit {
  const cache = new Map<string, Material>();
  const glows: { m: MeshStandardMaterial; day: number; night: number }[] = [];
  const lights: { l: PointLight; i: number }[] = [];
  const level0 = pal.pendants ? 1 : 0;
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
    glow(color, o) {
      const day = o.day ?? 0;
      const m = style.material(color, { emissive: o.emissive ?? color, ei: day + (o.night - day) * level0 }) as MeshStandardMaterial;
      // a glow is never merged away (merge.ts keeps a lit material's own)
      m.userData.live = true;
      glows.push({ m, day, night: o.night });
      return m;
    },
    light(l) {
      lights.push({ l, i: l.intensity });
      l.intensity *= level0;
      return l;
    },
    lit(level) {
      for (const g of glows) g.m.emissiveIntensity = g.day + (g.night - g.day) * level;
      for (const x of lights) x.l.intensity = x.i * level;
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
