// The sky's laws (bims-sky): the light follows his local time, the weather changes at most once a
// slot and by season, a transition is continuous and ends at rest (reduced motion: a cut), one light
// for both themes holds its colour laws (bims-light, direction A).
import { describe, expect, it } from 'vitest';
import type { Local } from './eggs';
import {
  MOON_SHADOW, SIDE_MIN, SUN_SHADOW, frontOf, hueOf, litOf, sideOf, SLOT_S, SKY_FADE_S, WEATHERS, blendAt, blending, lightOf, mixHex, mixSky,
  oddsOf, retarget, sameSky, seasonOf, skyAt, skyOf, slotOf, sunAt, weatherOf, type Sky, type Weather,
} from './sky';

const at = (mo: number, d: number, h: number, m = 0): Local => ({ y: 2026, mo, d, dow: 1, s: h * 3600 + m * 60 });
/** a whole day, one moment per slot */
const day = (mo: number, d: number): Local[] => Array.from({ length: 86_400 / SLOT_S }, (_, i) => ({ ...at(mo, d, 0), s: i * SLOT_S }));

const lum = (hex: string): number => {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
};
/** a sky's brightness in light UI: what the eye reads (key + hemisphere) */
const bright = (s: Sky): number => s.keyI * lum(s.key) + s.hemiI * lum(s.hemi);

describe('the sun follows his local time', () => {
  it('is up by day and down at night, highest near solar noon', () => {
    expect(sunAt(at(6, 21, 13)).el).toBeGreaterThan(60);
    expect(sunAt(at(12, 21, 13)).el).toBeLessThan(25);
    expect(sunAt(at(6, 21, 1)).el).toBeLessThan(-10);
    expect(sunAt(at(12, 21, 18)).el).toBeLessThan(-6);
    // June: still light at 21:30, December: dark at 17:30
    expect(sunAt(at(6, 21, 21, 30)).el).toBeGreaterThan(-3);
    expect(sunAt(at(12, 21, 17, 30)).el).toBeLessThan(-3);
  });

  it('rises in the east and sets in the west', () => {
    const am = sunAt(at(3, 21, 8));
    const pm = sunAt(at(3, 21, 18));
    expect(am.az).toBeGreaterThan(60);
    expect(am.az).toBeLessThan(140);
    expect(pm.az).toBeGreaterThan(220);
    expect(pm.az).toBeLessThan(300);
  });

  it('noon is brighter than dusk, dusk than night (clear sky)', () => {
    const noon = skyOf(sunAt(at(6, 21, 13)), 'clear');
    const dusk = skyOf({ el: 3, az: 290 }, 'clear');
    const night = skyOf(sunAt(at(6, 21, 2)), 'clear');
    expect(bright(noon)).toBeGreaterThan(bright(dusk));
    expect(bright(dusk)).toBeGreaterThan(bright(night) * 0.9);
    expect(noon.dark).toBe(0);
    expect(night.dark).toBe(1);
    expect(night.moon).toBe(1);
    expect(noon.moon).toBe(0);
  });

  it('casts the shadow away from the sun: morning light from the east, afternoon from the west', () => {
    expect(skyAt(at(6, 21, 9)).sky.dir.x).toBeGreaterThan(0.3);
    expect(skyAt(at(6, 21, 17)).sky.dir.x).toBeLessThan(-0.3);
    // never from under the floor
    for (const l of day(6, 21)) expect(skyAt(l).sky.dir.y).toBeGreaterThan(0.1);
  });

  it('the dawn and dusk light is warm, never pink', () => {
    for (const el of [-2, 0, 2, 5, 8]) {
      const k = skyOf({ el, az: 270 }, 'clear').key;
      const n = parseInt(k.slice(1), 16);
      const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
      // warm: red over blue; not pink: green never far under blue
      if (el >= 0) expect(r).toBeGreaterThan(b);
      expect(g).toBeGreaterThanOrEqual(b - 20);
    }
  });
});

describe('the sky is sampled per slot', () => {
  it('is the same all slot long', () => {
    const a = skyAt(at(4, 10, 15, 0));
    for (let s = 1; s < SLOT_S; s += 37) expect(sameSky(skyAt({ ...at(4, 10, 15), s: 15 * 3600 + s }).sky, a.sky)).toBe(true);
  });

  it('slots are consecutive across midnight', () => {
    expect(slotOf(at(4, 11, 0))).toBe(slotOf({ ...at(4, 10, 23), s: 86_400 - 1 }) + 1);
  });

  it('a clear night never moves: one sky all night long (no transition, no frame)', () => {
    const nights = day(1, 15).filter((l) => l.s < 4 * 3600).map((l) => skyOf(sunAt(l), 'clear'));
    const first = nights[0] as Sky;
    for (const s of nights) expect(sameSky(s, first)).toBe(true);
  });
});

