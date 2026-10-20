// His sent bubble folds into the dart his 3D plane leaves as (bims m_35441): the words fade, the
// bubble creases into a dart, the wings drop; it ends at the 3D plane's middle, length and heading.
import { describe, expect, it } from 'vitest';
import { CREASE, foldShape, WORDS } from './fold';

describe('the fold', () => {
  const l = { len: 120, hx: -0.6, hy: -0.8 };
  it('is the bubble at first, its words fading, then paper', () => {
    const a = foldShape(0, 200, 30, l);
    expect(a.points).toEqual([[0, 0], [200, 0], [200, 30], [0, 30]]);
    expect(a.words).toBe(1);
    expect(a.paper).toBe(0);
    expect(foldShape(WORDS, 200, 30, l).words).toBe(0);
    expect(foldShape(CREASE, 200, 30, l).paper).toBe(1);
  });

  it('ends as the dart: its nose half its length along the heading from the bubble’s middle', () => {
    const z = foldShape(1, 200, 30, l);
    const nose = z.points[1] ?? [0, 0];
    expect(nose[0]).toBeCloseTo(100 + -0.6 * 60, 6);
    expect(nose[1]).toBeCloseTo(15 + -0.8 * 60, 6);
    // the wings dropped: narrower than the open sheet
    const span = (s: ReturnType<typeof foldShape>): number => Math.hypot((s.points[0]?.[0] ?? 0) - (s.points[2]?.[0] ?? 0), (s.points[0]?.[1] ?? 0) - (s.points[2]?.[1] ?? 0));
    expect(span(z)).toBeLessThan(span(foldShape(CREASE, 200, 30, l)));
  });

  it('moves smoothly: no corner jumps between two frames 1/60 s apart', () => {
    let prev = foldShape(0, 200, 30, l);
    for (let i = 1; i <= 36; i++) {
      const s = foldShape(i / 36, 200, 30, l);
      s.points.forEach((p, k) => {
        expect(Math.hypot(p[0] - (prev.points[k]?.[0] ?? 0), p[1] - (prev.points[k]?.[1] ?? 0))).toBeLessThan(25);
      });
      prev = s;
    }
  });
});
