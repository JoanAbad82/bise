// The first launch's island, drawn (plan.ts says what): the landing's island in the app (the
// sprites' buildIsland: its cube slab, the tiny desk, the props), his own bim (mainOutfit of his
// look), on one transparent canvas. Loaded only by import('./scene') (the setup's chunk never holds
// three). Its first frames play the landing islands' entrance (hero/islands-time: the cubes rise in
// the wave from the middle, the bim lands last); each later piece comes the same way: the desk pops
// on its cube, a little island per project rises in its own wave, a new look hops, the plane flies.
// No frame while nothing moves; a blink every 7-9 s. Reduced motion: built at once, no hop, no
// plane. Owner: onboarding.
import { Box3, Group, Matrix4, Mesh, Quaternion, Vector3, type BufferGeometry, type Material } from 'three';
import { type Fit, RIGHT, UP, toScreen } from '@/bims/render/camera';
import { makeBim, type Bim } from '@/bims/render/bim';
import { mainOutfit, sameLook, type Look } from '@/bims/render/look';
import { makePlane, type Plane } from '@/bims/render/plane';
import { DAY } from '@/bims/render/palette';
import type { Rig } from '@/bims/render/pose';
import { STYLE } from '@/bims/render/style';
import { makeView } from '@/bims/render/view';
import { castShadows } from '@/bims/render/world';
import { DESK, ISLANDS, SLAB, STAND, facing, spot, type Island, type Prop } from '@/bims/sprites/gags';
import { TO_VIEWER, lerpRig } from '@/bims/sprites/moves';
import { buildIsland, sunOn, type IslandScene } from '@/bims/sprites/scene';
import { type Cell, GRID, cellAt, cellsOf, cubeAt, landAt, planOf as entryPlan, settled, thingAt } from '@/hero/islands-time';
import type { IslandPlan, Pose } from './plan';

export interface IslandView {
  set(p: IslandPlan): void;
  /** the canvas's css size */
  resize(w: number, h: number): void;
  /** css px from the canvas's top left: his bim's head top, each little island's foot (by name) */
  marks(): { head: { x: number; y: number } | null; pods: readonly { name: string; x: number; y: number }[] };
  /** called after each drawn frame (the bubble and the pins follow) */
  onFrame(cb: () => void): void;
  dispose(): void;
}

/** world half-heights: the island alone, the island and its little islands */
const HALF = { close: 2.15, wide: 3.3 } as const;
/** what the camera looks at: the island's middle; with the little islands, a little behind and left */
const AIM = { close: { x: 0, y: 0.45, z: 0 }, wide: { x: -0.45, y: 0.3, z: -0.75 } } as const;
const GLIDE_MS = 900;
const HOP_MS = 450;
const WAVE_MS = 1100;
const MOVE_MS = 550;
const PLANE_MS = 1000;
const SWING_MS = 2400;
const BLINK_MS = 150;
/** a little island's size, and where each stands round his (the page's left, back, right, far left) */
const POD_SCALE = 0.42;
const POD_AT = [spot(-1.95, 0.35), spot(-0.55, -1.95), spot(1.55, -1.45), spot(-2.0, -1.75)];
const POD_PROPS: Prop[][] = [
  [{ kind: 'lamp', ...spot(-0.2, -0.2) }],
  [{ kind: 'pouf', ...spot(0, 0), h: 0.34 }],
  [{ kind: 'beanbag', ...spot(0, -0.1) }],
  [{ kind: 'piano', ...spot(0, -0.2), turn: facing(0, 1), scale: 0.55 }],
];

/** the landing's 'ways' island: a bim on the tiny desk's edge, legs swinging (frames 0-7), held (12) */
const WAYS = ISLANDS[0];
const swingAt = (k: number): Rig => WAYS?.frames[Math.floor(k * 8) % 8]?.bims[0]?.rig ?? STAND;
const SIT: Rig = WAYS?.frames[12]?.bims[0]?.rig ?? STAND;
const STAND_AT: Rig = { ...STAND, ...spot(0.2, 0.3), dir: TO_VIEWER };
/** by the desk: its little window to his left, facing it while the check runs */
const BY_DESK: Rig = { ...STAND, ...spot(0.55, 0.35), dir: TO_VIEWER };
const AT_WINDOW: Rig = { ...BY_DESK, dir: TO_VIEWER + 2.6, head: [0.1, 0, 0] };
const READ: Rig = { ...SIT, armL: [-1.3, 0, 0.3], armR: [-1.3, 0, -0.3], head: [0.25, 0, 0] };

const smooth = (x: number): number => { const k = Math.min(1, Math.max(0, x)); return k * k * (3 - 2 * k); };
const inOut = (x: number): number => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

