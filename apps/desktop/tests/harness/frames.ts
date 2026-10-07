// What renders over time: Chromium's own screencast (one PNG per compositor frame that changed,
// with its timestamp), decoded, and the measures the checks need on it. Pure measures take frames
// and boxes in CSS pixels; only Recorder talks to the app.
//   changedOutside(frames, box)  per consecutive pair, pixels that changed outside the box
//                                (typing must leave everything outside the field untouched),
//                                not counting the frames' masks: the pearls' boxes, an intended
//                                animation (ambient-lead m_11707; the Recorder reads them)
//   changedInside(frames, box)   same, inside the box
//   flashes(frames, box)         frames that differ from both neighbors while the neighbors match
//                                each other (a blink: a flicker, an emptied region drawn again)
//   maxJump(frames, box)         the largest mean per-pixel change between two frames in the box
//                                (an animation that jumps instead of moving)
// The screencast emits a frame only when something was drawn, so "no frame" = "nothing changed".
import { PNG } from 'pngjs';
import type { CDPSession, Page } from '@playwright/test';

export type Box = { x: number; y: number; width: number; height: number };
/** `masks`: boxes of intended animation (every [data-bise-pearl] and live pearl canvas on the page) */
export type Frame = { t: number; png: PNG; scale: number; masks?: Box[] };

/** Where the page draws a pearl: the ds Pearl slot and every live pearl canvas (the capsule's, the spotlight's). */
export const PEARL_SELECTOR = '[data-bise-pearl], canvas.b-live-pearl';

/** The boxes of every pearl on the page, in CSS pixels (empty when the page has none). */
export async function pearlBoxes(page: Page): Promise<Box[]> {
  return page.evaluate((sel) => Array.from(document.querySelectorAll(sel)).map((e) => {
    const r = e.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  }).filter((b) => b.width > 0 && b.height > 0), PEARL_SELECTOR).catch(() => []);
}

type ScreencastFrame = { data: string; sessionId: number; metadata: { timestamp?: number; deviceWidth: number } };

/** Records every frame the compositor draws, from start() to stop(). */
export class Recorder {
  private frames: Frame[] = [];
  private on = false;

  constructor(private readonly cdp: CDPSession, private readonly page: Page) {}

  private masks: Box[] = [];

  async start(): Promise<void> {
    this.frames = [];
    this.masks = await pearlBoxes(this.page);
    this.on = true;
    this.cdp.on('Page.screencastFrame', this.onFrame);
    await this.cdp.send('Page.startScreencast', { format: 'png', everyNthFrame: 1 });
  }

  private readonly onFrame = (f: ScreencastFrame): void => {
    void this.cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => undefined);
    if (!this.on) return;
    const png = PNG.sync.read(Buffer.from(f.data, 'base64'));
    this.frames.push({ t: f.metadata.timestamp ?? Date.now() / 1000, png, scale: png.width / f.metadata.deviceWidth });
  };

  async stop(): Promise<Frame[]> {
    await this.cdp.send('Page.stopScreencast').catch(() => undefined);
    this.on = false;
    this.cdp.off('Page.screencastFrame', this.onFrame);
    const masks = [...this.masks, ...(await pearlBoxes(this.page))]; // where the pearls were at the start and at the end
    for (const f of this.frames) f.masks = masks;
    return this.frames;
  }

  /** Frames while `act` runs (plus `settleMs` after it). */
  async during(act: () => Promise<void>, settleMs = 300): Promise<Frame[]> {
    await this.start();
    await act();
    await this.page.waitForTimeout(settleMs);
    return this.stop();
  }
}

const THRESHOLD = 24; // sum of |dr|+|dg|+|db| under this is encoder noise, not a change

/** |dr| + |dg| + |db| of the pixel at byte offset i (RGBA). */
const rgbDiff = (a: Buffer, b: Buffer, i: number): number =>
  Math.abs((a[i] ?? 0) - (b[i] ?? 0)) + Math.abs((a[i + 1] ?? 0) - (b[i + 1] ?? 0)) + Math.abs((a[i + 2] ?? 0) - (b[i + 2] ?? 0));

