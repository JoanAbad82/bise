// What falls over the office (bims-sky): rain or snow as a CSS layer over the canvas, so it costs
// no WebGL frame (like the z's, zzz.ts). Clipped to the outdoors: never inside the room (bims
// m_33030: rain in the room reads as a leak) and never on the page around the cube (bims m_34321):
// its clip is the cube's outline (raised by the room's height) minus the building's outline
// (render/index.ts falling: a convex hull in css px). Paused when the window is away (data-away),
// still under reduced motion (office.css: static streaks or flakes, so he can tell it rains, bims
// m_33351). Fog is in the light alone (sky.ts: a greyer fill, a soft shadow), never a veil over the
// page (bims-light, direction A). Pure: Office.tsx puts what this says on the layer only when it
// changed. Owner: bims-sky.

export interface Falling {
  readonly rain: number;
  readonly snow: number;
  readonly hull: readonly { readonly x: number; readonly y: number }[];
  /** the cube's outline on the canvas (its top raised by the room's height): it falls inside it only, never on the page (bims m_34321) */
  readonly cube: readonly { readonly x: number; readonly y: number }[];
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

/** the layer's look for what falls on a w x h canvas (reduced motion: the same, held still by office.css) */
export function fallingLook(f: Falling | null, w: number, h: number): FallingLook {
  const none: FallingLook = { kind: null, opacity: 0, clip: '' };
  if (f === null || w <= 0 || h <= 0) return none;
  const kind = f.snow > f.rain ? 'snow' : 'rain';
  const opacity = Math.max(f.rain, f.snow);
  if (opacity < MIN) return none;
  const poly = (ps: Falling['hull']): string => `M${ps.map((p) => `${r1(p.x)} ${r1(p.y)}`).join('L')}Z`;
  const outer = f.cube.length >= 3 ? poly(f.cube) : `M0 0H${r1(w)}V${r1(h)}H0Z`;
  const inner = f.hull.length >= 3 ? poly(f.hull) : '';
  return { kind, opacity: Math.round(opacity * 100) / 100, clip: `path(evenodd, '${outer}${inner}')` };
}

export const fallingSig = (l: FallingLook): string => `${l.kind ?? ''}|${String(l.opacity)}|${l.clip}`;
