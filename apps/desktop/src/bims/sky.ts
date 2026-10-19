// The sky over the office (bims-sky, Gabriel: « en fonction de ma time zone, la couleur et la
// lumière dans le bureau changent... différentes météos... toutes les cinq minutes ça change »).
// Pure, no three, no DOM: his local clock in, the light out. The sun's place comes from the hour and
// the day of the year at a fixed latitude (no geolocation); below the horizon a cool moon takes the
// key. The weather is a deterministic spell per 5-min slot, picked by season. Both are sampled once
// per slot (skyAt reads the slot's start): between slots nothing changes, so a still office draws
// no frame; a new slot blends from the drawn sky to the next (mixSky) over SKY_FADE_S, then rests.
// Never the sun or the moon drawn: only their light. Owner: bims-sky.
import { hash, type Local } from './eggs';

/** a slot's length, s: the sky changes at most this often */
export const SLOT_S = 300;
/** a transition's length, s (reduced motion: SKY_FADE_REDUCED_S, at the loop's rate) */
export const SKY_FADE_S = 4;
export const SKY_FADE_REDUCED_S = 8;
/** the latitude his days are drawn at, degrees north (Paris-ish) */
export const LAT = 46;
/** local solar noon, hours: Paris (2.35°E) on CET, 12:51; an hour later in summer time (April to October) */
export const noonOf = (mo: number): number => 12.85 + (mo >= 4 && mo <= 10 ? 1 : 0);

export type Weather = 'clear' | 'clouds' | 'overcast' | 'rain' | 'snow' | 'fog';
export const WEATHERS: readonly Weather[] = ['clear', 'clouds', 'overcast', 'rain', 'snow', 'fog'];
export type Season = 'winter' | 'spring' | 'summer' | 'autumn';

export interface V3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** The light of a moment: what the view's two lights, the lamps and the backdrop take. */
export interface Sky {
  /** where the key light comes from (unit, scene axes: +x east, +y up, +z south toward the camera) */
  readonly dir: V3;
  /** the key light (the sun, or the moon at night): colour, intensity */
  readonly key: string;
  readonly keyI: number;
  /** how soft its shadow is (0 sharp clear sun .. 1 none: overcast, fog) */
  readonly soft: number;
  /** the hemisphere: sky colour, ground colour, intensity */
  readonly hemi: string;
  readonly ground: string;
  readonly hemiI: number;
  /** how dark it is outside, 0 day .. 1 night: the lamps, the pendants, the screens' glow follow it */
  readonly dark: number;
  /** the air's colour (the backdrop's tint, the haze) and how much of it (0 none .. 1 thick fog) */
  readonly air: string;
  readonly haze: number;
  /** what falls: 0..1 rain, 0..1 snow (the CSS layer's density) */
  readonly rain: number;
  readonly snow: number;
  /** the ground's snow cover, 0..1 (the lawn and the terrace only, never desks or floors) */
  readonly cover: number;
  /** how much the key is the moon's, 0 the sun .. 1 the moon (its shadow is fainter) */
  readonly moon: number;
}

export interface SkyMoment {
  readonly slot: number;
  readonly sun: { readonly el: number; readonly az: number };
  readonly weather: Weather;
  readonly season: Season;
  readonly sky: Sky;
}

const RAD = Math.PI / 180;

/** days since 1970-01-01 of a local calendar day */
const dayNum = (l: Local): number => Math.floor(Date.UTC(l.y, l.mo - 1, l.d) / 86_400_000);

/** the slot of a local moment: a stable number, one per 5 min of his calendar */
export const slotOf = (l: Local): number => dayNum(l) * (86_400 / SLOT_S) + Math.floor(l.s / SLOT_S);

export function seasonOf(mo: number): Season {
  if (mo === 12 || mo <= 2) return 'winter';
  if (mo <= 5) return 'spring';
  if (mo <= 8) return 'summer';
  return 'autumn';
}

/** day of the year, 1..366 */
function yday(l: Local): number {
  return dayNum(l) - Math.floor(Date.UTC(l.y, 0, 1) / 86_400_000) + 1;
}

