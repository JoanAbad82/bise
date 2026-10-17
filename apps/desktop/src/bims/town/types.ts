// The town's seam between Town.tsx (the canvas, the signs, the loop, the dive) and its renderer
// (render/town.ts, three, loaded with the office's chunk: import('../render')). Pure types. Owner: maps-e.
import type { Office } from '../model';
import type { Grow } from '../growth';
import type { Fit } from '../render/camera';
import type { Still } from './stand';

/** One office of the town: its plan's office, its main's name, its growth, its bims as still silhouettes. */
export interface TownOffice {
  readonly id: string;
  readonly office: Office;
  readonly main: string;
  readonly grow: Grow;
  readonly still: Still;
}

export interface TownRenderer {
  /** the town changed (a project came, an office grew, a bim moved): its plan laid again when a ground changed (town/plan.ts), what changed built again */
  setTown(offices: readonly TownOffice[]): void;
  /** the fit an office's own Office opens with at this width, where the town put it (town/camera.ts diveFit); null: no such office */
  diveFit(id: string, widthPx: number): Fit | null;
  /** css px; the town fitted to the width, returns its height */
  setSize(widthPx: number, maxHeightPx: number): number;
  /** the town's fit at this size (null before a town and a size) */
  townFit(): Fit | null;
  /** the view drawn: a fit on the way to an office (the dive), null for the town's own; the canvas takes its height */
  setView(fit: Fit | null): void;
  /** draw now; `dim`: every office but this one a little darker (the dive's way in) */
  frame(night: boolean, dim: string | null): void;
  /** a sign's foot on the canvas (css px), over its office's back wall; null off view */
  signAt(id: string): { readonly x: number; readonly y: number } | null;
  /** the office under a canvas point (css px), its roofs first; null on the lawn */
  pick(x: number, y: number): string | null;
  /** the town as drawn, onto a 2d canvas of the same pixel size (the swap's crossfade) */
  copyTo(target: HTMLCanvasElement): void;
  onLost(cb: () => void): void;
  dispose(): void;
}

export type MakeTownRenderer = (canvas: HTMLCanvasElement) => TownRenderer;
