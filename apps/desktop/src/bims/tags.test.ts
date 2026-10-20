import { describe, expect, it } from 'vitest';
import { cutLines, cutWords, placeTags, tagLeft, type TagIn } from './tags';

const tag = (name: string, x: number, y: number, w = 60, pill = false, rank = 3): TagIn => ({ name, x, y, w, h: 16, pill, rank });
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

describe('placeTags (designer m_27793, m_27799)', () => {
  it('a lone tag sits over its head, no leader', () => {
    const { at, left } = placeTags([tag('a', 100, 80)], 320, 200);
    expect(at.get('a')).toEqual({ left: 70, top: 64, lead: false });
    expect(left).toBe(0);
  });

  it('a pill never moves off its bim; a label on it moves up one label height, with a leader', () => {
    const tags = [tag('lbl', 100, 80), tag('pil', 100, 80, 16, true)];
    const { at } = placeTags(tags, 320, 200);
    expect(at.get('pil')).toEqual({ left: 92, top: 64, lead: false });
    expect(at.get('lbl')).toEqual({ left: 70, top: 48, lead: true });
  });

  it('two pills side by side: the second steps beside the first, with its leader; a name never moves a pill', () => {
    const tags = [tag('a', 100, 80, 16, true, 1), tag('b', 104, 80, 16, true, 2), tag('walker', 100, 80, 60, false, 0)];
    const { at } = placeTags(tags, 320, 200);
    expect(at.get('a')).toEqual({ left: 92, top: 64, lead: false });
    expect(at.get('b')).toEqual({ left: 114, top: 64, lead: true });
    expect(at.get('walker')?.lead, 'the name yields').toBe(true);
  });

  it('a pill stays inside the office (a head near its bottom edge)', () => {
    const { at } = placeTags([tag('pil', 100, 300, 16, true)], 320, 200);
    expect(at.get('pil')).toEqual({ left: 92, top: 180, lead: false });
  });

  it('then down when up is out of the office', () => {
    const tags = [tag('a', 100, 18), tag('b', 100, 18)];
    const { at } = placeTags(tags, 320, 200);
    expect(at.get('b')).toEqual({ left: 70, top: 18, lead: true });
  });

  it('no two tags overlap and none leaves the office, whatever the pile (ctrl held, 16 names at 320)', () => {
    const tags = Array.from({ length: 16 }, (_, i) => tag(`n${String(i)}`, 120 + (i % 4) * 24, 60 + Math.floor(i / 4) * 10, i % 5 === 0 ? 16 : 70, i % 5 === 0, i % 3));
    const { at, left } = placeTags(tags, 320, 204);
    const shown = tags.filter((t) => at.has(t.name));
    expect(shown.length + left).toBe(16);
    const b = boxes(at, shown);
    for (const r of b) expect(r.top >= 0 && r.top + r.h <= 204 && r.left >= 4 && r.left + r.w <= 316).toBe(true);
    // nothing meets anything, two pills either (bims m_31446)
    for (let i = 0; i < b.length; i++) for (let j = i + 1; j < b.length; j++) expect(overlap(must(b[i]), must(b[j])), `${String(i)} ${String(j)}`).toBe(false);
    // every pill shows
    for (const t of tags.filter((x) => x.pill)) expect(at.has(t.name)).toBe(true);
  });

  it('no room: the quiet one is left out and counted, never one that waits on him', () => {
    const tags = [tag('quiet', 100, 40, 60, false, 3), tag('asks', 100, 40, 60, false, 1), tag('work', 100, 40, 60, false, 2)];
    const box = { w: 320, h: 40 };
    const { at, left } = placeTags(tags, box.w, box.h);
    expect(at.has('asks')).toBe(true);
    expect(at.has('work')).toBe(true);
    expect(at.has('quiet')).toBe(false);
    expect(left).toBe(1);
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

describe('cutLines (the hover card title)', () => {
  const w = (s: string) => s.length * 6;
  it('wraps whole words on lines of the room', () => {
    expect(cutLines('no access to the CMS', 6 * 10, 3, w)).toEqual(['no access', 'to the CMS']);
    expect(cutLines('short', 200, 3, w)).toEqual(['short']);
    expect(cutLines('', 200, 3, w)).toEqual([]);
  });
  it('past its lines, the last one is cut with one glued …', () => {
    expect(cutLines('one two three four five six seven', 6 * 9, 2, w)).toEqual(['one two', 'three…']);
  });
  it('a word longer than a line is cut on its own', () => {
    expect(cutLines('averyveryverylongname ok', 6 * 8, 3, w)).toEqual(['averyve…', 'ok']);
  });
});

describe('the corner chips keep out (brief bims-mapsel)', () => {
  // the map chip bottom left, '⤢ fit' bottom right, in a 320 × 200 office
  const MAP = { left: 4, top: 178, w: 70, h: 18 };
  const FIT = { left: 270, top: 178, w: 46, h: 18 };
  it('an edge pill near a bottom corner stops above the chip, 4 px clear (designer m_35455)', () => {
    const { at } = placeTags([tag('l', 10, 300, 16, true), tag('r', 315, 300, 16, true)], 320, 200, [MAP, FIT]);
    expect(at.get('l')).toEqual({ left: 4, top: 158, lead: true });
    expect(at.get('r')).toEqual({ left: 300, top: 158, lead: true });
  });
  it('no tag, pill or name, ever sits under a chip', () => {
    const tags = Array.from({ length: 12 }, (_, i) => tag(`n${String(i)}`, (i * 29) % 320, 150 + (i % 4) * 14, i % 3 === 0 ? 16 : 60, i % 3 === 0, i % 3));
    const { at } = placeTags(tags, 320, 200, [MAP, FIT]);
    for (const b of boxes(at, tags.filter((t) => at.has(t.name)))) {
      expect(overlap(b, MAP)).toBe(false);
      expect(overlap(b, FIT)).toBe(false);
    }
  });
  it('no chips: the same places as before', () => {
    const tags = [tag('a', 100, 80, 16, true), tag('b', 100, 80)];
    expect(placeTags(tags, 320, 200, [])).toEqual(placeTags(tags, 320, 200));
  });
});
