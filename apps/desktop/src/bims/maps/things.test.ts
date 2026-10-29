// Each map's words for what its growth stages bring (Plan.things, bims m_28856): the tag over a new
// piece and the corner tip name the map's own piece, every map x stage 1..14 has words, a map
// without its own falls back to the loft's. Owner: maps-b.
import { describe, expect, it } from 'vitest';
import { bims } from '@/proto/words_bims.gen';
import { NO_GROW, newLabel, thingOf, tipOf } from '../growth';
import { MAP_IDS } from './ids';
import { PLANS, planOf } from './index';
import type { Stage } from './plan';

const STAGES = Array.from({ length: 14 }, (_, i) => (i + 1) as Stage);
const LOFT = (s: Stage): string => thingOf(s);

describe("the maps' piece names", () => {
  it('names every stage on every map, with words', () => {
    for (const id of MAP_IDS) {
      for (const s of STAGES) expect(thingOf(s, planOf(id).things), `${id} stage ${String(s)}`).not.toBe('');
      expect(thingOf(0, planOf(id).things)).toBe('');
    }
  });

  it("covers stages 1..14 when a map has its own, and says the loft's otherwise", () => {
    for (const id of MAP_IDS) {
      const own = PLANS[id].things;
      for (const s of STAGES) {
        if (own) expect(own[s], `${id} stage ${String(s)}`).toBeTruthy();
        else expect(thingOf(s, own)).toBe(LOFT(s));
      }
    }
  });

  it("never calls Kyoto's, the Riad's or Nordic's pieces by the loft's names", () => {
    for (const id of ['kyoto', 'riad', 'nordic'] as const) {
      const own = PLANS[id].things;
      for (const s of [2, 4, 5, 6, 7, 9, 10, 12, 13, 14] as const) expect(thingOf(s, own), `${id} stage ${String(s)}`).not.toBe(LOFT(s));
    }
  });

  it('puts them in the tag and the corner tip', () => {
    expect(newLabel(9, PLANS.nordic.things)).toBe(bims.grow_new({ thing: bims.stage_nordic_9 }));
    expect(newLabel(9, PLANS.kyoto.things)).toBe(bims.grow_new({ thing: bims.stage_kyoto_9 }));
    expect(newLabel(9, PLANS.riad.things)).toBe(bims.grow_new({ thing: bims.stage_riad_9 }));
    expect(newLabel(9)).toBe(bims.grow_new({ thing: bims.stage_9 }));
    expect(tipOf({ ...NO_GROW, stage: 8, jobs: 70 }, PLANS.nordic.things)).toContain(bims.stage_nordic_9);
    expect(newLabel(2, PLANS.greenhouse.things)).toBe(bims.grow_new({ thing: bims.stage_fruit }));
  });
});
