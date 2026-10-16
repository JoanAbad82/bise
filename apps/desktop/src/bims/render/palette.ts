// The office's colours (pure, no three): one palette for day and one for night (the app's light and
// dark themes), the bims' clothes, and the seeded hash/rng every per-bim choice comes from. The world
// is joyful but never uses the accent pink or the error red (spec §1 rule 2): palette.test.ts checks
// every colour here against tokens.css's --p-accent and --p-err in both themes.

export interface Palette {
  readonly bg: string;
  readonly grass: string;
  readonly dirt: string;
  readonly floor: string;
  readonly wall: string;
  readonly wallTop: string;
  readonly desk: string;
  readonly deskTop: string;
  readonly island: string;
  readonly islandTop: string;
  readonly ink: string;
  readonly rug: string;
  readonly islandRug: string;
  readonly plant: string;
  readonly screenOn: string;
  readonly screenOff: string;
  readonly terrace: string;
  readonly window: string;
  readonly lampOn: string;
  /** a desk lamp's base, stem and shade: cream by day and by night (bims m_28080: dark ones read as posts) */
  readonly lamp: string;
  readonly neon: string;
  /** hemisphere light: sky, ground, intensity */
  readonly hemi: readonly [string, string, number];
  /** the sun: colour, intensity */
  readonly sun: readonly [string, number];
  /** warm point lights over the island (night only) */
  readonly pendants: boolean;
}

export const DAY: Palette = {
  bg: '#fdfbf7', grass: '#86c96f', dirt: '#9a6a45', floor: '#f6e7cf', wall: '#fffaf1', wallTop: '#f1e3c9',
  desk: '#e2b880', deskTop: '#f3d79e', island: '#2a9d8f', islandTop: '#fffaf0', ink: '#1d1a17', rug: '#ffd166',
  islandRug: '#bfe1f2', plant: '#5fb35a', screenOn: '#fdfbf7', screenOff: '#3a3530', terrace: '#ecd7ae',
  window: '#cfeaff', lampOn: '#ffe7a8', lamp: '#f1e3c9', neon: '#ffd166', hemi: ['#ffffff', '#e9dcc4', 1.55], sun: ['#fff4e0', 1.9],
  pendants: false,
};

export const NIGHT: Palette = {
  // floor two steps and desks one step lighter than the prototype's night, so a sitting bim never
  // melts in (bims m_27836, m_28080)
  bg: '#141211', grass: '#3f6b35', dirt: '#6e4a31', floor: '#7a6150', wall: '#4a3d33', wallTop: '#5c4b3e',
  desk: '#ad7f50', deskTop: '#c6966a', island: '#1f7a70', islandTop: '#ece2cf', ink: '#0d0b0a', rug: '#c99a2e',
  islandRug: '#3b5f7a', plant: '#3f8a3e', screenOn: '#fff2d6', screenOff: '#26221f', terrace: '#6b5a44',
  window: '#2c4a6b', lampOn: '#ffcf8a', lamp: '#e6d8bf', neon: '#ffd166', hemi: ['#ffd9a8', '#3a2c22', 1.5], sun: ['#a9b8e8', 0.7],
  pendants: true,
};

export const paletteOf = (night: boolean): Palette => (night ? NIGHT : DAY);

