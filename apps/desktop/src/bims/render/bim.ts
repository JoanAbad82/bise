// One bim's meshes (three): the clay look of page bims-look D (his pick, v6): a round glossy-eyed
// head, a bean of a torso in one of six outfits from its name (main keeps its ink hoodie), chunky
// sleeves, mitten hands, round sneakers; and the props its poses show (a box to land, a mug, fruit, a
// sheet, a skate, sunglasses, the failed cloud, hot's sweat and steam). apply() copies a pose.ts Rig
// onto the meshes; nothing here decides.
// Each rigid part (head, body, two arms, two legs) is baked into one vertex-coloured mesh (merge.ts
// bakePart, the designer's condition for the look): the face's eyes, lids and mouths (they toggle and
// scale), the props (they toggle) and the glows stay apart. A part with small details (cuffs, folds,
// hems, a pocket, strings, buttons, the eyes' catchlights: userData.near) is baked twice, near and
// far, and detail() swaps them by how big the bim is on screen (nearAt). Its materials are its own,
// so it fades (reduced motion) and goes grey (stopped); the clay light is claylight.ts's.
import { type BufferGeometry, Color, Group, type Material, Mesh, type MeshBasicMaterial, type MeshLambertMaterial, MeshStandardMaterial, type Object3D, SphereGeometry, TorusGeometry, Vector3 } from 'three';
import { DAY, EYE, MOUTH, SOLE, WORLD, blushOf, outfitOf, type Outfit } from './palette';
import { HAT_K, HEAD_R, HEAD_Y } from './laptop';
import { bakePart } from './merge';
import { GREY_MIX, clayLit, partsMaterial, warmth } from './claylight';
import type { Rig, Rot } from './pose';
import type { Style } from './style';
import type { Wear } from './maps/look';

type Mat = MeshLambertMaterial | MeshBasicMaterial;

export interface Bim {
  readonly name: string;
  readonly main: boolean;
  readonly outfit: Outfit;
  readonly group: Group;
  apply(rig: Rig): void;
  /** the small details drawn (near) or not (far): nearAt(fit.scale) */
  detail(near: boolean): void;
  /** the day's light, 0 (night: the lamp pools light it) .. 1: its clay's self-warmth */
  daylight(day: number): void;
  /** the point above its head where labels and pills go, world units */
  headTop(out: Vector3): Vector3;
  /** its feet on the floor, world units */
  feet(out: Vector3): Vector3;
  /** its right hand, world units (his paper plane lands there and stays in it: office-scene.ts) */
  hand(out: Vector3): Vector3;
  dispose(): void;
}

const GREY = new Color(WORLD.grey);
/** eyes this shut or more (pose.ts: 0.15 asleep, 0.3 laughing) draw as closed lines */
const CLOSED = 0.25;
/**
 * css px per office unit from which the small details are drawn: the follow zoom (×2.2) shows them,
 * the office's fit at 320 (12.2 px) and at 640 (21.8) does not; measured on page bims-look v6 at ×1.8
 * of the 320 fit (1,927 → 1,655 draws unmerged, no visible difference)
 */
export const NEAR_PX = 22;
/** whether a bim seen through a fit of `scale` (world units per css px) draws its small details. Pure. */
export const nearAt = (scale: number): boolean => scale > 0 && 1 / scale >= NEAR_PX;
/** an afro's half-width: inside the shoulders' (0.24 + a sleeve's 0.078), as the old afro sat inside the old shoulders */
const AFRO_W = 0.29;
/** the rigid parts, each baked into one mesh (two with a far level of detail) */
export const PARTS = ['head', 'body', 'armL', 'armR', 'legL', 'legR'] as const;

/**
 * `outfit`: another bim's (s3, april fools: hats shuffled, one in main's hoodie); its own by default.
 * `wear`: the map's small thing every bim wears (render/maps/look.ts), after its outfit.
 * `merge`: false leaves every mesh as built (the merge law compares both: bim.test.ts).
 */
