// The far office's still bims (town/stand.ts): each at its spot, a napper on a bed the stage built
// or at its desk, the working ones' screens lit, the same signature while nothing changes.
import { describe, expect, it } from 'vitest';
import { agent, mainAgent } from '../fixtures';
import { layoutOf } from '../maps';
import { activities } from '../activity';
import { stillOf, stillSig } from './stand';

const agents = [mainAgent({ status: 'working' }), agent('a', { status: 'working', turn_ms: 1000 }), agent('b'), agent('c')];
const office = layoutOf(agents);
const acts = activities({ agents, cards: [], places: [] }, 1_791_100_000);

describe('town stills', () => {
  it('stands each bim at a spot of its office and lights the working ones', () => {
    const s = stillOf(office, acts, 'main', 4);
    expect(s.stands.map((b) => b.name)).toEqual(['a', 'b', 'c', 'main']);
    expect(s.lit).toEqual(['a', 'main']);
    const a = s.stands.find((b) => b.name === 'a');
    expect(a && { x: a.x, z: a.z }).toEqual({ x: office.desks.get('a')?.x, z: office.desks.get('a')?.z });
  });

  it('puts a napper at its desk while the stage has built no bed', () => {
    const s = stillOf(office, acts, 'main', 0);
    for (const n of ['b', 'c']) {
      const b = s.stands.find((x) => x.name === n);
      expect(b && { x: b.x, z: b.z }, n).toEqual({ x: office.desks.get(n)?.x, z: office.desks.get(n)?.z });
    }
  });

  it('keeps its signature while nothing changes', () => {
    expect(stillSig(stillOf(office, acts, 'main', 2))).toBe(stillSig(stillOf(office, acts, 'main', 2)));
  });
});
