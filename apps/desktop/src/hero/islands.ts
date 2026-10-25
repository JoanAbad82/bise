// bise.dev's home islands, live (designer's brief, page bims-home v11): the seven little clay islands
// beside the sections' titles drawn in 3D by the hero's own engine (three, the bims, in film.js),
// loaded through the hero entry (hero.ts loadIslands) so they share its chunk. ONE WebGL renderer
// for all of them, off the page: each island on screen that moves is drawn into it, then copied into
// its own transparent 2D canvas on the page (never a context per island); nothing moves, nothing is
// drawn. Per island: an entry like the hero's (islands-time.ts), then its gag (gags.ts), then its
// held pose that blinks every 7-9 s; a hover tilts it toward the pointer (6° at most), the bims'
// heads follow it, and the scene plays its own move once (moves.ts); a tap is a hover; a click on a
// bim hops it. Reduced motion: drawn built, no entry, no tilt, no move, only the heads turn. The
// page (site/bims-islands.ts) places the canvases, says what is on screen and passes the pointer.
// ?herotest: window.__bimsIslands (each frame's cost, a still of any moment for the contact sheet).
// Owner: bims-islands.
import { Box3, type Color, DirectionalLight, HemisphereLight, InstancedMesh, type Material, Matrix4, type Mesh, OrthographicCamera, PCFShadowMap, Quaternion, Scene, Vector3, WebGLRenderer } from 'three';
import { BACK, DIST, RIGHT, UP } from '@/bims/render/camera';
import { DAY } from '@/bims/render/palette';
import { STYLE } from '@/bims/render/style';
import { FPS, type Frame, ISLANDS, type Island, type IslandId, SLAB, type V } from '@/bims/sprites/gags';
import { type Move, gagAt, gagLength, looking, moveOf } from '@/bims/sprites/moves';
import { HALF, type IslandScene, TARGET, buildIsland, sunOn } from '@/bims/sprites/scene';
import { rimmedMaterial } from './entry';
import { GRID, cellsOf, cubeAt, dropAt, landAt, planOf, settled, shadowAt } from './islands-time';

/** css px per office unit (the sprites' sheet: 128 px a unit at 2x) */
const S = Math.round(HALF * 2 * 128) / 2 / (HALF * 2);
/** the tilt toward the pointer, at most */
const TILT = (6 * Math.PI) / 180;
/** the tilt's and the head's ease: ~300 ms to rest */
const EASE_MS = 75;
const BLINK_MS = 150;
const HOP_MS = 450;
/** the sun's shadow map, px */
const SHADOW_PX = 1024;

/** where an island sits on the page: its box (the sprites' size and place), its slab's underside in it, the canvas's room around it */
export interface IslandBox {
  readonly id: IslandId;
  readonly canvas: HTMLCanvasElement;
  /** the island's box, css px */
  readonly w: number;
  readonly h: number;
  /** the slab's underside's four corners in the box, css px (islands.json `under`) */
  readonly under: readonly number[];
  /** the canvas's room past the box (the plane's loop, the notes), css px */
  readonly pad: { readonly l: number; readonly t: number; readonly r: number; readonly b: number };
}

/** a moment to hold still (the contact sheet): the entry at ms, the gag at s, a move at k, the pointer at (x, y) in the box */
export interface Still {
  readonly entry?: number;
  readonly gag?: number;
  readonly move?: number;
  readonly pointer?: readonly [number, number];
}

export interface LiveIsland {
  /** its entry then its gag, once; `done` when it holds its pose */
  play(done: () => void): void;
  /** drawn built, its held pose (played already, reduced motion) */
  hold(): void;
  /** on screen or not: off screen nothing is drawn */
  setOn(on: boolean): void;
  /** the pointer over its box at (x, y) css px; the first one is the hover's start */
  point(x: number, y: number): void;
  leave(): void;
  /** a tap: a hover, let go once its move is over */
  tap(x: number, y: number): void;
  /** a click on its bim: a hop */
  hop(): void;
  /** the page shadow's strength (0 none .. 1 whole) as the slab rises */
  onShadow(fn: (k: number) => void): void;
  still(s: Still): void;
}

export interface LiveIslands {
  add(b: IslandBox): LiveIsland;
  dispose(): void;
}

const m4 = new Matrix4();
const q0 = new Quaternion();
const p3 = new Vector3();
const s3 = new Vector3();
const box = new Box3();
const ctr = new Vector3();
const V_RIGHT = new Vector3(RIGHT.x, RIGHT.y, RIGHT.z);
const V_UP = new Vector3(UP.x, UP.y, UP.z);
const V_BACK = new Vector3(BACK.x, BACK.y, BACK.z);

