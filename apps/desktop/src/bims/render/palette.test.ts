import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { allColours, hash, outfitOf, rng } from './palette';

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
const reads = (c: string, a: string): boolean => {
  const [h1, s1] = hueSat(c);
  const [h2] = hueSat(a);
  const dh = Math.min(Math.abs(h1 - h2), 360 - Math.abs(h1 - h2));
  return s1 > 0.25 && dh < 20 && dist(c, a) < 90;
};

// the app's attention colours, read from the DS tokens (both themes), never written here
const tokens = readFileSync(resolve(__dirname, '../../ds/tokens.css'), 'utf8');
const attention = [...tokens.matchAll(/--p-(accent|err):\s*(#[0-9a-fA-F]{6})/g)].map((m) => m[2] as string);

describe('palette', () => {
  it('reads the accent and error colours from tokens.css', () => {
    expect(attention.length).toBeGreaterThanOrEqual(4);
  });

  it('knows a pink or a red when it sees one', () => {
    expect(reads('#f0a0b0', '#f4a6b0')).toBe(true);
    expect(reads('#e63946', '#ff5a52')).toBe(true);
    expect(reads('#ef8354', '#ff5a52')).toBe(true); // the prototype's coral: too red
    expect(reads('#f3d5b5', '#f4a6b0')).toBe(false); // a skin tone
  });

  it('never draws the accent pink or the error red (spec §1 rule 2)', () => {
    for (const c of allColours()) {
      expect(c).toMatch(/^#[0-9a-f]{6}$/);
      for (const a of attention) expect(reads(c, a.toLowerCase()), `${c} reads as ${a}`).toBe(false);
    }
  });

  it('dresses a bim the same way every time, main in ink', () => {
    expect(outfitOf('signup-perf', false)).toEqual(outfitOf('signup-perf', false));
    expect(outfitOf('main', true).hoodie).toBe('#1d1a17');
    expect(outfitOf('main', true).hat).toBe('main');
    expect(hash('a')).not.toBe(hash('b'));
  });

  it('seeds the same sequence', () => {
    const a = rng(7);
    const b = rng(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});
