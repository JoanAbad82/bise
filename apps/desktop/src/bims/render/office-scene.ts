// One office as a scene (page town-live p2, architect m_28994): its world (world.ts, its map's look
// and growth), one bim per BimFrame posed by pose.ts (bim.ts), his paper planes (plane.ts), the
// halo under a lit bim, the office's eggs (eggdecor.ts) and the unlock moment's crew (unlock.ts),
// all in one group in the office's own units. No renderer, no camera, no light: the minimap
// (render/index.ts) draws it through its view, the town places one per project. frame() poses it
// for time t and says how the loop must run next (Motion); the caller renders. Owner: bims-wire.
import { Color, Group, Mesh, MeshBasicMaterial, RingGeometry, type ColorRepresentation, type Object3D, type Vector3 } from 'three';
import type { Agent } from '@/proto';
import type { BimFrame, Look, Motion, Office } from '../model';
import { makeBim, type Bim } from './bim';
import { type Fit, aboveTop } from './camera';
import { flightAt, makePlane, type Plane } from './plane';
import { PLANE_FLIGHT, louder, rigOf, type Rig } from './pose';
import { skateRig } from './skate';
import { eggRig } from './egg';
import { makeEggDecor, type EggDecor } from './eggdecor';
import { MAIN_HOODIE, WORLD, outfitOf, type Outfit, type Palette } from './palette';
import { buildWorld, castShadows, lightDesk, type DeskHandles, type World } from './world';
import { NO_GROW, growSig, type Grow } from '../growth';
import { lookOf } from './maps';
import type { MapLook } from './maps/look';
import { makeUnlock } from './unlock';
import type { Style } from './style';

/** his plane's length in office units (plane.ts's wings), its least length on screen, and the iso view's shortening of it */
const PLANE_LEN = 0.42;
const PLANE_MIN_PX = 12;
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

/** `ground`: its floating grass block (false in the town: its lawn is the ground) */
export function makeOfficeScene(style: Style, o: { readonly ground?: boolean } = {}): OfficeScene {
  const ground = o.ground ?? true;
  const root = new Group();
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
  const unlock = makeUnlock(root, style);
  const bims = new Map<string, Bim>();
  const rigs = new Map<string, Rig>();
  const planes = new Map<string, Plane>();
  // the halo under a lit bim (focus.ts): one ring, flat on the floor, shown under each lit bim's feet
  const haloGeo = new RingGeometry(HALO.inner, HALO.outer, 40);
  haloGeo.rotateX(-Math.PI / 2);
  const haloMat = new MeshBasicMaterial({ color: HALO.day, transparent: true, opacity: HALO.alpha, depthWrite: false });
  const halos = new Map<string, Mesh>();

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

  function drawPlanes(frames: readonly BimFrame[], fit: Fit): boolean {
    const flying = new Set<string>();
    for (const f of frames) {
      const s = f.pose.plane?.since;
      if (s === undefined || s < 0 || s >= PLANE_FLIGHT) continue;
      const rig = rigs.get(f.name);
      if (!rig) continue;
      flying.add(f.name);
      let p = planes.get(f.name);
      if (!p) { p = makePlane(style); planes.set(f.name, p); root.add(p.group); }
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
      if (!flying.has(name)) { root.remove(p.group); p.dispose(); planes.delete(name); }
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
        rigs.set(f.name, rig);
        seen.add(f.name);
        motion = louder(motion, rig.motion);
        onRig?.(f, rig, skater !== null);
      }
      for (const [name, b] of bims) if (!seen.has(name)) b.group.visible = false;
      drawHalos(frames, look.night);
      for (const [name, d] of world.desks) {
        const rig = rigs.get(name);
        lightDesk(d, pal, rig?.screen ?? 0, rig ? rig.lamp : name !== mainName());
      }
      if (!look.reduced && drawPlanes(frames, fit)) motion = 'walk';
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
      for (const p of planes.values()) p.dispose();
      planes.clear();
      for (const h of halos.values()) root.remove(h);
      halos.clear();
      haloGeo.dispose();
      haloMat.dispose();
    },
  };
}
