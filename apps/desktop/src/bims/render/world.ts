// The world (three), every map the same way: the floating grass block (as wide as the garden has
// grown), then the map's look (render/maps/<id>.ts) on the plan's office: its shell, its eating
// place, its nap place, one desk per agent and main's, what the project's growth adds, and the cozy
// kit's pieces (render/cozy.ts: plants, coffee corner, base beds, shelf, posters, lamps), each
// stage's pieces in a group of its own (the unlock moment hides the newest). Built once per office, map, theme and growth; what changes per frame (a
// desk's screen and lamp) is handed back as handles. Its light is the view's (render/view.ts,
// lightOffice here sets it for an office; the sky's on top: render/sky-light.ts), and the snow on the
// lawn and the terrace (cover). The office's block (ground) also has the night's: four warm lamp
// pools that fade with the lamps (lit), its dirt sides lifted at night (lift, designer m_34173) and
// its soft shadow on the page, the slab's own shape under it (page: the theme's strength). Built with
// the day's palette in both themes (bims-light, direction A; the hero film's town passes its theme's). Never the
// accent pink or the error red.
import {
  type BufferGeometry,
  Color,
  DataTexture,
  Group,
  type HemisphereLight,
  type DirectionalLight,
  LinearFilter,
  type Material,
  Mesh,
  MeshBasicMaterial,
  type MeshLambertMaterial,
  type Object3D,
  PlaneGeometry,
  PointLight,
  RGBAFormat,
} from 'three';
import type { Office } from '../model';
import { NO_GROW, type Grow } from '../growth';
import { POOL, SIDE_MIN } from '../sky';
import { SHADOW_BLUR, SHADOW_DROP, SLAB_LOW, groundOf } from './camera';
import { slabWithPits } from './ground';
import { kitOf } from './kit';
import { buildCozy } from './cozy';
import { napRests, type NapRest } from './nap';
import type { Palette } from './palette';
import type { Build, DeskHandles, MapLook } from './maps/look';
import type { Style } from './style';

export type { DeskHandles };

/** each stage's pieces, by stage (1..14); 0: what every office has */
export type Pieces = ReadonlyMap<number, Group>;

export interface World {
  readonly root: Group;
  /** by agent name, main's under its own name */
  readonly desks: ReadonlyMap<string, DeskHandles>;
  readonly mainDesk: DeskHandles;
  readonly pal: Palette;
  /** each stage's pieces: the unlock moment hides the newest until it is brought in */
  readonly pieces: Pieces;
  /** each lounge bed's rest at this stage, measured on these meshes (render/nap.ts napRests; pose.ts lays its napper on it) */
  readonly naps: readonly (NapRest | undefined)[];
  /** the snow on the lawn and the terrace only (never desks or floors, bims m_33030): 0 none .. 1 white */
  cover(level: number): void;
  /** its night glows and lights (kit.ts glow, light: lanterns, pendants, shades, the lamp pools) at this level, 0..1: the sky's lamps */
  lit(level: number): void;
  /** the slab's dirt sides lifted toward SIDE_MIN (sky.ts Light.lift), 0 day .. 1 night */
  lift(level: number): void;
  /** the page under the cube: the dark theme's or the light one's (the shadow's strength) */
  page(dark: boolean): void;
  dispose(): void;
}

/** a map's own night lamp's pool (Office.lamps: the workshop's pods), a little softer than the common ones */
const LAMP_I = 4;

/** where the pools hang and how strong each is lit: main's desk, the island, the lounge, one desk, then the map's own lamps (Office.lamps) */
export function poolsOf(o: Office): { x: number; z: number; i: number }[] {
  const desks = [...o.desks.values()];
  const desk = desks[Math.min(3, desks.length - 1)];
  const at = [
    { s: o.mainDesk, i: 7 },
    { s: o.islandSpots[0], i: 7 },
    { s: o.lounge[0], i: 6 },
    { s: desk, i: 5 },
  ];
  return [...at.flatMap(({ s, i }) => (s ? [{ x: s.x, z: s.z, i }] : [])), ...(o.lamps ?? []).map((p) => ({ x: p.x, z: p.z, i: LAMP_I }))];
}

/** the cube's shadow on the page: black, this strong on the light page and the dark one (designer m_34173) */
const UNDER = { light: 0.15, dark: 0.35 } as const;
/** the shadow's texels per world unit */
const UNDER_RES = 12;

/**
 * The slab's soft shadow on the page: its own rounded footprint SHADOW_DROP under its underside,
 * blurred by SHADOW_BLUR and kept inside the slab's width (only under it, no halo). Unlit; the
 * slab hides the part right under it, so it shows only below the cube.
 */