/**
 * The sun at that local time, degrees: el above the horizon, az from north clockwise (90 east,
 * 180 south). A plain declination + hour angle model; no equation of time, no refraction.
 */
export function sunAt(l: Local, lat = LAT): { el: number; az: number } {
  const decl = -23.44 * Math.cos(((2 * Math.PI) / 365) * (yday(l) + 10)) * RAD;
  const h = (l.s / 3600 - noonOf(l.mo)) * 15 * RAD;
  const phi = lat * RAD;
  const sinEl = Math.sin(phi) * Math.sin(decl) + Math.cos(phi) * Math.cos(decl) * Math.cos(h);
  const el = Math.asin(Math.max(-1, Math.min(1, sinEl)));
  const cosAz = (Math.sin(decl) - Math.sin(el) * Math.sin(phi)) / (Math.cos(el) * Math.cos(phi));
  let az = Math.acos(Math.max(-1, Math.min(1, cosAz)));
  if (h > 0) az = 2 * Math.PI - az;
  return { el: el / RAD, az: az / RAD };
}

// ---- the weather: spells of whole slots

/** each season's odds (sum 1) */
const ODDS: Readonly<Record<Season, Readonly<Record<Weather, number>>>> = {
  winter: { clear: 0.22, clouds: 0.2, overcast: 0.2, rain: 0.14, snow: 0.14, fog: 0.1 },
  spring: { clear: 0.36, clouds: 0.3, overcast: 0.1, rain: 0.18, snow: 0, fog: 0.06 },
  summer: { clear: 0.6, clouds: 0.25, overcast: 0.04, rain: 0.11, snow: 0, fog: 0 },
  autumn: { clear: 0.26, clouds: 0.26, overcast: 0.16, rain: 0.22, snow: 0, fog: 0.1 },
};
export const oddsOf = (s: Season): Readonly<Record<Weather, number>> => ODDS[s];

/** a slot starts a new spell with this chance (a spell lasts ~2.5 slots on average, 12 at most) */
const TURN = 0.4;
const SPELL_MAX = 12;

const unit = (n: number): number => (n >>> 0) / 4294967296;

/** the first slot of the spell holding `slot` */
export function spellOf(slot: number): number {
  for (let k = 0; k < SPELL_MAX; k++) {
    const s = slot - k;
    if (s % SPELL_MAX === 0 || unit(hash(`turn:${String(s)}`)) < TURN) return s;
  }
  return slot - SPELL_MAX + 1;
}

/** the weather of a slot in that season: its spell's roll by the season's odds (a new spell may roll the same) */
export function weatherOf(slot: number, season: Season): Weather {
  const odds = ODDS[season];
  let r = unit(hash(`sky:${String(spellOf(slot))}`));
  for (const w of WEATHERS) {
    if (odds[w] === 0) continue;
    r -= odds[w];
    if (r < 0) return w;
  }
  return 'clear';
}

// ---- colours (pure: hex in, hex out, mixed in linear light)

const toLin = (c: number): number => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toSrgb = (c: number): number => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [toLin(((n >> 16) & 255) / 255), toLin(((n >> 8) & 255) / 255), toLin((n & 255) / 255)];
}
function hexOf([r, g, b]: readonly [number, number, number]): string {
  const c = (v: number): string => Math.round(Math.max(0, Math.min(1, toSrgb(v))) * 255).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}
/** a and b mixed at k (0: a, 1: b), in linear light */
export function mixHex(a: string, b: string, k: number): string {
  if (k <= 0) return a;
  if (k >= 1) return b;
  const x = rgb(a);
  const y = rgb(b);
  return hexOf([x[0] + (y[0] - x[0]) * k, x[1] + (y[1] - x[1]) * k, x[2] + (y[2] - x[2]) * k]);
}

const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;
const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));
const smooth = (e0: number, e1: number, x: number): number => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

// ---- the clear sky by the sun's height: keys from deep night to full day

interface Key {
  readonly el: number;
  readonly key: string;
  readonly keyI: number;
  readonly hemi: string;
  readonly ground: string;
  readonly hemiI: number;
  readonly air: string;
}

