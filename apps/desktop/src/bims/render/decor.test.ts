import { describe, expect, it } from 'vitest';
import { crowd, office as fixture } from '../fixtures';
import { layoutOf } from '../maps';
import { network } from '../paths';
import type { Office } from '../model';
import { siteOf } from './camera';
import { decorOf, type Foot } from './decor';

/** whether the segment a-b passes through the footprint grown by m */
function crosses(a: { x: number; z: number }, b: { x: number; z: number }, f: Foot, m: number): boolean {
  for (let i = 0; i <= 50; i++) {
    const x = a.x + ((b.x - a.x) * i) / 50;
    const z = a.z + ((b.z - a.z) * i) / 50;
    if (Math.abs(x - f.x) < f.hw + m && Math.abs(z - f.z) < f.hd + m) return true;
  }
  return false;
}

const offices: [string, Office][] = [
  ['fixture', layoutOf(fixture.agents)],
  ['1 agent', layoutOf(crowd(0).agents)],
  ['17 agents', layoutOf(crowd(17).agents)],
  ['31 agents', layoutOf(crowd(31).agents)],
];

describe('decor', () => {
  it('stays off the walk network (plants, parasol, palm, ramp, trees)', () => {
    for (const [what, o] of offices) {
      const d = decorOf(o);
      const solid = [...d.plants, d.parasol, d.palm, d.ramp, ...d.trees];
      for (const [a, b] of network(o)) {
        for (const f of solid) expect(crosses(a, b, f, 0.2), `${what}: a walk crosses decor at ${f.x.toFixed(1)},${f.z.toFixed(1)}`).toBe(false);
      }
    }
  });

  it('keeps decor off the furniture', () => {
    for (const [what, o] of offices) {
      const d = decorOf(o);
      for (const f of [...d.plants, d.parasol, d.palm, d.ramp]) {
        for (const b of o.furniture) {
          const hit = f.x + f.hw > b.x0 && f.x - f.hw < b.x1 && f.z + f.hd > b.z0 && f.z - f.hd < b.z1;
          expect(hit, `${what}: decor at ${f.x.toFixed(1)},${f.z.toFixed(1)} on furniture`).toBe(false);
        }
      }
    }
  });

  it('puts every deck chair on the terrace slab and the slab on the grass block', () => {
    for (const [what, o] of offices) {
      const { terrace: t } = decorOf(o);
      const site = siteOf(o);
      for (const b of o.furniture.filter((x) => x.z0 > o.D)) {
        expect(b.z1 <= t.z + t.hd && b.z0 >= t.z - t.hd, `${what}: deck chair off the slab`).toBe(true);
      }
      expect(t.z + t.hd).toBeLessThanOrEqual(site.z1);
      expect(t.x - t.hw).toBeGreaterThanOrEqual(site.x0);
      // the leaving bim skates off the block's edge, out of the map
      expect(o.exit.x).toBeLessThan(site.x0);
    }
  });
});
