// The outer card at the window's right resizes by its left border (his m_48003, designer m_48013):
// 292 by default, 260 at least, 480 at most and never more than leaves the thread its column; the
// width he left is kept across a reload; a double-click goes back to 292; a narrow window draws it
// smaller, then gives way to the coins. His gestures in; the card's place and width out.
import { describe, expect, it } from 'vitest';
import { dragOuter, resetOuter, windowAt } from './inputs';
import { feature } from './run';

describe("the outer card's width by its left border", () => {
  it('starts at 292, a drag widens and narrows it live', () => {
    const w = feature().does(windowAt(1920));
    expect(w.view.outerCard()).toEqual({ coins: 'card', width: 292 });
    w.does(dragOuter(400));
    expect(w.view.outerCard().width).toBe(400);
    w.does(dragOuter(270));
    expect(w.view.outerCard().width).toBe(270);
  });

  it('clamps at 260 and at 480, however far he drags', () => {
    const w = feature().does(windowAt(2560), dragOuter(120));
    expect(w.view.outerCard().width).toBe(260);
    w.does(dragOuter(1400));
    expect(w.view.outerCard().width).toBe(480);
  });

  it("never squeezes the thread under its column: at 1300 the most is what leaves it 480 + 2×24", () => {
    // 1300 less the rail and the 240 sidebar (296): 1004, less the card's two 12 and the column's 528: 452
    const w = feature().does(windowAt(1300), dragOuter(480));
    expect(w.view.outerCard()).toEqual({ coins: 'card', width: 452 });
    // at 1440 the whole 480 fits
    expect(feature().does(windowAt(1440), dragOuter(480)).view.outerCard().width).toBe(480);
  });

  it('keeps his width across a reload; a double-click brings 292 back, kept too', () => {
    const w = feature().does(windowAt(1920), dragOuter(420)).reload();
    expect(w.view.outerCard().width).toBe(420);
    w.does(resetOuter()).reload();
    expect(w.view.outerCard().width).toBe(292);
  });

  it('a narrower window draws it smaller down to 260, then the coins come back; wider again, his width', () => {
    const w = feature().does(windowAt(1920), dragOuter(480));
    w.does(windowAt(1188));
    expect(w.view.outerCard()).toEqual({ coins: 'card', width: 340 });
    // 1108: 812 room - 24 - 528 = 260, the least; one px less and the card goes
    w.does(windowAt(1108));
    expect(w.view.outerCard()).toEqual({ coins: 'card', width: 260 });
    w.does(windowAt(1107));
    expect(w.view.outerCard()).toEqual({ coins: 'edge', width: null });
    w.does(windowAt(1920));
    expect(w.view.outerCard().width).toBe(480);
  });
});
