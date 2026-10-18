// California's look (render/maps/look.ts; its plan: maps/california.ts; page bims-maps v10). The
// office's own room: a warm floor, a white stucco back wall with a sunset mural, a low left wall with
// surfboards, a low hedge on the park side with a gap for the sandy path; the taco truck parked
// inside (the eating place); the loft's desks and bean bags. The strip: grass, palms, the path. The
// park on its own slab: a low border, seams, floodlights, benches, and its pieces as the project
// grows (skate.ts FEATURE_STAGE): the funbox and a lone quarter pipe from the start, a curb at 3, the
// flat rail at 5, the mini ramp at 7, the ledge and the 4-stair with its handrail at 9, the pool bowl
// at 11, the vert ramp at 13 (where the quarter pipe was), a golden board at the mark at 14. The other
// stages are the office's (a plant, food and a palm, the chalkboard, the boombox, flowers, shade, more
// palms, a beach shower, a tide pool); the frames are skateboard decks on the wall, golden at 500.
// Never the app's pink or red. Owner: maps-d.
import {
  BufferGeometry, CatmullRomCurve3, ExtrudeGeometry, Float32BufferAttribute, Group, type Material, type Object3D, Path, PointLight, Shape, ShapeGeometry,
  TubeGeometry, Vector2, Vector3,
} from 'three';
import type { Box, Office, Park, Pt } from '../../model';
import type { CaliforniaOffice } from '../../maps/california';
import { QP_DECK, stairRail } from '../../parkpath';
import { FEATURE_STAGE, GOLDEN_STAGE } from '../../skate';
import { type Kit, boxOf, glyph, onFloor } from '../kit';
import { DAY, NIGHT, WORLD, hash, type Palette } from '../palette';
import { cones, deckChair, garden, islandLen, loftLounge } from '../stages';
import type { Build, DeskHandles, MapLook } from './look';
import { loft } from './loft';

/** its colours: sand and stucco, the concrete of the park */
const CAL_DAY: Palette = {
  ...DAY,
  floor: '#efe6d6', wall: '#fbf6ec', wallTop: '#e4d6bf', desk: '#c49a6c', deskTop: '#e2c18f',
  island: '#6cb4ee', islandTop: '#fffaf0', grass: '#e8d3a8', dirt: '#b08a5a', terrace: '#ece2cf', rug: '#ffd166', islandRug: '#f3ecdf',
};
const CAL_NIGHT: Palette = {
  ...NIGHT,
  floor: '#7d6a55', wall: '#5a4c40', wallTop: '#6a5a4b', desk: '#a77f55', deskTop: '#bf9a6c',
  island: '#3d78a8', islandTop: '#e8dfcc', grass: '#8a7552', dirt: '#5e4a33', terrace: '#6d5d47', islandRug: '#6b5b4a',
};

/** the park's colours, day and night */
const CONCRETE = { day: '#d8d4cc', night: '#8d8a84' } as const;
const CONCRETE_D = { day: '#c9c4ba', night: '#7c7973' } as const;
const COPING = '#8e9399';
const POLE = '#5c677d';
const GRASS = { day: '#9fd68a', night: '#4f7a45' } as const;
const SAND = { day: '#e8d3a8', night: '#8a7552' } as const;
const HEDGE = { day: '#5fa84a', night: '#3f7a35' } as const;
/** the sunset mural's bands, top to bottom (no red: the warmest is an orange) */
const SUNSET = ['#ffd166', '#f4a259', '#f39a4c', '#9b8fe0', '#6cb4ee'] as const;
const SURF = ['#6cb4ee', '#ffd166', '#2a9d8f'] as const;

const night = (k: Kit): boolean => k.pal.pendants;
const cal = (o: Office): CaliforniaOffice => o as CaliforniaOffice;

/** a quarter pipe: a transition of radius r and a deck, `len` wide, its lip facing `yaw` (0: +x, the ramp rising towards -x) */
function quarterPipe(k: Kit, parent: Object3D, x: number, z: number, len: number, r: number, deck: number, yaw: number, mat: Material): Group {
  const s = new Shape();
  s.moveTo(0, 0);
  s.absarc(0, r, r, -Math.PI / 2, 0, false);
  s.lineTo(r + deck, r);
  s.lineTo(r + deck, 0);
  s.lineTo(0, 0);
  const geo = new ExtrudeGeometry(s, { depth: len, bevelEnabled: false, curveSegments: 16 });
  geo.translate(0, 0, -len / 2);
  // the shape's x runs from the ramp's foot (0) to its back (r + deck): flipped so the foot is at +x
  geo.rotateY(Math.PI);
  const g = new Group();
  g.position.set(x, 0, z);
  g.rotation.y = yaw;
  parent.add(g);
  k.add(geo, mat, g, 0, 0, 0);
  const cope = k.add(k.style.cylinder(0.05, len), k.mat(COPING), g, -r, r, 0);
  cope.rotation.x = Math.PI / 2;
  return g;
}

