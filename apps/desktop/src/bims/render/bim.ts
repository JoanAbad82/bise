// One bim's meshes (three): a round, happy body in plain blocks, its outfit from its name, and the
// props its poses show (a box to land, a mug, fruit, a sheet, his plane, a skate, sunglasses, the
// failed cloud, hot's sweat and steam). Its materials are its own, so it can fade (reduced motion)
// and go grey (stopped). apply() copies a pose.ts Rig onto the meshes; nothing here decides.
import { type BufferGeometry, Color, Group, type Material, Mesh, type MeshBasicMaterial, type MeshLambertMaterial, type Object3D, Vector3 } from 'three';
import { CHEEK, EYE, MOUTH, WORLD, outfitOf, type Outfit } from './palette';
import { HEAD_Y } from './laptop';
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
  /** the point above its head where labels and pills go, world units */
  headTop(out: Vector3): Vector3;
  /** its feet on the floor, world units */
  feet(out: Vector3): Vector3;
  dispose(): void;
}

const GREY = new Color(WORLD.grey);
/** eyes this shut or more (pose.ts: 0.15 asleep, 0.3 laughing) draw as closed lines */
const CLOSED = 0.25;

/**
 * `outfit`: another bim's (s3, april fools: hats shuffled, one in main's hoodie); its own by default.
 * `wear`: the map's small thing every bim wears (render/maps/look.ts), after its outfit.
 */
