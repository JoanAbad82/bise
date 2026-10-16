// les bims' renderer (three.js), the only module that imports three: Office.tsx loads it with
// import('./render') so the list view never pays for it (its own chunk, budget in
// electron.vite.config.ts). It draws what model.ts hands it: the world from the Office (world.ts),
// one bim per BimFrame posed by pose.ts (bim.ts), his paper planes (plane.ts), through the iso
// camera (camera.ts); it answers where heads are and what is under a point (pick.ts). It renders
// only when frame() is called and says how the loop must run next (Motion). The look is style.ts.
// In test mode (window.bise.test) it exposes window.__biseBims = { frames, trace, head } for the
// headless check (bims-qa).
import { Color, Mesh, MeshBasicMaterial, OrthographicCamera, PCFShadowMap, RingGeometry, Scene, Vector3, WebGLRenderer } from 'three';
import type { Agent } from '@/proto';
import type { BimFrame, Look, MakeRenderer, Motion, Office, OfficeRenderer } from '../model';
import { makeBim, type Bim } from './bim';
import { FIT, type Cam } from '../zoom';
import { BACK, DIST, type Fit, aboveTop, fitSite, siteOf, toScreen, viewFit } from './camera';
import { paletteOf } from './palette';
import { pickAt, type Target } from './pick';
import { flightAt, makePlane, type Plane } from './plane';
import { PLANE_FLIGHT, louder, rigOf, type Rig } from './pose';
import { STYLE } from './style';
import { eggRig } from './egg';
import { makeEggDecor, type EggDecor } from './eggdecor';
import { MAIN_HOODIE, WORLD, outfitOf, type Outfit } from './palette';
import { buildWorld, castShadows, lightDesk, type World } from './world';
import { NO_GROW, growSig, type Grow } from '../growth';
import { wideSiteOf } from './camera';
import { pieceAt } from './stages';
import { makeUnlock } from './unlock';

/** from this width (css px) the camera fits the building and a little ground (wideSiteOf); under it the building */
const WIDE_FIT_PX = 480;

/** what the headless check reads (test mode only) */
interface Probe {
  frames: number;
  trace: { t: number; name: string; x: number; z: number; op: number }[];
  head(name: string): { x: number; y: number } | null;
}
const TRACE_MAX = 3000;
/** his plane's length in office units (plane.ts's wings), its least length on screen, and the iso view's shortening of it */
const PLANE_LEN = 0.42;
const PLANE_MIN_PX = 12;
const PLANE_FORESHORTEN = 1.25;
/** how much of the eclipse's violet goes into the backdrop */
const ECLIPSE_MIX = 0.45;
/** the lit bim's halo on the floor (focus.ts; bims m_28199): the text's colour at low alpha, never the accent */
const HALO = { inner: 0.34, outer: 0.5, alpha: 0.28, day: '#1d1a17', night: '#f3ede4' } as const;

const testMode = (): boolean => (window as Partial<Window> & { bise?: { test?: boolean } }).bise?.test === true;

