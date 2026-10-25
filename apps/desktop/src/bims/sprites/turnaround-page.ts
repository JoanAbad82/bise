// The turnaround studio's page (turnaround.html): what scripts/bims-turnaround.mts calls through
// window.turnaround. One sheet per women's cut (docs/brand/bims.md "women among the bims"): a row per
// headwear it may wear, each in another outfit (the hoodie first: its hood from the back), seen near
// from the front, 3/4, the side, 3/4 back and the back, then at the home islands' size and at the
// office fit's; a last row turns the head to the poses' widest angles, seen from 3/4 back over the
// hoodie (the hood, the collar, the headset). The day palette's fixed light, the clay's sun shadow.
// Studios only, never the app. Owner: bims-girls.
import { Group, Vector3 } from 'three';
import { type Bim, makeBim } from '../render/bim';
import { CUTS, CUT_HATS, type Cut, type HeadWear, KINDS, type Kind, outfitOf } from '../render/palette';
import { NO_PROPS, type Rig, type Rot } from '../render/pose';
import { posesOf } from '../render/outfits.testkit';
import { STYLE } from '../render/style';
import { makeView } from '../render/view';
import { castShadows } from '../render/world';
import { DAY } from '../render/palette';

/** a cell's side (px) and the near views' scale: px per office unit */
const CELL = 300;
const NEAR = 220;
/** the islands' size (2x of ~64 css px a unit) and the office fit's (2x of 12 css px, far detail) */
const ISLAND = 128;
const FIT = 24;
/** the near views: the bim turned by this about y (0: facing the camera) */
const VIEWS: readonly { readonly id: string; readonly turn: number }[] = [
  { id: 'front', turn: 0 },
  { id: '3/4', turn: -0.75 },
  { id: 'side', turn: -Math.PI / 2 },
  { id: '3/4 back', turn: -2.35 },
  { id: 'back', turn: Math.PI },
];
/** the widest head turns of the poses (hair-clip.test.ts reads every one; these are its worst) */
const TURNS: readonly { readonly id: string; readonly head: Rot }[] = [
  { id: 'gag-hard yaw', head: [0, -0.9, 0.06] },
  { id: 'gag-arts back+yaw', head: [-0.35, -0.5, 0] },
  { id: 'gag-why roll', head: [-0.1, 0.3, 0.22] },
  { id: 'catch look up', head: [-0.35, 0, 0] },
  { id: 'nod', head: [0.7, 0, 0] },
];

const NAME = 'bim-3';
const STAND: Rig = (() => {
  const p = posesOf(false, 1.3).find((x) => x.id === 'terrace');
  const r = p?.frames[0]?.rig;
  if (!r) throw new Error('no terrace pose');
  return { ...r, x: 0, z: 0, dir: 0, y: 0, body: [0, 0, 0], head: [0, 0, 0], armL: [0, 0, 0.12], armR: [0, 0, -0.12], legL: 0, legR: 0, eyes: 1, mouth: 'smile', props: NO_PROPS, opacity: 1, grey: 0 };
})();

function render(o: { cut: Cut; hat: HeadWear; kind: Kind; turn: number; head: Rot; px: number; near: boolean; size: number }): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = o.size;
  canvas.height = o.size;
  const view = makeView(canvas, { shadowAuto: true, transparent: true });
  view.renderer.setPixelRatio(1);
  view.renderer.setSize(o.size, o.size, false);
  view.tint(DAY);
  view.sky(DAY.bg);
  const sun = view.sun;
  sun.position.set(-2, 6, 5);
  sun.target.position.set(0, 0, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.radius = 3;
  sun.shadow.bias = -0.0005;
  const sc = sun.shadow.camera;
  sc.left = -2; sc.right = 2; sc.top = 2; sc.bottom = -2; sc.near = 0.1; sc.far = 20;
  sc.updateProjectionMatrix();
  const { camera, scene } = view;
  const target = new Vector3(0, 0.66, 0);
  const el = 0.2;
  camera.position.set(0, target.y + Math.sin(el) * 10, Math.cos(el) * 10);
  camera.lookAt(target);
  const half = o.size / 2 / o.px;
  camera.left = -half; camera.right = half; camera.top = half; camera.bottom = -half;
  camera.near = 0.1; camera.far = 30;
  camera.updateProjectionMatrix();
  const root = new Group();
  scene.add(root);
  const b: Bim = makeBim(NAME, false, STYLE, { ...outfitOf(NAME, false), cut: o.cut, hat: o.hat, kind: o.kind });
  castShadows(b.group);
  b.apply({ ...STAND, head: o.head });
  b.detail(o.near);
  b.group.rotation.y = o.turn;
  root.add(b.group);
  view.render();
  const out = document.createElement('canvas');
  out.width = o.size;
  out.height = o.size;
  out.getContext('2d')?.drawImage(canvas, 0, 0);
  b.dispose();
  view.dispose();
  return out;
}

