// @vitest-environment happy-dom
// The bridge (pmtext.ts) on its own: plain text and offsets with chips, newlines and the dictation,
// accents and emoji (UTF-16 surrogates) kept as the pure modules count them; segments both ways.
import { describe, expect, it } from 'vitest';
import { getSchema } from '@tiptap/core';
import { EditorState, TextSelection } from '@tiptap/pm/state';
import type { Node as PmNode } from '@tiptap/pm/model';
import { FIELD_NODES } from './schema';
import { applyOp, beforeCaret, caretOnFirstLine, chipsOf, dictationAt, docOf, insertChip, insertText, isBlank, nodeType, OBJ, plainText, segmentsOf, selectRange } from './pmtext';
import type { Chip, Segment } from '../message';

const schema = getSchema(FIELD_NODES);
const paste: Chip = { kind: 'paste', n: 1, text: 'a\nb' };
const img: Chip = { kind: 'image', n: 2, path: '/tmp/x.png', name: 'x.png' };

/** A doc from inline parts: a string is text with '\n' as breaks, an object a chip, 'DICT' the dictation. */
function doc(...parts: (string | Chip | { dict: string })[]): PmNode {
  const kids: PmNode[] = [];
  for (const p of parts) {
    if (typeof p === 'string') {
      p.split('\n').forEach((l, i) => {
        if (i > 0) kids.push(nodeType(schema, 'hardBreak').create());
        if (l !== '') kids.push(schema.text(l));
      });
    } else if ('dict' in p) kids.push(nodeType(schema, 'dictation').create({ text: p.dict }));
    else kids.push(nodeType(schema, 'chip').create({ chip: p }));
  }
  return nodeType(schema, 'doc').create(null, nodeType(schema, 'paragraph').create(null, kids));
}

const at = (d: PmNode, offset: number): EditorState => {
  const s = EditorState.create({ doc: d });
  return s.apply(s.tr.setSelection(TextSelection.create(d, offset + 1)));
};

describe('pmtext: the one bridge', () => {
  it('plain text: a newline is \\n, a chip and the dictation one U+FFFC; offsets are UTF-16 like the old engine', () => {
    const d = doc('é😀 a', paste, '\nb', { dict: 'on garde' }, 'c');
    expect(plainText(d)).toBe(`é😀 a${OBJ}\nb${OBJ}c`);
    // 😀 is two UTF-16 units, as in Lexical's offsets: the caret after 'é😀' is offset 3
    expect(beforeCaret(at(d, 3))).toEqual({ text: 'é😀', messageStart: true });
    // after the chip and the newline, a line starts: not the message's start
    expect(beforeCaret(at(d, 8))).toEqual({ text: 'b', messageStart: false });
    expect(caretOnFirstLine(at(d, 4))).toBe(true);
    expect(caretOnFirstLine(at(d, 7))).toBe(false);
    expect(dictationAt(d)).toBe(8);
  });

  it('segments: text and chips, newlines in the text, the live dictation never read', () => {
    const d = doc('why\n', paste, ' this', { dict: 'and the words he says' }, '?');
    expect(segmentsOf(d)).toEqual<Segment[]>([
      { kind: 'text', text: 'why\n' },
      { kind: 'chip', chip: paste },
      { kind: 'text', text: ' this?' },
    ]);
    expect(isBlank(doc({ dict: 'only words said' }))).toBe(true);
    expect(isBlank(doc(' \n', img))).toBe(false);
    expect(chipsOf(d)).toEqual([paste]);
  });

  it('docOf and segmentsOf go both ways (a draft comes back as it was)', () => {
    const segs: Segment[] = [{ kind: 'text', text: 'line 1\n\nline 3 ' }, { kind: 'chip', chip: img }, { kind: 'text', text: ' ça 👍' }];
    expect(segmentsOf(docOf(schema, segs))).toEqual(segs);
    expect(plainText(docOf(schema, []))).toBe('');
  });

  it('applyOp: replaces an offset range with text (newlines as breaks), the caret where the op says', () => {
    const s = at(doc('- a', img, 'b'), 3);
    const tr = applyOp(s, { from: 3, to: 3, insert: '\n- ', caret: 6 });
    expect(tr).not.toBeNull();
    const next = s.apply(tr!); // eslint-disable-line @typescript-eslint/no-non-null-assertion -- asserted above
    expect(plainText(next.doc)).toBe(`- a\n- ${OBJ}b`);
    expect(beforeCaret(next)).toEqual({ text: '- ', messageStart: false });
    expect(applyOp(s, { from: 2, to: 99, insert: '', caret: 2 })).toBeNull();
  });

  it('insertText, insertChip and selectRange keep the offsets', () => {
    let s = at(doc('ab'), 1);
    s = s.apply(insertText(s, 'x\ny'));
    expect(plainText(s.doc)).toBe('ax\nyb');
    expect(beforeCaret(s)?.text).toBe('y');
    s = s.apply(insertChip(s, paste));
    expect(plainText(s.doc)).toBe(`ax\ny${OBJ}b`);
    expect(beforeCaret(s)).toEqual({ text: '', messageStart: false });
    const sel = selectRange(s, 0, 2);
    expect(sel?.selection.from).toBe(1);
    expect(sel?.selection.to).toBe(3);
  });
});
