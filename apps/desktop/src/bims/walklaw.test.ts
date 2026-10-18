import { describe, expect, it } from 'vitest';
import { MAP_IDS } from './maps/ids';
import { walkLaw } from './walklaw';

/** simulated seconds per map and crew size: 13 maps × 20 crews × 80 s ≈ 5.8 hours */
const SECONDS = 80;

describe('the walking law (bims-avoid): on every map, 1 to 20 bims', () => {
  for (const map of MAP_IDS) {
    it(`${map}: no two bims closer than two bodies while one walks, no walking bim inside furniture`, () => {
      const breaks: string[] = [];
      for (let n = 1; n <= 20; n++) {
        const run = walkLaw(map, n, SECONDS, n * 7919 + map.length);
        if (run.close + run.inside > 0) breaks.push(`${String(n)} bims: ${String(run.close)} close, ${String(run.inside)} inside; ${run.first.slice(0, 2).join(' | ')}`);
      }
      expect(breaks).toEqual([]);
    }, 60_000);
  }
});
