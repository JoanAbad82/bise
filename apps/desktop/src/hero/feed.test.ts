// The feed plays bims-film v14's lines: typed then sent, folded into the plane, bise's waiting lines
// with their field or their choices, a ✓ per crate in, empty at the fold; the page sits where designer
// put it and falls apart from its edge in.
import { describe, expect, it } from 'vitest';
import { FILM_S, PAGE } from './cast';
import { FEED_ROWS, feedAt } from './feed';
import { foldOf, PAGE_W_MAX, pageBox } from './page';

describe('the feed', () => {
  it('types his first line, then sends it and folds it into his plane', () => {
    const typing = feedAt(3.5);
    expect(typing.rows).toEqual([]);
    expect('build a shop for kiln, my pottery studio'.startsWith(typing.typing)).toBe(true);
    expect(typing.typing.length).toBeGreaterThan(0);
    expect(feedAt(4.25).rows[0]?.words).toBe('build a shop for kiln, my pottery studio');
    expect(feedAt(4.4).rows[0]?.folding).not.toBeNull();
    expect(feedAt(5).rows[0]?.folding).toBeNull();
  });

  it("shows bise's question while it waits, the answer's field, then the choice he picks", () => {
    const q = feedAt(28);
    expect(q.rows.at(-1)).toMatchObject({ who: 'ask', asks: 'checkout' });
    expect(q.placeholder).toBe('answering checkout');
    expect(feedAt(53).rows.find((r) => r.choices.length > 0)).toMatchObject({ choices: ['ship it', 'review it for me'], picked: 0 });
    expect(feedAt(53.5).rows.find((r) => r.who === 'ask' && r.choices.length > 0)?.picked).toBe(2);
  });

  it('keeps the last rows, ticks each line as its crate comes in, and is empty at the fold', () => {
    for (let T = 0; T < FILM_S; T += 0.5) expect(feedAt(T).rows.length).toBeLessThanOrEqual(FEED_ROWS);
    expect(feedAt(61).rows.at(-1)).toMatchObject({ who: 'bise', ticked: true });
    expect(feedAt(PAGE.fold + 0.1).rows).toEqual([]);
  });
});

describe("the shop's page", () => {
  it('is at most 55% of the box, centred at 58% across, compact under 520 px wide', () => {
    const b = pageBox(1000, 800);
    expect(b.width).toBeLessThanOrEqual(1000 * PAGE_W_MAX + 0.01);
    expect(b.left + b.width / 2).toBeCloseTo(580, 5);
    expect(pageBox(1400, 900).size).toBe('full');
    expect(pageBox(700, 500).size).toBe('compact');
  });

  it('folds from its edge to its middle, all gone at the loop end', () => {
    expect(foldOf(PAGE.fold - 0.1, 0, 0)).toBe(0);
    const t = PAGE.fold + 0.4;
    expect(foldOf(t, 0, 0)).toBeGreaterThan(foldOf(t, 3, 2));
    expect(foldOf(FILM_S - 0.001, 3, 2)).toBeGreaterThan(0.99);
  });
});
