// src/artifacts/hero · the live banner scenes' three side, loaded only by import('./scene') (the
// entry chunk never holds three): the inbox, scheduled and artifacts vignettes as the plugins room
// draws its own (bims/render: the view, the clay style, the office's objects and bims, the office's
// day and night light), each scene the signed still's (bims-plugins' scratch vig.ts and renderScene,
// designer m_42905), framed as the still was (fit.ts airFit). Each part plays one hover move under
// the pointer (objects their own, render/objects/hover.ts; a bim hops), BANNER_HOVER_MS long, then
// the scene is still: a frame is drawn only on a resize, a theme change or while a move plays.
// No zoom, no pan (designer m_45900). Owner: banner-3d.
import { Group, Mesh, Raycaster, Vector2, Vector3, type BufferGeometry, type Material, type Object3D } from 'three';
import type { HoverMove } from '@/bims/render/objects/hover';
import { MOVES, hoverAt } from '@/bims/render/objects/hover';
import { makeObject } from '@/bims/render/objects';
import type { ObjId } from '@/bims/render/objects/ids';
import { makeBim } from '@/bims/render/bim';
import { rigOf, type Rig } from '@/bims/render/pose';
import { kitOf } from '@/bims/render/kit';
import { chair, deskLamp } from '@/bims/render/furniture';
import { DAY, NIGHT } from '@/bims/render/palette';
import { STYLE } from '@/bims/render/style';
import { makeView } from '@/bims/render/view';
import { lightOffice } from '@/bims/render/world';
import type { Activity, Pose } from '@/bims/model';
import { airFit, hoverT, spanOf, type Span } from './fit';

/** the pages whose banner shows a live scene */
export type ScenePage = 'inbox' | 'scheduled' | 'artifacts';

export interface SceneView {
  /** draw the scene in its day or night (built again when it changes) */
  show(o: { readonly night: boolean }): void;
  /** the canvas's css size: the banner's visual box */
  resize(widthPx: number, heightPx: number): void;
  /** the part under (x, y), css px from the canvas's top left; null: none */
  pick(x: number, y: number): string | null;
  /** the part under the pointer: a new one plays its move once (none under reduced motion) */
  hover(key: string | null, reduced: boolean): void;
  dispose(): void;
}

/** a part of a scene that moves under the pointer: its group, its move */
interface Part {
  readonly key: string;
  readonly g: Group;
  readonly move: HoverMove;
}

/** a bim hops twice when the pointer is on it; the sleeper starts once */
const HOP: HoverMove = { kind: 'hop', a: 0.09, n: 2 };
const START: HoverMove = { kind: 'hop', a: 0.06, n: 1 };
/** the alarm clock rings */
const RING: HoverMove = { kind: 'shake', a: 0.025, n: 6 };
/** the desk lamp nods, the notes settle */
const NOD: HoverMove = { kind: 'nod', a: 0.12, n: 1 };
const SETTLE: HoverMove = { kind: 'squash', a: 0.08, n: 1 };

/** the office's sun, from the scene's front left (the stills') */
const SUN = { x: -5, y: 14, z: 3 } as const;

interface Built {
  readonly root: Group;
  readonly parts: readonly Part[];
  readonly span: Span;
  /** bims to free (their own dispose) */
  readonly bims: readonly { dispose(): void }[];
}

/** a bim standing (or sitting) at its spot, posed once as at rest */
interface BimAt {
  readonly name: string;
  readonly x: number;
  readonly z: number;
  readonly face: number;
  readonly act: string;
  readonly extra?: Readonly<Record<string, unknown>>;
}

