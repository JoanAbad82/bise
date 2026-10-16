import { describe, expect, it } from 'vitest';
import { frame } from '../fixtures';
import { eggRig } from './egg';
import { rigOf } from './pose';

const rig = rigOf({ pose: frame('a', { k: 'done', at: 'terrace' }, { t: 0, now: 30 }).pose, t: 30, main: false, phase: 0, reduced: false });

describe("the eggs' bodies (egg.ts)", () => {
  it('no egg: the rig as is', () => {
    expect(eggRig(rig, null)).toBe(rig);
  });
  it('a salto turns the body once around and lands where it took off, drawing while it plays', () => {
    const mid = eggRig(rig, { kind: 'salto', since: 0.45, dur: 0.9, label: '' });
    expect(mid.y).toBeGreaterThan(rig.y + 0.5);
    expect(mid.motion).toBe('walk');
    const end = eggRig(rig, { kind: 'salto', since: 0.9, dur: 0.9, label: '' });
    expect(end.y).toBeCloseTo(rig.y);
    expect(end.body[0]).toBeCloseTo(rig.body[0] - 2 * Math.PI);
  });
  it('the props: a coin on the hop, the box held up, the golden pineapple, the sunglasses', () => {
    expect(eggRig(rig, { kind: 'hop', since: 0.3, dur: 0.6, label: '' }).props.coin).toBeCloseTo(0.5);
    expect(eggRig(rig, { kind: 'itemget', since: 1, dur: 2.5, label: '' }).props).toMatchObject({ crate: true, crateUp: true });
    expect(eggRig(rig, { kind: 'golden', since: 1, dur: Infinity, label: '' }).props).toMatchObject({ pine: true, golden: true });
    const shades = eggRig(rig, { kind: 'shades', since: 0, dur: Infinity, label: '' });
    expect(shades.props.glasses).toBe(true);
    // a lasting egg is a still pose: no loop for it
    expect(shades.motion).toBe(rig.motion);
  });
  it('the moonwalk faces backwards on its way', () => {
    expect(eggRig(rig, { kind: 'moonwalk', since: 1, dur: 3, label: '' }).dir).toBeCloseTo(rig.dir + Math.PI);
  });
});
