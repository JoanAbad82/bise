// floatFit and floatTall (fit.ts), pure: what gives way first in the floating composer (designer m_45666).
import { describe, expect, it } from 'vitest';
import { floatFit, floatTall, type FloatSizes } from './fit';

// a 720 window: the float's max 504, its field's cap 252, 22 px lines, 28 px attachment rows
const base: FloatSizes = { maxH: 504, rest: 100, words: 400, line: 22, cap: 252, rows: 0, rowH: 28, listChrome: 13, question: 0, others: 0 };

describe('floatFit', () => {
  it('room to spare: the field keeps its own cap', () => {
    expect(floatFit(base)).toEqual({ fieldMax: 252, cutAttach: false, foldOthers: false });
  });

  it('an open question takes room: the field gives way first, to the room left', () => {
    expect(floatFit({ ...base, rest: 300 })).toEqual({ fieldMax: 204, cutAttach: false, foldOthers: false });
  });

  it('never under 4 lines: past that the question gives way (it scrolls)', () => {
    expect(floatFit({ ...base, rest: 450 })).toEqual({ fieldMax: 88, cutAttach: false, foldOthers: false });
  });

  it('4 lines no longer fit with 4 attachments: the list is cut to 2 rows and its more row', () => {
    // the whole list 4 × 28 + 13 = 125: 504 - 330 - 125 = 49 < 88; cut, 3 × 28 + 13 = 97 (the field scrolls at 4 lines)
    expect(floatFit({ ...base, rest: 330, rows: 4 })).toEqual({ fieldMax: 88, cutAttach: true, foldOthers: false });
  });

  it('2 attachments are never cut (nothing to fold under a more row)', () => {
    expect(floatFit({ ...base, rest: 400, rows: 2 }).cutAttach).toBe(false);
  });

  it('short words keep their height: nothing is cut for them', () => {
    expect(floatFit({ ...base, rest: 330, rows: 4, words: 44 })).toEqual({ fieldMax: 88, cutAttach: false, foldOthers: false });
  });
});

describe('floatFit: past the question', () => {
  // 4 lines short by 54 px: 504 - 470 = 34 left for 88
  const tight = { ...base, rest: 470, others: 84 };

  it("the question's text gives way first: it scrolls, the other lines stay", () => {
    expect(floatFit({ ...tight, question: 60 }).foldOthers).toBe(false);
  });

  it("a question too short to give that room: the inbox's other lines fold", () => {
    expect(floatFit({ ...tight, question: 40 }).foldOthers).toBe(true);
  });

  it('no other lines: nothing to fold', () => {
    expect(floatFit({ ...tight, question: 0, others: 0 }).foldOthers).toBe(false);
  });
});

describe('floatTall', () => {
  it('a second line or an attachment lays it out as the docked box', () => {
    expect(floatTall(false, { lines: 2, attached: false, empty: false })).toBe(true);
    expect(floatTall(false, { lines: 1, attached: true, empty: false })).toBe(true);
  });

  it('one line fitting the wider field keeps it tall until the draft is empty', () => {
    expect(floatTall(true, { lines: 1, attached: false, empty: false })).toBe(true);
    expect(floatTall(true, { lines: 1, attached: false, empty: true })).toBe(false);
    expect(floatTall(false, { lines: 1, attached: false, empty: false })).toBe(false);
  });
});
