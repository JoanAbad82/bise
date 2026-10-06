// The composer's live markdown keys (the TUI's mdlive.rs, BISE-276) and its subword moves
// (editor.rs), pure over the field's plain text (a chip is one U+FFFC, a line break '\n') and a
// caret offset in it. Each returns an edit as one replace op the editor applies (edit.ts), so a
// key changes only the chars it must:
//   - in a ``` block, ⏎ is a newline (you never send half a block) and a newline keeps the line's
//     indentation; close the block with ``` to send;
//   - a newline (⇧⏎) on a list item continues it (`- `, `* `, `+ `, `1. `, `- [ ] `; numbers count
//     up); on an empty item it steps out a level, or ends the list at the top;
//   - tab on a list item indents it one level (under the item above: its marker's width);
//     backspace at the start of an item's text outdents it, at the top level the bullet goes;
//   - ctrl+⌥←/→ move by subword (camelCase, snake_case, kebab-case, digits), ctrl+⌥⌫/⌦ delete one.

/** Replace [from, to) by `insert`, then the caret at `caret` (offsets in the text before the op). */
export interface Op {
  readonly from: number;
  readonly to: number;
  readonly insert: string;
  /** the caret after the op, as an offset in the new text */
  readonly caret: number;
}

type Kind = 'prose' | 'code' | 'fence';

interface LineAt {
  readonly k: number;
  /** the line's first offset */
  readonly at: number;
  readonly line: string;
  readonly kind: Kind;
}

