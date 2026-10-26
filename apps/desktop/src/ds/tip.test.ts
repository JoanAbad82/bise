// src/ds · the hover tip's rules (tip.ts): where it goes, when it shows, its attributes.
import { describe, expect, it } from 'vitest';
import { placeTip, tipAttrs, tipWait, TIP_DELAY_MS } from './tip';

const VIEW = { width: 1400, height: 900 };

describe('the hover tip (designer m_24359)', () => {
  it('goes 8 px above its mark, centred on it', () => {
    expect(placeTip({ left: 100, top: 300, width: 20, height: 16 }, { width: 120, height: 24 }, VIEW)).toEqual({ left: 50, top: 268, side: 'above' });
  });

  it('goes 8 px below when there is no room above', () => {
    expect(placeTip({ left: 100, top: 20, width: 20, height: 16 }, { width: 120, height: 24 }, VIEW)).toEqual({ left: 50, top: 44, side: 'below' });
  });

  it('stays 8 px inside the window on both sides', () => {
    expect(placeTip({ left: 2, top: 300, width: 10, height: 16 }, { width: 200, height: 24 }, VIEW).left).toBe(8);
    expect(placeTip({ left: 1390, top: 300, width: 10, height: 16 }, { width: 200, height: 24 }, VIEW).left).toBe(1192);
  });

  it('never covers its mark: no room either side, it takes the bigger one', () => {
    const at = placeTip({ left: 100, top: 30, width: 20, height: 16 }, { width: 120, height: 80 }, { width: 400, height: 120 });
    expect(at.side).toBe('below');
    expect(at.top).toBe(54);
  });

  it('a mark that asks for below gets it, above when below has no room (designer m_45938)', () => {
    expect(placeTip({ left: 100, top: 300, width: 20, height: 16 }, { width: 120, height: 24 }, VIEW, 'below')).toEqual({ left: 50, top: 324, side: 'below' });
    expect(placeTip({ left: 100, top: 870, width: 20, height: 16 }, { width: 120, height: 24 }, VIEW, 'below')).toEqual({ left: 50, top: 838, side: 'above' });
  });

  it('waits 400 ms cold, shows at once warm or on keyboard focus', () => {
    expect(tipWait(1000, 0, false)).toBe(TIP_DELAY_MS);
    expect(tipWait(1000, 1500, false)).toBe(0);
    expect(tipWait(1000, 0, true)).toBe(0);
  });

  it("its words and key go in data attributes; none for no words", () => {
    expect(tipAttrs('4 agents working')).toEqual({ 'data-tip': '4 agents working' });
    expect(tipAttrs('sidebar', '⌘\\')).toEqual({ 'data-tip': 'sidebar', 'data-tip-keys': '⌘\\' });
    expect(tipAttrs('the full option', undefined, 'below')).toEqual({ 'data-tip': 'the full option', 'data-tip-side': 'below' });
    expect(tipAttrs('')).toEqual({});
    expect(tipAttrs(undefined)).toEqual({});
  });
});