describe('the weather', () => {
  const seasons = [1, 4, 7, 10] as const;

  it('changes at most once a slot, and only at a slot edge', () => {
    for (const mo of seasons) {
      const ws = day(mo, 12).map((l) => skyAt(l).weather);
      let changes = 0;
      for (let i = 1; i < ws.length; i++) if (ws[i] !== ws[i - 1]) changes++;
      // it changes sometimes (spells), not every slot
      expect(changes).toBeGreaterThan(10);
      expect(changes).toBeLessThan(ws.length * 0.75);
    }
  });

  it('is deterministic: the same slot, the same weather', () => {
    for (let s = 5_900_000; s < 5_900_400; s++) expect(weatherOf(s, 'autumn')).toBe(weatherOf(s, 'autumn'));
  });

  it('never snows outside winter; summer is mostly clear', () => {
    const count = (mo: number): Record<Weather, number> => {
      const c = Object.fromEntries(WEATHERS.map((w) => [w, 0])) as Record<Weather, number>;
      for (let d = 1; d <= 28; d++) for (const l of day(mo, d)) c[skyAt(l).weather]++;
      return c;
    };
    const summer = count(7);
    const winter = count(1);
    expect(summer.snow).toBe(0);
    expect(count(4).snow).toBe(0);
    expect(count(10).snow).toBe(0);
    expect(winter.snow).toBeGreaterThan(0);
    const total = (c: Record<Weather, number>): number => Object.values(c).reduce((a, b) => a + b, 0);
    expect(summer.clear / total(summer)).toBeGreaterThan(0.35);
    expect(winter.clear / total(winter)).toBeLessThan(summer.clear / total(summer));
  });

  it('every season rolls every weather it allows', () => {
    for (const mo of seasons) {
      const seen = new Set<Weather>();
      for (let d = 1; d <= 28; d++) for (const l of day(mo, d)) seen.add(skyAt(l).weather);
      const odds = oddsOf(seasonOf(mo));
      for (const w of WEATHERS) expect(seen.has(w), `${w} in month ${String(mo)}`).toBe(odds[w] > 0);
    }
  });

  it('rain and snow fall, clouds soften the shadow, snow covers the ground', () => {
    const sun = { el: 40, az: 180 };
    expect(skyOf(sun, 'rain').rain).toBe(1);
    expect(skyOf(sun, 'snow').snow).toBe(1);
    expect(skyOf(sun, 'snow').cover).toBe(1);
    expect(skyOf(sun, 'clear').rain + skyOf(sun, 'clear').snow).toBe(0);
    expect(skyOf(sun, 'clouds').soft).toBeGreaterThan(skyOf(sun, 'clear').soft);
    expect(skyOf(sun, 'overcast').keyI).toBeLessThan(skyOf(sun, 'clouds').keyI);
    expect(skyOf(sun, 'fog').haze).toBeGreaterThan(skyOf(sun, 'clouds').haze);
  });
});

