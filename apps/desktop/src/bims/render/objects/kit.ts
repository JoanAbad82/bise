// The objects' builders' kit (bims-plugins plan p1): a plugin is a real thing in the bims' office.
// Each object is built at the origin on the floor (y 0), its front to +z (the camera sees +z and +x),
// centred on its foot, in the office's clay look (style.ts), with a soft contact shadow under it.
// Off (a disabled plugin): the same object in glass where it stood, 30% opacity, no shadow cast and
// no contact shadow. A wall object (the calendar) hangs with its back on z = -d/2.
//
// A family file (games.ts, music.ts, ...) only builds with a Part: a box, a cylinder, a ball, a cone,
// a pane of glass and a child group, so every object shares the materials, the glass rule and the
// contact shadow. The registry (index.ts) is the only way in.
import { Color, ConeGeometry, Group, type Material, Mesh, type Object3D } from 'three';
import { STYLE } from '../style';

export interface ObjOpts {
  /** a disabled plugin: glass, 30% */
  readonly off: boolean;
  /** 0 day .. 1 night: a screen's, a lamp's glow */
  readonly night: number;
  /** its parts: books on a shelf, lights on a rack, cups in a cabinet */
  readonly n: number;
}

/** what an object takes on the floor, centred on its origin, and how tall it is (office units) */
export interface Foot {
  readonly w: number;
  readonly d: number;
  readonly h: number;
}

/**
 * What a maker says it built: its foot (every mesh inside it, but the contact shadow), the foot's
 * centre in the maker's own frame when it is off the origin (a piano's stool in front of it: the
 * registry centres the object on it), and whether it hangs on a wall.
 */
export interface Shape extends Foot {
  readonly x?: number;
  readonly z?: number;
  readonly wall?: boolean;
}

/** one object's builder: it builds into the part and says its foot */
export type Maker = (g: Part, o: ObjOpts) => Shape;

/** the glass's opacity: a disabled plugin's object */
export const GLASS = 0.3;

// the objects' colours: the office's warm clay, never a pink or a red (palette.test.ts, objects.test.ts)
export const WOOD = '#c98f52';
export const WOOD_D = '#a8693c';
export const WOOD_L = '#e8c088';
export const SLATE = '#38444f';
export const SLATE_L = '#55636f';
export const CREAM = '#fffaf0';
export const PAPER = '#f3ede4';
export const INK = '#1d1a17';
export const TEAL = '#1f9e8f';
export const AMBER = '#f28c28';
export const SKY = '#5aaef0';
export const VIOLET = '#8f7fe6';
export const YELLOW = '#ffcc4d';
export const GREEN = '#6cc35a';
export const ORANGE = '#f39a4c';
export const STEEL = '#d9d2c5';
export const LEAF = '#4fae4a';
export const LEAF_L = '#79cf62';
/** a screen's dark glass, a night-sky blue */
export const SCREEN = '#16304a';
/** a window's or a cover's pane */
export const PANE = '#cfeaff';

export const darker = (c: string, k: number): string => '#' + new Color(c).multiplyScalar(k).getHexString();
export const lighter = (c: string, k: number): string => '#' + new Color(c).lerp(new Color('#ffffff'), k).getHexString();

const cache = new Map<string, Material>();

/** a shared material: `opacity` a see-through one (glass, water), `glow` its emissive strength (never in glass) */
function mat(color: string, off: boolean, glow: number, opacity?: number): Material {
  const op = opacity ?? (off ? GLASS : undefined);
  const ei = off ? 0 : glow;
  const key = `${color}|${op ?? 1}|${ei}`;
  let m = cache.get(key);
  if (!m) {
    m = STYLE.material(color, { ...(op !== undefined ? { opacity: op } : {}), ...(ei > 0 ? { emissive: color, ei } : {}) });
    if (op !== undefined) m.depthWrite = false;
    cache.set(key, m);
  }
  return m;
}