/** the world's other colours, the same day and night */
export const WORLD = {
  bean: ['#f39a4c', '#6cb4ee', '#7cc26b', '#9b8fe0', '#ffd166', '#2a9d8f', '#f28c28', '#5aa9a0'],
  mural: ['#ffd166', '#6cb4ee', '#7cc26b', '#9b8fe0', '#f39a4c'],
  board: ['#2b6cb0', '#2a9d8f', '#c07a21', '#6b46c1'],
  flowers: ['#ffd166', '#f39a4c', '#9b8fe0', '#fffaf0'],
  trunk: '#7a4a2a',
  leaf: ['#5fb35a', '#4e9a48'],
  pot: '#f39a4c',
  crate: '#e8b86b',
  tape: '#c98a3a',
  dark: '#2b2d42',
  metal: '#c9ccd3',
  paper: '#fffaf0',
  paperShade: '#e9e2d4',
  orange: '#f28c28',
  pineapple: '#e9b44c',
  pineLeaf: '#3f8a3e',
  banana: '#ffd166',
  marker: '#2b6cb0',
  skate: '#f39a4c',
  wheel: '#ffd166',
  sweat: '#8fd3ff',
  steam: '#ffffff',
  cloud: '#9a958c',
  sunglasses: '#1d1a17',
  parasol: '#ffd166',
  chair: ['#6cb4ee', '#fffaf0'],
  ramp: '#9b8fe0',
  palmTrunk: '#a0673f',
  mat: '#f39a4c',
  coffee: '#2b2d42',
  coffeeLed: '#ffd166',
  gold: '#e9c46a',
  grey: '#9a958c',
  ink: '#1d1a17',
  glass: '#bfe1f2',
  bar: '#7cc26b',
} as const;

export const HOODIE = ['#f39a4c', '#6cb4ee', '#7cc26b', '#ffd166', '#9b8fe0', '#2a9d8f', '#f28c28', '#4f6d7a', '#e9c46a', '#5aa9a0'];
export const PANTS = ['#3d5a80', '#2b2d42', '#5c677d', '#3d405b'];
export const SKIN = ['#f3d5b5', '#e0ac7e', '#c68b59', '#8d5524', '#ffdbac', '#a0673f'];
export const HAIR = ['#2b2118', '#4a3222', '#7a4a2a', '#d9a066', '#1b1b1b', '#9b8fe0'];
export const HATS = ['cap', 'beanie', 'afro', 'bun', 'hair', 'headphones', 'capback', 'hair', 'beanie', 'cap'] as const;
export type Hat = (typeof HATS)[number];
/** main: the ink hoodie, its gold chain and its :* (in the neon's yellow, never the accent pink) */
export const MAIN_HOODIE = '#1d1a17';
export const EYE = '#1d1a17';
export const MOUTH = '#3a2b26';
export const CHEEK = '#f2b36b';

/** FNV-1a: a name's stable number (its clothes, its loop phase) */
export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** mulberry32: a seeded [0, 1) sequence (the trees and flowers, the same every build) */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** what one bim wears, from its name */
export interface Outfit {
  readonly hoodie: string;
  readonly pants: string;
  readonly skin: string;
  readonly hair: string;
  readonly hatColor: string;
  readonly hat: Hat | 'main';
  /** its loop phase, so two bims never type in step */
  readonly phase: number;
}

export function outfitOf(name: string, main: boolean): Outfit {
  const h = hash(name);
  const pick = <T>(xs: readonly T[], shift: number): T => xs[(h >>> shift) % xs.length] as T;
  return {
    hoodie: main ? MAIN_HOODIE : pick(HOODIE, 0),
    pants: pick(PANTS, 4),
    skin: pick(SKIN, 2),
    hair: main ? '#2b2118' : pick(HAIR, 13),
    hatColor: pick(HOODIE, 11),
    hat: main ? 'main' : pick(HATS, 7),
    phase: (h % 1000) / 160,
  };
}

/** every colour the world can draw (the test reads it) */
export function allColours(): string[] {
  const out: string[] = [];
  for (const p of [DAY, NIGHT]) {
    for (const v of Object.values(p) as unknown[]) {
      if (typeof v === 'string') out.push(v);
      else if (Array.isArray(v)) for (const x of v) if (typeof x === 'string') out.push(x);
    }
  }
  for (const v of Object.values(WORLD) as unknown[]) {
    if (typeof v === 'string') out.push(v);
    else if (Array.isArray(v)) for (const x of v) if (typeof x === 'string') out.push(x);
  }
  out.push(...HOODIE, ...PANTS, ...SKIN, ...HAIR, MAIN_HOODIE, EYE, MOUTH, CHEEK);
  return out;
}
