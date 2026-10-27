// The bims' tile over the outer card (page outer-world v2, his pick #799): its height's bounds, its
// kept state, and the give-way inside the card, as laws on pure functions.
import { afterEach, describe, expect, it } from 'vitest';
import { keep } from '../keep';
import { AGENT_ROW_H, CARD_PAD, clampTile, EMPTY_H, HEAD_H, outerFold, outerWorld, ROW_H, SEC_GAP, TILE_H, TILE_MIN, tileMax } from './tilestate';

afterEach(() => {
  outerWorld.hide(false);
  outerWorld.height(TILE_H, 900);
});

describe('the tile\'s height (outer-world v2: 96 to half the window, 140 by default)', () => {
  it('half the window at most, 96 at least, whatever the window', () => {
    expect(tileMax(900)).toBe(450);
    expect(tileMax(901)).toBe(450);
    expect(tileMax(120)).toBe(TILE_MIN);
    for (const winH of [300, 640, 900, 1440]) {
      for (const h of [-50, 0, 95, 96, 140, 300, 2000]) {
        const c = clampTile(h, winH);
        expect(c).toBeGreaterThanOrEqual(TILE_MIN);
        expect(c).toBeLessThanOrEqual(tileMax(winH));
        if (h >= TILE_MIN && h <= tileMax(winH)) expect(c).toBe(h);
      }
    }
  });

  it('a kept value that is no number reads as 140', () => {
    for (const v of [undefined, null, 'big', Number.NaN, {}]) expect(clampTile(v, 900)).toBe(TILE_H);
  });

  it('his height and his × are kept (keep.ts, per window) and read back after a restart', () => {
    outerWorld.height(236, 900);
    outerWorld.hide(true);
    expect(keep.view('outer.world.h')).toBe(236);
    expect(keep.view('outer.world.hidden')).toBe(true);
    outerWorld.reset();
    expect(outerWorld.get()).toEqual({ hidden: true, h: 236 });
    // back to the default: nothing kept
    outerWorld.height(TILE_H, 900);
    outerWorld.hide(false);
    expect(keep.view('outer.world.h')).toBeUndefined();
    expect(keep.view('outer.world.hidden')).toBeUndefined();
  });

  it('a drag past the bounds keeps the bound', () => {
    outerWorld.height(10, 900);
    expect(outerWorld.get().h).toBe(TILE_MIN);
    outerWorld.height(800, 900);
    expect(outerWorld.get().h).toBe(450);
  });
});

describe('the give-way inside the card (outer-world v2)', () => {
  const needs = { agentLines: 15, sections: [2, 2, 2] };
  const full = CARD_PAD + HEAD_H + 15 * AGENT_ROW_H + 3 * (SEC_GAP + HEAD_H) + 6 * ROW_H;

  it('room for all: every section keeps its 2 rows, nothing scrolls', () => {
    expect(outerFold(full, needs)).toEqual({ fold: 2, scrolls: false });
  });

  it('less room: the other sections fold to one row before anything else; then to their head; past that the agents scroll', () => {
    expect(outerFold(full - 1, needs)).toEqual({ fold: 1, scrolls: false });
    expect(outerFold(full - 3 * ROW_H, needs)).toEqual({ fold: 1, scrolls: false });
    expect(outerFold(full - 3 * ROW_H - 1, needs)).toEqual({ fold: 0, scrolls: false });
    expect(outerFold(full - 6 * ROW_H, needs)).toEqual({ fold: 0, scrolls: false });
    expect(outerFold(full - 6 * ROW_H - 1, needs)).toEqual({ fold: 0, scrolls: true });
  });

  it('the fold never grows as the room shrinks (a monotone give-way)', () => {
    let last = 2;
    for (let room = full + 50; room > 100; room -= 7) {
      const f = outerFold(room, needs).fold;
      expect(f).toBeLessThanOrEqual(last);
      last = f;
    }
  });

  it('an empty section takes its empty line until the heads alone', () => {
    const empty = { agentLines: 3, sections: [0, 1, 0] };
    const room = CARD_PAD + HEAD_H + 3 * AGENT_ROW_H + 3 * (SEC_GAP + HEAD_H) + 2 * EMPTY_H + ROW_H;
    expect(outerFold(room, empty).fold).toBe(2);
    expect(outerFold(room - 1, empty).fold).toBe(0);
  });
});
