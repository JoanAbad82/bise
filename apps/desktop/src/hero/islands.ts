// bise.dev's home islands, live (designer's brief, page bims-home v11): the seven little clay islands
// beside the sections' titles drawn in 3D by the hero's own engine (three, the bims, in film.js),
// loaded through the hero entry (hero.ts loadIslands) so they share its chunk. ONE WebGL renderer
// for all of them, off the page (an OffscreenCanvas): each island on screen that moves is drawn into
// it, then handed whole to its own transparent canvas on the page (one size for all; never a
// context per island); nothing moves, nothing is drawn. Per island: an entry like the hero's (islands-time.ts), then its gag (gags.ts), then its
// held pose that blinks every 7-9 s; a hover tilts it toward the pointer (6° at most), the bims'
// heads follow it, and the scene plays its own move once (moves.ts); a tap is a hover; a click on a
// bim hops it. Reduced motion: drawn built, no entry, no tilt, no move, only the heads turn. The
// page (site/bims-islands.ts) places the canvases, says what is on screen and passes the pointer.
// ?herotest: window.__bimsIslands (each frame's cost, a still of any moment for the contact sheet).
// Owner: bims-islands.
import { Box3, DirectionalLight, HemisphereLight, Matrix4, OrthographicCamera, PCFShadowMap, Quaternion, Scene, Vector3, WebGLRenderer } from 'three';
import { BACK, DIST, RIGHT, UP } from '@/bims/render/camera';
import { DAY } from '@/bims/render/palette';
import { STYLE } from '@/bims/render/style';
import { FPS, type Frame, ISLANDS, type Island, type IslandId, SLAB, type V } from '@/bims/sprites/gags';
import { type Move, gagAt, gagLength, looking, moveOf } from '@/bims/sprites/moves';
import { HALF, type IslandScene, TARGET, buildIsland, sunOn } from '@/bims/sprites/scene';
import { type Cell, GRID, cellAt, cellsOf, cubeAt, landAt, planOf, settled, shadowAt, thingAt } from './islands-time';