type Mode = 'wait' | 'entry' | 'rest';

interface Live {
  readonly s: Island;
  readonly b: IslandBox;
  readonly ctx: CanvasRenderingContext2D | null;
  readonly scene: Scene;
  readonly cam: OrthographicCamera;
  readonly isl: IslandScene;
  readonly cubes: readonly InstancedMesh[];
  readonly cells: ReturnType<typeof cellsOf>;
  readonly plan: ReturnType<typeof planOf>;
  readonly move: Move;
  readonly rest: Frame;
  /** the gag's first frame: the bim lands in it */
  readonly first: Frame;
  mode: Mode;
  t0: number;
  done: (() => void) | null;
  on: boolean;
  dirty: boolean;
  /** the pointer in the box (css px), null: away */
  ptr: [number, number] | null;
  /** the last pointer's world point the heads look at */
  look: V;
  head: number;
  tilt: Quaternion;
  tiltTo: Quaternion;
  moveT0: number | null;
  hopT0: number | null;
  blinkAt: number;
  tapUntil: number;
  shadow: ((k: number) => void) | null;
  shadowNow: number;
  still: Still | null;
  w: number;
  h: number;
}

function webgl(): boolean {
  try {
    const c = document.createElement('canvas');
    return c.getContext('webgl2') !== null || c.getContext('webgl') !== null;
  } catch {
    return false;
  }
}

/** the island's box's top-left in the sprites' full view (css px): its slab's underside, projected, less where the box has it */
function originOf(cam: OrthographicCamera, under: readonly number[]): [number, number] {
  const hw = SLAB.w / 2;
  const N = HALF * 2 * S;
  let ox = 0, oy = 0;
  const corners = [[-hw, -hw], [hw, -hw], [hw, hw], [-hw, hw]] as const;
  corners.forEach(([x, z], i) => {
    const p = new Vector3(x, -SLAB.top - SLAB.h + 0.02, z).project(cam);
    ox += ((p.x + 1) / 2) * N - (under[i * 2] ?? 0);
    oy += ((1 - p.y) / 2) * N - (under[i * 2 + 1] ?? 0);
  });
  return [ox / 4, oy / 4];
}

