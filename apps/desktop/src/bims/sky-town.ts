// The town's light (render/town.ts): the sky through the app's theme, as it was before bims-light
// (bims m_33030, m_33351): the light UI's own table by the sun's height, the dark UI clamped to the
// night palette's light. The office has one light for both themes (sky.ts lightOf, direction A);
// the town moves to it next (bims m_34193), then this file goes. Pure. Owner: bims-light-build.
import { mixHex, type Light, type Sky } from './sky';

export type Theme = 'light' | 'dark';

/** the town's light: the office's, and the backdrop's lean to the air */
export interface TownLight extends Light {
  /** the backdrop: the page's paper tinted toward the air by `airMix` (a little: the lawn stays a lawn) */
  readonly air: string;
  readonly airMix: number;
}

/** the app's signed lights (palette.ts DAY and NIGHT): the ends the theme guards hold */
export const DAY_LIGHT = { hemi: '#ffffff', ground: '#e9dcc4', hemiI: 1.55, key: '#fff4e0', keyI: 1.9 } as const;
export const NIGHT_LIGHT = { hemi: '#ffd9a8', ground: '#3a2c22', hemiI: 1.5, key: '#a9b8e8', keyI: 0.7 } as const;
/** light UI: a lit floor never under this share of noon's (bims m_33351: measured on the lit result) */
export const LIGHT_LIT_MIN = 0.65;
/** dark UI: the key never brighter than this (never a bright day room in a dark panel) */
export const DARK_KEY_MAX = 0.95;
/** the moon's shadow, a share of the day's */
const MOON_SHADOW = 0.3;
/** how far the backdrop leans to the air (fog: up to AIR_MIX + AIR_HAZE) */
const AIR_MIX = 0.08;
const AIR_HAZE = 0.12;

const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;
const smooth = (e0: number, e1: number, x: number): number => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

interface LightKey {
  readonly el: number;
  readonly key: string;
  readonly keyI: number;
  readonly hemi: string;
  readonly ground: string;
  readonly hemiI: number;
}
/** the light UI's sky by the sun's height (bims m_33351, m_33424): never a pink or mauve cast */
const LIGHT_KEYS: readonly LightKey[] = [
  { el: -18, key: '#c4d0f2', keyI: 0.8, hemi: '#cfd6ea', ground: '#d8b98f', hemiI: 2.15 },
  { el: -8, key: '#c4d0f2', keyI: 0.7, hemi: '#d0d7ea', ground: '#d8b98f', hemiI: 2.1 },
  { el: -4, key: '#ffbe6a', keyI: 1.6, hemi: '#d3d9e9', ground: '#dcbf96', hemiI: 1.9 },
  { el: 0, key: '#ffc574', keyI: 2.6, hemi: '#d8dde9', ground: '#e2c8a2', hemiI: 1.7 },
  { el: 6, key: '#ffd186', keyI: 3.0, hemi: '#e2e5ee', ground: '#e6d2b2', hemiI: 1.5 },
  { el: 15, key: '#ffe2ae', keyI: 2.6, hemi: '#f2f2f1', ground: '#e9dcc4', hemiI: 1.3 },
  { el: 35, key: DAY_LIGHT.key, keyI: DAY_LIGHT.keyI, hemi: DAY_LIGHT.hemi, ground: DAY_LIGHT.ground, hemiI: 1.15 },
];
/** dawn's key: a pale yellow (a morning sun under 15°), never the evening's amber */
const DAWN_KEY = '#fff0b8';

function lightKeyAt(el: number): LightKey {
  let a = LIGHT_KEYS[0] as LightKey;
  if (el <= a.el) return a;
  for (const b of LIGHT_KEYS) {
    if (el <= b.el) {
      const k = smooth(a.el, b.el, el);
      return { el, key: mixHex(a.key, b.key, k), keyI: lerp(a.keyI, b.keyI, k), hemi: mixHex(a.hemi, b.hemi, k), ground: mixHex(a.ground, b.ground, k), hemiI: lerp(a.hemiI, b.hemiI, k) };
    }
    a = b;
  }
  return a;
}

/** the sky's light on the town in this theme */
export function townLightOf(sky: Sky, theme: Theme): TownLight {
  const shadow = lerp(1, MOON_SHADOW, sky.moon) * (1 - 0.75 * sky.soft);
  const air = sky.air;
  const airMix = AIR_MIX + AIR_HAZE * sky.haze;
  const night = 1 - smooth(-6, 6, sky.el);
  if (theme === 'light') {
    const t = lightKeyAt(sky.el);
    const dawn = sky.morning * (1 - smooth(6, 15, sky.el)) * (1 - sky.moon);
    return {
      dir: sky.dir,
      key: mixHex(t.key, DAWN_KEY, dawn),
      keyI: t.keyI * lerp(sky.keyF, 1, night * 0.5),
      shadow,
      soft: sky.soft,
      hemi: mixHex(t.hemi, sky.greyTo, sky.grey * (1 - 0.6 * night)),
      ground: mixHex(t.ground, '#f4f6fa', sky.cover * (1 - 0.5 * night)),
      hemiI: t.hemiI * (1 - sky.darker * 0.4),
      lamps: smooth(0.35, 0.8, sky.dark),
      lift: 0,
      air,
      airMix,
    };
  }
  // dark UI: the night palette's light, the sky's colour and direction leaning in by day
  const day = 1 - sky.dark;
  return {
    dir: sky.dir,
    key: mixHex(NIGHT_LIGHT.key, sky.key, day),
    keyI: Math.min(DARK_KEY_MAX, lerp(NIGHT_LIGHT.keyI, sky.keyI, day)),
    shadow,
    soft: sky.soft,
    hemi: mixHex(NIGHT_LIGHT.hemi, sky.hemi, 0.5 * day),
    ground: mixHex(NIGHT_LIGHT.ground, sky.ground, 0.4 * day),
    hemiI: NIGHT_LIGHT.hemiI,
    // the dark town is built lit (its lanterns, pendants): its desk lamps stay on
    lamps: 1,
    lift: 0,
    air,
    airMix,
  };
}
