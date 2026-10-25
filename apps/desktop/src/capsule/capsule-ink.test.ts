// The words on the capsule's glass meet a contrast floor (menubar-contrast: his dropdown's heads
// and quiet names read 1.2:1 on his pink glass). The glass is macOS's 'menu' vibrancy, which a
// test can't draw (it renders off screen), so it is modelled from his two shots on the same pink
// wallpaper (his Sound panel's glass read ~0.5 x the wallpaper in dark; light: 0.35 x the
// wallpaper over a near-white): each text role of capsule.css, composited at its alpha over the
// glass on a light, a pink and a dark wallpaper, meets its floor (WCAG contrast) on the worst one.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

type Rgb = readonly [number, number, number];
interface Ink { readonly rgb: Rgb; readonly a: number }

const css = readFileSync(join(__dirname, 'capsule.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

/** A css colour, '#rrggbb' or 'rgba(r, g, b, a)'. */
function inkOf(v: string): Ink {
  const hex = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(v);
  if (hex) return { rgb: [parseInt(hex[1] ?? '', 16), parseInt(hex[2] ?? '', 16), parseInt(hex[3] ?? '', 16)], a: 1 };
  const m = /^rgba\(\s*(\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\s*\)$/.exec(v);
  if (!m) throw new Error(`not a colour: ${v}`);
  return { rgb: [Number(m[1]), Number(m[2]), Number(m[3])], a: Number(m[4]) };
}

/** Each block of capsule.css that sets --c-text, in order: dark, light (system), light (his pref). */
const sets = [...css.matchAll(/\{([^{}]*--c-text:[^{}]*)\}/g)].map((m) =>
  Object.fromEntries([...(m[1] ?? '').matchAll(/(--c-[\w-]+):\s*([^;]+);/g)].map((p): [string, string] => [p[1] ?? '', (p[2] ?? '').trim()])),
);

const lin = (c: number): number => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const lum = ([r, g, b]: Rgb): number => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const over = (fg: Ink, bg: Rgb): Rgb => [0, 1, 2].map((i) => (fg.rgb[i] ?? 0) * fg.a + (bg[i] ?? 0) * (1 - fg.a)) as unknown as Rgb;
const contrast = (a: Rgb, b: Rgb): number => {
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

const WALLPAPERS: Record<string, Rgb> = { light: [232, 230, 236], pink: [196, 112, 160], dark: [28, 30, 40] };
const GLASS: Record<'dark' | 'light', (w: Rgb) => Rgb> = {
  dark: (w) => w.map((c) => 0.5 * c) as unknown as Rgb,
  light: (w) => w.map((c) => 0.35 * c + 0.65 * 246) as unknown as Rgb,
};
/** The floor per role on the worst wallpaper: the words, the quiet words, the heads and keys, the '?'. */
const FLOOR: Record<string, number> = { '--c-text': 4, '--c-text-2': 2.9, '--c-text-3': 2.4, '--c-accent': 3 };
/** On his pink wallpaper (the shot he sent), higher: what the native panel gives there. */
const PINK_FLOOR: Record<string, number> = { '--c-text': 7, '--c-text-2': 4.5, '--c-text-3': 3.5, '--c-accent': 4.5 };

const worst = (mode: 'dark' | 'light', role: string): { min: number; pink: number } => {
  const set = mode === 'dark' ? sets[0] : sets[1];
  const ink = inkOf(set?.[role] ?? '');
  const by = Object.entries(WALLPAPERS).map(([n, w]): [string, number] => {
    const g = GLASS[mode](w);
    return [n, contrast(over(ink, g), g)];
  });
  return { min: Math.min(...by.map(([, c]) => c)), pink: by.find(([n]) => n === 'pink')?.[1] ?? 0 };
};

describe('the words on the capsule glass', () => {
  it('capsule.css sets the glass inks once for dark and the same for light (the system and his pref)', () => {
    expect(sets).toHaveLength(3);
    expect(sets[2]).toEqual(sets[1]);
    for (const s of sets) expect(Object.keys(s).sort()).toEqual(['--c-accent', '--c-hover', '--c-line', '--c-line-strong', '--c-text', '--c-text-2', '--c-text-3']);
  });

  for (const mode of ['dark', 'light'] as const) {
    for (const role of Object.keys(FLOOR)) {
      it(`${mode}: ${role} meets its floor over a light, a pink and a dark wallpaper`, () => {
        const { min, pink } = worst(mode, role);
        expect(min, `${role} worst case`).toBeGreaterThanOrEqual(FLOOR[role] ?? 0);
        expect(pink, `${role} on his pink wallpaper`).toBeGreaterThanOrEqual(PINK_FLOOR[role] ?? 0);
      });
    }
  }

  it("the old window greys fail it (the check sees what he saw): dark text-3 #857d72 on the pink glass", () => {
    const g = GLASS.dark(WALLPAPERS.pink ?? [0, 0, 0]);
    expect(contrast(inkOf('#857d72').rgb, g)).toBeLessThan(PINK_FLOOR['--c-text-3'] ?? 0);
  });

  it('the roles keep their order: text over text-2 over text-3', () => {
    for (const s of sets) {
      const [a, b, c] = ['--c-text', '--c-text-2', '--c-text-3'].map((r) => inkOf(s[r] ?? '').a);
      expect(a).toBeGreaterThan(b ?? 1);
      expect(b).toBeGreaterThan(c ?? 1);
    }
  });
});