/** a palm: a thin trunk, seven fronds */
function palm(k: Kit, parent: Object3D, x: number, z: number, size: number): void {
  const g = new Group();
  g.position.set(x, 0, z);
  g.scale.setScalar(size);
  parent.add(g);
  k.add(k.style.cylinder(0.08, 2.6), k.mat(WORLD.palmTrunk), g, 0, 1.3, 0);
  for (let i = 0; i < 7; i++) {
    const l = k.add(k.style.box(0.18, 0.03, 0.9), k.mat(i % 2 ? WORLD.leaf[0] : WORLD.leaf[1]), g, Math.sin(i) * 0.3, 2.6, Math.cos(i) * 0.3);
    l.rotation.set(0.5 * Math.cos(i), i, 0.5 * Math.sin(i));
  }
}

/** the room's floor, its walls, the mural and the surfboards; the hedge; the strip; the park's slab and what it has from the start */
function shell(b: Build): void {
  const { k, root, o: o0 } = b;
  const o = cal(o0);
  const { style, pal } = k;
  const { x0, D, roomX1 } = o;
  const n = night(k);
  const ow = roomX1 - x0;
  const floor = k.add(style.box(ow, 0.14, D), style.floor(pal.floor, ow, D), root, x0 + ow / 2, -0.05, D / 2);
  floor.receiveShadow = true;
  // the back wall, white stucco; the low left wall
  k.add(style.box(ow + 0.2, 1.9, 0.2), k.mat(pal.wall), root, x0 + ow / 2, 0.95, -0.1);
  k.add(style.box(0.2, 1.1, D + 0.2), k.mat(pal.wall), root, x0 - 0.1, 0.55, D / 2);
  sunsetMural(k, root, x0 + 0.3, x0 + 4.5, n);
  // the surfboards against the left wall, near the front
  SURF.forEach((c, i) => {
    const s = k.add(style.box(0.08, 1.6, 0.42, 0.04), k.mat(c), root, x0 + 0.12, 0.8, D - 4.0 + i * 0.6);
    s.rotation.z = -0.15;
  });
  // the door mat
  onFloor(k, root, boxOf({ x: o.door.x, z: D - 0.15, hw: 0.55, hd: 0.25 }), 0.04, 0.03, WORLD.mat);
  // the low hedge on the park side, a gap where the sandy path goes through
  const hedge = k.mat(n ? HEDGE.night : HEDGE.day);
  for (let z = 0.2; z < D - 0.3; z += 0.7) {
    if (Math.abs(z - o.pathZ) < 0.75) continue;
    const h = k.add(style.ball(0.32), hedge, root, roomX1 + 0.2, 0.25, z);
    h.scale.set(1, 0.8, 1.1);
  }
  // the strip: grass, the sandy path across it, two palms
  const gx0 = roomX1;
  const gx1 = o.parkX0;
  k.add(style.box(gx1 - gx0, 0.06, D), k.mat(n ? GRASS.night : GRASS.day), root, (gx0 + gx1) / 2, 0.0, D / 2);
  k.add(style.box(gx1 - gx0 + 0.6, 0.07, 1.1), k.mat(n ? SAND.night : SAND.day), root, (gx0 + gx1) / 2, 0.01, o.pathZ);
  for (const z of [1.5, D * 0.55]) palm(k, root, (gx0 + gx1) / 2 + (z < 2 ? 0.5 : -0.5), z, 1);
  parkSlab(k, root, o.park, n, b.grow.stage >= FEATURE_STAGE.bowl);
}

/** the mural over the lounge: the sunset's bands, the half sun, three palms' silhouettes */
function sunsetMural(k: Kit, parent: Object3D, xa: number, xb: number, n: boolean): void {
  const { style } = k;
  const z = 0.01 + style.pictureZ;
  const w = xb - xa;
  const top = 1.75;
  const bh = 0.28;
  SUNSET.forEach((c, i) => k.add(style.box(w, bh, 0.02), k.mat(n ? shade(c) : c), parent, (xa + xb) / 2, top - bh / 2 - i * bh, z));
  const sun = k.add(style.cylinder(0.32, 0.03), k.mat('#fff3c4'), parent, xa + w * 0.62, top - 3.2 * bh, z + 0.02);
  sun.rotation.x = Math.PI / 2;
  sun.scale.y = 1;
  for (const px of [0.12, 0.3, 0.85]) {
    const x = xa + w * px;
    k.add(style.box(0.05, 0.9, 0.02), k.mat(WORLD.dark), parent, x, top - 0.95, z + 0.03);
    for (let i = 0; i < 5; i++) {
      const f = k.add(style.box(0.3, 0.05, 0.02), k.mat(WORLD.dark), parent, x, top - 0.5, z + 0.03);
      f.rotation.z = (i - 2) * 0.45;
    }
  }
}

/** a colour a step darker for the night (the mural under the night's light) */
function shade(c: string): string {
  const v = parseInt(c.slice(1), 16);
  const f = (s: number): string => Math.round(((v >> s) & 255) * 0.7).toString(16).padStart(2, '0');
  return `#${f(16)}${f(8)}${f(0)}`;
}

