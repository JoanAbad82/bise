// The studio that draws bise.dev's home islands into sprites (gags.ts, scene.ts: the same scene the
// hero bundle's live islands draw), in the town's 2:1 iso camera and the day palette's fixed light,
// with the clay's soft sun shadow, on a transparent ground. Off screen, one canvas: the island alone
// (its base), then each frame with its bims, cropped to where any frame differs from the base;
// scripts/bims-sprites.mts packs them into WebP, the page's no-WebGL fallback. Owner: bims-islands.
import { Vector3 } from 'three';
import { BACK, DIST } from '../render/camera';
import { DAY } from '../render/palette';
import { makeView } from '../render/view';
import { type Island, SLAB } from './gags';
import { HALF, SCENE_COLOURS, TARGET, buildIsland, seen, sunOn } from './scene';

/** px per office unit on the sheet (2x: 64 css px a unit, the island ~200 css px wide) */
export const PX = 128;
/** every colour the studio adds to the app's (the palette law checks them: never the accent pink or the error red) */
export const STUDIO_COLOURS: readonly string[] = SCENE_COLOURS;

export interface Box { readonly x: number; readonly y: number; readonly w: number; readonly h: number }

export interface Drawn {
  /** the island alone, cropped to its ink */
  readonly base: HTMLCanvasElement;
  /** each frame's box in the base (px, 2x), the same for all */
  readonly at: Box;
  readonly frames: HTMLCanvasElement[];
  /** the bims' own box in their frame at the held pose (px, 2x): their hit area */
  readonly hit: Box;
  /** the slab's underside's four corners in the base (px, 2x): its shadow on the page */
  readonly under: readonly number[];
}

export function drawIsland(s: Island): Drawn {
  const N = Math.round(HALF * 2 * PX);
  const canvas = document.createElement('canvas');
  canvas.width = N;
  canvas.height = N;
  const view = makeView(canvas, { shadowAuto: true, transparent: true });
  view.renderer.setPixelRatio(1);
  view.renderer.setSize(N, N, false);
  view.tint(DAY);
  view.sky(DAY.bg);
  sunOn(view.sun, 2048);
  const { camera, scene } = view;
  camera.position.set(TARGET.x + BACK.x * DIST, TARGET.y + BACK.y * DIST, TARGET.z + BACK.z * DIST);
  camera.up.set(0, 1, 0);
  camera.lookAt(TARGET);
  camera.left = -HALF; camera.right = HALF; camera.top = HALF; camera.bottom = -HALF;
  camera.near = 0.1; camera.far = DIST * 3;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();

  const isl = buildIsland(s);
  scene.add(isl.root);
  const island = [...isl.slab, ...isl.props];
  const first = s.frames[0];
  if (!first) throw new Error(`${s.id}: no frames`);
  const pose = (i: number): void => { isl.pose(s.frames[i] ?? first); };

  const grab = (): HTMLCanvasElement => {
    view.render();
    const c = document.createElement('canvas');
    c.width = N;
    c.height = N;
    c.getContext('2d')?.drawImage(canvas, 0, 0);
    return c;
  };
  const moving = [...isl.bims.map((b) => b.group), isl.movers];
  // the base: the island with the held pose's shadows on it, the bims and their bits unseen (they still cast)
  pose(s.idle);
  seen(moving, false);
  const base = grab();
  seen(moving, true);
  const pixels = (c: HTMLCanvasElement): Uint8ClampedArray => c.getContext('2d')?.getImageData(0, 0, N, N).data ?? new Uint8ClampedArray(0);
  const basePx = pixels(base);

  // the frames: the bims and their bits alone, the island unseen but still in front where it is
  seen(island, false);
  const full: HTMLCanvasElement[] = [];
  for (let i = 0; i < s.frames.length; i++) {
    pose(i);
    seen(moving, true);
    full.push(grab());
  }
  seen(island, true);
  // the frames' box: what any of them draws, a few px around it
  const drawnBox = (c: HTMLCanvasElement): Box => boxOf(pixels(c), N, (d, i) => (d[i + 3] ?? 0) > 8);
  const at = growBox(full.map(drawnBox).reduce(union), 4, N);
  const hit0 = drawnBox(full[s.idle] ?? base);
  const ink = growBox(boxOf(basePx, N, (d, i) => (d[i + 3] ?? 0) > 8), 2, N);
  const all = union(ink, at);
  const crop = (c: HTMLCanvasElement, r: Box): HTMLCanvasElement => {
    const o = document.createElement('canvas');
    o.width = r.w;
    o.height = r.h;
    o.getContext('2d')?.drawImage(c, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h);
    return o;
  };
  // the slab's underside, projected into the base's pixels
  const under: number[] = [];
  const hw = SLAB.w / 2;
  for (const [x, z] of [[-hw, -hw], [hw, -hw], [hw, hw], [-hw, hw]] as const) {
    const p = new Vector3(x, -SLAB.top - SLAB.h + 0.02, z).project(camera);
    under.push(Math.round(((p.x + 1) / 2) * N - all.x), Math.round(((1 - p.y) / 2) * N - all.y));
  }
  const drawn: Drawn = {
    base: crop(base, all),
    at: { x: at.x - all.x, y: at.y - all.y, w: at.w, h: at.h },
    frames: full.map((c) => crop(c, at)),
    hit: { x: hit0.x - at.x, y: hit0.y - at.y, w: hit0.w, h: hit0.h },
    under,
  };
  isl.dispose();
  view.dispose();
  return drawn;
}

function boxOf(d: Uint8ClampedArray, n: number, on: (d: Uint8ClampedArray, i: number) => boolean): Box {
  let x0 = n, y0 = n, x1 = -1, y1 = -1;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (!on(d, (y * n + x) * 4)) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  return x1 < 0 ? { x: 0, y: 0, w: 0, h: 0 } : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

function union(a: Box, b: Box): Box {
  if (a.w === 0) return b;
  if (b.w === 0) return a;
  const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
}

function growBox(a: Box, k: number, n: number): Box {
  const x = Math.max(0, a.x - k), y = Math.max(0, a.y - k);
  // even sizes: the css size is half of it
  const w = Math.min(n - x, a.w + 2 * k), h = Math.min(n - y, a.h + 2 * k);
  return { x, y, w: w - (w % 2), h: h - (h % 2) };
}