interface Piece {
  readonly root: Group;
  readonly isl: IslandScene;
  readonly cells: readonly Cell[];
  readonly propCells: readonly Cell[];
  /** its entrance's start (ms, performance.now's clock); -1: built */
  t0: number;
}

const m4 = new Matrix4();
const q0 = new Quaternion();
const p3 = new Vector3();
const s3 = new Vector3();

/** an island of the sprites' kind: a slab (or none: a prop alone on a slab already there), its props each about its foot */
function pieceOf(props: Prop[], o: { top: 'floor' | 'grass'; slab: boolean; x: number; z: number; scale: number; t0: number }): Piece {
  const isl = buildIsland({ id: 'ways', top: o.top, props, frames: [{ bims: [] }], seq: [0], idle: 0, blink: 0 } satisfies Island);
  const root = new Group();
  root.add(isl.root);
  root.position.set(o.x, 0, o.z);
  root.scale.setScalar(o.scale);
  for (const m of isl.slab) {
    m.frustumCulled = false;
    m.visible = o.slab;
  }
  const cells = cellsOf(SLAB.w);
  const box = new Box3();
  const ctr = new Vector3();
  const propCells = isl.props.map((g) => {
    box.setFromObject(g);
    box.getCenter(ctr);
    for (const c of g.children) { c.position.x -= ctr.x; c.position.z -= ctr.z; }
    g.position.set(ctr.x, 0, ctr.z);
    return cellAt(cells, ctr.x, ctr.z);
  });
  return { root, isl, cells, propCells, t0: o.t0 };
}

/** a piece at `now`: its cubes in the wave, its props on their cubes; true while it still moves */
function pieceAt(p: Piece, now: number): boolean {
  const ms = p.t0 < 0 ? Infinity : now - p.t0;
  p.root.visible = ms >= 0;
  if (ms < 0) return true;
  const side = SLAB.w / GRID;
  const done = !Number.isFinite(ms) || settled(ms, p.cells);
  for (const c of p.isl.slab) {
    const y0 = c.userData.y as number;
    p.cells.forEach((cell, i) => {
      const a = done ? { s: 1, y: 0 } : cubeAt(ms, cell.start, side);
      c.setMatrixAt(i, m4.compose(p3.set(cell.x, y0 + a.y, cell.z), q0, s3.setScalar(a.s)));
    });
    c.instanceMatrix.needsUpdate = true;
  }
  let moving = !done;
  p.isl.props.forEach((g, i) => {
    const cell = p.propCells[i];
    if (cell === undefined) return;
    if (!Number.isFinite(ms)) { g.position.y = 0; g.scale.set(1, 1, 1); g.visible = true; return; }
    g.visible = ms >= cell.start;
    const d = thingAt(ms, cell, side);
    g.position.y = d.y;
    g.scale.set(d.s, d.s * d.sy, d.s);
    if (ms < cell.start + 1200) moving = true;
  });
  return moving;
}

function disposePiece(p: Piece): void {
  p.root.removeFromParent();
  p.isl.dispose();
  p.root.traverse((x) => {
    if (!(x instanceof Mesh)) return;
    (x.geometry as BufferGeometry).dispose();
    const m = x.material as Material | Material[];
    for (const y of Array.isArray(m) ? m : [m]) y.dispose();
  });
}

