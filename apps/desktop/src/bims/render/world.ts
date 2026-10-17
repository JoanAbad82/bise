// The world (three), every map the same way: the floating grass block (as wide as the garden has
// grown), then the map's look (render/maps/<id>.ts) on the plan's office: its shell, its eating
// place, its nap place, one desk per agent and main's, and what the project's growth adds, each
// stage's pieces in a group of its own (the unlock moment hides the newest). Built once per office, map, theme and growth; what changes per frame (a
// desk's screen and lamp) is handed back as handles. Its light is the view's (render/view.ts,
// lightOffice here sets it for an office). Never the accent pink or the error red.
import {
  type BufferGeometry,
  Group,
  type HemisphereLight,
  type DirectionalLight,
  type Material,
  Mesh,
  type MeshLambertMaterial,
  type Object3D,
} from 'three';
import type { Office } from '../model';
import { NO_GROW, type Grow } from '../growth';
import { groundOf } from './camera';
import { slabWithPits } from './ground';
import { kitOf } from './kit';
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
  dispose(): void;
}

const LAMP_ON_EI = (pal: Palette): number => (pal.pendants ? 1.1 : 0.55);

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
  if (ground) {
    k.add(slabWithPits(style, gw, 1.2, gd, 0.45, gx, gz, pits), k.mat(pal.dirt), root, gx, -0.75, gz);
    k.add(slabWithPits(style, gw, 0.16, gd, 0, gx, gz, pits), k.mat(pal.grass), root, gx, -0.1, gz);
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
  if (style.shadows) castShadows(root);

  return {
    root,
    desks,
    mainDesk,
    pal,
    pieces,
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

/** a desk's screen and lamp for this frame */
export function lightDesk(h: DeskHandles, pal: Palette, screen: number, lamp: boolean): void {
  h.screen.emissiveIntensity = screen;
  h.screen.color.set(screen > 0.05 ? pal.screenOn : pal.screenOff);
  // a desk lamp lights at night only (bims m_27836); by day it is a cream shade
  const lit = lamp && pal.pendants;
  h.lamp.emissiveIntensity = lit ? LAMP_ON_EI(pal) : 0;
  h.lamp.color.set(lit ? pal.lampOn : pal.lamp);
}
