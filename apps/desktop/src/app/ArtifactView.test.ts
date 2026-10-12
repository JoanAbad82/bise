import { describe, expect, it } from 'vitest';
import { artOf, artPct, artWidth } from './ArtifactView';

describe("an artifact open in the window (designer's artifact-open page)", () => {
  it("opens for a project's artifact by id, never for a list or every project's", () => {
    expect(artOf({ screen: 'artifacts', project: 'shop', id: 'page-1' })).toEqual({ project: 'shop', id: 'page-1' });
    expect(artOf({ screen: 'artifacts', project: 'shop' })).toBeUndefined();
    expect(artOf({ screen: 'artifacts', project: '', id: 'page-1' })).toBeUndefined();
    expect(artOf({ screen: 'bise' })).toBeUndefined();
  });
  it('takes 55% by default, kept between 50% and 70%', () => {
    expect(artPct(undefined)).toBe(0.55);
    expect(artPct('wide')).toBe(0.55);
    expect(artPct(0.3)).toBe(0.5);
    expect(artPct(0.9)).toBe(0.7);
    expect(artPct(0.62)).toBe(0.62);
  });
  it("leaves the thread 380 px beside the left bar (designer's 1400 mock: 240 | 390 | 770)", () => {
    expect(artWidth(1400, 240, 0.55)).toBe(770);
    expect(artWidth(1100, 0, 0.55)).toBe(605);
    // a share that would squeeze the thread under 380 gives way
    expect(artWidth(1400, 240, 0.7)).toBe(780);
    expect(artWidth(1100, 240, 0.7)).toBe(480);
  });
});
