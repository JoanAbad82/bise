import { describe, expect, it } from 'vitest';
import { anchorLabel, anchorWhere } from './anchor';
import { attachRow, buildMessage, chipLabel, type Chip, type Segment } from './message';
import type { Anchor } from '@/proto/anchor';
// bise_proto::anchor::label's own table (art-notes): both apps say an anchor the same way
import LABELS from '../../../../rust/proto/fixtures/anchor_label.json';

const cell: Chip = { kind: 'anchor', n: 2, artifact: 'q3-xlsx', version: 4, anchor: { kind: 'cell', sheet: 'Summary', range: 'C4:E4' }, quote: '1200 1350', file: 'q3-forecast.xlsx' };

describe("an artifact's part as an attachment (designer's composer-attachments A)", () => {
  it("names where in the artifact with bise_proto's words (the shared fixture)", () => {
    for (const row of LABELS) expect(anchorLabel(row.anchor as Anchor)).toBe(row.label);
    expect(anchorLabel({ kind: 'para', para: '3F2A', quote: 'Revenue grew  by\n12%' })).toBe('"Revenue grew by 12%"');
  });

  it("its row: '❝ 2  Summary!C4:E4  q3-forecast.xlsx · v4'", () => {
    expect(chipLabel(cell)).toBe('❝ 2');
    expect(attachRow(cell)).toEqual({ name: 'Summary!C4:E4', info: 'q3-forecast.xlsx · v4' });
    expect(anchorWhere('deck.pptx', 1)).toBe('deck.pptx · v1');
  });

  it('goes as an anchor part at its place, with its number, beside quotes of other files', () => {
    const deck: Chip = { kind: 'anchor', n: 3, artifact: 'deck', version: 2, anchor: { kind: 'slide', slide: 5 }, file: 'deck.pptx' };
    const segs: Segment[] = [{ kind: 'text', text: 'why is' }, { kind: 'chip', chip: cell }, { kind: 'text', text: 'not on' }, { kind: 'chip', chip: deck }];
    const out = buildMessage(segs);
    expect(out.text).toBe('why is ❝ 2 not on ❝ 3');
    expect(out.parts).toEqual([
      { kind: 'text', text: 'why is ' },
      { kind: 'anchor', artifact: 'q3-xlsx', version: 4, anchor: { kind: 'cell', sheet: 'Summary', range: 'C4:E4' }, quote: '1200 1350', n: 2 },
      { kind: 'text', text: ' not on ' },
      { kind: 'anchor', artifact: 'deck', version: 2, anchor: { kind: 'slide', slide: 5 }, n: 3 },
    ]);
  });
});
