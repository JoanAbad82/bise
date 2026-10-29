// @vitest-environment happy-dom
// The bim's merge (page bims-look v6, the designer's condition for the clay look): each rigid part
// baked into one vertex-coloured mesh draws the same triangles in the same colours as the meshes it
// came from, near and far; a standing bim costs a handful of draws; the outfits come from the name.
import { describe, expect, it } from 'vitest';
import { type BufferGeometry, Color, type Material, Mesh, MeshStandardMaterial, type Object3D, Vector3 } from 'three';
import type { Pose, Spot } from '../model';
import { NEAR_PX, PARTS, makeBim, nearAt, type Bim } from './bim';
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
  b.group.updateMatrixWorld(true);
}

const shown = (m: Object3D): boolean => {
  for (let p: Object3D | null = m; p; p = p.parent) if (!p.visible) return false;
  return true;
};

interface Vx { readonly p: Vector3; readonly c: string; readonly k: string }

/** every drawn vertex: its world point and its colour (the material's, times its own; a glow marked) */
function drawn(b: Bim, far: boolean): Vx[] {
  const out: Vx[] = [];
  b.group.traverse((o) => {
    if (!(o instanceof Mesh) || !shown(o)) return;
    // the unmerged bim drawn far: its small details left out by hand
    if (far && o.userData.near === true) return;
    const g = o.geometry as BufferGeometry;
    const m = o.material as Material;
    const pos = g.getAttribute('position');
    const col = g.hasAttribute('color') ? g.getAttribute('color') : null;
    const idx = g.index;
    const n = idx ? idx.count : pos.count;
    const own = (m as Material & { color?: unknown }).color;
    const base = own instanceof Color ? own : new Color(1, 1, 1);
    const glow = m instanceof MeshStandardMaterial && m.userData.warm !== true && m.emissiveIntensity > 0 && m.emissive.getHex() !== 0 ? 'g' : '';
    const plain = col ? null : `${String(Math.round(base.r * 1e4))},${String(Math.round(base.g * 1e4))},${String(Math.round(base.b * 1e4))}${glow}`;
    for (let k = 0; k < n; k++) {
      const i = idx ? idx.getX(k) : k;
      const c = plain ?? (col === null ? '' : `${String(Math.round(col.getX(i) * base.r * 1e4))},${String(Math.round(col.getY(i) * base.g * 1e4))},${String(Math.round(col.getZ(i) * base.b * 1e4))}${glow}`);
      const p = new Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(o.matrixWorld);
      out.push({ p, c, k: `${String(Math.round(p.x * 1e4))},${String(Math.round(p.y * 1e4))},${String(Math.round(p.z * 1e4))}|${c}` });
    }
  });
  return out;
}

/** a's vertices with no match in b (the same colour, within TOL), each of b's matched once */
const TOL = 1e-4;
function unmatched(a: readonly Vx[], b: readonly Vx[]): string[] {
  const key = (v: Vx): string => v.k;
  // the exact ones first (nearly all), then what a rounding edge split, by distance
  const left = new Map<string, number>();
  for (const v of b) left.set(key(v), (left.get(key(v)) ?? 0) + 1);
  const restA: Vx[] = [];
  for (const v of a) {
    const n = left.get(key(v)) ?? 0;
    if (n > 0) left.set(key(v), n - 1);
    else restA.push(v);
  }
  const restB = b.filter((v) => {
    const n = left.get(key(v)) ?? 0;
    if (n <= 0) return false;
    left.set(key(v), n - 1);
    return true;
  });
  const out: string[] = [];
  for (const v of restA) {
    const j = restB.findIndex((w) => w.c === v.c && w.p.distanceTo(v.p) < TOL);
    if (j >= 0) restB.splice(j, 1);
    else out.push(key(v));
  }
  return out;
}

const meshes = (b: Bim): Mesh[] => {
  const out: Mesh[] = [];
  b.group.traverse((o) => { if (o instanceof Mesh && shown(o)) out.push(o as Mesh); });
  return out;
};

