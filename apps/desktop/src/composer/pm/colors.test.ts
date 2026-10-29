// @vitest-environment happy-dom
// The TipTap field's live colors (B9/W8) are decorations: the right runs styled, a chip left out of
// a run, and the document (so the send and the draft) never touched.
import { describe, expect, it } from 'vitest';
import { getSchema } from '@tiptap/core';
import { FIELD_NODES } from './schema';
import { colorDecorations } from './colors';
import { docOf, plainText } from './pmtext';
import { COLOR_STYLE } from '../mdcolor';

const schema = getSchema(FIELD_NODES);

/** Each decoration as [its text, its style]. */
function styled(text: string, chipAt?: number): [string, string][] {
  const segs =
    chipAt === undefined
      ? [{ kind: 'text' as const, text }]
      : [
          { kind: 'text' as const, text: text.slice(0, chipAt) },
          { kind: 'chip' as const, chip: { kind: 'paste' as const, n: 1, text: 'x' } },
          { kind: 'text' as const, text: text.slice(chipAt) },
        ];
  const doc = docOf(schema, segs);
  const plain = plainText(doc);
  return colorDecorations(doc)
    .find()
    .map((d) => [plain.slice(d.from - 1, d.to - 1), (d as unknown as { type: { attrs: { style: string } } }).type.attrs.style]);
}

describe('pm/colors: live markdown as decorations', () => {
  it('a ``` block: fences dim, a keyword colored, plain words left alone; prose markers colored', () => {
    const got = styled('- a\n```rust\nfn main() {}\n```');
    expect(got).toContainEqual(['- ', COLOR_STYLE.mark]);
    expect(got).toContainEqual(['```rust', COLOR_STYLE.fence]);
    expect(got).toContainEqual(['fn', 'color: var(--md-syn-keyword); font-weight: 700']);
    expect(got).toContainEqual(['main', 'color: var(--md-syn-call)']);
    expect(got.some(([t]) => t === ' ')).toBe(false);
  });

  it('a chip inside a colored run is cut out of it', () => {
    const got = styled('# title here', 4);
    expect(got.every(([t]) => !t.includes('\uFFFC'))).toBe(true);
    expect(got.map(([t]) => t).join('')).toBe('# title here');
  });
});
