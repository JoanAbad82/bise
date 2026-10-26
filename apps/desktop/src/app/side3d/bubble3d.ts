// src/app/side3d · the four side bubbles' own objects (bims-plugins' spec, picked by designer and
// bims-plugins m_44222: agents B, artifacts A, scheduled A, processes B): minimal clay models that
// read at once standing on a 44 px coin, drawn in a 54 px square (objects.ts COIN), light and dark. agents = one bust (a teal bean
// of shoulders, a round head), artifacts = three sheets fanned 8°, scheduled = a chunky hourglass
// with no posts, processes = a small laptop open at 120° with one lit yellow line. Every part is
// STYLE clay through clayLit (the laptop's lit line alone glows); the hourglass's bulbs are glass.
// fitOf gives them one visual weight (objects.ts WEIGHT): 56/68 of the square high, at most 64/68
// wide, the top 6/68 under the square's top; at 54 that is 44 high. Loaded only by render.ts (behind import('./render')). Owner: r2-objects.
import { type Box3, Group, Mesh, type BufferGeometry, type Material, type Object3D } from 'three';
import { RIGHT, UP, type Fit } from '@/bims/render/camera';
import { clayLit } from '@/bims/render/claylight';
import { DAY, EYE, HAIR, HOODIE, MOUTH, PANTS, SKIN, WORLD } from '@/bims/render/palette';
import { STYLE } from '@/bims/render/style';
import { SQUARE, WEIGHT, type BubbleId } from './objects';

/** the hourglass's glass: how much of it shows */
export const GLASS = 0.55;
/** the glass by day (the office's window) and by night (the night text's cream) */
const GLASS_DAY = DAY.window;
const GLASS_NIGHT = '#f3ede4';
/** turned to the camera (the iso view's azimuth) */
const FACE = Math.PI / 4;

/** a colour of one of the palette's lists (the spec's HOODIE[5], SKIN[2]...) */
function pal(list: readonly string[], i: number): string {
  const c = list[i];
  if (c === undefined) throw new Error(`no colour ${String(i)} in the palette's list`);
  return c;
}
/** the bust's shoulders and the top sheet's block: teal (main's ink vanished in the dark bubble) */
const TEAL = pal(HOODIE, 5);
const SKIN_TAN = pal(SKIN, 2);
const HAIR_DARK = pal(HAIR, 0);
/** the top sheet's text bars */
const INK_BAR = pal(PANTS, 2);

/** a clay material; glass: see-through, never hiding what is behind it; rough: a shine (the eyes) */
function clay(color: string, o: { glass?: boolean; rough?: number } = {}): Material {
  const m = STYLE.material(color, o.glass === true ? { opacity: GLASS } : {});
  if (o.glass === true) {
    m.transparent = true;
    m.depthWrite = false;
  }
  clayLit(m, true);
  if (o.rough !== undefined) (m as unknown as { roughness: number }).roughness = o.rough;
  return m;
}

function part(g: Object3D, geo: BufferGeometry, m: Material, x: number, y: number, z: number): Mesh {
  const me = new Mesh(geo, m);
  me.position.set(x, y, z);
  me.castShadow = true;
  me.receiveShadow = true;
  g.add(me);
  return me;
}

/** agents: one bust, a bean of shoulders in teal (main's ink vanished in the dark bubble), a round head on it */
function bust(g: Group): void {
  const sh = part(g, STYLE.ball(0.5), clay(TEAL), 0, 0.3, 0);
  sh.scale.set(1.15, 0.62, 0.8);
  const h = new Group();
  h.position.set(0, 0.98, 0.02);
  h.rotation.y = FACE;
  g.add(h);
  // the face in shares of the skull's radius (the spec's 0.437, 0.071, 0.151... rounded from these)
  const r = 0.42;
  part(h, STYLE.ball(r), clay(SKIN_TAN), 0, 0, 0);
  const cap = part(h, STYLE.cap(r * 1.04, 0.45), clay(HAIR_DARK), 0, r * 0.08, -r * 0.06);
  cap.rotation.x = -0.25;
  const eye = clay(EYE, { rough: 0.25 });
  for (const s of [-1, 1]) part(h, STYLE.ball(r * 0.17), eye, s * r * 0.36, -r * 0.02, r * 0.86);
  const smile = part(h, STYLE.capsule(r * 0.07, r * 0.3), clay(MOUTH), 0, -r * 0.4, r * 0.86);
  smile.rotation.z = Math.PI / 2;
}

