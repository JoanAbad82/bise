// @vitest-environment happy-dom
// A merge of something merged already keeps its colours (bims m_32697: the town's merge of an office
// painted the cozy plants and pots, merged by cozy.ts, in their merged material's white).
import { describe, expect, it } from 'vitest';
import { BoxGeometry, Color, Group, Mesh } from 'three';
import { mergeRoot } from './merge';
import { STYLE } from './style';

describe('mergeRoot', () => {
  it('keeps the vertex colours of a mesh merged already, the plain ones painted their colour', () => {
    const leaf = new Color('#4e9a48');
    const inner = new Group();
    inner.add(new Mesh(new BoxGeometry(0.1, 0.6, 0.05), STYLE.material('#4e9a48')));
    const once = mergeRoot(inner, STYLE, false);
    const root = new Group();
    for (const m of [...once.group.children]) root.add(m);
    root.add(new Mesh(new BoxGeometry(1, 1, 1), STYLE.material('#9a958c')));
    const twice = mergeRoot(root, STYLE, false);
    const baked = twice.group.children.find((m) => m instanceof Mesh && m.material === twice.baked) as Mesh;
    const col = baked.geometry.getAttribute('color');
    const greens = Array.from({ length: col.count }, (_, i) => i).filter((i) => Math.abs(col.getY(i) - leaf.g) < 1e-3 && Math.abs(col.getX(i) - leaf.r) < 1e-3);
    expect(greens.length).toBe(36);
    const pot = new Color('#9a958c');
    expect(Array.from({ length: col.count }, (_, i) => i).filter((i) => Math.abs(col.getX(i) - pot.r) < 1e-3).length).toBe(36);
  });
});
