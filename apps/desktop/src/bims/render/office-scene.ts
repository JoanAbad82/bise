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
import { cameraStart, viewPoint, flightAt, glideAt, makePlane, planFlight, planGlide, shadowOf, sizeAt, startSize, type FlightFrame, type FlightPlan, type GlidePlan, type Plane } from './plane';
import { DESK_SPOT, HELD_LEN, ON_DESK, PLANE_CATCH, POCKET_SINK, REACH_S, awayOf, heldAt } from './catch';
import { PLANE_FLIGHT, louder, rigOf, type Rig } from './pose';
import { skateRig } from './skate';
import { eggRig } from './egg';
import { makeEggDecor, type EggDecor } from './eggdecor';
import { MAIN_HOODIE, WORLD, hash, outfitOf, paletteOf, type Outfit, type Palette } from './palette';
import { buildWorld, castShadows, lightDesk, type DeskHandles, type World } from './world';
import { NO_GROW, growSig, type Grow } from '../growth';
import { cozyAt } from '../cozy';
import { lookOf } from './maps';
import type { MapLook } from './maps/look';
import { makeUnlock } from './unlock';
import { seatChair } from './furniture';
import type { Style } from './style';

/** the length on screen (css px) the loop and the zigzag are sized for, its office length for that; the shadow's own length (plane.ts) */
const LOOP_PX = 12;
const LOOP_LEN = 0.42;
const SHADOW_LEN = 0.42;
/** a gliding plane's least shadow alpha (plane.ts SHADOW_ALPHA is 0.2 on the floor) */
const GLIDE_SHADOW = 0.09;
/** a bim's pill, office units up (over its head: its loop keeps clear of it); the plane's shadow just over the floor */
const PILL_Y = 1.7;
const FLOOR_LIFT = 0.02;
const PLANE_FORESHORTEN = 1.25;
const mixV = (a: V3, b: V3, f: number): V3 => ({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, z: a.z + (b.z - a.z) * f });
const unit = (a: V3): V3 => {
  const l = Math.hypot(a.x, a.y, a.z) || 1;
  return { x: a.x / l, y: a.y / l, z: a.z / l };
};
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
  /** the backdrop behind it: the theme's page (themed: its palette's), violet in an eclipse; null before a world */
  sky(): ColorRepresentation | null;
  /** the sky's lamps (0..1), snow on the ground (0..1) and the slab's night lift (0..1) for the next frames; lamps null: the theme's */
  weather(lamps: number | null, cover: number, lift?: number): void;
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
export function makeOfficeScene(style: Style, o: { readonly ground?: boolean; readonly themed?: boolean } = {}): OfficeScene {
  const ground = o.ground ?? true;
  // the town's offices keep the theme's materials until the town moves to one light (bims m_34193)
  const themed = o.themed ?? false;
  const root = new Group();
  let office: Office | null = null;
  let agents: readonly Agent[] = [];
  let world: World | null = null;
  let night: boolean | null = null;
  /** the sky's lamps (sky.ts lightOf) and snow cover; lamps null: the theme's */
  let lamps: number | null = null;
  /** the slab's night lift (sky.ts Light.lift) */
  let lift = 0;
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
  const planes = new Map<string, { mesh: Plane; leftAt: string; plan: FlightPlan | GlidePlan; glide: boolean; big: number }>();
  /** the sheets laid on desks after a catch, by bim (Pose.letter) */
  const letters = new Map<string, Plane>();
  const tmp = new Vector3();
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
    // the office keeps its day materials in both themes (bims-light, direction A); the town its theme's
    world = buildWorld(office, mainName(), style, look, themed && isNight, grow, ground);
    world.cover(cover);
    world.page(isNight);
    world.lift(lift);
    if (lamps !== null) world.lit(lamps);
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

  /** a plane's mesh at p, its nose and top, scaled (x, y along its width and height, z its length) */
  function place(mesh: Plane, p: V3, nose: V3, up: V3, sx: number, sz: number): void {
    const g = mesh.group;
    g.visible = true;
    g.scale.set(sx, sx, sz);
    g.position.set(p.x, p.y, p.z);
    // its nose along +z, its top +y (plane.ts): upside down over the loop's top, banked in the turns
    basis.makeBasis(
      axis[0].set(up.y * nose.z - up.z * nose.y, up.z * nose.x - up.x * nose.z, up.x * nose.y - up.y * nose.x),
      axis[1].set(up.x, up.y, up.z),
      axis[2].set(nose.x, nose.y, nose.z),
    );
    g.quaternion.setFromRotationMatrix(basis);
  }

  /** the bim's right hand in the office's units (bim.ts hand, its pose applied this frame) */
  function handOf(name: string): V3 | null {
    const b = bims.get(name);
    if (!b) return null;
    b.hand(tmp);
    root.worldToLocal(tmp);
    return { x: tmp.x, y: tmp.y, z: tmp.z };
  }

  /** where a sheet lies on its bim's desk (catch.ts DESK_SPOT, from its desk spot, standing or sitting), office units; null: no desk */
  function deskSpot(name: string, spot: { x: number; z: number; face: number }): V3 | null {
    const d = world?.desks.get(name);
    if (!d) return null;
    const c = Math.cos(spot.face);
    const sn = Math.sin(spot.face);
    return { x: spot.x + DESK_SPOT.x * c + DESK_SPOT.z * sn, y: d.top.y + 0.004, z: spot.z - DESK_SPOT.x * sn + DESK_SPOT.z * c };
  }

  /**
   * His planes: each from his side of the screen to the bim's hand (its own flight, the size shrinking
   * to the bim's), then held, read and put away (catch.ts), one mesh all the way, never swapped; the
   * sheets left on desks (Pose.letter). Reduced motion: no flight, the open sheet in its hand, then on
   * its desk. True while one moves.
   */
  function drawPlanes(t: number, frames: readonly BimFrame[], fit: Fit, light: boolean, reduced: boolean, planeFrom?: Look['planeFrom']): boolean {
    const flying = new Set<string>();
    const site = office ? siteOf(office) : null;
    let moving = false;
    /** the bims whose desk shows a sheet this frame (one each) */
    const laid = new Set<string>();
    // every plane on its way, each its own flight: a newer one never cuts an older (designer m_32877)
    const flights = frames.flatMap((f) => {
      const own = [...(f.pose.aloft ?? []), ...(f.pose.plane ? [f.pose.plane] : [])];
      // a newer plane's reach cuts this one's catch short (catch.ts heldAt cut), in this one's catch time
      return own.map((fp, i) => {
        const next = own[i + 1];
        const cut = next === undefined ? Infinity : fp.since - (fp.dur ?? PLANE_FLIGHT) + ((next.dur ?? PLANE_FLIGHT) - REACH_S - next.since);
        return { f, fp, cut };
      });
    });
    for (const { f, fp, cut } of flights) {
      const s = fp.since;
      const dur = fp.dur ?? PLANE_FLIGHT;
      if (s < 0 || s >= dur + PLANE_CATCH) continue;
      const rig = rigs.get(f.name);
      const hand = handOf(f.name);
      if (!rig || !hand) continue;
      const desk = deskSpot(f.name, f.pose.seg.spot);
      const away = desk !== null ? awayOf(f.pose.seg.act) : 'pocket';
      const held = heldAt(s - dur, away, reduced, cut);
      if (reduced && held === null) continue;
      // one plan per flight, made when it leaves (his pan or zoom mid-flight moves no plane); keyed by
      // its bim and when it left, so two to one bim fly side by side
      const leftAt = (t - s).toFixed(2);
      const key = `${f.name}@${leftAt}`;
      flying.add(key);
      let p = planes.get(key);
      if (!p) {
        // the loop and the zigzag size with LOOP_PX on screen (designer via bims-qa m_27793)
        const unit = Math.max(1, (LOOP_PX * PLANE_FORESHORTEN * fit.scale) / LOOP_LEN);
        // the newest is the one the egg may loop (eggs.ts reads pose.plane)
        const loops = fp.loops ?? (fp === f.pose.plane && f.egg?.kind === 'loop' ? 2 : 1);
        const avoid = pillHeads(frames, f.name);
        const from = planeFrom ? viewPoint(fit, planeFrom) : cameraStart(fit, fp.startX);
        const seed = hash(key);
        const glide = fp.glide === true;
        const plan = glide ? planGlide({ from, to: hand, seed, dur, px: fit.scale }) : planFlight({ from, to: hand, seed, loops, unit, avoid, dur });
        p = { mesh: makePlane(style), leftAt, plan, glide, big: startSize(fit, HELD_LEN) };
        planes.set(key, p);
        root.add(p.mesh.group, p.mesh.shadow);
      }
      p.mesh.setInk(light);
      // a glide from the view's point (the hero's sent bubble) leaves from it as the camera moves
      const from = p.glide && planeFrom ? viewPoint(fit, planeFrom) : undefined;
      const at = (x: number): FlightFrame => (p.glide ? glideAt(p.plan as GlidePlan, x, hand, from) : flightAt(p.plan as FlightPlan, x, hand));
      if (held === null) {
        // flying: to the hand's real point, from big near his eye to the bim's own size
        moving = true;
        const fl = at(s);
        const size = HELD_LEN * sizeAt(fl.u, p.big);
        p.mesh.setFold(0);
        place(p.mesh, fl.p, fl.nose, fl.up, size, size);
        // its soft shadow on the floor once it is over the slab, fainter and wider as it climbs
        // a glide (the film's paper plane) keeps a faint one however high, so the eye finds it (designer m_32270)
        const raw = shadowOf(fl.p, 0);
        const sh = p.glide ? { ...raw, alpha: Math.max(raw.alpha, GLIDE_SHADOW) } : raw;
        const over = site !== null && fl.p.x > site.x0 && fl.p.x < site.x1 && fl.p.z > site.z0 && fl.p.z < site.z1;
        p.mesh.shadow.visible = over && sh.alpha > 0.01;
        if (p.mesh.shadow.visible) {
          p.mesh.shadow.position.set(fl.p.x, FLOOR_LIFT, fl.p.z);
          p.mesh.shadow.rotation.z = Math.atan2(fl.nose.x, fl.nose.z);
          p.mesh.shadow.scale.set(0.8 * size / SHADOW_LEN, 1.4 * size / SHADOW_LEN, 1);
          (p.mesh.shadow.material as MeshBasicMaterial).opacity = sh.alpha;
        }
        continue;
      }
      // in its hand: where catch.ts says, in the bim's frame, from the flight's last orientation
      moving = moving || !reduced;
      p.mesh.shadow.visible = false;
      if (!held.shown) { p.mesh.group.visible = false; continue; }
      const toOffice = (v: V3): V3 => {
        const c = Math.cos(rig.dir);
        const sn = Math.sin(rig.dir);
        return { x: v.x * c + v.z * sn, y: v.y, z: -v.x * sn + v.z * c };
      };
      const end = reduced ? null : at(dur);
      const nose = toOffice(held.nose);
      const up = toOffice(held.up);
      let o = end === null ? { nose, up } : blendTurn(end, { nose, up }, held.hold);
      if (away === 'desk' && held.put > 0) {
        // laid as its desk lies (the letter after it: never a turn at the handoff)
        const fc = Math.cos(f.pose.seg.spot.face);
        const fs = Math.sin(f.pose.seg.spot.face);
        const byDesk = (v: V3): V3 => ({ x: v.x * fc + v.z * fs, y: v.y, z: -v.x * fs + v.z * fc });
        o = blendTurn(o, { nose: byDesk(ON_DESK.nose), up: byDesk(ON_DESK.up) }, held.put);
      }
      const side = HELD_LEN * (1 - 0.5 * held.quarter);
      // the hand grips it at `grip` along its length
      let c = { x: hand.x - o.nose.x * held.grip * side, y: hand.y - o.nose.y * held.grip * side, z: hand.z - o.nose.z * held.grip * side };
      if (away === 'desk' && desk !== null) c = mixV(c, desk, held.put);
      else c = mixV(c, { x: c.x + toOffice(POCKET_SINK).x, y: c.y, z: c.z + toOffice(POCKET_SINK).z }, held.put);
      if (away === 'desk' && held.put > 0) laid.add(f.name);
      p.mesh.setFold(held.fold);
      place(p.mesh, c, o.nose, o.up, side, side);
    }
    for (const [key, p] of planes) {
      if (!flying.has(key)) { root.remove(p.mesh.group, p.mesh.shadow); p.mesh.dispose(); planes.delete(key); }
    }
    // the sheets on desks: read, laid there, kept while the bim keeps its state (timeline.ts Pose.letter)
    const kept = new Set<string>();
    for (const f of frames) {
      if (f.pose.letter === undefined || laid.has(f.name) || awayOf(f.pose.seg.act) !== 'desk') continue;
      // its own catch still going (that plane's sheet is in its hand): none yet
      const spot = deskSpot(f.name, f.pose.seg.spot);
      if (!spot) continue;
      let m = letters.get(f.name);
      if (!m) {
        m = makePlane(style);
        m.setFold(1);
        letters.set(f.name, m);
        root.add(m.group);
      }
      m.setInk(light);
      kept.add(f.name);
      const c = Math.cos(f.pose.seg.spot.face);
      const sn = Math.sin(f.pose.seg.spot.face);
      const turn = (v: V3): V3 => ({ x: v.x * c + v.z * sn, y: v.y, z: -v.x * sn + v.z * c });
      place(m, spot, turn(ON_DESK.nose), turn(ON_DESK.up), HELD_LEN, HELD_LEN);
    }
    for (const [name, m] of letters) {
      if (!kept.has(name)) { root.remove(m.group); m.dispose(); letters.delete(name); }
    }
    return moving;
  }

  /** the way between two orientations (nlerp, the top squared to the nose again) */
  function blendTurn(a: { nose: V3; up: V3 }, b: { nose: V3; up: V3 }, f: number): { nose: V3; up: V3 } {
    const nose = unit(mixV(a.nose, b.nose, f));
    const u = mixV(a.up, b.up, f);
    const d = u.x * nose.x + u.y * nose.y + u.z * nose.z;
    return { nose, up: unit({ x: u.x - nose.x * d, y: u.y - nose.y * d, z: u.z - nose.z * d }) };
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
      } else if (night !== look.night) {
        // the theme: the town's world again; the office's only changes the page under it
        if (themed) rebuildWorld(look.night);
        else {
          night = look.night;
          world?.page(look.night);
        }
      }
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
      // the halo reads on the floor as lit: the night's (light) when the lamps are on, in the office
      drawHalos(frames, themed ? look.night : (lamps ?? 0) >= 0.5);
      for (const [name, d] of world.desks) {
        const rig = rigs.get(name);
        // from stage 9 every desk's lamp is lit at night, its bim there or not (cozy.ts cozyAt: the desk lamps); a stopped bim's stays off
        const allLit = cozyAt(grow.stage).deskLamps && (rig?.grey ?? 0) < 1;
        lightDesk(d, pal, rig?.screen ?? 0, (rig ? rig.lamp : name !== mainName()) || allLit, lamps ?? undefined);
        seatChair(d.chair, rig?.seat);
      }
      if (drawPlanes(t, frames, fit, !look.night, look.reduced, look.planeFrom)) motion = 'walk';
      // the office's own eggs: the ghost crossing asks for frames; april's outfits rebuild the bims once
      if (eggDecor?.update(look.eggs) === true) motion = 'walk';
      // the unlock moment: two bims bring the new piece in from the door
      if (unlock.update(t, office, look.unlock, look.unlock ? world.pieces.get(look.unlock.stage) : undefined, look.reduced, mapLook())) motion = 'walk';
      return motion;
    },
    sky() {
      if (!world) return null;
      // a sky event, not the bar changing colour (bims m_28109): the violet blended into the backdrop
      // the theme's own page (the office's world is the day's in both themes)
      const paper = themed ? world.pal.bg : paletteOf(night === true).bg;
      return eclipsed ? new Color(paper).lerp(new Color(WORLD.eclipse), ECLIPSE_MIX) : paper;
    },
    weather(l, c, up = 0) {
      lamps = l;
      cover = c;
      lift = up;
      world?.cover(c);
      world?.lift(up);
      world?.lit(l ?? (world.pal.pendants ? 1 : 0));
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
