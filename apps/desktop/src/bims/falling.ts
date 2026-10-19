// What falls over the office (bims-sky): rain or snow as a CSS layer over the canvas, so it costs
// no WebGL frame (like the z's, zzz.ts). Clipped to the outdoors: never inside the room (bims
// m_33030: rain in the room reads as a leak), so its clip is the canvas minus the building's outline
// (render/index.ts falling: a convex hull in css px). Paused when the window is away (data-away),
// still under reduced motion (office.css: static streaks or flakes, so he can tell it rains, bims
// m_33351). Fog (and any haze) is a soft lift of the air's colour round the edges, the room clear
// (the haze layer: it reads in the dark theme too). Pure: Office.tsx puts what this says on the layer only when
// it changed. Owner: bims-sky.

export interface Falling {
  readonly rain: number;
  readonly snow: number;
  readonly hull: readonly { readonly x: number; readonly y: number }[];
  /** the haze (sky.ts: fog 0.8) and the air's colour */
  readonly haze: number;
  readonly air: string;
}

export interface FallingLook {
  /** the layer's kind, null: nothing falls (the layer hidden) */
  readonly kind: 'rain' | 'snow' | null;
  /** its density, 0..1 (its opacity) */
  readonly opacity: number;
  /** its clip-path: the canvas with the building cut out ('' when nothing falls) */
  readonly clip: string;
  /** the haze layer's opacity (0: none) and colour */
  readonly haze: number;
  readonly air: string;
}

/** under this density nothing is shown (a blend's first frames, its tail) */
const MIN = 0.02;

const r1 = (n: number): string => String(Math.round(n * 10) / 10);

/** the haze layer at full fog (its edges: the room stays clear) */
const HAZE_MAX = 0.75;

/** the layers' look for what falls on a w x h canvas (reduced motion: the same, held still by office.css) */
export function fallingLook(f: Falling | null, w: number, h: number): FallingLook {
  const none: FallingLook = { kind: null, opacity: 0, clip: '', haze: 0, air: '' };
  if (f === null || w <= 0 || h <= 0) return none;
  const hz = Math.round(Math.min(1, f.haze) * HAZE_MAX * 100) / 100;
  const haze = hz < MIN ? { haze: 0, air: '' } : { haze: hz, air: f.air };
  const kind = f.snow > f.rain ? 'snow' : 'rain';
  const opacity = Math.max(f.rain, f.snow);
  if (opacity < MIN) return { ...none, ...haze };
  const outer = `M0 0H${r1(w)}V${r1(h)}H0Z`;
  const inner = f.hull.length >= 3 ? `M${f.hull.map((p) => `${r1(p.x)} ${r1(p.y)}`).join('L')}Z` : '';
  return { kind, opacity: Math.round(opacity * 100) / 100, clip: `path(evenodd, '${outer}${inner}')`, ...haze };
}

export const fallingSig = (l: FallingLook): string => `${l.kind ?? ''}|${String(l.opacity)}|${l.clip}|${String(l.haze)}|${l.air}`;
