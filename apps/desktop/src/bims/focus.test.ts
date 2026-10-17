import { describe, expect, it } from 'vitest';
import { aimAt, bimsLit, easeCam, edgeOf, FOLLOW_ZOOM, followOf, settled } from './focus';
import { MAX_ZOOM } from './zoom';
import { foldOf } from './Fold';
import { FIT } from './zoom';

const agents = [
  { name: 'main', main: true },
  { name: 'perf', main: false },
  { name: 'old', main: false, archived: true },
];

describe('followOf', () => {
  it("follows an agent's thread in this project", () => {
    expect(followOf({ screen: 'thread', project: 'p', agent: 'perf' }, 'p', agents)).toBe('perf');
  });
  it("never main's, an archived one's, another project's or another screen", () => {
    expect(followOf({ screen: 'thread', project: 'p', agent: 'main' }, 'p', agents)).toBeNull();
    expect(followOf({ screen: 'thread', project: 'p', agent: 'old' }, 'p', agents)).toBeNull();
    expect(followOf({ screen: 'thread', project: 'q', agent: 'perf' }, 'p', agents)).toBeNull();
    expect(followOf({ screen: 'agents', project: 'p' }, 'p', agents)).toBeNull();
  });
});

describe('the follow camera', () => {
  it('aims FOLLOW_ZOOM close, held inside the fit', () => {
    expect(aimAt(0.5, 0.5)).toEqual({ zoom: FOLLOW_ZOOM, u: 0.5, v: 0.5 });
    const corner = aimAt(0, 1);
    expect(corner.u).toBeCloseTo(0.5 / FOLLOW_ZOOM);
    expect(corner.v).toBeCloseTo(1 - 0.5 / FOLLOW_ZOOM);
  });
  it('looks about twice as close as the first follow (his shot: the bim and its desk fill the view), within his pinch', () => {
    expect(FOLLOW_ZOOM).toBeGreaterThanOrEqual(4);
    expect(FOLLOW_ZOOM).toBeLessThanOrEqual(MAX_ZOOM);
  });
  it('eases there in about 300 ms, at once under reduced motion', () => {
    const to = aimAt(0.3, 0.6);
    expect(easeCam(FIT, to, 0.016, true)).toEqual(to);
    let c = FIT;
    for (let i = 0; i < 18; i++) c = easeCam(c, to, 1 / 60, false);
    expect(Math.abs(c.zoom - to.zoom)).toBeLessThan(0.2);
    for (let i = 0; i < 60; i++) c = easeCam(c, to, 1 / 60, false);
    expect(c).toEqual(to);
    expect(settled(c, to)).toBe(true);
  });
});

describe('edgeOf', () => {
  it('leaves a point inside where it is', () => {
    expect(edgeOf(50, 50, 100, 100, 4)).toEqual({ x: 50, y: 50, side: null });
  });
  it('holds one outside at the nearest edge, the side it came from', () => {
    expect(edgeOf(-30, 50, 100, 100, 4)).toEqual({ x: 4, y: 50, side: 'left' });
    expect(edgeOf(160, 40, 100, 100, 4).side).toBe('right');
    expect(edgeOf(50, 300, 100, 100, 4)).toEqual({ x: 50, y: 96, side: 'down' });
  });
});

describe('bimsLit', () => {
  it('only the side that lit it clears it', () => {
    bimsLit.set({ name: 'perf', from: 'row' });
    bimsLit.set(null, 'bim');
    expect(bimsLit.get()).toEqual({ name: 'perf', from: 'row' });
    bimsLit.set(null, 'row');
    expect(bimsLit.get()).toBeNull();
  });
});

describe('foldOf', () => {
  it('opens from gone through closed, closes through closing', () => {
    expect(foldOf('gone', true)).toBe('closed');
    expect(foldOf('closing', true)).toBe('open');
    expect(foldOf('open', false)).toBe('closing');
    expect(foldOf('gone', false)).toBe('gone');
  });
});
