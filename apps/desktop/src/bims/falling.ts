// What falls over the office (bims-sky): rain or snow as a CSS layer over the canvas, so it costs
// no WebGL frame (like the z's, zzz.ts). Clipped to the outdoors: never inside the room (bims
// m_33030: rain in the room reads as a leak), so its clip is the canvas minus the building's outline
// (render/index.ts falling: a convex hull in css px). Paused when the window is away (data-away),
// none under reduced motion (office.css). Pure: Office.tsx puts what this says on the layer only when
// it changed. Owner: bims-sky.

export interface Falling {
  readonly rain: number;
  readonly snow: number;
  readonly hull: readonly { readonly x: number; readonly y: number }[];
}

export interface FallingLook {
  /** the layer's kind, null: nothing falls (the layer hidden) */
  readonly kind: 'rain' | 'snow' | null;
  /** its density, 0..1 (its opacity) */
  readonly opacity: number;
  /** its clip-path: the canvas with the building cut out ('' when nothing falls) */
  readonly clip: string;
}

/** under this density nothing is shown (a blend's first frames, its tail) */
const MIN = 0.02;

const r1 = (n: number): string => String(Math.round(n * 10) / 10);

/** the layer's look for what falls on a w x h canvas; reduced motion: nothing (no particles) */
export function fallingLook(f: Falling | null, w: number, h: number, reduced: boolean): FallingLook {
  if (f === null || reduced || w <= 0 || h <= 0) return { kind: null, opacity: 0, clip: '' };
  const kind = f.snow > f.rain ? 'snow' : 'rain';
  const opacity = Math.max(f.rain, f.snow);
  if (opacity < MIN) return { kind: null, opacity: 0, clip: '' };
  const outer = `M0 0H${r1(w)}V${r1(h)}H0Z`;
  const inner = f.hull.length >= 3 ? `M${f.hull.map((p) => `${r1(p.x)} ${r1(p.y)}`).join('L')}Z` : '';
  return { kind, opacity: Math.round(opacity * 100) / 100, clip: `path(evenodd, '${outer}${inner}')` };
}

export const fallingSig = (l: FallingLook): string => `${l.kind ?? ''}|${String(l.opacity)}|${l.clip}`;
