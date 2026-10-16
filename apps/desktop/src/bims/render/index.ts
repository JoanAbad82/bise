// les bims' renderer (three.js), the only module that imports three: Office.tsx loads it with
// import('./render') so the list view never pays for it (its own chunk, budget in
// electron.vite.config.ts). It draws what model.ts hands it: the world from the Office (world.ts),
// one bim per BimFrame posed by pose.ts (bim.ts), his paper planes (plane.ts), through the iso
// camera (camera.ts); it answers where heads are and what is under a point (pick.ts). It renders
// only when frame() is called and says how the loop must run next (Motion). The look is style.ts.
// In test mode (window.bise.test) it exposes window.__biseBims = { frames, trace, head } for the
// headless check (bims-qa).
import { OrthographicCamera, Scene, Vector3, WebGLRenderer } from 'three';
import type { Agent } from '@/proto';
import type { BimFrame, Look, MakeRenderer, Motion, Office, OfficeRenderer } from '../model';
import { makeBim, type Bim } from './bim';
import { BACK, DIST, type Fit, aboveTop, fitSite, siteOf, toScreen } from './camera';
import { paletteOf } from './palette';
import { pickAt, type Target } from './pick';
import { flightAt, makePlane, type Plane } from './plane';
import { PLANE_FLIGHT, louder, rigOf, type Rig } from './pose';
import { STYLE } from './style';
import { buildWorld, lightDesk, type World } from './world';

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

const testMode = (): boolean => (window as Partial<Window> & { bise?: { test?: boolean } }).bise?.test === true;

export const makeRenderer: MakeRenderer = (canvas) => {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'low-power' });
  renderer.shadowMap.enabled = STYLE.shadows;
  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, DIST * 3);

  let office: Office | null = null;
  let agents: readonly Agent[] = [];
  let world: World | null = null;
  let night: boolean | null = null;
  let fit: Fit | null = null;
  let size = { w: 0, maxH: 0 };
  const bims = new Map<string, Bim>();
  const rigs = new Map<string, Rig>();
  const planes = new Map<string, Plane>();
  let lost = false;
  const lostCbs: (() => void)[] = [];
  const v = new Vector3();

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
    world = buildWorld(office, mainName(), STYLE, pal);
    scene.add(world.root);
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
      b = makeBim(name, main, STYLE);
      b.group.visible = false;
      bims.set(name, b);
      scene.add(b.group);
    }
    return b;
  }

  function applyFit(): void {
    if (!office || size.w <= 0) return;
    fit = fitSite(siteOf(office), size.w, size.maxH);
    const t = fit.target;
    camera.position.set(t.x + BACK.x * DIST, t.y + BACK.y * DIST, t.z + BACK.z * DIST);
    camera.up.set(0, 1, 0);
    camera.lookAt(t.x, t.y, t.z);
    camera.left = fit.left;
    camera.right = fit.right;
    camera.top = fit.top;
    camera.bottom = fit.bottom;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, STYLE.maxPixelRatio));
    renderer.setSize(fit.widthPx, fit.heightPx, false);
  }

  function headOf(name: string): { x: number; y: number } | null {
    const b = bims.get(name);
    if (!b || !fit || !b.group.visible) return null;
    const p = toScreen(fit, b.headTop(v));
    if (p.x < 0 || p.y < -20 || p.x > fit.widthPx || p.y > fit.heightPx) return null;
    return p;
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
      const fl = flightAt(hand, aboveTop(fit, hand), s);
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
      return fit?.heightPx ?? 0;
    },
    frame(t, frames, look: Look): Motion {
      if (lost || !office) return 'still';
      if (night !== look.night) rebuildWorld(look.night);
      if (!world || !fit) return 'still';
      const pal = world.pal;
      let motion: Motion = 'still';
      const shown = new Set<string>();
      rigs.clear();
      for (const f of frames) {
        const b = ensureBim(f.name, f.main);
        const rig = rigOf({ pose: f.pose, t, main: f.main, phase: b.outfit.phase, reduced: look.reduced });
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
      for (const [name, d] of world.desks) {
        const rig = rigs.get(name);
        lightDesk(d, pal, rig?.screen ?? 0, rig ? rig.lamp : name !== mainName());
      }
      if (!look.reduced && drawPlanes(frames)) motion = 'walk';
      renderer.render(scene, camera);
      if (probe) probe.frames++;
      return motion;
    },
    headOf,
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
      for (const b of bims.values()) b.dispose();
      bims.clear();
      for (const p of planes.values()) p.dispose();
      planes.clear();
      renderer.dispose();
      if (probe) delete (window as unknown as { __biseBims?: Probe }).__biseBims;
    },
  };
  return api;
};
