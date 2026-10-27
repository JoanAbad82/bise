// @vitest-environment happy-dom
// The bims' own z-fights and floor (bim-review pass 1, bim-3d): a standing bim of every outfit, and
// main, draws no two faces of two colours in one plane (the hoodie's pocket and its edge fought over
// 71 cm², the short hair's cap and the skull by the temples), and the home's last gag keeps its
// bims' soles on the floor through their bow (their toes went 3-5 cm under it).
import { describe, expect, it } from 'vitest';
import { Color, Mesh, type Object3D, Vector3 } from 'three';
import type { Pose, Spot } from '../model';
import { ISLANDS } from '../sprites/gags';
import { type Bim, makeBim } from './bim';
import { coplanarClashes } from './coplanar';
import { KINDS, outfitOf } from './palette';
import { rigOf } from './pose';
import { STYLE } from './style';

/** main, then a name for every outfit kind */
const NAMES = ((): string[] => {
  const out = ['main'];
  const kinds = new Set<string>();
  for (let i = 0; kinds.size < KINDS.length; i++) {
    const n = `agent-${String(i)}`;
    const o = outfitOf(n, false);
    if (kinds.has(o.kind)) continue;
    kinds.add(o.kind);
    out.push(n);
  }
  return out;
})();

function standing(b: Bim, main: boolean): void {
  const spot: Spot = { x: 0, z: 0, wz: 0, ax: 0, face: 0 };
  const act = { k: 'visit', at: 'desk' } as const;
  const pose: Pose = { x: 0, z: 0, dir: 0, moving: false, since: 30, seg: { t: 0, act, sig: act.k, spot, path: { pts: [spot], seg: [], len: 0 }, speed: 2.4, from: null } };
  b.apply(rigOf({ pose, t: 30, main, phase: 1.3, reduced: false }));
  b.detail(true);
  b.group.updateMatrixWorld(true);
}

const shown = (m: Object3D): boolean => {
  for (let p: Object3D | null = m; p; p = p.parent) if (!p.visible) return false;
  return true;
};

const isMesh = (o: Object3D): o is Mesh => o instanceof Mesh;

const colourOf = (m: Mesh): string => {
  const c = (m.material as { color?: unknown }).color;
  return c instanceof Color ? c.getHexString() : '';
};

describe('a standing bim fights itself nowhere', () => {
  it.each(NAMES)('%s: no two faces of two colours in one plane', (name) => {
    const main = name === 'main';
    const b = makeBim(name, main, STYLE, { ...outfitOf(name, main), hat: 'bare' }, undefined, false);
    standing(b, main);
    // only what is drawn: the hidden props are not there to fight
    const hidden: Mesh[] = [];
    b.group.traverse((o) => { if (isMesh(o) && !shown(o)) hidden.push(o); });
    for (const m of hidden) m.removeFromParent();
    const byName = new Map<string, Mesh>();
    b.group.traverse((o) => {
      if (!isMesh(o)) return;
      o.name = `${o.parent?.name ?? ''}/${o.geometry.type}#${colourOf(o)}#${String(byName.size)}`;
      byName.set(o.name, o);
    });
    const fights = coplanarClashes(b.group, 0.002, 4e-5, 'same')
      .filter((c) => colourOf(byName.get(c.a) as Mesh) !== colourOf(byName.get(c.b) as Mesh))
      .map((c) => `${c.a} x ${c.b} ${(c.area * 1e4).toFixed(1)} cm²`);
    expect(fights).toEqual([]);
    b.dispose();
  });
});

describe('the home gags stand on their floor', () => {
  it('the end: every frame, both bims, the soles at most 2.5 cm under the floor (the shoes sink a little by design)', () => {
    const end = ISLANDS.find((s) => s.id === 'end');
    expect(end).toBeDefined();
    const b = makeBim('stock', false, STYLE, outfitOf('stock', false), undefined, false);
    const v = new Vector3();
    const low: string[] = [];
    end?.frames.forEach((f, i) => {
      for (const a of f.bims) {
        b.apply(a.rig);
        b.group.updateMatrixWorld(true);
        let y = Infinity;
        b.group.traverse((o) => {
          if (!isMesh(o) || !shown(o) || (o.parent?.name !== 'legL' && o.parent?.name !== 'legR')) return;
          const pos = o.geometry.getAttribute('position');
          for (let k = 0; k < pos.count; k++) y = Math.min(y, v.fromBufferAttribute(pos, k).applyMatrix4(o.matrixWorld).y);
        });
        if (y < -0.025) low.push(`frame ${String(i)} ${a.name}: ${(y * 100).toFixed(1)} cm`);
      }
    });
    expect(low).toEqual([]);
    b.dispose();
  });
});