function build(page: ScenePage, night: boolean): Built {
  const pal = night ? NIGHT : DAY;
  const k = kitOf(STYLE, pal);
  const root = new Group();
  const parts: Part[] = [];
  const bimsMade: { dispose(): void }[] = [];
  const box = (w: number, h: number, d: number, c: string, x: number, y: number, z: number, p: Object3D = root, r?: number): Mesh => {
    const m = new Mesh(STYLE.box(w, h, d, r ?? Math.min(w, h, d) * 0.3), STYLE.material(c));
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    p.add(m);
    return m;
  };
  const cyl = (r: number, h: number, c: string, x: number, y: number, z: number, p: Object3D = root): Mesh => {
    const m = new Mesh(STYLE.cylinder(r, h), STYLE.material(c));
    m.position.set(x, y, z);
    m.castShadow = true;
    p.add(m);
    return m;
  };
  /** a group at (x, y, z) that moves as one part */
  const partAt = (key: string, move: HoverMove, x: number, y: number, z: number, rot = 0): Group => {
    const g = new Group();
    g.position.set(x, y, z);
    g.rotation.y = rot;
    root.add(g);
    parts.push({ key, g, move });
    return g;
  };
  /** a desk at (x, z), its long side along x, top at 0.63 */
  const desk = (x: number, z: number, w: number, d: number): void => {
    const g = new Group();
    g.position.set(x, 0, z);
    root.add(g);
    box(w, 0.06, d, DAY.deskTop, 0, 0.6, 0, g);
    for (const dx of [-w / 2 + 0.06, w / 2 - 0.06]) for (const dz of [-d / 2 + 0.06, d / 2 - 0.06]) box(0.06, 0.58, 0.06, DAY.desk, dx, 0.29, dz, g);
  };
  const obj = (id: ObjId, x: number, z: number, o: { rot?: number; n?: number } = {}): void => {
    const { group } = makeObject(id, { night: night ? 1 : 0, n: o.n ?? 5 });
    const g = partAt(id, MOVES[id], x, 0, z, o.rot ?? 0);
    g.add(group);
  };
  /** a stack of notes at (x, y, z), as one part */
  const notes = (key: string, x: number, y: number, z: number, n: number): void => {
    const cs = ['#ffd166', '#bfe1f2', '#fffaf0', '#9bd3a0', '#ffd166', '#fffaf0'];
    const g = partAt(key, SETTLE, x, y, z);
    for (let i = 0; i < n; i++) {
      const m = box(0.26, 0.012, 0.2, cs[i % cs.length] ?? '#fffaf0', Math.sin(i * 2.1) * 0.03, i * 0.016, Math.cos(i * 1.7) * 0.03, g, 0.003);
      m.rotation.y = Math.sin(i * 1.3) * 0.25;
    }
  };
  /** a bim as a part: its group under a holder at its feet, so its move turns it about itself */
  const bim = (b: BimAt, move: HoverMove, after?: (made: ReturnType<typeof makeBim>, holder: Group) => void): void => {
    const made = makeBim(b.name, false, STYLE);
    made.daylight(night ? 0 : 1);
    const act = { k: b.act, ...(b.extra ?? {}) } as unknown as Activity;
    const spot = { x: b.x, z: b.z, wz: b.z, ax: b.x, face: b.face };
    const pose = { x: b.x, z: b.z, dir: b.face, moving: false, since: 30, seg: { t: 0, act, sig: act.k, spot, path: { pts: [spot], seg: [], len: 0 }, speed: 2.4, from: null } } as unknown as Pose;
    const rig = rigOf({ pose, t: 30, main: false, phase: 1.3, reduced: true });
    const nap = b.extra?.['nap'] === true;
    // the sleeper's head down on its arms, eyes shut, a smile (the signed still's override)
    made.apply(nap ? ({ ...rig, head: [0.25, 0.55, 0.45], eyes: 0.1, mouth: 'smile' } as unknown as Rig) : rig);
    made.detail(true);
    const holder = partAt(b.name, move, b.x, 0, b.z);
    holder.updateMatrixWorld(true);
    holder.attach(made.group);
    bimsMade.push(made);
    after?.(made, holder);
  };

  // the slab's size (the stills': 3.6 x 2 for the pages, 3.4 x 2.2 for the artifacts)
  let W = 3.6;
  let D = 2.0;
  switch (page) {
    case 'inbox': {
      // a bim reading a note by a low table with its stacks, the mailbox by it (vig.ts 'inbox')
      desk(0.25, -0.2, 1.0, 0.55);
      notes('notes', 0.05, 0.64, -0.25, 7);
      notes('notes-2', 0.45, 0.64, -0.12, 3);
      obj('mailbox', 1.3, -0.5, { rot: -0.3 });
      obj('plant', -1.35, -0.55, { n: 2 });
      bim({ name: 'stats', x: -0.35, z: 0.4, face: 0.5, act: 'asks', extra: { urgent: true } }, HOP);
      break;
    }
    case 'scheduled': {
      // a bim asleep at its desk by an alarm clock (a timer); its calendar hides behind it (vig.ts 'scheduled')
      desk(0, 0.15, 1.3, 0.6);
      chair(k, root, 0, -0.45, '#2a9d8f', 0);
      {
        const c = partAt('clock', RING, -0.4, 0.63, 0.3, 0.5);
        const face = cyl(0.11, 0.07, '#ffd166', 0, 0.13, 0, c);
        face.rotation.x = Math.PI / 2;
        const dial = cyl(0.085, 0.01, '#fffaf0', 0, 0.13, 0.04, c);
        dial.rotation.x = Math.PI / 2;
        box(0.01, 0.06, 0.01, '#1d1a17', 0, 0.15, 0.05, c, 0.003);
        const hm = box(0.01, 0.045, 0.01, '#1d1a17', 0.015, 0.125, 0.05, c, 0.003);
        hm.rotation.z = -1.2;
        for (const s of [-1, 1]) {
          const b = cyl(0.045, 0.02, '#ffd166', s * 0.07, 0.25, 0, c);
          b.rotation.z = s * 0.6;
          box(0.015, 0.05, 0.015, '#1d1a17', s * 0.07, 0.03, 0, c, 0.005);
        }
      }
      {
        const cal = new Group();
        cal.position.set(0.42, 0.63, 0.25);
        cal.rotation.y = 0.35;
        root.add(cal);
        const pg = box(0.26, 0.24, 0.02, '#fffaf0', 0, 0.13, 0, cal, 0.01);
        pg.rotation.x = -0.25;
        const top = box(0.26, 0.06, 0.025, '#2a9d8f', 0, 0.23, -0.025, cal, 0.01);
        top.rotation.x = -0.25;
        for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) {
          const d = box(0.035, 0.03, 0.01, j === 2 && i === 1 ? '#f28c28' : '#c9bfb0', -0.075 + j * 0.05, 0.16 - i * 0.045, 0.02 - i * 0.012, cal, 0.003);
          d.rotation.x = -0.25;
        }
      }
      deskLamp(k, partAt('lamp', NOD, 0.15, 0.07, 0.2), 0, 0);
      bim({ name: 'export', x: 0, z: -0.45, face: 0, act: 'sleep', extra: { nap: true } }, START, (made, holder) => {
        // its 'zz' above its head, ink by day, cream at night; they move with it
        made.group.updateMatrixWorld(true);
        const top = holder.worldToLocal(made.headTop(new Vector3()));
        const zg = new Group();
        zg.position.set(top.x + 0.22, top.y + 0.12, top.z + 0.1);
        zg.rotation.y = Math.PI / 4;
        holder.add(zg);
        const ink = night ? '#f3ede4' : '#1d1a17';
        for (const [s, ox, oy] of [[1, 0, 0], [0.65, 0.17, 0.2]] as const) {
          box(0.12 * s, 0.025 * s, 0.02, ink, ox, oy + 0.06 * s, 0, zg, 0.006);
          box(0.12 * s, 0.025 * s, 0.02, ink, ox, oy - 0.06 * s, 0, zg, 0.006);
          const d = box(0.15 * s, 0.025 * s, 0.02, ink, ox, oy, 0, zg, 0.006);
          d.rotation.z = 0.9;
        }
      });
      break;
    }
    case 'artifacts': {
      // the archivist's desk: a bim at the files, a worktable with an open page, the shelf, a plant (renderScene + hero.json)
      W = 3.4;
      D = 2.2;
      obj('files', -1.05, -0.55);
      obj('shelf', -0.1, -0.75, { n: 10 });
      obj('plant', 1.35, -0.7, { n: 4 });
      {
        const T = (w: number, h: number, d: number, c: string, x: number, y: number, z: number): Mesh => box(w, h, d, c, x, y, z);
        T(1.3, 0.07, 0.75, '#e8c088', 0.55, 0.74, 0.3);
        for (const dx of [-0.55, 0.55]) for (const dz of [-0.3, 0.3]) T(0.06, 0.72, 0.06, '#c98f52', 0.55 + dx, 0.36, 0.3 + dz);
        const l = T(0.34, 0.012, 0.44, '#fffaf0', 0.38, 0.785, 0.32);
        l.rotation.z = 0.06;
        const r = T(0.34, 0.012, 0.44, '#fffaf0', 0.73, 0.785, 0.32);
        r.rotation.z = -0.06;
        for (let i = 0; i < 4; i++) {
          T(0.24 - (i % 2) * 0.06, 0.004, 0.02, '#9aa7b2', 0.37, 0.795, 0.18 + i * 0.07);
          T(0.22, 0.004, 0.02, '#9aa7b2', 0.74, 0.795, 0.18 + i * 0.07);
        }
        T(0.12, 0.004, 0.06, '#5aaef0', 0.74, 0.795, 0.48);
        const pen = T(0.02, 0.02, 0.2, '#1d1a17', 0.98, 0.79, 0.4);
        pen.rotation.y = 0.5;
        // the two books on the table, one part: they settle under the pointer
        const books = partAt('books', SETTLE, 0.11, 0.77, 0.145);
        box(0.32, 0.08, 0.24, '#ffcc4d', -0.01, 0.04, 0.005, books);
        box(0.3, 0.06, 0.22, '#8f7fe6', 0.01, 0.11, -0.005, books);
      }
      bim({ name: 'docs-site', x: -0.95, z: 0.25, face: Math.PI, act: 'report' }, HOP);
      break;
    }
  }
  // the slab
  const fl = new Mesh(STYLE.box(W, 0.12, D, 0.06), STYLE.floor(DAY.floor, W, D));
  fl.position.set(0, -0.06, 0);
  fl.receiveShadow = true;
  root.add(fl);
  root.updateMatrixWorld(true);
  return { root, parts, span: spanOf(pointsOf(root)) ?? { x0: -1, x1: 1, y0: -1, y1: 1 }, bims: bimsMade };
}

