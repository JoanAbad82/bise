// When the welcome shows (architect m_38075): derived from main's thread as the window holds it.
import { describe, expect, it } from 'vitest';
import { EMPTY_ORDER, type ThreadOrder } from '@/store/types';
import { welcomeShows } from './rule';
import { moveOf } from './dock';

const view = (o: Partial<ThreadOrder>): ThreadOrder => ({ ...EMPTY_ORDER, loaded: true, ...o });

describe('welcomeShows', () => {
  it('an empty thread at its start: yes', () => {
    expect(welcomeShows(view({}), false, 0)).toBe(true);
  });

  it("main's own lines only, the start reached: yes", () => {
    expect(welcomeShows(view({ order: [1, 2] }), false, 0)).toBe(true);
  });

  it('not loaded yet: no (never a flash before the first page)', () => {
    expect(welcomeShows(EMPTY_ORDER, false, 0)).toBe(false);
  });

  it('his message, from the terminal too (an entry of his in the thread): no', () => {
    expect(welcomeShows(view({ order: [1] }), true, 0)).toBe(false);
  });

  it('his first send leaving the composer: gone at once, before the hub echoes it', () => {
    expect(welcomeShows(view({}), false, 1)).toBe(false);
  });

  it('a long thread with no entry of his in its first page: no (an older page is there)', () => {
    expect(welcomeShows(view({ order: [40, 41], before: 40, more: true }), false, 0)).toBe(false);
  });

  it('a window around a far entry: no', () => {
    expect(welcomeShows(view({ order: [1], gap: { lo: 1, hi: 9, from: 2 } }), false, 0)).toBe(false);
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