const inBox = (x: number, y: number, b: Box | undefined, s: number): boolean =>
  !!b && x >= b.x * s && x < (b.x + b.width) * s && y >= b.y * s && y < (b.y + b.height) * s;

/** Pixels that differ between two frames, counted inside or outside a box, never inside a mask. */
export function diffPixels(a: PNG, b: PNG, box: Box | undefined, where: 'inside' | 'outside', scale: number, masks: Box[] = []): number {
  if (a.width !== b.width || a.height !== b.height) return a.width * a.height;
  let n = 0;
  for (let y = 0; y < a.height; y++) {
    for (let x = 0; x < a.width; x++) {
      const inside = inBox(x, y, box, scale);
      if ((where === 'inside') !== inside) continue;
      if (masks.some((m) => inBox(x, y, m, scale))) continue;
      if (rgbDiff(a.data, b.data, (y * a.width + x) * 4) > THRESHOLD) n++;
    }
  }
  return n;
}

const pairs = <T>(xs: T[]): [T, T][] => {
  const out: [T, T][] = [];
  xs.forEach((x, i) => { const prev = xs[i - 1]; if (i > 0 && prev !== undefined) out.push([prev, x]); });
  return out;
};

/** Per pair, pixels changed outside the box, the pearls' boxes (the frames' masks) not counted. */
export function changedOutside(frames: Frame[], box: Box): number[] {
  return pairs(frames).map(([a, b]) => diffPixels(a.png, b.png, box, 'outside', a.scale, a.masks));
}

export function changedInside(frames: Frame[], box: Box): number[] {
  return pairs(frames).map(([a, b]) => diffPixels(a.png, b.png, box, 'inside', a.scale));
}

/** Mean absolute change per pixel (0..765) inside the box, between two frames. */
export function meanChange(a: Frame, b: Frame, box: Box): number {
  const s = a.scale;
  const x0 = Math.max(0, Math.floor(box.x * s)), y0 = Math.max(0, Math.floor(box.y * s));
  const x1 = Math.min(a.png.width, Math.ceil((box.x + box.width) * s)), y1 = Math.min(a.png.height, Math.ceil((box.y + box.height) * s));
  let sum = 0, n = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      sum += rgbDiff(a.png.data, b.png.data, (y * a.png.width + x) * 4);
      n++;
    }
  }
  return n ? sum / n : 0;
}

export function maxJump(frames: Frame[], box: Box): number {
  return Math.max(0, ...pairs(frames).map(([a, b]) => meanChange(a, b, box)));
}

/**
 * Indices of frames that differ from both neighbors (by > `big`, and by more than `ratio` times
 * what the neighbors differ from each other): the frame went somewhere and came back, a blink.
 * A moving animation changes steadily, so its neighbors differ about as much as the frame does.
 */
export function flashes(frames: Frame[], box: Box, big = 6, ratio = 3): number[] {
  const out: number[] = [];
  for (let i = 1; i + 1 < frames.length; i++) {
    const p = frames[i - 1], f = frames[i], n = frames[i + 1];
    if (!p || !f || !n) continue;
    const around = meanChange(p, n, box), before = meanChange(p, f, box), after = meanChange(f, n, box);
    if (before > big && after > big && before > ratio * around && after > ratio * around) out.push(i);
  }
  return out;
}

/** Mean change in the box between each pair of consecutive frames (to read a failure). */
export const changeSeries = (frames: Frame[], box: Box): number[] => pairs(frames).map(([a, b]) => meanChange(a, b, box));

/** Frames per second over the recording (frames are emitted only when something changed). */
export function fps(frames: Frame[]): number {
  const first = frames[0], last = frames[frames.length - 1];
  if (!first || !last || frames.length < 2) return 0;
  const span = last.t - first.t;
  return span > 0 ? (frames.length - 1) / span : 0;
}

/** A frame as a PNG file's bytes (for the report and 'show me'). */
export const pngBytes = (f: Frame): Buffer => PNG.sync.write(f.png);