/** artifacts: three sheets fanned 8° apart, tilted to the camera; the top one has a teal block and two text bars */
function sheets(g: Group): void {
  g.rotation.x = 0.4;
  g.rotation.y = 0.25;
  for (let i = 0; i < 3; i++) {
    const s = new Group();
    s.position.set(-0.06 + i * 0.05, 0.05 + i * 0.07, 0.04 - i * 0.04);
    s.rotation.y = ((i - 1) * 8 * Math.PI) / 180;
    g.add(s);
    part(s, STYLE.box(1.0, 0.06, 1.3, 0.025), clay(WORLD.paper), 0, 0, 0);
    if (i === 2) {
      part(s, STYLE.box(0.62, 0.02, 0.36, 0.01), clay(TEAL), -0.06, 0.04, -0.3);
      part(s, STYLE.box(0.66, 0.02, 0.1, 0.01), clay(INK_BAR), -0.04, 0.04, 0.14);
      part(s, STYLE.box(0.44, 0.02, 0.1, 0.01), clay(INK_BAR), -0.15, 0.04, 0.36);
    }
  }
}

/** scheduled: two wooden caps, two glass bulbs, a heap of sand and its thin stream; no posts */
function hourglass(g: Group, night: boolean): void {
  const wood = clay(DAY.dirt);
  const glass = clay(night ? GLASS_NIGHT : GLASS_DAY, { glass: true });
  const sand = clay(DAY.desk);
  part(g, STYLE.cylinder(0.42, 0.12), wood, 0, 0.06, 0);
  part(g, STYLE.cylinder(0.42, 0.12), wood, 0, 1.38, 0);
  part(g, STYLE.ball(0.34), glass, 0, 0.44, 0).scale.set(1, 1.08, 1);
  part(g, STYLE.ball(0.34), glass, 0, 1.0, 0).scale.set(1, 1.08, 1);
  part(g, STYLE.cap(0.3, 0.5), sand, 0, 0.2, 0).scale.set(1, 0.9, 1);
  part(g, STYLE.cylinder(0.025, 0.42), sand, 0, 0.6, 0);
}

/** processes: a small laptop, its screen to the camera, the lid open at 120°, one lit line in the neon's yellow */
function laptop(g: Group): void {
  g.rotation.y = FACE - 0.3;
  const metal = clay(WORLD.metal);
  part(g, STYLE.box(1.2, 0.08, 0.8, 0.04), metal, 0, 0.04, 0);
  const lid = new Group();
  lid.position.set(0, 0.08, -0.38);
  lid.rotation.x = -((120 - 90) * Math.PI) / 180;
  g.add(lid);
  part(lid, STYLE.box(1.2, 0.8, 0.06, 0.04), metal, 0, 0.4, 0);
  part(lid, STYLE.box(1.0, 0.62, 0.02, 0.03), clay(WORLD.dark), 0, 0.42, 0.035);
  // the one part that is no clay: it glows
  part(lid, STYLE.box(0.44, 0.07, 0.02, 0.015), STYLE.material(DAY.neon, { emissive: DAY.neon, ei: 0.6 }), 0, 0.42, 0.05);
}

/** A bubble's object, floor at y 0, centred on x = z = 0, lit for the day or the night. */
export function bubbleModel(b: BubbleId, night: boolean): Group {
  const g = new Group();
  switch (b) {
    case 'agents':
      bust(g);
      break;
    case 'artifacts':
      sheets(g);
      break;
    case 'scheduled':
      hourglass(g, night);
      break;
    case 'processes':
      laptop(g);
      break;
  }
  return g;
}

/** The box's extents in the iso view's plane (RIGHT, UP), around its centre. Pure. */
export function projected(b: Box3): { x0: number; x1: number; y0: number; y1: number } {
  const c = { x: (b.min.x + b.max.x) / 2, y: (b.min.y + b.max.y) / 2, z: (b.min.z + b.max.z) / 2 };
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) {
    const p = { x: x - c.x, y: y - c.y, z: z - c.z };
    const u = p.x * RIGHT.x + p.y * RIGHT.y + p.z * RIGHT.z;
    const v = p.x * UP.x + p.y * UP.y + p.z * UP.z;
    x0 = Math.min(x0, u); x1 = Math.max(x1, u); y0 = Math.min(y0, v); y1 = Math.max(y1, v);
  }
  return { x0, x1, y0, y1 };
}

/**
 * The square camera on a bubble's object, `size` px: one visual weight (designer m_44222). The
 * object is WEIGHT.high of the SQUARE high, its width capped at WEIGHT.wide (a wide one caps on its
 * width and sits lower), its top WEIGHT.top under the square's top. Pure.
 */
export function fitOf(b: Box3, size: number): Fit {
  const target = { x: (b.min.x + b.max.x) / 2, y: (b.min.y + b.max.y) / 2, z: (b.min.z + b.max.z) / 2 };
  const { x0, x1, y0, y1 } = projected(b);
  const side = Math.max((y1 - y0) / (WEIGHT.high / SQUARE), (x1 - x0) / (WEIGHT.wide / SQUARE));
  const half = side / 2;
  const cx = (x0 + x1) / 2;
  const cy = y1 + (WEIGHT.top / SQUARE) * side - half;
  return { target, left: cx - half, right: cx + half, top: cy + half, bottom: cy - half, scale: side / size, widthPx: size, heightPx: size };
}
