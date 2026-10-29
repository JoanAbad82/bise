// @vitest-environment happy-dom
// No two things hung on a wall share its plane where they overlap (Gabriel, main m_32722: the
// mural's blobs, one plane, drew in turns frame to frame): every ready map, a big office at stage
// 14, its pieces as they are before the office merges them (merge.ts is stubbed to keep them apart).
import { describe, expect, it, vi } from 'vitest';
import { Box3, Group, Mesh, Vector3, type Object3D } from 'three';
vi.mock('./merge', async (orig) => {
  const real = await orig<typeof import('./merge')>();
  return {
    ...real,
    mergeRoot: (root: Object3D) => {
      const g = new Group();
      root.updateMatrixWorld(true);
      root.traverse((o) => {
        if (o instanceof Mesh) g.add(new Mesh((o.geometry as Mesh['geometry']).clone().applyMatrix4(o.matrixWorld), o.material));
      });
      return { group: g, baked: null, from: 0, to: 0, dispose: () => undefined };
    },
  };
});
import { crowd } from '../fixtures';
import { layoutOf, readyMaps } from '../maps';
import { NO_GROW } from '../growth';
import { coplanarClashes } from './coplanar';
import { lookOf } from './maps';
import { STYLE } from './style';
import { buildWorld } from './world';

const hex = (m: Mesh): string => (m.material as { color?: { getHexString(): string } }).color?.getHexString() ?? '';

describe('the walls', () => {
  it('hang nothing in the plane of what it overlaps, on every map (a z-fight)', { timeout: 120_000 }, () => {
    const bad: string[] = [];
    for (const map of readyMaps()) {
      const o = layoutOf(crowd(8).agents, map);
      const w = buildWorld(o, 'main', STYLE, lookOf(map), false, { ...NO_GROW, stage: 14 });
      w.root.updateMatrixWorld(true);
      // what hangs: flat (under 8 cm deep), above the desks
      const hung = new Group();
      w.root.traverse((m) => {
        if (!(m instanceof Mesh)) return;
        const b = new Box3().setFromObject(m);
        const s = b.getSize(new Vector3());
        if (b.min.y <= 0.8 || Math.min(s.x, s.z) >= 0.08 || s.y <= 0.04) return;
        const c = new Mesh((m.geometry as Mesh['geometry']).clone().applyMatrix4(m.matrixWorld), m.material);
        c.name = `#${hex(m as Mesh)} at ${b.getCenter(new Vector3()).toArray().map((v) => v.toFixed(2)).join(',')}`;
        hung.add(c);
      });
      // one colour over itself draws the same: only two colours fight
      for (const c of coplanarClashes(hung, 0.003, 1e-3)) if (c.a.split(' ')[0] !== c.b.split(' ')[0]) bad.push(`${map}: ${c.a} and ${c.b} (${c.area.toFixed(3)} m²)`);
      w.dispose();
    }
    expect(bad).toEqual([]);
  });
});
