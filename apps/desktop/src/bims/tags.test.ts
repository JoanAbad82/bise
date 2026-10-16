import { describe, expect, it } from 'vitest';
import { cutWords, placeTags, tagLeft, type TagIn } from './tags';

const tag = (name: string, x: number, y: number, w = 60, pill = false): TagIn => ({ name, x, y, w, h: 16, pill });
const boxes = (at: ReturnType<typeof placeTags>['at'], tags: readonly TagIn[]) =>
  tags.map((t) => ({ ...must(at.get(t.name)), w: t.w, h: t.h }));
function must<T>(x: T | undefined): T {
  if (x === undefined) throw new Error('missing');
  return x;
}
const overlap = (a: { left: number; top: number; w: number; h: number }, b: typeof a) =>
  a.left < b.left + b.w && b.left < a.left + a.w && a.top < b.top + b.h && b.top < a.top + a.h;

describe('tagLeft', () => {
  it('centres a tag on the head and holds it inside the office (bims-qa m_27780: the 320 hover line)', () => {
    expect(tagLeft(160, 100, 320)).toBe(110);
    expect(tagLeft(30, 325, 320)).toBe(4);
    expect(tagLeft(20, 100, 320)).toBe(4);
    expect(tagLeft(300, 100, 320)).toBe(216);
    expect(tagLeft(160, 100, 0)).toBe(110);
  });
});

describe('placeTags (designer via bims-qa m_27793)', () => {
  it('a lone tag sits over its head, no leader', () => {
    const { at, column } = placeTags([tag('a', 100, 80)], 320, 200);
    expect(at.get('a')).toEqual({ left: 70, top: 64, lead: false });
    expect(column).toBe(false);
  });

  it('a pill never moves; a label on it moves up one label height, with a leader', () => {
    const tags = [tag('lbl', 100, 80), tag('pil', 100, 80, 16, true)];
    const { at } = placeTags(tags, 320, 200);
    expect(at.get('pil')).toEqual({ left: 92, top: 64, lead: false });
    expect(at.get('lbl')).toEqual({ left: 70, top: 48, lead: true });
  });

  it('then down when up is taken or out of the office', () => {
    const tags = [tag('a', 100, 18), tag('b', 100, 18)];
    const { at } = placeTags(tags, 320, 200);
    expect(at.get('b')).toEqual({ left: 70, top: 18, lead: true });
  });

  it('no two tags overlap, whatever the pile (ctrl held in main\'s corner)', () => {
    const tags = [tag('p1', 280, 60, 16, true), tag('m', 280, 60), tag('x', 270, 64), tag('y', 290, 70, 80)];
    const { at } = placeTags(tags, 320, 200);
    const b = boxes(at, tags);
    for (let i = 0; i < b.length; i++) for (let j = i + 1; j < b.length; j++) expect(overlap(must(b[i]), must(b[j])), `${String(i)} ${String(j)}`).toBe(false);
  });

  it('no room after two moves: every tag in a column at the left edge, each with its leader', () => {
    const tags = [tag('a', 100, 40), tag('b', 100, 40), tag('c', 100, 40), tag('d', 100, 40)];
    const { at, column } = placeTags(tags, 320, 200);
    expect(column).toBe(true);
    expect([...at.values()].map((p) => [p.left, p.top, p.lead])).toEqual([
      [4, 4, true],
      [4, 22, true],
      [4, 40, true],
      [4, 58, true],
    ]);
  });
});

describe('cutWords', () => {
  const w = (s: string) => s.length * 6;
  it('keeps a line that fits', () => {
    expect(cutWords('signup-perf · done', 200, w)).toBe('signup-perf · done');
  });
  it('cuts after a whole word, one glued …', () => {
    expect(cutWords('cookie-banner · blocked · no access to the CMS', 6 * 43, w)).toBe('cookie-banner · blocked · no access to the…');
    expect(cutWords('signup 4.1 s → 0.9 s', 6 * 12, w)).toBe('signup 4.1…');
  });
  it('never leaves a separator before the …', () => {
    expect(cutWords('cookie-banner · blocked · no access', 6 * 25, w)).toBe('cookie-banner · blocked…');
  });
  it('a first word longer than the room is cut by characters', () => {
    expect(cutWords('averyveryverylongname', 6 * 8, w)).toBe('averyve…');
  });
});