export function makeBim(name: string, main: boolean, style: Style, outfit?: Outfit, wear?: (w: Wear) => void): Bim {
  const o = outfit ?? outfitOf(name, main);
  const mats = new Map<string, Mat>();
  const orig = new Map<Mat, Color>();
  const mat = (color: string, glow = 0): Mat => {
    const key = `${color}|${glow}`;
    let m = mats.get(key);
    if (!m) {
      m = style.material(color, glow > 0 ? { emissive: color, ei: glow } : {}) as Mat;
      mats.set(key, m);
      orig.set(m, m.color.clone());
    }
    return m;
  };
  const add = (geo: BufferGeometry, m: Material, parent: Object3D, x: number, y: number, z: number): Mesh => {
    const mesh = new Mesh(geo, m);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };

  const g = new Group();
  const body = new Group();
  const s = main ? 1.18 : 1;
  body.scale.setScalar(s);
  g.add(body);

  add(style.capsule(0.21, 0.22), mat(o.hoodie), body, 0, 0.5, 0);
  const head = new Group();
  head.position.set(0, HEAD_Y, 0);
  body.add(head);
  add(style.ball(0.22), mat(o.skin), head, 0, 0, 0);
  const eyes = [-0.075, 0.075].map((ex) => add(style.box(0.07, 0.08, 0.02), mat(EYE), head, ex, 0.03, 0.205));
  // closed eyes (asleep, napping): two thin lines a little lower and apart, flush on the face; a
  // squashed eye box read as one thick bar from above (Gabriel, via landing-shots m_28200)
  const lids = [-0.08, 0.08].map((ex) => add(style.box(0.065, 0.014, 0.006), mat(EYE), head, ex, 0.01, 0.214));
  const smile = add(style.box(0.12, 0.03, 0.02), mat(EYE), head, 0, -0.05, 0.205);
  const laugh = add(style.box(0.12, 0.06, 0.02), mat(MOUTH), head, 0, -0.06, 0.207);
  const oh = add(style.box(0.06, 0.06, 0.02), mat(EYE), head, 0, -0.08, 0.205);
  for (const ex of [-0.135, 0.135]) add(style.box(0.06, 0.04, 0.02), mat(CHEEK), head, ex, -0.05, 0.205);

  // hair and hats
  const capOn = (back: boolean): void => {
    add(style.cap(0.225, 0.48), mat(o.hatColor), head, 0, 0.03, 0);
    add(style.box(0.22, 0.03, 0.2), mat(o.hatColor), head, 0, 0.07, back ? -0.22 : 0.21);
  };
  switch (o.hat) {
    case 'cap': capOn(false); break;
    case 'capback': capOn(true); break;
    case 'beanie':
      add(style.cap(0.232, 0.5), mat(o.hatColor), head, 0, 0.04, 0);
      add(style.ball(0.06), mat(WORLD.paper), head, 0, 0.28, 0);
      break;
    case 'afro': {
      const af = add(style.ball(0.27), mat(o.hair), head, 0, 0.1, -0.05);
      af.scale.set(1.05, 0.85, 1);
      break;
    }
    case 'bun':
      add(style.cap(0.226, 0.42), mat(o.hair), head, 0, 0.02, -0.01);
      add(style.ball(0.09), mat(o.hair), head, 0, 0.24, -0.08);
      break;
    case 'hair':
      add(style.cap(0.228, 0.4), mat(o.hair), head, 0, 0.02, -0.02);
      break;
    case 'headphones': {
      // a headset (Gabriel: « cette barre orange est sensé etre un casque audio? »): a band that
      // follows the head's curve over its hair from ear to ear, a cup in its hat colour on each
      // ear over a dark cushion, and a small mic arm from the left cup to the mouth
      add(style.cap(0.226, 0.4), mat(o.hair), head, 0, 0.02, -0.02);
      const ink = mat(WORLD.dark);
      const R = 0.262;
      const SEGS = 7;
      const SPAN = 1.3; // radians each side of the top: the band ends just above the cups
      const step = (2 * SPAN) / SEGS;
      for (let i = 0; i < SEGS; i++) {
        const a = -SPAN + step * (i + 0.5);
        const seg = add(style.box(R * step * 1.15, 0.034, 0.06, 0.012), ink, head, R * Math.sin(a), R * Math.cos(a), -0.01);
        seg.rotation.z = -a;
      }
      for (const sx of [-1, 1]) {
        add(style.box(0.03, 0.07, 0.035, 0.01), ink, head, sx * 0.258, 0.07, -0.01);
        const cushion = add(style.cylinder(0.078, 0.03), ink, head, sx * 0.222, -0.01, -0.01);
        cushion.rotation.z = Math.PI / 2;
        const cup = add(style.cylinder(0.086, 0.055), mat(o.hatColor), head, sx * 0.258, -0.01, -0.01);
        cup.rotation.z = Math.PI / 2;
        const plate = add(style.cylinder(0.05, 0.012), ink, head, sx * 0.288, -0.01, -0.01);
        plate.rotation.z = Math.PI / 2;
      }
      const from = new Vector3(-0.27, -0.05, 0.03);
      const to = new Vector3(-0.12, -0.1, 0.19);
      const dir = to.clone().sub(from);
      const arm = add(style.box(0.018, 0.018, dir.length(), 0.006), ink, head, (from.x + to.x) / 2, (from.y + to.y) / 2, (from.z + to.z) / 2);
      arm.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), dir.normalize());
      add(style.ball(0.026), ink, head, to.x, to.y, to.z);
      break;
    }
    case 'main': {
      // main: the ink hoodie, its :* on the chest in the neon's yellow, a gold chain
      add(style.cap(0.228, 0.4), mat(o.hair), head, 0, 0.02, -0.02);
      const neon = mat(WORLD.wheel, 0.3);
      add(style.box(0.05, 0.05, 0.02), neon, body, -0.06, 0.58, 0.215);
      add(style.box(0.05, 0.05, 0.02), neon, body, -0.06, 0.47, 0.215);
      for (let i = 0; i < 3; i++) {
        const b = add(style.box(0.11, 0.025, 0.02), neon, body, 0.05, 0.525, 0.215);
        b.rotation.z = (i * Math.PI) / 3;
      }
      add(style.box(0.3, 0.03, 0.03), mat(WORLD.gold, 0.2), body, 0, 0.7, 0.2);
      break;
    }
  }

  const arms: Group[] = [];
  const legs: Group[] = [];
  for (const sx of [-1, 1]) {
    const arm = new Group();
    arm.position.set(sx * 0.24, 0.66, 0);
    body.add(arm);
    add(style.capsule(0.065, 0.2), mat(o.hoodie), arm, 0, -0.15, 0);
    add(style.ball(0.065), mat(o.skin), arm, 0, -0.3, 0);
    arms.push(arm);
    const leg = new Group();
    leg.position.set(sx * 0.1, 0.3, 0);
    body.add(leg);
    add(style.capsule(0.075, 0.14), mat(o.pants), leg, 0, -0.12, 0);
    add(style.box(0.15, 0.08, 0.24), mat(WORLD.paper), leg, 0, -0.27, 0.04);
    legs.push(leg);
  }
  const [armL, armR] = arms as [Group, Group];
  const [legL, legR] = legs as [Group, Group];
  wear?.({ style, name, head, body, arms, legs, mat, add });

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
  const plane = new Group();
  hand.add(plane);
  add(style.box(0.2, 0.01, 0.14), mat(WORLD.paper), plane, 0, 0.02, 0.06);
  const sheet = add(style.box(0.3, 0.38, 0.015), mat(WORLD.paper), body, 0, 0.58, 0.32);
  sheet.rotation.x = -0.35;
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
  const glasses = add(style.box(0.26, 0.06, 0.03), mat(WORLD.sunglasses), head, 0, 0.04, 0.215);
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

  const setRot = (obj: Object3D, r: Rot): void => { obj.rotation.set(r[0], r[1], r[2]); };
  let lastGrey = -1;
  let lastOp = -1;

  return {
    name,
    main,
    outfit: o,
    group: g,
    apply(rig) {
      g.visible = rig.opacity > 0.001;
      g.position.set(rig.x, rig.lift ?? 0, rig.z);
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
      crate.position.set(0, p.crateUp ? 1.62 * s : 0.62, p.crateUp ? 0 : 0.3);
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
      plane.visible = p.plane;
      sheet.visible = p.sheet;
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
      sweat.forEach((d, i) => {
        d.visible = p.hot !== null;
        if (p.hot === null) return;
        const k = (p.hot + i / 3) % 1;
        d.position.set((i - 1) * 0.17, 0.16 - k * 0.4, 0.16);
        d.scale.setScalar(1 - k * 0.6);
      });
      steam.forEach((q, i) => {
        q.visible = p.hot !== null;
        if (p.hot === null) return;
        const k = (p.hot * 0.66 + i / 3) % 1;
        q.position.set(Math.sin(k * 6 + i) * 0.1, 1.28 * s + k * 0.9, 0);
        q.scale.setScalar(0.6 + k);
      });
      if (rig.grey !== lastGrey) {
        lastGrey = rig.grey;
        for (const [m, c] of orig) m.color.copy(c).lerp(GREY, rig.grey * 0.85);
      }
      if (rig.opacity !== lastOp) {
        const wasOpaque = lastOp >= 1 || lastOp < 0;
        lastOp = rig.opacity;
        const opaque = rig.opacity >= 1;
        for (const m of orig.keys()) {
          m.opacity = rig.opacity;
          if (m.transparent === opaque || wasOpaque !== opaque) {
            m.transparent = !opaque;
            m.needsUpdate = true;
          }
        }
      }
    },
    headTop(out) {
      head.getWorldPosition(out);
      out.y += 0.3 * s;
      return out;
    },
    feet(out) {
      return out.set(g.position.x, 0, g.position.z);
    },
    dispose() {
      g.traverse((obj) => { if (obj instanceof Mesh) (obj.geometry as BufferGeometry).dispose(); });
      for (const m of orig.keys()) m.dispose();
    },
  };
}
