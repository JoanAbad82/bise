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
import { chipLabel, fileName, type Chip } from '../message';

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
    // the sent bubble's chip (designer m_18135, signed 900f998e): the 16 px thumbnail (else the
    // no-file glyph slot) and 'image 1' in ink; '[Image #1]' stays the copied text and the part's name
    el.title = c.name;
    el.append(c.thumb !== undefined ? thumbImg(c.thumb) : noFileGlyph());
    el.append(imageChipWords(c.n));
    return el;
  }
  if (c.kind === 'file') {
    // file-chips (designer m_21765): the image chip's look, the file's 16 px system icon where the
    // image has its thumbnail (▯ when there is none), and its name; '[File #2]' is the copied text
    el.title = c.path;
    el.append(c.icon !== undefined ? thumbImg(c.icon) : fileGlyph());
    el.append(fileName(c.path));
    return el;
  }
  el.append(chipLabel(c));
  return el;
}

/** A file chip's glyph slot when the system gives no icon: ▯, 16 px (the TUI's G_FILE). */
export function fileGlyph(): HTMLElement {
  const span = document.createElement('span');
  span.className = 'thumb file';
  span.setAttribute('aria-hidden', 'true');
  span.textContent = '▯';
  return span;
}

/** An image chip's words on the input side: 'image 1', as his sent bubble shows it. Pure. */
export const imageChipWords = (n: number): string => `image ${String(n)}`;

function thumbImg(src: string): HTMLElement {
  const img = document.createElement('img');
  img.className = 'thumb';
  img.src = src;
  img.alt = '';
  img.draggable = false;
  return img;
}

/** The no-file glyph slot of the thread's Thumb (rows-cards.tsx): a faint image outline, 16 px. */
function noFileGlyph(): HTMLElement {
  const span = document.createElement('span');
  span.className = 'thumb none';
  span.setAttribute('aria-hidden', 'true');
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  const shapes: [string, Record<string, string>][] = [
    ['rect', { x: '2.5', y: '3.5', width: '11', height: '9', rx: '1.5', fill: 'none', stroke: 'currentColor' }],
    ['circle', { cx: '6', cy: '6.5', r: '1', fill: 'currentColor' }],
    ['path', { d: 'M3 11.5l3.5-3 2.5 2 2-1.5 2.5 2', fill: 'none', stroke: 'currentColor' }],
  ];
  for (const [tag, attrs] of shapes) {
    const s = document.createElementNS(ns, tag);
    for (const [k, v] of Object.entries(attrs)) s.setAttribute(k, v);
    svg.append(s);
  }
  span.append(svg);
  return span;
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