/** the clear sky's light by elevation (the ends are the palettes' signed DAY and NIGHT lights) */
const KEYS: readonly Key[] = [
  { el: -18, key: '#a9b8e8', keyI: 0.7, hemi: '#ffd9a8', ground: '#3a2c22', hemiI: 1.5, air: '#1b2233' },
  { el: -6, key: '#9aa6e0', keyI: 0.75, hemi: '#d9c3c8', ground: '#3d3038', hemiI: 1.45, air: '#2f3352' },
  { el: 0, key: '#ff9a6b', keyI: 0.9, hemi: '#f2c2b0', ground: '#6a4c45', hemiI: 1.45, air: '#e7a98f' },
  { el: 6, key: '#ffbf7a', keyI: 1.4, hemi: '#ffe2c4', ground: '#b49478', hemiI: 1.5, air: '#f4caa0' },
  { el: 15, key: '#ffe0b0', keyI: 1.7, hemi: '#fff4e6', ground: '#d9c8ad', hemiI: 1.55, air: '#f6e6cf' },
  { el: 35, key: '#fff4e0', keyI: 1.9, hemi: '#ffffff', ground: '#e9dcc4', hemiI: 1.55, air: '#fdfbf7' },
];

const LAST = KEYS[KEYS.length - 1] as Key;

function clearAt(el: number): Key {
  let a = KEYS[0] as Key;
  if (el <= a.el) return a;
  for (const b of KEYS) {
    if (el <= b.el) {
      const k = smooth(a.el, b.el, el);
      return {
        el,
        key: mixHex(a.key, b.key, k),
        keyI: lerp(a.keyI, b.keyI, k),
        hemi: mixHex(a.hemi, b.hemi, k),
        ground: mixHex(a.ground, b.ground, k),
        hemiI: lerp(a.hemiI, b.hemiI, k),
        air: mixHex(a.air, b.air, k),
      };
    }
    a = b;
  }
  return LAST;
}

/** a direction from azimuth (from north, clockwise) and elevation, degrees */
function dirOf(az: number, el: number): V3 {
  const a = az * RAD;
  const e = el * RAD;
  return { x: Math.sin(a) * Math.cos(e), y: Math.sin(e), z: -Math.cos(a) * Math.cos(e) };
}

/** the moon's key: high in the south-west, the same all night (a still night never moves) */
const MOON = { az: 210, el: 40 } as const;

/** what each weather does to the clear sky */
interface Effect {
  readonly keyI: number;
  readonly soft: number;
  readonly grey: number;
  readonly greyTo: string;
  readonly darker: number;
  readonly haze: number;
  readonly rain: number;
  readonly snow: number;
  readonly cover: number;
}
const EFFECT: Readonly<Record<Weather, Effect>> = {
  clear: { keyI: 1, soft: 0, grey: 0, greyTo: '#d8dde4', darker: 0, haze: 0, rain: 0, snow: 0, cover: 0 },
  clouds: { keyI: 0.7, soft: 0.35, grey: 0.25, greyTo: '#d8dde4', darker: 0.04, haze: 0.05, rain: 0, snow: 0, cover: 0 },
  overcast: { keyI: 0.3, soft: 0.85, grey: 0.6, greyTo: '#c9ced6', darker: 0.12, haze: 0.15, rain: 0, snow: 0, cover: 0 },
  rain: { keyI: 0.22, soft: 0.9, grey: 0.7, greyTo: '#aab4c2', darker: 0.25, haze: 0.25, rain: 1, snow: 0, cover: 0 },
  snow: { keyI: 0.35, soft: 0.85, grey: 0.6, greyTo: '#e6ecf4', darker: 0.1, haze: 0.3, rain: 0, snow: 1, cover: 1 },
  fog: { keyI: 0.25, soft: 1, grey: 0.7, greyTo: '#e2e2de', darker: 0.12, haze: 0.8, rain: 0, snow: 0, cover: 0 },
};

