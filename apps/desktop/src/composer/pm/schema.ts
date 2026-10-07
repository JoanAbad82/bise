// The field's schema as TipTap extensions: one paragraph of inline nodes (pmtext.ts reads it).
//   - text, no marks: markdown stays characters (the wire is the TUI's text); its colors are
//     decorations, never marks, so a color never changes the document;
//   - hardBreak: a newline (⇧⏎, a pasted line) as one position, the old engine's line break;
//   - chip: an image, a long paste, a quote, an artifact; an inline atom, one caret step, one
//     backspace; its data (message.ts Chip) is the node's `chip` attribute;
//   - dictation: where his words go while he talks, showing them live; read by nothing (not the
//     send, not the draft), replaced by the words when the last ones come.
// The node views are plain DOM (no React portal), drawn once per node: typing never renders React.
import { Node } from '@tiptap/core';
import { chipLabel, type Chip } from '../message';

export const Doc = Node.create({ name: 'doc', topNode: true, content: 'paragraph' });

export const Paragraph = Node.create({
  name: 'paragraph',
  group: 'block',
  content: 'inline*',
  parseHTML: () => [{ tag: 'p' }],
  renderHTML: () => ['p', { class: 'p' }, 0],
});

export const Text = Node.create({ name: 'text', group: 'inline' });

export const HardBreak = Node.create({
  name: 'hardBreak',
  group: 'inline',
  inline: true,
  selectable: false,
  parseHTML: () => [{ tag: 'br' }],
  renderHTML: () => ['br'],
  renderText: () => '\n',
});

/** A chip's DOM, the old engine's (composer.chip.<n>, data-kind, the image's thumbnail). */
export function chipDom(c: Chip): HTMLElement {
  const el = document.createElement('span');
  el.className = `b-chip ${c.kind}`;
  el.dataset.testid = `composer.chip.${c.n}`;
  el.dataset.kind = c.kind;
  el.contentEditable = 'false';
  if (c.kind === 'image') {
    el.title = c.name;
    if (c.thumb !== undefined) {
      const img = document.createElement('img');
      img.className = 'thumb';
      img.src = c.thumb;
      img.alt = '';
      img.draggable = false;
      el.append(img);
    }
  }
  el.append(chipLabel(c));
  return el;
}

export const ChipNode = Node.create({
  name: 'chip',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: false,
  draggable: false,
  addAttributes: () => ({ chip: { default: null, rendered: false } }),
  renderHTML: ({ node }) => ['span', { class: 'b-chip' }, chipLabel(node.attrs.chip as Chip)],
  renderText: ({ node }) => chipLabel(node.attrs.chip as Chip),
  addNodeView: () => ({ node }) => ({ dom: chipDom(node.attrs.chip as Chip), ignoreMutation: () => true }),
});

/** The live words as the dictation node shows them: `lead` (a space after a word, dictate.ts
 *  dictated) then the words, or 'listening…' before the first. */
export const dictationLabel = (text: string, lead: string): string => (text.trim() === '' ? `${lead}listening…` : `${lead}${text.trim()}`);

export const DictationNode = Node.create({
  name: 'dictation',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: false,
  draggable: false,
  addAttributes: () => ({ text: { default: '', rendered: false }, lead: { default: '', rendered: false } }),
  renderHTML: () => ['span', { class: 'b-dictation' }],
  renderText: () => '',
  addNodeView:
    () =>
    ({ node }) => {
      const dom = document.createElement('span');
      dom.className = 'b-dictation';
      dom.dataset.testid = 'composer.dictation';
      dom.contentEditable = 'false';
      const dot = document.createElement('i');
      dot.setAttribute('aria-hidden', 'true');
      const words = document.createElement('span');
      words.className = 'w';
      words.textContent = dictationLabel(node.attrs.text as string, node.attrs.lead as string);
      dom.append(dot, words);
      return {
        dom,
        ignoreMutation: () => true,
        // a new partial changes only the words' text: the node's DOM stays the same node
        update: (next) => {
          if (next.type.name !== 'dictation') return false;
          const w = dictationLabel(next.attrs.text as string, next.attrs.lead as string);
          if (words.textContent !== w) words.textContent = w;
          return true;
        },
      };
    },
});

/** Every node of the field, in one list (the editor's and the tests' schema). */
export const FIELD_NODES = [Doc, Paragraph, Text, HardBreak, ChipNode, DictationNode];
