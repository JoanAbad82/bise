// The town's seam between Town.tsx (the canvas, the signs, the loop, the drivers, the dive) and its
// renderer (render/town.ts, three, loaded with the office's chunk: import('../render')). Pure types.
// Each office is its project's own office scene (render/office-scene.ts), the minimap's: the town
// bakes it still from afar and poses it live when you look at it close (page town-live). Owner: maps-e.
import type { Object3D } from 'three';
import type { Motion, Office } from '../model';
import type { Grow } from '../growth';
import type { Fit } from '../render/camera';
import type { Cam } from '../zoom';
import type { Step } from '../office-driver';
import type { Placed } from './plan';
import type { Sky } from '../sky';

/** One office's ground for the plan: its office (its map, its desks), its growth. */
export interface TownSite {
  readonly id: string;
  readonly office: Office;
  readonly grow: Grow;
  /** bise's own home: at the heart of the town (town/plan.ts) */
  readonly home?: boolean;
}

export interface TownRenderer {
  /** the town's offices: its plan laid again when a ground changed (town/plan.ts), a gone office's scene dropped */
  setTown(sites: readonly TownSite[]): void;
  /** an office from afar: its scene posed still (OfficeDriver.still) and baked into one object; true: it was baked again (its pose changed) */
  still(id: string, step: Step): boolean;
  /** an office close up: its scene posed live for t (OfficeDriver.step); how its loop must run next */
  live(id: string, step: Step, t: number): Motion;
  /** the offices to pose live at this view: the ones in view once it is close enough, at most LIVE_MAX */
  liveIds(): readonly string[];
  /** the fit an office's own Office opens with at this width, where the town put it (town/camera.ts diveFit); null: no such office */
  diveFit(id: string, widthPx: number): Fit | null;
  /** css px; the town fitted to the width, returns its height */
  setSize(widthPx: number, maxHeightPx: number): number;
  /** the town's fit at this size (null before a town and a size) */
  townFit(): Fit | null;
  /** what is drawn now: the dive's way, else the town through his camera (null before a town and a size) */
  shownFit(): Fit | null;
  /** the view drawn on the way into an office (the dive), null: his camera's */
  setView(fit: Fit | null): void;
  /** his pinch and pan (zoom.ts): the town's fit seen closer, the canvas's size unchanged; FIT the whole town */
  setCam(cam: Cam): void;
  /**
   * Draw now. `sky`: his local time's (sky.ts), blended from the drawn one; absent: the theme's
   * fixed light (the hero's film). True while a sky blend runs (the caller's next frame at 30 fps).
   */
  frame(night: boolean, sky?: TownSky): boolean;
  /** a sign's foot on the canvas (css px), over its office's back wall; null off view */
  signAt(id: string): { readonly x: number; readonly y: number } | null;
  /** the office under a canvas point (css px), its roofs first; null on the lawn */
  pick(x: number, y: number): string | null;
  /** a live office's bim's head on the canvas (css px; its label goes there) and its feet's y; null off view or not live */
  headOf(id: string, name: string): { readonly x: number; readonly y: number; readonly feet: number } | null;
  /** the live office's bim under a canvas point (pick.ts: the nearest body); null: none */
  pickBim(x: number, y: number): { readonly id: string; readonly name: string } | null;
  /** where the plan put an office (its offset and its ground, town units); null: no such office */
  placedOf(id: string): Placed | null;
  /** the town as drawn, onto a 2d canvas of the same pixel size */
  copyTo(target: HTMLCanvasElement): void;
  onLost(cb: () => void): void;
  /** the entry build's handle (TownOpts.entry) */
  readonly entry: TownEntry;
  dispose(): void;
}

/**
 * How a town is drawn past the app's own: bise.dev's hero (src/hero) poses every office live at
 * every zoom (allLive: three offices, never one baked again as the camera moves) in a canvas the
 * size of its box (box: the whole town in it, the sky around, the page's paper). The app passes none.
 */
export interface TownOpts {
  /** every office posed live, in view or not (else: the ones in view past LIVE_ZOOM, LIVE_MAX at most) */
  readonly allLive?: boolean;
  /** the canvas is the whole width × height asked (setSize's maxHeightPx), the town whole and centred in it */
  readonly box?: boolean;
  /** the sky behind the town, by theme (the page's paper, so the canvas has no edge); absent: the palette's */
  readonly sky?: { readonly day: string; readonly night: string };
  /** at night, the light's strength times this (the hero on a dark page: bims m_31057); absent: 1 */
  readonly nightLift?: number;
  /**
   * the hero's film, as signed (bims m_34678): its offices and townscape keep the theme's materials
   * (the night palette in dark) under the palette's fixed light. Absent: the day's materials in both
   * themes under the sky's one light (sky.ts lightOf), as the office.
   */
  readonly themed?: boolean;
  /**
   * a transparent canvas over the page's own layers (the hero's chat): the glides drawn there, over
   * them (Look.planesUp, office-scene's UP_LAYER), with the same camera; absent: every plane in the town's canvas
   */
  readonly planesOver?: HTMLCanvasElement;
  /**
   * the hero's entry build (design's hero-entry §2): the town drawn loose, its townscape and its
   * offices' worlds unmerged (their bakes made at once, hidden) so each thing can be grown in, until
   * settle(). Absent: merged from the first frame.
   */
  readonly entry?: boolean;
  /** the hero's: the pieces a map tags as standing between the camera and the room are left out (main hidden behind the workshop's door frame: Gabriel via main m_31852) */
  readonly clearView?: boolean;
}

/** the sky a town frame is drawn under (sky.ts): its target, the time, reduced motion (a slower fade) */
export interface TownSky {
  readonly sky: Sky;
  readonly t: number;
  readonly reduced: boolean;
}

/** What the entry build moves (TownOpts.entry): the town's things, loose, as drawn now. */
export interface TownParts {
  /** the townscape unmerged (its slab, its roads, its trees...), null once settled */
  readonly scape: Object3D | null;
  /** the lawn's middle, town units */
  readonly centre: { readonly x: number; readonly z: number };
  /** the lawn (its ground block), town units: the entry cuts it into cubes */
  readonly lawn: { readonly x0: number; readonly x1: number; readonly z0: number; readonly z1: number };
  /** where the lawn has holes (an office's pit: California's bowl), town units: no cube there */
  readonly pits: readonly { readonly x0: number; readonly x1: number; readonly z0: number; readonly z1: number }[];
  readonly offices: readonly {
    readonly id: string;
    /** the office's root, where the plan put it */
    readonly root: Object3D;
    /** its world (walls, floor, furniture), unmerged while the entry holds; null before one */
    readonly world: Object3D | null;
    /** its office's width, office units */
    readonly width: number;
    /** its bims' bodies by name */
    readonly bims: readonly { readonly name: string; readonly body: Object3D }[];
  }[];
}

/** The entry build's handle on the renderer (TownOpts.entry). */
export interface TownEntry {
  /** the loose things now (null before a town) */
  parts(): TownParts | null;
  /** on: the merged townscape and walls drawn too (for an unseen warm frame), off: hidden again */
  warm(on: boolean): void;
  /** the loose things drawn again, the merged ones hidden (the hero's fold, then its next loop's build) */
  hold(): void;
  /** the build is over: the merged townscape and walls drawn from now on, the loose ones dropped */
  settle(): void;
}

export type MakeTownRenderer = (canvas: HTMLCanvasElement, opts?: TownOpts) => TownRenderer;
