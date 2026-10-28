import { describe, expect, it } from 'vitest';
import { bubbleOf, MAX_PODS, planOf, type PlanIn } from './plan';

const base: PlanIn = { step: 'hello', look: null, check: 'none', answer: null, ready: false, ticked: [], sent: false };

describe('the first launch island (plan.ts)', () => {
  it('builds a piece per step: the bim, then the desk, then a little island per ticked project, then the plane', () => {
    expect(planOf(base)).toEqual({ look: null, desk: false, glow: 'off', pods: [], pose: 'stand', bubble: null, wide: false, plane: false });
    const model = planOf({ ...base, step: 'model' });
    expect([model.desk, model.pose, model.glow]).toEqual([true, 'desk', 'off']);
    const proj = planOf({ ...base, step: 'projects', ready: true, ticked: ['shop', 'api', 'infra', 'blog', 'docs'] });
    expect(proj.pods).toEqual(['shop', 'api', 'infra', 'blog']);
    expect(proj.pods.length).toBe(MAX_PODS);
    expect([proj.wide, proj.glow, proj.pose]).toEqual([true, 'lit', 'sit']);
    const first = planOf({ ...base, step: 'first', ready: true, ticked: ['shop'] });
    expect([first.pods, first.plane, first.pose]).toEqual([['shop'], false, 'sit']);
    const sent = planOf({ ...base, step: 'first', ready: true, ticked: ['shop'], sent: true });
    expect([sent.plane, sent.pose]).toEqual([true, 'read']);
  });

  it("the desk's little window blinks while the check runs, is lit once it works, and the model's first words go over the bim", () => {
    expect(planOf({ ...base, step: 'model', check: 'signing' }).glow).toBe('checking');
    expect(planOf({ ...base, step: 'model', check: 'checking' }).glow).toBe('checking');
    expect(planOf({ ...base, step: 'model', check: 'failed' }).glow).toBe('off');
    const works = planOf({ ...base, step: 'model', check: 'works', answer: '  Hi!\nready when you are. ' });
    expect([works.glow, works.bubble]).toEqual(['lit', 'Hi! ready when you are.']);
    // no projects ticked: no little island, no wide camera
    expect(planOf({ ...base, step: 'projects', ready: true }).wide).toBe(false);
  });

  it('a long answer is cut on one line', () => {
    const b = bubbleOf('x'.repeat(80));
    expect(b.length).toBe(48);
    expect(b.endsWith('…')).toBe(true);
    expect(bubbleOf('short')).toBe('short');
  });
});
