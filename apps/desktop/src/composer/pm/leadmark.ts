// The leading `@name` in the accent, 600, while his words go to that agent (at-start, designer
// m_34049): the screen says which agent (thread/lead.ts), the field draws its address at the start
// as an inline decoration, never a mark (the document, the send and the undo history stay as
// typed). Plain again the moment the screen says none. Pure but for the plugin.
import { Extension } from '@tiptap/core';
import type { Node as PmNode } from '@tiptap/pm/model';
import { Plugin, PluginKey, type EditorState, type Transaction } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { plainText, posOf } from './pmtext';

export const LEAD_STYLE = 'color: var(--c-accent); font-weight: 600';

/** Where `@name` opens `text` (after spaces), as [from, to) offsets; null when it doesn't. Pure. */
export function leadRange(text: string, name: string): readonly [number, number] | null {
  const from = text.length - text.trimStart().length;
  const at = `@${name}`;
  if (!text.startsWith(at, from)) return null;
  const next = text[from + at.length];
  return next === undefined || /\s/u.test(next) ? [from, from + at.length] : null;
}

interface LeadState {
  readonly name: string | null;
  readonly set: DecorationSet;
}

const KEY = new PluginKey<LeadState>('bise-lead');

function draw(doc: PmNode, name: string | null): DecorationSet {
  const r = name === null ? null : leadRange(plainText(doc), name);
  if (r === null) return DecorationSet.empty;
  return DecorationSet.create(doc, [Decoration.inline(posOf(r[0]), posOf(r[1]), { style: LEAD_STYLE, 'data-lead': 'true' })]);
}

/** The transaction that tells the field which agent his words now go to (null: none). */
export function setLead(state: EditorState, name: string | null): Transaction | null {
  if ((KEY.getState(state)?.name ?? null) === name) return null;
  return state.tr.setMeta(KEY, name).setMeta('addToHistory', false);
}

export const LeadMark = Extension.create({
  name: 'biseLead',
  addProseMirrorPlugins: () => [
    new Plugin<LeadState>({
      key: KEY,
      state: {
        init: () => ({ name: null, set: DecorationSet.empty }),
        apply: (tr, old, _before, state) => {
          const meta = tr.getMeta(KEY) as string | null | undefined;
          const name = meta === undefined ? old.name : meta;
          if (meta === undefined && !tr.docChanged) return old;
          return { name, set: draw(state.doc, name) };
        },
      },
      props: {
        decorations: (state) => KEY.getState(state)?.set,
      },
    }),
  ],
});