export function makeBim(name: string, main: boolean, style: Style, outfit?: Outfit, wear?: (w: Wear) => void, merge = true): Bim {
  const o = outfit ?? outfitOf(name, main);
  const mats = new Map<string, Mat>();
  const orig = new Map<Mat, Color>();
  let day = 1;
  const own = (key: string, make: () => Mat): Mat => {
    let m = mats.get(key);
    if (!m) {
      m = make();
      mats.set(key, m);
      orig.set(m, m.color.clone());
      warmth(m, day);
    }
    return m;
  };
  const mat = (color: string, glow = 0): Mat =>
    own(`${color}|${glow}`, () => {
      const m = style.material(color, glow > 0 ? { emissive: color, ei: glow } : {}) as Mat;
      clayLit(m, glow === 0);
      return m;
    });
  /** a glossy one (the eyes) */
  const gloss = (color: string, rough: number): Mat =>
    own(`${color}|gloss${rough}`, () => {
      const m = style.material(color) as Mat;
      if (m instanceof MeshStandardMaterial) m.roughness = rough;
      clayLit(m, true);
      return m;
    });
  const add = (geo: BufferGeometry, m: Material, parent: Object3D, x: number, y: number, z: number): Mesh => {
    const mesh = new Mesh(geo, m);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };
  /** a small detail: drawn near only */
  const lod = (m: Mesh): Mesh => {
    m.userData.near = true;
    return m;
  };
  /** the face's toggling pieces: never merged, no shadow (too small to cast one) */
  const kept = new Set<Object3D>();
  const face = (m: Mesh): Mesh => {
    kept.add(m);
    m.userData.noShadow = true;
    return m;
  };
  const shade = (hex: string, k: number): string => '#' + new Color(hex).multiplyScalar(k).getHexString();

  const g = new Group();
  const body = new Group();
  body.name = 'body';
  const s = main ? 1.18 : 1;
  body.scale.setScalar(s);
  g.add(body);

  const KIND = o.kind;
  const SECOND = o.second;
  const SLEEVE = KIND === 'puffer' ? SECOND : o.hoodie;
  const SHORT = KIND === 'tee' || KIND === 'overalls';
  const DARK = 0.86;
  const R = HEAD_R;
  /** a point on the face at (x, y), pushed out by `out` */
  const onFace = (x: number, y: number, out = 0): number => Math.sqrt(Math.max(0, R * R - x * x - y * y)) + out;

  // the torso: a round bean in the outfit's colour (the shirt's under dungarees), a chunky roll collar
  const under = KIND === 'overalls' ? WORLD.paper : o.hoodie;
  add(style.capsule(0.215, 0.17), mat(under), body, 0, 0.49, 0).scale.set(1.04, 1, 0.94);
  if (KIND === 'hoodie' || KIND === 'sweater') {
    add(new TorusGeometry(0.115, 0.052, 10, 24), mat(o.hoodie), body, 0, 0.775, 0).rotation.x = Math.PI / 2;
  }
  if (KIND === 'tee') {
    // a crew neck and a print on the chest (the second colour)
    add(new TorusGeometry(0.1, 0.022, 8, 22), mat(shade(o.hoodie, 0.88)), body, 0, 0.775, 0.01).rotation.x = Math.PI / 2;
    add(new SphereGeometry(0.06, 14, 10), mat(SECOND), body, 0.02, 0.57, 0.19).scale.set(1, 1, 0.3);
  }
  if (KIND === 'sweater') {
    // a knit jumper: two bands round the chest, a ribbed hem
    for (const y of [0.56, 0.48]) {
      const band = add(new TorusGeometry(0.212, 0.026, 8, 30), mat(SECOND), body, 0, y, 0);
      band.rotation.x = Math.PI / 2;
      band.scale.set(1.04, 0.94, 1);
    }
    lod(add(new TorusGeometry(0.19, 0.03, 8, 30), mat(shade(o.hoodie, DARK)), body, 0, 0.27, 0)).rotation.x = Math.PI / 2;
  }
  if (KIND === 'overalls') {
    // dungarees over a white tee: the waist, the bib, two straps, two gold buttons
    const pm = mat(o.hoodie);
    add(style.capsule(0.221, 0.06), pm, body, 0, 0.33, 0).scale.set(1.04, 1, 0.95);
    add(style.box(0.24, 0.2, 0.06, 0.03), pm, body, 0, 0.5, 0.17).rotation.x = -0.05;
    for (const sx of [-1, 1]) {
      add(style.box(0.045, 0.3, 0.03, 0.012), pm, body, sx * 0.09, 0.66, 0.1).rotation.x = -0.75;
      lod(add(style.ball(0.018), mat(WORLD.gold), body, sx * 0.09, 0.585, 0.205));
    }
    lod(add(style.box(0.11, 0.07, 0.02, 0.008), mat(shade(o.hoodie, 0.88)), body, 0, 0.5, 0.205));
  }
  if (KIND === 'jacket') {
    // an open jacket over a white shirt: the shirt in a V down the front, two lapels, buttons
    add(new SphereGeometry(0.1, 16, 12), mat(WORLD.paper), body, 0, 0.6, 0.155).scale.set(0.62, 1.7, 0.5);
    for (const sx of [-1, 1]) {
      add(style.box(0.07, 0.13, 0.03, 0.012), mat(shade(o.hoodie, 0.9)), body, sx * 0.07, 0.71, 0.17).rotation.set(-0.45, 0, sx * -0.35);
    }
    for (const y of [0.56, 0.44]) lod(add(style.ball(0.016), mat(SECOND), body, 0.065, y, 0.212));
  }
  if (KIND === 'puffer') {
    // a puffer vest: three soft rings stacked over a long-sleeved shirt (the second colour)
    for (const [y, r] of [[0.64, 0.19], [0.5, 0.215], [0.36, 0.2]] as const) {
      const ring = add(new TorusGeometry(r, 0.06, 10, 28), mat(o.hoodie), body, 0, y, 0);
      ring.rotation.x = Math.PI / 2;
      ring.scale.set(1.04, 0.94, 1);
    }
    lod(add(style.box(0.012, 0.36, 0.012), mat(shade(o.hoodie, 0.75)), body, 0, 0.5, 0.235));
  }
  if (KIND === 'hoodie') {
    // the hood lying on its back, the pocket, two drawstrings (main has none: its chain and :* sit there, designer m_41188 3)
    const hood = add(new SphereGeometry(0.16, 16, 10), mat(shade(o.hoodie, 0.93)), body, 0, 0.72, -0.15);
    hood.scale.set(1.15, 0.55, 0.7);
    hood.rotation.x = 0.35;
    lod(add(style.box(0.25, 0.11, 0.06, 0.03), mat(shade(o.hoodie, DARK)), body, 0, 0.36, 0.175)).rotation.x = -0.25;
    for (const dx of main ? [] : [-0.045, 0.045]) {
      lod(add(style.capsule(0.011, 0.09), mat(WORLD.paper), body, dx, 0.66, 0.2)).rotation.x = -0.35;
      lod(add(style.ball(0.017), mat(WORLD.paper), body, dx, 0.6, 0.222));
    }
  }

  const head = new Group();
  head.name = 'head';
  head.position.set(0, HEAD_Y, 0);
  body.add(head);
  add(style.ball(R), mat(o.skin), head, 0, 0, 0);
  // the hats and the maps' wears, drawn for a 0.22 head, at the clay head's size
  const hat = new Group();
  hat.scale.setScalar(HAT_K);
  head.add(hat);
  // round dot eyes, glossy, a catchlight each, set into the face
  const ER = 0.044;
  const EX = 0.09;
  const EY = 0.01;
  const catchlights: Mesh[] = [];
  const eyes = [-EX, EX].map((ex) => {
    const e = face(add(new SphereGeometry(ER, 16, 12), gloss(EYE, 0.3), head, ex, EY, onFace(ex, EY, -0.016)));
    e.scale.z = 0.55;
    e.rotation.y = Math.atan2(ex, R);
    const hl = lod(add(new SphereGeometry(ER * 0.32, 8, 6), mat(WORLD.paper, 0.6), e, -ER * 0.3, ER * 0.38, ER * 0.85));
    hl.scale.z = 0.5;
    hl.userData.noShadow = true;
    catchlights.push(hl);
    return e;
  });
  // closed: a soft arc each (a sleeper's ‿)
  const lids = [-EX, EX].map((ex) => {
    const l = face(add(new TorusGeometry(0.028, 0.0075, 6, 14, Math.PI), mat(EYE), head, ex, EY + 0.008, onFace(ex, EY, -0.002)));
    l.rotation.z = Math.PI;
    return l;
  });
  // the smile: a thin arc; laughing: an open half moon; oh: a small round
  const MY = -0.055;
  const smile = face(add(new TorusGeometry(0.03, 0.0075, 6, 16, Math.PI), mat(EYE), head, 0, MY + 0.012, onFace(0, MY, -0.002)));
  smile.rotation.z = Math.PI;
  const laugh = face(add(new SphereGeometry(0.045, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat(MOUTH), head, 0, MY + 0.005, onFace(0, MY, -0.006)));
  laugh.scale.z = 0.4;
  const oh = face(add(new SphereGeometry(0.024, 12, 8), mat(MOUTH), head, 0, MY - 0.01, onFace(0, MY, -0.005)));
  oh.scale.z = 0.45;
  // blush: two soft round cheeks under the eyes, a little out, from its skin
  for (const ex of [-0.13, 0.13].map((x) => x * HAT_K)) {
    const cy = -0.035;
    const c = add(new SphereGeometry(0.042, 14, 10), mat(blushOf(o.skin)), head, ex, cy, onFace(ex, cy, -0.016));
    c.scale.set(1, 0.68, 0.35);
    c.rotation.y = Math.atan2(ex, R);
  }

  // a fringe of soft tufts over the cap of hair, all leaning the same way
  const hairOn = (): void => {
    add(style.cap(R + 0.008, 0.4), mat(o.hair), head, 0, 0.02, -0.02);
    const T: readonly (readonly [number, number, number, number, number])[] = [
      [-0.13, 0.13, 0.15, 0.085, 0.5],
      [-0.04, 0.17, 0.16, 0.09, 0.35],
      [0.06, 0.17, 0.15, 0.088, 0.2],
      [0.15, 0.12, 0.12, 0.075, 0.05],
      [0, 0.23, 0.02, 0.1, 0.3],
    ];
    for (const [x, y, z, r, rot] of T) {
      const t = add(new SphereGeometry(r, 14, 10), mat(o.hair), head, x, y, z);
      t.scale.set(1.25, 0.62, 0.9);
      t.rotation.set(-0.35, 0, rot);
    }
  };
  // hair and hats
  const capOn = (back: boolean): void => {
    add(style.cap(0.225, 0.48), mat(o.hatColor), hat, 0, 0.03, 0);
    add(style.box(0.22, 0.03, 0.2), mat(o.hatColor), hat, 0, 0.07, back ? -0.22 : 0.21);
  };
  switch (o.hat) {
    case 'cap': capOn(false); break;
    case 'capback': capOn(true); break;
    case 'beanie':
      add(style.cap(0.232, 0.5), mat(o.hatColor), hat, 0, 0.04, 0);
      add(style.ball(0.06), mat(WORLD.paper), hat, 0, 0.28, 0);
      break;
    case 'afro':
      // never wider than the shoulders (designer m_41390 1): AFRO_W half-width at the clay head's size
      add(style.ball(0.27), mat(o.hair), hat, 0, 0.1, -0.05).scale.set(AFRO_W / (0.27 * HAT_K), 0.85, 0.95);
      break;
    case 'bun':
      add(style.cap(0.226, 0.42), mat(o.hair), hat, 0, 0.02, -0.01);
      add(style.ball(0.09), mat(o.hair), hat, 0, 0.24, -0.08);
      break;
    case 'hair':
      hairOn();
      break;
    case 'headphones': {
      // a headset (Gabriel: « cette barre orange est sensé etre un casque audio? »): a band that
      // follows the head's curve over its hair from ear to ear, a cup in its hat colour on each
      // ear over a dark cushion, and a small mic arm from the left cup to the mouth
      add(style.cap(0.226, 0.4), mat(o.hair), hat, 0, 0.02, -0.02);
      const ink = mat(WORLD.dark);
      const BR = 0.262;
      const SEGS = 7;
      const SPAN = 1.3; // radians each side of the top: the band ends just above the cups
      const step = (2 * SPAN) / SEGS;
      for (let i = 0; i < SEGS; i++) {
        const a = -SPAN + step * (i + 0.5);
        add(style.box(BR * step * 1.15, 0.034, 0.06, 0.012), ink, hat, BR * Math.sin(a), BR * Math.cos(a), -0.01).rotation.z = -a;
      }
      for (const sx of [-1, 1]) {
        add(style.box(0.03, 0.07, 0.035, 0.01), ink, hat, sx * 0.258, 0.07, -0.01);
        add(style.cylinder(0.078, 0.03), ink, hat, sx * 0.222, -0.01, -0.01).rotation.z = Math.PI / 2;
        add(style.cylinder(0.086, 0.055), mat(o.hatColor), hat, sx * 0.258, -0.01, -0.01).rotation.z = Math.PI / 2;
        add(style.cylinder(0.05, 0.012), ink, hat, sx * 0.288, -0.01, -0.01).rotation.z = Math.PI / 2;
      }
      const from = new Vector3(-0.27, -0.05, 0.03);
      const to = new Vector3(-0.12, -0.1, 0.19);
      const dir = to.clone().sub(from);
      const arm = add(style.box(0.018, 0.018, dir.length(), 0.006), ink, hat, (from.x + to.x) / 2, (from.y + to.y) / 2, (from.z + to.z) / 2);
      arm.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), dir.normalize());
      add(style.ball(0.026), ink, hat, to.x, to.y, to.z);
      break;
    }
    case 'main': {
      // main: the ink hoodie, its :* on the chest in the neon's yellow (bims.md), a gold chain
      hairOn();
      const neon = mat(DAY.neon, 0.35);
      add(style.box(0.05, 0.05, 0.02), neon, body, -0.06, 0.58, 0.215);
      add(style.box(0.05, 0.05, 0.02), neon, body, -0.06, 0.47, 0.215);
      for (let i = 0; i < 3; i++) add(style.box(0.11, 0.025, 0.02), neon, body, 0.05, 0.525, 0.215).rotation.z = (i * Math.PI) / 3;
      // the chain hangs as a thin U from the collar, its lowest point over the :* (designer m_41390 2),
      // leaning back with the chest so it lies on the hoodie
      const chain = add(new TorusGeometry(0.08, 0.011, 6, 18, Math.PI), mat(WORLD.gold, 0.2), body, 0, 0.735, 0.148);
      chain.rotation.set(-0.5, 0, Math.PI, 'XYZ');
      break;
    }
  }

  const arms: Group[] = [];
  const legs: Group[] = [];
  for (const sx of [-1, 1]) {
    const arm = new Group();
    arm.name = sx < 0 ? 'armL' : 'armR';
    arm.position.set(sx * 0.24, 0.66, 0);
    body.add(arm);
    // chunky round sleeves (a short one over a bare forearm: the tee's, the shirt's under dungarees), a mitten of a hand
    if (SHORT) {
      add(style.capsule(0.06, 0.17), mat(o.skin), arm, 0, -0.16, 0);
      add(style.capsule(0.082, 0.05), mat(KIND === 'overalls' ? WORLD.paper : o.hoodie), arm, 0, -0.07, 0);
    } else add(style.capsule(0.078, 0.17), mat(SLEEVE), arm, 0, -0.14, 0);
    add(new SphereGeometry(0.066, 16, 12), mat(o.skin), arm, 0, -0.305, 0.005).scale.set(0.95, 1.05, 0.85);
    if (!SHORT) {
      // a ribbed cuff and a fold at the elbow
      lod(add(new TorusGeometry(0.066, 0.022, 8, 18), mat(shade(SLEEVE, DARK)), arm, 0, -0.245, 0)).rotation.x = Math.PI / 2;
      lod(add(new TorusGeometry(0.075, 0.014, 6, 18), mat(shade(SLEEVE, 0.94)), arm, 0, -0.12, 0)).rotation.set(Math.PI / 2 + 0.25, 0, 0);
    }
    arms.push(arm);
    const leg = new Group();
    leg.name = sx < 0 ? 'legL' : 'legR';
    leg.position.set(sx * 0.1, 0.3, 0);
    body.add(leg);
    add(style.capsule(0.088, 0.12), mat(o.pants), leg, 0, -0.11, 0);
    lod(add(new TorusGeometry(0.082, 0.02, 8, 18), mat(shade(o.pants, 0.9)), leg, 0, -0.2, 0)).rotation.x = Math.PI / 2;
    // a round sneaker (designer m_41188 6): a squashed ball over a thin sole, the sole inside the
    // toe box's outline (a wider one showed as a dark plate in the close-up)
    add(new SphereGeometry(0.1, 18, 12), mat(WORLD.paper), leg, 0, -0.262, 0.05).scale.set(0.82, 0.48, 1.3);
    add(new SphereGeometry(0.1, 16, 8), mat(SOLE), leg, 0, -0.296, 0.05).scale.set(0.78, 0.2, 1.24);
    legs.push(leg);
  }
  const [armL, armR] = arms as [Group, Group];
  const [legL, legR] = legs as [Group, Group];
  wear?.({ style, name, head: hat, body, arms, legs, mat, add });

  // every rigid part baked into one mesh (two: near and far), the face's toggling pieces apart
  const parts: readonly Group[] = [head, body, armL, armR, legL, legR];
  const pm = partsMaterial(style);
  const nearMeshes: Mesh[] = [];
  const farMeshes: Mesh[] = [];
  if (merge) {
    const isPart = new Set<Object3D>(parts);
    for (const part of parts) {
      const ms: Mesh[] = [];
      const walk = (obj: Object3D): void => {
        for (const c of obj.children) {
          if (isPart.has(c) || kept.has(c)) continue;
          if (c instanceof Mesh) ms.push(c as Mesh);
          walk(c);
        }
      };
      walk(part);
      if (ms.length === 0) continue;
      const near = bakePart(part, ms);
      const far = ms.some((m) => m.userData.near === true) ? bakePart(part, ms, (m) => m.userData.near !== true) : null;
      for (const m of ms) {
        m.removeFromParent();
        m.geometry.dispose();
      }
      for (const c of [...part.children]) if (!(c instanceof Mesh) && !isPart.has(c) && c.children.length === 0) part.remove(c);
      const put = (geo: BufferGeometry, m: Material, label: string): Mesh => {
        const mesh = new Mesh(geo, m);
        mesh.name = `${part.name}:${label}`;
        part.add(mesh);
        return mesh;
      };
      if (near.colours) {
        const n = put(near.colours, pm.material, far ? 'near' : 'all');
        if (far) nearMeshes.push(n);
      }
      if (far?.colours) {
        // near until detail() says far
        const f = put(far.colours, pm.material, 'far');
        f.visible = false;
        farMeshes.push(f);
      }
      // the glows (main's :* and chain) carry no small detail: the near bake's
      for (const [m, geo] of near.glows) put(geo, m, 'glow');
      for (const [, geo] of far?.glows ?? []) geo.dispose();
    }
  }

  // props
  const crate = add(style.box(0.4, 0.3, 0.3), mat(WORLD.crate), body, 0, 0.62, 0.3);
  add(style.box(0.41, 0.04, 0.12), mat(WORLD.tape), crate, 0, 0.15, 0);
  const hand = new Group();
  hand.position.set(0, -0.33, 0.04);
  armR.add(hand);
  const mug = add(style.cylinder(0.055, 0.11), mat(WORLD.paper), hand, 0, 0, 0);
  const orange = add(style.ball(0.08), mat(WORLD.orange), hand, 0, 0, 0.02);
  const pine = new Group();
  hand.add(pine);
  const fruit = add(style.ball(0.08), mat(WORLD.pineapple), pine, 0, 0, 0.03);
  fruit.scale.y = 1.4;
  // o5: the golden one, glowing (the palette's gold, never the accent)
  const golden = mat(WORLD.gold, 0.6);
  const plainPine = fruit.material;
  // m2: the coin it picks up mid-hop, rising over its head
  const coin = add(style.cylinder(0.09, 0.025), mat(WORLD.gold, 0.4), g, 0, 1.4, 0);
  coin.rotation.x = Math.PI / 2;
  add(style.box(0.06, 0.12, 0.06), mat(WORLD.pineLeaf), pine, 0, 0.16, 0.03);
  const sheet = add(style.box(0.3, 0.38, 0.015), mat(WORLD.paper), body, 0, 0.58, 0.32);
  sheet.rotation.x = -0.35;
  // the catch's thumbs up: a thumb up on the right fist (the arm ahead, its hand's +z is up)
  const thumb = add(style.box(0.035, 0.035, 0.08), mat(o.skin), hand, 0, 0, 0.075);
  const skate = new Group();
  g.add(skate);
  // the deck, its two trucks under it, four wheels out past its sides so they show from above (Gabriel: « les skateboards n'ont pas de roues! »)
  add(style.box(0.28, 0.04, 0.85), mat(WORLD.skate), skate, 0, 0.15, 0);
  for (const wz of [-0.27, 0.27]) {
    add(style.box(0.38, 0.04, 0.07), mat(WORLD.truck), skate, 0, 0.11, wz);
    for (const wx of [-0.21, 0.21]) {
      const w = add(style.cylinder(0.065, 0.08), mat(WORLD.wheel), skate, wx, 0.065, wz);
      w.rotation.z = Math.PI / 2;
    }
  }
  const glasses = add(style.box(0.26, 0.06, 0.03), mat(WORLD.sunglasses), hat, 0, 0.04, 0.215);
  // the cloud over the laptop (failed): ahead of the bim, where its desk is
  const cloud = new Group();
  g.add(cloud);
  for (const [cx, cy, r] of [[-0.12, 0, 0.12], [0.06, 0.04, 0.15], [0.2, -0.01, 0.1]] as const) add(style.ball(r), mat(WORLD.cloud), cloud, cx, cy, 0);
  cloud.position.set(0, 1.05, 0.47);
  // what its turn does (Activity.doing)
  const marker = add(style.box(0.04, 0.16, 0.04), mat(WORLD.marker), hand, 0, -0.02, 0.03);
  const newspaper = new Group();
  body.add(newspaper);
  newspaper.position.set(0, 0.62, 0.34);
  newspaper.rotation.x = -0.3;
  add(style.box(0.46, 0.32, 0.015), mat(WORLD.paper), newspaper, 0, 0, 0);
  for (let i = 0; i < 4; i++) add(style.box(0.36, 0.025, 0.005), mat(WORLD.ink), newspaper, 0, 0.1 - i * 0.065, 0.01);
  const magnifier = new Group();
  hand.add(magnifier);
  add(style.box(0.03, 0.12, 0.03), mat(WORLD.trunk), magnifier, 0, 0.06, 0.05);
  add(style.box(0.16, 0.16, 0.025), mat(WORLD.glass, 0.25), magnifier, 0, 0.19, 0.05);
  const poster = new Group();
  body.add(poster);
  poster.position.set(0, 1.25, 0.12);
  add(style.box(0.62, 0.44, 0.015), mat(WORLD.paper), poster, 0, 0, 0);
  WORLD.mural.slice(0, 3).forEach((c, i) => add(style.box(0.16, 0.16, 0.005), mat(c), poster, -0.18 + i * 0.18, 0.04, 0.01));
  // the big screen beside its desk (computer use): on a stand, to the bim's right as it faces it
  const bigScreen = new Group();
  g.add(bigScreen);
  bigScreen.position.set(-0.3, 0, 0.55);
  add(style.box(0.06, 0.8, 0.06), mat(WORLD.dark), bigScreen, 0, 0.4, 0);
  add(style.box(0.75, 0.48, 0.05), mat(WORLD.dark), bigScreen, 0, 1.0, 0);
  add(style.box(0.68, 0.41, 0.01), mat(WORLD.glass, 0.6), bigScreen, 0, 1.0, -0.03);
  // the shredder beside the desk, a sheet going in
  const shredder = new Group();
  g.add(shredder);
  shredder.position.set(0, 0, 0.4);
  add(style.box(0.36, 0.42, 0.26), mat(WORLD.dark), shredder, 0, 0.21, 0);
  const shred = add(style.box(0.24, 0.3, 0.012), mat(WORLD.paper), shredder, 0, 0.5, 0);
  // build: a progress bar over its head
  const progress = new Group();
  g.add(progress);
  add(style.box(0.62, 0.1, 0.03), mat(WORLD.dark), progress, 0, 0, 0);
  const fill = add(style.box(0.58, 0.06, 0.035), mat(WORLD.bar, 0.3), progress, 0, 0, 0.005);
  const sweat = [0, 1, 2].map(() => add(style.box(0.06, 0.09, 0.04), mat(WORLD.sweat, 0.3), head, 0, 0, 0));
  const steam = [0, 1, 2].map(() => add(style.ball(0.08), mat(WORLD.steam), g, 0, 0, 0));
  // a climber's fall onto the mat (render/climb.ts): a puff of chalk round its seat, swelling, then gone
  const puff = new Group();
  g.add(puff);
  for (const [px, pz] of [[-0.24, 0.05], [0.24, 0.05], [0, -0.22], [0.14, 0.22], [-0.14, 0.22]] as const) add(style.ball(0.07), mat(WORLD.paper), puff, px, 0.3, pz);

  // the materials still drawn (the baked ones' sources are gone), the golden pineapple's too
  const used = new Set<Material>([golden]);
  g.traverse((obj) => { if (obj instanceof Mesh) used.add(obj.material as Material); });
  for (const m of [...orig.keys()]) {
    if (!used.has(m)) {
      orig.delete(m);
      m.dispose();
    }
  }
  const all: Material[] = [...orig.keys(), pm.material];

  const setRot = (obj: Object3D, r: Rot): void => { obj.rotation.set(r[0], r[1], r[2]); };
  let lastGrey = -1;
  let lastOp = -1;
  let near = true;
  // how far a poke lifts its head (Rig.anchor): its labels stay where the state's pose has them
  let anchor = 0;

  return {
    name,
    main,
    outfit: o,
    group: g,
    apply(rig) {
      g.visible = rig.opacity > 0.001;
      // a poke's boop: squashed about its feet or its seat (the head never dips into the desk)
      const q = rig.squash?.k ?? 0;
      const sy = 1 - q * 0.32;
      g.scale.set(1 + q * 0.18, sy, 1 + q * 0.18);
      g.position.set(rig.x, (rig.lift ?? 0) + (rig.squash?.at ?? 0) * (1 - sy), rig.z);
      anchor = rig.anchor ?? 0;
      // a skater (skate.ts) tilts along its ramp or its carve: its way first, then pitch and roll
      g.rotation.set(rig.tilt?.[0] ?? 0, rig.dir, rig.tilt?.[1] ?? 0, 'YXZ');
      const bd = rig.board;
      skate.position.set(bd?.x ?? 0, bd ? bd.y - 0.08 : 0, bd?.z ?? 0);
      skate.rotation.set(bd?.rot[0] ?? 0, bd?.rot[1] ?? 0, bd?.rot[2] ?? 0, 'YXZ');
      body.position.set(0, rig.y, 0);
      setRot(body, rig.body);
      setRot(head, rig.head);
      setRot(armL, rig.armL);
      setRot(armR, rig.armR);
      legL.rotation.set(rig.legL, 0, 0);
      legR.rotation.set(rig.legR, 0, 0);
      // under CLOSED the eyes are shut: the lids' lines, no squashed box
      const shut = rig.eyes < CLOSED;
      for (const e of eyes) {
        e.visible = !shut;
        e.scale.y = rig.eyes;
      }
      for (const l of lids) l.visible = shut;
      smile.visible = rig.mouth === 'smile';
      laugh.visible = rig.mouth === 'laugh';
      oh.visible = rig.mouth === 'oh';
      const p = rig.props;
      crate.visible = p.crate;
      // m6: the box held up over its head, else in front of its belly
      if (p.crateAt) crate.position.set(0, p.crateAt[0], p.crateAt[1]);
      else crate.position.set(0, p.crateUp ? 1.62 * s : 0.62, p.crateUp ? 0 : 0.3);
      fruit.material = p.golden ? golden : plainPine;
      coin.visible = p.coin !== null;
      if (p.coin !== null) coin.position.y = 1.5 * s + rig.y + p.coin * 0.5;
      mug.visible = p.mug;
      orange.visible = p.orange;
      pine.visible = p.pine;
      // bitten (eating at the island): a fruit a bite smaller each time
      const left = Math.max(0.15, 1 - p.eaten * 0.85);
      orange.scale.setScalar(left);
      pine.scale.setScalar(left);
      sheet.visible = p.sheet || p.sheetDown === true;
      // laid flat on the desk before it, on its left (its right hand catches), else held up in both hands
      if (p.sheetDown === true) {
        sheet.position.set(-0.22, 0.52, 0.36);
        sheet.rotation.set(-Math.PI / 2, 0, 0.2);
      } else {
        sheet.position.set(0, 0.58, 0.32);
        sheet.rotation.set(-0.35, 0, 0);
      }
      thumb.visible = p.thumb === true;
      skate.visible = p.skate;
      glasses.visible = p.glasses;
      marker.visible = p.marker;
      newspaper.visible = p.newspaper;
      magnifier.visible = p.magnifier;
      poster.visible = p.poster;
      bigScreen.visible = p.bigScreen;
      shredder.visible = p.shredder !== null;
      if (p.shredder !== null) shred.position.y = 0.5 - p.shredder * 0.32;
      progress.visible = p.progress !== null;
      if (p.progress !== null) {
        const f = Math.max(0.02, p.progress);
        fill.scale.x = f;
        fill.position.x = -0.29 * (1 - f);
        progress.position.set(0, 1.62 * s + rig.y, 0);
      }
      cloud.visible = p.cloud > 0.02;
      cloud.scale.setScalar(Math.max(0.01, p.cloud));
      const flick = p.flick ?? null;
      sweat.forEach((d, i) => {
        // a poke's turbo typing (render/poke.ts): drops at the temples flicking off sideways, never over its head
        if (flick !== null) {
          const k = (flick + i / 3) % 1;
          const side = i === 1 ? 1 : -1;
          d.visible = true;
          d.position.set(side * (0.21 + k * 0.22), 0.04 + k * 0.05 - k * k * 0.22, 0.06);
          d.scale.setScalar(1 - k * 0.5);
          return;
        }
        d.visible = p.hot !== null;
        if (p.hot === null) return;
        const k = (p.hot + i / 3) % 1;
        d.position.set((i - 1) * 0.17, 0.16 - k * 0.4, 0.16);
        d.scale.setScalar(1 - k * 0.6);
      });
      steam.forEach((q, i) => {
        q.visible = p.hot !== null && flick === null;
        if (!q.visible || p.hot === null) return;
        const k = (p.hot * 0.66 + i / 3) % 1;
        q.position.set(Math.sin(k * 6 + i) * 0.1, 1.28 * s + k * 0.9, 0);
        q.scale.setScalar(0.6 + k);
      });
      puff.visible = p.chalk !== undefined;
      if (p.chalk !== undefined) puff.scale.setScalar(0.6 + p.chalk * 1.4);
      if (rig.grey !== lastGrey) {
        lastGrey = rig.grey;
        for (const [m, c] of orig) {
          m.color.copy(c).lerp(GREY, rig.grey * GREY_MIX);
          warmth(m, day);
        }
        pm.grey(rig.grey);
      }
      if (rig.opacity !== lastOp) {
        const wasOpaque = lastOp >= 1 || lastOp < 0;
        lastOp = rig.opacity;
        const opaque = rig.opacity >= 1;
        for (const m of all) {
          m.opacity = rig.opacity;
          if (m.transparent === opaque || wasOpaque !== opaque) {
            m.transparent = !opaque;
            m.needsUpdate = true;
          }
        }
      }
    },
    detail(n) {
      if (n === near) return;
      near = n;
      for (const m of nearMeshes) m.visible = n;
      for (const m of farMeshes) m.visible = !n;
      for (const m of catchlights) m.visible = n;
    },
    daylight(d) {
      if (d === day) return;
      day = d;
      for (const m of orig.keys()) warmth(m, d);
      pm.day(d);
    },
    headTop(out) {
      head.getWorldPosition(out);
      out.y += 0.3 * s - anchor;
      return out;
    },
    hand(out) {
      return hand.getWorldPosition(out);
    },
    feet(out) {
      // in the world, as headTop: in the town its office's root carries its place
      out.set(g.position.x, 0, g.position.z);
      const root = g.parent;
      if (root === null) return out;
      root.updateWorldMatrix(true, false);
      return root.localToWorld(out);
    },
    dispose() {
      g.traverse((obj) => { if (obj instanceof Mesh) (obj.geometry as BufferGeometry).dispose(); });
      for (const m of all) m.dispose();
    },
  };
}