function cubeShadow(w: number, d: number, x: number, z: number): Mesh {
  const pw = w + 2 * SHADOW_BLUR;
  const pd = d + 2 * SHADOW_BLUR;
  const tw = Math.max(8, Math.round(pw * UNDER_RES));
  const th = Math.max(8, Math.round(pd * UNDER_RES));
  const data = new Uint8Array(tw * th * 4);
  // the footprint inset by half the blur: the shadow's soft edge ends near the slab's own edge
  const hx = w / 2 - SHADOW_BLUR / 2;
  const hz = d / 2 - SHADOW_BLUR / 2;
  const r = 0.45;
  for (let j = 0; j < th; j++) {
    for (let i = 0; i < tw; i++) {
      const px = ((i + 0.5) / tw - 0.5) * pw;
      const pz = ((j + 0.5) / th - 0.5) * pd;
      // a rounded rectangle's signed distance
      const qx = Math.abs(px) - (hx - r);
      const qz = Math.abs(pz) - (hz - r);
      const sd = Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - r;
      const t = Math.max(0, Math.min(1, (sd + SHADOW_BLUR / 2) / SHADOW_BLUR));
      data[(j * tw + i) * 4 + 3] = Math.round(255 * (1 - t * t * (3 - 2 * t)));
    }
  }
  const map = new DataTexture(data, tw, th, RGBAFormat);
  map.magFilter = LinearFilter;
  map.minFilter = LinearFilter;
  map.needsUpdate = true;
  const geo = new PlaneGeometry(pw, pd);
  geo.rotateX(-Math.PI / 2);
  const m = new Mesh(geo, new MeshBasicMaterial({ color: 0x000000, map, transparent: true, opacity: UNDER.light, depthWrite: false }));
  m.position.set(x, SLAB_LOW - SHADOW_DROP, z);
  m.renderOrder = -1;
  m.castShadow = false;
  m.receiveShadow = false;
  return m;
}

/** the snow's white, and the most it covers (a little of the ground's colour shows through) */
const SNOW = new Color('#f4f6fa');
const SNOW_MAX = 0.85;

/** a lit desk lamp's glow */
const LAMP_ON_EI_LIT = 1.1;

