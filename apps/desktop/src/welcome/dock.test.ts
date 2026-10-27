// @vitest-environment happy-dom
// Where the welcome's office docks at his first send: the outer card's tile (app.outer.world), its
// box on screen; none shown (hidden by him, a panel open, a narrow window): a crossfade.
import { afterEach, describe, expect, it } from 'vitest';
import { tileTarget } from './dock';

const put = (testId: string, box: { left: number; top: number; width: number; height: number }) => {
  const el = document.createElement('section');
  el.setAttribute('data-testid', testId);
  el.getBoundingClientRect = () => ({ ...box, right: box.left + box.width, bottom: box.top + box.height, x: box.left, y: box.top, toJSON: () => box }) as DOMRect;
  document.body.append(el);
  return el;
};

afterEach(() => {
  document.body.replaceChildren();
});

describe('tileTarget', () => {
  it("the outer card's tile, its box as it is on screen", () => {
    put('app.outer.world', { left: 1136, top: 64, width: 292, height: 140 });
    expect(tileTarget(document)).toEqual({ left: 1136, top: 64, width: 292, height: 140 });
  });

  it('no tile (hidden, a panel open): null, the crossfade', () => {
    expect(tileTarget(document)).toBeNull();
  });

  it('a tile with no box (not laid out): null', () => {
    put('app.outer.world', { left: 0, top: 0, width: 0, height: 0 });
    expect(tileTarget(document)).toBeNull();
  });
});
