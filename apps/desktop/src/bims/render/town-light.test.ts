// The town's laws under the office's one light (bims-town-light, bims m_34661): the townscape keeps
// its day materials in both themes, so its floor tones hold sky.test's laws at every hour and
// weather: the lawn stays a lawn (green, never blue or grey), the road and the paths are never mauve
// or pink, the water stays blue, and the warm pools never turn the lawn or the road violet. The pools
// go to the offices nearest the view, POOLS_MAX at most (town/pools.ts).
import { describe, expect, it } from 'vitest';
import { WEATHERS, hueOf, lightOf, litOf, skyAt, skyOf, SLOT_S } from '../sky';
import { DAY } from './palette';
import { NIGHT_GLOW, TOWN_DAY } from './townscape';
import { POOLS_MAX, townPools } from '../town/pools';

const rgb8 = (h: string): [number, number, number] => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const all = [1, 4, 7, 10].flatMap((mo) => Array.from({ length: 86_400 / SLOT_S }, (_, i) => skyAt({ y: 2026, mo, d: 5, dow: 1, s: i * SLOT_S }).sky));
const weathers = [-30, -8, -3, 0, 4, 12, 30, 60].flatMap((el) => WEATHERS.flatMap((w) => [skyOf({ el, az: 90 }, w), skyOf({ el, az: 270 }, w)]));
const skies = [...all, ...weathers];
const nights = [skyOf({ el: -30, az: 0 }, 'clear'), skyOf({ el: -30, az: 0 }, 'rain'), skyOf({ el: -3, az: 290 }, 'clear'), skyOf({ el: -3, az: 70 }, 'clear'), skyOf({ el: -10, az: 300 }, 'overcast')];

/**
 * never a mauve, violet or pink cast (sky.test's laws, bims m_34321): no violet hue, never r > b > g;
 * a grey of the low sun (no hue at all, 6 steps at most) is no cast either
 */
function neverMauve(c: string): boolean {
  const [r, g, b] = rgb8(c);
  if (Math.max(r, g, b) - Math.min(r, g, b) <= 6) return true;
  const { hue, sat } = hueOf(c);
  return (sat < 0.06 || hue < 270 || hue > 345) && !(r > b && b > g + 2);
}

