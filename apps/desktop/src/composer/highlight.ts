// Live markdown colors in the field (B9/W8): mdcolor.ts says each line's runs, this draws them as
// styled Lexical text nodes. It touches only a run of text whose colors changed (the line he types,
// or the lines a ``` he just typed opened or closed); every other node stays the same node (bar ⛔1:
// no node replaced outside the line he types). Never during an accent or IME composition (the
// composer skips the pass then). Runs inside editor.read / editor.update (the `$` prefix).
import { $createRangeSelection, $createTextNode, $getRoot, $getSelection, $isElementNode, $isLineBreakNode, $isRangeSelection, $isTextNode, $setSelection, type ElementNode, type LexicalNode, type PointType, type TextNode } from 'lexical';
import { colorLines, COLOR_STYLE as STYLE, type Cls } from './mdcolor';

interface Piece {
  readonly text: string;
  readonly style: string;
}

/** A run of text nodes between line breaks and chips, and where it starts in its line. */
interface TextRun {
  readonly line: number;
  readonly col: number;
  readonly nodes: readonly TextNode[];
}

const unit = (n: LexicalNode): number => ($isTextNode(n) ? n.getTextContentSize() : 1);

function runsOf(para: ElementNode): { text: string; runs: TextRun[] } {
  let text = '';
  let line = 0;
  let col = 0;
  const runs: TextRun[] = [];
  let cur: TextNode[] = [];
  let curCol = 0;
  const flush = (): void => {
    if (cur.length > 0) runs.push({ line, col: curCol, nodes: cur });
    cur = [];
  };
  for (const n of para.getChildren()) {
    if ($isLineBreakNode(n)) {
      flush();
      text += '\n';
      line += 1;
      col = 0;
    } else if ($isTextNode(n)) {
      if (cur.length === 0) curCol = col;
      cur.push(n);
      text += n.getTextContent();
      col += n.getTextContentSize();
    } else {
      flush();
      text += '\uFFFC';
      col += 1;
    }
  }
  flush();
  return { text, runs };
}

/** The pieces a run should be: its slice of the line's runs, adjacent same styles merged. */
function wanted(lineRuns: readonly { text: string; cls: Cls | null }[], from: number, to: number): Piece[] {
  const out: Piece[] = [];
  let at = 0;
  for (const r of lineRuns) {
    const a = Math.max(from, at);
    const b = Math.min(to, at + r.text.length);
    if (a < b) {
      const text = r.text.slice(a - at, b - at);
      const style = r.cls === null ? '' : STYLE[r.cls];
      const last = out[out.length - 1];
      if (last !== undefined && last.style === style) out[out.length - 1] = { text: last.text + text, style };
      else out.push({ text, style });
    }
    at += r.text.length;
  }
  return out;
}

const same = (nodes: readonly TextNode[], pieces: readonly Piece[]): boolean =>
  nodes.length === pieces.length && nodes.every((n, i) => n.getTextContent() === pieces[i]?.text && n.getStyle() === pieces[i].style);

/** A point's offset in the paragraph (a chip and a line break count as one). */
function offsetOf(para: ElementNode, p: PointType): number | null {
  let off = 0;
  const kids = para.getChildren();
  if (p.type === 'element' && p.getNode().is(para)) return kids.slice(0, p.offset).reduce((s, c) => s + unit(c), 0);
  for (const c of kids) {
    if (c.is(p.getNode())) return off + (p.type === 'text' ? p.offset : 0);
    off += unit(c);
  }
  return null;
}

/** The point at an offset in the paragraph, inside a text node when one holds it. */
function pointAt(para: ElementNode, at: number): { key: string; offset: number; type: 'text' | 'element' } {
  let off = 0;
  const kids = para.getChildren();
  for (let i = 0; i < kids.length; i += 1) {
    const c = kids[i];
    if (c === undefined) break;
    const len = unit(c);
    if ($isTextNode(c) && at >= off && at <= off + len) return { key: c.getKey(), offset: at - off, type: 'text' };
    if (at === off) return { key: para.getKey(), offset: i, type: 'element' };
    off += len;
  }
  return { key: para.getKey(), offset: kids.length, type: 'element' };
}

/** The colors are already right (no write needed). */
export function $colorsUpToDate(): boolean {
  const para = $getRoot().getFirstChild();
  if (!$isElementNode(para)) return true;
  const { text, runs } = runsOf(para);
  const lines = colorLines(text);
  return runs.every((r) => {
    const len = r.nodes.reduce((s, n) => s + n.getTextContentSize(), 0);
    return same(r.nodes, wanted(lines[r.line] ?? [], r.col, r.col + len));
  });
}

/** Redraw the runs whose colors changed; the selection stays where it was. */
export function $recolor(): void {
  const para = $getRoot().getFirstChild();
  if (!$isElementNode(para)) return;
  const sel = $getSelection();
  const keep = $isRangeSelection(sel) ? { a: offsetOf(para, sel.anchor), f: offsetOf(para, sel.focus) } : null;
  const { text, runs } = runsOf(para);
  const lines = colorLines(text);
  let changed = false;
  for (const r of runs) {
    const len = r.nodes.reduce((s, n) => s + n.getTextContentSize(), 0);
    const pieces = wanted(lines[r.line] ?? [], r.col, r.col + len);
    if (same(r.nodes, pieces)) continue;
    changed = true;
    const first = r.nodes[0];
    if (first === undefined) continue;
    // the new nodes go where the run was, the old ones leave
    let anchor: LexicalNode = first;
    pieces.forEach((p, i) => {
      const node = $createStyledText(p);
      if (i === 0) first.insertBefore(node);
      else anchor.insertAfter(node);
      anchor = node;
    });
    for (const n of r.nodes) n.remove();
  }
  if (!changed || keep === null || keep.a === null || keep.f === null) return;
  const s = $createRangeSelection();
  const a = pointAt(para, keep.a);
  const f = pointAt(para, keep.f);
  s.anchor.set(a.key, a.offset, a.type);
  s.focus.set(f.key, f.offset, f.type);
  $setSelection(s);
}

function $createStyledText(p: Piece): TextNode {
  const n = $createTextNode(p.text);
  if (p.style !== '') n.setStyle(p.style);
  return n;
}
