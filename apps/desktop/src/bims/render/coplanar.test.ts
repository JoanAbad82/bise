// The z-fight finder (coplanar.ts), and the workshop's Vespa through it: no two of its faces in one
// plane (the old car it replaced z-fought its wheels: 5 clashes, bims-vespa).
import { Group } from 'three';
import { describe, expect, it } from 'vitest';
import { coplanarClashes } from './coplanar';
import { kitOf } from './kit';
import { LOOKS } from './maps';
import { vespa } from './maps/workshop';
import { STYLE } from './style';

const kit = () => kitOf(STYLE, LOOKS.workshop.pal(false));

describe('coplanar', () => {
  it('finds a cap flush with its wheel, not one 0.02 out', () => {
    const k = kit();
    const g = new Group();
    const flush = new Group();
    k.add(STYLE.cylinder(0.2, 0.1), k.mat('#000000'), flush, 0, 0, 0).name = 'tyre';
    k.add(STYLE.cylinder(0.1, 0.1), k.mat('#ffffff'), flush, 0, 0, 0).name = 'cap';
    g.add(flush);
    expect(coplanarClashes(g).map((c) => [c.a, c.b])).toEqual([['tyre', 'cap']]);
    const out = new Group();
    k.add(STYLE.cylinder(0.2, 0.1), k.mat('#000000'), out, 0, 0, 0);
    k.add(STYLE.cylinder(0.1, 0.14), k.mat('#ffffff'), out, 0, 0, 0);
    expect(coplanarClashes(out)).toEqual([]);
  });

  it('leaves two faces of one plane that do not overlap', () => {
    const k = kit();
    const g = new Group();
    k.add(STYLE.cylinder(0.1, 0.1), k.mat('#000000'), g, -0.5, 0, 0);
    k.add(STYLE.cylinder(0.1, 0.1), k.mat('#000000'), g, 0.5, 0, 0);
    expect(coplanarClashes(g)).toEqual([]);
  });

  it("the workshop's Vespa has no two faces in one plane", () => {
    const g = new Group();
    vespa(kit(), g, 3.2, 4.1);
    expect(coplanarClashes(g)).toEqual([]);
  });
});
