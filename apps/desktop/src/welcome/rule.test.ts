// When the welcome shows (architect m_38075): derived from main's thread as the window holds it.
import { describe, expect, it } from 'vitest';
import { EMPTY_ORDER, type ThreadOrder } from '@/store/types';
import { introShows, welcomeShows } from './rule';
import { moveOf } from './dock';
import { officeRoom } from './room';

const view = (o: Partial<ThreadOrder>): ThreadOrder => ({ ...EMPTY_ORDER, loaded: true, ...o });

describe('welcomeShows', () => {
  it('an empty thread at its start: yes', () => {
    expect(welcomeShows(view({}), false, 0, 0)).toBe(true);
  });

  it("main's own lines only, the start reached: yes", () => {
    expect(welcomeShows(view({ order: [1, 2] }), false, 0, 0)).toBe(true);
  });

  it('not loaded yet: no (never a flash before the first page)', () => {
    expect(welcomeShows(EMPTY_ORDER, false, 0, 0)).toBe(false);
  });

  it('his message, from the terminal too (an entry of his in the thread): no', () => {
    expect(welcomeShows(view({ order: [1] }), true, 0, 0)).toBe(false);
  });

  it('his first send leaving the composer: gone at once, before the hub echoes it', () => {
    expect(welcomeShows(view({}), false, 1, 0)).toBe(false);
  });

  it('a long thread with no entry of his in its first page: no (an older page is there)', () => {
    expect(welcomeShows(view({ order: [40, 41], before: 40, more: true }), false, 0, 0)).toBe(false);
  });

  it('a window around a far entry: no', () => {
    expect(welcomeShows(view({ order: [1], gap: { lo: 1, hi: 9, from: 2 } }), false, 0, 0)).toBe(false);
  });

  it('a live agent besides main, with main\'s thread empty: no (designer m_38701)', () => {
    expect(welcomeShows(view({}), false, 0, 1)).toBe(false);
    expect(welcomeShows(view({ order: [1, 2] }), false, 0, 2)).toBe(false);
  });
});

describe('introShows: the lead\'s intro as the first row once he wrote', () => {
  it('his message in a thread whose start is here: yes; his send on its way: yes', () => {
    expect(introShows(view({ order: [1] }), true, 0)).toBe(true);
    expect(introShows(view({}), false, 1)).toBe(true);
  });

  it('nothing of his yet (the welcome shows), or the start not in the window: no', () => {
    expect(introShows(view({}), false, 0)).toBe(false);
    expect(introShows(view({ order: [40], before: 40, more: true }), true, 0)).toBe(false);
    expect(introShows(view({ order: [1], gap: { lo: 1, hi: 9, from: 2 } }), true, 0)).toBe(false);
  });
});

describe('officeRoom: the office gives way first (designer m_38760)', () => {
  it("its height is the slot's room after the words and the gap", () => {
    expect(officeRoom(700, 330, 12)).toBe(358);
  });

  it('under 120 px it hides; at 120 it shows', () => {
    expect(officeRoom(461, 330, 12)).toBeNull();
    expect(officeRoom(461.5, 330, 12)).toBeNull();
    expect(officeRoom(462, 330, 12)).toBe(120);
    expect(officeRoom(300, 330, 12)).toBeNull();
  });
});

describe('the dock', () => {
  const from = { left: 300, top: 100, width: 440, height: 300 };
  const to = { left: 1080, top: 60, width: 320, height: 218 };

  it('flies the office onto the bar office, scaled to its width', () => {
    expect(moveOf(from, to, false)).toBe('translate(780.0px, -40.0px) scale(0.7273)');
  });

  it('a crossfade under reduced motion, or with no bar on screen', () => {
    expect(moveOf(from, to, true)).toBeNull();
    expect(moveOf(from, null, false)).toBeNull();
  });
});
