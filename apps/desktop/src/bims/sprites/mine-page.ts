// The "your bim" studio's page (mine.html): what scripts/bims-mine.mts calls through window.mine.
// Draws main's bim (his own: the ink hoodie, its :* and gold chain) with a look of his pick (look.ts:
// skin, hair, hair colour, what it wears on its head, through mainOutfit and makeBim, as the app does) the ways the app shows it: near (3/4, the
// onboarding's and settings' picker), the coin's head and shoulders (app/side3d/render.ts's view
// and sun), and the office fit's size. Studios only, never the app. Owner: bim-pick.
import { Box3, Group, type Object3D, Vector3 } from 'three';
import { type Bim, makeBim } from '../render/bim';
import { RIGHT, UP, type Fit } from '../render/camera';
import { HEAD_Y } from '../render/laptop';
import { DAY, NIGHT } from '../render/palette';
import { type Look, mainOutfit } from '../render/look';
import { NO_PROPS, type Rig, rigOf } from '../render/pose';
import { posesOf } from '../render/outfits.testkit';
import { STYLE } from '../render/style';
import { makeView } from '../render/view';
import { castShadows, lightOffice } from '../render/world';
import type { Pose } from '../model';

function bimOf(l: Look): Bim {
  return makeBim('main', true, STYLE, mainOutfit(l));
}

const STAND: Rig = (() => {
  const p = posesOf(false, 1.3).find((x) => x.id === 'terrace');
  const r = p?.frames[0]?.rig;
  if (!r) throw new Error('no terrace pose');
  return { ...r, x: 0, z: 0, dir: 0, y: 0, body: [0, 0, 0], head: [0, 0, 0], armL: [0, 0, 0.12], armR: [0, 0, -0.12], legL: 0, legR: 0, eyes: 1, mouth: 'smile', props: NO_PROPS, opacity: 1, grey: 0 };
})();

/** the picker's picture: the bim from 3/4 front, waist up, on a transparent ground */
function near(l: Look, size: number, night: boolean): string {
  const canvas = document.createElement('canvas');
  const view = makeView(canvas, { shadowAuto: true, transparent: true });
  view.renderer.setPixelRatio(1);
  view.renderer.setSize(size, size, false);
  view.tint(night ? NIGHT : DAY);
  view.sky('#000000');
  const sun = view.sun;
  sun.position.set(-2, 6, 5);
  sun.target.position.set(0, 0, 0);
  const { camera, scene } = view;
  const target = new Vector3(0, 0.82, 0);
  camera.position.set(0, target.y + Math.sin(0.2) * 10, Math.cos(0.2) * 10);
  camera.lookAt(target);
  const half = 0.62;
  camera.left = -half; camera.right = half; camera.top = half; camera.bottom = -half;
  camera.near = 0.1; camera.far = 30;
  camera.updateProjectionMatrix();
  const root = new Group();
  scene.add(root);
  const b = bimOf(l);
  castShadows(b.group);
  b.apply(STAND);
  b.detail(true);
  b.daylight(night ? 0 : 1);
  b.group.rotation.y = -0.55;
  root.add(b.group);
  view.render();
  const url = canvas.toDataURL('image/png');
  b.dispose();
  view.dispose();
  return url;
}

/** the coin's head and shoulders (app/side3d/render.ts headPng: its view, sun, pose and fit) */
const FACE = Math.PI / 4;
const BUST = 0.55;
const AIR = 0.06;
function standing(): Pose {
  const spot = { x: 0, z: 0, wz: 0, ax: 0, face: FACE };
  const act = { k: 'visit', at: 'desk' } as const;
  return { x: 0, z: 0, dir: FACE, moving: false, since: 30, seg: { t: 0, act, sig: act.k, spot, path: { pts: [spot], seg: [], len: 0 }, speed: 2.4, from: null } };
}
function squareFit(b: Box3, size: number): Fit {
  const target = { x: (b.min.x + b.max.x) / 2, y: (b.min.y + b.max.y) / 2, z: (b.min.z + b.max.z) / 2 };
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) {
    const p = { x: x - target.x, y: y - target.y, z: z - target.z };
    const u = p.x * RIGHT.x + p.y * RIGHT.y + p.z * RIGHT.z;
    const v = p.x * UP.x + p.y * UP.y + p.z * UP.z;
    x0 = Math.min(x0, u); x1 = Math.max(x1, u); y0 = Math.min(y0, v); y1 = Math.max(y1, v);
  }
  const half = (Math.max(x1 - x0, y1 - y0) * (1 + 2 * AIR)) / 2;
  const cx = (x0 + x1) / 2;
  const cy = y0 + half;
  return { target, left: cx - half, right: cx + half, top: cy + half, bottom: cy - half, scale: (2 * half) / size, widthPx: size, heightPx: size };
}
function coin(l: Look, px: number, night: boolean): string {
  const v = makeView(document.createElement('canvas'), { shadowAuto: true, transparent: true });
  v.sky('#000000');
  v.renderer.setPixelRatio(1);
  lightOffice(v.hemi, v.sun, night ? NIGHT : DAY, { x0: -1, W: 2, D: 2 } as unknown as Parameters<typeof lightOffice>[3], STYLE);
  v.sun.position.set(-5, 14, 3);
  v.sun.target.position.set(0, 0, 0);
  const bim = bimOf(l);
  bim.detail(true);
  bim.daylight(night ? 0 : 1);
  bim.apply(rigOf({ pose: standing(), t: 30, main: true, phase: 0, reduced: true }));
  bim.group.updateMatrixWorld(true);
  let head: Object3D | undefined;
  bim.group.traverse((o) => {
    if (head === undefined && o.children.length > 0 && Math.abs(o.position.y - HEAD_Y) < 1e-6) head = o;
  });
  const box = new Box3().setFromObject(head ?? bim.group, true);
  box.min.y -= (box.max.y - box.min.y) * BUST;
  v.scene.add(bim.group);
  const fit = squareFit(box, px * 2);
  v.renderer.setSize(fit.widthPx, fit.heightPx, false);
  v.look(fit);
  v.render();
  const url = v.renderer.domElement.toDataURL('image/png');
  bim.dispose();
  v.dispose();
  return url;
}

declare global {
  interface Window {
    mine: {
      near(l: Look, size: number, night: boolean): string;
      coin(l: Look, px: number, night: boolean): string;
    };
  }
}

window.mine = { near, coin };
