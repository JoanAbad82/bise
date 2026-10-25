// @vitest-environment happy-dom
// The outfits' clipping law (docs/brand/bims.md "outfits: the intent sheet", Gabriel's note n4 on
// bims-home v8: « les bras clippent avec les vêtements »): for every outfit and every pose the intent
// sheet names (the office's activities, his plane's catch, the home's gags), at every sampled frame,
// no forearm, cuff or hand sinks into what the bim wears on its torso, and nothing worn on the torso
// pierces a sleeve or a hand (outfits.testkit.ts clipperOf). A failure names the outfit, the pose
// and the frame.
import { describe, expect, it } from 'vitest';
import { OUTFIT_BIMS, clipperOf, posesOf } from './outfits.testkit';
import { outfitOf } from './palette';

describe('outfit clipping', () => {
  for (const ob of OUTFIT_BIMS) {
    it(`${ob.outfit} (${ob.name}): no arm in its clothes, no clothes through an arm`, () => {
      const c = clipperOf(ob.name, ob.main);
      const bad: string[] = [];
      for (const p of posesOf(ob.main, outfitOf(ob.name, ob.main).phase)) {
        for (const f of p.frames) {
          const n = c.clipsAt(f.rig);
          if (n > 0) bad.push(`${ob.outfit} · ${p.id} · t=${String(f.t)}: ${String(n)} vertices`);
        }
      }
      c.dispose();
      expect(bad).toEqual([]);
    });
  }
});
