// The office's inbox stand (bims/inbox.ts places it, render/inbox.ts draws it): on every map, for a
// new project and a full one, just inside the door, clear of every walk and piece; static sheets.
import { describe, expect, it } from 'vitest';
import { Group } from 'three';
import { agent, crowd } from './fixtures';
import { layoutOf } from './maps';
import { MAP_IDS } from './maps/ids';
import { BODY_R } from './avoid';
import { boxLegGap, inboxBox, inboxFits } from './inbox';
import { withGhosts } from './ghosts';
import { inboxStand, sheetsFor } from './render/inbox';
import { coplanarClashes } from './render/coplanar';
import { kitOf } from './render/kit';
import { LOOKS } from './render/maps';
import { STYLE } from './render/style';
import { NO_GROW } from './growth';

const lead = [agent('main', { main: true })];

describe('the inbox stand', () => {
  for (const map of MAP_IDS) {
    for (const [label, crew] of [['a new project', lead], ['12 agents', crowd(11).agents]] as const) {
      it(`${map}, ${label}: placed inside, near the door, clear of every walk by a body`, () => {
        const o = layoutOf(crew, map);
        const at = o.inbox;
        expect(at, 'an inbox fits').toBeDefined();
        if (at === undefined) return;
        expect(inboxFits(o, at)).toBe(true);
        const b = inboxBox(at);
        for (const l of o.walks) expect(boxLegGap(b, l)).toBeGreaterThan(BODY_R);
        expect(Math.hypot(at.x - o.door.x, at.z - o.door.z), 'by the door').toBeLessThan(4.2);
      });
    }
    it(`${map}, the welcome's plan (with its empty desks): an inbox too`, () => {
      expect(withGhosts(layoutOf)(lead, map).inbox).toBeDefined();
    });
  }

  it('a box crossing a leg has no gap; one beside it its distance', () => {
    const b = { x0: 0, x1: 1, z0: 0, z1: 1 };
    expect(boxLegGap(b, [{ x: -1, z: 0.5 }, { x: 2, z: 0.5 }])).toBe(0);
    expect(boxLegGap(b, [{ x: -1, z: 1.5 }, { x: 2, z: 1.5 }])).toBeCloseTo(0.5);
  });

  it('0 to 3 sheets, three or more read 3', () => {
    expect([0, 1, 2, 3, 9, -1].map(sheetsFor)).toEqual([0, 1, 2, 3, 3, 0]);
  });

  it('drawn with no two faces in one plane, its sheets shown by the count', () => {
    const o = layoutOf(lead);
    const root = new Group();
    const k = kitOf(STYLE, LOOKS.loft.pal(false));
    const h = inboxStand({ k, root, o, grow: NO_GROW, stage: () => root });
    expect(h).not.toBeNull();
    h?.sheets(2);
    expect(coplanarClashes(root)).toEqual([]);
    const shown: boolean[] = [];
    root.traverse((m) => {
      if ((m as { geometry?: unknown }).geometry !== undefined && m.parent !== root) shown.push(m.visible);
    });
    expect(shown.filter((v) => !v).length, 'one sheet of 3 hidden').toBe(1);
  });
});
