// Reading the editor, never writing it: the content as segments (message.ts builds the send
// from them) and the text before the caret (tokens.ts finds a picker's trigger in it). Every
// function here runs inside editor.read / editorState.read (the `$` prefix).
import { $getRoot, $getSelection, $isElementNode, $isLineBreakNode, $isRangeSelection, $isTextNode, type LexicalNode } from 'lexical';
import { $isChipNode } from './ChipNode';
import type { Segment } from './message';

/** The content as text and chips, paragraphs and line breaks as newlines. */
export function $readSegments(): Segment[] {
  const out: Segment[] = [];
  let text = '';
  const flush = (): void => {
    if (text !== '') out.push({ kind: 'text', text });
    text = '';
  };
  const visit = (n: LexicalNode): void => {
    if ($isChipNode(n)) {
      flush();
      out.push({ kind: 'chip', chip: n.getChip() });
    } else if ($isLineBreakNode(n)) {
      text += '\n';
    } else if ($isTextNode(n)) {
      text += n.getTextContent();
    } else if ($isElementNode(n)) {
      n.getChildren().forEach(visit);
    }
  };
  $getRoot()
    .getChildren()
    .forEach((p, i) => {
      if (i > 0) text += '\n';
      visit(p);
    });
  flush();
  return out;
}

export interface Before {
  /** The caret's line up to the caret (a line break or a chip starts a line here). */
  readonly text: string;
  /** Nothing precedes that line in the message: `/` may open the command list. */
  readonly messageStart: boolean;
}

/** The text before a collapsed caret in a text node, or null (a selection, a caret on a chip). */
export function $textBeforeCaret(): Before | null {
  const sel = $getSelection();
  if (!$isRangeSelection(sel) || !sel.isCollapsed()) return null;
  const anchor = sel.anchor.getNode();
  if (!$isTextNode(anchor)) return null;
  let text = anchor.getTextContent().slice(0, sel.anchor.offset);
  let prev = anchor.getPreviousSibling();
  while ($isTextNode(prev)) {
    text = prev.getTextContent() + text;
    prev = prev.getPreviousSibling();
  }
  const para = anchor.getParent();
  const messageStart = prev === null && para !== null && para.getPreviousSibling() === null;
  return { text, messageStart };
}

/** The editor holds nothing: no text, no chip. */
export function $isBlank(): boolean {
  return $getRoot().getTextContent().trim() === '' && !$readSegments().some((s) => s.kind === 'chip');
}

/** The caret is on the first line (↑ there leaves the field's text for the drafts). */
export function $caretOnFirstLine(): boolean {
  const sel = $getSelection();
  if (!$isRangeSelection(sel) || !sel.isCollapsed()) return false;
  const node = sel.anchor.getNode();
  const para = $isElementNode(node) ? node : node.getParent();
  if (para === null || para.getPreviousSibling() !== null) return false;
  let prev: LexicalNode | null = $isElementNode(node) ? null : node.getPreviousSibling();
  while (prev !== null) {
    if ($isLineBreakNode(prev)) return false;
    prev = prev.getPreviousSibling();
  }
  return true;
}

/** The first paragraph as plain text with the caret's offset in it (mdlive.ts reads this): a line
 * break is '\n', a chip one U+FFFC; the same offsets as edit.ts's $caretOffset / $selectRange. */
export function $plainText(): string {
  const para = $getRoot().getFirstChild();
  if (!$isElementNode(para)) return '';
  return para
    .getChildren()
    .map((c) => ($isChipNode(c) ? '\uFFFC' : $isLineBreakNode(c) ? '\n' : $isTextNode(c) ? c.getTextContent() : '\uFFFC'))
    .join('');
}
