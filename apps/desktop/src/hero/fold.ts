// His sent bubble folding into his paper plane, in the feed (Gabriel via main m_35063: « une animation
// au lancement qui fasse la continuité entre la boîte de chat et l'avion en papier en 3D »; bims
// m_35441): over FOLD_LINE_S before the 3D plane leaves, the words fade (WORDS), the bubble creases
// on its diagonal and folds into a dart (CREASE), the wings drop (DROP); it ends at the 3D plane's
// first frame: its middle, its length on screen, its heading (plane.ts glideHeading), paper with an
// ink edge, and the 3D plane takes over in the next frame. Pure: the feed draws its points. Owner: hero-town.

/** the fold's length, s (bims m_35441: 0.4 read as a flash) */
export const FOLD_LINE_S = 0.6;
/** its phases, fractions of FOLD_LINE_S: the words fade, the crease, the wings drop */
export const WORDS = 0.25;
export const CREASE = 0.67;

/** where the 3D plane leaves: its length on screen, css px, and its heading (a unit vector, y down) */
export interface Launch {
  readonly len: number;
  readonly hx: number;
  readonly hy: number;
}

/** the fold at one frame: the shape's corners (px, from the bubble's top left), how much paper it is, the words' opacity, the spine's */
export interface FoldShape {
  readonly points: readonly (readonly [number, number])[];
  /** 0 the bubble's colour, 1 the paper's */
  readonly paper: number;
  readonly words: number;
  /** the crease, then the dart's spine: its two ends, and its opacity */
  readonly spine: { readonly a: readonly [number, number]; readonly b: readonly [number, number]; readonly alpha: number };
}

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
const smooth = (x: number): number => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};
const mix = (a: readonly [number, number], b: readonly [number, number], k: number): [number, number] => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];

/** the dart from above, its wings open (`span` of its length each side), centred on (cx, cy): its tail's left tip, nose, tail's right tip, tail's middle. Pure. */
export function dart(cx: number, cy: number, l: Launch, span: number): [number, number][] {
  const h = Math.hypot(l.hx, l.hy) || 1;
  const hx = l.hx / h;
  const hy = l.hy / h;
  // its left on screen (y down): the heading turned a quarter counter-clockwise
  const lx = hy;
  const ly = -hx;
  const half = l.len / 2;
  const nose: [number, number] = [cx + hx * half, cy + hy * half];
  const tail: [number, number] = [cx - hx * half, cy - hy * half];
  const w = l.len * span;
  return [
    [tail[0] + lx * w, tail[1] + ly * w],
    nose,
    [tail[0] - lx * w, tail[1] - ly * w],
    // the tail's notch, a little toward the nose (the keel under the spine)
    [tail[0] + hx * l.len * 0.08, tail[1] + hy * l.len * 0.08],
  ];
}

/** the open sheet's half-span, then the dart's (plane.ts DART: sheet 0.39, span 0.3), of its length */
const SHEET = 0.39;
export const SPAN = 0.3;

/**
 * The shape (w × h css px: its box) folding at f (0..1 over its fold) into the dart `l` leaves as,
 * centred on the box's middle. `start`: its own corners (tail's left tip, nose, tail's right tip,
 * notch: the send button's arrow is a dart already, designer + bims m_36787/8); absent: the box's
 * (top left, top right, bottom right, bottom left). Pure.
 */
export function foldShape(f: number, w: number, h: number, l: Launch, start?: readonly (readonly [number, number])[]): FoldShape {
  const rect: readonly (readonly [number, number])[] = start ?? [
    [0, 0],
    [w, 0],
    [w, h],
    [0, h],
  ];
  const cx = w / 2;
  const cy = h / 2;
  const words = 1 - smooth(f / WORDS);
  const k = smooth((f - WORDS) / (CREASE - WORDS));
  const drop = smooth((f - CREASE) / (1 - CREASE));
  const flat = dart(cx, cy, l, SHEET);
  const folded = dart(cx, cy, l, SHEET + (SPAN - SHEET) * drop);
  const target = drop > 0 ? folded : flat;
  // the rect's corners to the dart's: top left to the left tip, top right to the nose, bottom right to the right tip, bottom left to the notch
  const points = rect.map((p, i) => mix(p, target[i] ?? p, k));
  // the crease: the bubble's diagonal (top right to bottom left), then the dart's spine (nose to notch)
  const nose = target[1] ?? [cx, cy];
  const notch = target[3] ?? [cx, cy];
  const spine = { a: mix(rect[1] ?? [w, 0], nose, k), b: mix(rect[3] ?? [0, h], notch, k), alpha: smooth((f - WORDS) / 0.1) };
  return { points, paper: k, words, spine };
}
