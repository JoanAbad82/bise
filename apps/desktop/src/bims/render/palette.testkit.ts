// The palette law's eye (palette.test.ts, objects/index.test.ts): does a colour read as the app's
// accent pink or its error red? The attention colours are read from the DS tokens (both themes),
// never written here. Tests only.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const rgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const dist = (a: string, b: string): number => {
  const [r1, g1, b1] = rgb(a);
  const [r2, g2, b2] = rgb(b);
  return Math.hypot(r1 - r2, g1 - g2, b1 - b2);
};
/** the hue in degrees and the saturation (HSV) */
const hueSat = (hex: string): [number, number] => {
  const [r, g, b] = rgb(hex).map((x) => x / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (d === 0) return [0, 0];
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, d / max];
};

/** a colour reads as the accent or the error when it is near it AND of its hue (a skin tone or a beige is not) */
export const reads = (c: string, a: string): boolean => {
  const [h1, s1] = hueSat(c);
  const [h2] = hueSat(a);
  const dh = Math.min(Math.abs(h1 - h2), 360 - Math.abs(h1 - h2));
  return s1 > 0.25 && dh < 20 && dist(c, a) < 90;
};

const tokens = readFileSync(resolve(__dirname, '../../ds/tokens.css'), 'utf8');
/** the app's attention colours (--p-accent, --p-err, both themes), lower case */
export const ATTENTION: readonly string[] = [...tokens.matchAll(/--p-(accent|err):\s*(#[0-9a-fA-F]{6})/g)].map((m) => (m[2] as string).toLowerCase());

/** the attention colour `c` reads as, if any */
export const readsAsAttention = (c: string): string | undefined => ATTENTION.find((a) => reads(c, a));
