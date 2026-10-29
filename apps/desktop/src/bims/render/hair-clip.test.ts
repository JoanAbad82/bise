// @vitest-environment happy-dom
// The women's hair law (docs/brand/bims.md "women among the bims", Gabriel m_42689): for every cut,
// every headwear it may wear and every outfit, at every head angle of the outfits' poses (the office's
// activities, the catch, the home's gags), no hair goes through the torso's worn volume (the bean, the
// collar, the hood, a strap); no hair through the headwear (the headset's band and cups, a peak, out of
// a crown above its rim); no skull through a shell of hair; nothing over the eyes. A failure names the
// cut, the headwear, the outfit, the pose and the frame (hair.testkit.ts hairMeasure).
import { describe, expect, it } from 'vitest';
import { CUT_WEARS, KINDS, OWN_WEARS, hairMeasure } from './hair.testkit';
import { DUR, idleRig, movesOf, type IdleKind } from './idle';
import { posesOf } from './outfits.testkit';
import type { Rot } from './pose';

/** the resting poses' idle places (idle.ts idleKindOf): their rare moves turn the head too (bim-review f8) */
const RESTS: Readonly<Record<string, IdleKind>> = { think: 'desk', asleep: 'desk', nap: 'bed', terrace: 'deck' };

/** every head angle of the poses and of their idle moves (at their peak and held), once each (to the hundredth of a radian), with where it comes from */
const ANGLES = ((): { rot: Rot; at: string }[] => {
  const seen = new Map<string, { rot: Rot; at: string }>();
  const see = (rot: Rot, at: string): void => {
    const k = rot.map((x) => Math.round(x * 100)).join(',');
    if (!seen.has(k)) seen.set(k, { rot, at });
  };
  for (const p of posesOf(false, 1.3)) {
    const kind = RESTS[p.id];
    for (const f of p.frames) {
      see(f.rig.head, `${p.id} · t=${String(f.t)}`);
      if (kind === undefined) continue;
      for (const side of [-1, 1] as const) {
        see(idleRig(f.rig, { kind, move: null, u: 0, hold: side }).head, `${p.id} · t=${String(f.t)} · turned ${String(side)}`);
        for (const move of movesOf(kind)) {
          for (const u of [0.5, 0.95]) see(idleRig(f.rig, { kind, move: { move, start: 0, dur: DUR[move], side }, u, hold: 0 }).head, `${p.id} · t=${String(f.t)} · ${move} ${String(side)} u=${String(u)}`);
        }
      }
    }
  }
  return [...seen.values()];
})();

describe('her hair', () => {
  // his own bim's cuts too (page bim-pick): the afro, the top bun, the pigtails, the mohawk, the spiky
  for (const { cut, hat } of [...CUT_WEARS, ...OWN_WEARS]) {
    it(`${cut} · ${hat}: never through the torso, the headwear, the skull or over the eyes`, () => {
      const bad: string[] = [];
      for (const kind of KINDS) {
        const m = hairMeasure(cut, hat, kind);
        if (kind === KINDS[0]) {
          if (m.headwear > 0) bad.push(`${cut} · ${hat}: ${String(m.headwear)} hair vertices through the headwear`);
          if (m.skull > 0) bad.push(`${cut} · ${hat}: ${String(m.skull)} skull vertices through the hair`);
          if (m.eyes > 0) bad.push(`${cut} · ${hat}: ${String(m.eyes)} hair vertices over the eyes`);
        }
        for (const a of ANGLES) {
          const n = m.torsoAt(a.rot);
          if (n > 0) bad.push(`${cut} · ${hat} · ${kind} · ${a.at}: ${String(n)} vertices in the torso`);
        }
        m.dispose();
      }
      expect(bad).toEqual([]);
      // six outfits' torsos voxelised and ~100 head angles each: seconds on a loaded machine
    }, 60_000);
  }
});