describe('a transition', () => {
  const a = skyOf({ el: 40, az: 180 }, 'clear');
  const b = skyOf({ el: 2, az: 280 }, 'rain');

  it('starts where it was and ends where it goes', () => {
    expect(mixSky(a, b, 0)).toBe(a);
    expect(mixSky(a, b, 1)).toBe(b);
    expect(mixHex('#000000', '#ffffff', 0.5)).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('is continuous: no frame jumps (30 fps over SKY_FADE_S)', () => {
    const run = retarget(retarget(null, a, 0, false), b, 10, false);
    let prev = blendAt(run, 10);
    for (let t = 10; t <= 10 + SKY_FADE_S + 0.1; t += 1 / 30) {
      const s = blendAt(run, t);
      expect(Math.abs(s.keyI - prev.keyI)).toBeLessThan(0.08);
      expect(Math.abs(s.dark - prev.dark)).toBeLessThan(0.05);
      expect(Math.abs(lum(s.hemi) - lum(prev.hemi))).toBeLessThan(6);
      expect(Math.hypot(s.dir.x - prev.dir.x, s.dir.y - prev.dir.y, s.dir.z - prev.dir.z)).toBeLessThan(0.06);
      prev = s;
    }
    expect(sameSky(prev, b)).toBe(true);
  });

  it('then rests: no frame after it ends, none for the same target', () => {
    const first = retarget(null, a, 0, false);
    expect(blending(first, 0)).toBe(false);
    const run = retarget(first, b, 10, false);
    expect(blending(run, 10.5)).toBe(true);
    expect(blending(run, 10 + SKY_FADE_S)).toBe(false);
    expect(retarget(run, b, 12, false)).toBe(run);
  });

  it('a new target mid-blend starts from the sky drawn now', () => {
    const run = retarget(retarget(null, a, 0, false), b, 10, false);
    const c = skyOf({ el: -20, az: 0 }, 'clear');
    const again = retarget(run, c, 12, false);
    expect(sameSky(again.from, blendAt(run, 12))).toBe(true);
  });

  it('waits while he drags or pinches', () => {
    const run = retarget(null, a, 0, false);
    expect(retarget(run, b, 5, false, true)).toBe(run);
  });

  it('is a cut under reduced motion: the hour\'s sky at once, no frame after', () => {
    const run = retarget(retarget(null, a, 0, true), b, 1, true);
    expect(run.dur).toBe(0);
    expect(sameSky(blendAt(run, 1), b)).toBe(true);
    expect(blending(run, 1)).toBe(false);
  });
});

describe('one light for both themes (bims-light, direction A)', () => {
  const all = [1, 4, 7, 10].flatMap((mo) => day(mo, 5).map((l) => skyAt(l).sky));
  const weathers = [-30, -8, -3, 0, 4, 12, 30, 60].flatMap((el) => WEATHERS.flatMap((w) => [skyOf({ el, az: 90 }, w), skyOf({ el, az: 270 }, w)]));

  // the lit result (bims m_33351), on the day floor: the world keeps its day materials in both themes
  const FLOOR = '#f6e7cf';
  const DIRT = '#9a6a45';
  const rgb8 = (h: string): [number, number, number] => {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  /** HSV saturation, 0..1 */
  const sat = (h: string): number => {
    const c = rgb8(h);
    const hi = Math.max(...c);
    return hi === 0 ? 0 : (hi - Math.min(...c)) / hi;
  };
  const clearDay = [-30, -12, -7, -4, -2, 0, 2, 5, 8, 12, 20, 40, 60].flatMap((el) => [skyOf({ el, az: 90 }, 'clear'), skyOf({ el, az: 270 }, 'clear')]);
  const night = skyOf({ el: -30, az: 0 }, 'clear');
  const noon = skyOf({ el: 60, az: 180 }, 'clear');

  it('the floor is never mauve or pink, at any hour or weather: warm (r >= g >= b) or a cool blue', () => {
    for (const s of [...clearDay, ...all, ...weathers]) {
      const [r, g, b] = rgb8(litOf(lightOf(s), FLOOR));
      const warm = r >= g && g >= b - 2;
      const cool = b >= r && b >= g;
      // a grey of the blue hour's weather (no hue at all) is no cast either
      const grey = Math.max(r, g, b) - Math.min(r, g, b) <= 6;
      expect(warm || cool || grey, `floor ${litOf(lightOf(s), FLOOR)} at el ${String(s.el)}`).toBe(true);
      expect(r > b && b > g + 2, `never r > b > g at el ${String(s.el)}`).toBe(false);
    }
  });

  it('warm pools on the cool night never meet as violet: floor and wall tops at 0, 50, 100% pool, night, dusk, rainy night (bims m_34321)', () => {
    const WALL_TOP = '#f1e3c9';
    const moments = [night, skyOf({ el: -30, az: 0 }, 'rain'), skyOf({ el: -3, az: 290 }, 'clear'), skyOf({ el: -3, az: 70 }, 'clear'), skyOf({ el: -3, az: 290 }, 'rain'), skyOf({ el: -10, az: 300 }, 'overcast')];
    for (const s of moments) {
      for (const albedo of [FLOOR, WALL_TOP]) {
        for (const k of [0, 0.25, 0.5, 0.75, 1]) {
          const c = litOf(lightOf(s), albedo, false, k);
          const { hue, sat } = hueOf(c);
          expect(sat < 0.06 || hue < 270 || hue > 345, `${albedo} at ${String(k * 100)}% pool, el ${String(s.el)}: ${c} hue ${hue.toFixed(0)}`).toBe(true);
        }
      }
    }
  });

  it('the key always comes from the camera\'s half: a low sun lights the floor, never the back walls\' shadow across it', () => {
    for (const s of [...clearDay, ...all]) {
      const d = lightOf(s).dir;
      expect(d.x + d.z, `el ${String(s.el)}`).toBeGreaterThanOrEqual(-1e-9);
    }
    // the evening sun from the west comes in front-left, the same height
    const g = skyOf({ el: 6, az: 280 }, 'clear');
    expect(lightOf(g).dir.y).toBeCloseTo(g.dir.y);
    expect(frontOf({ x: 0.7, y: 0.5, z: 0.5 })).toEqual({ x: 0.7, y: 0.5, z: 0.5 });
  });

  it('the night floor reads blue, never grey (a saturation floor), whatever the weather', () => {
    for (const s of weathers.filter((x) => x.el <= -8)) {
      const f = litOf(lightOf(s), FLOOR);
      const [r, , b] = rgb8(f);
      expect(b, `night floor ${f} blue`).toBeGreaterThan(r);
      expect(sat(f), `night floor ${f} saturated`).toBeGreaterThanOrEqual(0.25);
    }
  });

  it('at night the slab sides never go darker than SIDE_MIN on screen (designer m_34173)', () => {
    const [mr, mg, mb] = rgb8(SIDE_MIN);
    for (const s of weathers.filter((x) => x.el <= -8)) {
      for (const face of [{ x: 1, z: 0 }, { x: 0, z: 1 }]) {
        const [r, g, b] = rgb8(sideOf(lightOf(s), DIRT, face));
        expect(r >= mr - 1 && g >= mg - 1 && b >= mb - 1, `side ${sideOf(lightOf(s), DIRT, face)}`).toBe(true);
      }
    }
    // by day: no lift
    expect(lightOf(noon).lift).toBe(0);
  });

  it('noon, golden hour, dawn and night are the signed renders (page bims-light v3)', () => {
    const n = lightOf(noon);
    expect([n.key, n.keyI, n.hemi, n.ground, n.hemiI, n.lamps]).toEqual(['#fff3dc', 2.3, '#ffffff', '#e6d6b8', 1.2, 0]);
    expect(n.shadow).toBeCloseTo(SUN_SHADOW);
    const g = lightOf(skyOf({ el: 12, az: 280 }, 'clear'));
    expect([g.key, g.hemi, g.ground, g.lamps]).toEqual(['#ffc56e', '#e2ecfa', '#f2dcb4', 0.5]);
    const d = lightOf(skyOf({ el: 8, az: 80 }, 'clear'));
    expect([d.key, d.hemi, d.ground, d.lamps]).toEqual(['#ffe6a8', '#e6eefb', '#efdcbc', 0.35]);
    const m = lightOf(night);
    expect([m.key, m.keyI, m.hemi, m.ground, m.hemiI, m.lamps]).toEqual(['#9fb7ff', 0.75, '#2f78a4', '#14203a', 1.6, 1]);
    expect(m.shadow).toBeCloseTo(MOON_SHADOW);
  });

  it('dusk has a warm key from its side, night a cool one (they differ at a glance)', () => {
    const [dr, , db] = rgb8(lightOf(skyOf({ el: -3, az: 300 }, 'clear')).key);
    const [nr, , nb] = rgb8(lightOf(night).key);
    expect(dr - db).toBeGreaterThan(80);
    expect(nb).toBeGreaterThan(nr);
  });

  it('dawn is a pale-yellow key, golden hour an amber one', () => {
    const [ar, ag, ab] = rgb8(lightOf(skyOf({ el: 4, az: 70 }, 'clear')).key);
    const [gr, gg, gb] = rgb8(lightOf(skyOf({ el: 4, az: 290 }, 'clear')).key);
    expect(ag, 'dawn pale: a high green').toBeGreaterThan(0xd8);
    expect(ab, 'dawn: some blue, never amber').toBeGreaterThan(gb);
    expect(ar - ag, 'golden hour: amber (red over green)').toBeLessThan(gr - gg);
  });

  it('the noon shadow reads (0.2 or darker)', () => {
    const l = lightOf(noon);
    expect(1 - lum(litOf(l, FLOOR, true)) / lum(litOf(l, FLOOR))).toBeGreaterThanOrEqual(0.2);
  });

  it('the lamps: on at night, half at golden hour, off on a clear noon, on under rain', () => {
    expect(lightOf(night).lamps).toBe(1);
    expect(lightOf(noon).lamps).toBe(0);
    expect(lightOf(skyOf({ el: 50, az: 180 }, 'rain')).lamps).toBeGreaterThanOrEqual(0.5);
  });

  it('the weather on top: rain weakens the key and softens the shadow', () => {
    const r = lightOf(skyOf({ el: 50, az: 180 }, 'rain'));
    expect(r.keyI).toBeLessThan(lightOf(skyOf({ el: 50, az: 180 }, 'clear')).keyI);
    expect(r.shadow).toBeLessThan(lightOf(noon).shadow);
  });
});
