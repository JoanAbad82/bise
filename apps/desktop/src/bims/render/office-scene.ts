// One office as a scene (page town-live p2, architect m_28994): its world (world.ts, its map's look
// and growth), one bim per BimFrame posed by pose.ts (bim.ts), his paper planes (plane.ts), the
// halo under a lit bim, the office's eggs (eggdecor.ts) and the unlock moment's crew (unlock.ts),
// all in one group in the office's own units. No renderer, no camera, no light: the minimap
// (render/index.ts) draws it through its view, the town places one per project. frame() poses it
// for time t and says how the loop must run next (Motion); the caller renders. The sky's lamps and
// snow cover come from its caller (weather(): sky.ts through render/index.ts or town.ts). Owner: bims-wire.
import { Color, Group, Matrix4, Mesh, MeshBasicMaterial, RingGeometry, Vector3, type ColorRepresentation, type Object3D } from 'three';
import type { Agent } from '@/proto';
import type { BimFrame, Look, Motion, Office } from '../model';
import { makeBim, type Bim } from './bim';
import { pillOf } from '../labels';
import { siteOf, type Fit, type V3 } from './camera';
import { cameraStart, catchPoint, flightAt, glideAt, makePlane, planFlight, planGlide, shadowOf, type FlightPlan, type GlidePlan, type Plane } from './plane';
import { PLANE_FLIGHT, louder, rigOf, type Rig } from './pose';
import { skateRig } from './skate';
import { eggRig } from './egg';
import { makeEggDecor, type EggDecor } from './eggdecor';
import { MAIN_HOODIE, WORLD, hash, outfitOf, type Outfit, type Palette } from './palette';
import { buildWorld, castShadows, lightDesk, type DeskHandles, type World } from './world';
import { NO_GROW, growSig, type Grow } from '../growth';
import { cozyAt } from '../cozy';
import { lookOf } from './maps';
import type { MapLook } from './maps/look';
import { makeUnlock } from './unlock';
import { seatChair } from './furniture';
import type { Style } from './style';

/** his plane's length in office units (plane.ts's wings), its least length on screen, and the iso view's shortening of it */
const PLANE_LEN = 0.42;
const PLANE_MIN_PX = 12;
/** a gliding plane's least shadow alpha (plane.ts SHADOW_ALPHA is 0.2 on the floor) */
const GLIDE_SHADOW = 0.09;
/** a bim's pill, office units up (over its head: its loop keeps clear of it); the plane's shadow just over the floor */
const PILL_Y = 1.7;
const FLOOR_LIFT = 0.02;
const PLANE_FORESHORTEN = 1.25;
/** how much of the eclipse's violet goes into the backdrop */
const ECLIPSE_MIX = 0.45;
/** the lit bim's halo on the floor (focus.ts; bims m_28199): the text's colour at low alpha, never the accent */
const HALO = { inner: 0.34, outer: 0.5, alpha: 0.28, day: '#1d1a17', night: '#f3ede4' } as const;

/** what a frame says of each bim it posed (the headless checks' trace, render/index.ts) */
export type OnRig = (f: BimFrame, rig: Rig, skating: boolean) => void;

