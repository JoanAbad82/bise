// sideLayout at the widths of plan §2 (1000, 1100, 1280, 1440, 1728, 1920), the panel open and closed.
import { describe, expect, it } from 'vitest';
import type { Route } from '../route';
import { BUBBLE_BAND, CARD_MAX, CARD_ROOM, cardMaxH, COL_W, MIN_LEFT, sideLayout, sideShows, WORLD_BAND } from './layout';

/** rail 56 + sidebar 240 */
const SIDE = 296;

/** what the right side leaves between the column and the window's edge */
const right = (winW: number, l: { colLeft: number; colW: number }) => winW - l.colLeft - l.colW;

describe('sideLayout, the panel folded', () => {
  it('1920 and 1728: the column centred in what the sidebar leaves, the world small', () => {
    for (const w of [1920, 1728]) {
      const l = sideLayout(w, SIDE, false);
      expect(l).toMatchObject({ colW: COL_W, world: 'small', gutter: WORLD_BAND, side: true });
      expect(l.colLeft - SIDE).toBe(right(w, l));
    }
  });
  it('1440: still centred (212 each side, more than the world band)', () => {
    const l = sideLayout(1440, SIDE, false);
    expect(l).toMatchObject({ colLeft: SIDE + 212, colW: COL_W, world: 'small' });
    expect(right(1440, l)).toBe(212);
  });
  it('1280: centring would leave 132 on the right, so the column slides left and keeps the band', () => {
    const l = sideLayout(1280, SIDE, false);
    expect(l).toMatchObject({ colW: COL_W, world: 'small', gutter: WORLD_BAND });
    expect(right(1280, l)).toBe(WORLD_BAND);
    expect(l.colLeft - SIDE).toBe(92);
  });
  it('1100: the world folds into a 5th bubble, then the column narrows, 24 from the sidebar', () => {
    const l = sideLayout(1100, SIDE, false);
    expect(l).toMatchObject({ colLeft: SIDE + MIN_LEFT, world: 'bubble', gutter: BUBBLE_BAND, side: true });
    expect(l.colW).toBe(1100 - SIDE - MIN_LEFT - BUBBLE_BAND);
    expect(right(1100, l)).toBe(BUBBLE_BAND);
  });
  it('1100 with the sidebar hidden (the rail alone): the world fits again', () => {
    const l = sideLayout(1100, 56, false);
    expect(l).toMatchObject({ colW: COL_W, world: 'small' });
    expect(right(1100, l)).toBeGreaterThanOrEqual(WORLD_BAND);
  });
  it('1000: the column narrows, never under the bubbles', () => {
    const l = sideLayout(1000, SIDE, false);
    expect(l.world).toBe('bubble');
    expect(right(1000, l)).toBe(BUBBLE_BAND);
    expect(l.colLeft).toBe(SIDE + MIN_LEFT);
  });
  it('the world as a bubble while the column still fits whole: slid left by the small band', () => {
    // room 900: 720 + 172 + 24 = 916 does not fit, 720 + 92 + 24 = 836 does
    const l = sideLayout(900 + SIDE, SIDE, false);
    expect(l).toMatchObject({ colW: COL_W, world: 'bubble' });
    expect(right(900 + SIDE, l)).toBe(BUBBLE_BAND);
  });
  it('never a negative width', () => {
    expect(sideLayout(200, SIDE, false).colW).toBe(0);
  });
});

describe('sideLayout, the panel open', () => {
  it('the right side hides, the column centred between the sidebar and the panel', () => {
    for (const w of [1000, 1100, 1280, 1440, 1728, 1920]) {
      const l = sideLayout(w, SIDE, true, 384);
      expect(l).toMatchObject({ side: false, gutter: 0 });
      expect(l.colW).toBeLessThanOrEqual(COL_W);
      expect(l.colLeft - SIDE).toBeCloseTo(w - 384 - l.colLeft - l.colW);
    }
  });
  it('1440 with a 384 panel: 760 of room, the column 712 with 24 each side', () => {
    expect(sideLayout(1440, SIDE, true, 384)).toMatchObject({ colLeft: SIDE + MIN_LEFT, colW: 712 });
  });
  it('1920 with a 640 panel: 720, centred', () => {
    expect(sideLayout(1920, SIDE, true, 640)).toMatchObject({ colW: COL_W, colLeft: SIDE + (1920 - SIDE - 640 - COL_W) / 2 });
  });
});

describe('a card: its top on its bubble, at most the room under it less 16 (designer m_44499)', () => {
  // the side starts under the 52 bar; the agents bubble at 152, the processes one at 392
  const BAR = 52;
  it('560 at most; else what is left under its bubble less 16; never below 0', () => {
    expect(cardMaxH(BAR, 152, 900)).toBe(CARD_MAX);
    expect(cardMaxH(BAR, 392, 900)).toBe(900 - CARD_ROOM - BAR - 392);
    expect(cardMaxH(BAR, 392, 400)).toBe(0);
  });
  it('a card never runs past the window: its bottom at the cap is 16 above the window\'s bottom at the lowest', () => {
    for (const winH of [500, 640, 900, 1200])
      for (const bubble of [152, 232, 312, 392]) expect(BAR + bubble + cardMaxH(BAR, bubble, winH)).toBeLessThanOrEqual(winH - CARD_ROOM);
  });
});

describe('the folded side shows inside a project only (designer m_44292)', () => {
  const P = 'acme-1a2b3c4d';
  // every screen of route.ts, once (a new screen breaks sideShows' switch at typecheck)
  const table: readonly (readonly [Route, boolean])[] = [
    [{ screen: 'bise' }, true],
    [{ screen: 'thread', project: P, agent: 'main' }, true],
    [{ screen: 'thread', project: P, agent: 'perf' }, true],
    [{ screen: 'agents', project: P }, true],
    [{ screen: 'agents', project: P, archived: true }, true],
    [{ screen: 'changes', project: P }, true],
    [{ screen: 'prs', project: P }, true],
    [{ screen: 'review', project: P, agent: 'perf' }, true],
    [{ screen: 'feature', project: P, name: 'native-mac' }, true],
    [{ screen: 'commit', project: P, sha: 'abc' }, true],
    [{ screen: 'branch', project: P, branch: 'sb/x' }, true],
    [{ screen: 'environments', project: P }, true],
    [{ screen: 'debug', project: P, agent: 'perf' }, true],
    [{ screen: 'artifacts', project: P }, false],
    [{ screen: 'artifacts', project: P, id: 'a1' }, false],
    [{ screen: 'artifacts', project: P, at: 'recent' }, false],
    [{ screen: 'scheduled' }, false],
    [{ screen: 'running' }, false],
    [{ screen: 'running', scope: { project: P } }, false],
    [{ screen: 'plugins' }, false],
    [{ screen: 'plugins', kind: 'skills' }, false],
    [{ screen: 'inbox' }, false],
    [{ screen: 'report' }, false],
    [{ screen: 'settings' }, false],
    [{ screen: 'onboarding' }, false],
    [{ screen: 'lab', lab: 'composer' }, false],
    [{ screen: 'notfound', path: 'x' }, false],
  ];
  it.each(table)('%j: %s', (r, shows) => {
    expect(sideShows(r)).toBe(shows);
  });
  it('no side: no band, the column centred in the whole room (the banners and columns take the freed width)', () => {
    for (const w of [1000, 1100, 1280, 1440, 1728, 1920]) {
      const l = sideLayout(w, SIDE, false, undefined, false);
      expect(l).toMatchObject({ side: false, gutter: 0 });
      expect(l.colLeft - SIDE).toBeCloseTo(right(w, l));
    }
  });
});