/** the park's slab, its border and seams, the floodlights, the benches, the funbox and the lone quarter pipe (stage 0) */
function parkSlab(k: Kit, root: Object3D, p: Park, n: boolean, carved: boolean): void {
  const { style } = k;
  const a = p.area;
  const conc = k.mat(n ? CONCRETE.night : CONCRETE.day);
  const concD = k.mat(n ? CONCRETE_D.night : CONCRETE_D.day);
  const w = a.x1 - a.x0;
  k.add(slabGeo(k, p, carved), conc, root, (a.x0 + a.x1) / 2, 0.0, (a.z0 + a.z1) / 2);
  k.add(style.box(w + 0.2, 0.3, 0.2), concD, root, (a.x0 + a.x1) / 2, 0.15, a.z0 - 0.1);
  // the seams, cut where the bowl is
  const b = p.bowl;
  for (let z = a.z0 + 2.0; z < a.z1; z += 2.0) {
    const cut = carved && Math.abs(z - b.z) < b.hd + 0.4;
    const spans: readonly (readonly [number, number])[] = cut ? [[a.x0, b.x - b.hw - 0.4], [b.x + b.hw + 0.4, a.x1]] : [[a.x0, a.x1]];
    for (const [x0, x1] of spans) if (x1 - x0 > 0.05) k.add(style.box(x1 - x0, 0.005, 0.03), k.mat('#b9b4ab'), root, (x0 + x1) / 2, 0.045, z);
  }
  // the floodlights (the plan's poles: never on the camera's side, bims m_28843)
  for (const { x: px, z: pz } of p.poles) {
    k.add(style.cylinder(0.045, 3.0), k.mat(POLE), root, px, 1.5, pz);
    k.add(style.box(0.4, 0.2, 0.22), style.material('#fff3c4', { emissive: '#fff3c4', ei: n ? 1.5 : 0.1 }), root, px, 3.0, pz);
    if (n) {
      const l = new PointLight('#fff3c4', 6, 9, 1.4);
      l.position.set(px, 2.8, pz);
      root.add(l);
    }
  }
  // the benches (the plan's: one by the rest spots, one past the quarter pipe)
  for (const bn of p.benches) k.add(style.box(bn.x1 - bn.x0, 0.35, bn.z1 - bn.z0, 0.05), k.mat('#c49a6c'), root, (bn.x0 + bn.x1) / 2, 0.18, (bn.z0 + bn.z1) / 2);
  funbox(k, root, p, conc);
}

function funbox(k: Kit, parent: Object3D, p: Park, conc: Material): void {
  const f = p.funbox;
  k.add(k.style.box(f.hw * 2, f.h, f.hd * 2), conc, parent, f.x, f.h / 2, f.z);
  const slope = Math.hypot(f.run, f.h);
  for (const s of [-1, 1]) {
    const w = k.add(k.style.box(slope, 0.08, f.hd * 2), conc, parent, f.x + s * (f.hw + f.run / 2), f.h / 2, f.z);
    w.rotation.z = -s * Math.atan2(f.h, f.run);
  }
  k.add(k.style.box(f.hw * 2, 0.03, 0.04), k.mat(COPING), parent, f.x, f.h + 0.01, f.z - f.hd);
}

/** a bar to grind: a curb, a ledge (concrete, a metal edge), a rail on two posts */
function bar(k: Kit, parent: Object3D, b: { x0: number; x1: number; z: number; h: number }, kind: 'curb' | 'ledge' | 'rail', conc: Material): void {
  const { style } = k;
  const w = b.x1 - b.x0;
  const cx = (b.x0 + b.x1) / 2;
  if (kind === 'rail') {
    k.add(style.box(w, 0.04, 0.05), k.mat(COPING), parent, cx, b.h, b.z);
    for (const px of [b.x0 + 0.3, b.x1 - 0.3]) k.add(style.box(0.05, b.h, 0.05), k.mat(POLE), parent, px, b.h / 2, b.z);
    return;
  }
  const d = kind === 'curb' ? 0.35 : 0.6;
  k.add(style.box(w, b.h, d), conc, parent, cx, b.h / 2, b.z);
  k.add(style.box(w, 0.03, 0.04), k.mat(COPING), parent, cx, b.h + 0.01, b.z - d / 2);
}

