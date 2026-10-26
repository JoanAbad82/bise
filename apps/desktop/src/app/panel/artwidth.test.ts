// The panel sized to the artifact in front (r3-escape item 2, Gabriel m_44728, designer m_44757):
// a share of the window per kind (55%, a sheet and a web page 60%), the thread keeping 400, a sheet
// under 1176, his drag per kind within 50-70% until reset; the rows and a shell keep their width.
import { describe, expect, it } from 'vitest';
import { ART_THREAD_MIN, artFit, fitW, parseKept, shareOf, widenFor, FOLDED, THREAD_MIN, WIDTHS } from './model';

/** rail 56 + sidebar 240 */
const LEFT = 296;
const KINDS = ['page', 'doc', 'image', 'video', 'deck', 'file', 'pr', 'sheet', 'link'] as const;
const at = (kind: string, win: number, left = LEFT, shares: Record<string, number> = {}) => artFit(shareOf(kind, shares), win, left);

describe("an artifact in front: its kind's share of the window", () => {
  it('1440 with the sidebar: every kind 744, the thread at its 400 (his shot was 584)', () => {
    for (const k of KINDS) expect(at(k, 1440), k).toEqual({ width: 744, over: false });
    expect(1440 - LEFT - at('page', 1440).width).toBe(ART_THREAD_MIN);
  });

  it('1728: a page 55% (950), a sheet and a web page 60% capped where the thread keeps 400 (1032)', () => {
    for (const k of KINDS) {
      const wide = k === 'sheet' || k === 'link';
      expect(at(k, 1728), k).toEqual({ width: wide ? 1032 : 950, over: false });
      expect(1728 - LEFT - at(k, 1728).width, k).toBeGreaterThanOrEqual(ART_THREAD_MIN);
    }
  });

  it('1100 with the sidebar: a sheet over the thread, as every tab there', () => {
    for (const k of KINDS) {
      const f = at(k, 1100);
      expect(f.over, k).toBe(true);
      expect(f.width, k).toBe(Math.round(1100 * shareOf(k, {})));
    }
    expect(fitW(WIDTHS.rows, 1100, LEFT).over).toBe(true);
  });

  it('the sidebar hidden at 1440: the share alone (792), the window never grows', () => {
    expect(at('page', 1440, 56)).toEqual({ width: 792, over: false });
    for (const win of [1100, 1440, 1728, 1920]) for (const k of KINDS) expect(at(k, win, 56).width + 56).toBeLessThanOrEqual(win);
  });

  it('the thread never under 400 beside an artifact, at any width the panel stands beside it', () => {
    for (let win = 1000; win <= 2560; win += 8)
      for (const k of KINDS)
        for (const s of [0.5, 0.6, 0.7]) {
          const f = at(k, win, LEFT, { [k]: s });
          if (!f.over) expect(win - LEFT - f.width, `${k} ${String(win)} ${String(s)}`).toBeGreaterThanOrEqual(ART_THREAD_MIN);
        }
  });

  it('his drag wins for that kind only, within 50-70%', () => {
    const shares = { page: 0.62 };
    expect(shareOf('page', shares)).toBe(0.62);
    expect(shareOf('doc', shares)).toBe(0.55);
    expect(shareOf('sheet', shares)).toBe(0.6);
    expect(shareOf('page', { page: 0.9 })).toBe(0.7);
    expect(shareOf('page', { page: 0.1 })).toBe(0.5);
    expect(at('page', 1920, LEFT, shares).width).toBe(Math.round(1920 * 0.62));
  });

  it('his shares come back after a reload, in their limits', () => {
    const k = parseKept({ ...FOLDED, shares: { page: 0.65, sheet: 2, bad: 'x' } });
    expect(k.shares).toEqual({ page: 0.65, sheet: 0.7 });
    expect(parseKept(undefined).shares).toEqual({});
  });
});

describe('the other tabs keep their one width and the 560 thread', () => {
  it('rows 384 and a shell 480 at 1440, 1728; a thread or an office still widens the one width to 640', () => {
    expect(fitW(WIDTHS.rows, 1440, LEFT)).toEqual({ width: 384, over: false });
    expect(fitW(WIDTHS.shell, 1728, LEFT)).toEqual({ width: 480, over: false });
    expect(fitW(WIDTHS.page, 1440, LEFT)).toEqual({ width: 1440 - LEFT - THREAD_MIN, over: false });
    expect(widenFor(FOLDED, { kind: 'thing', e: { kind: 'agent', project: 'p', agent: 'perf' } })).toBe(WIDTHS.page);
  });

  it('an artifact opening leaves the one width as it was (it has its own)', () => {
    expect(widenFor(FOLDED, { kind: 'thing', e: { kind: 'artifact', project: 'p', id: 'a' } })).toBe(FOLDED.width);
  });
});