/** css px per office unit (the sprites' sheet: 128 px a unit at 2x) */
const S = Math.round(HALF * 2 * 128) / 2 / (HALF * 2);
/** the tilt toward the pointer, at most */
const TILT = (6 * Math.PI) / 180;
/** the tilt's and the head's ease: ~300 ms to rest */
const EASE_MS = 75;
const BLINK_MS = 150;
const HOP_MS = 450;
/** every island's canvas, css px: the largest island (islands.json) and its room (site/bims-islands.ts ROOM) fit in it */
const CANVAS = { w: 300, h: 330 } as const;
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
  /** where its frame goes: handed over whole (the renderer off the page, no copy), or copied (no OffscreenCanvas) */
  readonly out: { readonly kind: 'bitmap'; readonly ctx: ImageBitmapRenderingContext } | { readonly kind: '2d'; readonly ctx: CanvasRenderingContext2D } | null;
  readonly scene: Scene;
  readonly cam: OrthographicCamera;
  readonly isl: IslandScene;
  readonly cells: readonly Cell[];
  /** the cube each prop stands on: it comes with it */
  readonly propCells: readonly Cell[];
  /** a cube's side */
  readonly side: number;
  readonly plan: ReturnType<typeof planOf>;
  readonly move: Move;
  readonly rest: Frame;
  /** the gag's first frame: the bim lands in it */
  readonly first: Frame;
  mode: Mode;
  /** its ground and props at their places (no need to set them again) */
  risen: boolean;
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
  // the renderer's canvas, off the page: an OffscreenCanvas hands each island its frame whole
  // (transferToImageBitmap, no copy back from the GPU); without one, a canvas the frames are copied from
  const off = typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(1, 1) : null;
  const glCanvas = off ?? document.createElement('canvas');
  const renderer = new WebGLRenderer({ canvas: glCanvas, antialias: STYLE.antialias, alpha: true, powerPreference: 'low-power' });
  renderer.shadowMap.enabled = STYLE.shadows;
  renderer.shadowMap.type = PCFShadowMap;
  renderer.setPixelRatio(1);
  renderer.setClearColor(0x000000, 0);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  /** every island's canvas: one size (the renderer's), its box placed in it by its own room */
  const cw = Math.round(CANVAS.w * dpr), ch = Math.round(CANVAS.h * dpr);
  renderer.setSize(cw, ch, false);
  const lives: Live[] = [];
  const reduced = o.reduced;
  const frames: number[] = [];
  let raf = 0;
  let gone = false;
  let lost = false;
  glCanvas.addEventListener('webglcontextlost', (e: Event) => { e.preventDefault(); lost = true; });

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

  /** the ground's cubes at ms of the hero's wave (at rest: each at its place, scale 1) */
  function cubesAt(l: Live, ms: number | null): void {
    for (const c of l.isl.slab) {
      const y0 = c.userData.y as number;
      l.cells.forEach((cell, i) => {
        const a = ms === null ? { s: 1, y: 0 } : cubeAt(ms, cell.start, l.side);
        c.setMatrixAt(i, m4.compose(p3.set(cell.x, y0 + a.y, cell.z), q0, s3.setScalar(a.s)));
      });
      c.instanceMatrix.needsUpdate = true;
    }
  }

  /** the entry at ms: the ground's cubes in the wave, each prop on its cube, the page shadow with them */
  function entryAt(l: Live, ms: number): void {
    cubesAt(l, settled(ms, l.cells) ? null : ms);
    l.isl.props.forEach((g, i) => {
      const cell = l.propCells[i];
      if (!cell) return;
      const d = thingAt(ms, cell, l.side);
      g.position.y = d.y;
      g.scale.set(d.s, d.s * d.sy, d.s);
    });
    setShadow(l, shadowAt(ms, l.cells));
  }

  /** built: what rose is what holds (the cubes stay, no other slab) */
  function built(l: Live): void {
    if (l.risen) return;
    l.risen = true;
    cubesAt(l, null);
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
    renderer.render(l.scene, l.cam);
    const o = l.out;
    if (!o) return;
    if (o.kind === 'bitmap' && off) {
      o.ctx.transferFromImageBitmap(off.transferToImageBitmap());
      return;
    }
    if (o.kind === '2d') {
      o.ctx.clearRect(0, 0, cw, ch);
      o.ctx.drawImage(glCanvas, 0, 0);
    }
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
    // its room: the page's on the left and the top, the rest of the one canvas size on the right and the bottom
    const { l: pl, t: pt } = b.pad;
    const pr = Math.max(b.pad.r, CANVAS.w - b.w - pl);
    const pb = Math.max(b.pad.b, CANVAS.h - b.h - pt);
    if (b.w + pl + pr > CANVAS.w || b.h + pt + pb > CANVAS.h) throw new Error(`${b.id}: ${String(b.w)}x${String(b.h)} and its room past the islands' canvas`);
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
    // the ground: the scene's own cubes (scene.ts slabOn, in cellsOf's order); the wave moves them
    const cells = cellsOf(SLAB.w);
    const c = SLAB.w / GRID;
    for (const m of isl.slab) m.frustumCulled = false;
    const propCells = isl.props.map((g) => cellAt(cells, g.position.x, g.position.z));
    const rest = s.frames[s.idle] ?? s.frames[0];
    const first = s.frames[s.seq[0] ?? 0] ?? rest;
    if (!rest || !first) throw new Error(`${s.id}: no frames`);
    const w = CANVAS.w, h = CANVAS.h;
    b.canvas.style.width = `${String(w)}px`;
    b.canvas.style.height = `${String(h)}px`;
    b.canvas.width = cw;
    b.canvas.height = ch;
    const bm = off ? b.canvas.getContext('bitmaprenderer') : null;
    const c2 = bm ? null : b.canvas.getContext('2d');
    const out: Live['out'] = bm ? { kind: 'bitmap', ctx: bm } : c2 ? { kind: '2d', ctx: c2 } : null;
    return {
      s, b, out, scene, cam, isl, cells, propCells, side: c, plan: planOf(cells, propCells), move: moveOf(s), rest, first,
      mode: 'wait', risen: false, t0: 0, done: null, on: false, dirty: true, ptr: null, look: [0, 1, 3], head: 0,
      tilt: new Quaternion(), tiltTo: new Quaternion(), moveT0: null, hopT0: null, blinkAt: Infinity, tapUntil: 0,
      shadow: null, shadowNow: -1, still: null, w, h,
    };
  }

  /**
   * An island's programs compiled before it first draws (its cubes, its gag's and its move's bits made
   * now: their pools grow on first use), one island per idle moment: the entry's first frame never
   * stalls on a shader.
   */
  const warming: Live[] = [];
  const warmNext = (): void => {
    const l = warming.shift();
    if (!l || gone) return;
    for (const f of l.s.frames) l.isl.pose(f);
    for (let k = 0.05; k < 1; k += 0.1) l.isl.pose(l.move.at(k).frame);
    l.isl.pose(l.rest);
    renderer.compile(l.scene, l.cam);
    if (warming.length > 0) later(warmNext);
  };
  const later = (f: () => void): void => {
    // Safari has no requestIdleCallback
    if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(f, { timeout: 1000 });
    else setTimeout(f, 50);
  };

  const api: LiveIslands = {
    add(b) {
      const l = build(b);
      lives.push(l);
      warming.push(l);
      if (warming.length === 1) later(warmNext);
      const handle: LiveIsland = {
        play(done) {
          if (reduced) { handle.hold(); done(); return; }
          const w = warming.indexOf(l);
          if (w >= 0) { warming.splice(w, 1); warming.unshift(l); warmNext(); }
          l.mode = 'entry';
          l.risen = false;
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
          l.risen = false;
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
