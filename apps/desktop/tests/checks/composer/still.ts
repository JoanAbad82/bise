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

/** For each pair of frames: the pixels that changed outside `box` and outside the mask. */
export function changedOutsideStill(frames: Frame[], box: Box, mask: Mask | null): number[] {
  const out: number[] = [];
  for (let k = 1; k < frames.length; k++) {
    const A = frames[k - 1], B = frames[k];
    if (!A || !B) continue;
    const { width, height } = A.png, s = A.scale;
    let n = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (x >= box.x * s && x < (box.x + box.width) * s && y >= box.y * s && y < (box.y + box.height) * s) continue;
        if (mask && mask.width === width && mask.on[y * width + x]) continue;
        if (diff(A.png.data, B.png.data, (y * width + x) * 4) > THRESHOLD) n++;
      }
    }
    out.push(n);
  }
  return out;
}