/** one cut's sheet: its rows, labelled */
function sheet(cut: Cut): HTMLCanvasElement {
  const wears: HeadWear[] = ['bare', ...CUT_HATS[cut]];
  const rows: { label: string; hat: HeadWear; kind: Kind; head: Rot; turns?: boolean }[] = wears.map((hat, i) => ({ label: `${cut} · ${hat} · ${KINDS[i % KINDS.length] ?? 'hoodie'}`, hat, kind: KINDS[i % KINDS.length] ?? 'hoodie', head: [0, 0, 0] }));
  // the rest of the outfits, bare-headed, so every cut is seen in every outfit
  for (let i = wears.length; i < KINDS.length; i++) {
    const kind = KINDS[i] ?? 'hoodie';
    rows.push({ label: `${cut} · bare · ${kind}`, hat: 'bare', kind, head: [0, 0, 0] });
  }
  const turnHat: HeadWear = CUT_HATS[cut].includes('headphones') ? 'headphones' : 'bare';
  rows.push({ label: `${cut} · ${turnHat} · hoodie · the widest head turns, 3/4 back`, hat: turnHat, kind: 'hoodie', head: [0, 0, 0], turns: true });
  const LABEL = 34;
  const cols = VIEWS.length + 2;
  const c = document.createElement('canvas');
  c.width = cols * CELL;
  c.height = rows.length * (CELL + LABEL) + 60;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('no 2d');
  ctx.fillStyle = DAY.bg;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#1d1a17';
  ctx.font = '600 30px -apple-system, Helvetica, sans-serif';
  ctx.fillText(`bims-girls · ${cut}`, 16, 40);
  ctx.font = '20px -apple-system, Helvetica, sans-serif';
  rows.forEach((r, ri) => {
    const y = 60 + ri * (CELL + LABEL);
    ctx.fillStyle = '#1d1a17';
    ctx.fillText(r.label, 16, y + 24);
    const cells: { canvas: HTMLCanvasElement; note: string }[] = r.turns
      ? TURNS.map((t) => ({ canvas: render({ cut, hat: r.hat, kind: r.kind, turn: -2.35, head: t.head, px: NEAR, near: true, size: CELL }), note: t.id }))
      : [
          ...VIEWS.map((v) => ({ canvas: render({ cut, hat: r.hat, kind: r.kind, turn: v.turn, head: r.head, px: NEAR, near: true, size: CELL }), note: v.id })),
          { canvas: render({ cut, hat: r.hat, kind: r.kind, turn: -0.75, head: r.head, px: ISLAND, near: true, size: Math.round(CELL * 0.6) }), note: 'islands' },
          { canvas: render({ cut, hat: r.hat, kind: r.kind, turn: -0.75, head: r.head, px: FIT, near: false, size: 48 }), note: 'fit' },
        ];
    cells.forEach((x, ci) => {
      // the fit's tiny bim shown 4x, nearest neighbour: its real pixels, big enough to grade
      const k = x.note === 'fit' ? 4 : 1;
      const w = x.canvas.width * k;
      const h = x.canvas.height * k;
      const cx = ci * CELL + (CELL - w) / 2;
      const cy = y + LABEL + (CELL - h) / 2;
      ctx.imageSmoothingEnabled = k === 1;
      ctx.drawImage(x.canvas, cx, cy, w, h);
      ctx.imageSmoothingEnabled = true;
      ctx.fillStyle = '#7a736b';
      ctx.fillText(x.note, ci * CELL + 12, y + LABEL + CELL - 10);
    });
  });
  return c;
}

declare global {
  interface Window {
    turnaround: {
      cuts(): string[];
      /** one cut's sheet as a PNG data URL */
      sheet(cut: string): string;
    };
  }
}

window.turnaround = {
  cuts: () => [...CUTS],
  sheet(cut) {
    if (!(CUTS as readonly string[]).includes(cut)) throw new Error(`no cut ${cut}`);
    return sheet(cut as Cut).toDataURL('image/png');
  },
};
