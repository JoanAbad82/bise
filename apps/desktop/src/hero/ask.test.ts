// checkout's question shows in a comic bubble over its head from its feed line until his answer is
// in its hands, and the bubble never sits on the bim's face or its '?' pill.
import { describe, expect, it } from 'vitest';
import { FEED, FILM_S } from './cast';
import { ASK_GAP, ASK_INSET, ASK_OUT_S, askAt, askBox, heardAt } from './ask';

const meets = (a: { left: number; top: number; w: number; h: number }, b: { left: number; top: number; w: number; h: number }): boolean =>
  a.left < b.left + b.w && b.left < a.left + a.w && a.top < b.top + b.h && b.top < a.top + a.h;

describe('the ask bubble', () => {
  it('holds checkout’s question from its feed line until his answer’s plane is caught (0:32.8), then pops out', () => {
    const l = FEED.find((x) => x.who === 'ask' && x.words === 'ship worldwide or EU only?');
    if (l === undefined || l.who !== 'ask') throw new Error('no ask line');
    expect(heardAt(l)).toBeCloseTo(32.8, 5);
    expect(askAt(l.at - 0.01)).toBeNull();
    expect(askAt(l.at)).toMatchObject({ bim: 'checkout', words: 'ship worldwide or EU only?' });
    expect(askAt(l.at)?.scale).toBeCloseTo(0, 5);
    expect(askAt(30)?.scale).toBe(1);
    expect(askAt(32.79)?.scale).toBe(1);
    expect(askAt(32.8 + ASK_OUT_S / 2)?.scale).toBeCloseTo(0.5, 5);
    expect(askAt(32.8 + ASK_OUT_S)).toBeNull();
  });

  it('shows none at the loop’s seam, and one question at a time', () => {
    expect(askAt(0)).toBeNull();
    expect(askAt(FILM_S - 0.01)).toBeNull();
    for (let T = 0; T < FILM_S; T += 0.05) {
      const a = askAt(T);
      if (a !== null) expect(a.scale).toBeGreaterThanOrEqual(0);
    }
  });

  it('sits over the pill, centred on the head, its tail on the bim', () => {
    const head = { x: 200, y: 120 };
    const pill = { left: 192, top: 98, w: 16, h: 20 };
    const b = askBox(head, pill, 170, 30, 600, 400);
    expect(b.side).toBe('over');
    expect(b.top + 30 + ASK_GAP).toBeLessThanOrEqual(pill.top);
    expect(b.left + b.tail).toBeCloseTo(head.x, 5);
  });

  it('stays inside the frame near an edge, its tail still to the bim', () => {
    const b = askBox({ x: 20, y: 120 }, { left: 12, top: 98, w: 16, h: 20 }, 170, 30, 320, 400);
    expect(b.left).toBe(ASK_INSET);
    expect(b.tail).toBeGreaterThan(0);
    expect(b.tail).toBeLessThan(30);
  });

  it('with no room over the pill, goes beside it: never on the pill nor under the head’s top (the face)', () => {
    // near either side of a phone's frame, and the middle of a desktop's
    for (const [x, boxW] of [[40, 320], [280, 320], [400, 900]] as const) {
      const head = { x, y: 40 };
      const pill = { left: x - 8, top: 18, w: 16, h: 20 };
      const b = askBox(head, pill, 170, 30, boxW, 400);
      expect(b.side).not.toBe('over');
      const r = { left: b.left, top: b.top, w: 170, h: 30 };
      expect(meets(r, pill)).toBe(false);
      expect(b.top + 30).toBeLessThanOrEqual(head.y);
      expect(b.left).toBeGreaterThanOrEqual(ASK_INSET);
      expect(b.left + 170).toBeLessThanOrEqual(boxW - ASK_INSET);
    }
  });
});