describe('the bim merged by part', () => {
  it('draws the same triangles in the same colours as unmerged, near and far', () => {
    for (const name of NAMES) {
      const main = name === 'main';
      for (const far of [false, true]) {
        const merged = makeBim(name, main, STYLE);
        const plain = makeBim(name, main, STYLE, undefined, undefined, false);
        merged.detail(!far);
        standing(merged, main);
        standing(plain, main);
        const a = drawn(merged, false);
        const b = drawn(plain, far);
        expect(a.length, `${name} ${far ? 'far' : 'near'}`).toBe(b.length);
        expect(unmatched(a, b).slice(0, 4), `${name} ${far ? 'far' : 'near'}`).toEqual([]);
        merged.dispose();
        plain.dispose();
      }
    }
    // every outfit near and far, twice built: ~5 s alone, more on a loaded machine (release-56 m_43466)
  }, 60_000);

  it('keeps one mesh per part (two with a far level), the face apart', () => {
    for (const name of NAMES) {
      const b = makeBim(name, name === 'main', STYLE);
      for (const part of PARTS) {
        const g = b.group.getObjectByName(part);
        expect(g, part).toBeDefined();
        const baked = g?.children.filter((c) => c instanceof Mesh && c.name.startsWith(`${part}:`) && !c.name.endsWith(':glow')) ?? [];
        expect(baked.length, `${name} ${part}`).toBeGreaterThanOrEqual(1);
        expect(baked.length, `${name} ${part}`).toBeLessThanOrEqual(2);
      }
      b.dispose();
    }
  });

  it('costs 8 to 12 draws standing (shadows apart), far at the office fit', () => {
    for (const name of NAMES) {
      const main = name === 'main';
      const b = makeBim(name, main, STYLE);
      b.detail(false);
      standing(b, main);
      const n = meshes(b).length;
      expect(n, name).toBeGreaterThanOrEqual(8);
      expect(n, name).toBeLessThanOrEqual(12);
      b.dispose();
    }
  });

  it('goes grey through its parts material and its own ones', () => {
    const b = makeBim('signup-perf', false, STYLE);
    standing(b, false);
    const spot: Spot = { x: 0, z: 0, wz: 0, ax: 0, face: 0 };
    const act = { k: 'visit', at: 'desk' } as const;
    const pose: Pose = { x: 0, z: 0, dir: 0, moving: false, since: 30, seg: { t: 0, act, sig: act.k, spot, path: { pts: [spot], seg: [], len: 0 }, speed: 2.4, from: null } };
    b.apply({ ...rigOf({ pose, t: 30, main: false, phase: 1.3, reduced: false }), grey: 1 });
    const body = b.group.getObjectByName('body')?.children.find((c) => c instanceof Mesh && c.name.startsWith('body:')) as Mesh;
    expect(((body.material as Material).userData.toward as number[])[3]).toBeCloseTo(0.85);
    b.dispose();
  });
});

describe('the level of detail', () => {
  it('draws the small details from NEAR_PX css px per unit (the follow zoom at 320), not at the fit', () => {
    expect(nearAt(1 / 12.2)).toBe(false);
    expect(nearAt(1 / (12.2 * 2.2))).toBe(true);
    expect(nearAt(1 / NEAR_PX)).toBe(true);
    expect(nearAt(0)).toBe(false);
  });
});

describe('the outfits', () => {
  it('come from the name, every kind worn by someone, main always in its ink hoodie', () => {
    const kinds = new Set<string>();
    for (let i = 0; i < 400; i++) kinds.add(outfitOf(`agent-${String(i)}`, false).kind);
    expect([...kinds].sort()).toEqual([...KINDS].sort());
    expect(outfitOf('main', true).kind).toBe('hoodie');
    expect(outfitOf('x', false)).toEqual(outfitOf('x', false));
    for (let i = 0; i < 100; i++) {
      const o = outfitOf(`a${String(i)}`, false);
      expect(o.second).not.toBe(o.hoodie);
    }
  });
});
