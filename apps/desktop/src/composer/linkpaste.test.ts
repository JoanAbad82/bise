// @vitest-environment happy-dom
// A URL pasted over selected words keeps them as its label (linkpaste.ts): the shared table the
// TUI reads too (paste_link.rs), then the field's paste (pm/paste.ts) on a real editor state.
import { describe, expect, it } from 'vitest';
import { getSchema } from '@tiptap/core';
import { EditorState, TextSelection, type Transaction } from '@tiptap/pm/state';
import { history, undo } from '@tiptap/pm/history';
import type { Node as PmNode } from '@tiptap/pm/model';
import { linkPaste } from './linkpaste';
import { pasteInto, type PasteCtx } from './pm/paste';
import { FIELD_NODES } from './pm/schema';
import { nodeType, plainText } from './pm/pmtext';
import type { Chip } from './message';
import CASES from '../../../../rust/proto/fixtures/paste_link.json';

describe('linkPaste (the shared table)', () => {
  it('gives [words](url) and the caret after the link, or null: the paste goes on as before', () => {
    for (const c of CASES) {
      const got = linkPaste(c.selected, c.pasted);
      if (c.text === null) expect(got, JSON.stringify(c)).toBeNull();
      else {
        expect(got?.text, JSON.stringify(c)).toBe(c.text);
        expect(got?.text.slice(0, got.caret), JSON.stringify(c)).toBe(c.caret_after);
      }
    }
  });
});

const schema = getSchema(FIELD_NODES);
const img: Chip = { kind: 'image', n: 1, path: '/tmp/x.png', name: 'x.png' };

/** A field holding `parts` (a chip as an object), the range [from, to) of its text selected. */
function field(parts: (string | Chip)[], from: number, to: number): { ctx: PasteCtx; get: () => EditorState } {
  const kids: PmNode[] = parts.map((p) => (typeof p === 'string' ? schema.text(p) : nodeType(schema, 'chip').create({ chip: p })));
  const doc = nodeType(schema, 'doc').create(null, nodeType(schema, 'paragraph').create(null, kids));
  let st = EditorState.create({ doc, plugins: [history()] });
  st = st.apply(st.tr.setSelection(TextSelection.create(doc, from + 1, to + 1)));
  const dispatch = (tr: Transaction | null): boolean => {
    if (tr !== null) st = st.apply(tr);
    return true;
  };
  return { ctx: { sources: () => ({}) as never, state: () => st, dispatch, view: () => null }, get: () => st };
}

const pasteEvent = (text: string): ClipboardEvent =>
  ({ clipboardData: { files: [], getData: () => text }, preventDefault: () => undefined }) as unknown as ClipboardEvent;

const view = (st: EditorState) => ({
  text: plainText(st.doc),
  from: st.selection.from - 1,
  to: st.selection.to - 1,
});

describe("the field's paste", () => {
  it('a URL over "docs": [docs](url), the caret after it; one undo gives "docs" back, selected', () => {
    const f = field(['read the docs now'], 9, 13);
    expect(pasteInto(f.ctx, pasteEvent('https://bise.dev/docs\n'))).toBe(true);
    const link = 'read the [docs](https://bise.dev/docs)';
    expect(view(f.get())).toEqual({ text: `${link} now`, from: link.length, to: link.length });
    undo(f.get(), f.ctx.dispatch);
    expect(view(f.get())).toEqual({ text: 'read the docs now', from: 9, to: 13 });
  });

  it('no selection, or not one URL over it: the text pasted as before', () => {
    const none = field(['see '], 4, 4);
    pasteInto(none.ctx, pasteEvent('https://bise.dev'));
    expect(view(none.get())).toEqual({ text: 'see https://bise.dev', from: 20, to: 20 });
    const words = field(['see this'], 4, 8);
    pasteInto(words.ctx, pasteEvent('that one'));
    expect(view(words.get()).text).toBe('see that one');
  });

  it('a chip in the selection: the URL replaces it, as before', () => {
    const f = field(['see ', img, ' it'], 4, 6);
    pasteInto(f.ctx, pasteEvent('https://bise.dev'));
    expect(view(f.get()).text).toBe('see https://bise.devit');
  });
});