export const makeRenderer: MakeRenderer = (canvas) => {
  const renderer = new WebGLRenderer({ canvas, antialias: STYLE.antialias, alpha: false, powerPreference: 'low-power' });
  renderer.shadowMap.enabled = STYLE.shadows;
  // PCF with the sun's radius 8 (three r186 folded PCFSoft into it): one soft shadow
  renderer.shadowMap.type = PCFShadowMap;
  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, DIST * 3);

  let office: Office | null = null;
  let agents: readonly Agent[] = [];
  let world: World | null = null;
  let night: boolean | null = null;
  let eclipsed = false;
  let eggDecor: EggDecor | null = null;
  let april = false;
  // the project's growth as drawn now (growth.ts), and the unlock moment's crew
  let grow: Grow = NO_GROW;
  let growKey = growSig(NO_GROW);
  const unlock = makeUnlock(scene, STYLE);
  /** the whole site fitted to the canvas, and what shows through his camera (fit = base at FIT) */
  let base: Fit | null = null;
  let fit: Fit | null = null;
  let cam: Cam = FIT;
  let size = { w: 0, maxH: 0 };
  const bims = new Map<string, Bim>();
  const rigs = new Map<string, Rig>();
  const planes = new Map<string, Plane>();
  let lost = false;
  const lostCbs: (() => void)[] = [];
  const v = new Vector3();
  // the halo under a lit bim (focus.ts): one ring, flat on the floor, shown under each lit bim's feet
  const haloGeo = new RingGeometry(HALO.inner, HALO.outer, 40);
  haloGeo.rotateX(-Math.PI / 2);
  const haloMat = new MeshBasicMaterial({ color: HALO.day, transparent: true, opacity: HALO.alpha, depthWrite: false });
  const halos = new Map<string, Mesh>();

  const probe: Probe | null = testMode()
    ? { frames: 0, trace: [], head: (name) => headOf(name) }
    : null;
  if (probe) (window as unknown as { __biseBims?: Probe }).__biseBims = probe;

  const onLost = (e: Event): void => {
    e.preventDefault();
    lost = true;
    for (const cb of lostCbs) cb();
  };
  canvas.addEventListener('webglcontextlost', onLost);

  function mainName(): string {
    return agents.find((a) => a.main)?.name ?? 'main';
  }

  function rebuildWorld(isNight: boolean): void {
    if (world) { scene.remove(world.root); world.dispose(); world = null; }
    night = isNight;
    if (!office) return;
    const pal = paletteOf(isNight);
    renderer.setClearColor(pal.bg);
    eclipsed = false;
    world = buildWorld(office, mainName(), STYLE, pal, grow);
    scene.add(world.root);
    if (eggDecor) { scene.remove(eggDecor.root); eggDecor.dispose(); }
    eggDecor = makeEggDecor(office, STYLE, grow.stage);
    scene.add(eggDecor.root);
  }

  // s3, april fools: each bim in the next one's outfit (hats shuffled), the first one in main's hoodie
  function aprilOutfit(name: string, main: boolean): Outfit | undefined {
    if (!april || main) return undefined;
    const others = agents.filter((a) => !a.main).map((a) => a.name);
    const i = others.indexOf(name);
    const next = others[(i + 1) % others.length] ?? name;
    const o = outfitOf(next, false);
    return i === 0 ? { ...o, hoodie: MAIN_HOODIE } : o;
  }
  function dropBims(): void {
    for (const b of bims.values()) { scene.remove(b.group); b.dispose(); }
    bims.clear();
    rigs.clear();
  }

  function syncBims(): void {
    const keep = new Set(agents.map((a) => a.name));
    for (const [name, b] of bims) {
      if (!keep.has(name)) { scene.remove(b.group); b.dispose(); bims.delete(name); rigs.delete(name); }
    }
    for (const a of agents) ensureBim(a.name, a.main);
  }

  function ensureBim(name: string, main: boolean): Bim {
    let b = bims.get(name);
    if (!b) {
      b = makeBim(name, main, STYLE, aprilOutfit(name, main));
      if (STYLE.shadows) castShadows(b.group);
      b.group.visible = false;
      bims.set(name, b);
      scene.add(b.group);
    }
    return b;
  }

  function applyFit(): void {
    if (!office || size.w <= 0) return;
    // 320: the building; wide: a little ground past it. The garden past that is cropped (Office.tsx's
    // soft fade), so the office never gets smaller as the project grows (bims m_28178)
    base = fitSite(size.w >= WIDE_FIT_PX ? wideSiteOf(office) : siteOf(office), size.w, size.maxH);
    applyView();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, STYLE.maxPixelRatio));
    renderer.setSize(base.widthPx, base.heightPx, false);
  }

  // his pinch and pan: the fit seen closer (camera.ts viewFit), the canvas's size unchanged
  function applyView(): void {
    if (!base) return;
    fit = viewFit(base, cam);
    const t = fit.target;
    camera.position.set(t.x + BACK.x * DIST, t.y + BACK.y * DIST, t.z + BACK.z * DIST);
    camera.up.set(0, 1, 0);
    camera.lookAt(t.x, t.y, t.z);
    camera.left = fit.left;
    camera.right = fit.right;
    camera.top = fit.top;
    camera.bottom = fit.bottom;
    camera.updateProjectionMatrix();
  }

  function headOf(name: string): { x: number; y: number; feet: number } | null {
    const b = bims.get(name);
    if (!b || !fit || !b.group.visible) return null;
    const p = toScreen(fit, b.headTop(v));
    if (p.x < 0 || p.y < -20 || p.x > fit.widthPx || p.y > fit.heightPx) return null;
    return { ...p, feet: toScreen(fit, b.feet(v)).y };
  }

  function drawPlanes(frames: readonly BimFrame[]): boolean {
    const flying = new Set<string>();
    for (const f of frames) {
      const s = f.pose.plane?.since;
      if (s === undefined || s < 0 || s >= PLANE_FLIGHT || !fit) continue;
      const rig = rigs.get(f.name);
      if (!rig) continue;
      flying.add(f.name);
      let p = planes.get(f.name);
      if (!p) { p = makePlane(STYLE); planes.set(f.name, p); scene.add(p.group); }
      const hand = { x: rig.x, y: 1.0, z: rig.z };
      const fl = flightAt(hand, aboveTop(fit, hand), s, f.egg?.kind === 'loop');
      p.group.visible = true;
      // never smaller than PLANE_MIN_PX on screen (designer via bims-qa m_27793: at 320 it was a speck)
      p.group.scale.setScalar(Math.max(1, (PLANE_MIN_PX * PLANE_FORESHORTEN * fit.scale) / PLANE_LEN));
      p.group.position.set(fl.p.x, fl.p.y, fl.p.z);
      p.group.lookAt(fl.p.x + fl.heading.x, fl.p.y + fl.heading.y, fl.p.z + fl.heading.z);
      p.group.rotateZ(fl.roll);
    }
    for (const [name, p] of planes) {
      if (!flying.has(name)) { scene.remove(p.group); p.dispose(); planes.delete(name); }
    }
    return flying.size > 0;
  }

  function drawHalos(frames: readonly BimFrame[], isNight: boolean): void {
    haloMat.color.set(isNight ? HALO.night : HALO.day);
    const lit = new Set<string>();
    for (const f of frames) {
      const rig = rigs.get(f.name);
      if (f.lit !== true || !rig) continue;
      lit.add(f.name);
      let h = halos.get(f.name);
      if (!h) { h = new Mesh(haloGeo, haloMat); h.renderOrder = 1; halos.set(f.name, h); scene.add(h); }
      h.position.set(rig.x, 0.02, rig.z);
      h.visible = rig.opacity > 0.05;
    }
    for (const [name, h] of halos) {
      if (!lit.has(name)) { scene.remove(h); halos.delete(name); }
    }
  }

  const api: OfficeRenderer = {
    setOffice(o, as) {
      office = o;
      agents = as;
      rebuildWorld(night ?? false);
      syncBims();
      applyFit();
    },
    setSize(widthPx, maxHeightPx) {
      size = { w: Math.round(widthPx), maxH: Math.round(maxHeightPx) };
      applyFit();
      return base?.heightPx ?? 0;
    },
    setCam(c) {
      cam = c;
      applyView();
    },
    frame(t, frames, look: Look): Motion {
      if (lost || !office) return 'still';
      // the growth moved (a new stage, garden, frames, cones): the world again, the ground may be wider
      const g = look.grow ?? NO_GROW;
      if (growSig(g) !== growKey) {
        grow = g;
        growKey = growSig(g);
        rebuildWorld(look.night);
        applyFit();
      } else if (night !== look.night) rebuildWorld(look.night);
      // t4: the eclipse turns the sky behind the office violet
      const eclipse = look.eggs?.eclipse === true;
      if (eclipse !== eclipsed && world) {
        eclipsed = eclipse;
        // a sky event, not the bar changing colour (bims m_28109): the violet blended into the backdrop
        renderer.setClearColor(eclipse ? new Color(world.pal.bg).lerp(new Color(WORLD.eclipse), ECLIPSE_MIX) : world.pal.bg);
      }
      const fool = look.eggs?.april === true;
      if (fool !== april) { april = fool; dropBims(); }
      if (!world || !fit) return 'still';
      const pal = world.pal;
      let motion: Motion = 'still';
      const shown = new Set<string>();
      rigs.clear();
      for (const f of frames) {
        const b = ensureBim(f.name, f.main);
        // his easter egg on top of its pose (eggs.ts picks it, egg.ts plays it)
        const rig = eggRig(rigOf({ pose: f.pose, t, main: f.main, phase: b.outfit.phase, reduced: look.reduced }), f.egg ?? null);
        b.apply(rig);
        rigs.set(f.name, rig);
        shown.add(f.name);
        motion = louder(motion, rig.motion);
        if (probe) {
          probe.trace.push({ t, name: f.name, x: rig.x, z: rig.z, op: rig.opacity });
          if (probe.trace.length > TRACE_MAX) probe.trace.splice(0, probe.trace.length - TRACE_MAX);
        }
      }
      for (const [name, b] of bims) if (!shown.has(name)) b.group.visible = false;
      drawHalos(frames, look.night);
      for (const [name, d] of world.desks) {
        const rig = rigs.get(name);
        lightDesk(d, pal, rig?.screen ?? 0, rig ? rig.lamp : name !== mainName());
      }
      if (!look.reduced && drawPlanes(frames)) motion = 'walk';
      // the office's own eggs: the ghost crossing asks for frames; april's outfits rebuild the bims once
      if (eggDecor?.update(look.eggs) === true) motion = 'walk';
      // the unlock moment: two bims bring the new piece in from the door
      if (unlock.update(t, office, look.unlock, look.unlock ? world.pieces.get(look.unlock.stage) : undefined, look.reduced)) motion = 'walk';
      renderer.render(scene, camera);
      if (probe) probe.frames++;
      return motion;
    },
    headOf,
    spotOf(name) {
      const b = bims.get(name);
      if (!b || !fit || !base || !b.group.visible) return null;
      const head = toScreen(fit, b.headTop(v));
      const feet = b.feet(v);
      const mid = toScreen(base, { x: feet.x, y: 0.5, z: feet.z });
      return { x: head.x, y: head.y, u: mid.x / base.widthPx, v: mid.y / base.heightPx };
    },
    pieceOf(stage) {
      if (!fit || !office) return null;
      // a piece out of the frame (the garden cropped at 320): the frame's edge nearest it (bims m_28178)
      const p = toScreen(fit, { ...pieceAt(office, stage), y: 1.2 });
      const m = 12;
      return { x: Math.min(fit.widthPx - m, Math.max(m, p.x)), y: Math.min(fit.heightPx - m, Math.max(m * 2, p.y)) };
    },
    pick(x, y) {
      if (!fit || !world) return null;
      const f = fit;
      const targets: Target[] = [];
      const deskR = 0.8 / f.scale;
      for (const [name, b] of bims) {
        const d = world.desks.get(name);
        const visible = b.group.visible;
        targets.push({
          name,
          head: visible ? toScreen(f, b.headTop(v)) : null,
          feet: visible ? toScreen(f, b.feet(v)) : null,
          desk: d ? { ...toScreen(f, d.top), r: deskR } : null,
        });
      }
      return pickAt(targets, x, y);
    },
    onLost(cb) {
      lostCbs.push(cb);
    },
    dispose() {
      canvas.removeEventListener('webglcontextlost', onLost);
      if (world) { scene.remove(world.root); world.dispose(); world = null; }
      if (eggDecor) { eggDecor.dispose(); eggDecor = null; }
      unlock.dispose();
      for (const b of bims.values()) b.dispose();
      bims.clear();
      for (const p of planes.values()) p.dispose();
      planes.clear();
      for (const h of halos.values()) scene.remove(h);
      halos.clear();
      haloGeo.dispose();
      haloMat.dispose();
      renderer.dispose();
      if (probe) delete (window as unknown as { __biseBims?: Probe }).__biseBims;
    },
  };
  return api;
};
