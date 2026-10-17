// The town's renderer (three; page bims-maps v9, town.js townStill2): every project's office built by
// its own map's look (world.ts buildWorld, its growth, its desks lit for the agents at work) where the
// town's plan put it, merged into one object (merge.ts) with its bims as still silhouettes, and the
// town around them (townscape.ts), merged too. One hemisphere light and one sun with its soft
// shadow for the whole town. It draws only when frame() is called (Town.tsx calls it on a change
// and during the dive); a far office is built again only when its signature changes. In test mode
// lays the town's plan (town/plan.ts) when an office's ground changes. In test mode it exposes
// window.__biseTown = { frames, calls, ms, offices, merged, check } for the town's check. Owner: maps-e.
import { type BufferGeometry, DirectionalLight, Group, HemisphereLight, type Material, Mesh, MeshLambertMaterial, MeshStandardMaterial, OrthographicCamera, PCFShadowMap, Scene, Vector3, WebGLRenderer } from 'three';
import { growSig } from '../growth';
import { BACK, DIST, RIGHT, UP, type Fit, toScreen } from './camera';
import { lookOf } from './maps';
import { DAY, NIGHT } from './palette';
import { STYLE } from './style';
import { buildWorld, lightDesk } from './world';
import { mergeRoot, type Merged } from './merge';
import { TOWN_DAY, TOWN_NIGHT, buildTownscape } from './townscape';
import { stillSig } from '../town/stand';
import { diveFit, townFit } from '../town/camera';
import { siteOf, townSeed } from '../town/ground';
import { crossings, townPlan, type Placed, type TownPlan } from '../town/plan';
import type { MakeTownRenderer, TownOffice, TownRenderer } from '../town/types';

/** a sign's anchor: over the back wall's middle, this high */
const SIGN_Y = 2.6;
/** the dim of the offices around the one the town dives into */
const DIM = 0.72;
/** a silhouette's tone by day and by night: the ink, softened */
const SIL = { day: '#4a423b', night: '#d9d0c2' } as const;

interface Built {
  readonly sig: string;
  readonly merged: Merged;
  readonly holder: Group;
  /** the materials the dim darkens, with their own colour */
  readonly tints: readonly { readonly m: MeshStandardMaterial | MeshLambertMaterial; readonly r: number; readonly g: number; readonly b: number }[];
}

interface Probe {
  frames: number;
  calls: number;
  ms: number;
  offices: number;
  merged: { from: number; to: number };
  /** the plan's road and river points inside an office: 0 and 0 */
  check: { road: number; river: number };
}

const testMode = (): boolean => (window as Partial<Window> & { bise?: { test?: boolean } }).bise?.test === true;

/** an office's signature: what makes it look different (its map, its desks, its growth, its bims, the theme) */
const sigOf = (t: TownOffice, night: boolean): string =>
  `${t.office.map}|${t.office.size}|${[...t.office.desks.keys()].join(',')}|${growSig(t.grow)}|${stillSig(t.still)}|${night ? 'n' : 'd'}`;