/** the 4-stair: the raised deck, four steps down towards +x, the handrail on its two posts */
function stairs(k: Kit, parent: Object3D, p: Park, conc: Material): void {
  const s = p.stairs;
  const d = s.z1 - s.z0;
  const z = (s.z0 + s.z1) / 2;
  k.add(k.style.box(s.xTop - s.x0, s.h, d), conc, parent, (s.x0 + s.xTop) / 2, s.h / 2, z);
  const step = (s.xBottom - s.xTop) / 4;
  for (let i = 0; i < 4; i++) {
    const h = s.h - (i + 1) * (s.h / 5);
    k.add(k.style.box(step, h, d), conc, parent, s.xTop + step * (i + 0.5), h / 2, z);
  }
  // the bank up to the deck from the flat lane's side: a wedge from its foot (bankZ) up to the deck's edge
  const bank = new Shape();
  bank.moveTo(0, 0);
  bank.lineTo(s.bankZ - s.z1, 0);
  bank.lineTo(0, s.h);
  bank.lineTo(0, 0);
  const bw = s.xTop - s.bankX0;
  const wedge = new ExtrudeGeometry(bank, { depth: bw, bevelEnabled: false });
  // the shape's x along +z from the deck's edge, its y up; extruded along -x once turned
  wedge.rotateY(-Math.PI / 2);
  k.add(wedge, conc, parent, s.xTop, 0, s.z1);
  // the handrail over the steps: from the deck's edge down to the last step, its posts under its ends
  const { top, low } = stairRail(s);
  const run = s.xBottom - s.xTop;
  const len = Math.hypot(run, top - low);
  const rail = k.add(k.style.cylinder(0.03, len + 0.06), k.mat(COPING), parent, s.xTop + run / 2, (top + low) / 2, s.railZ);
  // a cylinder stands along y: laid along +x, then tipped down towards the bottom step
  rail.rotation.z = Math.PI / 2 - Math.atan2(top - low, run);
  const deckH = s.h;
  const lastH = s.h / 5;
  for (const [px, ph, foot] of [[s.xTop + 0.03, top, deckH], [s.xBottom - 0.03, low, lastH]] as const) {
    k.add(k.style.cylinder(0.025, ph - foot), k.mat(COPING), parent, px, (ph + foot) / 2, s.railZ);
  }
}

/** the slab's top: the floor a board rides at 0 stands this much under it (the bowl's rim meets it) */
const SLAB_TOP = 0.04;
/** each corner's steps round the bowl's contour, and its wall's rings from the coping to the floor */
const BOWL_CORNER = 10;
const BOWL_RINGS = 10;

/** the bowl's contour at inset d, seen from above, as many points for every inset (its rings join) */
function bowlRing(b: Park['bowl'], d: number): Pt[] {
  const r = Math.max(0.001, b.rc - d);
  const out: Pt[] = [];
  const corners: readonly (readonly [number, number])[] = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
  corners.forEach(([sx, sz], c) => {
    const cx = b.x + sx * (b.hw - b.rc);
    const cz = b.z + sz * (b.hd - b.rc);
    for (let i = 0; i <= BOWL_CORNER; i++) {
      const a = (c * Math.PI) / 2 + (i / BOWL_CORNER) * (Math.PI / 2);
      out.push({ x: cx + Math.cos(a) * r, z: cz + Math.sin(a) * r });
    }
  });
  return out;
}

