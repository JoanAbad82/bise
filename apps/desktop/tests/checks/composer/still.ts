// What moves on its own (a pearl breathing, a progress bar's stripes) is not typing's doing. Record
// the window idle, keep the pixels that changed (grown by a few px), and count only changes outside
// the field AND outside that mask while he types. (qa-type; amb-tools may take it into frames.ts.)
import type { Box, Frame } from '../../harness';

export type Mask = { width: number; height: number; on: Uint8Array };

const diff = (a: Buffer, b: Buffer, i: number): number =>
  Math.abs((a[i] ?? 0) - (b[i] ?? 0)) + Math.abs((a[i + 1] ?? 0) - (b[i + 1] ?? 0)) + Math.abs((a[i + 2] ?? 0) - (b[i + 2] ?? 0));
const THRESHOLD = 24;

/** The pixels that changed in any pair of idle frames, grown by `grow` px. */
export function movingMask(idle: Frame[], grow = 3): Mask | null {
  const first = idle[0];
  if (!first) return null;
  const { width, height } = first.png;
  const hit = new Uint8Array(width * height);
  for (let k = 1; k < idle.length; k++) {
    const a = idle[k - 1]?.png.data, b = idle[k]?.png.data;
    if (!a || !b || idle[k]?.png.width !== width) continue;
    for (let p = 0; p < width * height; p++) if (diff(a, b, p * 4) > THRESHOLD) hit[p] = 1;
  }
  const on = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!hit[y * width + x]) continue;
      for (let dy = -grow; dy <= grow; dy++) {
        for (let dx = -grow; dx <= grow; dx++) {
          const X = x + dx, Y = y + dy;
          if (X >= 0 && Y >= 0 && X < width && Y < height) on[Y * width + X] = 1;
        }
      }
    }
  }
  return { width, height, on };
}

export const maskShare = (m: Mask | null): number => (m ? m.on.reduce((n, v) => n + v, 0) / (m.width * m.height) : 0);

/** Past this share of the window, the intended-motion boxes hide too much to judge (review-gates m_37859). */
export const MOVING_CAP = 0.05;

/** The share of the window the frames' intended-motion boxes cover (their union, in device px). */
export function movingShare(frames: Frame[]): number {
  const f = frames[0];
  if (!f) return 0;
  const { width, height } = f.png, s = f.scale;
  const boxes = frames.flatMap((x) => x.masks ?? []);
  if (boxes.length === 0) return 0;
  let n = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (boxes.some((b) => x >= b.x * s && x < (b.x + b.width) * s && y >= b.y * s && y < (b.y + b.height) * s)) n++;
    }
  }
  return n / (width * height);
}

/** For each pair of frames: the pixels that changed outside `box`, the mask and the frames'
 *  intended-motion boxes. Throws when those boxes cover more than MOVING_CAP of the window. */
export function changedOutsideStill(frames: Frame[], box: Box, mask: Mask | null): number[] {
  const share = movingShare(frames);
  if (share > MOVING_CAP) throw new Error(`intended-motion boxes cover ${(share * 100).toFixed(1)}%: too wide to judge`);
  const out: number[] = [];
  for (let k = 1; k < frames.length; k++) {
    const A = frames[k - 1], B = frames[k];
    if (!A || !B) continue;
    const { width, height } = A.png, s = A.scale;
    // the recorder's boxes of intended motion (frames.ts PEARL_SELECTOR: the pearls, the title bar's
    // status pill whose ∿ breathes while bise starts): a slow breath can miss the idle record
    const moving = B.masks ?? [];
    const inBox = (x: number, y: number, b: Box): boolean => x >= b.x * s && x < (b.x + b.width) * s && y >= b.y * s && y < (b.y + b.height) * s;
    let n = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (inBox(x, y, box)) continue;
        if (moving.some((b) => inBox(x, y, b))) continue;
        if (mask && mask.width === width && mask.on[y * width + x]) continue;
        if (diff(A.png.data, B.png.data, (y * width + x) * 4) > THRESHOLD) n++;
      }
    }
    out.push(n);
  }
  return out;
}