/** every mesh under `root` casts and takes the sun's shadow (a style with shadows: clay) */
export function castShadows(root: Object3D): void {
  root.traverse((obj) => {
    if (obj instanceof Mesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
}

/** `ground`: its floating grass block (the town's lawn is its ground there: bims m_28807) */
export function buildWorld(o: Office, mainName: string, style: Style, look: MapLook, night: boolean, grow: Grow = NO_GROW, ground = true): World {
  const pal = look.pal(night);
  const k = kitOf(style, pal);
  const root = new Group();

  // the floating grass block, as wide as the garden has grown (camera.ts groundOf)
  const site = groundOf(o, grow);
  const gw = site.x1 - site.x0;
  const gd = site.z1 - site.z0;
  const gx = (site.x0 + site.x1) / 2;
  const gz = (site.z0 + site.z1) / 2;
  // holed where the map carves under its floor (California's bowl), so the carving shows
  const pits = look.pits?.(o, grow.stage) ?? [];
  // the dirt's own material (never kit.mat's shared one): at night its sides are lifted (lift())
  const dirt = style.material(pal.dirt, { emissive: SIDE_MIN, ei: 0 }) as MeshLambertMaterial;
  if (ground) {
    k.add(slabWithPits(style, gw, 1.2, gd, 0.45, gx, gz, pits), dirt, root, gx, SLAB_LOW + 0.6, gz);
    k.add(slabWithPits(style, gw, 0.16, gd, 0, gx, gz, pits), k.mat(pal.grass), root, gx, -0.1, gz);
    // the night's warm pools over main's desk, the island, the lounge and one desk: the lamps' (kit.light)
    for (const p of poolsOf(o)) {
      const l = k.light(new PointLight(POOL.color, p.i, POOL.distance, POOL.decay));
      l.position.set(p.x, POOL.y, p.z);
      root.add(l);
    }
  }

  // the map's look on the plan's office; the stages' groups made as the builders ask for them
  const pieces = new Map<number, Group>();
  const b: Build = {
    k, root, o, grow,
    stage(n) {
      if (n > grow.stage) return null;
      let grp = pieces.get(n);
      if (!grp) { grp = new Group(); pieces.set(n, grp); root.add(grp); }
      return grp;
    },
  };
  b.stage(0);
  look.shell(b);
  look.island(b);
  look.lounge(b);
  const desks = new Map<string, DeskHandles>();
  for (const [name, d] of o.desks) desks.set(name, look.desk(b, d, name));
  const mainDesk = look.mainDesk(b, mainName);
  desks.set(mainName, mainDesk);
  look.growth(b);
  // what makes it cozy from day one, and cozier at each stage (render/cozy.ts, Office.cozy)
  buildCozy(b, look.cozy, desks, mainName);
  // what each napper rests on, as built (bims-nap: never in the air over its bed)
  const naps = napRests(root, o, look, grow.stage);
  if (style.shadows) castShadows(root);
  // the cube's soft shadow on the page (designer m_34173): after castShadows, it takes and casts none
  const under = ground ? cubeShadow(gw, gd, gx, gz) : null;
  if (under) root.add(under);

  // the lawn's and the terrace's materials (kit.mat shares one per colour): what snow covers
  const ground0 = new Map<MeshLambertMaterial, Color>();
  const snowy = new Set([new Color(pal.grass).getHex(), new Color(pal.terrace).getHex()]);
  root.traverse((obj) => {
    if (!(obj instanceof Mesh)) return;
    for (const m of (Array.isArray(obj.material) ? obj.material : [obj.material]) as MeshLambertMaterial[]) {
      if (!m.map && snowy.has(m.color.getHex()) && !ground0.has(m)) ground0.set(m, m.color.clone());
    }
  });
  let covered = 0;
  let glowing = pal.pendants ? 1 : 0;

  return {
    root,
    desks,
    mainDesk,
    pal,
    pieces,
    naps,
    lit(level) {
      if (level === glowing) return;
      glowing = level;
      k.lit(level);
    },
    lift(level) {
      dirt.emissiveIntensity = level;
    },
    page(dark) {
      if (under) (under.material as MeshBasicMaterial).opacity = dark ? UNDER.dark : UNDER.light;
    },
    cover(level) {
      if (level === covered) return;
      covered = level;
      for (const [m, c] of ground0) m.color.copy(c).lerp(SNOW, level * SNOW_MAX);
    },
    dispose() {
      root.traverse((obj) => {
        if (obj instanceof Mesh) {
          (obj.geometry as BufferGeometry).dispose();
          const m = obj.material as Material | Material[];
          for (const x of Array.isArray(m) ? m : [m]) {
            const map = (x as MeshLambertMaterial).map;
            if (map) map.dispose();
            x.dispose();
          }
        }
      });
    },
  };
}

/**
 * The office's light on a view's two lights (render/view.ts): its palette's sky and sun, the sun up
 * and a little to the west of the room, its one soft shadow over the office (clay, bims m_27814; a
 * still office draws no frame, so it costs only when it moves).
 */
export function lightOffice(hemi: HemisphereLight, sun: DirectionalLight, pal: Palette, o: Office, style: Style): void {
  const { x0, W, D } = o;
  const cx = x0 + W / 2;
  hemi.color.set(pal.hemi[0]);
  hemi.groundColor.set(pal.hemi[1]);
  hemi.intensity = pal.hemi[2];
  sun.color.set(pal.sun[0]);
  sun.intensity = pal.sun[1];
  sun.position.set(cx - 5, 14, 3);
  sun.target.position.set(cx, 0, D / 2);
  sun.castShadow = style.shadows;
  if (style.shadows) {
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.radius = 8;
    sun.shadow.bias = -0.0008;
    const cam = sun.shadow.camera;
    const half = Math.max(W, D + 4) * 0.75 + 2;
    cam.left = -half;
    cam.right = half;
    cam.top = half;
    cam.bottom = -half;
    cam.near = 1;
    cam.far = 40;
    cam.updateProjectionMatrix();
  }
}

/**
 * A desk's screen and lamp for this frame. A desk lamp lights at night only (bims m_27836); by day it
 * is a cream shade. `level`: the sky's lamps (sky.ts lightOf, 0..1: they fade in over a blend, never
 * pop); absent: the theme's (on in the dark one).
 */
export function lightDesk(h: DeskHandles, pal: Palette, screen: number, lamp: boolean, level?: number): void {
  h.screen.emissiveIntensity = screen;
  h.screen.color.set(screen > 0.05 ? pal.screenOn : pal.screenOff);
  const on = lamp ? (level ?? (pal.pendants ? 1 : 0)) : 0;
  h.lamp.emissiveIntensity = on * LAMP_ON_EI_LIT;
  h.lamp.color.set(pal.lamp).lerp(LAMP_ON.set(pal.lampOn), on);
}
const LAMP_ON = new Color();
