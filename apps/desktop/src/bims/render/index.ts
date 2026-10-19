// les bims' renderer (three.js), the only module that imports three: Office.tsx loads it with
// import('./render') so the list view never pays for it (its own chunk, budget in
// electron.vite.config.ts). The minimap is one office scene (office-scene.ts: the world, the bims
// posed by pose.ts, his paper planes, the eggs, the unlock moment) drawn through one view (view.ts:
// the renderer, the iso camera, the office's light) at his camera's zoom (camera.ts viewFit); it
// answers where heads are and what is under a point (pick.ts). It renders only when frame() is
// called and says how the loop must run next (Motion). The look is style.ts.
// In test mode (window.bise.test) it exposes window.__biseBims = { frames, trace, skate, head, zoom, cam } for
// the headless checks (bims-qa; skate: each skater's phase per frame, budget.spec (5)).
import { Vector3 } from 'three';
import type { BimFrame, Look, MakeRenderer, Motion, OfficeRenderer } from '../model';
import { FIT, type Cam } from '../zoom';
import { type Fit, fitSite, siteOf, toScreen, viewFit, wideSiteOf } from './camera';
import { pickAt, type Target } from './pick';
import type { Rig } from './pose';
import { sinceArrived, skateAt } from '../skate';
import { STYLE } from './style';
import { lightOffice } from './world';
import { makeOfficeScene } from './office-scene';
import { makeView } from './view';

/** from this width (css px) the camera fits the building and a little ground (wideSiteOf); under it the building */
const WIDE_FIT_PX = 480;

/** what the headless check reads (test mode only) */
interface Probe {
  frames: number;
  /** each bim's place per frame; y its height off the floor (a skater up a ramp, in the bowl: below 0) */
  trace: { t: number; name: string; x: number; z: number; y: number; op: number }[];
  /** each drawn frame of an arrived skater: its session n (skate.ts skateAt) and whether it rides its line or rests */
  skate: { t: number; name: string; n: number; phase: 'line' | 'rest' }[];
  head(name: string): { x: number; y: number } | null;
  /** his camera's zoom now (zoom.ts Cam; 1 = the fit): the follow check reads how close it looks */
  zoom(): number;
  /** his whole camera now (zoom and where it looks): his camera check reads whether a wheel moved it */
  cam(): Cam;
}
const TRACE_MAX = 3000;

const testMode = (): boolean => (window as Partial<Window> & { bise?: { test?: boolean } }).bise?.test === true;

/** the town on bise's thread (render/town.ts): in this chunk too, so three loads once */
export { makeTownRenderer } from './town';

