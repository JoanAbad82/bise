// The town's seam between Town.tsx (the canvas, the signs, the loop, the drivers, the dive) and its
// renderer (render/town.ts, three, loaded with the office's chunk: import('../render')). Pure types.
// Each office is its project's own office scene (render/office-scene.ts), the minimap's: the town
// bakes it still from afar and poses it live when you look at it close (page town-live). Owner: maps-e.
import type { Motion, Office } from '../model';
import type { Grow } from '../growth';
import type { Fit } from '../render/camera';
import type { Cam } from '../zoom';
import type { Step } from '../office-driver';
import type { Placed } from './plan';

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
  /** draw now */
  frame(night: boolean): void;
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
}

export type MakeTownRenderer = (canvas: HTMLCanvasElement, opts?: TownOpts) => TownRenderer;