/** what a family file builds with: every piece lands in `root` at (x, y, z), its centre */
export interface Part {
  readonly root: Object3D;
  readonly o: ObjOpts;
  /** a block; `r` its corner radius, `glow` its emissive strength (a screen, a lamp) */
  box(w: number, h: number, d: number, color: string, x: number, y: number, z: number, r?: number, glow?: number): Mesh;
  cyl(r: number, h: number, color: string, x: number, y: number, z: number, glow?: number): Mesh;
  ball(r: number, color: string, x: number, y: number, z: number, glow?: number): Mesh;
  /** a cone, its tip up (a cat's ear) */
  cone(r: number, h: number, color: string, x: number, y: number, z: number): Mesh;
  /** a pane (a cover, a booth's window, water): its own opacity, never a shadow; in glass the object's */
  pane(w: number, h: number, d: number, color: string, opacity: number, x: number, y: number, z: number, r?: number, glow?: number): Mesh;
  /** a child group at (x, y, z): turn its root for a tilted part */
  at(x: number, y: number, z: number): Part;
  /** the soft contact shadow under a w x d footprint centred at (x, z): nothing floats (designer m_39036); none in glass */
  contact(w: number, d: number, x?: number, z?: number): void;
}

export function partOf(root: Object3D, o: ObjOpts): Part {
  const put = (m: Mesh, x: number, y: number, z: number, shadow: boolean): Mesh => {
    m.position.set(x, y, z);
    m.castShadow = shadow && !o.off;
    m.receiveShadow = true;
    root.add(m);
    return m;
  };
  return {
    root,
    o,
    box: (w, h, d, color, x, y, z, r, glow = 0) => put(new Mesh(STYLE.box(w, h, d, r), mat(color, o.off, glow)), x, y, z, true),
    cyl: (r, h, color, x, y, z, glow = 0) => put(new Mesh(STYLE.cylinder(r, h), mat(color, o.off, glow)), x, y, z, true),
    ball: (r, color, x, y, z, glow = 0) => put(new Mesh(STYLE.ball(r), mat(color, o.off, glow)), x, y, z, true),
    cone: (r, h, color, x, y, z) => put(new Mesh(new ConeGeometry(r, h, 12), mat(color, o.off, 0)), x, y, z, true),
    pane: (w, h, d, color, opacity, x, y, z, r, glow = 0) =>
      put(new Mesh(STYLE.box(w, h, d, r), mat(color, o.off, glow, o.off ? Math.min(opacity, GLASS) : opacity)), x, y, z, false),
    at(x, y, z) {
      const g = new Group();
      g.position.set(x, y, z);
      root.add(g);
      return partOf(g, o);
    },
    contact(w, d, x = 0, z = 0) {
      if (o.off) return;
      // two layers (a soft edge), their tops apart (a box is 0.01 tall at least, style.ts)
      for (const [k, dw, y, op] of [[1, 0.12, 0.004, 0.13], [0.85, 0, 0.011, 0.12]] as const) {
        const m = new Mesh(STYLE.box(w * k + dw, 0.004, d * k + dw, Math.min(w, d) * 0.4 * k), mat(INK, false, 0, op));
        m.position.set(x, y, z);
        m.userData.contact = true;
        root.add(m);
      }
    },
  };
}

/** the :* in blocks, standing in the part's xy plane: two dots and a three-bar star, u its unit */
export function glyph(p: Part, x: number, y: number, z: number, color: string, u: number): void {
  p.box(u, u, 0.02, color, x - 2.2 * u, y + 1.1 * u, z);
  p.box(u, u, 0.02, color, x - 2.2 * u, y - 1.1 * u, z);
  for (let i = 0; i < 3; i++) p.box(3.4 * u, 0.8 * u, 0.02, color, x + 1.2 * u, y, z).rotation.z = (i * Math.PI) / 3 + Math.PI / 2;
}
