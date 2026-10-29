// A new project's welcome office: its empty desks are the plan's next free desks, on every map,
// and no live agent's desk moves for them (bims/ghosts.ts, render/ghost.ts).
import { describe, expect, it } from 'vitest';
import { Group } from 'three';
import { agent } from './fixtures';
import { layoutOf } from './maps';
import { MAP_IDS } from './maps/ids';
import { WELCOME_GHOSTS, withGhosts } from './ghosts';
import { dashes, ghostBox, ghostDesks } from './render/ghost';
import { coplanarClashes } from './render/coplanar';
import { kitOf } from './render/kit';
import { LOOKS } from './render/maps';
import { STYLE } from './render/style';
import { NO_GROW } from './growth';

const lead = [agent('main', { main: true })];

describe('withGhosts', () => {
  for (const map of MAP_IDS) {
    it(`${map}: ${String(WELCOME_GHOSTS)} empty desks, none built, none on a desk`, () => {
      const o = withGhosts(layoutOf)(lead, map);
      expect(o.ghosts?.length).toBe(WELCOME_GHOSTS);
      expect(o.desks.size).toBe(0);
      const ghosts = o.ghosts ?? [];
      for (const g of ghosts) expect(ghosts.filter((h) => h.x === g.x && h.z === g.z).length).toBe(1);
    });
  }

  it("a live agent keeps its desk; the empty ones are the next ones (the loft's start order)", () => {
    const crew = [...lead, agent('perf')];
    const plain = layoutOf(crew);
    const o = withGhosts(layoutOf)(crew);
    expect(o.desks.get('perf')).toEqual(plain.desks.get('perf'));
    const five = layoutOf([...crew, ...['a', 'b', 'c', 'd'].map((n) => agent(n))]);
    expect(o.ghosts).toEqual(['a', 'b', 'c', 'd'].map((n) => five.desks.get(n)));
  });
});

describe('the ghost desk', () => {
  it('a side of dashes starts and ends on a dash, inside its side', () => {
    const d = dashes(0, 1.4);
    expect(d.length).toBeGreaterThan(2);
    const first = d[0];
    const last = d.at(-1);
    expect(first && first.at - first.len / 2).toBeCloseTo(0);
    expect(last && last.at + last.len / 2).toBeCloseTo(1.4);
    expect(dashes(0, 0)).toEqual([]);
  });

  it("its outline is the plan's desk footprint", () => {
    const o = withGhosts(layoutOf)(lead);
    const g = o.ghosts?.[0];
    expect(g).toBeDefined();
    if (g === undefined) return;
    const b = ghostBox(o.furniture, g);
    expect(b.x0).toBeLessThan(g.x);
    expect(b.x1).toBeGreaterThan(g.x);
    expect(b.z0).toBeGreaterThan(g.z);
  });

  it('no two faces of its dashes in one plane (no z-fight)', () => {
    const o = withGhosts(layoutOf)(lead);
    const root = new Group();
    const k = kitOf(STYLE, LOOKS.loft.pal(false));
    ghostDesks({ k, root, o, grow: NO_GROW, stage: () => root });
    expect(root.children.length).toBeGreaterThan(0);
    expect(coplanarClashes(root)).toEqual([]);
  });
});
