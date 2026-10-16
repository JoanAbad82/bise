// The look's one seam (bims-lead m_27571): materials, the shape of round things, shadows and pixel
// ratio come from a Style; world.ts, bim.ts and plane.ts only ask it. Two styles: 'clay' (his pick,
// bims m_27814: the default; soft matte materials, rounded boxes, spheres and capsules, one soft
// shadow, plank lines on the floor) and 'iso' (the prototype's v4: flat colours, one tone per face,
// plain blocks, no shadows, a light floor tile). Layout, camera, paths, labels and the loop budget
// are the same for both.
import {
  BoxGeometry,
  CanvasTexture,
  CapsuleGeometry,
  Color,
  CylinderGeometry,
  ExtrudeGeometry,
  LinearFilter,
  type BufferGeometry,
  type Material,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshStandardMaterial,
  NearestFilter,
  RepeatWrapping,
  Shape,
  SphereGeometry,
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
  readonly name: 'iso' | 'clay';
  readonly shadows: boolean;
  /** the canvas's antialias (clay's round edges want it) */
  readonly antialias: boolean;
  /** how far the back wall's pictures (mural, whiteboard, neon) stand out of it: a rounded wall would swallow them */
  readonly pictureZ: number;
  /** the canvas's device pixel ratio cap */
  readonly maxPixelRatio: number;
  material(color: string, o?: MatOpts): Material;
  /** the floor: a light two-tone tile, one tile per office unit, over a w x d floor */
  floor(color: string, w: number, d: number): Material;
  /** a block; `r` its corner radius in clay (default: min(w, h, d) × 0.22), ignored in iso */
  box(w: number, h: number, d: number, r?: number): BufferGeometry;
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
  antialias: true,
  pictureZ: 0,
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
  box: (w, h, d) => B(w, h, d),
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

/** the clay floor: light plank lines along x, one plank every half unit */
function planks(color: string): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 32;
  const g = c.getContext('2d');
  const base = new Color(color);
  if (g) {
    g.fillStyle = '#' + base.getHexString();
    g.fillRect(0, 0, 4, 32);
    g.fillStyle = '#' + base.clone().multiplyScalar(0.93).getHexString();
    g.fillRect(0, 0, 4, 1);
  }
  const t = new CanvasTexture(c);
  t.magFilter = t.minFilter = LinearFilter;
  t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = RepeatWrapping;
  return t;
}

/** a box with rounded edges (the prototype's roundBox): a rounded rect extruded with a 3-step bevel */
function roundBox(w: number, h: number, d: number, r0: number): BufferGeometry {
  const r = Math.max(0.004, Math.min(r0, w / 2 - 0.001, d / 2 - 0.001, h / 2));
  const s = new Shape();
  const x = -w / 2;
  const y = -d / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + d - r);
  s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
  s.lineTo(x + r, y + d);
  s.quadraticCurveTo(x, y + d, x, y + d - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  const g = new ExtrudeGeometry(s, { depth: Math.max(0.01, h - r), bevelEnabled: true, bevelThickness: r / 2, bevelSize: r * 0.4, bevelSegments: 3, curveSegments: 6 });
  g.rotateX(-Math.PI / 2);
  g.translate(0, -h / 2 + r / 4, 0);
  g.computeVertexNormals();
  return g;
}

const SEG = 20;

export const CLAY: Style = {
  name: 'clay',
  shadows: true,
  antialias: true,
  pictureZ: 0.09,
  maxPixelRatio: 2,
  material(color, o = {}) {
    const transparent = o.opacity !== undefined;
    if (o.flat) return new MeshBasicMaterial({ color: new Color(color), transparent, opacity: o.opacity ?? 1 });
    return new MeshStandardMaterial({
      color: new Color(color),
      roughness: 0.95,
      metalness: 0,
      emissive: new Color(o.emissive ?? '#000000'),
      emissiveIntensity: o.ei ?? (o.emissive ? 1 : 0),
      transparent,
      opacity: o.opacity ?? 1,
    });
  },
  floor(color, w, d) {
    const map = planks(color);
    map.repeat.set(w / 2, d * 2);
    return new MeshStandardMaterial({ color: 0xffffff, map, roughness: 0.95, metalness: 0 });
  },
  box: (w, h, d, r) => {
    const ww = Math.max(0.01, w);
    const hh = Math.max(0.01, h);
    const dd = Math.max(0.01, d);
    // a sliver (a screen, a stroke, a sheet) stays a plain box: nothing to round
    if (Math.min(ww, hh, dd) < 0.03) return B(ww, hh, dd);
    return roundBox(ww, hh, dd, r ?? Math.min(ww, hh, dd) * 0.22);
  },
  ball: (r) => new SphereGeometry(r, SEG, SEG - 4),
  cap: (r, frac) => new SphereGeometry(r, SEG, SEG - 4, 0, Math.PI * 2, 0, Math.PI * Math.min(1, frac)),
  capsule: (r, l) => new CapsuleGeometry(r, l, 4, 12),
  cylinder: (r, h) => new CylinderGeometry(r, r, h, SEG),
};

/** the look of the app: clay (his pick, bims m_27814); ISO stays behind the seam */
export const STYLE: Style = CLAY;
