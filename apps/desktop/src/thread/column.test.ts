// The reading column in the screen (QA §4): where the window's sideLayout puts the column, as the
// screen's own text box (672 of 720, 24 in), or the CSS's centred column where the layout doesn't
// describe this screen (a panel's tab).
import { describe, expect, it } from 'vitest';
import { sideLayout } from '@/app/side3d/layout';
import { columnPlace, columnStyle } from './column';
import { editCounts } from './entry';

/** rail 56 + sidebar 240: the screen starts where the left ends */
const LEFT = 296;

describe('the column from the sideLayout', () => {
  it('1920, panel folded: 720 centred in the room the world leaves, its text 672, 24 in', () => {
    const lay = sideLayout(1920, LEFT, false);
    const p = columnPlace(lay, LEFT, 1920 - LEFT);
    expect(p).toEqual({ x: Math.round(lay.colLeft - LEFT + 24), w: 672 });
    // centred in the screen (the world's band fits either side at 1920)
    expect(p?.x).toBe(Math.round((1920 - LEFT - 720) / 2 + 24));
  });

  it('1440: the column slides left of the bims\' world, never under it', () => {
    const lay = sideLayout(1440, LEFT, false);
    const p = columnPlace(lay, LEFT, 1440 - LEFT);
    expect(p).not.toBeNull();
    if (p === null) return;
    // its text ends 24 before the column's end, and the column ends before the world's band
    expect(LEFT + p.x + p.w + 24).toBeLessThanOrEqual(1440 - lay.gutter);
    expect(p.x).toBeGreaterThanOrEqual(24 + 24);
  });

  it('the panel open: centred in what is left, whatever the panel\'s width', () => {
    const lay = sideLayout(1920, LEFT, true, 384);
    const p = columnPlace(lay, LEFT, 1920 - LEFT - 384);
    expect(p).toEqual({ x: Math.round((1920 - LEFT - 384 - 720) / 2 + 24), w: 672 });
    // short of room (1440): the column narrows to keep 24 each side
    const narrow = sideLayout(1440, LEFT, true, 384);
    expect(columnPlace(narrow, LEFT, 1440 - LEFT - 384)).toEqual({ x: 48, w: 1440 - LEFT - 384 - 48 - 48 });
  });

  it("a thread the layout doesn't describe (in the panel's tab, at the window's right): the CSS's centred column", () => {
    const lay = sideLayout(1440, LEFT, true, 384);
    expect(columnPlace(lay, 1440 - 384, 384)).toBeNull();
    expect(columnStyle(null)).toBeUndefined();
  });

  it('its CSS variables are the text box, in px', () => {
    expect(columnStyle({ x: 48, w: 672 })).toEqual({ '--th-col': '672px', '--th-col-x': '48px' });
  });
});

describe("a tools row's edits (QA §4: 'edited 3 files +42 −18')", () => {
  it("sums the hub's line counts of its edits only; none when no edit counted a line", () => {
    const files = (add: number, del: number) => [{ path: 'a.ts', add, del }];
    expect(editCounts([{ kind: 'edit', files: files(40, 10) }, { kind: 'run' }, { kind: 'edit', files: [...files(2, 8), { path: 'b.ts', add: 0, del: 0 }] }])).toEqual({ add: 42, del: 18 });
    expect(editCounts([{ kind: 'run', files: files(3, 3) }, { kind: 'read' }])).toBeNull();
    expect(editCounts([{ kind: 'edit', files: [] }])).toBeNull();
  });
});