/** a mesh between rings of points (x, y, z), each triangle facing the bowl's inside (towards its middle, up) */
function ringsGeo(rings: readonly (readonly (readonly [number, number, number])[])[], mid: readonly [number, number, number]): BufferGeometry {
  const pos: number[] = [];
  const tri = (a: readonly number[], b: readonly number[], c: readonly number[]): void => {
    const ux = (b[0] ?? 0) - (a[0] ?? 0);
    const uy = (b[1] ?? 0) - (a[1] ?? 0);
    const uz = (b[2] ?? 0) - (a[2] ?? 0);
    const vx = (c[0] ?? 0) - (a[0] ?? 0);
    const vy = (c[1] ?? 0) - (a[1] ?? 0);
    const vz = (c[2] ?? 0) - (a[2] ?? 0);
    const n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
    const to = [mid[0] - (a[0] ?? 0), mid[1] - (a[1] ?? 0), mid[2] - (a[2] ?? 0)];
    const flip = (n[0] ?? 0) * (to[0] ?? 0) + (n[1] ?? 0) * (to[1] ?? 0) + (n[2] ?? 0) * (to[2] ?? 0) < 0;
    for (const p of flip ? [a, c, b] : [a, b, c]) pos.push(p[0] ?? 0, p[1] ?? 0, p[2] ?? 0);
  };
  for (let k = 0; k + 1 < rings.length; k++) {
    const r0 = rings[k] ?? [];
    const r1 = rings[k + 1] ?? [];
    for (let i = 0; i < r0.length; i++) {
      const j = (i + 1) % r0.length;
      const a = r0[i];
      const b = r0[j];
      const c = r1[i];
      const d = r1[j];
      if (!a || !b || !c || !d) continue;
      tri(a, b, c);
      tri(b, d, c);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

/**
 * the pool bowl carved into the ground (Gabriel: « il faut que le modèle 3d soit creusé dans le sol »;
 * parkpath.ts bowlY, the same profile the skaters ride): its walls a quarter circle from the coping,
 * vertical there, down to its flat floor, the blue tile band under the coping, darker towards the
 * floor; the coping a metal pipe round the rim; a light deck round it on the slab
 */
function bowl(k: Kit, parent: Object3D, p: Park, n: boolean): void {
  const b = p.bowl;
  const c = (x: string): Material => k.mat(n ? shade(x) : x);
  const ring = (phi: number): (readonly [number, number, number])[] => {
    const d = b.depth * (1 - Math.cos(phi));
    const y = SLAB_TOP - b.depth * Math.sin(phi);
    return bowlRing(b, d).map((q) => [q.x, y, q.z] as const);
  };
  const phis = Array.from({ length: BOWL_RINGS + 1 }, (_, i) => (i / BOWL_RINGS) * (Math.PI / 2));
  const mid = [b.x, SLAB_TOP, b.z] as const;
  // the tile band: the wall's top, under the coping
  const band = 2;
  k.add(ringsGeo(phis.slice(0, band + 1).map(ring), mid), c('#3d6fb6'), parent, 0, 0, 0);
  k.add(ringsGeo(phis.slice(band).map(ring), mid), c('#b9bdc3'), parent, 0, 0, 0);
  // the floor, its middle a little darker
  const floorY = SLAB_TOP - b.depth;
  const edge = ring(Math.PI / 2);
  const centre = edge.map(([x, , z]) => [b.x + (x - b.x) * 0.55, floorY, b.z + (z - b.z) * 0.55] as const);
  const up = [b.x, floorY + 1, b.z] as const;
  k.add(ringsGeo([edge, centre], up), c('#9a9fa6'), parent, 0, 0, 0);
  k.add(ringsGeo([centre, centre.map(() => [b.x, floorY, b.z] as const)], up), c('#80858d'), parent, 0, 0, 0);
  // the coping: a metal pipe along the rim
  const rim = bowlRing(b, -0.03).map((q) => new Vector3(q.x, SLAB_TOP + 0.02, q.z));
  k.add(new TubeGeometry(new CatmullRomCurve3(rim, true), rim.length * 2, 0.05, 6, true), k.mat(COPING), parent, 0, 0, 0);
  // the light deck round it, flat on the slab
  const deck = new Shape(bowlRing({ ...b, hw: b.hw + 0.35, hd: b.hd + 0.35, rc: b.rc + 0.35 }, 0).map((q) => new Vector2(q.x - b.x, -(q.z - b.z))));
  deck.holes.push(new Path(bowlRing(b, 0).map((q) => new Vector2(q.x - b.x, -(q.z - b.z)))));
  const dg = new ShapeGeometry(deck, 4);
  dg.rotateX(-Math.PI / 2);
  const dm = k.add(dg, c('#ece8e0'), parent, b.x, SLAB_TOP + 0.005, b.z);
  dm.castShadow = false;
}

/** the park's slab: whole, or cut where the bowl is carved once it is built */
function slabGeo(k: Kit, p: Park, carved: boolean): BufferGeometry {
  const a = p.area;
  const w = a.x1 - a.x0;
  const d = a.z1 - a.z0;
  if (!carved) return k.style.box(w, 0.08, d);
  // shape coordinates: x, and -z (the shape lies down with rotateX(-90°)), about the slab's middle
  const cx = (a.x0 + a.x1) / 2;
  const cz = (a.z0 + a.z1) / 2;
  const s = new Shape();
  s.moveTo(-w / 2, -d / 2);
  s.lineTo(w / 2, -d / 2);
  s.lineTo(w / 2, d / 2);
  s.lineTo(-w / 2, d / 2);
  s.lineTo(-w / 2, -d / 2);
  s.holes.push(new Path(bowlRing(p.bowl, 0).map((q) => new Vector2(q.x - cx, -(q.z - cz)))));
  const g = new ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  g.translate(0, -0.04, 0);
  return g;
}

/** the park's pieces, each in its stage's group (skate.ts FEATURE_STAGE) */
function parkPieces(b: Build, p: Park): void {
  const { k } = b;
  const n = night(k);
  const conc = k.mat(n ? CONCRETE.night : CONCRETE.day);
  const st = (f: keyof typeof FEATURE_STAGE): Group | null => b.stage(FEATURE_STAGE[f]);
  const vert = st('vert');
  const qp = p.qp;
  // the lone quarter pipe at the back right; from 13 the vert stands there, taller
  const r = vert ? qp.r13 : qp.r;
  const qg = vert ?? st('qp');
  if (qg) {
    // its foot at zLip + r, its coping at zLip (where render/skate.ts stalls on it), its deck behind
    const deck = QP_DECK;
    const g = quarterPipe(k, qg, (qp.x0 + qp.x1) / 2, qp.zLip + r, qp.x1 - qp.x0, r, deck, -Math.PI / 2, conc);
    // the vert: a guard rail along the back of its deck
    if (vert) k.add(k.style.box(0.04, 0.5, qp.x1 - qp.x0), k.mat(POLE), g, -(r + deck - 0.05), r + 0.25, 0);
  }
  const curb = st('curb');
  if (curb) bar(k, curb, p.curb, 'curb', conc);
  const rail = st('rail');
  if (rail) bar(k, rail, p.rail, 'rail', conc);
  const ramp = st('ramp');
  if (ramp) {
    const m = p.ramp;
    const len = m.z1 - m.z0;
    const z = (m.z0 + m.z1) / 2;
    // two quarter pipes face to face, 3 m of flat between
    quarterPipe(k, ramp, m.xa + m.r, z, len, m.r, 0.6, 0, conc);
    quarterPipe(k, ramp, m.xb - m.r, z, len, m.r, 0.6, Math.PI, conc);
  }
  const s9 = st('stairs');
  if (s9) {
    stairs(k, s9, p, conc);
    bar(k, s9, p.ledge, 'ledge', conc);
  }
  const s11 = st('bowl');
  if (s11) bowl(k, s11, p, n);
}

/** the taco truck parked inside, its window open, its counter, its wheels; a lamp over it at night */
function island({ k, root, o }: Build): void {
  const { style, pal } = k;
  const i = o.island;
  const x = (i.x0 + i.x1) / 2;
  const z = (i.z0 + i.z1) / 2;
  const w = i.x1 - i.x0;
  const d = i.z1 - i.z0;
  k.add(style.box(w, 1.3, d, 0.12), k.mat(pal.island), root, x, 0.85, z);
  k.add(style.box(w + 0.05, 0.25, d + 0.05, 0.08), k.mat(pal.islandTop), root, x, 1.55, z);
  // the window towards the room (-z), lit at night, and its counter
  k.add(style.box(w * 0.55, 0.5, 0.05), style.material('#fff3c4', { emissive: '#fff3c4', ei: night(k) ? 0.8 : 0.1 }), root, x, 1.05, i.z0 - 0.01);
  k.add(style.box(w * 0.6, 0.05, 0.3), k.mat(pal.islandTop), root, x, 0.8, i.z0 - 0.12);
  for (const wx of [-w / 3, w / 3]) {
    const wh = k.add(style.cylinder(0.22, 0.15), k.mat(WORLD.dark), root, x + wx, 0.22, i.z0 + 0.05);
    wh.rotation.x = Math.PI / 2;
  }
  ['#ffd166', '#7cc26b', '#f28c28'].forEach((c, j) => k.add(style.box(0.22, 0.06, 0.14), k.mat(c), root, x - 0.5 + j * 0.5, 0.86, i.z0 - 0.15));
  if (pal.pendants) {
    const l = new PointLight('#ffcf8a', 3.2, 4.5, 1.6);
    l.position.set(x, 1.6, i.z0 - 0.8);
    root.add(l);
  }
}

/** where each stage's piece stands (its cones while it is built; the unlock walks there) */
function pieceAt(o0: Office, stage: number): Pt {
  const o = cal(o0);
  const p = o.park;
  const gx = (o.roomX1 + o.parkX0) / 2;
  const i = o.island;
  const spots: readonly Pt[] = [
    o.door,
    { x: o.x0 + 0.5, z: o.D - 0.6 }, // 1: an agave in its pot by the door
    { x: i.x1 + 0.5, z: i.z0 + 0.3 }, // 2: a crate of limes and oranges by the truck, a palm
    { x: (p.curb.x0 + p.curb.x1) / 2, z: p.curb.z }, // 3: the curb
    { x: (o.boardSpots[2] ?? o.door).x, z: 0.9 }, // 4: the chalkboard
    { x: (p.rail.x0 + p.rail.x1) / 2, z: p.rail.z }, // 5: the flat rail (and the boombox)
    { x: o.roomX1 - 0.6, z: o.D * 0.5 }, // 6: the cooler, flowers along the hedge
    { x: (p.ramp.xa + p.ramp.xb) / 2, z: (p.ramp.z0 + p.ramp.z1) / 2 }, // 7: the mini ramp
    { x: gx, z: o.D * 0.3 }, // 8: more palms
    { x: (p.stairs.xTop + p.stairs.xBottom) / 2, z: (p.stairs.z0 + p.stairs.z1) / 2 }, // 9: the ledge and the 4-stair
    { x: gx, z: o.pathZ + 1.6 }, // 10: the beach shower
    { x: p.bowl.x, z: p.bowl.z }, // 11: the pool bowl
    { x: o.x0 - 1.9, z: o.D * 0.55 }, // 12: the tide pool
    { x: (p.qp.x0 + p.qp.x1) / 2, z: p.qp.zLip + 0.8 }, // 13: the vert
    { x: gx, z: o.pathZ - 1.4 }, // 14: the golden board at the mark
  ];
  return spots[Math.min(stage, spots.length - 1)] ?? o.door;
}

/** the growth: the park's pieces, the office's stage pieces, the terrace and its chairs, the garden, the decks on the wall, the cones */
function growth(b: Build): void {
  const { k, o: o0, grow: g } = b;
  const o = cal(o0);
  const { style, pal } = k;
  const s0 = b.stage(0);
  if (!s0) return;
  const s = (n: number): Group | null => b.stage(n);
  parkPieces(b, o.park);
  const gx = (o.roomX1 + o.parkX0) / 2;

  // the terrace out front, its deck chairs with the stages (the loft's counts)
  const s1t = s(1);
  if (s1t) onFloor(k, s1t, { x0: o.x0 + 0.4, x1: o.x0 + 5.2, z0: o.D + 0.3, z1: o.D + 4.4 }, 0.08, 0, pal.terrace);
  const chairs = o.furniture.filter((f) => f.of !== undefined && o.terrace.some((t) => t.x === f.of?.x && t.z === f.of.z));
  const nChairs = [0, 1, 1, 1, 2, 2, 2, 4, 4, 4, 8][Math.min(g.stage, 10)] ?? 8;
  chairs.forEach((c, i) => {
    if (i >= nChairs) return;
    const at = ([1, 4, 7, 7, 10, 10, 10, 10] as const)[i] ?? 0;
    deckChair(k, s(at) ?? s0, c, i % 2 ? '#ffd166' : '#6cb4ee');
  });

  // 1: an agave in a terracotta pot
  const s1 = s(1);
  if (s1) {
    const a = pieceAt(o, 1);
    k.add(style.cylinder(0.2, 0.34), k.mat(WORLD.pot), s1, a.x, 0.17, a.z);
    for (let i = 0; i < 6; i++) {
      const l = k.add(style.box(0.07, 0.5, 0.12), k.mat('#6fa88a'), s1, a.x, 0.55, a.z);
      l.rotation.set(Math.cos(i) * 0.6, i * 1.05, Math.sin(i) * 0.6);
    }
  }
  // 2: a crate of limes and oranges by the truck; a third palm on the strip
  const s2 = s(2);
  if (s2) {
    const c = pieceAt(o, 2);
    k.add(style.box(0.5, 0.3, 0.4), k.mat(WORLD.crate), s2, c.x, 0.15, c.z);
    for (let i = 0; i < 6; i++) k.add(style.ball(0.07), k.mat(i % 2 ? '#7cc26b' : WORLD.orange), s2, c.x - 0.15 + (i % 3) * 0.15, 0.34, c.z - 0.08 + Math.floor(i / 3) * 0.16);
    palm(k, s2, gx + 0.5, o.D * 0.8, 0.9);
  }
  // 3: two bean bags (the look's lounge, by the stage's count) and the curb (parkPieces)
  // 4: the chalkboard of a surf shop: a dark green board, chalk strokes
  const s4 = s(4);
  if (s4) {
    const x = pieceAt(o, 4).x;
    const pz = style.pictureZ;
    k.add(style.box(1.8, 0.95, 0.05), k.mat('#c49a6c'), s4, x, 1.05, 0.02 + pz);
    k.add(style.box(1.68, 0.83, 0.02), k.mat('#2f4a3a'), s4, x, 1.05, 0.05 + pz);
    for (let i = 0; i < 5; i++) {
      const w = 0.4 + ((hash(`chalk${String(i)}`) % 50) / 100);
      k.add(style.box(w, 0.04, 0.01), k.mat(['#fffaf0', '#ffd166', '#8fd3ff'][i % 3] ?? '#fffaf0'), s4, x - 0.7 + w / 2, 1.35 - i * 0.14, 0.065 + pz);
    }
  }
  // 5: the boombox on the truck's counter (the eggs' notes play over it)
  const s5 = s(5);
  if (s5) {
    const i = o.island;
    const bz = i.z0 + islandLen(o, g.stage) - 0.6;
    k.add(style.box(0.55, 0.28, 0.2), k.mat(WORLD.dark), s5, (i.x0 + i.x1) / 2, 1.8, bz);
  }
  // 6: a cooler; flowers along the hedge (birds of paradise: orange and violet, never pink)
  const s6 = s(6);
  if (s6) {
    const c = pieceAt(o, 6);
    k.add(style.box(0.5, 0.35, 0.35, 0.05), k.mat('#6cb4ee'), s6, c.x - 0.4, 0.18, c.z);
    k.add(style.box(0.52, 0.06, 0.37), k.mat('#fffaf0'), s6, c.x - 0.4, 0.38, c.z);
    for (let z = 0.8; z < o.D - 0.6; z += 1.3) {
      if (Math.abs(z - o.pathZ) < 0.8) continue;
      k.add(style.box(0.14, 0.14, 0.14), k.mat(z % 2.6 < 1.3 ? WORLD.orange : '#9b8fe0'), s6, o.roomX1 + 0.55, 0.35, z);
    }
  }
  // 7: a beach umbrella on the terrace
  const s7 = s(7);
  if (s7) {
    const ux = o.x0 + 5.6;
    const uz = o.D + 1.9;
    k.add(style.cylinder(0.03, 1.8), k.mat(pal.ink), s7, ux, 0.9, uz);
    k.add(style.cap(0.75, 0.35), k.mat('#ffd166'), s7, ux, 1.75, uz);
  }
  // 8: two more palms on the strip
  const s8 = s(8);
  if (s8) for (const z of [o.D * 0.3, o.D - 1.0]) palm(k, s8, gx - 0.6, z, 1.05);
  // 10: a beach shower on the strip: a post, a head, a slatted floor
  const s10 = s(10);
  if (s10) {
    const p = pieceAt(o, 10);
    k.add(style.box(0.7, 0.05, 0.7), k.mat('#c49a6c'), s10, p.x, 0.05, p.z);
    k.add(style.cylinder(0.04, 2.0), k.mat(WORLD.metal), s10, p.x - 0.25, 1.0, p.z);
    k.add(style.box(0.3, 0.04, 0.12), k.mat(WORLD.metal), s10, p.x - 0.12, 2.0, p.z);
  }
  // 12: a tide pool left of the office, a surfboard stuck in the sand
  const s12 = s(12);
  if (s12) {
    const p = pieceAt(o, 12);
    const pool = k.add(style.cylinder(1.0, 0.04), k.mat('#6cb4ee'), s12, p.x, 0.0, p.z);
    pool.scale.z = 0.7;
    const sb = k.add(style.box(0.08, 1.4, 0.4, 0.04), k.mat('#ffd166'), s12, p.x + 0.9, 0.6, p.z - 0.6);
    sb.rotation.z = 0.2;
  }
  // 14: the golden board at the mark, on a concrete plinth by the path
  const s14 = s(GOLDEN_STAGE);
  if (s14) {
    const m = pieceAt(o, GOLDEN_STAGE);
    const gold = style.material(WORLD.gold, { emissive: WORLD.gold, ei: 0.15 });
    k.add(style.box(0.7, 0.5, 0.5), k.mat(n2(k)), s14, m.x, 0.25, m.z);
    const deck = k.add(style.box(0.28, 0.04, 0.95, 0.03), gold, s14, m.x, 1.0, m.z);
    deck.rotation.x = Math.PI / 2 - 0.25;
    glyph(k, s14, m.x, 1.0, m.z + 0.05, k.pal.ink, 0.04);
  }

  garden(k, s0, o, g);
  decks(k, s0, o, g);
  if (g.building && g.stage < 14) cones(k, s0, pieceAt(o, g.stage + 1));
}

const n2 = (k: Kit): string => (night(k) ? CONCRETE.night : CONCRETE.day);

/** the frames: a skateboard deck on the back wall per 10 artifacts, between the chalkboard and main's neon, golden from 500 */
function decks(k: Kit, parent: Object3D, o: Office, g: { frames: number; golden: boolean }): void {
  if (g.frames === 0) return;
  const { style } = k;
  const xa = (o.boardSpots[2]?.x ?? o.x0 + 5.5) + 1.1;
  const xb = o.mainDesk.x - 0.6;
  const pitch = 0.3;
  const cols = Math.max(1, Math.floor((xb - xa) / pitch));
  for (let i = 0; i < g.frames; i++) {
    const c = i % cols;
    const row = Math.floor(i / cols);
    const y = 1.3 - row * 0.62;
    if (y < 0.5) break;
    const col = g.golden && i === 0 ? WORLD.gold : (WORLD.mural[i % WORLD.mural.length] ?? WORLD.paper);
    k.add(style.box(0.2, 0.58, 0.03, 0.06), k.mat(col), parent, xa + pitch / 2 + c * pitch, y, 0.03 + style.pictureZ);
  }
}

export const california: MapLook = {
  id: 'california',
  // its cozy pieces (render/cozy.ts; page bims-cozy v2 « la base, carte par carte »)
  cozy: { plant: 'aloe', small: 'succulent', coffee: 'coldbrew', bed: 'pouf', shelf: 'surf', poster: 'movie', wood: '#c49a6c', cloth: ['#f39a4c', '#6cb4ee', '#e9e2d4'], art: ['#f39a4c', '#6cb4ee', '#ffd166'], pot: '#e9e2d4', rug: '#f39a4c' },
  pal: (n) => (n ? CAL_NIGHT : CAL_DAY),
  shell,
  island,
  lounge: loftLounge,
  desk: (b, spot, name): DeskHandles => loft.desk(b, spot, name),
  mainDesk: (b, name): DeskHandles => loft.mainDesk(b, name),
  tree: ({ k }, parent, x, z, size) => {
    palm(k, parent, x, z, size);
  },
  growth,
  pieceAt,
  pits: (o, stage) => (stage >= FEATURE_STAGE.bowl && o.park ? [bowlPit(o.park.bowl)] : []),
};

/** the ground's hole under the bowl: its footprint and a little more (render/ground.ts) */
function bowlPit(b: Park['bowl']): Box {
  return { x0: b.x - b.hw - 0.1, x1: b.x + b.hw + 0.1, z0: b.z - b.hd - 0.1, z1: b.z + b.hd + 0.1 };
}