const FENCE = /^\s*(```|~~~)/u;

function lineAt(text: string, cursor: number): LineAt {
  const lines = text.split('\n');
  let at = 0;
  let open = false;
  for (let k = 0; k < lines.length; k += 1) {
    const line = lines[k] ?? '';
    const fence = FENCE.test(line);
    if (cursor <= at + line.length || k === lines.length - 1) {
      return { k, at, line, kind: fence ? 'fence' : open ? 'code' : 'prose' };
    }
    if (fence) open = !open;
    at += line.length + 1;
  }
  return { k: 0, at: 0, line: '', kind: 'prose' };
}

/** A list item: its indentation, its marker's end and where its text starts. */
export interface Item {
  readonly indent: number;
  readonly num: number | null;
  readonly bullet: string;
  readonly markerEnd: number;
  readonly check: boolean | null;
  readonly content: number;
}

export function item(line: string): Item | null {
  const m = /^([ \t]*)([-*+]|(\d{1,9})([.)])) (\[([ xX])\] )?/u.exec(line);
  if (m === null) return null;
  const indent = (m[1] ?? '').length;
  const num = m[3] === undefined ? null : Number(m[3]);
  const bullet = num === null ? (m[2] ?? '-') : (m[4] ?? '.');
  const markerEnd = indent + (m[2] ?? '').length + 1;
  const check = m[5] === undefined ? null : m[6] !== ' ';
  return { indent, num, bullet, markerEnd, check, content: m[0].length };
}

const nextMarker = (it: Item): string =>
  `${' '.repeat(it.indent)}${it.num === null ? it.bullet : `${String(it.num + 1)}${it.bullet}`} ${it.check === null ? '' : '[ ] '}`;

/** ⏎ makes a newline here (in a code block) instead of sending. */
export function enterMakesNewline(text: string, cursor: number): boolean {
  return lineAt(text, cursor).kind === 'code';
}

/** The nearest item above line k in its list (no blank line or fence between) with indent < max. */
function parentIndent(lines: readonly string[], k: number, max: number): number {
  for (let i = k - 1; i >= 0; i -= 1) {
    const l = lines[i] ?? '';
    if (l.trim() === '' || FENCE.test(l)) break;
    const it = item(l);
    if (it !== null && it.indent < max) return it.indent;
  }
  return 0;
}

/** A newline (⇧⏎, or ⏎ in a code block) with markdown's help, or null for a plain newline. */
export function newline(text: string, cursor: number): Op | null {
  const l = lineAt(text, cursor);
  const col = cursor - l.at;
  if (l.kind === 'code') {
    const ws = /^[ \t]*/u.exec(l.line.slice(0, col))?.[0] ?? '';
    return { from: cursor, to: cursor, insert: `\n${ws}`, caret: cursor + 1 + ws.length };
  }
  if (l.kind !== 'prose') return null;
  const it = item(l.line);
  if (it === null || col < it.content) return null;
  if (l.line.slice(it.content).trim() === '') {
    // an empty item: one level out, or the end of the list
    if (it.indent > 0) {
      const to = parentIndent(text.split('\n'), l.k, it.indent);
      return { from: l.at, to: l.at + it.indent, insert: ' '.repeat(to), caret: l.at + l.line.length - it.indent + to };
    }
    return { from: l.at, to: l.at + l.line.length, insert: '', caret: l.at };
  }
  const marker = nextMarker(it);
  return { from: cursor, to: cursor, insert: `\n${marker}`, caret: cursor + 1 + marker.length };
}

/** Tab on a list item: one level in (the marker's width of the item above at the same level). */
export function indent(text: string, cursor: number): Op | null {
  const l = lineAt(text, cursor);
  if (l.kind !== 'prose') return null;
  const it = item(l.line);
  if (it === null) return null;
  const lines = text.split('\n');
  let unit = it.markerEnd - it.indent;
  for (let i = l.k - 1; i >= 0; i -= 1) {
    const p = item(lines[i] ?? '');
    if (p === null || (lines[i] ?? '').trim() === '') break;
    if (p.indent === it.indent) {
      unit = p.markerEnd - p.indent;
      break;
    }
    if (p.indent < it.indent) break;
  }
  return { from: l.at, to: l.at, insert: ' '.repeat(unit), caret: cursor + unit };
}

/** Backspace at the start of an item's text: one level out; at the top level the marker goes. */
export function outdentAtStart(text: string, cursor: number): Op | null {
  const l = lineAt(text, cursor);
  if (l.kind !== 'prose') return null;
  const it = item(l.line);
  if (it === null || cursor - l.at !== it.content) return null;
  if (it.indent > 0) {
    const to = parentIndent(text.split('\n'), l.k, it.indent);
    return { from: l.at, to: l.at + it.indent, insert: ' '.repeat(to), caret: cursor - it.indent + to };
  }
  return { from: l.at, to: l.at + it.content, insert: '', caret: l.at };
}

// ---- subwords (editor.rs) ----

type Sub = 'upper' | 'lower' | 'digit' | null;

const subClass = (c: string): Sub => (/\p{N}/u.test(c) ? 'digit' : /\p{Lu}/u.test(c) ? 'upper' : /\p{L}/u.test(c) ? 'lower' : null);

function boundary(cs: readonly Sub[], i: number): boolean {
  const p = cs[i - 1] ?? null;
  const c = cs[i] ?? null;
  if (p === null || c === null) return true;
  if (p === 'lower' && c === 'upper') return true;
  if ((p === 'digit') !== (c === 'digit')) return true;
  if (p === 'upper' && c === 'upper') return (cs[i + 1] ?? null) === 'lower';
  return false;
}

/** The start of the subword before `cursor` (UTF-16 offsets; one code point per step). */
export function subwordLeft(text: string, cursor: number): number {
  const cps = Array.from(text);
  const offs: number[] = [];
  let o = 0;
  for (const c of cps) {
    offs.push(o);
    o += c.length;
  }
  const cs = cps.map(subClass);
  let i = offs.findIndex((x) => x >= cursor);
  if (i < 0) i = cps.length;
  while (i > 0) {
    i -= 1;
    if (cs[i] !== null && (i === 0 || boundary(cs, i))) return offs[i] ?? 0;
  }
  return 0;
}

/** The end of the subword after `cursor`. */
export function subwordRight(text: string, cursor: number): number {
  const cps = Array.from(text);
  const offs: number[] = [];
  let o = 0;
  for (const c of cps) {
    offs.push(o);
    o += c.length;
  }
  const cs = cps.map(subClass);
  let i = offs.findIndex((x) => x >= cursor);
  if (i < 0) i = cps.length;
  while (i < cps.length) {
    i += 1;
    if (cs[i - 1] !== null && (i === cps.length || boundary(cs, i))) break;
  }
  return i < cps.length ? (offs[i] ?? text.length) : text.length;
}

/** What ctrl+z says when the field has nothing left to undo (sb.rs NO_UNDO). */
export const NO_UNDO = 'no undo: an agent may already have acted. say the change to main instead ("no, v1 for docs").';