export const makeRenderer: MakeRenderer = (canvas) => {
  // the office's shadow follows its bims: drawn again every frame (a still office draws none)
  const view = makeView(canvas, { shadowAuto: true });
  const office = makeOfficeScene(STYLE);
  view.scene.add(office.root);
  /** the whole site fitted to the canvas, and what shows through his camera (fit = base at FIT) */
  let base: Fit | null = null;
  let fit: Fit | null = null;
  let cam: Cam = FIT;
  let size = { w: 0, maxH: 0 };
  const v = new Vector3();

  const probe: Probe | null = testMode()
    ? { frames: 0, trace: [], skate: [], head: (name) => headOf(name), zoom: () => cam.zoom, cam: () => cam }
    : null;
  if (probe) (window as unknown as { __biseBims?: Probe }).__biseBims = probe;

  /** the office's light and backdrop, after its world was built */
  function lightUp(): void {
    const o = office.office();
    const pal = office.pal();
    if (!o || !pal) return;
    lightOffice(view.hemi, view.sun, pal, o, STYLE);
    const sky = office.sky();
    if (sky !== null) view.sky(sky);
  }

  function applyFit(): void {
    const o = office.office();
    if (!o || size.w <= 0) return;
    // 320: the building; wide: a little ground past it. The garden past that is cropped (Office.tsx's
    // soft fade), so the office never gets smaller as the project grows (bims m_28178)
    base = fitSite(size.w >= WIDE_FIT_PX ? wideSiteOf(o) : siteOf(o), size.w, size.maxH);
    applyView();
    view.size(base);
  }

  // his pinch and pan: the fit seen closer (camera.ts viewFit), the canvas's size unchanged
  function applyView(): void {
    if (!base) return;
    fit = viewFit(base, cam);
    view.look(fit);
  }

  function headOf(name: string): { x: number; y: number; feet: number } | null {
    if (!fit) return null;
    const top = office.headTop(name, v);
    if (!top) return null;
    const p = toScreen(fit, top);
    if (p.x < 0 || p.y < -20 || p.x > fit.widthPx || p.y > fit.heightPx) return null;
    const feet = office.feet(name, v);
    return { ...p, feet: feet ? toScreen(fit, feet).y : p.y };
  }

  /** the headless checks' trace of each posed bim (test mode) */
  const traced = (t: number) => (f: BimFrame, rig: Rig, skating: boolean): void => {
    if (!probe) return;
    probe.trace.push({ t, name: f.name, x: rig.x, z: rig.z, y: rig.lift ?? 0, op: rig.opacity });
    if (probe.trace.length > TRACE_MAX) probe.trace.splice(0, probe.trace.length - TRACE_MAX);
    const p = f.pose.seg.pastime;
    const park = office.office()?.park;
    if (skating && p && park) {
      const now = skateAt(f.name, p, sinceArrived(f.pose), park);
      probe.skate.push({ t, name: f.name, n: now.n, phase: now.move === null ? 'rest' : 'line' });
      if (probe.skate.length > TRACE_MAX) probe.skate.splice(0, probe.skate.length - TRACE_MAX);
    }
  };

  const api: OfficeRenderer = {
    setOffice(o, as) {
      office.setOffice(o, as);
      lightUp();
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
      if (view.lost() || !office.office()) return 'still';
      // the growth moved: the world again, the ground may be wider; the theme: the world and its light again
      const grew = office.prepare(look);
      lightUp();
      if (grew) applyFit();
      if (!fit) return 'still';
      const motion = office.frame(t, frames, look, fit, probe ? traced(t) : undefined);
      if (motion === null) return 'still';
      view.render();
      if (probe) probe.frames++;
      return motion;
    },
    headOf,
    spotOf(name) {
      if (!fit || !base) return null;
      const top = office.headTop(name, v);
      if (!top) return null;
      const head = toScreen(fit, top);
      const feet = office.feet(name, v);
      if (!feet) return null;
      const mid = toScreen(base, { x: feet.x, y: 0.5, z: feet.z });
      return { x: head.x, y: head.y, u: mid.x / base.widthPx, v: mid.y / base.heightPx };
    },
    pieceOf(stage) {
      const at = office.pieceAt(stage);
      if (!fit || !at) return null;
      // a piece out of the frame (the garden cropped at 320): the frame's edge nearest it (bims m_28178)
      const p = toScreen(fit, { ...at, y: 1.2 });
      const m = 12;
      return { x: Math.min(fit.widthPx - m, Math.max(m, p.x)), y: Math.min(fit.heightPx - m, Math.max(m * 2, p.y)) };
    },
    pick(x, y) {
      if (!fit || !office.pal()) return null;
      const f = fit;
      const targets: Target[] = [];
      const deskR = 0.8 / f.scale;
      for (const name of office.names()) {
        const d = office.desk(name);
        const head = office.headTop(name, v);
        const headPx = head ? toScreen(f, head) : null;
        const feet = office.feet(name, v);
        targets.push({
          name,
          head: headPx,
          feet: feet ? toScreen(f, feet) : null,
          desk: d ? { ...toScreen(f, d.top), r: deskR } : null,
        });
      }
      return pickAt(targets, x, y);
    },
    copyTo(target) {
      view.copyTo(target);
    },
    onLost(cb) {
      view.onLost(cb);
    },
    dispose() {
      view.scene.remove(office.root);
      office.dispose();
      view.dispose();
      if (probe) delete (window as unknown as { __biseBims?: Probe }).__biseBims;
    },
  };
  return api;
};
