// The look's one seam (bims-lead m_27571): materials, the shape of round things, shadows and pixel
// ratio come from a Style; world.ts, bim.ts and plane.ts only ask it. Today one style, 'iso' (the
// prototype's v4 pick: flat colours, one tone per face, plain blocks, no shadows, no textures but a
// light floor tile). Another look (clay) is a second Style here, nothing else changes.
import {
  BoxGeometry,
  CanvasTexture,
  Color,
  type BufferGeometry,
  type Material,
  MeshBasicMaterial,
  MeshLambertMaterial,
  NearestFilter,
  RepeatWrapping,
  SRGBColorSpace,
} from 'three';

export interface MatOpts {
  /** a glow of that colour (screens, lamps, the neon) */
  readonly emissive?: string;
  readonly ei?: number;
  /** fades: the material is transparent from the start, at that opacity */
  readonly opacity?: number;
  /** unlit (the neon, the plane's paper): its colour whatever the light */
  readonly flat?: boolean;
}

export interface Style {
  readonly name: 'iso';
  readonly shadows: boolean;
  /** the canvas's device pixel ratio cap */
  readonly maxPixelRatio: number;
  material(color: string, o?: MatOpts): Material;
  /** the floor: a light two-tone tile, one tile per office unit, over a w x d floor */
  floor(color: string, w: number, d: number): Material;
  box(w: number, h: number, d: number): BufferGeometry;
  /** a ball (a head, a fruit, a bean bag): a cube in iso */
  ball(r: number): BufferGeometry;
  /** a ball's top part, from its top down to `frac` of its height (a cap, hair, a bowl) */
  cap(r: number, frac: number): BufferGeometry;
  /** a rounded limb or torso, r its radius, l its straight length */
  capsule(r: number, l: number): BufferGeometry;
  cylinder(r: number, h: number): BufferGeometry;
}

const B = (w: number, h: number, d: number): BufferGeometry =>
  new BoxGeometry(Math.max(0.01, w), Math.max(0.01, h), Math.max(0.01, d));

function tile(color: string): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 2;
  const g = c.getContext('2d');
  const base = new Color(color);
  if (g) {
    for (let i = 0; i < 4; i++) {
      g.fillStyle = '#' + base.clone().multiplyScalar(i === 0 || i === 3 ? 1 : 0.955).getHexString();
      g.fillRect(i % 2, i >> 1, 1, 1);
    }
  }
  const t = new CanvasTexture(c);
  t.magFilter = t.minFilter = NearestFilter;
  t.generateMipmaps = false;
  t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = RepeatWrapping;
  return t;
}

export const ISO: Style = {
  name: 'iso',
  shadows: false,
  maxPixelRatio: 2,
  material(color, o = {}) {
    const transparent = o.opacity !== undefined;
    if (o.flat) return new MeshBasicMaterial({ color: new Color(color), transparent, opacity: o.opacity ?? 1 });
    return new MeshLambertMaterial({
      color: new Color(color),
      emissive: new Color(o.emissive ?? '#000000'),
      emissiveIntensity: o.ei ?? (o.emissive ? 1 : 0),
      transparent,
      opacity: o.opacity ?? 1,
    });
  },
  floor(color, w, d) {
    const map = tile(color);
    map.repeat.set(w / 2, d / 2);
    return new MeshLambertMaterial({ color: 0xffffff, map });
  },
  box: B,
  ball: (r) => B(2 * r * 0.92, 2 * r * 0.92, 2 * r * 0.92),
  cap(r, frac) {
    const h = 2 * r * frac;
    const g = B(2 * r * 0.98, h, 2 * r * 0.98);
    g.translate(0, r - h / 2, 0);
    return g;
  },
  capsule: (r, l) => B(2 * r, l + 2 * r, 2 * r),
  cylinder: (r, h) => B(2 * r, h, 2 * r),
};

export const STYLE: Style = ISO;
