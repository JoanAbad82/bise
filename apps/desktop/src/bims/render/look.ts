// His own bim's look (page bim-pick, his pick A): the choices the onboarding's ready-made looks and
// settings › general's four rows offer (skin, hair, hair colour, what it wears on its head), the
// pref they are kept in (`bim` in prefs.json: {skin, hair, color, wear}, bise_home::prefs bim_look),
// and main's outfit with that look on it. His bim is main's: the ink hoodie, its :* and gold chain
// stay; the look changes the rest. No look (never picked, or one this build does not know) draws
// today's main. Pure, no three. Owner: bim-pick.
import { CUT_HATS, type Cut, type HeadWear, OWN, type Own, type Outfit, outfitOf } from './palette';

/** the skins, light to dark (palette SKIN's six) */
export const SKINS = ['#ffdbac', '#f3d5b5', '#e0ac7e', '#c68b59', '#a0673f', '#8d5524'] as const;
/** the hair colours, the natural ones first, lilac last (designer m_46521 4) */
export const COLORS = ['#1b1b1b', '#2b2118', '#4a3222', '#7a4a2a', '#d9a066', '#9b8fe0'] as const;
/** a hat's colour: the coin's and the office's sky blue (the cap, the beanie, a headset's cups, a tie) */
export const WEAR_COLOR = '#6cb4ee';

/** the hair row: today's short first, the afro and the top bun, the women's cuts, his fun cuts */
export const HAIRS = ['short', 'afro', 'topbun', 'long', 'ponytail', 'braids', 'bob', 'buns', 'curls', 'pigtails', 'mohawk', 'spiky'] as const;
export type Hair = (typeof HAIRS)[number];
export const WEARS = ['none', 'cap', 'beanie', 'headphones'] as const;
export type Wear = (typeof WEARS)[number];

export interface Look {
  /** an index in SKINS */
  readonly skin: number;
  readonly hair: Hair;
  /** an index in COLORS */
  readonly color: number;
  readonly wear: Wear;
}

const isCut = (h: Hair): h is Cut & Hair => h in CUT_HATS;
const isOwn = (h: Hair): h is Own => (OWN as readonly string[]).includes(h);

/** what a hair may wear (the cuts' CUT_HATS rule; his own cuts nothing: a hat would sink into them) */
export function wearsFor(hair: Hair): readonly Wear[] {
  if (hair === 'short') return WEARS;
  if (isCut(hair)) return ['none', ...CUT_HATS[hair].filter((h): h is Exclude<Wear, 'none'> => h !== 'capback')];
  return ['none'];
}

/** the look with its hair changed, its headwear dropped when the new hair can't take it */
export function withHair(l: Look, hair: Hair): Look {
  return { ...l, hair, wear: wearsFor(hair).includes(l.wear) ? l.wear : 'none' };
}

/** today's main: the light skin and short dark hair every user got before the pick */
export const TODAY: Look = { skin: 1, hair: 'short', color: 1, wear: 'none' };

/**
 * The onboarding's 12 ready-made looks (designer m_46521 5): every skin twice, five bare-headed
 * women's cuts, no silhouette twice side by side, the afro and the top bun once each.
 */
export const READY: readonly Look[] = [
  { skin: 5, hair: 'afro', color: 0, wear: 'none' },
  { skin: 1, hair: 'long', color: 4, wear: 'none' },
  { skin: 3, hair: 'short', color: 1, wear: 'cap' },
  { skin: 4, hair: 'braids', color: 0, wear: 'none' },
  { skin: 0, hair: 'bob', color: 3, wear: 'beanie' },
  { skin: 2, hair: 'topbun', color: 1, wear: 'none' },
  { skin: 5, hair: 'curls', color: 1, wear: 'none' },
  { skin: 1, hair: 'short', color: 2, wear: 'headphones' },
  { skin: 3, hair: 'ponytail', color: 0, wear: 'none' },
  { skin: 4, hair: 'short', color: 0, wear: 'beanie' },
  { skin: 2, hair: 'buns', color: 5, wear: 'none' },
  { skin: 0, hair: 'short', color: 4, wear: 'none' },
];

/** a ready-made look for a first launch he skipped: never always the same one */
export function anyLook(rand: number): Look {
  return READY[Math.floor(Math.max(0, Math.min(0.9999, rand)) * READY.length)] ?? TODAY;
}

/** The look in his prefs' `bim`, or null (none yet, or not one this build draws). */
export function lookOf(v: unknown): Look | null {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  const { skin, color, hair, wear } = o;
  if (typeof skin !== 'number' || !Number.isInteger(skin) || skin < 0 || skin >= SKINS.length) return null;
  if (typeof color !== 'number' || !Number.isInteger(color) || color < 0 || color >= COLORS.length) return null;
  if (typeof hair !== 'string' || !(HAIRS as readonly string[]).includes(hair)) return null;
  if (typeof wear !== 'string' || !(WEARS as readonly string[]).includes(wear)) return null;
  const l: Look = { skin, color, hair: hair as Hair, wear: wear as Wear };
  return wearsFor(l.hair).includes(l.wear) ? l : { ...l, wear: 'none' };
}

/** The pref's value for a look (what prefs_set writes). */
export function prefOf(l: Look): { skin: number; hair: string; color: number; wear: string } {
  return { skin: l.skin, hair: l.hair, color: l.color, wear: l.wear };
}

export const sameLook = (a: Look | null, b: Look | null): boolean =>
  a === b || (a !== null && b !== null && a.skin === b.skin && a.hair === b.hair && a.color === b.color && a.wear === b.wear);

/**
 * main's outfit with his look on it (null: today's). The hat slot keeps main's 'main' (short hair,
 * the :* and the chain) for the short cut bare-headed; any other look draws its hair or its hat there
 * and the :* and the chain by `mark`.
 */
export function mainOutfit(look: Look | null): Outfit {
  const base = outfitOf('main', true);
  if (look === null) return base;
  const o: Outfit = { ...base, skin: SKINS[look.skin] ?? base.skin, hair: COLORS[look.color] ?? base.hair, hatColor: WEAR_COLOR, mark: true, own: null, cut: null };
  const wear: HeadWear = look.wear === 'none' ? 'bare' : look.wear;
  if (look.hair === 'short') return look.wear === 'none' ? { ...o, hat: 'main', mark: false } : { ...o, hat: look.wear === 'headphones' ? 'headphones' : wear };
  if (isOwn(look.hair)) return { ...o, hat: wear, own: look.hair };
  return { ...o, hat: wear, cut: look.hair };
}
