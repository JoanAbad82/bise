// bise's ':*' as numbers (designer's bise-presence v10, page blocks v8-kiss and v8-team): the one
// geometry every drawing of it reads. The SVG mark (src/ds/mark.tsx), the menu bar's template
// images (src/main/tray.ts, rasterized here: Electron's Tray takes no SVG) and the large mist
// mark's shader (src/pearl/shader.ts) all draw from these. Pure, no DOM, no Electron.
//
// The box is 100 × 100: two round eyes on the left (the colon), the star on the right, its
// branches lines through (64, 56). The star is the team (1b): one branch per running agent
// (1 = one stroke, 2 = a cross, 3 = bise's star, capped at 6); no agent, the plain three.

export const BOX = 100;
/** The eyes' centres and radius (rects 15 × 15, rx 7.5, at x 21, y 28.5 and 58.5). */
export const EYES: readonly (readonly [number, number])[] = [
  [28.5, 36],
  [28.5, 66],
];
export const EYE_R = 7.5;
/** The star's centre and its branches' half length (the lines run 39 → 73 at x 64). */
export const STAR: readonly [number, number] = [64, 56];
export const ARM = 17;
/** The most branches the star shows (designer m_24497: cap at 6). */
export const MAX_ARMS = 6;
/** The plain star: no agent at work. */
export const PLAIN_ARMS = 3;

/** The branches for a count of running agents: none is the plain star, more than 6 is 6. Pure. */
export function armCount(running: number): number {
  if (!Number.isFinite(running) || running <= 0) return PLAIN_ARMS;
  return Math.min(MAX_ARMS, Math.floor(running));
}

/** Each branch's angle in degrees from upright, spread over half a turn (a line goes both ways). Pure. */
export function armAngles(n: number): number[] {
  const k = Math.max(1, Math.min(MAX_ARMS, Math.floor(n)));
  return Array.from({ length: k }, (_, i) => (i * 180) / k);
}

/** The star's stroke for a box size in px: thicker as it gets small, so it holds at 14 px (v8's .w-bar / .w-cap). Pure. */
export function markStroke(size: number): number {
  if (size <= 16) return 11;
  if (size <= 30) return 9;
  return 7;
}

const segDist = (px: number, py: number, ax: number, ay: number, bx: number, by: number): number => {
  const vx = bx - ax;
  const vy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy)));
  return Math.hypot(px - ax - t * vx, py - ay - t * vy);
};

export interface MarkShape {
  /** the star turned by this many degrees (the tray's working steps) */
  readonly turn?: number;
  /** the star scaled about its centre (the two kisses' beats) */
  readonly beat?: number;
  /** branches (armCount); default the plain three */
  readonly arms?: number;
  /** stroke width in box units; default markStroke for the size */
  readonly stroke?: number;
}

/**
 * The signed distance, in box units, from a point of the box to the eyes and to the star (negative
 * inside). Pure: the rasterizer's and the tests' one source.
 */
export function markDistance(x: number, y: number, stroke: number, s: MarkShape = {}): { readonly eyes: number; readonly star: number } {
  const eyes = Math.min(...EYES.map(([cx, cy]) => Math.hypot(x - cx, y - cy) - EYE_R));
  const beat = s.beat ?? 1;
  const half = ARM * beat;
  const [cx, cy] = STAR;
  let star = Infinity;
  for (const a of armAngles(s.arms ?? PLAIN_ARMS)) {
    const r = ((a + (s.turn ?? 0)) * Math.PI) / 180;
    const dx = Math.sin(r) * half;
    const dy = -Math.cos(r) * half;
    star = Math.min(star, segDist(x, y, cx - dx, cy - dy, cx + dx, cy + dy) - (stroke * beat) / 2);
  }
  return { eyes, star };
}

export type Rgba = readonly [number, number, number, number];

/**
 * The ':*' as RGBA pixels, `px` square, antialiased (coverage from the distance over one pixel):
 * the eyes in `eyes`, the star in `star`, the rest transparent. Straight (not premultiplied) alpha.
 * Pure: the tray turns it into its images.
 */
export function rasterMark(px: number, eyes: Rgba, star: Rgba, s: MarkShape & { readonly size: number }): Uint8Array {
  const out = new Uint8Array(px * px * 4);
  const unit = BOX / px; // box units per pixel
  const stroke = s.stroke ?? markStroke(s.size);
  const cover = (d: number): number => Math.max(0, Math.min(1, 0.5 - d / unit));
  for (let j = 0; j < px; j++) {
    for (let i = 0; i < px; i++) {
      const d = markDistance((i + 0.5) * unit, (j + 0.5) * unit, stroke, s);
      const ce = cover(d.eyes);
      const cs = cover(d.star);
      const c = cs >= ce ? star : eyes;
      const a = Math.max(ce * eyes[3], cs * star[3]);
      const o = (j * px + i) * 4;
      out[o] = c[0];
      out[o + 1] = c[1];
      out[o + 2] = c[2];
      out[o + 3] = Math.round(a);
    }
  }
  return out;
}
