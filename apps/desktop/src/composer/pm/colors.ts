// Live markdown colors in the TipTap field (B9/W8): mdcolor.ts says each line's runs, drawn here as
// ProseMirror inline decorations, never marks: a color never changes the document, the send, the
// draft or the undo history. ProseMirror redraws only the text whose decorations changed (the line
// he types, or the lines a ``` he just typed opened or closed). While an accent or an IME word is
// being composed the old colors are only mapped: nothing is redrawn under the composition.
import { Extension } from '@tiptap/core';
import type { Node as PmNode } from '@tiptap/pm/model';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { colorLines, COLOR_STYLE } from '../mdcolor';
import { OBJ, plainText, posOf } from './pmtext';

/** The colors of a field's doc: one inline decoration per colored run, cut at chips. */
export function colorDecorations(doc: PmNode): DecorationSet {
  const text = plainText(doc);
  const out: Decoration[] = [];
  let at = 0;
  for (const runs of colorLines(text)) {
    for (const r of runs) {
      const from = at;
      at += r.text.length;
      // a code run carries the bubble's own style (mdcolor codeLines); a prose run, its class's
      const style = r.css ?? (r.cls === null ? null : COLOR_STYLE[r.cls]);
      if (style === null) continue;
      // a chip (U+FFFC) inside a run keeps its own look: the run is cut around it
      let start = from;
      for (let i = from; i <= at; i += 1) {
        if (i === at || text[i] === OBJ) {
          if (i > start) out.push(Decoration.inline(posOf(start), posOf(i), { style }));
          start = i + 1;
        }
      }
    }
    at += 1; // the newline
  }
  return DecorationSet.create(doc, out);
}

const KEY = new PluginKey<DecorationSet>('bise-colors');

export const Colors = Extension.create({
  name: 'biseColors',
  addProseMirrorPlugins: () => [
    new Plugin<DecorationSet>({
      key: KEY,
      state: {
        init: (_, state) => colorDecorations(state.doc),
        apply: (tr, old, _before, state) => {
          if (!tr.docChanged) return old;
          if (tr.getMeta('composition') !== undefined) return old.map(tr.mapping, tr.doc);
          return colorDecorations(state.doc);
        },
      },
      props: {
        decorations: (state) => KEY.getState(state),
      },
    }),
  ],
});