export const makeTownRenderer: MakeTownRenderer = (canvas) => {
  const renderer = new WebGLRenderer({ canvas, antialias: STYLE.antialias, alpha: false, powerPreference: 'low-power' });
  renderer.shadowMap.enabled = STYLE.shadows;
  renderer.shadowMap.type = PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, DIST * 3);
  const hemi = new HemisphereLight();
  const sun = new DirectionalLight();
  scene.add(hemi, sun, sun.target);

  let plan: TownPlan | null = null;
  let planKey = '';
  let offices: readonly TownOffice[] = [];
  let night: boolean | null = null;
  let size = { w: 0, maxH: 0 };
  let base: Fit | null = null;
  let view: Fit | null = null;
  let shadowsDirty = true;
  let lost = false;
  const lostCbs: (() => void)[] = [];
  const built = new Map<string, Built>();
  let scape: { sig: string; merged: Merged } | null = null;
  let dimmed: string | null | undefined;
  const v = new Vector3();
  const probe: Probe | null = testMode() ? { frames: 0, calls: 0, ms: 0, offices: 0, merged: { from: 0, to: 0 }, check: { road: 0, river: 0 } } : null;
  if (probe) (window as unknown as { __biseTown?: Probe }).__biseTown = probe;

  const onLost = (e: Event): void => {
    e.preventDefault();
    lost = true;
    for (const cb of lostCbs) cb();
  };
  canvas.addEventListener('webglcontextlost', onLost);

  const placedOf = (id: string): Placed | undefined => plan?.offices.find((p) => p.id === id);

  function dropOffice(id: string): void {
    const b = built.get(id);
    if (!b) return;
    scene.remove(b.holder);
    b.merged.dispose();
    built.delete(id);
  }

  /** an office's world, its desks lit as its agents work, its silhouettes, merged into one */
  function buildOffice(t: TownOffice, isNight: boolean): Built {
    const look = lookOf(t.office.map);
    const w = buildWorld(t.office, t.main, STYLE, look, isNight, t.grow);
    // no plot outline (bims m_28807): its floating grass block stays out, the town's lawn is its ground
    // (world.ts adds it first, on the root, at these heights); the town's one sun lights it (a world has no light)
    for (const c of [...w.root.children]) {
      if (c instanceof Mesh && (c.position.y === -0.75 || c.position.y === -0.1)) {
        w.root.remove(c);
        (c.geometry as BufferGeometry).dispose();
      }
    }
    const pal = w.pal;
    const lit = new Set(t.still.lit);
    for (const [name, d] of w.desks) lightDesk(d, pal, lit.has(name) ? 1 : 0, lit.has(name) || (isNight && name !== t.main));
    // the silhouettes: a body and a head, the ink's tone, where each bim is now
    const sil = STYLE.material(isNight ? SIL.night : SIL.day);
    for (const s of t.still.stands) {
      const k = s.main ? 1.18 : 1;
      const body = STYLE.capsule(0.2 * k, 0.3 * k);
      const head = STYLE.ball(0.2 * k);
      w.root.add(meshAt(body, sil, s.x, 0.45 * k, s.z), meshAt(head, sil, s.x, 0.98 * k, s.z));
    }
    const merged = mergeRoot(w.root, STYLE, STYLE.shadows);
    // the world's own geometries went into the merge; its materials are kept but the baked one's
    w.dispose();
    for (const c of merged.group.children) {
      // the merged meshes kept some of the world's materials (a lit screen, the floor's planks): new ones, w.dispose() freed them
      const m = (c as unknown as { material: Material }).material;
      if (m !== merged.baked) (c as unknown as { material: Material }).material = m.clone();
    }
    sil.dispose();
    const holder = new Group();
    holder.add(merged.group);
    const tints: Built['tints'][number][] = [];
    for (const c of merged.group.children) {
      const m = (c as unknown as { material: Material }).material;
      if (m instanceof MeshStandardMaterial || m instanceof MeshLambertMaterial) tints.push({ m, r: m.color.r, g: m.color.g, b: m.color.b });
    }
    return { sig: sigOf(t, isNight), merged, holder, tints };
  }

  function meshAt(geo: BufferGeometry, m: Material, x: number, y: number, z: number): Mesh {
    const out = new Mesh(geo, m);
    out.position.set(x, y, z);
    return out;
  }

  function sync(isNight: boolean): void {
    if (!plan) return;
    const keep = new Set(offices.map((t) => t.id));
    for (const id of [...built.keys()]) if (!keep.has(id)) dropOffice(id);
    for (const t of offices) {
      const p = placedOf(t.id);
      if (!p) continue;
      const sig = sigOf(t, isNight);
      let b = built.get(t.id);
      if (!b || b.sig !== sig) {
        dropOffice(t.id);
        b = buildOffice(t, isNight);
        built.set(t.id, b);
        scene.add(b.holder);
        shadowsDirty = true;
      }
      if (b.holder.position.x !== p.x || b.holder.position.z !== p.z) {
        b.holder.position.set(p.x, 0, p.z);
        shadowsDirty = true;
      }
    }
    // where an office carves under its floor (California's bowl), in the town's frame: the lawn leaves a hole there
    const pits = offices.flatMap((t) => {
      const p = placedOf(t.id);
      const own = lookOf(t.office.map).pits?.(t.office, t.grow.stage) ?? [];
      return p ? own.map((b) => ({ x0: b.x0 + p.x, x1: b.x1 + p.x, z0: b.z0 + p.z, z1: b.z1 + p.z })) : [];
    });
    const sSig = `${String(plan.seed)}|${JSON.stringify(plan.lawn)}|${String(plan.road.length)}|${String(plan.trees.length)}|${String(plan.offices.length)}|${isNight ? 'n' : 'd'}|${JSON.stringify(pits)}`;
    if (scape?.sig !== sSig) {
      if (scape) {
        scene.remove(scape.merged.group);
        scape.merged.dispose();
      }
      const pal = isNight ? NIGHT : DAY;
      const root = buildTownscape(plan, STYLE, pal, isNight ? TOWN_NIGHT : TOWN_DAY, pits);
      const merged = mergeRoot(root, STYLE, STYLE.shadows);
      root.traverse((o) => {
        const g = (o as unknown as { geometry?: { dispose(): void } }).geometry;
        g?.dispose();
      });
      scene.add(merged.group);
      scape = { sig: sSig, merged };
      lightUp(isNight);
      shadowsDirty = true;
    }
    if (probe) {
      probe.offices = built.size;
      let from = scape.merged.from;
      let to = scape.merged.to;
      for (const b of built.values()) {
        from += b.merged.from;
        to += b.merged.to;
      }
      probe.merged = { from, to };
    }
  }

  /** the one light of the town: the loft's palette's sky and sun, the sun's shadow over the whole lawn */
  function lightUp(isNight: boolean): void {
    if (!plan) return;
    const pal = isNight ? NIGHT : DAY;
    hemi.color.set(pal.hemi[0]);
    hemi.groundColor.set(pal.hemi[1]);
    hemi.intensity = pal.hemi[2];
    sun.color.set(pal.sun[0]);
    sun.intensity = pal.sun[1];
    renderer.setClearColor(pal.bg);
    const { lawn } = plan;
    const cx = (lawn.x0 + lawn.x1) / 2;
    const cz = (lawn.z0 + lawn.z1) / 2;
    // the office's sun: up and a little to the west of the room, as world.ts puts it
    sun.position.set(cx - 5 * 3, 14 * 3, cz - 1 * 3);
    sun.target.position.set(cx, 0, cz);
    if (STYLE.shadows) {
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      sun.shadow.radius = 4;
      sun.shadow.bias = -0.0008;
      const half = Math.max(lawn.x1 - lawn.x0, lawn.z1 - lawn.z0) * 0.62 + 2;
      const cam = sun.shadow.camera;
      cam.left = -half;
      cam.right = half;
      cam.top = half;
      cam.bottom = -half;
      cam.near = 1;
      cam.far = 140;
      cam.updateProjectionMatrix();
    }
  }

  function applyFit(): void {
    if (!plan || size.w <= 0) return;
    base = townFit(plan, size.w, size.maxH);
    applyView();
  }

  function applyView(): void {
    const f = view ?? base;
    if (!f) return;
    const t = f.target;
    camera.position.set(t.x + BACK.x * DIST, t.y + BACK.y * DIST, t.z + BACK.z * DIST);
    camera.up.set(0, 1, 0);
    camera.lookAt(t.x, t.y, t.z);
    camera.left = f.left;
    camera.right = f.right;
    camera.top = f.top;
    camera.bottom = f.bottom;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, STYLE.maxPixelRatio));
    renderer.setSize(f.widthPx, f.heightPx, false);
  }

  function dim(id: string | null): void {
    if (dimmed === id) return;
    dimmed = id;
    for (const [oid, b] of built) {
      const k = id !== null && oid !== id ? DIM : 1;
      for (const t of b.tints) t.m.color.setRGB(t.r * k, t.g * k, t.b * k);
    }
  }

  /** the canvas point (css px) seen at height y on the ground (the iso view's ray down) */
  function groundAt(f: Fit, x: number, y: number, h: number): { x: number; z: number } {
    const a = x * f.scale + f.left;
    const b = f.top - y * f.scale;
    const t = (h - f.target.y - b * UP.y) / BACK.y;
    return { x: f.target.x + a * RIGHT.x + b * UP.x + t * BACK.x, z: f.target.z + a * RIGHT.z + b * UP.z + t * BACK.z };
  }

  const api: TownRenderer = {
    setTown(os) {
      // what makes two towns the same layout: each office's ground (its map, its desks, its growth), not its bims
      const key = os.map((o) => `${o.id}:${o.office.map}:${o.office.size}:${String(o.grow.stage)}:${String(o.grow.garden)}`).join('|');
      if (plan === null || key !== planKey) {
        planKey = key;
        plan = townPlan(os.map((o) => siteOf(o.id, o.office, o.grow)), townSeed(os.map((o) => o.id)));
        if (probe) probe.check = { ...crossings(plan) };
      }
      offices = os;
      dimmed = undefined;
      sync(night ?? false);
      applyFit();
    },
    setSize(widthPx, maxHeightPx) {
      size = { w: Math.round(widthPx), maxH: Math.round(maxHeightPx) };
      applyFit();
      return base?.heightPx ?? 0;
    },
    townFit: () => base,
    diveFit(id, widthPx) {
      const p = placedOf(id);
      const t = offices.find((o) => o.id === id);
      return p && t ? diveFit(p, t.office, widthPx) : null;
    },
    setView(f) {
      view = f;
      applyView();
    },
    frame(isNight, dimBut) {
      if (lost || !plan) return;
      if (night !== isNight) {
        night = isNight;
        sync(isNight);
        lightUp(isNight);
      }
      dim(dimBut);
      const t0 = performance.now();
      if (shadowsDirty) {
        renderer.shadowMap.needsUpdate = true;
        shadowsDirty = false;
      }
      renderer.render(scene, camera);
      if (probe) {
        probe.frames++;
        probe.ms = performance.now() - t0;
        probe.calls = renderer.info.render.calls;
      }
    },
    signAt(id) {
      const f = view ?? base;
      const p = placedOf(id);
      const t = offices.find((o) => o.id === id);
      if (!f || !p || !t) return null;
      const o = t.office;
      v.set(p.x + o.x0 + o.W / 2, SIGN_Y, p.z - 0.3);
      const s = toScreen(f, v);
      if (s.x < 0 || s.x > f.widthPx || s.y < 0 || s.y > f.heightPx) return null;
      return s;
    },
    pick(x, y) {
      const f = view ?? base;
      if (!f || !plan) return null;
      // from the roofs down: the first office the ray meets
      for (let h = 2.6; h >= 0; h -= 0.2) {
        const g = groundAt(f, x, y, h);
        const hit = plan.offices.find((p) => g.x > p.fp.x0 && g.x < p.fp.x1 && g.z > p.fp.z0 && g.z < p.fp.z1);
        if (hit) return hit.id;
      }
      return null;
    },
    copyTo(target) {
      renderer.render(scene, camera);
      target.getContext('2d')?.drawImage(canvas, 0, 0, target.width, target.height);
    },
    onLost(cb) {
      lostCbs.push(cb);
    },
    dispose() {
      canvas.removeEventListener('webglcontextlost', onLost);
      for (const id of [...built.keys()]) dropOffice(id);
      if (scape) {
        scene.remove(scape.merged.group);
        scape.merged.dispose();
        scape = null;
      }
      renderer.dispose();
      if (probe) delete (window as unknown as { __biseTown?: Probe }).__biseTown;
    },
  };
  return api;
};
