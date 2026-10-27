// The bims review's space (bim-review, Gabriel m_48073): every dimension a bim is drawn along, its
// values, the rules a row must keep, and a row's outfit. Agents' bims: a man's hat-or-hair (palette
// HATS) or a woman's cut and what she wears (CUT_WEARS); main: his own bim in a look (look.ts: skin,
// hair, hair colour, what it wears). Then skin, hair colour, the hat's colour, the outfit, the pose
// and its frame (the poses come from the page: outfits.testkit posesOf, plus `stand`), the camera
// the app shows it through, day or night. pairwise.ts picks the rows. Pure, no three. Owner: bim-review.
import { CUT_HATS, CUTS, HATS, type HeadWear, KINDS, type Outfit, outfitOf, type Cut } from '../render/palette';
import { COLORS, HAIRS, SKINS, WEAR_COLOR, type Hair, type Look, type Wear, mainOutfit, wearsFor } from '../render/look';
import type { Dim, Row } from './pairwise';

/** the cameras the app draws a bim through (the review page's `render`) */
export const CAMS = [
  'office', // the office's iso fit, far detail, ~12 css px a unit (the right bar at 320)
  'zoom', // the office zoomed in (the follow zoom, x2.2), near detail
  'pinch', // his pinch's closest (zoom.ts MAX_ZOOM 24): one bim fills the view, near detail
  'coin', // the outer tile's, the side's and settings' look picker's coin: head and shoulders (app/side3d/render.ts headPng; main's through it)
  'swatch', // settings' hair swatch: the head alone framed (app/side3d/render.ts cutPng), main only
  'back', // 3/4 back, near, whole body (the turnaround's): hair, hoods and ties from behind
] as const;
export type Cam = (typeof CAMS)[number];

/** the cameras that draw a fixed standing bim, whatever the pose */
export const STANDING_CAMS: readonly Cam[] = ['coin', 'swatch'];

/** the hat colours tried: the look's sky blue, then the outfits' (palette HOODIE), light and dark */
export const HAT_COLOURS = [WEAR_COLOR, '#f39a4c', '#7cc26b', '#ffd166', '#9b8fe0', '#4f6d7a'] as const;

/** an agent's head: `m:<hat>` (a man's, palette HATS) or `w:<cut>:<headwear>`; main's: `me:<hair>:<wear>` */
export function headsOf(): { readonly agent: readonly string[]; readonly main: readonly string[] } {
  const men = [...new Set(HATS)].map((h) => `m:${h}`);
  const women = CUTS.flatMap((c) => (['bare', ...CUT_HATS[c]] as const).map((h) => `w:${c}:${h}`));
  const mine = HAIRS.flatMap((h) => wearsFor(h).map((w) => `me:${h}:${w}`));
  return { agent: [...men, ...women], main: mine };
}

/** the review's dimensions, the poses given (the page reads them from the real rigs) */
export function dimsOf(poses: readonly string[]): readonly Dim[] {
  const h = headsOf();
  return [
    { name: 'head', values: [...h.agent, ...h.main] },
    { name: 'pose', values: ['stand', ...poses] },
    { name: 'cam', values: [...CAMS] },
    { name: 'kind', values: [...KINDS] },
    { name: 'skin', values: SKINS.map((_, i) => String(i)) },
    { name: 'hair', values: COLORS.map((_, i) => String(i)) },
    { name: 'hatc', values: [...HAT_COLOURS] },
    { name: 'frame', values: ['0', '1', '2'] },
    { name: 'light', values: ['day', 'night'] },
  ];
}

const isMain = (head: string): boolean => head.startsWith('me:');

/** a row's rules: main wears his ink hoodie; the standing cameras draw `stand` at its one frame; the swatch is main's */
export function validRow(r: Row): boolean {
  if (r.head !== undefined && r.kind !== undefined && isMain(r.head) && r.kind !== 'hoodie') return false;
  if (r.cam !== undefined && r.pose !== undefined && (STANDING_CAMS as readonly string[]).includes(r.cam) !== (r.pose === 'stand')) return false;
  if (r.pose === 'stand' && r.frame !== undefined && r.frame !== '0') return false;
  if (r.cam === 'swatch' && r.head !== undefined && !isMain(r.head)) return false;
  return true;
}

/** the name the agents' bims are drawn under (its loop phase); the colours come from the row */
export const REVIEW_NAME = 'bim-3';

/** what a row draws: who, its outfit, and its look when it is main */
export interface Dressed {
  readonly main: boolean;
  readonly outfit: Outfit;
  readonly look: Look | null;
}

/** a row's bim: main in the row's look, or an agent in the row's head, colours and outfit. Pure. */
export function dress(r: Row): Dressed {
  const head = r.head ?? 'm:hair';
  const skin = SKINS[Number(r.skin ?? 0)] ?? SKINS[0];
  const hair = COLORS[Number(r.hair ?? 0)] ?? COLORS[0];
  const hatColor = r.hatc ?? WEAR_COLOR;
  if (isMain(head)) {
    const [, h, w] = head.split(':') as [string, Hair, Wear];
    const look: Look = { skin: Number(r.skin ?? 0), color: Number(r.hair ?? 0), hair: h, wear: w };
    return { main: true, outfit: { ...mainOutfit(look), hatColor }, look };
  }
  const base = outfitOf(REVIEW_NAME, false);
  const kind = (KINDS as readonly string[]).includes(r.kind ?? '') ? (r.kind as Outfit['kind']) : base.kind;
  const common = { ...base, skin, hair, hatColor, kind };
  if (head.startsWith('w:')) {
    const [, cut, hat] = head.split(':') as [string, Cut, HeadWear];
    return { main: false, outfit: { ...common, cut, hat, own: null }, look: null };
  }
  const hat = head.slice(2) as Outfit['hat'];
  return { main: false, outfit: { ...common, cut: null, hat, own: null }, look: null };
}

/** a row's short id: its values in the dimensions' order, for file names and the page */
export function rowId(r: Row): string {
  return ['head', 'pose', 'frame', 'kind', 'skin', 'hair', 'hatc', 'cam', 'light']
    .map((k) => r[k] ?? '-')
    .join('|')
    .replace(/#/g, '')
    .replace(/[:|]/g, (c) => (c === ':' ? '.' : '_'));
}