export interface OfficeScene {
  /** everything of the office, in its own units */
  readonly root: Group;
  /** the office changed (an agent came or left, another map): its world again */
  setOffice(office: Office, agents: readonly Agent[]): void;
  /**
   * The growth and the theme as `look` says: the world built again when they changed (true: it
   * was, the ground may be wider).
   */
  prepare(look: Look): boolean;
  /** pose every bim for t through this fit (planes size to it); null: no world yet */
  frame(t: number, frames: readonly BimFrame[], look: Look, fit: Fit, onRig?: OnRig): Motion | null;
  /** the backdrop behind it: its palette's, violet in an eclipse; null before a world */
  sky(): ColorRepresentation | null;
  /** the sky's lamps (0..1) and snow on the ground (0..1) for the next frames; lamps null: the theme's */
  weather(lamps: number | null, cover: number): void;
  /** its palette (the view's lights), null before a world */
  pal(): Palette | null;
  readonly office: () => Office | null;
  /** a shown bim's head top and feet, office units; null: none or hidden */
  headTop(name: string, out: Vector3): Vector3 | null;
  feet(name: string, out: Vector3): Vector3 | null;
  /** every bim's name, shown or not */
  names(): readonly string[];
  /** a bim's body (the hero's entry pops it in), null: no such bim */
  body(name: string): Object3D | null;
  desk(name: string): DeskHandles | undefined;
  /** where a stage's piece stands (the map's look), office units */
  pieceAt(stage: number): { readonly x: number; readonly z: number } | null;
  /** its world alone (no bim, plane, halo): the town bakes its walls while its bims move */
  world(): Group | null;
  dispose(): void;
}

/** a newcomer's pop in, s */
export const APPEAR_S = 0.45;

/** the pop's scale at p in [0, 1]: an ease-out a little past 1 (back, ~6%), then settled. Pure. */
export function appearOut(p: number): number {
  const c = 1.3;
  const y = Math.min(1, Math.max(0, p)) - 1;
  return 1 + (c + 1) * y ** 3 + c * y * y;
}