/** the sky for that sun and weather */
export function skyOf(sun: { el: number; az: number }, weather: Weather): Sky {
  const c = clearAt(sun.el);
  const fx = EFFECT[weather];
  // the key: the sun above -2°, the moon below -8°, crossing between (never both)
  const day = smooth(-8, -2, sun.el);
  const sunDir = dirOf(sun.az, Math.max(sun.el, 6));
  const moonDir = dirOf(MOON.az, MOON.el);
  const d = { x: lerp(moonDir.x, sunDir.x, day), y: lerp(moonDir.y, sunDir.y, day), z: lerp(moonDir.z, sunDir.z, day) };
  const n = Math.hypot(d.x, d.y, d.z) || 1;
  // between the two keys (blue hour) the light dips, so the swap is never seen
  const dip = 1 - 0.5 * Math.sin(Math.PI * day);
  const night = 1 - smooth(-6, 6, sun.el);
  return {
    dir: { x: d.x / n, y: d.y / n, z: d.z / n },
    key: c.key,
    keyI: c.keyI * dip * lerp(fx.keyI, 1, night * 0.5),
    soft: fx.soft,
    hemi: mixHex(c.hemi, fx.greyTo, fx.grey * (1 - 0.6 * night)),
    ground: mixHex(c.ground, '#f4f6fa', fx.cover * (1 - 0.5 * night)),
    hemiI: c.hemiI * (1 - fx.darker * 0.5),
    dark: clamp01(night + fx.darker * (1 - night)),
    air: mixHex(c.air, fx.greyTo, fx.grey * (1 - 0.7 * night)),
    haze: fx.haze,
    rain: fx.rain,
    snow: fx.snow,
    cover: fx.cover,
    moon: 1 - day,
  };
}

/** The sky of a local moment: its slot's start (never the second), its weather's spell. */
export function skyAt(l: Local, lat = LAT): SkyMoment {
  const slot = slotOf(l);
  const at: Local = { ...l, s: Math.floor(l.s / SLOT_S) * SLOT_S };
  const sun = sunAt(at, lat);
  const season = seasonOf(l.mo);
  const weather = weatherOf(slot, season);
  return { slot, sun, weather, season, sky: skyOf(sun, weather) };
}

/** two skies mixed at k (0: a, 1: b): every number and colour, the key's direction on the sphere */
export function mixSky(a: Sky, b: Sky, k0: number): Sky {
  const k = clamp01(k0);
  if (k === 0) return a;
  if (k === 1) return b;
  const d = { x: lerp(a.dir.x, b.dir.x, k), y: lerp(a.dir.y, b.dir.y, k), z: lerp(a.dir.z, b.dir.z, k) };
  const n = Math.hypot(d.x, d.y, d.z);
  return {
    dir: n > 1e-6 ? { x: d.x / n, y: d.y / n, z: d.z / n } : b.dir,
    key: mixHex(a.key, b.key, k),
    keyI: lerp(a.keyI, b.keyI, k),
    soft: lerp(a.soft, b.soft, k),
    hemi: mixHex(a.hemi, b.hemi, k),
    ground: mixHex(a.ground, b.ground, k),
    hemiI: lerp(a.hemiI, b.hemiI, k),
    dark: lerp(a.dark, b.dark, k),
    air: mixHex(a.air, b.air, k),
    haze: lerp(a.haze, b.haze, k),
    rain: lerp(a.rain, b.rain, k),
    snow: lerp(a.snow, b.snow, k),
    cover: lerp(a.cover, b.cover, k),
    moon: lerp(a.moon, b.moon, k),
  };
}

/** the same sky (nothing to blend): a still slot draws no frame */
export function sameSky(a: Sky, b: Sky): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** a transition's ease: slow in, slow out */
export const ease = (k: number): number => smooth(0, 1, k);

// ---- the light on the lights: the sky through the app's theme (bims m_33030: the theme keeps the
// materials and the backdrop, the sky drives the lights and the lamps; readability beats realism)

export type Theme = 'light' | 'dark';