describe("the town's floor tones under the sky's one light", () => {
  it('the lawn stays green at every hour and weather: g the highest, a green hue, never grey', () => {
    for (const s of skies) {
      const c = litOf(lightOf(s), DAY.grass, false, 0, NIGHT_GLOW.lawn);
      const [r, g, b] = rgb8(c);
      const { hue, sat } = hueOf(c);
      expect(g > r && g > b, `lawn ${c} at el ${s.el.toFixed(1)}`).toBe(true);
      expect(hue >= 80 && hue <= 165, `lawn ${c} hue ${hue.toFixed(0)}`).toBe(true);
      expect(sat, `lawn ${c} saturated`).toBeGreaterThanOrEqual(0.35);
    }
  });

  it('the road, its dashes, the paths, the banks, the squares and the bridges are never mauve or pink', () => {
    for (const s of skies) {
      for (const albedo of [TOWN_DAY.road, TOWN_DAY.dash, TOWN_DAY.path, TOWN_DAY.bank, TOWN_DAY.stone, TOWN_DAY.wood]) {
        const c = litOf(lightOf(s), albedo);
        expect(neverMauve(c), `${albedo} lit ${c} at el ${s.el.toFixed(1)}`).toBe(true);
      }
    }
  });

  it('the road reads as a road: grey or warm by day, the night\'s blue at night, never darker than the lawn by much', () => {
    for (const s of skies) {
      const l = lightOf(s);
      const [r, g, b] = rgb8(litOf(l, TOWN_DAY.road));
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const [lr, lg, lb] = rgb8(litOf(l, DAY.grass));
      expect(lum, `road vs lawn at el ${s.el.toFixed(1)}`).toBeGreaterThan(0.6 * (0.2126 * lr + 0.7152 * lg + 0.0722 * lb));
    }
  });

  it('at night the lawn is lifted a step: never a black-green slab on the page (bims m_35061), still night, green not teal', () => {
    const lum = (h: string): number => {
      const [r, g, b] = rgb8(h);
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const floor = lum('#2f5a3e');
    for (const s of weathers.filter((x) => x.el <= -8)) {
      const l = lightOf(s);
      const c = litOf(l, DAY.grass, false, 0, NIGHT_GLOW.lawn);
      const { hue, sat } = hueOf(c);
      expect(lum(c), `night lawn ${c} at el ${String(s.el)}`).toBeGreaterThanOrEqual(floor);
      // still night: well under the day's lawn
      expect(lum(c), `night lawn ${c} stays night`).toBeLessThan(0.6 * lum(litOf(lightOf(skyOf({ el: 60, az: 180 }, 'clear')), DAY.grass)));
      expect(hue >= 100 && hue <= 150 && sat >= 0.35, `night lawn ${c} green (hue ${hue.toFixed(0)}, sat ${sat.toFixed(2)})`).toBe(true);
      // the road a step up too, the night's blue, never mauve
      const r = litOf(l, TOWN_DAY.road, false, 0, NIGHT_GLOW.road);
      expect(lum(r), `night road ${r} lifted`).toBeGreaterThan(lum(litOf(l, TOWN_DAY.road)) + 8);
      expect(neverMauve(r), `night road ${r}`).toBe(true);
    }
    // by day: no lift at all
    expect(litOf(lightOf(skyOf({ el: 60, az: 180 }, 'clear')), DAY.grass, false, 0, NIGHT_GLOW.lawn)).toBe(litOf(lightOf(skyOf({ el: 60, az: 180 }, 'clear')), DAY.grass));
  });

  it('the water stays blue', () => {
    for (const s of skies) {
      const c = litOf(lightOf(s), TOWN_DAY.water);
      const { hue } = hueOf(c);
      expect(hue >= 185 && hue <= 225, `water ${c} hue ${hue.toFixed(0)}`).toBe(true);
    }
  });

  it('the warm pools on the night never turn the lawn or the road violet (0..100% pool)', () => {
    for (const s of nights) {
      for (const albedo of [DAY.grass, TOWN_DAY.road, TOWN_DAY.path]) {
        for (const k of [0, 0.25, 0.5, 0.75, 1]) {
          const c = litOf(lightOf(s), albedo, false, k);
          expect(neverMauve(c), `${albedo} at ${String(k * 100)}% pool, el ${String(s.el)}: ${c}`).toBe(true);
        }
      }
    }
  });
});

describe("the town's lamp pools (town/pools.ts)", () => {
  const office = (x: number, z: number, n = 4): { x: number; z: number; pools: { x: number; z: number; i: number }[] } => ({
    x, z, pools: Array.from({ length: n }, (_, i) => ({ x: i, z: 1, i: 7 - i })),
  });

  it('never more than the budget, each office its main desk first', () => {
    const offices = Array.from({ length: 12 }, (_, i) => office(i * 10, 0));
    const p = townPools(offices, { x: 0, z: 0 });
    expect(p).toHaveLength(POOLS_MAX);
    // the 8 nearest offices, one pool each: their first (the strongest)
    expect(p.every((x) => x.i === 7)).toBe(true);
    expect(p.map((x) => x.x)).toEqual([0, 10, 20, 30, 40, 50, 60, 70]);
  });

  it('few offices: each its every pool, in its own place', () => {
    const p = townPools([office(0, 0), office(20, 5)], { x: 20, z: 5 });
    expect(p).toHaveLength(8);
    expect(p[0]).toEqual({ x: 20, z: 6, i: 7 });
    expect(p[1]).toEqual({ x: 0, z: 1, i: 7 });
    expect(p.filter((x) => x.x >= 20)).toHaveLength(4);
  });

  it('the offices nearest where he looks get theirs first; no office, no pool', () => {
    const offices = Array.from({ length: 12 }, (_, i) => office(i * 10, 0, 1));
    expect(townPools(offices, { x: 110, z: 0 }).map((x) => x.x)).toEqual([110, 100, 90, 80, 70, 60, 50, 40]);
    expect(townPools([], { x: 0, z: 0 })).toEqual([]);
  });
});