/** every vertex of the scene, world units: what the still's trim saw */
function* pointsOf(root: Object3D): Generator<Vector3> {
  const v = new Vector3();
  const stack: Object3D[] = [root];
  while (stack.length > 0) {
    const o = stack.pop();
    if (o === undefined) break;
    if (!o.visible) continue;
    stack.push(...o.children);
    if (!(o instanceof Mesh)) continue;
    const geo = o.geometry as BufferGeometry;
    if (!geo.hasAttribute('position')) continue;
    const pos = geo.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
      yield v;
    }
  }
}

function disposeTree(root: Object3D): void {
  root.traverse((x) => {
    if (!(x instanceof Mesh)) return;
    (x.geometry as BufferGeometry).dispose();
    const m = x.material as Material | Material[];
    for (const y of Array.isArray(m) ? m : [m]) y.dispose();
  });
}

/** the parts' rest poses, to add each move to */
interface Rest {
  readonly p: Vector3;
  readonly r: readonly [number, number, number];
  readonly s: Vector3;
}

export function mountScene(canvas: HTMLCanvasElement, page: ScenePage): SceneView {
  const view = makeView(canvas, { shadowAuto: true, transparent: true });
  view.sky('#000000');
  let built: Built | null = null;
  let rests = new Map<string, Rest>();
  let night: boolean | null = null;
  let size = { w: 0, h: 0 };
  let raf = 0;
  let hovered: string | null = null;
  let hoverT0 = 0;
  const ray = new Raycaster();

  const draw = (now: number): void => {
    raf = 0;
    let moving = false;
    for (const part of built?.parts ?? []) {
      const rest = rests.get(part.key);
      if (rest === undefined) continue;
      const playing = hoverT0 > 0 && part.key === hovered;
      const t = playing ? hoverT(hoverT0, now) : 1;
      if (playing && t < 1) moving = true;
      else if (playing) hoverT0 = 0;
      const h = hoverAt(part.move, t);
      const rot = rest.r[1];
      part.g.position.set(rest.p.x + h.dx * Math.cos(rot), rest.p.y + h.lift, rest.p.z - h.dx * Math.sin(rot));
      part.g.rotation.set(rest.r[0] + h.pitch, rot + h.yaw, rest.r[2] + h.roll);
      part.g.scale.set(rest.s.x * h.sx, rest.s.y * h.sy, rest.s.z * h.sz);
    }
    view.render();
    if (moving) raf = requestAnimationFrame(draw);
  };
  const frame = (): void => {
    if (raf === 0 && size.w > 0 && built !== null) raf = requestAnimationFrame(draw);
  };
  const look = (): void => {
    if (built === null || size.w <= 0) return;
    const fit = airFit(built.span, size.w, size.h);
    view.size(fit);
    view.look(fit);
  };

  return {
    show(o) {
      if (o.night === night) {
        frame();
        return;
      }
      night = o.night;
      if (built !== null) {
        view.scene.remove(built.root);
        disposeTree(built.root);
        for (const b of built.bims) b.dispose();
      }
      built = build(page, o.night);
      rests = new Map(built.parts.map((p) => [p.key, { p: p.g.position.clone(), r: [p.g.rotation.x, p.g.rotation.y, p.g.rotation.z], s: p.g.scale.clone() }]));
      view.scene.add(built.root);
      const pal = o.night ? NIGHT : DAY;
      view.tint(pal);
      lightOffice(view.hemi, view.sun, pal, { x0: -1, W: 2, D: 2 } as unknown as Parameters<typeof lightOffice>[3], STYLE);
      view.sun.position.set(SUN.x, SUN.y, SUN.z);
      view.sun.target.position.set(0, 0, 0);
      look();
      frame();
    },
    resize(w, h) {
      const next = { w: Math.max(0, Math.round(w)), h: Math.max(0, Math.round(h)) };
      // the same size: the canvas may have lost its frame (a window resize, scrolled away and back): one frame, no loop
      if (next.w !== size.w || next.h !== size.h) {
        size = next;
        look();
      }
      frame();
    },
    pick(x, y) {
      const el = view.renderer.domElement;
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w <= 0 || h <= 0 || built === null) return null;
      ray.setFromCamera(new Vector2((x / w) * 2 - 1, 1 - (y / h) * 2), view.camera);
      const groups = built.parts.map((p) => p.g);
      const hit = ray.intersectObjects(groups, true)[0];
      if (hit === undefined) return null;
      let o: Object3D | null = hit.object;
      while (o !== null && !groups.includes(o as Group)) o = o.parent;
      return built.parts.find((p) => p.g === o)?.key ?? null;
    },
    hover(key, reduced) {
      if (key === hovered) return;
      hovered = key;
      if (key === null || reduced) return;
      hoverT0 = performance.now();
      frame();
    },
    dispose() {
      if (raf !== 0) cancelAnimationFrame(raf);
      if (built !== null) {
        disposeTree(built.root);
        for (const b of built.bims) b.dispose();
      }
      view.dispose();
    },
  };
}
