// A map's look (three): the drawing half of the prototype's REG entry (page bims-maps v5: pal,
// shell, island, lounge, desk, tree, wear), typed. world.ts builds every map the same way: the
// lights and the grass block, then the look's builders on the plan's office (maps/<id>.ts), each
// piece where the plan put its box (Office.furniture) so the walks stay clear. What the project's
// growth adds goes in its stage's group (Build.stage): the unlock moment hides the newest one until
// two bims bring it in (unlock.ts), at the look's pieceAt. One file per map
// (render/maps/<id>.ts), never the app's pink or red (looks.test.ts reads every palette). Owner: maps-a.
import type { BufferGeometry, Group, Material, Mesh, MeshLambertMaterial, Object3D } from 'three';
import type { Box, MapId, Office, Pt, Spot } from '../../model';
import type { Grow } from '../../growth';
import type { Kit } from '../kit';
import type { Seat } from '../furniture';
import type { Palette } from '../palette';
import type { Style } from '../style';
import type { CozyLook } from '../cozy';
import type { NapShape } from '../nap';

/** A desk's parts the frame drives (lightDesk) */
export interface DeskHandles {
  readonly screen: MeshLambertMaterial;
  readonly lamp: MeshLambertMaterial;
  /** the desk's centre at its top (pick, the overlay) */
  readonly top: { readonly x: number; readonly y: number; readonly z: number };
  /** its chair (a poke's chair spin turns it with its bim); absent: a map without one (a cushion, a stool) */
  readonly chair?: Seat;
  /** main's desk: the inbox tray's top (the welcome's pin 3, Office.pins); absent: the desk's top */
  readonly tray?: { readonly x: number; readonly y: number; readonly z: number };
}

/** What every builder gets: the kit (palette, shared materials), the world's root, the office, the growth. */
export interface Build {
  readonly k: Kit;
  readonly root: Group;
  readonly o: Office;
  readonly grow: Grow;
  /** the group of a growth stage (0: what every office has), made on first ask; null: not reached yet */
  stage(n: number): Group | null;
}

/** A bim's parts a map dresses (wear): built once per bim, after its outfit */
export interface Wear {
  readonly style: Style;
  readonly name: string;
  readonly head: Group;
  readonly body: Group;
  readonly arms: readonly Group[];
  readonly legs: readonly Group[];
  /** the bim's own material (it fades and goes grey with it) */
  mat(color: string): Material;
  add(geo: BufferGeometry, m: Material, parent: Object3D, x: number, y: number, z: number): Mesh;
}

export interface MapLook {
  readonly id: MapId;
  /** its colours by day (the light theme) and by night (dark) */
  pal(night: boolean): Palette;
  /** the floor, the walls, the windows, the door and what stands outside it */
  shell(b: Build): void;
  /** the eating place (the loft's kitchen island, a riad's fountain) on Office.island */
  island(b: Build): void;
  /** the nap place: a bed per lounge spot the stage has reached (growth.ts bedsAt: lounge spot i has one from that count, the loft's bean bags); a napper past them naps at its desk (timeline.ts bedFor) */
  lounge(b: Build): void;
  /** its own beds' shape past the cozy kit's two (render/nap.ts: how a napper lies on them); absent: flat */
  readonly bedShape?: NapShape;
  /** one agent's desk at its spot (its box in Office.furniture), its screen and lamp handed back */
  desk(b: Build, spot: Spot, name: string): DeskHandles;
  /** main's desk, the neon behind it */
  mainDesk(b: Build, name: string): DeskHandles;
  /** one of the garden's trees */
  tree(b: Build, parent: Object3D, x: number, z: number, size: number): void;
  /** the rest of the growth: each stage's pieces, the garden, the frames, the cones where the next piece goes */
  growth(b: Build): void;
  /** where a stage's piece stands (the unlock walk ends there, its label shows over it) */
  pieceAt(o: Office, stage: number): Pt;
  /** its cozy pieces' kinds and colours (render/cozy.ts; page bims-cozy v2 « la base, carte par carte »): where they stand is the plan's (Office.cozy) */
  readonly cozy: CozyLook;
  /** a small thing every bim but main wears on this map; absent: nothing */
  wear?(w: Wear): void;
  /** where the map carves under its floor at this stage (California's bowl): the ground block leaves a hole there (render/ground.ts); absent: none */
  pits?(o: Office, stage: number): readonly Box[];
}
