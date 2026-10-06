// The composer's few writes, each one a deliberate edit he asked for (a pick, a paste, a chip, a
// dictated sentence), never a re-render of his text: Lexical applies each as a small change to the
// nodes that differ. Every function runs inside editor.update (the `$` prefix).
import {
  $createLineBreakNode,
  $createRangeSelection,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isLineBreakNode,
  $isRangeSelection,
  $isTextNode,
  $setSelection,
  type LexicalNode,
} from 'lexical';
import { $createChipNode } from './ChipNode';
import type { Chip } from './message';

/** Text as Lexical nodes: lines as text nodes, newlines as line breaks. */
function textNodes(text: string): LexicalNode[] {
  const out: LexicalNode[] = [];
  text.split('\n').forEach((line, i) => {
    if (i > 0) out.push($createLineBreakNode());
    if (line !== '') out.push($createTextNode(line));
  });
  return out;
}

/** Replace the `count` characters before the caret with `text` (a picker's pick). */
export function $replaceBeforeCaret(count: number, text: string): void {
  const sel = $getSelection();
  if (!$isRangeSelection(sel)) return;
  if (!sel.isCollapsed()) sel.removeText();
  for (let i = 0; i < count; i += 1) sel.deleteCharacter(true);
  sel.insertText(text);
}

/** Insert text at the caret (replacing a selection), newlines as line breaks. */
export function $insertAtCaret(text: string): void {
  const sel = $getSelection();
  if (!$isRangeSelection(sel)) {
    $getRoot().selectEnd();
  }
  const s = $getSelection();
  if ($isRangeSelection(s)) s.insertNodes(textNodes(text));
}

/** Insert a chip at the caret (replacing a selection), the caret after it. */
export function $insertChip(chip: Chip): void {
  let sel = $getSelection();
  if (!$isRangeSelection(sel)) {
    $getRoot().selectEnd();
    sel = $getSelection();
  }
  if (!$isRangeSelection(sel)) return;
  const node = $createChipNode(chip);
  sel.insertNodes([node]);
  node.selectNext();
}

// ---- offsets: a place in the message as one number (a chip and a newline count as one) ----

/** The node's length in offset units. */
const unitLength = (n: LexicalNode): number =>
  $isTextNode(n) ? n.getTextContentSize() : $isElementNode(n) ? n.getChildren().reduce((a, c) => a + unitLength(c), 0) : 1;

/** The caret's offset from the message's start (its anchor), or null without a range selection. */
export function $caretOffset(): number | null {
  const sel = $getSelection();
  if (!$isRangeSelection(sel)) return null;
  const a = sel.anchor;
  const target = a.getNode();
  let off = 0;
  let found: number | null = null;
  const paras = $getRoot().getChildren();
  paras.forEach((p, pi) => {
    if (found !== null) return;
    if (pi > 0) off += 1;
    if (!$isElementNode(p)) return;
    if (p.is(target) && a.type === 'element') {
      found = off + p.getChildren().slice(0, a.offset).reduce((s, c) => s + unitLength(c), 0);
      return;
    }
    for (const c of p.getChildren()) {
      if (c.is(target)) {
        found = off + (a.type === 'text' ? a.offset : 0);
        return;
      }
      off += unitLength(c);
    }
  });
  return found;
}

/** A selection over [from, to) in offset units; only inside one paragraph (the composer has one). */
export function $selectRange(from: number, to: number): boolean {
  const para = $getRoot().getFirstChild();
  if (!$isElementNode(para)) return false;
  const point = (at: number): { key: string; offset: number; type: 'text' | 'element' } | null => {
    let off = 0;
    const kids = para.getChildren();
    for (let i = 0; i < kids.length; i += 1) {
      const c = kids[i];
      if (c === undefined) break;
      const len = unitLength(c);
      if ($isTextNode(c) && at >= off && at <= off + len) return { key: c.getKey(), offset: at - off, type: 'text' };
      if (at === off) return { key: para.getKey(), offset: i, type: 'element' };
      off += len;
    }
    return at === off ? { key: para.getKey(), offset: kids.length, type: 'element' } : null;
  };
  const a = point(from);
  const f = point(to);
  if (a === null || f === null) return false;
  const sel = $createRangeSelection();
  sel.anchor.set(a.key, a.offset, a.type);
  sel.focus.set(f.key, f.offset, f.type);
  $setSelection(sel);
  return true;
}

/** Whether a node is a line break (the composer's newline). */
export const $isNewline = (n: LexicalNode | null): boolean => $isLineBreakNode(n);