export function mountIslands(o: { readonly reduced: boolean; readonly probe?: boolean }): LiveIslands | null {
  if (!webgl()) return null;
  const glCanvas = document.createElement('canvas');
  const renderer = new WebGLRenderer({ canvas: glCanvas, antialias: STYLE.antialias, alpha: true, powerPreference: 'low-power' });
  renderer.shadowMap.enabled = STYLE.shadows;
  renderer.shadowMap.type = PCFShadowMap;
  renderer.setPixelRatio(1);
  renderer.setClearColor(0x000000, 0);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let glW = 1, glH = 1;
  const lives: Live[] = [];
  const reduced = o.reduced;
  const frames: number[] = [];
  let raf = 0;
  let gone = false;
  let lost = false;
  glCanvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); lost = true; });

  const now = (l: Live): number => (l.still ? 0 : performance.now());

  /** the island's frame now, and its glow */
  function frameOf(l: Live, t: number): { f: Frame; glow: number; busy: boolean } {
    const st = l.still;
    if (st?.entry !== undefined) return { f: l.first, glow: 0, busy: true };
    if (st?.gag !== undefined) return { f: gagAt(l.s, st.gag, FPS), glow: 0, busy: true };
    if (st?.move !== undefined) { const m = l.move.at(st.move); return { f: m.frame, glow: m.glow, busy: true }; }
    if (l.mode === 'entry') {
      const ms = t - l.t0;
      if (ms < l.plan.gag) return { f: l.first, glow: 0, busy: true };
      const g = (ms - l.plan.gag) / 1000;
      if (g < gagLength(l.s, FPS)) return { f: gagAt(l.s, g, FPS), glow: 0, busy: true };
      l.mode = 'rest';
      l.blinkAt = t + 7000 + Math.random() * 2000;
      const d = l.done;
      l.done = null;
      d?.();
    }
    if (l.moveT0 !== null) {
      const k = (t - l.moveT0) / (l.move.s * 1000);
      if (k < 1) { const m = l.move.at(k); return { f: m.frame, glow: m.glow, busy: true }; }
      l.moveT0 = null;
    }
    return { f: l.rest, glow: 0, busy: false };
  }

  /** the entry's slab, props and bim at ms; true while it builds */
  function entryAt(l: Live, ms: number): void {
    const up = settled(ms);
    for (const m of l.isl.slab) m.visible = up;
    for (const c of l.cubes) {
      c.visible = !up;
      if (up) continue;
      l.cells.forEach((cell, i) => {
        const a = cubeAt(ms, cell.start);
        const y = (c.userData.y as number) + a.y;
        c.setMatrixAt(i, m4.compose(p3.set(cell.x, y, cell.z), q0, s3.setScalar(a.s)));
      });
      c.instanceMatrix.needsUpdate = true;
    }
    l.isl.props.forEach((g, i) => {
      const d = dropAt(ms, l.plan.props[i] ?? 0);
      g.position.y = d.y;
      g.scale.set(d.s, d.s * d.sy, d.s);
    });
    setShadow(l, shadowAt(ms, l.cells));
  }

  function built(l: Live): void {
    for (const m of l.isl.slab) m.visible = true;
    for (const c of l.cubes) c.visible = false;
    for (const g of l.isl.props) { g.position.y = 0; g.scale.set(1, 1, 1); }
    setShadow(l, 1);
  }

  function setShadow(l: Live, k: number): void {
    if (Math.abs(k - l.shadowNow) < 1e-3) return;
    l.shadowNow = k;
    l.shadow?.(k);
  }

  /** the pointer's world point the heads look at: on the plane through the island's middle, pulled toward the viewer */
  function lookOf(l: Live, x: number, y: number): V {
    const c = l.cam;
    const u = (x + l.b.pad.l) / l.w;
    const v = (y + l.b.pad.t) / l.h;
    const cx = c.left + u * (c.right - c.left);
    const cy = c.top - v * (c.top - c.bottom);
    const p = TARGET.clone().addScaledVector(V_RIGHT, cx).addScaledVector(V_UP, cy).addScaledVector(V_BACK, 3);
    return [p.x, p.y, p.z];
  }

  function tiltOf(l: Live, x: number, y: number, out: Quaternion): Quaternion {
    if (reduced) return out.identity();
    const nx = Math.max(-1, Math.min(1, (x - l.b.w / 2) / (l.b.w / 2)));
    const ny = Math.max(-1, Math.min(1, (l.b.h / 2 - y) / (l.b.h / 2)));
    const v = V_RIGHT.clone().multiplyScalar(nx).addScaledVector(V_UP, ny);
    const n = Math.min(1, v.length());
    if (n < 1e-4) return out.identity();
    const axis = new Vector3().crossVectors(V_BACK, v).normalize();
    return out.setFromAxisAngle(axis, TILT * n);
  }

  /** one island's state now; true while it still moves */
  function step(l: Live, t: number, dt: number): boolean {
    const st = l.still;
    let moving = false;
    if (st?.entry !== undefined) entryAt(l, st.entry);
    else if (l.mode === 'entry') { entryAt(l, t - l.t0); moving = true; }
    else if (l.mode === 'rest') built(l);
    const { f, glow, busy } = frameOf(l, t);
    moving ||= busy;
    // the tilt and the heads ease toward the pointer, back to rest when it leaves
    const a = st ? 1 : 1 - Math.exp(-dt / EASE_MS);
    if (st?.pointer) { tiltOf(l, st.pointer[0], st.pointer[1], l.tiltTo); l.look = lookOf(l, st.pointer[0], st.pointer[1]); }
    else if (st) l.tiltTo.identity();
    const headTo = (st ? st.pointer !== undefined : l.ptr !== null) ? 1 : 0;
    l.tilt.slerp(l.tiltTo, a);
    l.head += (headTo - l.head) * a;
    if (Math.abs(l.head - headTo) < 0.002) l.head = headTo;
    if (l.tilt.angleTo(l.tiltTo) < 1e-4) l.tilt.copy(l.tiltTo);
    else moving = true;
    if (l.head !== headTo) moving = true;
    l.isl.root.quaternion.copy(l.tilt);
    // the heads: all of it at rest, a little during a move (the move's own look leads)
    let fr = looking(f, l.look, l.head * (busy ? 0.35 : 1));
    // the entry: no bim before it lands, then its fall and squash
    const ms = st?.entry ?? (l.mode === 'entry' ? t - l.t0 : null);
    const land = ms !== null && ms < l.plan.gag ? landAt(ms, l.plan.bim) : null;
    const hop = l.hopT0 !== null && !st ? (t - l.hopT0) / HOP_MS : 1;
    if (hop >= 1) l.hopT0 = null;
    else moving = true;
    const blink = !st && l.mode === 'rest' && !busy && t >= l.blinkAt;
    if (blink && t >= l.blinkAt + BLINK_MS) l.blinkAt = t + 7000 + Math.random() * 2000;
    if (land || hop < 1 || blink || l.mode === 'wait') {
      fr = {
        ...fr,
        bims: fr.bims.map((b) => {
          let r = b.rig;
          if (l.mode === 'wait' && !st) r = { ...r, opacity: 0 };
          if (land) r = land.shown ? { ...r, lift: (r.lift ?? 0) + land.y, squash: { k: land.k, at: 0 } } : { ...r, opacity: 0 };
          if (hop < 1) {
            const h = Math.sin(Math.PI * Math.min(1, hop / 0.85));
            r = { ...r, lift: (r.lift ?? 0) + 0.28 * h, squash: { k: hop < 0.15 ? 0.25 * Math.sin((Math.PI * hop) / 0.15) : hop > 0.85 ? 0.2 * Math.sin((Math.PI * (hop - 0.85)) / 0.15) : -0.08 * h, at: 0 } };
          }
          if (blink) r = { ...r, eyes: 0.15 };
          return { ...b, rig: r };
        }),
      };
    }
    if (land && !land.shown) fr = { bims: fr.bims };
    l.isl.pose(fr);
    l.isl.glow(glow);
    return moving;
  }

  function draw(l: Live): void {
    const cw = Math.round(l.w * dpr), ch = Math.round(l.h * dpr);
    if (cw > glW || ch > glH) {
      glW = Math.max(glW, cw);
      glH = Math.max(glH, ch);
      renderer.setSize(glW, glH, false);
    }
    renderer.setViewport(0, 0, cw, ch);
    renderer.setScissor(0, 0, cw, ch);
    renderer.setScissorTest(true);
    renderer.clear();
    renderer.render(l.scene, l.cam);
    const ctx = l.ctx;
    if (!ctx) return;
    if (l.b.canvas.width !== cw || l.b.canvas.height !== ch) { l.b.canvas.width = cw; l.b.canvas.height = ch; }
    ctx.clearRect(0, 0, cw, ch);
    // the drawing buffer's rows start at its bottom
    ctx.drawImage(glCanvas, 0, glH - ch, cw, ch, 0, 0, cw, ch);
  }

  let last = performance.now();
  function tick(): void {
    raf = 0;
    if (gone || lost) return;
    const t = performance.now();
    const dt = Math.min(100, t - last);
    last = t;
    let again = false;
    const t0 = performance.now();
    let drew = false;
    for (const l of lives) {
      if (!l.on && !l.still) continue;
      if (l.mode === 'wait' && !l.still) continue;
      const before = l.dirty;
      l.dirty = false;
      const moving = step(l, now(l), dt);
      if (moving || before) { draw(l); drew = true; }
      if (moving) again = true;
      // a blink to come: wake for it
      if (!moving && l.mode === 'rest' && !reduced && !l.still) wakeAt(l.blinkAt);
    }
    if (o.probe && drew) { frames.push(performance.now() - t0); if (frames.length > 2000) frames.shift(); }
    if (again) kick();
  }
  let timer = 0;
  let timerAt = Infinity;
  function wakeAt(t: number): void {
    if (t >= timerAt) return;
    clearTimeout(timer);
    timerAt = t;
    timer = window.setTimeout(() => { timerAt = Infinity; for (const l of lives) if (l.on && l.mode === 'rest') l.dirty = true; kick(); }, Math.max(0, t - performance.now()));
  }
  function kick(): void {
    if (raf || gone) return;
    raf = requestAnimationFrame(tick);
  }

  function build(b: IslandBox): Live {
    const s = ISLANDS.find((x) => x.id === b.id);
    if (!s) throw new Error(`no island ${b.id}`);
    const scene = new Scene();
    const hemi = new HemisphereLight();
    const sun = new DirectionalLight();
    hemi.color.set(DAY.hemi[0]);
    hemi.groundColor.set(DAY.hemi[1]);
    hemi.intensity = DAY.hemi[2];
    sun.color.set(DAY.sun[0]);
    sun.intensity = DAY.sun[1];
    sunOn(sun, SHADOW_PX);
    scene.add(hemi, sun, sun.target);
    const cam = new OrthographicCamera(-HALF, HALF, HALF, -HALF, 0.1, DIST * 3);
    cam.position.set(TARGET.x + BACK.x * DIST, TARGET.y + BACK.y * DIST, TARGET.z + BACK.z * DIST);
    cam.up.set(0, 1, 0);
    cam.lookAt(TARGET);
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
    const [ox, oy] = originOf(cam, b.under);
    const { l: pl, t: pt, r: pr, b: pb } = b.pad;
    cam.left = -HALF + (ox - pl) / S;
    cam.right = -HALF + (ox + b.w + pr) / S;
    cam.top = HALF - (oy - pt) / S;
    cam.bottom = HALF - (oy + b.h + pb) / S;
    cam.updateProjectionMatrix();

    const isl = buildIsland(s);
    scene.add(isl.root);
    // each prop about its own foot: it drops and squashes in place
    for (const g of isl.props) {
      box.setFromObject(g);
      box.getCenter(ctr);
      for (const c of g.children) { c.position.x -= ctr.x; c.position.z -= ctr.z; }
      g.position.set(ctr.x, 0, ctr.z);
    }
    // the slab as cubes while it rises: the dirt (rimmed: its inner sides the top's colour) and its top
    const cells = cellsOf(SLAB.w);
    const c = SLAB.w / GRID;
    const centre = { value: { x: 0, y: 0 } };
    const cubes = isl.slab.map((m: Mesh) => {
      box.setFromObject(m);
      const hgt = box.max.y - box.min.y;
      const mat = m.material as Material;
      const top = isl.slab[1]?.material as Material & { color: Color };
      const im = new InstancedMesh(STYLE.box(c, hgt, c, Math.min(0.06, hgt * 0.3)), m === isl.slab[0] ? rimmedMaterial(mat, top.color, centre) : mat, cells.length);
      im.userData.y = (box.max.y + box.min.y) / 2;
      im.castShadow = false;
      im.receiveShadow = true;
      im.frustumCulled = false;
      im.visible = false;
      isl.root.add(im);
      return im;
    });
    const rest = s.frames[s.idle] ?? s.frames[0];
    const first = s.frames[s.seq[0] ?? 0] ?? rest;
    if (!rest || !first) throw new Error(`${s.id}: no frames`);
    const w = b.w + pl + pr, h = b.h + pt + pb;
    b.canvas.style.width = `${String(w)}px`;
    b.canvas.style.height = `${String(h)}px`;
    return {
      s, b, ctx: b.canvas.getContext('2d'), scene, cam, isl, cubes, cells, plan: planOf(s.props.length), move: moveOf(s), rest, first,
      mode: 'wait', t0: 0, done: null, on: false, dirty: true, ptr: null, look: [0, 1, 3], head: 0,
      tilt: new Quaternion(), tiltTo: new Quaternion(), moveT0: null, hopT0: null, blinkAt: Infinity, tapUntil: 0,
      shadow: null, shadowNow: -1, still: null, w, h,
    };
  }

  const api: LiveIslands = {
    add(b) {
      const l = build(b);
      lives.push(l);
      const handle: LiveIsland = {
        play(done) {
          if (reduced) { handle.hold(); done(); return; }
          l.mode = 'entry';
          l.t0 = performance.now();
          l.done = done;
          l.dirty = true;
          kick();
        },
        hold() {
          l.mode = 'rest';
          l.blinkAt = performance.now() + 7000 + Math.random() * 2000;
          built(l);
          l.dirty = true;
          kick();
        },
        setOn(on) {
          l.on = on;
          if (on) { l.dirty = true; last = performance.now(); kick(); }
        },
        point(x, y) {
          const first = l.ptr === null;
          l.ptr = [x, y];
          l.look = lookOf(l, x, y);
          tiltOf(l, x, y, l.tiltTo);
          // a new hover plays the scene's move once, never over one still playing
          if (first && !reduced && l.mode === 'rest' && l.moveT0 === null) l.moveT0 = performance.now();
          kick();
        },
        leave() {
          l.ptr = null;
          l.tiltTo.identity();
          kick();
        },
        tap(x, y) {
          handle.leave();
          handle.point(x, y);
          const until = performance.now() + l.move.s * 1000 + 400;
          l.tapUntil = until;
          window.setTimeout(() => { if (l.tapUntil === until) handle.leave(); }, until - performance.now());
        },
        hop() {
          if (reduced || l.hopT0 !== null) return;
          l.hopT0 = performance.now();
          kick();
        },
        onShadow(fn) {
          l.shadow = fn;
          fn(l.mode === 'wait' ? 0 : Math.max(0, l.shadowNow));
        },
        still(st) {
          l.still = st;
          l.tilt.identity();
          l.head = 0;
          if (st.entry === undefined) built(l);
          step(l, 0, 16);
          draw(l);
        },
      };
      return handle;
    },
    dispose() {
      gone = true;
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      for (const l of lives) l.isl.dispose();
      renderer.dispose();
    },
  };
  if (o.probe) (window as unknown as { __bimsIslands: unknown }).__bimsIslands = { frames, gl: () => renderer.info.render, contexts: 1 };
  return api;
}