/** `ground`: its floating grass block (false in the town: its lawn is the ground) */
export function makeOfficeScene(style: Style, o: { readonly ground?: boolean } = {}): OfficeScene {
  const ground = o.ground ?? true;
  const root = new Group();
  let office: Office | null = null;
  let agents: readonly Agent[] = [];
  let world: World | null = null;
  let night: boolean | null = null;
  /** the sky's lamps (sky.ts lightOf) and snow cover; lamps null: the theme's */
  let lamps: number | null = null;
  let cover = 0;
  let eclipsed = false;
  let eggDecor: EggDecor | null = null;
  let april = false;
  // the project's growth as drawn now (growth.ts), and the unlock moment's crew
  let grow: Grow = NO_GROW;
  let growKey = growSig(NO_GROW);
  const unlock = makeUnlock(root, style);
  const bims = new Map<string, Bim>();
  const rigs = new Map<string, Rig>();
  /** his planes in flight, by bim and when it left ('name@12.30'): the mesh, its plan; each ends on its own catch */
  /** each flight's plan: the app's (zigzag and loop) or the film's paper glide (pose.plane.glide) */
  const planes = new Map<string, { mesh: Plane; leftAt: string; plan: FlightPlan | GlidePlan; glide: boolean }>();
  const basis = new Matrix4();
  const axis = [new Vector3(), new Vector3(), new Vector3()] as const;
  // the halo under a lit bim (focus.ts): one ring, flat on the floor, shown under each lit bim's feet
  const haloGeo = new RingGeometry(HALO.inner, HALO.outer, 40);
  haloGeo.rotateX(-Math.PI / 2);
  const haloMat = new MeshBasicMaterial({ color: HALO.day, transparent: true, opacity: HALO.alpha, depthWrite: false });
  const halos = new Map<string, Mesh>();
  // a bim that comes in while the office is open pops in (Gabriel's review, main m_31507: the hero and
  // the app): from the scale of nothing, a little past its size, settled in APPEAR_S. The ones there
  // when the office opens are simply there.
  const shownLast = new Set<string>();
  const appearing = new Map<string, number>();
  let primed = false;

  /** the office's map's look (the loft before an office) */
  function mapLook(): MapLook {
    return lookOf(office?.map ?? 'loft');
  }

  function mainName(): string {
    return agents.find((a) => a.main)?.name ?? 'main';
  }

  function rebuildWorld(isNight: boolean): void {
    if (world) { root.remove(world.root); world.dispose(); world = null; }
    night = isNight;
    if (!office) return;
    const look = lookOf(office.map);
    eclipsed = false;
    world = buildWorld(office, mainName(), style, look, isNight, grow, ground);
    world.cover(cover);
    root.add(world.root);
    if (eggDecor) { root.remove(eggDecor.root); eggDecor.dispose(); }
    eggDecor = makeEggDecor(office, style, grow.stage);
    root.add(eggDecor.root);
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
    for (const b of bims.values()) { root.remove(b.group); b.dispose(); }
    bims.clear();
    rigs.clear();
  }

  function syncBims(): void {
    const keep = new Set(agents.map((a) => a.name));
    for (const [name, b] of bims) {
      if (!keep.has(name)) { root.remove(b.group); b.dispose(); bims.delete(name); rigs.delete(name); }
    }
    for (const a of agents) ensureBim(a.name, a.main);
  }

  function ensureBim(name: string, main: boolean): Bim {
    let b = bims.get(name);
    if (!b) {
      const look = mapLook();
      b = makeBim(name, main, style, aprilOutfit(name, main), main ? undefined : (w) => look.wear?.(w));
      if (style.shadows) castShadows(b.group);
      b.group.visible = false;
      bims.set(name, b);
      root.add(b.group);
    }
    return b;
  }

  function drawPlanes(t: number, frames: readonly BimFrame[], fit: Fit, light: boolean): boolean {
    const flying = new Set<string>();
    const site = office ? siteOf(office) : null;
    // every plane on its way, each its own flight: a newer one never cuts an older (designer m_32877)
    const flights = frames.flatMap((f) => [...(f.pose.aloft ?? []), ...(f.pose.plane ? [f.pose.plane] : [])].map((fp) => ({ f, fp })));
    for (const { f, fp } of flights) {
      const s = fp.since;
      const dur = fp.dur ?? PLANE_FLIGHT;
      if (s < 0 || s >= dur) continue;
      const rig = rigs.get(f.name);
      if (!rig) continue;
      // in front of it, at its right hand (plane.ts catchPoint): never on its head or its spot
      const hand = catchPoint(rig.x, rig.z, rig.dir);
      // never smaller than PLANE_MIN_PX on screen (designer via bims-qa m_27793: at 320 it was a speck)
      const size = Math.max(1, ((fp.minPx ?? PLANE_MIN_PX) * PLANE_FORESHORTEN * fit.scale) / PLANE_LEN);
      // one plan per flight, made when it leaves (his pan or zoom mid-flight moves no plane); keyed by
      // its bim and when it left, so two to one bim fly side by side
      const leftAt = (t - s).toFixed(2);
      const key = `${f.name}@${leftAt}`;
      flying.add(key);
      let p = planes.get(key);
      if (!p) {
        // the newest is the one the egg may loop (eggs.ts reads pose.plane)
        const loops = fp.loops ?? (fp === f.pose.plane && f.egg?.kind === 'loop' ? 2 : 1);
        const avoid = pillHeads(frames, f.name);
        const from = cameraStart(fit, fp.startX);
        const seed = hash(key);
        const glide = fp.glide === true;
        const plan = glide ? planGlide({ from, to: hand, seed, dur, px: fit.scale }) : planFlight({ from, to: hand, seed, loops, unit: size, avoid, dur });
        p = { mesh: makePlane(style), leftAt, plan, glide };
        planes.set(key, p);
        root.add(p.mesh.group, p.mesh.shadow);
      }
      const fl = p.glide ? glideAt(p.plan as GlidePlan, s, hand) : flightAt(p.plan as FlightPlan, s, hand);
      const g = p.mesh.group;
      g.visible = true;
      p.mesh.setInk(light);
      // its soft shadow on the floor once it is over the slab, fainter and wider as it climbs
      // a glide (the film's paper plane) keeps a faint one however high, so the eye finds it (designer m_32270)
      const raw = shadowOf(fl.p, 0);
      const sh = p.glide ? { ...raw, alpha: Math.max(raw.alpha, GLIDE_SHADOW) } : raw;
      const over = site !== null && fl.p.x > site.x0 && fl.p.x < site.x1 && fl.p.z > site.z0 && fl.p.z < site.z1;
      p.mesh.shadow.visible = over && sh.alpha > 0.01;
      if (p.mesh.shadow.visible) {
        p.mesh.shadow.position.set(fl.p.x, FLOOR_LIFT, fl.p.z);
        p.mesh.shadow.rotation.z = Math.atan2(fl.nose.x, fl.nose.z);
        p.mesh.shadow.scale.set(0.8 * size * sh.size, 1.4 * size * sh.size, 1);
        (p.mesh.shadow.material as MeshBasicMaterial).opacity = sh.alpha;
      }
      g.scale.setScalar(size * fl.grow);
      g.position.set(fl.p.x, fl.p.y, fl.p.z);
      // its nose along +z, its top +y (plane.ts): upside down over the loop's top, banked in the turns
      basis.makeBasis(
        axis[0].set(fl.up.y * fl.nose.z - fl.up.z * fl.nose.y, fl.up.z * fl.nose.x - fl.up.x * fl.nose.z, fl.up.x * fl.nose.y - fl.up.y * fl.nose.x),
        axis[1].set(fl.up.x, fl.up.y, fl.up.z),
        axis[2].set(fl.nose.x, fl.nose.y, fl.nose.z),
      );
      g.quaternion.setFromRotationMatrix(basis);
    }
    for (const [key, p] of planes) {
      if (!flying.has(key)) { root.remove(p.mesh.group, p.mesh.shadow); p.mesh.dispose(); planes.delete(key); }
    }
    return flying.size > 0;
  }

  /** where the '?' / '✗' pills are (labels.ts pillOf: over the asking and the failed bims' heads), but the target's */
  function pillHeads(frames: readonly BimFrame[], target: string): V3[] {
    const out: V3[] = [];
    for (const f of frames) {
      if (f.name === target || pillOf(f.pose.seg.act) === null) continue;
      const rig = rigs.get(f.name);
      if (rig) out.push({ x: rig.x, y: PILL_Y, z: rig.z });
    }
    return out;
  }

  function drawHalos(frames: readonly BimFrame[], isNight: boolean): void {
    haloMat.color.set(isNight ? HALO.night : HALO.day);
    const lit = new Set<string>();
    for (const f of frames) {
      const rig = rigs.get(f.name);
      if (f.lit !== true || !rig) continue;
      lit.add(f.name);
      let h = halos.get(f.name);
      if (!h) { h = new Mesh(haloGeo, haloMat); h.renderOrder = 1; halos.set(f.name, h); root.add(h); }
      h.position.set(rig.x, 0.02, rig.z);
      h.visible = rig.opacity > 0.05;
    }
    for (const [name, h] of halos) {
      if (!lit.has(name)) { root.remove(h); halos.delete(name); }
    }
  }

  const shown = (name: string): Bim | null => {
    const b = bims.get(name);
    return b && b.group.visible ? b : null;
  };

  return {
    root,
    setOffice(o, as) {
      // another map: its bims dress for it (the look's wear)
      if (office && office.map !== o.map) dropBims();
      office = o;
      agents = as;
      rebuildWorld(night ?? false);
      syncBims();
    },
    prepare(look) {
      if (!office) return false;
      // the growth moved (a new stage, garden, frames, cones): the world again, the ground may be wider
      const g = look.grow ?? NO_GROW;
      let grew = false;
      if (growSig(g) !== growKey) {
        grow = g;
        growKey = growSig(g);
        rebuildWorld(look.night);
        grew = true;
      } else if (night !== look.night) rebuildWorld(look.night);
      // t4: the eclipse turns the sky behind the office violet
      eclipsed = look.eggs?.eclipse === true;
      const fool = look.eggs?.april === true;
      if (fool !== april) { april = fool; dropBims(); }
      return grew;
    },
    frame(t, frames, look, fit, onRig) {
      if (!office || !world) return null;
      const pal = world.pal;
      let motion: Motion = 'still';
      const seen = new Set<string>();
      rigs.clear();
      for (const f of frames) {
        const b = ensureBim(f.name, f.main);
        // his easter egg on top of its pose (eggs.ts picks it, egg.ts plays it)
        // a skater in the park (skate.ts): its line's pose once it is there; on the way, the walk's
        const park = office.park;
        const skater = park && !look.reduced ? skateRig(f.name, f.pose, park, b.outfit.phase) : null;
        const rig = eggRig(skater ?? rigOf({ pose: f.pose, t, main: f.main, phase: b.outfit.phase, reduced: look.reduced }), f.egg ?? null);
        b.apply(rig);
        if (primed && !look.reduced && !shownLast.has(f.name) && !appearing.has(f.name)) appearing.set(f.name, t);
        const since = appearing.get(f.name);
        if (since !== undefined) {
          const p = (t - since) / APPEAR_S;
          b.group.scale.setScalar(p >= 1 ? 1 : Math.max(1e-3, appearOut(p)));
          if (p >= 1) appearing.delete(f.name);
        }
        rigs.set(f.name, rig);
        seen.add(f.name);
        motion = louder(motion, rig.motion);
        onRig?.(f, rig, skater !== null);
      }
      for (const [name, b] of bims) if (!seen.has(name)) b.group.visible = false;
      shownLast.clear();
      for (const name of seen) shownLast.add(name);
      if (frames.length > 0) primed = true;
      if (appearing.size > 0) motion = 'walk';
      drawHalos(frames, look.night);
      for (const [name, d] of world.desks) {
        const rig = rigs.get(name);
        // from stage 9 every desk's lamp is lit at night, its bim there or not (cozy.ts cozyAt: the desk lamps); a stopped bim's stays off
        const allLit = cozyAt(grow.stage).deskLamps && (rig?.grey ?? 0) < 1;
        lightDesk(d, pal, rig?.screen ?? 0, (rig ? rig.lamp : name !== mainName()) || allLit, lamps ?? undefined);
        seatChair(d.chair, rig?.seat);
      }
      if (!look.reduced && drawPlanes(t, frames, fit, !look.night)) motion = 'walk';
      // the office's own eggs: the ghost crossing asks for frames; april's outfits rebuild the bims once
      if (eggDecor?.update(look.eggs) === true) motion = 'walk';
      // the unlock moment: two bims bring the new piece in from the door
      if (unlock.update(t, office, look.unlock, look.unlock ? world.pieces.get(look.unlock.stage) : undefined, look.reduced, mapLook())) motion = 'walk';
      return motion;
    },
    sky() {
      if (!world) return null;
      // a sky event, not the bar changing colour (bims m_28109): the violet blended into the backdrop
      return eclipsed ? new Color(world.pal.bg).lerp(new Color(WORLD.eclipse), ECLIPSE_MIX) : world.pal.bg;
    },
    weather(l, c) {
      lamps = l;
      cover = c;
      world?.cover(c);
    },
    pal: () => world?.pal ?? null,
    office: () => office,
    headTop(name, out) {
      return shown(name)?.headTop(out) ?? null;
    },
    feet(name, out) {
      return shown(name)?.feet(out) ?? null;
    },
    names: () => [...bims.keys()],
    body: (name) => bims.get(name)?.group ?? null,
    desk: (name) => world?.desks.get(name),
    pieceAt(stage) {
      return office ? mapLook().pieceAt(office, stage) : null;
    },
    world: () => world?.root ?? null,
    dispose() {
      if (world) { root.remove(world.root); world.dispose(); world = null; }
      if (eggDecor) { eggDecor.dispose(); eggDecor = null; }
      unlock.dispose();
      for (const b of bims.values()) b.dispose();
      bims.clear();
      for (const p of planes.values()) p.mesh.dispose();
      planes.clear();
      for (const h of halos.values()) root.remove(h);
      halos.clear();
      haloGeo.dispose();
      haloMat.dispose();
    },
  };
}