export function mountIsland(canvas: HTMLCanvasElement, o: { readonly enter: boolean; readonly reduced: boolean }): IslandView {
  const view = makeView(canvas, { shadowAuto: true, transparent: true });
  view.sky('#000000');
  view.tint(DAY);
  sunOn(view.sun, 2048);
  const sc = view.sun.shadow.camera;
  sc.left = -6; sc.right = 6; sc.top = 6; sc.bottom = -6;
  sc.updateProjectionMatrix();
  const reduced = o.reduced;
  const born = performance.now();
  const animate = o.enter && !reduced;
  const slab = pieceOf([], { top: 'floor', slab: true, x: 0, z: 0, scale: 1, t0: animate ? born : -1 });
  view.scene.add(slab.root);
  const landMs = animate ? entryPlan(slab.cells, []).bim : 0;
  let desk: Piece | null = null;
  const pods = new Map<string, Piece>();
  let bim: Bim | null = null;
  let look: Look | null | undefined;
  const plane: Plane = makePlane(STYLE);
  plane.setInk(true);
  plane.group.scale.setScalar(0.45);
  castShadows(plane.group);
  plane.group.visible = false;
  view.scene.add(plane.group);

  let plan: IslandPlan | null = null;
  let size = { w: 0, h: 0 };
  let fit: Fit | null = null;
  // the clock of each change (performance.now ms; -1: none)
  let hopAt = -1;
  let poseAt = -1;
  let fromRig: Rig = STAND_AT;
  let pose: Pose = 'stand';
  let wideFrom = 0;
  let wideTo = 0;
  let wideAt = -1;
  let planeAt = -1;
  let glowAt = -1;
  let blinkAt = born + 7000;
  let raf = 0;
  let timer = 0;
  const frameCbs: (() => void)[] = [];
  const head = new Vector3();

  const wideNow = (now: number): number => (wideAt < 0 ? wideTo : wideFrom + (wideTo - wideFrom) * smooth((now - wideAt) / GLIDE_MS));

  const fitAt = (now: number): Fit | null => {
    if (size.w <= 0 || size.h <= 0) return null;
    const k = wideNow(now);
    const half = HALF.close + (HALF.wide - HALF.close) * k;
    const t = { x: AIM.close.x + (AIM.wide.x - AIM.close.x) * k, y: AIM.close.y + (AIM.wide.y - AIM.close.y) * k, z: AIM.close.z + (AIM.wide.z - AIM.close.z) * k };
    const scale = (2 * half) / size.h;
    const hw = (size.w * scale) / 2;
    return { target: t, left: -hw, right: hw, top: half, bottom: -half, scale, widthPx: size.w, heightPx: size.h };
  };

  /** his bim's rig for a pose at `now` (its own little moves: hello's wave, the swing, the laugh when it works) */
  const rigOf = (p: Pose, now: number): Rig => {
    switch (p) {
      case 'stand': {
        const k = (now - born - landMs - 200) / WAVE_MS;
        if (!reduced && animate && k > 0 && k < 1) {
          const up = Math.sin(Math.PI * Math.min(1, k * 1.2));
          return { ...STAND_AT, armR: [0, 0, up * (2.4 - Math.sin(k * 14) * 0.35)], mouth: 'laugh', eyes: up > 0.3 ? 0.3 : 1 };
        }
        return STAND_AT;
      }
      case 'desk': {
        const g = plan?.glow ?? 'off';
        if (g === 'checking') return AT_WINDOW;
        if (g === 'lit') {
          const k = (now - glowAt) / WAVE_MS;
          if (!reduced && glowAt >= 0 && k > 0 && k < 1) return { ...BY_DESK, armR: [0, 0, 2.3 - Math.sin(k * 14) * 0.3], mouth: 'laugh', eyes: 0.3 };
          return { ...BY_DESK, mouth: 'laugh' };
        }
        return BY_DESK;
      }
      case 'sit': {
        const k = (now - poseAt) / SWING_MS;
        return !reduced && k >= 0 && k < 1 ? swingAt(k * 3) : SIT;
      }
      case 'read':
        return READ;
    }
  };

  const draw = (now: number): void => {
    raf = 0;
    let moving = false;
    moving = pieceAt(slab, now) || moving;
    if (desk !== null) {
      moving = pieceAt(desk, now) || moving;
      const g = plan?.glow ?? 'off';
      desk.isl.glow(g === 'lit' ? 1 : g === 'checking' ? (reduced ? 0.5 : 0.35 + 0.35 * Math.sin((now - glowAt) / 110)) : 0);
      if (g === 'checking' && !reduced) moving = true;
    }
    for (const p of pods.values()) moving = pieceAt(p, now) || moving;
    if (bim !== null && plan !== null) {
      let r = rigOf(pose, now);
      // from the last pose to this one: a hop across (none under reduced motion)
      const mk = poseAt < 0 || reduced ? 1 : (now - poseAt) / MOVE_MS;
      if (mk < 1) {
        r = lerpRig(fromRig, r, inOut(Math.max(0, mk)));
        r = { ...r, lift: (r.lift ?? 0) + Math.sin(Math.PI * Math.max(0, mk)) * 0.4 };
        moving = true;
      }
      // the entrance: the bim lands last
      if (animate) {
        const l = landAt(now - born, landMs);
        if (!l.shown) r = { ...r, opacity: 0 };
        else if (now - born < landMs + 400) { r = { ...r, lift: (r.lift ?? 0) + l.y, squash: { k: l.k, at: 0 } }; moving = true; }
      }
      // a new look: one hop on the spot
      const hk = hopAt < 0 || reduced ? 1 : (now - hopAt) / HOP_MS;
      if (hk < 1) {
        const h = Math.sin(Math.PI * Math.min(1, hk / 0.85));
        r = { ...r, lift: (r.lift ?? 0) + 0.28 * h, squash: { k: hk < 0.15 ? 0.25 * Math.sin((Math.PI * hk) / 0.15) : hk > 0.85 ? 0.2 * Math.sin((Math.PI * (hk - 0.85)) / 0.15) : -0.08 * h, at: 0 } };
        moving = true;
      }
      if (!reduced && now >= blinkAt) {
        if (now < blinkAt + BLINK_MS) r = { ...r, eyes: 0.15 };
        else blinkAt = now + 7000 + Math.random() * 2000;
      }
      if (pose === 'stand' || pose === 'sit' || pose === 'desk') moving = moving || (now - poseAt < SWING_MS && !reduced) || (pose === 'stand' && animate && now - born < landMs + 200 + WAVE_MS);
      bim.apply(r);
    }
    // the plane: from the column's side, above, into his hands; then held
    if (plan?.plane === true && bim !== null) {
      bim.hand(head);
      const k = reduced || planeAt < 0 ? 1 : (now - planeAt) / PLANE_MS;
      const from = new Vector3(head.x + RIGHT.x * 3.2 - UP.x * 1.5, head.y + 2.6, head.z + RIGHT.z * 3.2 - UP.z * 1.5);
      const e = inOut(Math.min(1, Math.max(0, k)));
      const at = from.clone().lerp(head, e).add(new Vector3(0, Math.sin(Math.PI * e) * 0.5, 0));
      plane.group.visible = true;
      plane.group.position.copy(at);
      plane.group.rotation.set(-(0.3 - e * 0.6), Math.atan2(head.x - from.x, head.z - from.z), 0, 'YXZ');
      plane.setFold(e >= 1 ? 0.55 : 0);
      if (k < 1) moving = true;
    } else plane.group.visible = false;
    if (wideAt >= 0 && now - wideAt < GLIDE_MS) moving = true;
    fit = fitAt(now);
    if (fit !== null) {
      view.size(fit);
      view.look(fit);
      view.render();
    }
    for (const cb of frameCbs) cb();
    if (moving) frame();
    else if (!reduced) {
      window.clearTimeout(timer);
      timer = window.setTimeout(frame, Math.max(0, blinkAt - performance.now()));
    }
  };
  const frame = (): void => {
    if (raf === 0) raf = requestAnimationFrame(draw);
  };

  const setBim = (l: Look | null): void => {
    if (look !== undefined && sameLook(look, l)) return;
    const had = look !== undefined;
    look = l;
    bim?.group.removeFromParent();
    bim?.dispose();
    bim = makeBim('main', true, STYLE, mainOutfit(l));
    castShadows(bim.group);
    view.scene.add(bim.group);
    if (had) hopAt = performance.now();
  };

  return {
    set(p) {
      const now = performance.now();
      const before = plan;
      plan = p;
      setBim(p.look);
      if (p.desk && desk === null) {
        desk = pieceOf([DESK], { top: 'floor', slab: false, x: 0, z: 0, scale: 1, t0: reduced ? -1 : now - 150 });
        view.scene.add(desk.root);
      }
      if (!p.desk && desk !== null) {
        disposePiece(desk);
        desk = null;
      }
      // the little islands: a new name rises (one after the other), one gone sinks at once
      let i = 0;
      for (const [name, piece] of pods) if (!p.pods.includes(name)) { disposePiece(piece); pods.delete(name); }
      p.pods.forEach((name, k) => {
        if (pods.has(name)) return;
        const at = POD_AT[k % POD_AT.length] ?? { x: 0, z: 0 };
        const piece = pieceOf(POD_PROPS[k % POD_PROPS.length] ?? [], { top: k % 2 === 1 ? 'grass' : 'floor', slab: true, x: at.x, z: at.z, scale: POD_SCALE, t0: reduced ? -1 : now + i * 260 });
        i += 1;
        pods.set(name, piece);
        view.scene.add(piece.root);
      });
      if (p.pose !== pose) {
        fromRig = bim !== null ? rigOf(pose, now) : STAND_AT;
        pose = p.pose;
        poseAt = now;
      }
      if (p.glow !== before?.glow) glowAt = now;
      const w = p.wide ? 1 : 0;
      if (w !== wideTo) { wideFrom = wideNow(now); wideTo = w; wideAt = reduced ? -1 : now; }
      if (p.plane && before?.plane !== true) planeAt = now;
      frame();
    },
    resize(w, h) {
      size = { w: Math.max(0, Math.round(w)), h: Math.max(0, Math.round(h)) };
      frame();
    },
    marks() {
      if (fit === null) return { head: null, pods: [] };
      const f = fit;
      const hd = bim !== null && plan !== null ? toScreen(f, bim.headTop(head)) : null;
      const ps = [...pods.entries()].filter(([, p]) => p.root.visible).map(([name, p]) => ({ name, ...toScreen(f, { x: p.root.position.x, y: -0.15, z: p.root.position.z }) }));
      return { head: hd, pods: ps };
    },
    onFrame(cb) {
      frameCbs.push(cb);
    },
    dispose() {
      if (raf !== 0) cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      disposePiece(slab);
      if (desk !== null) disposePiece(desk);
      for (const p of pods.values()) disposePiece(p);
      bim?.dispose();
      plane.dispose();
      view.dispose();
    },
  };
}
