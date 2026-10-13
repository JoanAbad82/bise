// The one bridge between the ProseMirror field and the composer's plain-text logic (mdlive, tokens,
// pick, dictate, message.ts). Pure over a document and a state: no view, no DOM.
//
// The field is ONE paragraph of inline nodes (schema.ts): text, `hardBreak` (a newline), `chip`
// (an image, a long paste, a quote, an artifact) and `dictation` (the live words while he talks,
// never part of the message). Its plain text is the old engine's: a newline is '\n', a chip one
// U+FFFC, and a place in it is a UTF-16 offset, so every pure module keeps its offsets. Each of
// those nodes is one position wide in ProseMirror, so an offset is a position minus one (the
// paragraph's opening). The dictation node is one position too, read as U+FFFC: it holds the place
// where his words will go, and nothing reads its words.
import { Fragment, type Node as PmNode, type NodeType, type Schema } from '@tiptap/pm/model';
import { TextSelection, type EditorState, type Transaction } from '@tiptap/pm/state';
import type { Chip, Segment } from '../message';
import { tidy } from '../entry';

/** A node type of the field's schema (schema.ts names them all; a missing one is a bug). */
export function nodeType(schema: Schema, name: 'doc' | 'paragraph' | 'hardBreak' | 'chip' | 'dictation'): NodeType {
  const t = schema.nodes[name];
  if (t === undefined) throw new Error(`composer schema: no ${name} node`);
  return t;
}

/** The object replacement char: a chip (or the dictation) in the plain text. */
export const OBJ = '\uFFFC';

/** A plain-text offset's position, and back. */
export const posOf = (offset: number): number => offset + 1;
export const offsetOf = (pos: number): number => Math.max(0, pos - 1);

/** The field's paragraph (the doc's only child). */
const para = (doc: PmNode): PmNode | null => doc.firstChild;

/** The plain text: a newline '\n', a chip or the dictation one U+FFFC. */
export function plainText(doc: PmNode): string {
  const p = para(doc);
  if (p === null) return '';
  let out = '';
  p.forEach((n) => {
    out += n.isText ? (n.text ?? '') : n.type.name === 'hardBreak' ? '\n' : OBJ;
  });
  return out;
}

/** The message's content: text and chips, a newline '\n', the live dictation left out. */
export function segmentsOf(doc: PmNode): Segment[] {
  const out: Segment[] = [];
  doc.firstChild?.forEach((n) => {
    if (n.isText) out.push({ kind: 'text', text: n.text ?? '' });
    else if (n.type.name === 'hardBreak') out.push({ kind: 'text', text: '\n' });
    else if (n.type.name === 'chip') out.push({ kind: 'chip', chip: n.attrs.chip as Chip });
  });
  return tidy(out);
}

/** Text as inline nodes: lines as text nodes, newlines as hard breaks. */
export function inlineOf(schema: Schema, text: string): PmNode[] {
  const out: PmNode[] = [];
  text.split('\n').forEach((line, i) => {
    if (i > 0) out.push(nodeType(schema, 'hardBreak').create());
    if (line !== '') out.push(schema.text(line));
  });
  return out;
}

/** The document for these segments (a saved draft, a history entry). */
export function docOf(schema: Schema, segs: readonly Segment[]): PmNode {
  const kids: PmNode[] = [];
  for (const s of segs) {
    if (s.kind === 'chip') kids.push(nodeType(schema, 'chip').create({ chip: s.chip }));
    else kids.push(...inlineOf(schema, s.text));
  }
  return nodeType(schema, 'doc').create(null, nodeType(schema, 'paragraph').create(null, kids));
}

/** Nothing to send: no words, no chip (the dictation alone is nothing). */
export const isBlank = (doc: PmNode): boolean => segmentsOf(doc).every((s) => s.kind === 'text' && s.text.trim() === '');

/** The caret's offset when the selection is a caret, else null. */
export function caretOf(state: EditorState): number | null {
  const s = state.selection;
  return s.empty ? offsetOf(s.head) : null;
}

/** The caret's offset, a selection's head too (dictation starts there). */
export const headOf = (state: EditorState): number => offsetOf(state.selection.head);

export interface Before {
  /** The caret's line up to the caret (a newline or a chip starts a line here). */
  readonly text: string;
  /** Nothing precedes that line in the message: `/` may open the command list. */
  readonly messageStart: boolean;
}

/** The text before a caret, back to the last newline or chip; null with a selection. */
export function beforeCaret(state: EditorState): Before | null {
  const at = caretOf(state);
  if (at === null) return null;
  const all = plainText(state.doc).slice(0, at);
  const cut = Math.max(all.lastIndexOf('\n'), all.lastIndexOf(OBJ));
  return { text: all.slice(cut + 1), messageStart: cut < 0 };
}

/** The caret is on the first line (↑ there goes back through the history). */
export function caretOnFirstLine(state: EditorState): boolean {
  const at = caretOf(state);
  return at !== null && !plainText(state.doc).slice(0, at).includes('\n');
}

/** Replace [from, to) (offsets) by `text`, the caret at `caret` (an offset in the new text). */
export function applyOp(state: EditorState, op: { from: number; to: number; insert: string; caret: number }): Transaction | null {
  const size = plainText(state.doc).length;
  if (op.from < 0 || op.to > size || op.from > op.to) return null;
  const tr = state.tr.replaceWith(posOf(op.from), posOf(op.to), Fragment.fromArray(inlineOf(state.schema, op.insert)));
  const caret = Math.min(op.caret, plainText(tr.doc).length);
  return tr.setSelection(TextSelection.create(tr.doc, posOf(caret)));
}

/** A selection over [from, to) (offsets). */
export function selectRange(state: EditorState, from: number, to: number): Transaction | null {
  const size = plainText(state.doc).length;
  if (from < 0 || to > size) return null;
  return state.tr.setSelection(TextSelection.create(state.doc, posOf(from), posOf(to)));
}

/** Text in place of the selection (a pick, a paste, a dictated sentence), newlines as breaks. */
export function insertText(state: EditorState, text: string): Transaction {
  const { from, to } = state.selection;
  const tr = state.tr.replaceWith(from, to, Fragment.fromArray(inlineOf(state.schema, text)));
  const end = from + text.length;
  return tr.setSelection(TextSelection.create(tr.doc, end));
}

/** A chip in place of the selection, the caret after it. */
export function insertChip(state: EditorState, chip: Chip): Transaction {
  const { from, to } = state.selection;
  const tr = state.tr.replaceWith(from, to, nodeType(state.schema, 'chip').create({ chip }));
  return tr.setSelection(TextSelection.create(tr.doc, from + 1));
}

/** The chips in the field, in order. */
export const chipsOf = (doc: PmNode): Chip[] => segmentsOf(doc).flatMap((s) => (s.kind === 'chip' ? [s.chip] : []));

/** The dictation node's offset (the first, or that take's), or null when he isn't dictating. */
export function dictationAt(doc: PmNode, id?: string): number | null {
  let at: number | null = null;
  let off = 0;
  doc.firstChild?.forEach((n) => {
    if (at === null && n.type.name === 'dictation' && (id === undefined || n.attrs.id === id)) at = off;
    off += n.isText ? (n.text ?? '').length : 1;
  });
  return at;
}