/** What the view's two lights, the desk lamps and the backdrop take. */
export interface Light {
  readonly dir: V3;
  readonly key: string;
  readonly keyI: number;
  /** the key's shadow darkness (1 the day's, ~0.3 the moon's, less under clouds) and softness (0..1) */
  readonly shadow: number;
  readonly soft: number;
  readonly hemi: string;
  readonly ground: string;
  readonly hemiI: number;
  /** the desk lamps' glow, 0 off .. 1 on (they fade over a blend, never pop) */
  readonly lamps: number;
  /** the backdrop: the page's paper tinted toward the air by `airMix` (a little: the slab stays a slab) */
  readonly air: string;
  readonly airMix: number;
}

/** the app's signed lights (palette.ts DAY and NIGHT): the ends the theme guards hold */
export const DAY_LIGHT = { hemi: '#ffffff', ground: '#e9dcc4', hemiI: 1.55, key: '#fff4e0', keyI: 1.9 } as const;
export const NIGHT_LIGHT = { hemi: '#ffd9a8', ground: '#3a2c22', hemiI: 1.5, key: '#a9b8e8', keyI: 0.7 } as const;
/** light UI: the hemisphere never under this share of the day's (bims, names and pills read at night) */
export const LIGHT_HEMI_MIN = 0.6;
/** dark UI: the key never brighter than this (never a bright day room in a dark panel) */
export const DARK_KEY_MAX = 0.95;
/** the moon's shadow, a share of the day's */
export const MOON_SHADOW = 0.3;
/** how far the backdrop leans to the air (fog: up to AIR_MIX + AIR_HAZE) */
const AIR_MIX = 0.08;
const AIR_HAZE = 0.12;
/** light UI at night: the hemisphere's cool cast (never pink: the '?' pill's alone) */
const NIGHT_COOL = '#b4c0e4';

/** the sky's light in this theme */
export function lightOf(sky: Sky, theme: Theme): Light {
  const moonShadow = lerp(1, MOON_SHADOW, sky.moon);
  const shadow = moonShadow * (1 - 0.75 * sky.soft);
  const air = sky.air;
  const airMix = AIR_MIX + AIR_HAZE * sky.haze;
  if (theme === 'light') {
    const floor = DAY_LIGHT.hemiI * LIGHT_HEMI_MIN;
    return {
      dir: sky.dir,
      key: sky.key,
      keyI: sky.keyI,
      shadow,
      soft: sky.soft,
      hemi: mixHex(sky.hemi, NIGHT_COOL, 0.55 * sky.moon),
      ground: sky.ground,
      hemiI: Math.max(floor, lerp(sky.hemiI, floor, sky.dark)),
      lamps: smooth(0.35, 0.8, sky.dark),
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
    // the dark world is built lit (its lanterns, pendants): its desk lamps stay on
    lamps: 1,
    air,
    airMix,
  };
}

// ---- a transition: from the sky drawn to the slot's, then rest

export interface Blend {
  readonly from: Sky;
  readonly to: Sky;
  /** s */
  readonly at: number;
  readonly dur: number;
}

/** the sky drawn at t */
export function blendAt(b: Blend, t: number): Sky {
  if (b.dur <= 0 || t >= b.at + b.dur) return b.to;
  return mixSky(b.from, b.to, ease((t - b.at) / b.dur));
}

/** whether the blend still moves at t (a frame wanted) */
export const blending = (b: Blend, t: number): boolean => b.dur > 0 && t < b.at + b.dur && !sameSky(b.from, b.to);

/**
 * The blend toward `to` at t: none yet, a cut (the first sky, drawn at once); the same target, the
 * same blend; a new one, from the sky drawn now (never a jump, even mid-blend). `hold`: his gesture
 * (a drag, a pinch): the next blend waits until he lets go.
 */
export function retarget(b: Blend | null, to: Sky, t: number, reduced: boolean, hold = false): Blend {
  if (b === null) return { from: to, to, at: t, dur: 0 };
  if (sameSky(b.to, to) || hold) return b;
  return { from: blendAt(b, t), to, at: t, dur: reduced ? SKY_FADE_REDUCED_S : SKY_FADE_S };
}
